/**
 * Vérifications communes des parcours de comptes bancaires fictifs.
 * Ces règles côté interface ne remplacent ni l'authentification, ni les contrôles serveur.
 */
import { findMember, moneyValid, type Family } from '../model';
import {
 canCreditFamilyDestination, canDebitFamilySource, canCloseFamilyAccount,
 canOperateJointAccount, canManageFamily
} from '../permissions';

export type AccountKind='sub'|'joint';
export type AccountOperation='add'|'transfer'|'pay';
export type AccountCheck={ok:true}|{ok:false;reason:string};

export function accountSource(kind:AccountKind,action:AccountOperation,viewerId:string):string {
 return action==='add'?`simple:${viewerId}`:kind==='sub'?'account':'joint';
}

export function getAccountCards(family:Family,kind:AccountKind) {
 const account=kind==='sub'?family.account:family.joint;
 const keys=kind==='sub'?['account','family',account?.id]:['joint',account?.id];
 return family.cards.filter(card=>keys.includes(card.source));
}

export function approvalMembers(family:Family,kind:AccountKind) {
 if(kind==='sub')return family.members.filter(m=>
  !m.simpleOne&&(m.role==='leader'||m.role==='coleader')).slice(0,2);
 return (family.jointHolderIds||[]).map(id=>findMember(family,id))
  .filter((m):m is NonNullable<typeof m>=>Boolean(m&&!m.simpleOne)).slice(0,2);
}

export function validateAccountOperation(
 family:Family,kind:AccountKind,action:AccountOperation,viewerId:string,
 amount:number,target:string,beneficiary=''
):AccountCheck {
 const account=kind==='sub'?family.account:family.joint;
 if(!account)return {ok:false,reason:'Ce compte n’est pas encore ouvert.'};
 if(!moneyValid(amount))return {ok:false,reason:'Saisissez un montant positif valide.'};
 const source=accountSource(kind,action,viewerId);
 if(!canDebitFamilySource(family,viewerId,source)){
  return {ok:false,reason:'Cette opération n’est pas autorisée avec votre profil.'};
 }
 const destination=action==='add'?(kind==='sub'?'account':'joint'):action==='pay'?'external':target;
 if(!destination || destination===source)return {ok:false,reason:'Choisissez une destination différente.'};
 if(!canCreditFamilyDestination(family,viewerId,destination)){
  return {ok:false,reason:'La destination choisie n’est pas autorisée.'};
 }
 if(action==='pay'&&!beneficiary.trim()){
  return {ok:false,reason:'Indiquez un bénéficiaire ou une facture.'};
 }
 const balance=source.startsWith('simple:')
  ?findMember(family,viewerId)?.simpleBalance??0:account.balance;
 if(amount>balance)return {ok:false,reason:'Solde insuffisant pour cette opération.'};
 // Hypothèse de démonstration uniquement : plafond par opération sortante du compte.
 if(action!=='add'&&amount>account.limit){
  return {ok:false,reason:'Ce montant dépasse le plafond indicatif par opération du compte.'};
 }
 return {ok:true};
}

export function accountClosureState(family:Family,kind:AccountKind,viewerId:string) {
 const account=kind==='sub'?family.account:family.joint;
 const cards=getAccountCards(family,kind);
 const balance=account?.balance??0;
 const activeCards=cards.filter(c=>c.active);
 const ownerAllowed=kind==='sub'?canCloseFamilyAccount(family,viewerId):canOperateJointAccount(family,viewerId);
 const twoCoholders=kind==='sub'||(
  (family.jointHolderIds?.length===2) &&
  family.jointHolderIds.every(id=>Boolean(findMember(family,id) &&
    canOperateJointAccount(family,id)))
 );
 const issues:string[]=[];
 if(!account)issues.push('Ce compte est déjà fermé ou indisponible.');
 if(!ownerAllowed)issues.push('Vous ne disposez pas du droit de clôturer ce compte.');
 if(balance!==0)issues.push('Le solde doit être ramené à 0 DH avant la clôture.');
 if(activeCards.length)issues.push('Toutes les cartes associées doivent être suspendues.');
 if(!twoCoholders)issues.push('Deux cotitulaires éligibles sont nécessaires.');
 return {canClose:issues.length===0,issues,balance,activeCards:activeCards.length,totalCards:cards.length};
}

/** Accord conjoint fictif : seul le profil du cotitulaire ciblé peut le donner/refuser. */
export function canRespondJointApplication(family:Family,viewerId:string):boolean {
 const a=family.jointApplication;
 return Boolean(a?.status==='awaiting'&&a.coHolderId===viewerId &&
  findMember(family,viewerId) && !findMember(family,viewerId)?.simpleOne &&
  findMember(family,viewerId)?.role==='coleader');
}

/** La validation dite bancaire est uniquement une simulation, jamais une autorisation métier. */
export function canSimulateBankReview(family:Family,viewerId:string):boolean {
 const a=family.jointApplication;
 return Boolean(a?.status==='review'&&a &&
  [a.requesterId,a.coHolderId].includes(viewerId) && canManageFamily(family,viewerId));
}
