// Savings and Family pot lifecycle checks — fictional funds only.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function source(name){return fs.readFileSync(path.join(__dirname,'..',name),'utf8');}
function compile(name,deps={}){
 const js=ts.transpileModule(source(name),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};
 vm.runInNewContext(js,{module:mod,exports:mod.exports,structuredClone,localStorage:{removeItem(){}},
  require:(id)=>{if(!Object.hasOwn(deps,id))throw Error('unexpected '+id);return deps[id];}
 },{filename:name});return mod.exports;
}
const model=compile('src/family/model.ts');
const rules=compile('src/family/savings/savingsRules.ts',{'../model':model});
const family=model.createDemoState().families[0];
const g=family.goals.find(x=>x.id==='goal_vac'),owner=family.members.find(m=>m.id==='lamia');
assert.equal(rules.goalProgress(g),45);
assert.equal(rules.goalDisplayState(g,'2026-10-25').label,'En cours');
assert.equal(rules.deadlineState('2026-10-24','active','2026-10-25'),'overdue');
assert.equal(rules.deadlineState('2026-11-01','active','2026-10-25'),'soon');
assert.equal(rules.deadlineState('2027-11-01','active','2026-10-25'),'future');
assert.equal(rules.deadlineState('2026-10-24','closed','2026-10-25'),'closed');
assert.equal(rules.deadlineState('','active','2026-10-25'),'none');
assert.equal(rules.goalContributions(g).find(x=>x.memberId==='lamia').total,2500);
assert.equal(rules.goalContributions(g).find(x=>x.memberId==='karim').total,2000);
const initial=owner.simpleBalance;
g.scheduledAmount=150;g.scheduledFrequency='weekly';g.nextScheduledDate='2026-11-01';
assert(rules.closeSavingsGoal(family,g.id,'reached'));
assert.equal(owner.simpleBalance,initial+4500);
assert.equal(g.balance,4500,'Keep historical total/progress when settled');
assert.equal(g.status,'closed');
assert.equal(g.closedReason,'reached');
assert.equal(g.settledAmount,4500);
assert.equal(g.scheduledAmount,0);
assert.equal(g.scheduledFrequency,undefined);
assert.equal(g.nextScheduledDate,undefined);
assert.equal(g.history.filter(h=>h.kind==='settlement').length,1);
assert.equal(rules.goalDisplayState(g,'2026-10-25').available,0,'Historical total not still available');
assert.equal(rules.goalDisplayState(g,'2026-10-25').label,'Objectif atteint');
assert(!rules.closeSavingsGoal(family,g.id,'manual'),'Prevent second settlement');
assert.equal(owner.simpleBalance,initial+4500,'No double credit to owner');
assert.equal(g.history.filter(h=>h.kind==='settlement').length,1);
const yasmine=family.members.find(m=>m.id==='yasmine'),school=family.goals.find(x=>x.id==='goal_school');
const before=yasmine.simpleBalance;
assert(rules.closeSavingsGoal(family,school.id,'manual'));
assert.equal(yasmine.simpleBalance,before+2400);
assert.equal(school.closedReason,'manual');
assert.equal(school.settledAmount,2400);
assert.equal(rules.goalDisplayState(school,'2026-10-25').label,'Projet clôturé');
assert.equal(rules.goalContributions(school).find(x=>x.memberId==='lamia').total,1500);
assert(!rules.closeSavingsGoal(family,'missing','manual'));
// Historical closed goal from older demos: don't invent prior settlement.
const old=family.goals.find(x=>x.id==='goal_weekend');
old.status='closed';
assert.equal(rules.goalDisplayState(old,'2026-10-25').available,900);

// Pots have different lifecycle: never auto-transfer to organizer or contributors.
const pot=family.pots.find(x=>x.id==='pot1');
const allBalances=family.members.map(x=>x.simpleBalance);
assert.equal(rules.potContributions(pot).find(x=>x.memberId==='lamia').total,250);
pot.pendingInvites=['yasmine'];
assert(rules.closeFamilyPot(family,pot.id,'target'));
assert.equal(pot.closedReason,'target');
assert.equal(pot.pendingInvites.length,0);
assert.equal(pot.balance,400);
assert.equal(pot.status,'closed');
assert.equal(rules.potDisplayState(pot,'2026-10-25').label,'Collecte terminée · Objectif atteint');
assert(!rules.closeFamilyPot(family,pot.id,'manual'));
for(let i=0;i<family.members.length;i++)assert.equal(family.members[i].simpleBalance,allBalances[i]);
const pot2=family.pots.find(x=>x.id==='pot2');
assert(rules.closeFamilyPot(family,pot2.id,'manual'));
assert.equal(pot2.closedReason,'manual');
assert.equal(rules.potDisplayState(pot2,'2026-10-25').label,'Collecte clôturée');
const pot3=family.pots.find(x=>x.id==='pot3');
pot3.deadline='2026-10-01';
assert.equal(rules.potDisplayState(pot3,'2026-10-25').label,'Date cible dépassée');
assert.equal(rules.goalDisplayState({...old,status:'active',deadline:'2026-10-01'},'2026-10-25').label,'Échéance dépassée');

const ui=source('src/family/FamilyExperience.tsx');
assert(ui.includes("closeSavingsGoal(f,g.id,'reached')"),'Reached goal settles to owner');
assert(ui.includes("closeSavingsGoal(f,selectedGoal,'manual')"),'Manual close settles to owner');
assert(ui.includes("closeFamilyPot(f,p.id,'target')"),'Full pot closes without repayment');
assert(ui.includes("closeFamilyPot(f,selectedPot,'manual')"),'Manual pot closes without repayment');
assert(ui.includes("goalDisplayState(goal,nowDate())"),'Goal state is visible');
assert(ui.includes("potDisplayState(pot,nowDate())"),'Pot state is visible');
assert(ui.includes("potContributions(pot)"),'Members contribution breakdown visible');
assert(ui.includes("validatePocketDebit(family,data.viewerId,source,amount)"),
 'Pocket funding for a pot respects pocket transfer ceilings');
assert(ui.includes("h.kind==='settlement'?'Reversement au propriétaire'"),
 'Goal settlement must be legible in transaction history');

console.log('OK — échéances, contributeurs, reversement unique des objectifs et clôture distincte des cagnottes.');
