import React, { useState } from 'react';
import {
  ArrowDownLeft, ArrowRight, ArrowUpRight, ChevronDown, ChevronRight, CreditCard,
  Info, LockKeyhole, Plus, Settings2, ShieldCheck, WalletCards
} from 'lucide-react';
import { avatarFor, currency, findMember, type Family } from '../model';
import { canManageFamily, canOperatePocket, canViewPocket } from '../permissions';
import { getMemberPocketMovements, getMemberVisibleCards } from '../members/memberSelectors';
import { pocketSupervision } from './pocketRules';
import lamiaAvatar from '../../assets/images/lamia_avatar.jpg';
import karimAvatar from '../../assets/images/karim.jpg';
import yasmineAvatar from '../../assets/images/yasmine.jpg';

type Props={
  family:Family; ownerId:string; viewerId:string; showAmounts:boolean;
  onTopup:()=>void; onTransfer:()=>void; onCards:()=>void; onLimit:()=>void; onProfile:()=>void;
};
type HistoryFilter='all'|'incoming'|'outgoing';
const photos:Record<string,string>={lamia:lamiaAvatar,karim:karimAvatar,yasmine:yasmineAvatar};
const box='rounded-[23px] bg-white border border-[#EAE2F5] shadow-[0_5px_16px_rgba(72,30,132,0.05)]';
function MiniHeading({title,sub}:{title:string;sub?:string}) {
 return <div className="px-1"><h3 className="text-[17px] font-extrabold text-[#251935]">{title}</h3>{sub&&<p className="text-[11px] text-[#867892] mt-1">{sub}</p>}</div>;
}

