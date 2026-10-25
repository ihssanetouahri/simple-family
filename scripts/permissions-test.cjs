// Règles métier du prototype : aucun serveur, aucun OTP réel, aucune transaction bancaire.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');

function transpile(relative, modules={}) {
 const source=fs.readFileSync(path.join(__dirname,'..',relative),'utf8');
 const js=ts.transpileModule(source,{
   compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
 }).outputText;
 const mod={exports:{}};
 const localStorage={removeItem() {}};
 vm.runInNewContext(js,{
   module:mod,exports:mod.exports,structuredClone,localStorage,
   require:(id)=>{
     if(!Object.prototype.hasOwnProperty.call(modules,id))throw Error('Import non attendu : '+id);
     return modules[id];
   }
 },{filename:relative});
 return mod.exports;
}
const model=transpile('src/family/model.ts');
const policy=transpile('src/family/permissions.ts',{'./model':model});
const family=model.createDemoState().families[0];
const leader='lamia',co='karim',child='yasmine',outsider='unknown';

const check=(method,...args)=>policy[method](family,...args);
assert(check('isFamilyLeader',leader));
assert(!check('isFamilyLeader',co));
assert(check('canManageFamily',co));
assert(!check('canManageFamily',child));
assert(!check('canManageFamily',outsider));
assert(check('canDeleteFamily',leader));
assert(!check('canDeleteFamily',co));
assert(check('canInviteFamilyMember',co));
assert(!check('canInviteFamilyMember',child));
assert(check('canEditFamilyLanguage',co));
assert(!check('canEditFamilyLanguage',child));
assert(check('canChangeMemberRole',leader,co,'member'));
assert(!check('canChangeMemberRole',co,leader,'member'));
assert(!check('canChangeMemberRole',leader,child,'coleader'));
assert(!check('canChangeMemberRole',leader,co,'leader'));
assert(check('canRemoveFamilyMember',co,child));
assert(!check('canRemoveFamilyMember',co,leader));
assert(!check('canRemoveFamilyMember',co,co));
assert(check('canRemoveFamilyMember',leader,co));

assert(check('canViewFamilyAccount',leader));
assert(check('canViewFamilyAccount',co));
assert(!check('canViewFamilyAccount',child));
assert(!check('canViewFamilyAccount',outsider));
assert(check('canOperateFamilyAccount',co));
assert(!check('canOperateFamilyAccount',child));
assert(!check('canCloseFamilyAccount',co));
assert(check('canCloseFamilyAccount',leader));
assert(check('canUseSimplePayFamily',co));
assert(!check('canUseSimplePayFamily',child));
// Consultation ponctuelle ne donne aucun droit d'opération.
family.accountViewIds.push(child);
assert(check('canViewFamilyAccount',child));
assert(!check('canOperateFamilyAccount',child));
family.accountViewIds=family.accountViewIds.filter(id=>id!==child);

assert(check('canViewPocket',leader,child));
assert(check('canViewPocket',child,child));
assert(!check('canViewPocket',child,co));
assert(!check('canViewPocket',outsider,child));
assert(check('canOperatePocket',child,child));
assert(!check('canOperatePocket',child,leader));
assert(!check('canManagePocketCards',child,child));
assert(check('canManagePocketCards',co,child));
assert(check('canUsePocketCard',child,child));
assert(check('canViewFamilyCard',child,family.cards[1]));
assert(!check('canViewFamilyCard',child,family.cards[0]));
assert(check('canManageFamilyCards',co));
assert(!check('canManageFamilyCards',child));

// Le profil adulte éligible ne suffit pas : le compte joint nécessite deux personnes et des titres.
assert(check('canRequestJointAccount',leader));
assert(check('canRequestJointAccount',co));
assert(!check('canRequestJointAccount',child));
assert(!check('canRequestJointAccount',outsider));
assert(!check('canOperateJointAccount',leader));
family.joint={id:'joint_test',label:'Compte joint',balance:1200,limit:9000};
family.jointHolderIds=[leader,co];
assert(check('canViewJointAccount',leader));
assert(check('canOperateJointAccount',co));
assert(!check('canOperateJointAccount',child));
assert(!check('canRequestJointAccount',leader));
family.jointHolderIds=[leader];
assert(!check('canOperateJointAccount',co),'Co-leader non cotitulaire : aucun droit bancaire');
family.joint=null;
family.jointHolderIds=[];

assert(check('canDebitFamilySource',leader,'account'));
assert(!check('canDebitFamilySource',child,'account'));
assert(check('canDebitFamilySource',child,'pocket:yasmine'));
assert(!check('canDebitFamilySource',child,'pocket:karim'));
assert(check('canDebitFamilySource',child,'simple:yasmine'));
assert(!check('canDebitFamilySource',child,'simple:lamia'));
assert(!check('canDebitFamilySource',child,'junk'));
assert(check('canCreditFamilyDestination',child,'pocket:yasmine'));
assert(!check('canCreditFamilyDestination',child,'pocket:lamia'));
assert(!check('canCreditFamilyDestination',child,'account'));
assert(check('canCreditFamilyDestination',leader,'account'));
assert(!check('canCreditFamilyDestination',child,'joint'));
assert(!check('canCreditFamilyDestination',outsider,'external'));

const vacation=family.goals.find(g=>g.id==='goal_vac');
const school=family.goals.find(g=>g.id==='goal_school');
assert(check('canViewSavingsGoal',leader,vacation));
assert(!check('canViewSavingsGoal',child,vacation));
assert(check('canViewSavingsGoal',child,school),'Bénéficiaire propriétaire autorisé à suivre l’objectif');
assert(!check('canEditSavingsGoal',child,school));
assert(check('canWithdrawSavingsGoal',child,school));
assert(check('canFundSavingsGoal',child,school));
assert(!check('canFundSavingsGoal',outsider,school));

const pot=family.pots.find(p=>p.id==='pot1');
assert(check('canManageFamilyPot',leader,pot));
assert(!check('canManageFamilyPot',child,pot));
assert(check('canContributeToFamilyPot',co,pot));
assert(!check('canContributeToFamilyPot',child,pot));
assert(!check('canViewFamilyPotHistory',child,pot));

assert(check('canBookFamilyTrip',co));
assert(!check('canBookFamilyTrip',child));
assert(check('canViewFamilyDocument',leader,family.documents[0]));
assert(!check('canViewFamilyDocument',child,family.documents[0]));
assert(!check('requiresDemoDualApproval',family,'account',100)); // seuil fictif à 2000 DH

// Erreur volontaire évitée : la double validation ne commence qu'au seuil fictif.
assert(check('requiresDemoDualApproval',family,'account',2000));
assert(!check('requiresDemoDualApproval',family,'account',1999));
assert(!check('requiresDemoDualApproval',family,'joint',2500),'Pas de compte joint actif');

const invalid=model.createDemoState().families[0];
invalid.members.find(m=>m.id==='yasmine').role='coleader'; // state should never grant admin powers
assert(!policy.canManageFamily(invalid,child));

console.log('OK — matrice Leader, Co-leader, Membre, Simple One, titulaires, comptes, pockets, objectifs et cagnottes.');
