import { findMember, type Family } from '../model';

export function memberRemovalIssues(f:Family,id:string):string[] {
 if(!findMember(f,id))return ['Membre introuvable.'];
 const issues:string[]=[];
 const pocket=f.pockets.find(p=>p.ownerId===id);
 if(pocket && pocket.balance>0)issues.push('Vider la pocket du membre avant le retrait.');
 if(f.jointHolderIds?.includes(id)||f.jointApplication&&[f.jointApplication.requesterId,f.jointApplication.coHolderId].includes(id))
  issues.push('Résoudre les demandes et titularités du compte joint.');
 if(f.goals.some(g=>(g.status==='active'&&[g.ownerId,g.creatorId,...g.contributors].includes(id))||g.history.some(h=>h.memberId===id)))
  issues.push('Régler les objectifs d’épargne et préserver les contributions.');
 if(f.pots.some(p=>p.creatorId===id||p.members.includes(id)||p.contributions?.some(c=>c.memberId===id)))
  issues.push('Régler les cagnottes et contributions.');
 if(f.cards.some(c=>c.holderId===id&&c.active))issues.push('Suspendre les cartes du membre.');
 if(f.documents.some(d=>d.ownerId===id))issues.push('Réaffecter les documents appartenant au membre.');
 if(f.bookings.some(b=>b.travelerId===id)||f.creditRequests.some(r=>r.applicantId===id))
  issues.push('Traiter les réservations et demandes associées.');
 if((f.conversations||[]).some(room=>room.participantIds.includes(id)||
   room.messages.some(msg=>msg.authorId===id))||
   f.chat.some(msg=>msg.authorId===id))
  issues.push('Préserver les discussions et historiques liés au membre avant son retrait.');
 return issues;
}
