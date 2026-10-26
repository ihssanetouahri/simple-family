/** Simulations de discussions familiales — accès déterminé par la participation.
 * Aucun rôle Leader/Co-leader ne donne automatiquement accès à un chat privé.
 */
import {findMember, uid, type ChatMsg, type Family, type FamilyConversation} from '../model';
import {canManageFamily} from '../permissions';

export const FAMILY_ROOM_ID='family-main';
export type VisibleChat={id:string;kind:'family'|'direct'|'group';title:string;
 participantIds:string[];createdBy?:string;messages:ChatMsg[];updatedAt:number};

export function visibleChats(family:Family,viewerId:string):VisibleChat[]{
 if(!findMember(family,viewerId))return [];
 const familyRoom:VisibleChat={id:FAMILY_ROOM_ID,kind:'family',title:family.name,
  participantIds:family.members.map(m=>m.id),createdBy:family.members.find(m=>m.role==='leader')?.id,
  messages:family.chat,updatedAt:0};
 const others=(family.conversations||[]).filter(room=>
  room.participantIds.includes(viewerId)&&room.participantIds.every(id=>Boolean(findMember(family,id))))
  .map(room=>({...room,title:room.kind==='direct'
    ?(findMember(family,room.participantIds.find(id=>id!==viewerId)||'')?.name||'Membre'):room.title}));
 return [familyRoom,...others.sort((a,b)=>b.updatedAt-a.updatedAt)];
}
export function getVisibleChat(family:Family,viewerId:string,id:string):VisibleChat|null {
 return visibleChats(family,viewerId).find(room=>room.id===id)||null;
}
export function startDirectChat(family:Family,viewerId:string,otherId:string,createdId?:string):string|null {
 if(!findMember(family,viewerId)||!findMember(family,otherId)||otherId===viewerId)return null;
 const same=(family.conversations||[]).find(room=>room.kind==='direct'&&
  room.participantIds.length===2&&room.participantIds.includes(viewerId)&&room.participantIds.includes(otherId));
 if(same)return same.id;
 const created:FamilyConversation={id:createdId||uid('direct'),kind:'direct',title:'',createdBy:viewerId,
  participantIds:[viewerId,otherId],messages:[],updatedAt:Date.now()};
 (family.conversations??=[]).unshift(created);
 return created.id;
}
export function createGroupChat(family:Family,viewerId:string,title:string,invitees:string[],createdId?:string):string|null {
 if(!findMember(family,viewerId)||!title.trim()||title.trim().length>60)return null;
 const participantIds=[viewerId,...new Set(invitees.filter(id=>id!==viewerId))];
 if(participantIds.length<3||participantIds.some(id=>!findMember(family,id)))return null;
 const group:FamilyConversation={id:createdId||uid('group'),kind:'group',title:title.trim(),
  createdBy:viewerId,participantIds,messages:[],updatedAt:Date.now()};
 (family.conversations??=[]).unshift(group);
 return group.id;
}
export function canManageChatGroup(family:Family,viewerId:string,id:string):boolean {
 const room=(family.conversations||[]).find(r=>r.id===id&&r.kind==='group');
 return Boolean(room&&room.participantIds.includes(viewerId)&&
  (room.createdBy===viewerId||canManageFamily(family,viewerId)));
}
export function updateChatGroup(family:Family,viewerId:string,id:string,title:string,members:string[]):boolean {
 const room=(family.conversations||[]).find(r=>r.id===id&&r.kind==='group');
 if(!room||!canManageChatGroup(family,viewerId,id)||!title.trim()||title.trim().length>60)return false;
 const participantIds=[room.createdBy,...new Set(members.filter(memberId=>memberId!==room.createdBy))];
 if(participantIds.length<2||participantIds.some(memberId=>!findMember(family,memberId)))return false;
 room.title=title.trim();room.participantIds=participantIds;room.updatedAt=Date.now();
 return true;
}
export function sendChatMessage(family:Family,viewerId:string,id:string,text:string):boolean {
 const content=text.trim();
 if(!content||content.length>1000||!getVisibleChat(family,viewerId,id))return false;
 const message:ChatMsg={id:uid('msg'),authorId:viewerId,text:content,
   date:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),createdAt:Date.now()};
 if(id===FAMILY_ROOM_ID)family.chat.push(message);
 else {
  const conversation=(family.conversations||[]).find(room=>room.id===id);
  if(!conversation)return false;
  conversation.messages.push(message);conversation.updatedAt=Date.now();
 }
 return true;
}
