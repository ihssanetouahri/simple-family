// Follow-ups by profile and state: no push service and no financial data exposure.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function source(name){return fs.readFileSync(path.join(__dirname,'..',name),'utf8');}
function compile(name,deps={}){
 const output=ts.transpileModule(source(name),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
 }).outputText;
 const mod={exports:{}};
 vm.runInNewContext(output,{
  module:mod,exports:mod.exports,structuredClone,localStorage:{removeItem(){}},
  require:(id)=>{if(!Object.hasOwn(deps,id))throw Error('Import unexpected '+id);return deps[id];}
 },{filename:name});
 return mod.exports;
}
const model=compile('src/family/model.ts');
const permissions=compile('src/family/permissions.ts',{'./model':model});
const alerts=compile('src/family/alerts/followUps.ts',{'../model':model,'../permissions':permissions});
const date='2026-10-26';
const f=model.createDemoState().families[0];
const list=id=>alerts.getFamilyFollowUps(f,id,date);
const by=(id,kind)=>list(id).filter(e=>e.kind===kind);
assert.equal(alerts.daysFromToday('2026-10-25',date),-1);
assert.equal(alerts.daysFromToday('2026-10-26',date),0);
assert.equal(alerts.daysFromToday('2026-10-27',date),1);
assert.equal(alerts.daysFromToday('2026-11-25',date),30);
assert.equal(alerts.daysFromToday('2026-11-26',date),31);
assert.equal(alerts.daysFromToday('2026-02-30',date),null);
assert.equal(alerts.daysFromToday('not-a-date',date),null);

assert.equal(by('lamia','bill').length,1,'Leader sees unpaid bill');
assert.equal(by('lamia','family-invite').length,1);
assert.equal(by('karim','bill').length,1,'Co-leader sees family bill');
assert.equal(by('yasmine','bill').length,0,'Simple One cannot see admin-only bill');
assert.equal(by('yasmine','family-invite').length,0,'Simple One cannot see admin invitations');
assert.equal(list('stranger').length,0);
assert.equal(by('lamia','bill')[0].action.route,'pay-bill');
const bill=f.alerts[0];
bill.dueDate='2026-10-25';
assert.equal(by('lamia','bill')[0].badge,'En retard','Past bill cannot show J--1');
bill.resolved=true;
assert.equal(by('lamia','bill').length,0,'Paid bill disappears automatically');
bill.resolved=false;

f.jointApplication={requesterId:'lamia',coHolderId:'karim',status:'awaiting'};
assert.equal(by('lamia','joint-awaiting').length,1);
assert.equal(by('karim','joint-awaiting').length,1);
assert.equal(by('karim','joint-awaiting')[0].priority,'urgent');
assert.equal(by('karim','joint-awaiting')[0].action.route,'joint-account');
assert.equal(by('yasmine','joint-awaiting').length,0,'Do not leak joint application to minor');
assert.equal(by('karim','joint-awaiting')[0].title,'Compte joint : votre accord est attendu');
f.jointApplication.status='review';
assert.equal(by('karim','joint-awaiting').length,0);
assert.equal(by('lamia','joint-review').length,1);
assert.equal(by('karim','joint-review').length,1);
f.jointApplication.status='rejected';
assert.equal(by('lamia','joint-rejected').length,1);
assert.equal(by('karim','joint-rejected').length,0);
f.jointApplication=null;
assert.equal(by('lamia','joint-review').length,0);

const pot=f.pots[0];
pot.pendingInvites=['yasmine'];
assert.equal(by('yasmine','pot-invite').length,1);
assert.equal(by('yasmine','pot-invite')[0].action.id,pot.id);
assert.equal(by('karim','pot-invite').length,0);
pot.pendingInvites=[];pot.members.push('yasmine');
assert.equal(by('yasmine','pot-invite').length,0,'Accepted invitation disappears');

const goal=f.goals[0];
goal.deadline='2026-10-27';
const goalEvent=by('lamia','goal-deadline').find(e=>e.action.id===goal.id);
assert(goalEvent,'Upcoming goal is visible');
assert.equal(goalEvent.badge,'Demain');
assert.equal(by('yasmine','goal-deadline').some(e=>e.action.id===goal.id),false,
 'Goal not available to Yasmine must stay hidden');
goal.deadline='2026-10-01';
assert.equal(by('lamia','goal-deadline').find(e=>e.action.id===goal.id).badge,'En retard');
goal.status='closed';
assert.equal(by('lamia','goal-deadline').some(e=>e.action.id===goal.id),false,
 'Closed goal disappears');

pot.deadline='2026-11-03';
assert.equal(by('lamia','pot-deadline').find(e=>e.action.id===pot.id).action.route,'pot');
assert.equal(by('yasmine','pot-deadline').find(e=>e.action.id===pot.id).action.route,'pot');
pot.status='closed';
assert.equal(by('lamia','pot-deadline').some(e=>e.action.id===pot.id),false);

const doc=f.documents[0];
doc.expiry='2026-10-27';
assert.equal(by('lamia','document-expiry').length,1);
assert.equal(by('karim','document-expiry').length,1);
assert.equal(by('yasmine','document-expiry').length,0,'Private vault document must remain private');
assert.equal(by('lamia','document-expiry')[0].action.route,'vault');
doc.expiry='2027-05-31';
assert.equal(by('lamia','document-expiry').length,0);

const ranks={urgent:0,soon:1,info:2};
assert(list('lamia').every((e,i,a)=>i===0||ranks[a[i-1].priority]<=ranks[e.priority]),
 'Followups should be sorted by priority');
assert.equal(new Set(list('lamia').map(e=>e.id)).size,list('lamia').length,
 'No duplicated event IDs');

const ui=source('src/family/FamilyExperience.tsx');
assert(ui.includes('const familyFollowUps=family?getFamilyFollowUps(family,data.viewerId,nowDate()):[];'));
assert(ui.includes('const homeFollowUps=familyFollowUps.slice(0,2);'),'Home stays compact');
assert(ui.includes('homeFollowUps.map(item=><AlertItem'),'Home list uses centralized derived events');
assert(ui.includes('familyFollowUps.map(item=><AlertItem'),'See all uses exactly the same source');
assert(ui.includes("action.route==='pot')navigateToPot(action.id)"),'Pot invites go to the right pot');
assert(ui.includes("action.route==='goal')navigateToGoal(action.id)"),'Goal alerts go to the right project');
assert(ui.includes("else mainGo(action.route)"),'Other alerts navigate to family routes');
assert(!ui.includes('upcomingFollowUpGoal'),'Obsolete independent due-goal filtering removed');
assert(!ui.includes("daysUntil("),'Past-due bills must not be converted to future labels');
console.log('OK — role-aware contextual reminders, joint consent, bills, goals, pots, documents and navigation.');
