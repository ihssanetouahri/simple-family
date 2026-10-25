import React from 'react';
import {
  ArrowDownLeft, ArrowRight, ArrowUpRight, ChevronRight,
  CreditCard, LockKeyhole, Plus, ShieldCheck, Target, WalletCards
} from 'lucide-react';
import { avatarFor, currency, findMember, roleLabel, type Family } from '../model';
import {
  canManageFamily, canManagePocketCards, canOperatePocket,
  canViewFamilyAccount, canViewJointAccount, canViewPocket
} from '../permissions';
import {
  getMemberPocketMovements, getMemberVisibleCards, getMemberVisibleGoals
} from './memberSelectors';
import lamiaAvatar from '../../assets/images/lamia_avatar.jpg';
import karimAvatar from '../../assets/images/karim.jpg';
import yasmineAvatar from '../../assets/images/yasmine.jpg';

type Props = {
 family:Family;
 memberId:string;
 viewerId:string;
 showAmounts:boolean;
 onPocket:()=>void;
 onTopup:()=>void;
 onTransfer:()=>void;
 onCards:()=>void;
 onGoal:(id:string)=>void;
 onPermissions:()=>void;
};

const photos:Record<string,string>={lamia:lamiaAvatar,karim:karimAvatar,yasmine:yasmineAvatar};
const surface='rounded-[24px] bg-white border border-[#EAE2F5] shadow-[0_5px_16px_rgba(72,30,132,0.05)]';
function MemberAvatar({id,name,size=66}:{id:string;name:string;size?:number}) {
 const photo=photos[avatarFor(id)];
 return <div style={{width:size,height:size}} className="shrink-0 rounded-full border-[3px] border-white shadow-sm overflow-hidden bg-[#E9DDFF] text-[#6729BA] flex items-center justify-center font-extrabold">
  {photo?<img src={photo} alt="" className="w-full h-full object-cover"/>:<span style={{fontSize:size/3}}>{name.charAt(0)}</span>}
 </div>;
}
function Heading({children,description}:{children:React.ReactNode;description?:string}) {
 return <div className="px-1 space-y-1"><h3 className="text-[17px] leading-tight font-extrabold text-[#271738]">{children}</h3>{description&&<p className="text-[11px] text-[#8A7C96]">{description}</p>}</div>;
}
function PermissionRow({label,allowed,detail}:{label:string;allowed:boolean;detail?:string}) {
 return <div className="py-3 flex items-center justify-between gap-3 border-b border-[#F1EBF7] last:border-0">
  <div className="min-w-0 flex-1"><p className="text-[12px] font-semibold text-[#332545]">{label}</p>{detail&&<p className="text-[10px] mt-1 text-[#8D809B]">{detail}</p>}</div>
  <div className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${allowed?'bg-[#E9F7EF] text-[#19875E]':'bg-[#F3F0F6] text-[#847990]'}`}>{allowed?'Autorisé':'Non autorisé'}</div>
 </div>;
}

export function MemberProfile({family,memberId,viewerId,showAmounts,onPocket,onTopup,onTransfer,onCards,onGoal,onPermissions}:Props) {
 const member=findMember(family,memberId);
 if(!member) return <section className={surface+' p-5 text-[13px] text-[#86798F]'}>Ce membre n'appartient plus à la famille.</section>;
 const manager=canManageFamily(family,viewerId);
 const self=viewerId===memberId;
 const canSeeMemberPocket=canViewPocket(family,viewerId,memberId);
 const canOperate=canOperatePocket(family,viewerId,memberId);
 const pocket=family.pockets.find(p=>p.ownerId===memberId);
 const cards=getMemberVisibleCards(family,viewerId,memberId);
 const movements=getMemberPocketMovements(family,viewerId,memberId);
 const goals=getMemberVisibleGoals(family,viewerId,memberId);
 const hasFamilyAccess=canViewFamilyAccount(family,memberId);
 const hasJointAccess=canViewJointAccount(family,memberId);
 const canManageCards=canManagePocketCards(family,viewerId,memberId);
 const money=(value:number)=>showAmounts?currency(value):'•••• DH';
 const maxPercentage=pocket?.limit?Math.min(100,Math.max(0,pocket.balance/pocket.limit*100)):0;
 return <div className="space-y-5 pb-3">
  <section className={surface+' p-5 relative overflow-hidden'}>
   <div aria-hidden="true" className="absolute top-0 right-0 h-28 w-28 rounded-full bg-[#F1E7FF] blur-2xl translate-x-8 -translate-y-9"/>
   <div className="relative flex items-center gap-3">
    <MemberAvatar id={member.id} name={member.name}/>
    <div className="min-w-0 flex-1">
     <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#906EBB]">Membre de la famille</p>
     <h2 className="text-[22px] font-extrabold text-[#241531] leading-tight mt-1">{member.name}</h2>
     <p className="text-[12px] text-[#887C97] mt-1">{member.relation}{self?' · Vous':''}</p>
    </div>
   </div>
   <div className="flex flex-wrap gap-2 mt-4">
    <span className="rounded-full bg-[#F1EAFE] text-[#6730C2] px-3 py-1.5 text-[11px] font-bold">{roleLabel(member.role)}</span>
    <span className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${member.simpleOne?'bg-[#FFF1DA] text-[#A76D18]':'bg-[#F6F2FB] text-[#736284]'}`}>{member.simpleOne?'Simple One':'Simple'}</span>
   </div>
   {member.simpleOne&&manager&&<div className="mt-4 flex items-start gap-2 bg-[#F8F4FF] rounded-[15px] p-3 text-[11px] leading-relaxed text-[#6F568B]">
    <ShieldCheck size={16} className="shrink-0 text-[#7431D7]"/>Compte Simple One : suivi et opérations selon les droits familiaux. Les plafonds bancaires spécifiques restent à confirmer.
   </div>}
  </section>

  <section className="space-y-3">
   <Heading description="Un espace dédié à chaque membre, avec des actions adaptées à vos droits.">Sa pocket</Heading>
   {pocket&&canSeeMemberPocket?
    <div className="rounded-[25px] bg-gradient-to-br from-[#35106C] to-[#7537DF] p-5 text-white shadow-[0_9px_25px_rgba(65,22,129,0.16)]">
     <div className="flex items-center justify-between">
      <div className="flex items-center gap-2"><WalletCards size={20}/><span className="text-[12px] font-bold">Pocket {member.name}</span></div>
      <button type="button" aria-label={`Voir le détail de la pocket de ${member.name}`} onClick={onPocket} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25"><ArrowUpRight size={17}/></button>
     </div>
     <p className="text-white/70 text-[11px] mt-5">Solde disponible</p>
     <p className="text-[29px] font-extrabold mt-1 tracking-tight">{money(pocket.balance)}</p>
     <div className="flex justify-between gap-2 items-center mt-4 mb-2"><span className="text-[11px] text-white/75">Plafond indicatif</span><span className="text-[11px] font-semibold">{money(pocket.limit)}</span></div>
     <div className="h-2 rounded-full bg-white/20 overflow-hidden"><div style={{width:`${maxPercentage}%`}} className="h-full rounded-full bg-white"/></div>
     <div className="grid grid-cols-2 gap-2.5 mt-5">
      <button type="button" disabled={!canOperate} onClick={onTopup} className="min-h-[43px] bg-white text-[#5E26B5] rounded-full text-[12px] font-extrabold flex justify-center items-center gap-2 disabled:opacity-50"><Plus size={16}/>Alimenter</button>
      <button type="button" disabled={!canOperate} onClick={onTransfer} className="min-h-[43px] bg-white/15 text-white border border-white/35 rounded-full text-[12px] font-bold flex justify-center items-center gap-2 disabled:opacity-40"><ArrowRight size={16}/>Transférer</button>
     </div>
     <button type="button" onClick={onPocket} className="w-full flex items-center justify-center gap-1 text-white/90 text-[11px] font-bold mt-4">Voir les détails de la pocket <ChevronRight size={14}/></button>
    </div>
    :<div className={surface+' px-4 py-5 flex items-center gap-3'}>
      <LockKeyhole size={20} className="text-[#84738F] shrink-0"/><p className="text-[12px] leading-relaxed text-[#83768E]">{!pocket?'Aucune pocket associée à ce membre.':'La consultation de cette pocket est réservée à son propriétaire et aux responsables de la famille.'}</p>
    </div>}
  </section>

  <section className="space-y-3">
   <Heading description="Cartes auxquelles votre profil peut accéder.">Cartes virtuelles</Heading>
   <div className={surface+' px-4'}>
    {cards.length?cards.map(card=><div key={card.id} className="flex items-center gap-3 py-3.5 border-b last:border-0 border-[#F1EBF7]">
      <div className="w-11 h-11 bg-[#F2EAFD] text-[#702AD2] rounded-[15px] flex items-center justify-center shrink-0"><CreditCard size={21}/></div>
      <div className="flex-1 min-w-0"><p className="font-extrabold text-[12px] text-[#30203D] truncate">{card.label}</p><p className="text-[11px] text-[#897C99] mt-1">•••• {card.last4}</p></div>
      <span className={`text-[10px] px-2.5 py-1.5 rounded-full font-bold ${card.active?'bg-[#E7F8EF] text-[#168761]':'bg-[#F2F0F5] text-[#82768B]'}`}>{card.active?'Active':'Suspendue'}</span>
    </div>):<div className="py-5 flex gap-3 items-center text-[12px] text-[#82758F]">
      <CreditCard size={19} className="shrink-0"/>Aucune carte visible pour ce membre.
    </div>}
    {(canManageCards||cards.length>0)&&<button type="button" onClick={onCards} className="w-full border-t border-[#F1EBF7] py-3 text-[12px] text-[#6830CE] font-extrabold flex justify-between items-center">
      {canManageCards?'Gérer les cartes':'Consulter les cartes'} <ChevronRight size={17}/>
    </button>}
   </div>
  </section>

  <section className="space-y-3">
   <Heading description="Uniquement les mouvements associés à cette pocket.">Activité récente</Heading>
   <div className={surface+' px-4'}>
    {canSeeMemberPocket&&movements.length>0?movements.slice(0,4).map(item=><div key={item.id} className="flex items-center gap-3 py-3.5 border-b last:border-0 border-[#F0EBF6]">
      <span className="w-10 h-10 rounded-[14px] bg-[#F3EDFD] text-[#7130D6] flex items-center justify-center shrink-0">{item.signedAmount>=0?<ArrowDownLeft size={19}/>:<ArrowUpRight size={19}/>}</span>
      <div className="min-w-0 flex-1"><p className="text-[12px] font-bold text-[#332443] truncate">{item.title}</p><p className="text-[10px] text-[#8D809A] mt-1">{item.date} · {item.category}</p></div>
      <span className={`text-[12px] font-extrabold shrink-0 ${item.signedAmount>=0?'text-[#169668]':'text-[#31233E]'}`}>{showAmounts?(item.signedAmount>=0?'+':'−')+currency(Math.abs(item.signedAmount)):'•••• DH'}</span>
    </div>):
    <p className="text-[12px] text-[#857990] py-5">{canSeeMemberPocket?'Aucun mouvement de pocket à afficher.':'Activité non accessible avec votre profil.'}</p>}
   </div>
  </section>

  {goals.length>0&&<section className="space-y-3">
   <Heading>Ses objectifs d’épargne</Heading>
   <div className={surface+' px-4'}>
    {goals.map(goal=><button key={goal.id} type="button" onClick={()=>onGoal(goal.id)} className="flex w-full items-center gap-3 py-3.5 border-b last:border-0 border-[#F0EBF6] text-left">
      <div className="w-10 h-10 rounded-[14px] bg-[#F0EBFC] text-[#7130D3] flex justify-center items-center shrink-0"><Target size={19}/></div>
      <div className="min-w-0 flex-1"><p className="text-[12px] font-bold text-[#31213E]">{goal.title}</p><p className="text-[11px] text-[#877A92] mt-1">{Math.round(goal.target>0?goal.balance/goal.target*100:0)} % atteint · {goal.status==='closed'?'Clôturé':'En cours'}</p></div>
      <ChevronRight size={17} className="text-[#9B8BAF]"/>
    </button>)}
   </div>
  </section>}

  <section className="space-y-3">
   <Heading description="Des autorisations liées au rôle et aux comptes, distinctes des autres membres.">Droits et accès</Heading>
   <div className={surface+' px-4'}>
    <PermissionRow label="Consulter sa pocket" allowed={canSeeMemberPocket} detail="Accès depuis votre profil de démonstration"/>
    <PermissionRow label="Effectuer des opérations sur sa pocket" allowed={canOperate}/>
    <PermissionRow label="Consulter le Sous-compte Famille" allowed={hasFamilyAccess} detail="Droit du membre présenté, selon sa famille"/>
    {family.joint&&<PermissionRow label="Être cotitulaire du Compte joint" allowed={hasJointAccess} detail="Réservé au couple désigné"/>}
   </div>
   {manager&&<button type="button" onClick={onPermissions} className="text-[#6730CB] font-bold text-[12px] flex items-center gap-2 px-1 py-1"><ShieldCheck size={17}/>Gérer les autorisations de la famille <ChevronRight size={15}/></button>}
   <div className="bg-[#F4F0FB] rounded-[16px] p-3 flex gap-2.5 text-[#7A6E8B] text-[11px] leading-relaxed">
    <LockKeyhole size={17} className="shrink-0 text-[#7A50BC]"/><p>Ce profil utilise des données fictives. Les plafonds Simple One et les autorisations bancaires réelles restent soumis aux règles de la banque.</p>
   </div>
  </section>
 </div>;
}
