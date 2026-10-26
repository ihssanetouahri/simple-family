// Reproduction des erreurs vues sur la vidéo : 200 → 200,01 DH et facture non soldée.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function read(name){return fs.readFileSync(path.join(__dirname,'..',name),'utf8');}
function load(name,deps={}){
 const js=ts.transpileModule(read(name),{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022
 }}).outputText;
 const mod={exports:{}};
 vm.runInNewContext(js,{module:mod,exports:mod.exports,structuredClone,
  localStorage:{removeItem(){}},require:(name)=>{if(!Object.hasOwn(deps,name))throw Error('Unexpected import '+name);return deps[name];}
 },{filename:name});
 return mod.exports;
}
const model=load('src/family/model.ts');
const billRules=load('src/family/payments/billRules.ts',{'../model':model});
const f=model.createDemoState().families[0];
const bill=f.alerts.find(a=>a.id==='bill_internet');
const check=(amount,beneficiary='Internet')=>billRules.validateLinkedBillPayment(f,bill.id,beneficiary,amount);

// Exact whole amounts are valid, centimes are precise, extra decimals are rejected.
for(const [raw,expected] of [['200',200],['200.00',200],['200,00',200],['200.01',200.01],
 ['0.01',0.01],['250.10',250.1],['390',390],['390,00',390]]) {
 assert.equal(model.parseMoney(raw),expected,raw);
}
for(const raw of ['', '200.001', '390.009', 'not a price', '1e3', '99,123']) {
 assert(Number.isNaN(model.parseMoney(raw)),raw+' must be rejected');
}
assert.equal(model.roundMoney(0.1+0.2),0.3);
assert.equal(model.roundMoney(1850+200),2050);
assert.equal(model.roundMoney(400+100),500);
assert.equal(model.roundMoney(300.1+0.2),300.3);
assert.equal(model.roundMoney(100-0.1-0.2),99.7);

// Linked Internet bill: must match exact value and resolved state.
assert(check(model.parseMoney('390')).ok,'Whole-amount bill should be paid exactly');
assert(check(model.parseMoney('390.00')).ok);
assert(!check(model.parseMoney('390.01')).ok,'Extra cent must not settle a 390 DH bill');
assert(!check(model.parseMoney('389.99')).ok,'Partial payment must not settle a bill');
assert(!check(0).ok);
assert(!check(model.parseMoney('390'),'Lydec').ok,'Wrong beneficiary cannot settle alert');
assert(!billRules.validateLinkedBillPayment(f,'missing','Internet',390).ok);
bill.resolved=true;
assert(!check(390).ok,'Already settled bill cannot be paid again');
bill.resolved=false;

const ui=read('src/family/FamilyExperience.tsx');
const account=read('src/family/AccountJourneys.tsx');
assert(ui.includes("step={type==='number'?'0.01':undefined}"),'All family money inputs need centime step');
assert(ui.includes("readOnly={modal==='pay-bill'&&Boolean(form.alertId)}"),'Linked invoice amount must be locked');
assert(ui.includes("if(modal==='pay-bill'&&form.alertId){"),'Linked invoice must be validated before payment');
assert(ui.includes('validateLinkedBillPayment(family,form.alertId,form.beneficiary||\'\',amount)'),
 'Validate entered amount against bill');
assert(ui.includes("alertId:modal==='pay-bill'&&form.alertId?form.alertId:undefined"),
 'Keep invoice reference through payment flow');
assert(ui.includes("if(alert&&validateLinkedBillPayment(f,payment.alertId,alert.beneficiary,payment.amount).ok)alert.resolved=true;"),
 'Resolve only exact paid invoice after successful payment');
assert(ui.includes("f.account.balance=roundMoney(f.account.balance+delta)"),'Account arithmetic must use centime rounding');
assert(ui.includes("m.simpleBalance=roundMoney(m.simpleBalance+delta)"),'Simple balances must use centime rounding');
assert(ui.includes("p.balance=roundMoney(p.balance+delta)"),'Pocket balances must use centime rounding');
assert(account.includes('step="0.01"'), 'Shared account amounts must accept centimes');
assert(account.includes('const amountValue=parseMoney(amount)'), 'Bank journeys use same centime parser');
assert(account.includes('f.account.balance=roundMoney(f.account.balance+delta)'), 'Shared account totals use centime rounding');

for(const file of ['src/family/FamilyExperience.tsx','src/family/AccountJourneys.tsx']){
 const parsed=ts.createSourceFile(file,read(file),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.equal(parsed.parseDiagnostics.length,0,file+': '+parsed.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('; '));
}
console.log('OK — 200 DH exacts, centimes, facture Internet, rejet des paiements partiels et soldes arrondis.');
