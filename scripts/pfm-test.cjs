// Household PFM preview: scope isolation, no accidental personal account disclosure.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function source(filename){return fs.readFileSync(path.join(__dirname,'..',filename),'utf8');}
function compile(filename,deps={}){
 const js=ts.transpileModule(source(filename),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
 }).outputText;
 const mod={exports:{}};
 vm.runInNewContext(js,{module:mod,exports:mod.exports,structuredClone,
  localStorage:{removeItem(){}},
  require:(name)=>{if(!Object.hasOwn(deps,name))throw Error('Unexpected dependency '+name);return deps[name];}
 },{filename});
 return mod.exports;
}
const model=compile('src/family/model.ts');
const permission=compile('src/family/permissions.ts',{'./model':model});
const selectors=compile('src/family/pfm/householdInsights.ts',{
 '../model':model,'../permissions':permission
});
const f=model.createDemoState().families[0];
const insight=(viewer)=>selectors.getHouseholdInsight(f,viewer);

assert.equal(insight('lamia').scope.join(','),'sub');
assert.equal(insight('karim').scope.join(','),'sub');
assert.equal(insight('yasmine').scope.length,0);
assert.equal(insight('intruder').scope.length,0);
assert.equal(insight('lamia').spending,1250,'Only three genuine shared-account debit samples');
assert.equal(insight('lamia').movements.length,3,'A pocket topup is not a shared expense');
assert.equal(insight('lamia').categories.find(c=>c.name==='Courses').amount,520);
assert.equal(insight('lamia').categories.find(c=>c.name==='Factures').amount,420);
assert.equal(insight('lamia').categories.find(c=>c.name==='Loisirs').amount,310);
assert.equal(insight('yasmine').spending,0,'Simple One cannot see shared bank expenses without explicit authorization');
assert.equal(insight('yasmine').categories.length,0);
assert(insight('yasmine').goals.some(g=>g.id==='goal_school'),'Simple One may see own authorized savings');
assert(!insight('yasmine').goals.some(g=>g.id==='goal_vac'),'No private goal leaking to child');
assert.equal(insight('intruder').goals.length,0);
assert.equal(insight('intruder').pots.length,0);

// Unknown transaction labels or private accounts are not in the shared spending summary.
f.transactions.push(
 {id:'personal',date:'15 oct.',title:'My private expense',amount:-3200,category:'Personnel',source:'simple:lamia',target:'Shop'},
 {id:'pocket',date:'15 oct.',title:'Yasmine pocket',amount:-500,category:'Achats',source:'pocket:yasmine',target:'Toy'},
 {id:'unknown',date:'15 oct.',title:'Unknown bank account',amount:-90,category:'Autres',source:'Unknown',target:'Store'}
);
assert.equal(insight('lamia').spending,1250,'Personal and pocket debits must be excluded');
assert.equal(insight('lamia').categories.some(c=>c.name==='Personnel'),false);

// Read-only grant is scoped to the exact shared account; it never grants joint rights.
f.accountViewIds.push('yasmine');
assert.equal(insight('yasmine').spending,1250,'Explicit account reading grant is respected');
f.accountViewIds=f.accountViewIds.filter(id=>id!=='yasmine');
assert.equal(insight('yasmine').spending,0,'Removing shared read permission hides expenses immediately');

// Joint requires co-ownership; admin label alone does not confer data access.
f.joint={id:'joint_test',label:'Compte joint',balance:500,limit:9000};
f.jointHolderIds=['lamia','karim'];
f.transactions.push({id:'jointTxn',date:'14 oct.',title:'Joint debit',
 amount:-170,category:'Restaurants',source:'Compte joint',target:'Restaurant'});
assert.equal(insight('lamia').spending,1420);
assert.equal(insight('karim').spending,1420);
assert.equal(insight('yasmine').spending,0);
f.jointHolderIds=['lamia'];
assert.equal(insight('karim').spending,1250,'Non-cotitulaire manager cannot view joint history');
assert.equal(insight('lamia').scope.join(','),'sub,joint');
f.joint=null;f.jointHolderIds=[];
assert.equal(insight('lamia').spending,1250,'Closed joint data is not shown as active account history');
f.account=null;
assert.equal(insight('lamia').scope.length,0,'Closed sub-account does not expose old transactions');
assert.equal(insight('lamia').spending,0);
assert(insight('lamia').goals.length>0,'Personal access to savings remains independent of bank account');
const goal=f.goals.find(g=>g.id==='goal_school');
goal.status='closed';
assert(!insight('lamia').goals.some(g=>g.id===goal.id),'Closed savings not counted as active');
const pot=f.pots.find(p=>p.id==='pot1');pot.status='closed';
assert(!insight('lamia').pots.some(p=>p.id===pot.id),'Closed pots are not counted as ongoing projects');

const ui=source('src/family/FamilyExperience.tsx');
const bridge=source('src/family/pfm/HouseholdPFMBridge.tsx');
assert(ui.includes("route==='pfm'&&<HouseholdPFMBridge"),'PFM view must use dedicated scoped component');
assert(ui.includes("onAccounts={()=>mainGo('accounts')}"),'PFM must link back to account management');
assert(ui.includes("onGoals={navigateToGoal}"),'PFM must link to existing goal detail');
assert(ui.includes("onPot={navigateToPot}"),'PFM must link to existing pot detail');
assert(ui.includes('title="Comprendre les dépenses partagées"'),'Account section offers link to PFM');
assert(ui.includes("family.joint?(canViewJointAccount(family,data.viewerId)?showBalance"),'Shared account card protects joint balance');
assert(ui.includes("{canViewJointAccount(family,data.viewerId)&&<button"),'Home must hide joint balance card from non-cotitular managers');
assert(ui.includes("[family.jointApplication.requesterId,family.jointApplication.coHolderId].includes(data.viewerId)"),'Home must hide joint application status from other administrators');
assert(ui.includes("onClick={()=>mainGo('pfm')}"),'Protected Home keeps PFM entrypoint');
assert(bridge.includes('getHouseholdInsight(family,viewerId)'),'PFM must use shared account scope');
assert(bridge.includes('showAmounts?currency(n)'),'Mon foyer must honor balance masking');
assert(bridge.includes('Le prototype PFM « Mon foyer » est distinct'),'Cross-app navigation must not imply integration');
assert(bridge.includes('onClick={onAccounts}'),'Read-only analysis links to family management');
assert(!bridge.includes('family.transactions.filter('),'UI must never directly aggregate unsanitized family transactions');
for(const filename of ['src/family/FamilyExperience.tsx','src/family/pfm/HouseholdPFMBridge.tsx']){
 const parsed=ts.createSourceFile(filename,source(filename),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.equal(parsed.parseDiagnostics.length,0,filename+': '+parsed.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('; '));
}
console.log('OK — PFM scoped spending, closed accounts, joint ownership, Simple One, masking and routing.');
