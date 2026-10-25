/** Sélecteurs purs pour la fiche membre. Sans accès bancaire ni données réelles. */
import { findMember, type Family, type FamilyCard, type FamilyTransaction } from '../model';
import { canViewFamilyCard, canViewPocket, canViewSavingsGoal } from '../permissions';

export type MemberMovement = {
 id:string; date:string; title:string; category:string; signedAmount:number;
};

/** Une fiche membre ne doit jamais afficher le solde ou l'activité personnelle d'un autre membre non autorisé. */
export function getMemberPocketMovements(family:Family,viewerId:string,memberId:string):MemberMovement[] {
 const pocket=family.pockets.find(p=>p.ownerId===memberId);
 const member=findMember(family,memberId);
 if(!pocket||!member||!canViewPocket(family,viewerId,memberId))return [];
 const names=new Set([`pocket:${memberId}`,pocket.id,`Pocket ${member.name}`]);
 return family.transactions.flatMap((tx:FamilyTransaction)=>{
  const outgoing=names.has(tx.source),incoming=names.has(tx.target);
  if(!outgoing&&!incoming)return [];
  return [{id:tx.id,date:tx.date,title:tx.title,category:tx.category,
    signedAmount:outgoing?-Math.abs(tx.amount):Math.abs(tx.amount)}];
 });
}

export function getMemberVisibleCards(family:Family,viewerId:string,memberId:string):FamilyCard[] {
 const member=findMember(family,memberId);
 if(!member)return [];
 const pocket=family.pockets.find(p=>p.ownerId===memberId);
 return family.cards.filter(card=>{
  if(!canViewFamilyCard(family,viewerId,card))return false;
  return card.holderId===memberId ||
    (Boolean(pocket)&&(card.source===pocket?.id||card.source===`pocket:${memberId}`));
 });
}

export function getMemberVisibleGoals(family:Family,viewerId:string,memberId:string) {
 if(!findMember(family,memberId))return [];
 return family.goals.filter(goal=>
   (goal.ownerId===memberId||goal.contributors.includes(memberId)) &&
   canViewSavingsGoal(family,viewerId,goal)
 );
}
