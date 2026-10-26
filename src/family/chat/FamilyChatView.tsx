import React, {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {Check, ChevronRight, LockKeyhole, MessageCircle, MoreHorizontal,
 Search, ShieldCheck, UserRound, Users, X} from 'lucide-react';
import {findMember, type Family} from '../model';
import {canManageFamily} from '../permissions';
import {canManageChatGroup, getVisibleChat, visibleChats} from './chatRules';
import lamiaAvatar from '../../assets/images/lamia_avatar.jpg';
import karimAvatar from '../../assets/images/karim.jpg';
import yasmineAvatar from '../../assets/images/yasmine.jpg';

type Props={
 family:Family;viewerId:string;activeId:string|null;createSignal:number;manageSignal:number;
 onOpen:(id:string)=>void;
 onDirect:(memberId:string)=>void;onGroup:(title:string,memberIds:string[])=>void;
 onEditGroup:(id:string,title:string,memberIds:string[])=>boolean;
};
type Sheet='new'|'direct'|'group'|'manage'|'settings'|null;
const purple='text-[#6729C9]';
const portraits:Record<string,string>={lamia:lamiaAvatar,karim:karimAvatar,yasmine:yasmineAvatar};
function Avatar({name,group=false,memberId,size=52}:{name:string;group?:boolean;memberId?:string;size?:number}) {
 const src=!group&&memberId?portraits[memberId]:undefined;
 return <div style={{width:size,height:size}} className="shrink-0 rounded-full overflow-hidden bg-[#E9DFFF] text-[#7130CE] flex items-center justify-center">
   {src?<img src={src} alt="" className="h-full w-full object-cover"/>:
    group?<Users size={size>44?23:18}/>:
    <span className="font-extrabold text-[16px]">{name.slice(0,1).toUpperCase()}</span>}
 </div>;
}

export function FamilyChatView({family,viewerId,activeId,createSignal,manageSignal,onOpen,onDirect,onGroup,onEditGroup}:Props){
 const [sheet,setSheet]=useState<Sheet>(null);
 const [search,setSearch]=useState('');
 const [selected,setSelected]=useState<string[]>([]);
 const [groupName,setGroupName]=useState('');
 const [error,setError]=useState('');
 const lastCreateSignal=React.useRef(createSignal);
 const lastManageSignal=React.useRef(manageSignal);
 const chats=visibleChats(family,viewerId);
 const active=activeId?getVisibleChat(family,viewerId,activeId):null;
 const eligible=Boolean(findMember(family,viewerId));
 const others=family.members.filter(m=>m.id!==viewerId);
 const editable=Boolean(active&&canManageChatGroup(family,viewerId,active.id));
 const manager=canManageFamily(family,viewerId);
 useEffect(()=>{setSheet(null);setError('');},[activeId,viewerId,family.id]);
 useEffect(()=>{
   if(createSignal!==lastCreateSignal.current&&!activeId){
     setSheet('new');setError('');
   }
   lastCreateSignal.current=createSignal;
 },[createSignal,activeId]);
 useEffect(()=>{
   if(manageSignal!==lastManageSignal.current&&active&&editable){
     setSelected(active.participantIds.filter(id=>id!==active.createdBy));
     setGroupName(active.title);setError('');setSheet('manage');
   }
   lastManageSignal.current=manageSignal;
 },[manageSignal,activeId]);
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
 {active?<div className="space-y-4">
   {active.kind==='group'&&editable&&<button type="button" onClick={()=>open('manage')}
     className="w-full flex items-center justify-between rounded-xl bg-[#F4EEFF] px-3 py-2.5 text-[#6E2EC9] text-[12px] font-semibold">
      <span>{active.participantIds.length} participants · Gérer le groupe</span>
      <ChevronRight size={16}/>
   </button>}
   {active.kind==='direct'&&<p className="text-center text-[11px] text-[#857892]">
     Discussion entre vous et {active.title}
   </p>}
   <div className="space-y-4 py-1 pb-3" aria-label={`Messages de ${active.title}`}>
     {active.messages.length===0&&<div className="py-12 text-center space-y-2">
       <div className="mx-auto w-14 h-14 rounded-full bg-[#EDE4FE] text-[#7835DE] flex items-center justify-center"><MessageCircle size={26}/></div>
       <p className="text-[14px] font-bold">Commencez la discussion</p>
       <p className="text-[12px] text-[#827590]">Envoyez votre premier message.</p>
     </div>}
     {active.messages.map(msg=><div key={msg.id} className={`flex ${msg.authorId===viewerId?'justify-end':'justify-start'}`}>
       <div className={`rounded-[18px] max-w-[83%] px-3.5 py-2.5 ${msg.authorId===viewerId?'bg-[#6226D9] text-white rounded-br-sm':'bg-white border border-[#EBE3F5] text-[#352746] rounded-bl-sm'}`}>
         {active.kind!=='direct'&&<p className="text-[10px] font-bold opacity-70 mb-1">{findMember(family,msg.authorId)?.name||'Ancien membre'}</p>}
         <p className="text-[13px] break-words whitespace-pre-wrap">{msg.text}</p>
         <p className="text-[10px] opacity-60 text-right mt-1">{msg.date}</p>
       </div>
     </div>)}
   </div>
 </div>:<>
   <label className="flex gap-2.5 items-center h-[46px] px-4 rounded-full bg-white border border-[#EAE2F4] shadow-[0_2px_10px_rgba(52,22,110,0.025)]">
     <Search size={19} className="text-[#91849F] shrink-0"/>
     <span className="sr-only">Rechercher une conversation</span>
     <input value={search} onChange={e=>setSearch(e.target.value)}
       placeholder="Rechercher une conversation"
       className="bg-transparent text-[13px] text-[#322444] min-w-0 flex-1 outline-none placeholder:text-[#8C8099]"/>
   </label>
   <div className="flex items-center justify-between min-h-[30px] px-1">
     <p className="text-[12px] text-[#857892]">{matched.length} conversation{matched.length>1?'s':''}</p>
     {manager&&<button type="button" onClick={()=>open('settings')}
       aria-label="Paramètres des discussions"
       className="h-9 w-9 flex items-center justify-center rounded-full text-[#857295] hover:bg-[#EDE5FC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7833DA]">
       <MoreHorizontal size={21}/>
     </button>}
   </div>
   {matched.length===0?<div className="py-12 text-center text-[13px] text-[#81738D]">
     Aucune conversation trouvée.
   </div>:<div className="-mx-5" role="list" aria-label="Discussions accessibles">
     {matched.map((chat,i)=>{
       const last=chat.messages.at(-1);
       const author=last?findMember(family,last.authorId):undefined;
       const other=chat.kind==='direct'?chat.participantIds.find(id=>id!==viewerId):undefined;
       const preview=last?
         (chat.kind==='direct'?(last.authorId===viewerId?'Vous : ': ''):
           `${last.authorId===viewerId?'Vous':author?.name||'Membre'} : `)+last.text:
         (chat.kind==='direct'?'Commencer la discussion':'Aucun message pour le moment');
       return <React.Fragment key={chat.id}>
         <button type="button" role="listitem" onClick={()=>onOpen(chat.id)}
           className="w-full flex items-center text-left gap-3 min-h-[78px] px-5 py-3 hover:bg-white/65 active:bg-[#EEE7FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7833DA]">
           <Avatar name={chat.title} memberId={other} group={chat.kind!=='direct'}/>
           <span className="flex-1 min-w-0">
             <span className="flex items-baseline justify-between gap-2">
               <span className="text-[14px] font-bold leading-snug text-[#281938] truncate">{chat.title}</span>
               <span className="text-[11px] text-[#8F839B] shrink-0 tabular-nums">{last?.date||''}</span>
             </span>
             <span className="block text-[12px] leading-snug text-[#81768F] truncate mt-1.5">{preview}</span>
           </span>
         </button>
         {i<matched.length-1&&<div className="border-t border-[#E9E3F1] ml-[88px] mr-5"/>}
       </React.Fragment>;
     })}
   </div>}
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
