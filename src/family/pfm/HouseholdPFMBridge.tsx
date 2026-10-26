import React from 'react';
import {
  ArrowRight, BarChart3, ChevronRight, EyeOff, HeartHandshake, Info,
  Landmark, Lightbulb, LockKeyhole, PiggyBank, ShieldCheck, Target, Users,
  WalletCards
} from 'lucide-react';
import { currency, findMember, type Family } from '../model';
import { getHouseholdInsight } from './householdInsights';

type Props={
 family:Family;viewerId:string;showAmounts:boolean;
 onAccounts:()=>void;onSavings:()=>void;onGoals:(id:string)=>void;
 onPots:()=>void;onPot:(id:string)=>void;onMembers:()=>void;
};
const surface='rounded-[24px] bg-white border border-[#EAE2F5] shadow-[0_5px_16px_rgba(72,30,132,0.05)]';
function Subhead({title,subtitle}:{title:string;subtitle?:string}) {
 return <div className="px-1 space-y-1">
  <h3 className="text-[17px] leading-tight font-extrabold text-[#291B3B]">{title}</h3>
  {subtitle&&<p className="text-[11px] text-[#887994] leading-relaxed">{subtitle}</p>}
 </div>;
}
function NavigateItem({icon:Icon,title,subtitle,onClick}:{
 icon:typeof Target;title:string;subtitle:string;onClick:()=>void;
}) {
 return <button type="button" onClick={onClick} className="w-full text-left flex items-center gap-3 py-3.5 border-b last:border-0 border-[#F1EAF7]">
  <span className="shrink-0 h-10 w-10 rounded-[14px] bg-[#F3ECFF] text-[#6C2FD1] flex items-center justify-center"><Icon size={18}/></span>
  <span className="flex-1 min-w-0"><span className="block font-extrabold text-[12px] text-[#312341]">{title}</span><span className="block text-[11px] text-[#8C7E98] mt-0.5">{subtitle}</span></span>
  <ChevronRight size={17} className="text-[#9486A6] shrink-0"/>
 </button>;
}

