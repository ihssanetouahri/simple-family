/**
 * Simple Family — règles d'accès du prototype (cadrage Famille V2, octobre 2026).
 *
 * Le rôle dans une famille est différent de la titularité bancaire :
 * un Co-leader n'est pas automatiquement cotitulaire d'un compte joint.
 * Aucune fonction de ce module ne constitue un contrôle de sécurité bancaire :
 * les autorisations réelles doivent aussi être appliquées côté serveur.
 */
import { findMember, type Family, type FamilyCard, type FamilyPot, type Role, type SavingsGoal } from './model';

const memberOf = (family:Family, memberId:string) => findMember(family,memberId);
const eligibleAdmin = (family:Family, memberId:string):boolean => {
  const member=memberOf(family,memberId);
  return Boolean(member && !member.simpleOne && (member.role==='leader'||member.role==='coleader'));
};

/** Gouvernance : un leader, des co-leaders, et des membres (Simple One jamais administrateur). */
export const isFamilyLeader = (family:Family, memberId:string):boolean => {
  const member=memberOf(family,memberId);
  return Boolean(member && member.role==='leader' && !member.simpleOne);
};
export const canManageFamily = eligibleAdmin;
export const canInviteFamilyMember = eligibleAdmin;
export const canEditFamilyLanguage = eligibleAdmin;
export const canDeleteFamily = isFamilyLeader;
export const canChangeMemberRole = (family:Family, viewerId:string, targetId:string, newRole:Role):boolean => {
  const target=memberOf(family,targetId);
  return Boolean(isFamilyLeader(family,viewerId) && target &&
    target.role!=='leader' && newRole!=='leader' &&
    !(target.simpleOne && newRole==='coleader'));
};
export const canRemoveFamilyMember = (family:Family, viewerId:string, targetId:string):boolean => {
  const target=memberOf(family,targetId);
  return Boolean(target && eligibleAdmin(family,viewerId) &&
    target.role!=='leader' && (target.role!=='coleader'||isFamilyLeader(family,viewerId)));
};

/** Sous-compte : consultation habilitée vs opérations réservées aux responsables. */
export const canViewFamilyAccount = (family:Family, viewerId:string):boolean =>
  Boolean(memberOf(family,viewerId) && (eligibleAdmin(family,viewerId)||family.accountViewIds.includes(viewerId)));
export const canOperateFamilyAccount = eligibleAdmin;
export const canManageFamilyAccountAccess = eligibleAdmin;
export const canCloseFamilyAccount = isFamilyLeader;
export const canUseSimplePayFamily = (family:Family, viewerId:string):boolean =>
  Boolean(family.account && eligibleAdmin(family,viewerId));

/** Pocket : propriétaire et responsables ; cartes créées/attribuées par les responsables. */
export const canViewPocket = (family:Family, viewerId:string, ownerId:string):boolean =>
  Boolean(memberOf(family,ownerId) && memberOf(family,viewerId) &&
    (viewerId===ownerId || eligibleAdmin(family,viewerId)));
export const canOperatePocket = canViewPocket;
export const canManagePocketCards = (family:Family, viewerId:string, ownerId:string):boolean =>
  Boolean(memberOf(family,ownerId) && eligibleAdmin(family,viewerId));
export const canUsePocketCard = canViewPocket;
export const canViewFamilyCard = (family:Family, viewerId:string, card:FamilyCard):boolean =>
  Boolean(memberOf(family,viewerId) && (eligibleAdmin(family,viewerId)||card.holderId===viewerId));
export const canManageFamilyCards = eligibleAdmin;

/** Compte joint : exclusivement le couple adulte Leader / Co-leader de cette famille. */
export const canRequestJointAccount = (family:Family, viewerId:string):boolean => {
  const viewer=memberOf(family,viewerId);
  if (!viewer||!eligibleAdmin(family,viewerId)||family.joint||family.jointApplication) return false;
  if (viewer.relation!=='Moi'&&viewer.relation!=='Conjoint') return false;
  return family.members.some(other=>other.id!==viewerId && !other.simpleOne &&
    eligibleAdmin(family,other.id) &&
    (other.relation==='Moi'||other.relation==='Conjoint') &&
    other.relation!==viewer.relation);
};
export const canViewJointAccount = (family:Family, viewerId:string):boolean =>
  Boolean(family.joint && memberOf(family,viewerId) && family.jointHolderIds?.includes(viewerId));
export const canOperateJointAccount = canViewJointAccount;

/** Épargne : visibilité spécifique, contribution par habilitation et droits de gestion distincts. */
export const canViewSavingsGoal = (family:Family, viewerId:string, goal:SavingsGoal):boolean =>
  Boolean(memberOf(family,viewerId) && (eligibleAdmin(family,viewerId) ||
    goal.ownerId===viewerId || goal.contributors.includes(viewerId) ||
    goal.history.some(h=>h.memberId===viewerId)));
export const canEditSavingsGoal = (family:Family, viewerId:string, goal:SavingsGoal):boolean =>
  Boolean(memberOf(family,viewerId) && (eligibleAdmin(family,viewerId)||goal.creatorId===viewerId));
export const canWithdrawSavingsGoal = (family:Family, viewerId:string, goal:SavingsGoal):boolean =>
  Boolean(memberOf(family,viewerId) && (eligibleAdmin(family,viewerId)||goal.ownerId===viewerId));
export const canFundSavingsGoal = (family:Family, viewerId:string, goal:SavingsGoal):boolean =>
  Boolean(memberOf(family,viewerId) && goal.status==='active' &&
    (goal.ownerId===viewerId||goal.contributors.includes(viewerId)));

/** Cagnotte Famille : les règles de remboursement restent à préciser par le métier. */
export const canManageFamilyPot = (family:Family, viewerId:string, pot:FamilyPot):boolean =>
  Boolean(memberOf(family,viewerId) && (eligibleAdmin(family,viewerId)||pot.creatorId===viewerId));
export const canContributeToFamilyPot = (family:Family, viewerId:string, pot:FamilyPot):boolean =>
  Boolean(memberOf(family,viewerId) && pot.status==='active' && pot.members.includes(viewerId));
export const canViewFamilyPotHistory = (family:Family, viewerId:string, pot:FamilyPot):boolean =>
  Boolean(memberOf(family,viewerId) &&
    (eligibleAdmin(family,viewerId)||pot.members.includes(viewerId)));

/** Réservations et coffre-fort. */
export const canBookFamilyTrip = eligibleAdmin;
export const canViewFamilyDocument = (family:Family, viewerId:string, document:{ownerId:string;visibleTo:string[]}):boolean =>
  Boolean(memberOf(family,viewerId) &&
    (isFamilyLeader(family,viewerId)||document.ownerId===viewerId||document.visibleTo.includes(viewerId)));

/** Le seuil ci-dessous est uniquement l'hypothèse de démonstration configurable. */
export const requiresDemoDualApproval = (family:Family, source:'account'|'joint', amount:number):boolean =>
  Number.isFinite(amount) && amount>0 && amount>=family.otpThreshold &&
  (source==='account'?Boolean(family.account):Boolean(family.joint));
