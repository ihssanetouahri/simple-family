import React, {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {ArrowLeft, Check, ChevronRight, LockKeyhole, MessageCircle, Plus,
 Search, Settings2, ShieldCheck, SquarePen, UserRound, Users, X} from 'lucide-react';
import {findMember, type Family} from '../model';
import {canManageFamily} from '../permissions';
import {canManageChatGroup, getVisibleChat, visibleChats, FAMILY_ROOM_ID} from './chatRules';

type Props={
 family:Family;viewerId:string;activeId:string|null;
 onOpen:(id:string)=>void;onInbox:()=>void;
 onDirect:(memberId:string)=>void;onGroup:(title:string,memberIds:string[])=>void;
 onEditGroup:(id:string,title:string,memberIds:string[])=>boolean;
};
type Sheet='new'|'direct'|'group'|'manage'|'settings'|null;
const tile='rounded-[22px] border border-[#EAE2F5] bg-white shadow-[0_5px_16px_rgba(70,30,130,0.04)]';
const purple='text-[#6729C9]';
function Avatar({name,group=false}:{name:string;group?:boolean}) {
 return <div className="w-12 h-12 shrink-0 rounded-full bg-[#EDE5FF] text-[#7130CE] flex items-center justify-center">
   {group?<Users size={21}/>:<span className="font-extrabold text-[15px]">{name.slice(0,1).toUpperCase()}</span>}
 </div>;
}

export function FamilyChatView({family,viewerId,activeId,onOpen,onInbox,onDirect,onGroup,onEditGroup}:Props){
 const [sheet,setSheet]=useState<Sheet>(null);
 const [search,setSearch]=useState('');
 const [selected,setSelected]=useState<string[]>([]);
 const [groupName,setGroupName]=useState('');
 const [error,setError]=useState('');
 const chats=visibleChats(family,viewerId);
 const active=activeId?getVisibleChat(family,viewerId,activeId):null;
 const eligible=Boolean(findMember(family,viewerId));
 const others=family.members.filter(m=>m.id!==viewerId);
 const editable=Boolean(active&&canManageChatGroup(family,viewerId,active.id));
 const manager=canManageFamily(family,viewerId);
 useEffect(()=>{setSheet(null);setError('');},[activeId,viewerId,family.id]);
 const open=(next:Sheet)=>{
   if(next==='group'){setSelected([]);setGroupName('');}
   if(next==='manage'&&active){setSelected(active.participantIds.filter(id=>id!==active.createdBy));setGroupName(active.title);}
   setError('');setSheet(next);
 };
 const submitGroup=()=>{
   if(groupName.trim().length<2){setError('Indiquez un nom pour le groupe (2 caractères minimum).');return;}
   if(selected.length<2){setError('Sélectionnez au moins deux autres membres.');return;}
   onGroup(groupName.trim(),selected);setSheet(null);
 };
 const submitEdit=()=>{
   if(!active||!editable)return;
   if(groupName.trim().length<2){setError('Indiquez un nom pour le groupe.');return;}
   if(!onEditGroup(active.id,groupName,selected)){setError('Ajoutez au moins un autre membre et vérifiez les autorisations.');return;}
   setSheet(null);
 };
 const toggle=(id:string)=>setSelected(prev=>prev.includes(id)?prev.filter(m=>m!==id):[...prev,id]);
 const matched=chats.filter(chat=>{
   const needle=(chat.title+' '+(chat.messages.at(-1)?.text||'')).toLocaleLowerCase('fr-FR');
   return needle.includes(search.trim().toLocaleLowerCase('fr-FR'));
 });
 if(!eligible)return <p className="text-[12px] text-[#81728F] p-5">Accès réservé aux membres de la famille.</p>;

 return <div className="space-y-4 pb-5 text-[#2B1D3C]">
 {active?<><div className={tile+' p-4 space-y-3'}>
    <div className="flex items-center gap-3">
      <button type="button" onClick={onInbox} aria-label="Toutes les discussions"
        className="w-9 h-9 shrink-0 rounded-full bg-[#F5F0FD] text-[#6D2CCE] flex items-center justify-center"><ArrowLeft size={18}/></button>
      <Avatar name={active.title} group={active.kind!=='direct'}/>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold text-[15px] truncate">{active.title}</p>
        <p className="text-[11px] text-[#80718E]">{active.kind==='direct'?'Discussion privée':`${active.participantIds.length} participants · ${active.kind==='family'?'Groupe principal':'Groupe privé'}`}</p>
      </div>
      {editable&&<button type="button" onClick={()=>open('manage')} aria-label="Gérer le groupe"
        className="w-10 h-10 flex justify-center items-center rounded-full bg-[#F2EAFF] text-[#6D28D4]"><Settings2 size={19}/></button>}
    </div>
    {active.kind==='direct'&&<div className="rounded-[13px] bg-[#F6F3FC] px-3 py-2 text-[11px] text-[#796B89] flex gap-2">
      <LockKeyhole size={15} className="shrink-0"/> Cette discussion est accessible uniquement à ses deux participants.
    </div>}
  </div>
  <div className="space-y-4 py-1 pb-3" aria-label={`Messages de ${active.title}`}>
    {active.messages.length===0&&<div className={tile+' p-6 text-center space-y-2'}>
      <MessageCircle className="text-[#7A37D8] mx-auto" size={26}/>
      <p className="text-[13px] font-bold">Votre discussion commence ici</p>
      <p className="text-[12px] text-[#827590]">Écrivez un premier message avec le champ en bas de l'écran.</p>
    </div>}
    {active.messages.map(msg=><div key={msg.id} className={`flex ${msg.authorId===viewerId?'justify-end':'justify-start'}`}>
      <div className={`rounded-[18px] max-w-[83%] px-3.5 py-2.5 ${msg.authorId===viewerId?'bg-[#6226D9] text-white rounded-br-sm':'bg-white border border-[#EBE3F5] text-[#352746] rounded-bl-sm'}`}>
        {active.kind!=='direct'&&<p className="text-[10px] font-bold opacity-70 mb-1">{findMember(family,msg.authorId)?.name||'Ancien membre'}</p>}
        <p className="text-[13px] break-words whitespace-pre-wrap">{msg.text}</p>
        <p className="text-[10px] opacity-60 text-right mt-1">{msg.date}</p>
      </div>
    </div>)}
  </div>
 </>:<>
  <div className={tile+' p-4'}>
    <div className="flex items-center justify-between gap-3">
      <div><h2 className="text-[20px] font-extrabold">Discussions</h2>
        <p className="text-[12px] text-[#857792] mt-1">Restez proches, même à distance.</p>
      </div>
      <button type="button" onClick={()=>open('new')} aria-label="Nouvelle discussion"
        className="h-11 w-11 rounded-full bg-[#6B2BDB] text-white flex items-center justify-center shadow-md">
        <SquarePen size={20}/>
      </button>
    </div>
    <label className="mt-4 rounded-[14px] flex gap-2 items-center h-11 px-3 bg-[#F6F3FB] border border-[#EAE3F3]">
      <Search size={17} className="text-[#9687A7]"/><span className="sr-only">Rechercher une discussion</span>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une discussion"
        className="bg-transparent text-[13px] text-[#322444] min-w-0 flex-1 outline-none placeholder:text-[#9487A1]"/>
    </label>
  </div>
  <div className="space-y-2">
    <div className="px-1 flex items-center justify-between"><h3 className="font-extrabold text-[16px]">Vos discussions</h3>
      <span className="text-[11px] text-[#91829D]">{matched.length} conversation{matched.length>1?'s':''}</span>
    </div>
    {matched.length===0?<div className={tile+' p-5 text-center text-[#82738D] text-[12px]'}>Aucune discussion trouvée.</div>:
    <div className={tile+' px-3 py-1'}>
      {matched.map((chat,i)=><React.Fragment key={chat.id}>
       {i>0&&<div className="border-t border-[#F0EAF7] mx-1"/>}
       <button type="button" onClick={()=>onOpen(chat.id)} className="w-full min-h-[76px] flex gap-3 items-center text-left py-3 rounded-xl hover:bg-[#F8F5FE] px-1">
        <Avatar name={chat.title} group={chat.kind!=='direct'}/>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-[14px] font-bold truncate">{chat.title}</p>
          <p className="text-[12px] text-[#80718E] truncate">
            {chat.messages.length? `${findMember(family,chat.messages.at(-1)?.authorId||'')?.name||'Membre'} : ${chat.messages.at(-1)?.text||''}`:
            chat.kind==='direct'?'Démarrer la conversation':'Aucun message pour le moment'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-[10px] text-[#92849F]">{chat.messages.at(-1)?.date||''}</span>
          <ChevronRight size={17} className="text-[#AB9CB9]"/>
        </div>
       </button>
      </React.Fragment>)}
    </div>}
  </div>
  <button type="button" onClick={()=>open('new')}
    className="w-full min-h-[46px] rounded-full bg-[#6B2BDB] text-white font-bold text-[13px] flex justify-center items-center gap-2">
    <Plus size={17}/> Nouvelle discussion
  </button>
  {manager&&<button type="button" onClick={()=>open('settings')}
    className="w-full rounded-[14px] border border-[#E8DFF3] min-h-[43px] text-[#6E2DCB] text-[12px] font-bold flex justify-center items-center gap-2">
    <ShieldCheck size={17}/> Paramètres des discussions
  </button>}
 </>}
 {sheet&&document.getElementById('simple-device-frame')&&createPortal(
   <div role="dialog" aria-modal="true" aria-label="Options des discussions"
    className="simple-family-interactions absolute inset-0 z-[90] bg-[#24143A]/40 flex items-end justify-center"
    onClick={()=>setSheet(null)}>
   <div onClick={e=>e.stopPropagation()} className="w-full max-w-[430px] max-h-[78vh] overflow-y-auto bg-white rounded-t-[28px] p-5 pb-8 space-y-4 shadow-xl">
    <div className="w-12 h-1 bg-[#E0D7ED] rounded-full mx-auto"/>
    <div className="flex items-center justify-between">
      <h3 className="font-extrabold text-[18px]">
        {sheet==='new'?'Nouvelle discussion':sheet==='direct'?'Message privé':sheet==='group'?'Créer un groupe':sheet==='manage'?'Gérer le groupe':'Paramètres des discussions'}
      </h3>
      <button type="button" aria-label="Fermer" onClick={()=>setSheet(null)} className="w-9 h-9 bg-[#F3EEFA] rounded-full flex items-center justify-center"><X size={19}/></button>
    </div>
    {sheet==='new'&&<div className="space-y-2">
       <button type="button" onClick={()=>open('direct')} className="flex w-full items-center gap-3 p-3 bg-[#F8F5FD] rounded-[18px] text-left">
        <span className="bg-[#EBE0FF] p-3 rounded-[14px] text-[#6D2CCE]"><UserRound size={21}/></span>
        <span className="flex-1"><b className="block text-[13px]">Envoyer un message privé</b><span className="text-[12px] text-[#80728E]">Discuter avec un membre de la famille</span></span><ChevronRight size={18}/>
       </button>
       <button type="button" onClick={()=>open('group')} className="flex w-full items-center gap-3 p-3 bg-[#F8F5FD] rounded-[18px] text-left">
        <span className="bg-[#EBE0FF] p-3 rounded-[14px] text-[#6D2CCE]"><Users size={21}/></span>
        <span className="flex-1"><b className="block text-[13px]">Créer un groupe</b><span className="text-[12px] text-[#80728E]">Réunir plusieurs membres de la famille</span></span><ChevronRight size={18}/>
       </button>
     </div>}
    {sheet==='direct'&&<div className="space-y-2">
      <p className="text-[12px] text-[#81728E]">Choisissez le membre avec qui discuter.</p>
      {others.map(m=><button type="button" key={m.id} onClick={()=>{onDirect(m.id);setSheet(null)}}
        className="flex items-center gap-3 w-full border-b border-[#F0EAF7] py-3 text-left">
        <Avatar name={m.name}/><span className="flex-1 text-[13px] font-bold">{m.name}</span><ChevronRight size={17} className={purple}/>
      </button>)}
    </div>}
    {(sheet==='group'||sheet==='manage')&&<div className="space-y-4">
      <label className="block space-y-1.5"><span className="font-bold text-[12px]">Nom du groupe</span>
        <input value={groupName} maxLength={60} onChange={e=>{setGroupName(e.target.value);setError('')}}
          placeholder="Ex. Voyage en famille" className="h-11 px-3 w-full rounded-xl border border-[#E8DDF7] bg-[#F8F5FD] text-[13px] outline-none focus:ring-2 focus:ring-[#AD85F0]"/>
      </label>
      <div className="space-y-1"><p className="font-bold text-[12px]">{sheet==='manage'?'Participants du groupe':'Choisir les participants'}</p>
      <p className="text-[11px] text-[#81738E]">{sheet==='manage'?'Le créateur reste dans son groupe.':'Choisissez au moins deux autres membres.'}</p>
      {family.members.filter(m=>sheet==='group'?m.id!==viewerId:m.id!==active?.createdBy).map(m=>
        <label key={m.id} className="flex items-center gap-3 py-2.5 border-b border-[#F1EBF7] cursor-pointer">
          <input type="checkbox" checked={selected.includes(m.id)} onChange={()=>{toggle(m.id);setError('')}}
           className="h-4 w-4 accent-[#7131DC]"/>
          <span className="text-[13px] flex-1 font-medium">{m.name}</span>
          {selected.includes(m.id)&&<Check size={16} className={purple}/>}
        </label>)}
      </div>
      {error&&<p role="alert" className="text-[12px] text-[#A13A55]">{error}</p>}
      <button type="button" onClick={sheet==='group'?submitGroup:submitEdit}
        className="w-full h-12 rounded-full bg-[#6E2DDB] text-white font-bold text-[13px]">
        {sheet==='group'?'Créer le groupe':'Enregistrer les modifications'}
      </button>
    </div>}
    {sheet==='settings'&&<div className="space-y-3 text-[12px] leading-relaxed text-[#6F6180]">
      <div className="flex gap-2 items-start rounded-[17px] bg-[#F5F0FE] p-3">
        <ShieldCheck size={18} className="shrink-0 text-[#7332CE]"/>
        <p><b>Contrôle des groupes.</b> Le créateur et les responsables qui participent à un groupe peuvent en gérer le nom et les membres.</p>
      </div>
      <div className="flex gap-2 items-start rounded-[17px] bg-[#F8F6FB] p-3">
        <LockKeyhole size={18} className="shrink-0 text-[#7332CE]"/>
        <p><b>Messages privés.</b> Un Leader ou Co-leader n'a pas accès automatiquement aux messages d'une discussion dont il n'est pas participant.</p>
      </div>
      <p>Les règles de supervision des enfants Simple One sont à confirmer avec les métiers. Aucun contrôle parental réel n'est activé ici.</p>
    </div>}
   </div>
 </div>,document.getElementById('simple-device-frame')!)}
 </div>;
}