export function HouseholdPFMBridge({family,viewerId,showAmounts,onAccounts,onSavings,onGoals,onPots,onPot,onMembers}:Props) {
 const viewer=findMember(family,viewerId);
 const info=getHouseholdInsight(family,viewerId);
 const hasAccounts=info.scope.length>0;
 const money=(n:number)=>showAmounts?currency(n):'•••• DH';
 const goalsTotal=info.goals.reduce((sum,g)=>sum+g.balance,0);
 const activeScopes=info.scope.map(scope=>scope==='sub'?'Sous-compte Famille':'Compte joint');
 return <div className="space-y-5 pb-4">
  <section className="relative overflow-hidden rounded-[27px] bg-gradient-to-br from-[#321164] via-[#5721B6] to-[#803DEB] p-5 text-white shadow-[0_9px_24px_rgba(52,20,117,0.15)]">
   <div className="absolute -right-10 -top-12 w-40 h-40 rounded-full bg-white/10 blur-xl" aria-hidden="true"/>
   <div className="relative">
    <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-full px-3 py-1.5 text-[10px] font-bold">
      <BarChart3 size={13}/> Aperçu familial · démonstration
    </span>
    <h2 className="text-[24px] leading-tight font-extrabold mt-4">Comprendre les finances de notre foyer</h2>
    <p className="text-[12px] leading-relaxed text-white/80 mt-2">Un aperçu de nos dépenses partagées et projets accessibles, pour identifier où agir ensemble.</p>
    <div className="grid grid-cols-3 gap-1.5 mt-5">
     {['Comprendre','Agir','Apprendre'].map((name,i)=>
      <div key={name} className="flex items-center gap-1 min-w-0">
       <span className="shrink-0 w-5 h-5 rounded-full bg-white/20 text-[10px] font-extrabold flex justify-center items-center">{i+1}</span>
       <span className="truncate text-[10px] font-semibold">{name}</span>
      </div>)}
    </div>
   </div>
  </section>

  <section className="space-y-3">
   <Subhead title="Deux espaces complémentaires" subtitle="Le PFM aide à comprendre ; Ma famille sert à gérer les comptes et les autorisations."/>
   <div className="grid grid-cols-2 gap-3">
    <div className={surface+' p-3.5 space-y-2'}>
     <span className="w-10 h-10 flex justify-center items-center rounded-[13px] bg-[#EDE6FF] text-[#7030D4]"><Users size={20}/></span>
     <p className="text-[13px] font-extrabold text-[#302241]">Ma famille</p>
     <p className="text-[11px] text-[#83758F] leading-relaxed min-h-[58px]">Membres, droits, comptes, pockets et autorisations.</p>
     <button type="button" onClick={onAccounts} className="text-[11px] text-[#6831D0] font-extrabold flex items-center gap-1">Gérer les comptes <ArrowRight size={14}/></button>
    </div>
    <div className={surface+' p-3.5 space-y-2'}>
     <span className="w-10 h-10 flex justify-center items-center rounded-[13px] bg-[#FFF0D9] text-[#B57826]"><BarChart3 size={20}/></span>
     <p className="text-[13px] font-extrabold text-[#302241]">Mon foyer · PFM</p>
     <p className="text-[11px] text-[#83758F] leading-relaxed min-h-[58px]">Lecture des opérations partagées et progression des objectifs.</p>
     <span className="text-[10px] rounded-full bg-[#F8F0FF] text-[#78589E] px-2 py-1 font-semibold inline-block">Aperçu dans Family</span>
    </div>
   </div>
  </section>

  <section className="space-y-3">
   <Subhead title="Périmètre de cet aperçu" subtitle="Seules les données explicitement accessibles à votre profil sont prises en compte."/>
   <div className={surface+' p-4 space-y-3'}>
    <div className="flex items-start gap-3">
     <ShieldCheck size={20} className="text-[#6A2ECF] shrink-0"/>
     <div className="flex-1">
      <p className="text-[12px] font-bold text-[#3D2A4C]">Profil : {viewer?.name||'Membre de la famille'}</p>
      <p className="text-[11px] text-[#887992] mt-1">{hasAccounts?`Lecture des mouvements partagés autorisés sur ${activeScopes.join(' et ')}.`:'Aucun compte partagé n’est autorisé à la consultation avec ce profil.'}</p>
     </div>
    </div>
    <div className="flex gap-2 flex-wrap">
     {activeScopes.map(name=><span key={name} className="rounded-full px-2.5 py-1.5 bg-[#EAF7EF] text-[#178A65] font-bold text-[10px]">{name}</span>)}
     {!hasAccounts&&<span className="rounded-full px-2.5 py-1.5 bg-[#F3F0F6] text-[#85768E] font-bold text-[10px]">Dépenses non accessibles</span>}
    </div>
    <p className="text-[11px] text-[#8B7D97] leading-relaxed">Les comptes Simple personnels, les pockets et les opérations inconnues sont exclus. Aucune donnée d’un membre n’est partagée automatiquement.</p>
    <button type="button" onClick={onAccounts} className="font-bold text-[11px] text-[#6B2BD0] flex gap-1 items-center">Consulter les comptes et leurs accès <ChevronRight size={15}/></button>
   </div>
  </section>

  <section className="space-y-3">
   <Subhead title="Comprendre nos dépenses partagées" subtitle="Exemples d'opérations enregistrées dans cette démo, sans période ni relevé bancaire exhaustif."/>
   <div className={surface+' p-4 space-y-4'}>
    {hasAccounts?<div className="flex justify-between items-end gap-2">
     <div><p className="text-[11px] text-[#887B98]">Total des sorties visibles (démo)</p>
       <p className="text-[26px] font-extrabold tracking-tight text-[#E18D4F] mt-1">{money(info.spending)}</p></div>
     <span className="bg-[#FFF1E5] text-[#B4773B] font-bold text-[10px] px-2.5 py-1.5 rounded-full">{info.movements.length} opération{info.movements.length>1?'s':''}</span>
    </div>:<div className="flex items-start gap-3 rounded-[16px] bg-[#F6F3FA] p-3">
      <LockKeyhole size={20} className="shrink-0 text-[#88789A]"/>
      <div><p className="text-[12px] font-bold text-[#5A4B69]">Dépenses non accessibles</p><p className="text-[11px] text-[#8C7C99] mt-1">Le solde et l’historique d’un compte partagé demandent un droit de consultation spécifique.</p></div>
    </div>}
    {hasAccounts&&info.categories.length>0&&<div className="space-y-3 pt-2 border-t border-[#F2EDF8]">
     {info.categories.map((cat,i)=><div key={cat.name} className="space-y-1.5">
       <div className="flex items-center justify-between gap-2 text-[12px]">
        <span className="font-semibold text-[#59466F]">{cat.name}</span>
        <span className="font-extrabold text-[#30233E]">{money(cat.amount)} <span className="text-[#9A8DAA] font-semibold text-[10px]">· {cat.percent} %</span></span>
       </div>
       <div className="h-2.5 w-full rounded-full bg-[#F1EAF9] overflow-hidden" role="progressbar"
          aria-label={cat.name} aria-valuenow={cat.percent} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full ${i%3===0?'bg-[#F3A45F]':i%3===1?'bg-[#78B9B4]':'bg-[#9274E5]'}`} style={{width:`${cat.percent}%`}}/>
       </div>
     </div>)}
    </div>}
    {hasAccounts&&info.categories.length===0&&<p className="text-[12px] text-[#877890]">Aucune sortie enregistrée sur les comptes partagés accessibles.</p>}
   </div>
  </section>

  <section className="space-y-3">
   <Subhead title="Agir sur nos objectifs" subtitle="Les projets et cagnottes restent des parcours distincts, chacun avec ses droits."/>
   <div className="grid grid-cols-2 gap-3">
    <div className={surface+' p-4'}>
     <span className="w-9 h-9 rounded-[13px] bg-[#E8F7EE] text-[#218C65] flex justify-center items-center"><PiggyBank size={20}/></span>
     <p className="text-[11px] text-[#81718D] mt-3">Épargne accessible</p>
     <p className="font-extrabold text-[20px] mt-1 text-[#228F6B]">{money(goalsTotal)}</p>
     <p className="text-[10px] text-[#8A7D97] mt-1">{info.goals.length} projet{info.goals.length>1?'s':''} en cours</p>
    </div>
    <div className={surface+' p-4'}>
     <span className="w-9 h-9 rounded-[13px] bg-[#EFEAFF] text-[#7131D3] flex justify-center items-center"><HeartHandshake size={20}/></span>
     <p className="text-[11px] text-[#81718D] mt-3">Cagnottes accessibles</p>
     <p className="font-extrabold text-[20px] mt-1 text-[#6D2CCF]">{info.pots.length}</p>
     <p className="text-[10px] text-[#8A7D97] mt-1">Collectes en cours, hors épargne</p>
    </div>
   </div>
   <div className={surface+' px-4'}>
    {info.goals.slice(0,3).map(g=><NavigateItem key={g.id} icon={Target} title={g.title}
      subtitle={`${g.percentage} % atteint · Projet d’épargne`} onClick={()=>onGoals(g.id)}/>)}
    {info.pots.slice(0,2).map(p=><NavigateItem key={p.id} icon={WalletCards} title={p.title}
      subtitle={`${p.percentage} % atteint · Cagnotte familiale`} onClick={()=>onPot(p.id)}/>)}
    {!info.goals.length&&!info.pots.length&&<p className="py-5 text-[12px] text-[#85778E]">Aucun objectif ou cagnotte accessible pour le moment.</p>}
   </div>
   <div className="grid grid-cols-2 gap-3">
    <button type="button" onClick={onSavings} className="rounded-full border border-[#E5D7F8] bg-white min-h-[44px] text-[#702ED1] font-bold text-[12px] flex items-center justify-center gap-1">Mes projets <ChevronRight size={15}/></button>
    <button type="button" onClick={onPots} className="rounded-full border border-[#E5D7F8] bg-white min-h-[44px] text-[#702ED1] font-bold text-[12px] flex items-center justify-center gap-1">Cagnottes <ChevronRight size={15}/></button>
   </div>
  </section>

  <section className="space-y-3">
   <Subhead title="Et pour aller plus loin ?" subtitle="Une vision cible à connecter au PFM Simple, sans prétendre qu’elle est disponible ici."/>
   <div className={surface+' p-4 flex items-start gap-3'}>
    <span className="w-10 h-10 shrink-0 bg-[#FFF2DE] text-[#B57E31] rounded-[14px] flex justify-center items-center"><Lightbulb size={20}/></span>
    <div className="flex-1">
     <p className="text-[13px] font-bold text-[#3D2D4D]">Un accompagnement financier plus intelligent</p>
     <p className="text-[11px] leading-relaxed text-[#81738E] mt-1">Diagnostics, budgets, recommandations, défis et apprentissage font partie de la vision PFM. Ils ne sont pas connectés à cette démo Family.</p>
    </div>
   </div>
   <button type="button" onClick={onMembers} className="w-full flex items-center justify-center gap-2 text-[#6B2FC8] font-bold text-[12px] py-2">
    <Users size={17}/> Revenir à la gestion des membres et des droits <ArrowRight size={15}/>
   </button>
   <div className="bg-[#F3EFFA] rounded-[17px] p-3 flex gap-2 text-[11px] leading-relaxed text-[#80708F]">
    <Info size={17} className="shrink-0 text-[#7650B4]"/>
    <p>Prévisualisation en lecture seule de données fictives. Le prototype PFM « Mon foyer » est distinct : aucune synchronisation, analyse IA, consentement bancaire ou dépense réelle n’est exécutée ici.</p>
   </div>
  </section>
 </div>;
}
