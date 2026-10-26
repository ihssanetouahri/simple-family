/** Passerelles contextualisées entre les services existants du prototype Simple Family.
 * Aucune connexion externe et aucune donnée bancaire partagée dans les messages préparés.
 */
import { findMember, type Family } from '../model';
import { canBookFamilyTrip, canManageFamily, canViewFamilyDocument, canViewSavingsGoal,
  canViewFamilyPotHistory, canManageFamilyPot } from '../permissions';

export type ServiceLinkAction=
 |{route:'chat'|'trip'|'vault'|'services'}
 |{route:'goal'|'pot';id:string};
export type ServiceLink={
 id:string; kind:'trip'|'goal'|'pot'|'document'|'chat';
 title:string; subtitle:string; action:ServiceLinkAction;
};

export function getFamilyServiceLinks(family:Family,viewerId:string):ServiceLink[]{
 if(!findMember(family,viewerId))return [];
 const manager=canManageFamily(family,viewerId);
 const result:ServiceLink[]=[];
 const trip=family.bookings.filter(b=>manager||b.travelerId===viewerId)
  .sort((a,b)=>a.date.localeCompare(b.date))[0];
 if(trip){
  result.push({id:`trip:${trip.id}`,kind:'trip',
   title:'Préparer un séjour familial',
   subtitle:`${trip.destination} · ${findMember(family,trip.travelerId)?.name||'Membre'} · Réservation fictive`,
   action:{route:'trip'}});
 }
 const goal=family.goals.find(g=>g.status==='active'&&/vacan|voyage|week.end|séjour/i.test(g.title)
  &&canViewSavingsGoal(family,viewerId,g));
 if(goal) result.push({
  id:`goal:${goal.id}`,kind:'goal',title:'Préparer votre projet de voyage',
  subtitle:`${goal.title} · Suivre l’épargne avant le départ`,
  action:{route:'goal',id:goal.id}
 });
 const pot=family.pots.find(p=>p.status==='active'&&
  (canViewFamilyPotHistory(family,viewerId,p)||canManageFamilyPot(family,viewerId,p)));
 if(pot)result.push({
  id:`pot:${pot.id}`,kind:'pot',title:'Organiser une cagnotte en famille',
  subtitle:`${pot.title} · Voir les contributions`,action:{route:'pot',id:pot.id}
 });
 const doc=family.documents.find(d=>canViewFamilyDocument(family,viewerId,d));
 if(doc)result.push({id:`doc:${doc.id}`,kind:'document',title:'Retrouver un document partagé',
  subtitle:`${doc.title} · Accès selon votre profil`,action:{route:'vault'}});
 // Le chat générique reste dans « Explorer tous les services » :
 // les suggestions ne dupliquent pas les entrées classiques du catalogue.
 return result.slice(0,4);
}
/** Les textes sont des brouillons sans montants, informations de comptes ni secrets. */
export function composeFamilyMessage(context:
 {kind:'goal'|'pot';title:string}|{kind:'trip';destination:string;travelerName:string}):string {
 const clean=(s:string)=>s.trim().replace(/\s+/g,' ').slice(0,90);
 if(context.kind==='trip')return `On organise notre séjour à ${clean(context.destination)} pour ${clean(context.travelerName)} ?`;
 if(context.kind==='goal')return `On fait un point ensemble sur notre projet « ${clean(context.title)} » ?`;
 return `On s'organise pour la cagnotte « ${clean(context.title)} » ?`;
}
export const canCreateFamilyBooking=(family:Family,viewerId:string,travelerId:string):boolean=>
 canBookFamilyTrip(family,viewerId)&&Boolean(findMember(family,travelerId));
