// Contrôles des comptes partagés : règles de démonstration et confidentialité.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function read(name){return fs.readFileSync(path.join(__dirname,'..',name),'utf8');}
function compile(name,deps={}){
 const js=ts.transpileModule(read(name),{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022
 }}).outputText;
 const mod={exports:{}};
 vm.runInNewContext(js,{
  module:mod,exports:mod.exports,structuredClone,localStorage:{removeItem(){}},
  require:(id)=>{if(!Object.hasOwn(deps,id))throw Error('Unexpected import '+id);return deps[id];}
 },{filename:name});
 return mod.exports;
}
const model=compile('src/family/model.ts');
const permissions=compile('src/family/permissions.ts',{'./model':model});
const rules=compile('src/family/accounts/accountRules.ts',{'../model':model,'../permissions':permissions});
const family=model.createDemoState().families[0];
const check=(kind,action,viewer,amount,target,beneficiary)=>rules.validateAccountOperation(
 family,kind,action,viewer,amount,target,beneficiary||''
);
const close=(kind,viewer)=>rules.accountClosureState(family,kind,viewer);
assert.equal(rules.accountSource('sub','add','lamia'),'simple:lamia');
assert.equal(rules.accountSource('joint','transfer','lamia'),'joint');
assert(check('sub','add','lamia',500,'account').ok);
assert(check('sub','transfer','lamia',200,'pocket:yasmine').ok);
assert(check('sub','transfer','karim',100,'simple:karim').ok);
assert(!check('sub','transfer','yasmine',100,'simple:yasmine').ok);
assert(!check('sub','add','yasmine',100,'account').ok);
assert(!check('sub','transfer','lamia',100,'simple:karim').ok);
assert(!check('sub','transfer','lamia',100,'account').ok,'Same source and target cannot be transferred');
assert(!check('sub','pay','lamia',100,'external','').ok);
assert(check('sub','pay','lamia',100,'external','Facture familiale').ok);
assert(!check('sub','transfer','lamia',0,'pocket:yasmine').ok);
assert(!check('sub','transfer','lamia',99999,'pocket:yasmine').ok);
assert.equal(rules.approvalMembers(family,'sub').length,2);
assert.equal(rules.approvalMembers(family,'joint').length,0);

// A demo limit is a per-operation check, not a monthly banking rule.
family.account.balance=12000;family.account.limit=1000;
assert(!check('sub','transfer','lamia',1001,'pocket:yasmine').ok);
assert(check('sub','transfer','lamia',1000,'pocket:yasmine').ok);

// Sous-compte: balances and attached active cards must be cleared first.
assert(!close('sub','lamia').canClose);
family.account.balance=0;
assert(!close('sub','lamia').canClose,'Active card blocks closure');
family.cards.filter(c=>c.source==='family').forEach(c=>c.active=false);
assert(close('sub','lamia').canClose,'Leader can close account when simulated conditions met');
assert(!close('sub','karim').canClose,'Co-leader cannot close Sub-account');
assert(!close('sub','yasmine').canClose,'Child cannot close Sub-account');
assert.equal(close('sub','lamia').totalCards,1);

family.joint={id:'joint_sandbox',label:'Compte joint',balance:0,limit:9000};
family.jointHolderIds=['lamia','karim'];
family.cards.push({id:'jointCard',label:'Carte joint',last4:'1234',source:'joint',
 holderId:'lamia',active:true});
assert.equal(rules.approvalMembers(family,'joint').length,2);
assert(check('joint','add','lamia',200,'joint').ok);
assert(!check('joint','transfer','yasmine',100,'simple:yasmine').ok);
assert(!close('joint','lamia').canClose,'Card must be suspended');
family.cards.find(c=>c.id==='jointCard').active=false;
assert(close('joint','lamia').canClose);
assert(close('joint','karim').canClose);
assert(!close('joint','yasmine').canClose);
family.jointHolderIds=['lamia'];
assert(!close('joint','lamia').canClose,'Both coholders required');

// Consentement: only the named second account holder can answer.
family.jointHolderIds=[];
family.joint=null;
family.jointApplication={status:'awaiting',requesterId:'lamia',coHolderId:'karim'};
assert(!rules.canRespondJointApplication(family,'lamia'));
assert(rules.canRespondJointApplication(family,'karim'));
assert(!rules.canRespondJointApplication(family,'yasmine'));
assert(!rules.canSimulateBankReview(family,'lamia'));
family.jointApplication.status='review';
assert(!rules.canRespondJointApplication(family,'karim'));
assert(rules.canSimulateBankReview(family,'lamia'));
assert(rules.canSimulateBankReview(family,'karim'));
assert(!rules.canSimulateBankReview(family,'yasmine'));
family.jointApplication.status='rejected';
assert(!rules.canSimulateBankReview(family,'lamia'));

const accountUI=read('src/family/AccountJourneys.tsx');
assert(accountUI.includes('canRespondJointApplication(family,viewerId)'),
 'Consent cannot be submitted in a different profile');
assert(accountUI.includes("choisissez son profil dans « Mode démo »"),
 'Demo needs an explicit second-holder step');
assert(accountUI.includes("kind==='sub'?'Clôturer le Sous-compte Famille'"),
 'Sub-account closure must be discoverable');
assert(accountUI.includes("accountClosureState(f,kind,viewerId)"),
 'Closure must be rechecked against current data');
assert(accountUI.includes("if(kind==='sub'){f.account=null;f.accountViewIds=[];}"),
 'Close sub-account and revoke viewing accesses');
assert(accountUI.includes('f.cards=f.cards.filter(c=>!linkedIds.has(c.id))'),
 'Closing a product must remove linked simulated cards');
assert(accountUI.includes("account&&!readable"),
 'Unauthorised viewers must not access account details');
assert(accountUI.includes('validateAccountOperation(family,kind,action,viewerId,amountValue,dest,beneficiary)'),
 'Operations must be validated before confirmation');

console.log('OK — comptes, cotitularité, décisions, plafonds fictifs, clôture et protections.');