export function PocketDetail({family,ownerId,viewerId,showAmounts,onTopup,onTransfer,onCards,onLimit,onProfile}:Props) {
 const [filter,setFilter]=useState<HistoryFilter>('all');
 const [expanded,setExpanded]=useState(false);
 const [selectedMovement,setSelectedMovement]=useState<string|null>(null);
 const owner=findMember(family,ownerId);
 const pocket=family.pockets.find(p=>p.ownerId===ownerId);
 const accessible=Boolean(owner&&pocket&&canViewPocket(family,viewerId,ownerId));
 const manager=canManageFamily(family,viewerId);
 const canOperate=canOperatePocket(family,viewerId,ownerId);
 const supervision=pocketSupervision(family,viewerId,ownerId);
 if(!owner||!pocket)return <section className={box+' p-5 text-[13px] text-[#81748E]'}>Cette pocket n'est plus disponible.</section>;
 if(!accessible)return <section className={box+' p-5 flex items-center gap-3 text-[12px] text-[#81748E]'}><LockKeyhole size={22}/>Vous n'avez pas accès à la pocket de ce membre.</section>;
 const movements=getMemberPocketMovements(family,viewerId,ownerId);
 const filtered=movements.filter(m=>filter==='all'||(filter==='incoming'?m.signedAmount>=0:m.signedAmount<0));
 const visible=expanded?filtered:filtered.slice(0,4);
 const linkedCards=getMemberVisibleCards(family,viewerId,ownerId).filter(c=>
   c.source===pocket.id||c.source===`pocket:${ownerId}`);
 const activeCards=linkedCards.filter(c=>c.active);
 const balance=(n:number)=>showAmounts?currency(n):'•••• DH';
 const photo=photos[avatarFor(ownerId)];
 return <div className="space-y-5 pb-3">
  <section className="relative overflow-hidden rounded-[25px] bg-gradient-to-br from-[#341071] to-[#7335E3] p-5 text-white shadow-[0_10px_30px_rgba(71,23,137,0.15)]">
   <div className="flex gap-3 items-center">
    <div className="w-[51px] h-[51px] shrink-0 rounded-full border-[3px] border-white/75 overflow-hidden bg-white/20 flex items-center justify-center font-bold">
     {photo?<img src={photo} className="w-full h-full object-cover" alt=""/>:owner.name.charAt(0)}
    </div>
    <div className="flex-1 min-w-0"><span className="text-[11px] text-white/70">Pocket personnelle</span><h2 className="text-[20px] font-extrabold mt-0.5">{owner.name}</h2></div>
    {owner.simpleOne&&<span className="rounded-full bg-white/20 px-3 py-1.5 text-[10px] font-bold">Simple One</span>}
   </div>
   <p className="text-[11px] text-white/75 mt-6">Solde disponible</p>
   <p className="text-[30px] font-extrabold tracking-tight mt-0.5">{balance(pocket.balance)}</p>
   <div className="border-t border-white/20 mt-5 pt-3 flex justify-between items-start gap-2">
    <div><p className="text-[10px] text-white/70">Plafond de virement sortant (démo)</p><p className="text-[14px] font-extrabold mt-1">{balance(pocket.limit)} / opération</p></div>
    <ShieldCheck size={21} className="text-white/85 shrink-0"/>
   </div>
  </section>

  <div className="grid grid-cols-2 gap-3">
   <button type="button" disabled={!canOperate} onClick={onTopup} className="rounded-full min-h-[46px] bg-[#6726D5] text-white font-bold text-[13px] flex items-center justify-center gap-2 disabled:opacity-40"><Plus size={17}/>Alimenter</button>
   <button type="button" disabled={!canOperate} onClick={onTransfer} className="rounded-full min-h-[46px] bg-[#EDE5FC] text-[#6329C7] font-bold text-[13px] flex items-center justify-center gap-2 disabled:opacity-40"><ArrowRight size={17}/>Transférer</button>
  </div>

  <section className="space-y-3">
   <MiniHeading title="Cartes associées" sub="Seules les cartes de cette pocket sont affichées."/>
   <div className={box+' px-4'}>
    <div className="flex items-center gap-3 py-4">
     <span className="w-11 h-11 rounded-[16px] bg-[#F1E9FE] text-[#7031D6] flex items-center justify-center"><CreditCard size={21}/></span>
     <div className="min-w-0 flex-1"><p className="font-bold text-[13px]">{linkedCards.length} carte{linkedCards.length>1?'s':''} virtuelle{linkedCards.length>1?'s':''}</p><p className="text-[11px] text-[#8A7D96] mt-1">{activeCards.length} active{activeCards.length>1?'s':''} · {linkedCards.length-activeCards.length} suspendue{linkedCards.length-activeCards.length>1?'s':''}</p></div>
     <button type="button" aria-label="Voir les cartes de cette pocket" onClick={onCards} className="w-9 h-9 rounded-full bg-[#F1E9FE] text-[#7130CF] flex items-center justify-center"><ChevronRight size={19}/></button>
    </div>
    {linkedCards.map(card=><div key={card.id} className="py-3 border-t border-[#F1EAF8] flex gap-3 items-center">
     <div className="flex-1 min-w-0"><p className="font-bold text-[12px] truncate">{card.label}</p><p className="text-[#897B97] text-[11px] mt-0.5">•••• {card.last4}</p></div>
     <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${card.active?'bg-[#E9F8EF] text-[#168861]':'bg-[#F2EEF7] text-[#82758E]'}`}>{card.active?'Active':'Suspendue'}</span>
    </div>)}
   </div>
  </section>

  <section className="space-y-3">
   <MiniHeading title="Historique des mouvements" sub="Uniquement les virements et paiements enregistrés sur cette pocket."/>
   <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les mouvements">
    {([{id:'all',label:'Tous'},{id:'incoming',label:'Entrées'},{id:'outgoing',label:'Sorties'}] as const).map(item=>
     <button key={item.id} type="button" aria-pressed={filter===item.id} onClick={()=>{setFilter(item.id);setExpanded(false);setSelectedMovement(null);}} className={`px-3.5 py-2 rounded-full border text-[11px] font-bold ${filter===item.id?'bg-[#6E2BDC] text-white border-[#6E2BDC]':'bg-white text-[#746585] border-[#E8DFF4]'}`}>{item.label}</button>)}
   </div>
   <div className={box+' px-4'}>
    {visible.length?visible.map(item=>{
      const tx=family.transactions.find(t=>t.id===item.id);
      return <div key={item.id} className="border-b border-[#F0EAF7] last:border-0">
       <button type="button" onClick={()=>setSelectedMovement(selectedMovement===item.id?null:item.id)} aria-expanded={selectedMovement===item.id} className="w-full text-left flex gap-3 items-center py-3.5">
        <span className="w-10 h-10 rounded-[14px] bg-[#F2EBFD] text-[#722AD8] shrink-0 flex items-center justify-center">{item.signedAmount>=0?<ArrowDownLeft size={18}/>:<ArrowUpRight size={18}/>}</span>
        <span className="flex-1 min-w-0"><span className="block text-[12px] font-bold truncate">{item.title}</span><span className="block text-[10px] text-[#86798D] mt-1">{item.date} · {item.category}</span></span>
        <span className={`text-[12px] font-extrabold whitespace-nowrap ${item.signedAmount>=0?'text-[#138D62]':'text-[#36263F]'}`}>{showAmounts?(item.signedAmount>=0?'+':'−')+currency(Math.abs(item.signedAmount)):'•••• DH'}</span>
        <ChevronDown size={16} className="text-[#9F91AA] shrink-0"/>
       </button>
       {selectedMovement===item.id&&tx&&<div className="bg-[#F8F5FC] rounded-[15px] p-3 mb-3 space-y-1.5 text-[11px] text-[#736484]">
        <p><strong className="text-[#382548]">Catégorie :</strong> {tx.category}</p>
        <p><strong className="text-[#382548]">Source :</strong> {tx.source}</p>
        <p><strong className="text-[#382548]">Destination :</strong> {tx.target}</p>
        <p className="text-[10px] mt-1">Mouvement fictif, sans justificatif bancaire réel.</p>
       </div>}
      </div>;
    }):<p className="py-5 text-[12px] text-[#86798F]">{filter==='all'?'Aucun mouvement sur cette pocket pour le moment.':filter==='incoming'?'Aucune entrée à afficher.':'Aucune sortie à afficher.'}</p>}
    {filtered.length>4&&<button type="button" onClick={()=>setExpanded(v=>!v)} className="w-full flex items-center justify-center gap-1 text-[12px] font-bold text-[#6E2BD5] py-3 border-t border-[#F1EAF7]">{expanded?'Réduire':`Voir les ${filtered.length} mouvements`}<ChevronRight size={15}/></button>}
   </div>
  </section>

  <section className="space-y-3">
   <MiniHeading title={owner.simpleOne?'Suivi Simple One':'Autorisations et plafonds'} sub={owner.simpleOne?'Une supervision adaptée, sans inventer les plafonds bancaires réels.':'Vos règles de gestion sur cette pocket.'}/>
   <div className={box+' p-4 space-y-3'}>
    <div className="flex items-start gap-3"><ShieldCheck size={21} className="text-[#7432DA] shrink-0"/><div className="flex-1">
     <p className="text-[13px] font-bold text-[#332543]">{owner.simpleOne?'Contrôle familial':'Paramètres de la pocket'}</p>
     <p className="text-[11px] text-[#84788D] mt-1 leading-relaxed">{owner.simpleOne?'Les responsables peuvent consulter cette pocket et gérer les cartes associées.':'Les responsables peuvent gérer les cartes et le plafond fictif de virement.'}</p>
    </div></div>
    <div className="bg-[#F8F5FC] rounded-[16px] px-3 py-3 flex justify-between items-center gap-2">
     <div><p className="text-[11px] text-[#726482]">Plafond par virement sortant</p><p className="font-extrabold text-[14px] text-[#38264A] mt-1">{balance(supervision.ceiling)}</p></div>
     {manager&&<button type="button" onClick={onLimit} className="rounded-full bg-white border border-[#E1D6F0] px-3 py-2 text-[#6E2CD0] font-bold text-[11px] flex items-center gap-1"><Settings2 size={15}/>Modifier</button>}
    </div>
    <div className="flex justify-between items-center"><span className="text-[11px] text-[#7C6E88]">Gérer les cartes</span><button type="button" onClick={onCards} className="text-[11px] text-[#692CC8] font-bold flex items-center gap-1">Voir les cartes <ChevronRight size={15}/></button></div>
    <button type="button" onClick={onProfile} className="text-[11px] font-bold text-[#7132D5] flex items-center gap-2"><WalletCards size={15}/>Voir la fiche de {owner.name}<ChevronRight size={15}/></button>
   </div>
   <div className="bg-[#F4F0FB] rounded-[16px] px-4 py-3 text-[11px] text-[#80728F] leading-relaxed flex items-start gap-2"><Info size={17} className="shrink-0 text-[#7640BD]"/>
    {owner.simpleOne?'Plafonds, paiements et contrôles parentaux Simple One réels : à valider avec les métiers. Ici, seules les actions fictives sont disponibles.':'Plafond de virement utilisé uniquement dans la simulation. Ce n’est pas un plafond de carte ou une règle bancaire réelle.'}
   </div>
  </section>
 </div>;
}
