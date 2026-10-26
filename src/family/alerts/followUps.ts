/** Rappels contextuels de la démonstration Family. Calculés à partir des données existantes :
 * pas de push, pas de monitoring, pas de nouvelle source bancaire. */
import { currency, findMember, type Family } from '../model';
import { canManageFamily, canViewFamilyDocument, canViewSavingsGoal,
  canManageFamilyPot, canViewFamilyPotHistory } from '../permissions';

export type FamilyFollowUpKind='bill'|'family-invite'|'joint-awaiting'|'joint-review'|'joint-rejected'|
  'pot-invite'|'goal-deadline'|'pot-deadline'|'document-expiry';
export type FollowUpAction=
  {route:'pay-bill';id:string}|
  {route:'members'|'joint-account'|'vault'}|
  {route:'goal'|'pot';id:string};
export type FamilyFollowUp={
 id:string;kind:FamilyFollowUpKind;title:string;subtitle:string;
 priority:'urgent'|'soon'|'info';badge?:string;action:FollowUpAction;
};

export function daysFromToday(date:string,today:string):number|null {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{4}-\d{2}-\d{2}$/.test(today))return null;
 const a=Date.parse(date+'T12:00:00Z'),b=Date.parse(today+'T12:00:00Z');
 if(!Number.isFinite(a)||!Number.isFinite(b))return null;
 if(new Date(a).toISOString().slice(0,10)!==date)return null;
 return Math.round((a-b)/86400000);
}
function dateText(date:string):string {
 const [year,month,day]=date.split('-');
 return `${day}/${month}/${year}`;
}
function dueBadge(days:number):string {
 return days<0?'En retard':days===0?"Aujourd’hui":days===1?'Demain':`J-${days}`;
}
function dueText(days:number):string {
 return days<0?'Échéance dépassée':days===0?"Échéance aujourd’hui":days===1?'Échéance demain':`Dans ${days} jours`;
}
const rank={urgent:0,soon:1,info:2};
const kindOrder:Record<FamilyFollowUpKind,number>={
 'joint-awaiting':0,'bill':1,'pot-invite':2,'joint-review':3,'joint-rejected':4,
 'goal-deadline':5,'pot-deadline':6,'document-expiry':7,'family-invite':8
};

/** L'utilisateur courant et les habilitations commandent l'ensemble des alertes affichables. */
export function getFamilyFollowUps(family:Family,viewerId:string,today:string):FamilyFollowUp[] {
 if(!findMember(family,viewerId))return [];
 const result:FamilyFollowUp[]=[];
 const manager=canManageFamily(family,viewerId);
 if(manager) {
  for(const bill of family.alerts) {
   if(bill.type!=='bill'||bill.resolved)continue;
   const days=daysFromToday(bill.dueDate,today);
   result.push({id:`bill:${bill.id}`,kind:'bill',title:bill.title,
    subtitle:`${currency(bill.amount)} · Échéance ${dateText(bill.dueDate)}`,
    badge:days===null?undefined:dueBadge(days),
    priority:days!==null&&days<=3?'urgent':'soon',
    action:{route:'pay-bill',id:bill.id}});
  }
  for(const invite of family.invites)result.push({
   id:`family-invite:${invite.id}`,kind:'family-invite',title:'Invitation à la famille en attente',
   subtitle:`${invite.name} · Gérer son invitation`,priority:'info',action:{route:'members'}
  });
 }
 const application=family.jointApplication;
 if(application&&[application.requesterId,application.coHolderId].includes(viewerId)) {
  const namedOther=findMember(family,application.coHolderId)?.name||'votre conjoint';
  if(application.status==='awaiting')result.push({
   id:'joint:awaiting',kind:'joint-awaiting',
   title:viewerId===application.coHolderId?'Compte joint : votre accord est attendu':'Compte joint : accord en attente',
   subtitle:viewerId===application.coHolderId?
    'Examiner la demande et répondre (simulation)':`En attente de ${namedOther}`,
   badge:viewerId===application.coHolderId?'À confirmer':'En attente',
   priority:viewerId===application.coHolderId?'urgent':'soon',
   action:{route:'joint-account'}
  });
  if(application.status==='review')result.push({
   id:'joint:review',kind:'joint-review',title:'Compte joint : accord enregistré',
   subtitle:'Validation bancaire fictive à poursuivre',priority:'soon',action:{route:'joint-account'}
  });
  if(application.status==='rejected'&&viewerId===application.requesterId)result.push({
   id:'joint:rejected',kind:'joint-rejected',title:'Compte joint : demande refusée',
   subtitle:'Consulter le suivi et, si besoin, recommencer',priority:'soon',action:{route:'joint-account'}
  });
 }
 for(const pot of family.pots) {
  if(pot.status!=='active')continue;
  if((pot.pendingInvites||[]).includes(viewerId) && !pot.members.includes(viewerId)) {
   result.push({id:`pot-invite:${pot.id}`,kind:'pot-invite',
    title:'Invitation à une cagnotte',subtitle:`${pot.title} · Répondre à l’invitation`,
    badge:'À répondre',priority:'soon',action:{route:'pot',id:pot.id}});
  }
 }
 for(const goal of family.goals) {
  if(goal.status!=='active'||!canViewSavingsGoal(family,viewerId,goal))continue;
  const days=daysFromToday(goal.deadline,today);
  if(days===null||days>30)continue;
  result.push({id:`goal:${goal.id}`,kind:'goal-deadline',title:goal.title,
   subtitle:`${dueText(days)} · Projet d’épargne`,badge:dueBadge(days),
   priority:days<=0?'urgent':'soon',action:{route:'goal',id:goal.id}});
 }
 for(const pot of family.pots) {
  if(pot.status!=='active'||!(canManageFamilyPot(family,viewerId,pot)||
   canViewFamilyPotHistory(family,viewerId,pot)))continue;
  const days=daysFromToday(pot.deadline||'',today);
  if(days===null||days>30)continue;
  result.push({id:`pot-deadline:${pot.id}`,kind:'pot-deadline',title:pot.title,
   subtitle:`${dueText(days)} · Cagnotte familiale`,badge:dueBadge(days),
   priority:days<=0?'urgent':'soon',action:{route:'pot',id:pot.id}});
 }
 for(const document of family.documents) {
  if(!document.expiry||!canViewFamilyDocument(family,viewerId,document))continue;
  const days=daysFromToday(document.expiry,today);
  if(days===null||days>30)continue;
  result.push({id:`document:${document.id}`,kind:'document-expiry',
   title:`Document : ${document.title}`,
   subtitle:`${dueText(days)} · Consulter le coffre-fort`,badge:dueBadge(days),
   priority:days<=0?'urgent':'soon',action:{route:'vault'}});
 }
 return result.sort((a,b)=>
   rank[a.priority]-rank[b.priority]||
   kindOrder[a.kind]-kindOrder[b.kind]||
   a.id.localeCompare(b.id)
 );
}
