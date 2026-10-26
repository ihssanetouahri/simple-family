import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CreditCard, Info, LockKeyhole, ShieldCheck, WalletCards } from 'lucide-react';
import { currency, findMember, type Family, type FamilyCard } from '../model';
import { canManageFamilyCards, canToggleFamilyCard, canViewFamilyCard } from '../permissions';
import { getMemberVisibleCards } from '../members/memberSelectors';

type Props={
 family:Family;viewerId:string;memberFilter:string|null;
 onToggle:(id:string)=>void;onCreate:()=>void;onOpenPocket:(ownerId:string)=>void;
};
const panel='rounded-[23px] bg-white border border-[#EAE2F5] shadow-[0_5px_16px_rgba(72,30,132,0.05)]';

function cardSource(family:Family,card:FamilyCard):string {
 if(['family','account',family.account?.id].includes(card.source))return 'Sous-compte Famille';
 if(['joint',family.joint?.id].includes(card.source))return 'Compte joint';
 const pocket=family.pockets.find(p=>p.id===card.source||card.source===`pocket:${p.ownerId}`);
 if(pocket)return `Pocket ${findMember(family,pocket.ownerId)?.name||'membre'}`;
 return 'Compte lié';
}
function cardPocketOwner(family:Family,card:FamilyCard):string|null {
 const pocket=family.pockets.find(p=>p.id===card.source||card.source===`pocket:${p.ownerId}`);
 return pocket?.ownerId||null;
}
export function FamilyCardsView({family,viewerId,memberFilter,onToggle,onCreate,onOpenPocket}:Props) {
 const [openId,setOpenId]=useState<string|null>(null);
 const manageable=canManageFamilyCards(family,viewerId);
 const cards=memberFilter?getMemberVisibleCards(family,viewerId,memberFilter):family.cards.filter(c=>canViewFamilyCard(family,viewerId,c));
 const owner=memberFilter?findMember(family,memberFilter):null;
 const active=cards.filter(c=>c.active).length;
 return <div className="space-y-4 pb-3">
  <div className={panel+' p-4 flex items-center gap-3'}>
   <div className="w-12 h-12 bg-[#F2EBFE] text-[#7430D8] rounded-[16px] flex justify-center items-center shrink-0"><WalletCards size={23}/></div>
   <div className="flex-1"><p className="text-[15px] font-extrabold text-[#2E2040]">{owner?`Cartes de ${owner.name}`:'Cartes de la famille'}</p>
    <p className="text-[11px] text-[#867A91] mt-1">{cards.length} carte{cards.length>1?'s':''} · {active} active{active>1?'s':''}</p>
   </div>
  </div>
  {cards.length?cards.map(card=>{
   const holder=findMember(family,card.holderId);
   const pocketId=cardPocketOwner(family,card);
   const expanded=openId===card.id;
   return <section key={card.id} className={panel+' p-4 space-y-3'}>
    <div className={`rounded-[22px] p-4 bg-gradient-to-br ${card.active?'from-[#2F0B69] to-[#7639E6]':'from-[#535064] to-[#777080]'} text-white`}>
     <div className="flex justify-between items-center gap-3"><p className="text-[11px] font-bold">Simple Family</p><CreditCard size={20}/></div>
     <p className="mt-6 font-mono tracking-[0.1em] text-[15px]">•••• •••• •••• {card.last4}</p>
     <div className="flex justify-between items-center gap-2 mt-5 text-[11px] text-white/80"><span className="truncate">{holder?.name||'Membre'}</span><span>{card.active?'Active':'Suspendue'}</span></div>
    </div>
    <div className="flex items-center gap-2">
     <div className="flex-1 min-w-0"><p className="text-[13px] font-extrabold truncate">{card.label}</p><p className="text-[11px] text-[#857690] mt-1">{cardSource(family,card)}</p></div>
     <span className={`text-[10px] rounded-full px-2.5 py-1.5 font-bold ${card.active?'bg-[#E8F8EF] text-[#13845D]':'bg-[#F4EEF5] text-[#876D8C]'}`}>{card.active?'Active':'Suspendue'}</span>
    </div>
    <button type="button" aria-expanded={expanded} aria-label={`Détails de ${card.label}`} onClick={()=>setOpenId(expanded?null:card.id)}
      className="w-full flex items-center justify-between gap-2 text-[#6B2DC9] border-t border-[#F1EBF7] pt-3 text-[12px] font-bold">
      Détails et gestion <ChevronDown size={17} className={expanded?'rotate-180':''}/>
    </button>
    {expanded&&<div className="border-t border-[#F1EBF7] pt-3 space-y-3 text-[12px]">
     <div className="grid grid-cols-2 gap-3">
      <div className="bg-[#F8F5FC] p-3 rounded-[15px]"><p className="text-[#8B7E98] text-[10px]">Titulaire</p><p className="font-bold mt-1">{holder?.name||'Inconnu'}</p></div>
      <div className="bg-[#F8F5FC] p-3 rounded-[15px]"><p className="text-[#8B7E98] text-[10px]">État de la carte</p><p className="font-bold mt-1">{card.active?'Active':'Suspendue'}</p></div>
     </div>
     {pocketId&&<button type="button" onClick={()=>onOpenPocket(pocketId)} className="w-full py-2.5 flex justify-between gap-2 text-[#6A2BD1] text-[12px] font-bold">Voir la pocket associée <ChevronRight size={16}/></button>}
     {canToggleFamilyCard(family,viewerId,card)?<button type="button" onClick={()=>onToggle(card.id)} className={`min-h-[43px] w-full rounded-full font-bold text-[12px] flex justify-center gap-2 items-center ${card.active?'bg-[#F8EDF2] text-[#AA4660]':'bg-[#EBF7F0] text-[#15855F]'}`}>
      {card.active?<LockKeyhole size={17}/>:<ShieldCheck size={17}/>}
      {card.active?'Suspendre cette carte':'Réactiver cette carte'}
     </button>:<p className="rounded-[14px] bg-[#F6F2FB] p-3 text-[11px] text-[#81748F] flex gap-2"><LockKeyhole size={16} className="shrink-0"/>Seuls les responsables autorisés peuvent modifier le statut.</p>}
     <p className="text-[10px] text-[#8A7E97] leading-relaxed">Aucune carte réelle n'est créée, suspendue ou réactivée. Les paiements par carte et les plafonds bancaires ne sont pas simulés ici.</p>
    </div>}
   </section>;
  }):<div className={panel+' p-5 text-center space-y-2'}>
   <CreditCard size={26} className="text-[#7B48CF] mx-auto"/><p className="font-bold text-[13px]">Aucune carte accessible</p><p className="text-[11px] text-[#86798E]">Les cartes apparaîtront ici lorsqu'elles seront créées et associées à un compte autorisé.</p>
  </div>}
  {manageable&&<button type="button" onClick={onCreate} className="min-h-[46px] w-full rounded-full bg-[#6A29D8] text-white text-[13px] font-bold">Créer une carte virtuelle <span className="ml-1">+</span></button>}
  <div className="bg-[#F5F0FC] rounded-[16px] p-3 text-[#7D6F8C] flex items-start gap-2 text-[11px] leading-relaxed"><Info size={17} className="shrink-0 text-[#7545C2]"/>Carte et contrôle de statut uniquement simulés. Les plafonds de paiement, la confidentialité et les règles bancaires Simple One doivent être confirmés côté banque.</div>
 </div>;
}
