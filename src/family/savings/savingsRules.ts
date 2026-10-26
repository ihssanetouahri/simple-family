/** Cycle de vie des objectifs d'épargne et cagnottes : prototype local, aucune opération bancaire réelle. */
import { findMember, roundMoney, today, type Family, type SavingsGoal, type FamilyPot } from '../model';

export function deadlineState(date:string|undefined, status:'active'|'closed', at:string):'closed'|'none'|'overdue'|'soon'|'future' {
 if(status==='closed')return 'closed';
 if(!date)return 'none';
 if(date<at)return 'overdue';
 // Un calcul calendaire UTC à midi, pour éviter les variations d'heure locales.
 const ms=Date.parse(date+'T12:00:00Z')-Date.parse(at+'T12:00:00Z');
 if(Number.isFinite(ms)&&ms<=30*86400000)return 'soon';
 return 'future';
}
export function goalProgress(goal:SavingsGoal):number {
 return goal.target>0?Math.min(100,Math.max(0,Math.round(goal.balance/goal.target*100))):0;
}
export function goalDisplayState(goal:SavingsGoal,at:string):{
 label:string; description:string; tone:'green'|'orange'|'purple'; available:number;
} {
 if(goal.status==='closed'){
  if(goal.closedReason==='reached')return {
   label:'Objectif atteint',tone:'green',
   description:'Objectif atteint : le reversement fictif au propriétaire a été enregistré.',
   available:0
  };
  if(goal.closedReason==='manual')return {
   label:'Projet clôturé',tone:'purple',
   description:'Contributions arrêtées et reversement fictif au propriétaire enregistré.',
   available:0
  };
  return {label:'Projet clôturé',tone:'purple',
   description:'Aucun nouveau versement possible. Le devenir du solde de cette ancienne démo est à vérifier.',
   available:goal.balance};
 }
 const due=deadlineState(goal.deadline,'active',at);
 if(due==='overdue')return {label:'Échéance dépassée',tone:'orange',
  description:'La date cible est passée. Modifiez l’échéance ou clôturez l’objectif ; aucun transfert automatique.',
  available:goal.balance};
 if(due==='soon')return {label:'Échéance proche',tone:'orange',
  description:'La date cible approche. Vous pouvez poursuivre les versements ou adapter la date.',
  available:goal.balance};
 return {label:'En cours',tone:'purple',
  description:'Les fonds restent affectés à cet objectif fictif tant qu’il est actif.',
  available:goal.balance};
}
export function goalContributions(goal:SavingsGoal):{memberId:string;total:number}[] {
 const totals=new Map<string,number>();
 for(const h of goal.history)if(h.kind==='deposit')totals.set(h.memberId,(totals.get(h.memberId)||0)+h.amount);
 return goal.contributors.map(memberId=>({memberId,total:totals.get(memberId)||0}));
}
/** Une seule restitution par objectif clos, sans toucher à l'historique des contributions. */
export function closeSavingsGoal(family:Family,id:string,reason:'reached'|'manual'):boolean {
 const goal=family.goals.find(g=>g.id===id);
 if(!goal||goal.status!=='active')return false;
 const owner=findMember(family,goal.ownerId);
 if(!owner)return false;
 const refund=Math.max(0,goal.balance);
 owner.simpleBalance=roundMoney(owner.simpleBalance+refund);
 goal.status='closed';
 goal.closedReason=reason;
 goal.closedAt=today();
 goal.settledAmount=refund;
 goal.scheduledAmount=0;
 goal.scheduledFrequency=undefined;
 goal.nextScheduledDate=undefined;
 if(refund>0)goal.history.unshift({
  id:`settlement_${id}_${goal.history.length}`,memberId:owner.id,amount:refund,date:today(),kind:'settlement'
 });
 return true;
}
export function potDisplayState(pot:FamilyPot,at:string):{
 label:string; description:string; tone:'green'|'orange'|'purple';
} {
 if(pot.status==='closed')return {
  label:pot.closedReason==='target'?'Collecte terminée · Objectif atteint':'Collecte clôturée',
  tone:pot.closedReason==='target'?'green':'purple',
  description:'Collecte terminée : contributions arrêtées. Les fonds restent affichés ici, sans reversement simulé, dans l’attente des règles Famille à valider.'
 };
 const due=deadlineState(pot.deadline,'active',at);
 if(due==='overdue')return {label:'Date cible dépassée',tone:'orange',
  description:'La date cible est dépassée, mais la collecte reste ouverte. Le sort des fonds doit être défini par les métiers.'};
 if(due==='soon')return {label:'Date cible proche',tone:'orange',
  description:'La date de fin approche. Les membres peuvent encore contribuer tant que la collecte est active.'};
 return {label:'Collecte en cours',tone:'purple',
  description:'Les contributions sont fictives. Le reversement final reste à définir avec les équipes métier.'};
}
export function potContributions(pot:FamilyPot):{memberId:string;total:number}[] {
 const totals=new Map<string,number>();
 for(const h of pot.contributions||[])totals.set(h.memberId,(totals.get(h.memberId)||0)+h.amount);
 return pot.members.map(memberId=>({memberId,total:totals.get(memberId)||0}));
}
/** Clôturer n'implique PAS de transfert/remboursement de fonds pour une cagnotte Famille. */
export function closeFamilyPot(family:Family,id:string,reason:'target'|'manual'):boolean {
 const pot=family.pots.find(p=>p.id===id);
 if(!pot||pot.status!=='active')return false;
 pot.status='closed';pot.closedReason=reason;pot.closedAt=today();pot.pendingInvites=[];
 return true;
}
