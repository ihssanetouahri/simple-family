import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, Bell, BookOpen, CalendarDays, CalendarClock, Check,
  CheckCircle2, ChevronDown, ChevronRight, CircleHelp, Clock3, CreditCard, Crown, FileText,
  Gift, HeartHandshake, Home, Landmark, LockKeyhole, MessageCircle, MoreHorizontal, Plus,
  ReceiptText, RotateCcw, Send, Settings2, ShieldCheck, Sparkles, Target, Trash2, Users,
  Wallet, X, Eye, PiggyBank, Plane, Coins, PenLine, CheckCheck, UserPlus, Camera,
  WalletCards, Download, Info, BadgeCheck, ExternalLink
} from 'lucide-react';
import { MobileHeader, SimpleButton, type Navigate } from '../components/SimpleUI';
import {
  avatarFor, createDemoState, currency, findMember, loadFamilyState,
  moneyValid, parseMoney, roundMoney, roleLabel, saveFamilyState, today, uid,
  type Family, type FamilyState, type Member, type Role
} from './model';
import lamiaAvatar from '../assets/images/lamia_avatar.jpg';
import karimAvatar from '../assets/images/karim.jpg';
import yasmineAvatar from '../assets/images/yasmine.jpg';
import familyPhoto from '../assets/images/family_photo.jpg';
import { familyCoverSprite } from './coverSprite';
import { getFamilyFollowUps, type FamilyFollowUp, type FamilyFollowUpKind } from './alerts/followUps';
import { canCreateFamilyBooking, composeFamilyMessage, getFamilyServiceLinks, type ServiceLink } from './services/serviceLinks';
import { AccountJourneys, type AccountJourneyHandle } from './AccountJourneys';
import { MemberProfile } from './members/MemberProfile';
import { PocketDetail } from './pockets/PocketDetail';
import { closeFamilyPot, closeSavingsGoal, goalDisplayState, goalContributions, potContributions, potDisplayState } from './savings/savingsRules';
import { FamilyCardsView } from './pockets/FamilyCardsView';
import { FamilyPreviewCarousel } from './components/FamilyPreviewCarousel';
import { HouseholdPFMBridge } from './pfm/HouseholdPFMBridge';
import { memberRemovalIssues } from './quality/familyIntegrity';
import { validateLinkedBillPayment } from './payments/billRules';
import { validatePocketDebit } from './pockets/pocketRules';
import { FamilyChatView } from './chat/FamilyChatView';
import { FAMILY_ROOM_ID, canManageChatGroup, createGroupChat, getVisibleChat, sendChatMessage, startDirectChat, updateChatGroup, visibleChats } from './chat/chatRules';
import {
  canManageFamily, isFamilyLeader, canViewJointAccount, canViewFamilyAccount as mayViewFamilyAccount,
  canViewPocket,
  canUseSimplePayFamily, canViewSavingsGoal, canEditSavingsGoal, canFundSavingsGoal, canWithdrawSavingsGoal,
  canManageFamilyPot, canContributeToFamilyPot, canViewFamilyPotHistory, canViewFamilyDocument,
  canRemoveFamilyMember, canChangeMemberRole,
  canDebitFamilySource, canCreditFamilyDestination, canIssueFamilyCard, canToggleFamilyCard
} from './permissions';

type Route = 'dashboard'|'members'|'member'|'accounts'|'pocket'|'cards'|'savings'|'goal'|'pots'|'pot'|
 'pockets'|'services'|'chat'|'vault'|'trip'|'loyalty'|'loan'|'pfm'|'preferences'|'invite'|'alerts'|'sub-account'|'joint-account';
type ModalKind = 'new-family'|'join-family'|'invite'|'rename'|'transfer'|'open-account'|'open-joint'|'create-card'|
  'new-goal'|'goal-deposit'|'goal-withdraw'|'goal-delete'|'goal-edit'|'goal-close'|'new-pot'|'pot-deposit'|'pot-invite'|'pot-edit'|'pot-close'|'new-document'|
  'pay-bill'|'simple-pay'|'new-trip'|'new-credit'|'member-delete'|'family-delete'|'otp'|
  'limit'|'goal-schedule'|null;
type FormData = Record<string,string>;
type PendingPayment = { from: string; to:string; amount:number; label:string; category:string; alertId?:string };
const nowDate = () => new Date().toISOString().slice(0,10);
const cx = 'text-[#171126]';
const subtle = 'text-[#817895]';
const softBorder='border border-[#EDE7F6]';

// All six generated family cover photos are embedded in a lightweight AVIF sprite.
// First row: vacation, studies, weekend; second row: birthday, gift, outing.
function FamilyPhotoCover({id, kind, label}: {id:string;kind:'goal'|'pot';label:string}) {
  const goalPositions:Record<string,number>={goal_vac:0,goal_school:1,goal_weekend:2};
  const potPositions:Record<string,number>={pot1:3,pot2:4,pot3:5};
  const index=(kind==='goal'?goalPositions:potPositions)[id] ?? (kind==='goal'?0:3);
  const x=['0%','50%','100%'][index%3];
  const y=index<3?'0%':'100%';
  return <div role="img" aria-label={label}
    style={{backgroundImage:`url("${familyCoverSprite}")`,backgroundSize:'300% 200%',backgroundPosition:`${x} ${y}`}}
    className="w-full h-full bg-[#EFE9F6] bg-no-repeat"/>;
}

// Compact, swipeable circular-progress card shared by goals and cagnottes.
function FamilyProgressPhotoCard({id,kind,title,description,current,target,onClick,detail=false,status,statusLabel,statusTone,showAmounts=true}:{
  id:string;kind:'goal'|'pot';title:string;description:string;current:number;target:number;
  onClick?:()=>void;detail?:boolean;status?:'active'|'closed';statusLabel?:string;statusTone?:'violet'|'green'|'amber';showAmounts?:boolean
}) {
  const progress=target>0?Math.max(0,Math.min(100,Math.round(current/target*100))):0;
  const isPot=kind==='pot';
  const accent=isPot?'#169C72':'#8000EB';
  const remaining=Math.max(0,target-current);
  const cardContent = <>
    <div className="relative mx-auto w-[134px] h-[140px] flex items-start justify-center">
      <svg viewBox="0 0 134 134" className="absolute inset-0 w-[134px] h-[134px]" aria-hidden="true">
        <circle cx="67" cy="67" r="58" fill="none" stroke="#EEE8F8" strokeWidth="7"/>
        <circle cx="67" cy="67" r="58" fill="none" stroke={accent} strokeWidth="7" strokeLinecap="round"
          pathLength={100} strokeDasharray={`${progress} 100`} transform="rotate(-90 67 67)" />
      </svg>
      <div className="absolute top-[16px] left-[16px] w-[102px] h-[102px] rounded-full overflow-hidden border-[3px] border-white bg-[#F4EEF9]">
        <FamilyPhotoCover id={id} kind={kind} label={`Photo : ${title}`}/>
      </div>
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 shadow-sm text-white text-[11px] leading-none font-extrabold"
        style={{backgroundColor:accent}}>{progress} %</span>
    </div>
    <h3 className="font-extrabold text-[14px] text-[#281936] leading-[1.3] mt-3 min-h-[37px] flex items-center justify-center">{title}</h3>
    <p className="text-[11px] text-[#877796] mt-1 min-h-[30px] flex items-center justify-center leading-[1.3]">{description}</p>
    <div className="border-t border-[#F0EAF6] mt-3 pt-3 text-left grid grid-cols-2 gap-2">
      <div className="min-w-0">
        <p className="text-[10px] text-[#8C809C]">{isPot?'Collecté':'Épargné'}</p>
        <p className="text-[13px] font-extrabold text-[#352547] mt-1 whitespace-nowrap">{showAmounts?currency(current):'•••• DH'}</p>
      </div>
      <div className="min-w-0 text-right">
        <p className="text-[10px] text-[#8C809C]">Reste {isPot?'à collecter':'à épargner'}</p>
        <p className="text-[13px] font-extrabold mt-1 whitespace-nowrap" style={{color:accent}}>{showAmounts?currency(remaining):'•••• DH'}</p>
      </div>
    </div>
  </>;
  // The dashboard card stays clickable and swipeable; detail uses the same
  // visual content in a full-width, non-interactive summary above the actions.
  return detail
    ? <section aria-label={title} className="relative w-full rounded-[27px] bg-white border border-[#EDE5F7] p-5 text-center shadow-[0_5px_16px_rgba(72,30,132,0.06)]">
        {status&&<div className="absolute right-4 top-4"><Tag tone={statusTone||(status==='closed'?'green':'violet')}>{statusLabel||(status==='closed'?'Clôturé':'En cours')}</Tag></div>}
        {cardContent}
      </section>
    : <button type="button" onClick={onClick}
        className="family-hover-card shrink-0 w-[264px] snap-start group rounded-[27px] bg-white border border-[#EDE5F7] p-4 text-center shadow-[0_5px_16px_rgba(72,30,132,0.06)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8000EB]">
        {cardContent}
      </button>;
}

function Avatar({member, size=42}: {member?:Member;size?:number}) {
 const photo=member ? ({lamia:lamiaAvatar,karim:karimAvatar,yasmine:yasmineAvatar} as Record<string,string>)[avatarFor(member.id)] : undefined;
 return <div style={{width:size,height:size}} className="rounded-full flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-[#DFCCFF] to-[#A68BEB] border-2 border-white shadow-sm text-[#482096] font-extrabold">
   {photo ? <img src={photo} alt="" className="h-full w-full object-cover"/>:<span style={{fontSize:Math.max(12,size*.33)}}>{member?.name?.charAt(0).toUpperCase()||'+'}</span>}
 </div>;
}
function Tag({children,tone='violet'}:{children:React.ReactNode;tone?:'violet'|'green'|'amber'|'gray'}) {
 const tones={violet:'bg-[#F2EAFF] text-[#6B25D9]',green:'bg-[#E6F8EF] text-[#16885D]',amber:'bg-[#FFF1D9] text-[#A86E17]',gray:'bg-[#F2F0F5] text-[#787083]'};
 return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${tones[tone]}`}>{children}</span>
}
function Panel({children,className=''}:{children:React.ReactNode;className?:string}) {return <section className={`card-simple ${className}`}>{children}</section>}
function Heading({title,right,subtitle}: {title:string;right?:React.ReactNode;subtitle?:string}) {return <div className="flex items-end justify-between px-1 gap-2 mb-3"><div><h3 className="text-[17px] font-extrabold leading-tight">{title}</h3>{subtitle&&<p className={`${subtle} text-[11px] mt-1`}>{subtitle}</p>}</div>{right}</div>}
/** Lignes des services : texte lisible et contrasté, sans modifier les ActionLine des autres écrans. */
function FamilyServiceRow({icon:Icon,title,description,onClick,disabled=false,badge,variant='catalog'}:{
 icon:React.ComponentType<{size?:number;className?:string}>;
 title:string;description:string;onClick:()=>void;disabled?:boolean;badge?:string;
 variant?:'catalog'|'suggestion';
}) {
 return <button type="button" onClick={onClick} disabled={disabled}
   className={`w-full min-h-[70px] px-2 py-3 text-left flex items-center gap-3 rounded-[16px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7934D6] disabled:cursor-not-allowed ${variant==='suggestion'?'hover:bg-white/65':'hover:bg-[#F7F2FF]'}`}>
   <span className={`w-[42px] h-[42px] rounded-[15px] shrink-0 flex items-center justify-center ${variant==='suggestion'?'bg-white text-[#6B25D3]':'bg-[#F3ECFF] text-[#6B25D3]'}`}>
     <Icon size={20}/>
   </span>
   <span className="flex-1 min-w-0 space-y-1">
     <span className="flex flex-wrap items-center gap-1.5">
       <span className={`font-bold text-[14px] leading-snug ${disabled?'text-[#756985]':'text-[#2B1E3C]'}`}>{title}</span>
       {badge&&<span className="px-2 py-0.5 rounded-full bg-[#EEE8FA] text-[#74548E] text-[10px] font-bold">{badge}</span>}
     </span>
     <span className="block text-[12px] leading-[1.45] text-[#675A79]">{description}</span>
   </span>
   <ChevronRight size={17} className={`shrink-0 ${disabled?'text-[#B9ACCA]':'text-[#9282AA]'}`}/>
 </button>
}

function FamilyServiceCategory({icon:Icon,title,color}:{icon:React.ComponentType<{size?:number;className?:string}>;title:string;color:'amber'|'purple'|'green'}) {
 const styles={
   amber:'bg-[#FFF0E0] text-[#A96B2A]',
   purple:'bg-[#F0E8FF] text-[#7130CE]',
   green:'bg-[#E7F5EF] text-[#26876B]'
 };
 return <div className="flex items-center gap-2.5 px-1 mb-3 mt-1">
   <span className={`w-8 h-8 rounded-[11px] flex items-center justify-center ${styles[color]}`}><Icon size={18}/></span>
   <h3 className="text-[16px] font-extrabold leading-snug text-[#2C1C40]">{title}</h3>
 </div>
}

function PillButton({children,onClick,secondary=false,disabled=false}: {children:React.ReactNode;onClick:()=>void;secondary?:boolean;disabled?:boolean}) {return <button disabled={disabled} type="button" onClick={onClick} className={`${secondary?'bg-[#F0EAFC] text-[#6225CE]':'btn-simple-primary text-white'} h-[45px] rounded-full px-4 flex items-center justify-center gap-2 font-bold text-[13px] w-full disabled:opacity-40 disabled:cursor-not-allowed`}>{children}</button>}
function ActionLine({icon:Icon,title,subtitle,onClick,trailing,disabled=false}:{icon:React.ComponentType<{size?:number;className?:string}>;title:string;subtitle?:string;onClick?:()=>void;trailing?:React.ReactNode;disabled?:boolean}) {return <button disabled={disabled} onClick={onClick} type="button" className="family-hover-row w-full text-left py-3.5 flex items-center gap-3 border-b last:border-b-0 border-[#F1EDF7] disabled:opacity-40"><div className="w-10 h-10 shrink-0 rounded-2xl bg-[#F4EEFF] text-[#6824DC] flex items-center justify-center"><Icon size={19}/></div><div className="min-w-0 flex-1"><p className="text-[13px] font-bold text-[#221633] truncate">{title}</p>{subtitle&&<p className="text-[11px] text-[#817895] mt-0.5 leading-snug">{subtitle}</p>}</div>{trailing||<ChevronRight size={17} className="text-[#A69EB9] shrink-0"/>}</button>}
function Input({label,value,onChange,type='text',placeholder='',min,required=false,readOnly=false}:{label:string;value?:string;onChange:(v:string)=>void;type?:string;placeholder?:string;min?:string;required?:boolean;readOnly?:boolean}) {return <label className="block space-y-1.5"><span className="text-[12px] font-bold text-[#554967]">{label}</span><input required={required} min={min} step={type==='number'?'0.01':undefined} inputMode={type==='number'?'decimal':undefined} type={type} readOnly={readOnly} value={value??''} placeholder={placeholder} onChange={e=>onChange(e.target.value)} className="w-full h-11 rounded-2xl bg-[#F8F6FD] border border-[#E9E1F4] text-[#241536] px-3.5 text-[13px] outline-none focus:ring-2 focus:ring-[#C9AFFB]"/></label>}
function SelectInput({label,value,onChange,options}:{label:string;value?:string;onChange:(v:string)=>void;options:{value:string;label:string}[]}) {return <label className="block space-y-1.5"><span className="text-[12px] font-bold text-[#554967]">{label}</span><select value={value??''} onChange={e=>onChange(e.target.value)} className="w-full h-11 rounded-2xl bg-[#F8F6FD] border border-[#E9E1F4] text-[#241536] px-3.5 text-[13px] outline-none focus:ring-2 focus:ring-[#C9AFFB]">{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>}
function Progress({value,total,tone='violet'}:{value:number;total:number;tone?:'violet'|'green'|'amber'}) { const colors={violet:'bg-[#7926EB]',green:'bg-[#18AB7F]',amber:'bg-[#F4A344]'}; return <div className="h-2.5 rounded-full bg-[#EEEAF4] overflow-hidden"><div className={`h-full rounded-full ${colors[tone]} transition-all`} style={{width:`${Math.min(100,Math.max(0,total?value/total*100:0))}%`}}/></div> }
const dateFor = (date:string) => date ? new Date(date+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}):'À définir';

function AlertItem({icon:Icon,title,subtitle,badge,onClick,tone='violet'}:{icon:React.ComponentType<{size?:number;className?:string}>;title:string;subtitle:string;badge?:string;onClick:()=>void;tone?:'violet'|'amber'}) {
 return <button type="button" onClick={onClick} className="family-hover-row w-full flex items-center gap-3 py-3.5 text-left border-b last:border-b-0 border-[#F0EBF6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7630E3]">
  <span className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center ${tone==='amber'?'bg-[#FFF3E1] text-[#BF7A12]':'bg-[#F1E9FF] text-[#7430DD]'}`}><Icon size={19}/></span>
  <span className="flex-1 min-w-0"><span className="block text-[13px] font-extrabold text-[#241932] leading-snug truncate">{title}</span><span className="block text-[11px] text-[#746884] mt-1 leading-snug">{subtitle}</span></span>
  <span className="shrink-0 flex items-center gap-1.5">{badge&&<span className="rounded-full bg-[#FFF0D7] text-[#A56B12] px-2 py-1 text-[10px] font-bold">{badge}</span>}<ChevronRight size={16} className="text-[#9487A4]"/></span>
 </button>;
}


export function FamilyExperience({navigate,onChatViewChange}:{navigate:Navigate;onChatViewChange?:(active:boolean)=>void}) {
 const [data,setData]=useState<FamilyState>(loadFamilyState);
 const [route,setRoute]=useState<Route>('dashboard');
 const [showAllServiceSuggestions,setShowAllServiceSuggestions]=useState(false);
 const [stack,setStack]=useState<Route[]>([]);
 const accountJourneyRef=useRef<AccountJourneyHandle>(null);
 const [modal,setModal]=useState<ModalKind>(null);
 const [form,setForm]=useState<FormData>({});
 const [error,setError]=useState('');
 const [toast,setToast]=useState('');
 const [selectedMember,setSelectedMember]=useState('yasmine');
 const [cardsMemberFilter,setCardsMemberFilter]=useState<string|null>(null);
 const [selectedGoal,setSelectedGoal]=useState('goal_vac');
 const [goalManageOpen,setGoalManageOpen]=useState(false);
 const [showAllGoalMovements,setShowAllGoalMovements]=useState(false);
 const [selectedPot,setSelectedPot]=useState('pot1');
 const [potMenuOpen,setPotMenuOpen]=useState(false);
 const [showAllPotContributions,setShowAllPotContributions]=useState(false);
 const [pendingPayment,setPendingPayment]=useState<PendingPayment|null>(null);
 const [otpStage,setOtpStage]=useState(1);
 const [chatInput,setChatInput]=useState('');
 const [activeChatId,setActiveChatId]=useState<string|null>(null);
 const [tripTravelerId,setTripTravelerId]=useState<string|null>(null);
 const [selectorOpen,setSelectorOpen]=useState(false);
 const [selectorPosition,setSelectorPosition]=useState({top:0,right:12,width:252});
 const familySelectorButtonRef=useRef<HTMLButtonElement>(null);
 const familySelectorMenuRef=useRef<HTMLDivElement>(null);
 const [demoOpen,setDemoOpen]=useState(false);
 const [projectFilter,setProjectFilter]=useState<'all'|'active'|'closed'>('all');
 const [showAmounts,setShowAmounts]=useState(true);
 const family = data.families.find(f=>f.id===data.activeFamilyId) || null;
 const viewer = family?.members.find(m=>m.id===data.viewerId) || null;
 const admin = family ? canManageFamily(family,data.viewerId):false;
 const leader = family ? isFamilyLeader(family,data.viewerId):false;
 const canViewFamilyAccount = family ? mayViewFamilyAccount(family,data.viewerId):false;
 const visibleGoals=family?.goals.filter(g=>canViewSavingsGoal(family,data.viewerId,g))||[];
 const filteredGoals=visibleGoals.filter(g=>projectFilter==='all'||g.status===projectFilter);
 const goal=family?.goals.find(g=>g.id===selectedGoal);
 const canManageGoal=Boolean(family&&goal&&canEditSavingsGoal(family,data.viewerId,goal));
 const canScheduleGoal=Boolean(goal&&(admin||goal.ownerId===data.viewerId));
 const pocket = family?.pockets.find(p=>p.ownerId===selectedMember);
 const owner=family?.members.find(m=>m.id===selectedMember);
 const pot=family?.pots.find(p=>p.id===selectedPot);
 const canManagePot=Boolean(family&&pot&&canManageFamilyPot(family,data.viewerId,pot));
 const canParticipateInPot=Boolean(family&&pot&&canContributeToFamilyPot(family,data.viewerId,pot));
 const canSeePotHistory=Boolean(family&&pot&&canViewFamilyPotHistory(family,data.viewerId,pot));
 const potInviteCandidates=family?.members.filter(m=>pot&&!pot.members.includes(m.id)&&!(pot.pendingInvites||[]).includes(m.id))||[];
 const potFundingOptions=family&&viewer?[
  {value:`simple:${data.viewerId}`,label:`Mon compte Simple · ${showAmounts?currency(viewer.simpleBalance):'•••• DH'}`},
  ...family.pockets.filter(p=>p.ownerId===data.viewerId).map(p=>({value:`pocket:${data.viewerId}`,label:`Mon pocket · ${showAmounts?currency(p.balance):'•••• DH'}`}))
 ]:[];
 const show=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(''),3500)};
 const scrollTop=()=>{const el=document.getElementById('simple-scroll-area');if(el)el.scrollTop=0};
 const go=(next:Route)=>{setStack(prev=>[...prev,route]);setRoute(next);setSelectorOpen(false);setDemoOpen(false);scrollTop()};
 const back=()=>{
  if(stack.length){setRoute(stack[stack.length-1]);setStack(prev=>prev.slice(0,-1));scrollTop();}
  else if(route!=='dashboard'){setRoute('dashboard');scrollTop();}
  else navigate('HOME');
 };
 const handleBack=()=>{
  if((route==='sub-account'||route==='joint-account')&&accountJourneyRef.current?.goBack())return;
  back();
 };
 const toDashboard=()=>{setStack([]);setRoute('dashboard');scrollTop()};
 const launch=(kind:ModalKind,initial:FormData={})=>{setModal(kind);setForm(initial);setError('')};
 const close=()=>{setModal(null);setError('');setPendingPayment(null)};
 const setField=(field:string,value:string)=>setForm(prev=>({...prev,[field]:value}));
 const mutate=(action:(d:FamilyState,f:Family)=>void)=>{
  setData(prev=>{ const copy:FamilyState=structuredClone(prev);const active=copy.families.find(f=>f.id===copy.activeFamilyId);if(active){action(copy,active);for(const other of copy.families){if(other.id===active.id)continue;for(const member of other.members){const same=active.members.find(m=>m.id===member.id);if(same)member.simpleBalance=same.simpleBalance}}}return copy; });
 };
 const toggleFamilySelector=()=>{
  if(selectorOpen){setSelectorOpen(false);return;}
  const trigger=familySelectorButtonRef.current;
  const frame=document.getElementById('simple-device-frame');
  if(!trigger||!frame)return;
  const triggerRect=trigger.getBoundingClientRect();
  const frameRect=frame.getBoundingClientRect();
  setSelectorPosition({
    top:triggerRect.bottom-frameRect.top-frame.clientTop+8,
    right:Math.max(12,frameRect.right-triggerRect.right-frame.clientLeft),
    width:Math.max(180,Math.min(252,frame.clientWidth-24)),
  });
  setSelectorOpen(true);
 };
 useEffect(()=>{
  if(!selectorOpen)return;
  const outside=(event:PointerEvent)=>{
   const target=event.target as Node;
   if(familySelectorButtonRef.current?.contains(target)||familySelectorMenuRef.current?.contains(target))return;
   setSelectorOpen(false);
  };
  const escape=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){setSelectorOpen(false);familySelectorButtonRef.current?.focus();}
  };
  const dismiss=()=>setSelectorOpen(false);
  const scroller=document.getElementById('simple-scroll-area');
  document.addEventListener('pointerdown',outside);
  document.addEventListener('keydown',escape);
  scroller?.addEventListener('scroll',dismiss,{passive:true});
  window.addEventListener('resize',dismiss);
  return ()=>{
   document.removeEventListener('pointerdown',outside);
   document.removeEventListener('keydown',escape);
   scroller?.removeEventListener('scroll',dismiss);
   window.removeEventListener('resize',dismiss);
  };
 },[selectorOpen]);
 useEffect(()=>{saveFamilyState(data)},[data]);
 useEffect(()=>{if(route==='dashboard')scrollTop()},[data.activeFamilyId]);
 useEffect(()=>{
   onChatViewChange?.(route==='chat'&&Boolean(activeChatId));
   return ()=>onChatViewChange?.(false);
 },[route,activeChatId,onChatViewChange]);
 useEffect(()=>{
   if(route!=='chat'||!activeChatId)return;
   const scrollable=document.getElementById('simple-scroll-area');
   if(scrollable)scrollable.scrollTop=scrollable.scrollHeight;
 },[route,activeChatId,activeChatId===FAMILY_ROOM_ID?family?.chat.length:family?.conversations?.find(c=>c.id===activeChatId)?.messages.length]);
 const memberOptions=family?.members.map(m=>({value:m.id,label:`${m.name}${m.simpleOne?' · Simple One':''}`}))||[];
 const visiblePockets=family?.pockets.filter(p=>canViewPocket(family,data.viewerId,p.ownerId))||[];
 const transferOptions=useMemo(()=>{
   if(!family||!viewer)return [];
   const opts=[{value:`simple:${viewer.id}`,label:`Mon compte Simple · ${showAmounts?currency(viewer.simpleBalance):'•••• DH'}`}];
   if(admin&&family.account) opts.push({value:'account',label:`Sous-compte Famille · ${showAmounts?currency(family.account.balance):'•••• DH'}`});
   if(canViewJointAccount(family,data.viewerId)) opts.push({value:'joint',label:`Compte joint · ${showAmounts?currency(family.joint!.balance):'•••• DH'}`});
   family.pockets.filter(p=>canViewPocket(family,viewer.id,p.ownerId)).forEach(p=>{
     const m=findMember(family,p.ownerId);opts.push({value:`pocket:${p.ownerId}`,label:`Pocket ${m?.name||''} · ${showAmounts?currency(p.balance):'•••• DH'}`});
   });
   return opts;
 },[family,viewer,admin,showAmounts,data.viewerId]);
 function currentBalance(f:Family,ref:string):number|undefined {
   if(ref==='account')return f.account?.balance;
   if(ref==='joint')return f.joint?.balance;
   if(ref.startsWith('simple:'))return f.members.find(m=>m.id===ref.slice(7))?.simpleBalance;
   if(ref.startsWith('pocket:'))return f.pockets.find(p=>p.ownerId===ref.slice(7))?.balance;
   return undefined;
 }
 function changeBalance(f:Family,ref:string,delta:number){
   if(ref==='account'&&f.account)f.account.balance=roundMoney(f.account.balance+delta);
   if(ref==='joint'&&f.joint)f.joint.balance=roundMoney(f.joint.balance+delta);
   if(ref.startsWith('simple:')){const m=findMember(f,ref.slice(7));if(m)m.simpleBalance=roundMoney(m.simpleBalance+delta);}
   if(ref.startsWith('pocket:')){const p=f.pockets.find(p=>p.ownerId===ref.slice(7));if(p)p.balance=roundMoney(p.balance+delta);}
 }
 function commitPayment(payment:PendingPayment){
  if(payment.alertId&&family){
    const bill=family.alerts.find(a=>a.id===payment.alertId);
    const validation=validateLinkedBillPayment(family,payment.alertId,bill?.beneficiary||'',payment.amount);
    if('reason' in validation){setError(validation.reason);return;}
  }
  mutate((_d,f)=>{
    changeBalance(f,payment.from,-payment.amount);
    if(payment.to!=='external')changeBalance(f,payment.to,payment.amount);
    f.transactions.unshift({id:uid('tx'),date:today(),title:payment.label,amount:payment.to==='external'?-payment.amount:payment.amount,category:payment.category,source:payment.from,target:payment.to});
    if(payment.to==='external')f.loyaltyPoints+=Math.floor(payment.amount/50); // illustrative, not a business rule
    if(payment.alertId){const alert=f.alerts.find(a=>a.id===payment.alertId);if(alert&&validateLinkedBillPayment(f,payment.alertId,alert.beneficiary,payment.amount).ok)alert.resolved=true;}
  });
  close();show(`${payment.label} · ${currency(payment.amount)} (simulation)`);
 }
 function requestPayment(payment:PendingPayment){
  if(!family||!viewer){setError('Aucune famille sélectionnée.');return false;}
  if(!moneyValid(payment.amount)){setError('Saisissez un montant positif valide.');return false;}
  if(payment.from===payment.to){setError('Choisissez deux comptes différents.');return false;}
  const balance=currentBalance(family,payment.from);
  if(balance===undefined||balance<payment.amount){setError('Solde insuffisant pour cette simulation.');return false;}
  // Do not rely only on the disabled state of a UI control for authorizations.
  if(!canDebitFamilySource(family,data.viewerId,payment.from)){
    setError('Vous ne disposez pas des droits nécessaires sur le compte source.');return false;
  }
  if(!canCreditFamilyDestination(family,data.viewerId,payment.to)){
    setError('Destination non autorisée pour votre profil.');return false;
  }
  const pocketCheck=validatePocketDebit(family,data.viewerId,payment.from,payment.amount);
  if('reason' in pocketCheck){setError(pocketCheck.reason);return false;}
  // The same per-operation demo ceiling applies to account transfers started outside AccountJourneys.
  const sendingAccount=payment.from==='account'?family.account:payment.from==='joint'?family.joint:null;
  if(sendingAccount&&payment.amount>sendingAccount.limit){
    setError('Ce montant dépasse le plafond indicatif par opération de ce compte.');return false;
  }
  if(modal==='simple-pay'&&(!canUseSimplePayFamily(family,data.viewerId)||payment.from!=='account')){
    setError('Simple Pay Famille est réservé au Sous-compte Famille et aux responsables habilités.');return false;
  }
  const needsDouble=(payment.from==='account'||payment.from==='joint')&&payment.amount>=family.otpThreshold;
  if(needsDouble){
    if(!family.members.some(m=>m.role==='coleader')){setError('Un Co-leader est nécessaire à la double validation simulée.');return false;}
    setPendingPayment(payment);setOtpStage(1);setModal('otp');setError('');return true;
  }
  commitPayment(payment);return true;
 }
 function submit(e:React.FormEvent){
   e.preventDefault();setError('');
   if(!family&&modal!=='new-family'){setError('Commencez par créer une famille.');return;}
   if(modal==='new-family'){
     const name=form.name?.trim();if(!name){setError('Donnez un nom à votre famille.');return;}
     const newId=uid('family');const mainUser={id:'lamia',name:'Lamia',relation:'Moi',role:'leader' as Role,simpleOne:false,simpleBalance:43109,avatar:'lamia'};
     const newFamily:Family={id:newId,name,emoji:form.emoji||'💜',accountViewIds:['lamia'],members:[mainUser],pockets:[{id:uid('pocket'),ownerId:'lamia',balance:0,limit:5000}],
       account:form.openAccount==='true'?{id:uid('account'),label:'Sous-compte Famille',balance:0,limit:9000}:null,joint:null,jointHolderIds:[],jointApplication:null,transactions:[],goals:[],pots:[],cards:[],invites:[],alerts:[],chat:[],documents:[],bookings:[],creditRequests:[],loyaltyPoints:0,otpThreshold:2000,language:'Français'};
     setData(prev=>{const prevMember=prev.families.flatMap(f=>f.members).find(m=>m.id==='lamia');if(prevMember)newFamily.members[0].simpleBalance=prevMember.simpleBalance;return {...prev,activeFamilyId:newId,viewerId:'lamia',families:[...prev.families,newFamily]}});close();toDashboard();show('Famille créée, avec un pocket pour le premier membre.');return;
   }
   if(!family)return;
   switch(modal){
   case 'rename':{
      if(!admin){setError('Action réservée aux administrateurs.');return;}
      if(!form.name?.trim()){setError('Saisissez un nom.');return;}
      mutate((_d,f)=>{f.name=form.name.trim();f.emoji=form.emoji||f.emoji});close();show('Famille mise à jour.');break;
   }
   case 'invite':{
      if(!admin){setError('Action réservée aux administrateurs.');return;}
      if(!form.name?.trim()){setError('Indiquez le prénom du membre.');return;}
      if(form.role==='coleader'&&form.simpleOne==='true'){setError('Un compte Simple One ne peut pas être Co-leader.');return;}
      mutate((_d,f)=>f.invites.push({id:uid('invite'),name:form.name.trim(),relation:form.relation||'Proche',simpleOne:form.simpleOne==='true',role:(form.role||'member') as Role}));
      close();show('Invitation créée (en attente de validation simulée).');go('members');break;
   }
   case 'open-account':{
      if(!admin||family.account){setError('Action non disponible.');return;}
      mutate((_d,f)=>{f.account={id:uid('account'),label:'Sous-compte Famille',balance:0,limit:9000}});close();show('Sous-compte Famille ouvert (simulation).');break;
   }
   case 'open-joint':{
      // Do not bypass the two-holder onboarding, even from a legacy modal entry.
      close();mainGo('joint-account');show('Poursuivez le parcours de demande avec les deux cotitulaires.');break;
   }
   case 'transfer':{
      const amount=parseMoney(form.amount||'0');
      requestPayment({from:form.from||`simple:${viewer?.id}`,to:form.to||'account',amount,label:form.label?.trim()||'Virement familial',category:'Transferts'});break;
   }
   case 'simple-pay':case 'pay-bill':{
      const amount=parseMoney(form.amount||'0');
      if(modal==='pay-bill'&&form.alertId){const result=validateLinkedBillPayment(family,form.alertId,form.beneficiary||'',amount);if('reason' in result){setError(result.reason);return;}}
      requestPayment({from:form.from||'account',to:'external',amount,label:modal==='simple-pay'?`Simple Pay · ${form.beneficiary||'Destinataire'}`:`Facture · ${form.beneficiary||'Service'}`,category:modal==='simple-pay'?'Simple Pay':'Factures',alertId:modal==='pay-bill'&&form.alertId?form.alertId:undefined});break;
   }
   case 'create-card':{
     if(!admin){setError('Seul un Leader ou Co-leader peut attribuer une carte familiale.');return;}
     if(!form.source){setError('Choisissez un compte ou pocket.');return;}
     const holder=findMember(family,form.holder||data.viewerId);
     if(!holder||!canIssueFamilyCard(family,data.viewerId,form.source,holder.id)){
       setError('Le titulaire choisi ne peut pas recevoir une carte liée à cette source.');return;
     }
     mutate((_d,f)=>f.cards.push({id:uid('card'),label:form.label?.trim()||'Carte virtuelle',last4:String(Math.floor(1000+Math.random()*9000)),source:form.source,holderId:form.holder||data.viewerId,active:true}));close();show('Carte virtuelle ajoutée à la démonstration.');break;
   }
   case 'new-goal':{
     const target=parseMoney(form.target||'0');if(!moneyValid(target)){setError('Indiquez un objectif d’épargne valide.');return;}
     if(!form.title?.trim()){setError('Donnez un nom à votre objectif.');return;}
     if(!form.deadline||form.deadline<nowDate()){setError('Choisissez une date à venir.');return;}
     const ownerId=admin?(form.owner||data.viewerId):data.viewerId;
     const contributors=(form.contributors||ownerId).split(',').filter(id=>family.members.some(m=>m.id===id));
     mutate((_d,f)=>f.goals.push({id:uid('goal'),title:form.title.trim(),creatorId:data.viewerId,ownerId,target,balance:0,deadline:form.deadline,contributors:[...new Set([...contributors,ownerId])],scheduledAmount:0,status:'active',history:[]}));
     close();go('savings');show('Objectif d’épargne créé.');break;
   }
   case 'goal-deposit':{
     if(!goal||goal.status!=='active'){setError('Cet objectif est clôturé.');return;}
     if(!canFundSavingsGoal(family,data.viewerId,goal)){setError('Vous ne pouvez pas contribuer à cet objectif.');return;}
     const amount=parseMoney(form.amount||'0');
     if(!moneyValid(amount)||amount>goal.target-goal.balance){setError('Montant invalide ou supérieur au reste à atteindre.');return;}
     if((viewer?.simpleBalance||0)<amount){setError('Solde Simple insuffisant.');return;}
     mutate((_d,f)=>{const g=f.goals.find(x=>x.id===selectedGoal)!;const m=findMember(f,data.viewerId)!;
       m.simpleBalance=roundMoney(m.simpleBalance-amount);g.balance=roundMoney(g.balance+amount);
       g.history.unshift({id:uid('gh'),memberId:m.id,amount,date:today(),kind:'deposit'});
       if(g.balance>=g.target)closeSavingsGoal(f,g.id,'reached');
     });
     close();show(goal.balance+amount>=goal.target?'Objectif atteint : reversement fictif tracé au propriétaire.':'Contribution ajoutée.');break;
   }
   case 'goal-withdraw':{
     if(!goal||goal.status!=='active'||!canWithdrawSavingsGoal(family,data.viewerId,goal)){setError('Retrait non autorisé.');return;}
     const amount=parseMoney(form.amount||'0');if(!moneyValid(amount)||amount>goal.balance){setError('Montant supérieur à l’épargne disponible.');return;}
     mutate((_d,f)=>{const g=f.goals.find(x=>x.id===selectedGoal)!;g.balance=roundMoney(g.balance-amount);g.history.unshift({id:uid('gh'),memberId:data.viewerId,amount,date:today(),kind:'withdrawal'});findMember(f,g.ownerId)!.simpleBalance=roundMoney(findMember(f,g.ownerId)!.simpleBalance+amount)});close();show('Retrait simulé vers le compte du propriétaire.');break;
   }
   case 'goal-delete':{
     if(!goal||!(admin||goal.creatorId===data.viewerId)){setError('Action non autorisée.');return;}
     mutate((_d,f)=>{const g=f.goals.find(x=>x.id===selectedGoal)!;const own=findMember(f,g.ownerId);if(own&&g.status==='active')own.simpleBalance=roundMoney(own.simpleBalance+g.balance);f.goals=f.goals.filter(x=>x.id!==selectedGoal)});close();back();show('Objectif supprimé et fonds restitués (simulation).');break;
   }
   case 'goal-schedule':{
     if(!goal||goal.status!=='active'||!canScheduleGoal){setError('Modification non autorisée.');return;}
     const amount=parseMoney(form.amount||'0');
     if(amount<0||!Number.isFinite(amount)){setError('Montant invalide.');return;}
     const freq=form.frequency==='weekly'?'weekly':'monthly';
     const nextDate=form.nextDate||nowDate();
     if(amount>0&&nextDate<nowDate()){setError('Choisissez une prochaine date à venir.');return;}
     mutate((_d,f)=>{const g=f.goals.find(x=>x.id===selectedGoal)!;g.scheduledAmount=amount;g.scheduledFrequency=amount>0?freq:undefined;g.nextScheduledDate=amount>0?nextDate:undefined});
     close();show(amount>0?'Programmation indicative enregistrée, sans débit automatique.':'Programmation désactivée.');break;
   }
   case 'goal-edit':{
     if(!goal||goal.status!=='active'||!canManageGoal){setError('Modification non autorisée.');return;}
     const target=parseMoney(form.target||'0');
     if(!form.title?.trim()||!moneyValid(target)||target<goal.balance){setError('Saisissez un titre et une cible au moins égale au solde épargné.');return;}
     if(!form.deadline||form.deadline<nowDate()){setError('Choisissez une date future.');return;}
     const contributors=(form.contributors||'').split(',').filter(id=>family.members.some(m=>m.id===id));
     const allowed=[...new Set([...contributors,goal.ownerId])];
     mutate((_d,f)=>{const g=f.goals.find(x=>x.id===selectedGoal)!;
       g.title=form.title.trim();g.target=target;g.deadline=form.deadline;
       g.coverId=['goal_vac','goal_school','goal_weekend'].includes(form.coverId||'')?form.coverId:undefined;
       g.contributors=allowed;
       if(g.balance>=g.target)closeSavingsGoal(f,g.id,'reached');
     });
     close();setGoalManageOpen(false);show('Paramètres du projet enregistrés.');break;
   }
   case 'goal-close':{
     if(!goal||goal.status!=='active'||!canManageGoal){setError('Clôture non autorisée.');return;}
     mutate((_d,f)=>{closeSavingsGoal(f,selectedGoal,'manual')});
     close();setGoalManageOpen(false);show('Projet clôturé : reversement fictif au propriétaire enregistré, programmation arrêtée.');break;
   }
   case 'new-pot':{
     const target=parseMoney(form.target||'0');if(!moneyValid(target)||!form.title?.trim()){setError('Nom et objectif valides requis.');return;}
     if(form.deadline&&form.deadline<nowDate()){setError('Choisissez une date à venir.');return;}
     mutate((_d,f)=>f.pots.push({
       id:uid('pot'),title:form.title.trim(),target,balance:0,members:[data.viewerId],
       creatorId:data.viewerId,description:form.description?.trim()||'',deadline:form.deadline||'',
       contributions:[],pendingInvites:[],status:'active'
     }));
     close();show('Cagnotte créée. Vous pouvez inviter les membres de votre famille.');break;
   }
   case 'pot-deposit':{
     if(!pot||pot.status!=='active'||!canParticipateInPot){setError('Participation non autorisée à cette cagnotte.');return;}
     const amount=parseMoney(form.amount||'0'),source=form.source||`simple:${data.viewerId}`;
     if(!moneyValid(amount)||amount>pot.target-pot.balance){setError('Montant invalide ou supérieur au reste à collecter.');return;}
     if(!potFundingOptions.some(o=>o.value===source)||currentBalance(family,source)===undefined||currentBalance(family,source)!<amount){setError('Choisissez un compte personnel suffisamment approvisionné.');return;}
     const fundingRule=validatePocketDebit(family,data.viewerId,source,amount);
     if('reason' in fundingRule){setError(fundingRule.reason);return;}
     if(form.stage!=='confirm'){setForm(prev=>({...prev,source,stage:'confirm'}));return;}
     mutate((_d,f)=>{
       changeBalance(f,source,-amount);
       const p=f.pots.find(x=>x.id===selectedPot)!;
       p.balance=roundMoney(p.balance+amount);
       p.contributions=[{id:uid('pc'),memberId:data.viewerId,amount,date:today()},...(p.contributions||[])];
       if(p.balance>=p.target)closeFamilyPot(f,p.id,'target');
     });
     close();show('Contribution ajoutée à la cagnotte (simulation).');break;
   }
   case 'pot-invite':{
     if(!pot||pot.status!=='active'||!canManagePot){setError('Invitation non autorisée.');return;}
     const memberId=form.memberId;
     if(!potInviteCandidates.some(m=>m.id===memberId)){setError('Sélectionnez un membre éligible.');return;}
     mutate((_d,f)=>{const p=f.pots.find(x=>x.id===selectedPot)!;p.pendingInvites=[...new Set([...(p.pendingInvites||[]),memberId])]});
     close();show('Invitation enregistrée. En attente d’acceptation simulée.');break;
   }
   case 'pot-edit':{
     if(!pot||pot.status!=='active'||!canManagePot){setError('Modification non autorisée.');return;}
     const target=parseMoney(form.target||'0');
     if(!form.title?.trim()||!moneyValid(target)||target<pot.balance){setError('Indiquez un nom et un objectif au moins égal au montant collecté.');return;}
     if(form.deadline&&form.deadline<nowDate()){setError('Choisissez une date à venir ou laissez ce champ vide.');return;}
     mutate((_d,f)=>{const p=f.pots.find(x=>x.id===selectedPot)!;p.title=form.title.trim();p.description=form.description?.trim()||'';p.target=target;p.deadline=form.deadline||'';if(p.balance>=p.target)closeFamilyPot(f,p.id,'target')});
     close();show('Cagnotte mise à jour.');break;
   }
   case 'pot-close':{
     if(!pot||pot.status!=='active'||!canManagePot){setError('Clôture non autorisée.');return;}
     mutate((_d,f)=>{closeFamilyPot(f,selectedPot,'manual')});
     close();show('Collecte clôturée. Fonds conservés, sans reversement simulé (règles métier à confirmer).');break;
   }
   case 'new-document':{
     if(!form.title?.trim()){setError('Le nom du document est requis.');return;}
     const visibleTo=[...new Set([data.viewerId,...(form.visibleTo||'').split(',').filter(id=>family.members.some(m=>m.id===id))])];
     mutate((_d,f)=>f.documents.push({id:uid('doc'),title:form.title.trim(),type:form.type||'Autre',expiry:form.expiry||'',ownerId:data.viewerId,visibleTo}));close();show('Fiche document ajoutée (fichier non hébergé).');break;
   }
   case 'new-trip':{
     const travelerId=form.traveler||data.viewerId;
     if(!canCreateFamilyBooking(family,data.viewerId,travelerId)){
       setError('Cette réservation nécessite un responsable et un voyageur de la famille.');return;
     }
     if(!form.destination?.trim()||!form.date||form.date<nowDate()){
       setError('Indiquez une destination et une date de voyage valide.');return;
     }
     const amount=form.amount?.trim()?parseMoney(form.amount):0;
     if(!Number.isFinite(amount)||amount<0){setError('Le budget indicatif doit être positif ou nul.');return;}
     mutate((_d,f)=>f.bookings.push({id:uid('trip'),travelerId,destination:form.destination.trim(),date:form.date,amount}));close();show('Réservation fictive ajoutée, sans paiement.');break;
   }
   case 'new-credit':{
     const amount=parseMoney(form.amount||'0');if(!moneyValid(amount)){setError('Montant invalide.');return;}
     mutate((_d,f)=>f.creditRequests.push({id:uid('credit'),applicantId:data.viewerId,amount,account:form.account||`simple:${data.viewerId}`,status:'En étude'}));close();show('Demande fictive enregistrée, non transmise à une banque.');break;
   }
   case 'member-delete':{
     if(!admin||selectedMember===data.viewerId){setError('Suppression non autorisée.');return;}
     const toRemove=findMember(family,selectedMember);
     if(!toRemove||!canRemoveFamilyMember(family,data.viewerId,selectedMember)){
       setError('La suppression de ce membre n’est pas autorisée.');return;
     }
     const issues=memberRemovalIssues(family,selectedMember);
     if(issues.length){setError('Retrait indisponible : '+issues.join(' '));return;}
     mutate((_d,f)=>{
       f.pockets=f.pockets.filter(p=>p.ownerId!==selectedMember);
       f.members=f.members.filter(m=>m.id!==selectedMember);
       f.accountViewIds=f.accountViewIds.filter(id=>id!==selectedMember);
       f.cards=f.cards.filter(c=>c.holderId!==selectedMember&&c.source!==`pocket:${selectedMember}`);
       for(const p of f.pots)p.pendingInvites=(p.pendingInvites||[]).filter(id=>id!==selectedMember);
       for(const d of f.documents)d.visibleTo=d.visibleTo.filter(id=>id!==selectedMember);
     });
     close();go('members');show('Membre retiré et accès révoqués dans la démo.');break;
   }
   case 'family-delete':{
     if(!leader){setError('Seul le Leader peut supprimer la famille.');return;}
     setData(prev=>{const families=prev.families.filter(f=>f.id!==prev.activeFamilyId);return {...prev,families,activeFamilyId:families[0]?.id||null,viewerId:'lamia'}});close();toDashboard();show('Famille supprimée de la démonstration.');break;
   }
   case 'limit':{
     const limit=parseMoney(form.amount||'0');
     if(!admin||!moneyValid(limit)||!family.pockets.some(p=>p.ownerId===selectedMember)){
       setError('Un responsable doit choisir une pocket et saisir un plafond valide.');return;
     }
     mutate((_d,f)=>{const p=f.pockets.find(x=>x.ownerId===selectedMember);if(p)p.limit=limit});
     close();show('Plafond par virement sortant mis à jour (démo).');break;
   }
  }
 }
 function acceptInvite(inviteId:string){
   if(!family||!admin)return;
   const inv=family.invites.find(i=>i.id===inviteId);if(!inv)return;
   mutate((_d,f)=>{const i=f.invites.find(x=>x.id===inviteId)!;const mid=uid('member');f.members.push({id:mid,name:i.name,relation:i.relation,role:i.role,simpleOne:i.simpleOne,simpleBalance:i.simpleOne?200:1500,avatar:''});f.pockets.push({id:uid('pocket'),ownerId:mid,balance:0,limit:i.simpleOne?600:5000});f.invites=f.invites.filter(x=>x.id!==inviteId)});
   show(`${inv.name} a rejoint la famille (acceptation simulée).`);
 }
 function updateMemberRole(memberId:string,role:Role){
   if(!family||!canChangeMemberRole(family,data.viewerId,memberId,role)){show('Rôle non autorisé.');return;}
   mutate((_d,f)=>{findMember(f,memberId)!.role=role});show('Rôle mis à jour dans la démonstration.');
 }
 function createMessage(e:React.FormEvent){
   e.preventDefault();
   if(!family||!viewer||!activeChatId||!chatInput.trim()||!getVisibleChat(family,viewer.id,activeChatId))return;
   const threadId=activeChatId,text=chatInput.trim();
   mutate((_d,f)=>{sendChatMessage(f,viewer.id,threadId,text)});
   setChatInput('');
 }
 function toggleCard(id:string){
  const card=family?.cards.find(c=>c.id===id);
  if(!family||!card||!canToggleFamilyCard(family,data.viewerId,card)){
    show('Vous ne disposez pas des droits pour gérer cette carte.');return;
  }
  mutate((_d,f)=>{
    const target=f.cards.find(c=>c.id===id);
    if(target&&canToggleFamilyCard(f,data.viewerId,target))target.active=!target.active;
  });
  show('État de la carte actualisé (simulation).');
 }
 function switchFamily(id:string){const f=data.families.find(x=>x.id===id);if(!f)return;setData(prev=>({...prev,activeFamilyId:id,viewerId:f.members.find(x=>x.id==='lamia')?.id||f.members[0].id}));setSelectorOpen(false);toDashboard();}
 function switchViewer(id:string){setData(prev=>({...prev,viewerId:id}));setDemoOpen(false);toDashboard();show('Profil fictif changé : les accès se mettent à jour.');}
 const initialsFor = (id:string) => family?.members.find(m=>m.id===id)?.name||'Membre';
 const showBalance=(n:number)=>showAmounts?currency(n):'•••• DH';
 const context={}; void context;

 const pageTitles:Record<Route,string>={dashboard:'Ma famille',members:'Membres et accès',member:owner?.name||'Membre',accounts:'Comptes partagés','sub-account':'Sous-compte Famille','joint-account':'Compte joint',pockets:'Pockets des membres',pocket:`Pocket ${owner?.name||''}`,cards:'Cartes virtuelles',savings:'Nos projets d’épargne',goal:'Objectif d’épargne',pots:'Cagnottes familiales',pot:'Cagnotte',services:'Services familiaux',chat:'Chat Famille',vault:'Coffre-fort',trip:'Simple Trip',loyalty:'Ma fidélité',loan:'Demande de crédit',pfm:'Mon foyer · PFM',preferences:'Réglages Famille',invite:'Invitations',alerts:'À suivre en famille'};
 const mainGo=(next:Route)=>{
   if(next==='chat'){setActiveChatId(null);setChatInput('');}
   if(route===next)return;
   go(next);
 };
 const isAccountRoute=(value:Route|undefined):value is 'sub-account'|'joint-account'=>value==='sub-account'||value==='joint-account';
 // Keep account journeys mounted while drilling down into members, profiles, pockets or cards.
 // Returning through Back must restore the exact internal bank step, not restart the journey.
 const stackedAccountRoute=[...stack].reverse().find(isAccountRoute)||null;
 const mountedAccountRoute=isAccountRoute(route)?route:stackedAccountRoute;
 const navigateToMember=(id:string)=>{setSelectedMember(id);go('pocket')};
 const navigateToMemberProfile=(id:string)=>{setSelectedMember(id);go('member')};
 const openMemberCards=(id:string)=>{setSelectedMember(id);setCardsMemberFilter(id);go('cards')};
 const navigateToGoal=(id:string)=>{setSelectedGoal(id);setGoalManageOpen(false);setShowAllGoalMovements(false);go('goal')};
 const navigateToPot=(id:string)=>{setSelectedPot(id);setPotMenuOpen(false);setShowAllPotContributions(false);go('pot')};
 const openTrip=()=>{setTripTravelerId(null);go('trip')};
 const openTripForMember=(id:string)=>{
   if(!family?.members.some(m=>m.id===id)||!admin)return;
   setTripTravelerId(id);go('trip');
 };
 const openChatWithDraft=(draft:string)=>{setActiveChatId(FAMILY_ROOM_ID);setChatInput(draft);go('chat')};
 const openChatThread=(id:string)=>{
   if(!family||!getVisibleChat(family,data.viewerId,id))return;
   setChatInput('');setActiveChatId(id);
 };
 const startPrivateConversation=(otherId:string)=>{
   if(!family||!family.members.some(m=>m.id===otherId&&m.id!==data.viewerId))return;
   const existing=visibleChats(family,data.viewerId).find(room=>room.kind==='direct'&&
      room.participantIds.includes(otherId));
   const id=existing?.id||uid('direct');
   if(!existing)mutate((_d,f)=>{startDirectChat(f,data.viewerId,otherId,id)});
   setChatInput('');setActiveChatId(id);
 };
 const startGroupConversation=(title:string,participantIds:string[])=>{
   if(!family||title.trim().length<2||participantIds.length<2||
      participantIds.some(id=>!family.members.some(m=>m.id===id&&id!==data.viewerId)))return;
   const id=uid('group');
   mutate((_d,f)=>{createGroupChat(f,data.viewerId,title,participantIds,id)});
   setChatInput('');setActiveChatId(id);
 };
 const editChatGroup=(id:string,title:string,participants:string[]):boolean=>{
   if(!family||!canManageChatGroup(family,data.viewerId,id)||!title.trim()||
      participants.length<1||participants.some(id=>!family.members.some(m=>m.id===id)))return false;
   mutate((_d,f)=>{updateChatGroup(f,data.viewerId,id,title,participants)});
   return true;
 };
 const serviceLinks=family?getFamilyServiceLinks(family,data.viewerId):[];
 const serviceIcons:Record<ServiceLink['kind'],typeof Bell>={
   trip:Plane,goal:Target,pot:Gift,document:FileText,chat:MessageCircle
 };
 const openServiceLink=(link:ServiceLink)=>{
   if(link.action.route==='goal')navigateToGoal(link.action.id);
   else if(link.action.route==='pot')navigateToPot(link.action.id);
   else if(link.action.route==='trip')openTrip();
   else mainGo(link.action.route);
 };
 const balances={family:family?.account?.balance||0,joint:family?.joint?.balance||0};void balances;
 const goalHomeLabel=(g:Family['goals'][number])=>{
   if(g.contributors.length<=1)return `Objectif d’épargne · ${initialsFor(g.ownerId)}`;
   const n=new Set(g.history.filter(h=>h.kind==='deposit').map(h=>h.memberId)).size;
   return n?`Projet familial · ${n} contributeur${n>1?'s':''}`:'Projet familial · Contributions ouvertes';
 };
 const familyFollowUps=family?getFamilyFollowUps(family,data.viewerId,nowDate()):[];
 const homeFollowUps=familyFollowUps.slice(0,2);
 const followUpIcons:Record<FamilyFollowUpKind,typeof Bell>={
   bill:CalendarClock,'family-invite':UserPlus,'joint-awaiting':HeartHandshake,
   'joint-review':ShieldCheck,'joint-rejected':HeartHandshake,'pot-invite':Gift,
   'goal-deadline':Target,'pot-deadline':CalendarDays,'document-expiry':FileText
 };
 const openFollowUp=(item:FamilyFollowUp)=>{
   const action=item.action;
   if(action.route==='pay-bill'){
     const bill=family?.alerts.find(a=>a.id===action.id&&!a.resolved);
     if(!bill||!admin)return;
     launch('pay-bill',{from:'account',beneficiary:bill.beneficiary,amount:String(bill.amount),alertId:bill.id});
   } else if(action.route==='goal')navigateToGoal(action.id);
   else if(action.route==='pot')navigateToPot(action.id);
   else mainGo(action.route);
 };

 return <div className="simple-family-interactions min-h-full flex flex-col bg-simple-canvas relative">
   {route==='dashboard' ? <div className="sticky top-0 z-30 bg-[#F6F3FE]/85 backdrop-blur-md px-5 pt-3 pb-3">
    <div className="flex items-center justify-between gap-2"><button onClick={()=>navigate('HOME')} type="button" aria-label="Retour accueil" className="family-hover-control w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><ArrowLeft size={19}/></button>
     <div className="text-center min-w-0 flex-1"><p className="text-[11px] text-[#85769D]">Espace familial</p><h1 className="font-extrabold text-[18px] leading-tight truncate">Ma famille</h1></div>
     <button type="button" aria-label="Réglages de la famille" onClick={()=>mainGo('preferences')} className="family-hover-control w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><Settings2 size={19}/></button>
    </div></div> : <MobileHeader title={pageTitles[route]} onBack={handleBack} subtitle={route==='goal'?'Projet d’épargne familial':route==='pot'?'Collecte familiale':route==='savings'?'Gérez les projets de votre famille':route==='pfm'?'Aperçu de la passerelle':'Services de votre famille'}/>}
   <div className="px-5 pb-7 pt-3 space-y-5 flex-1">
     {route!=='savings'&&route!=='pot'&&route!=='goal'&&<div className="flex items-center justify-between gap-2 px-1"><span className="flex items-center gap-1.5 text-[10px] font-bold text-[#7E4DBD]"><span className="w-1.5 h-1.5 bg-[#7B34E8] rounded-full"/> PROTOTYPE INTERACTIF</span><button type="button" onClick={()=>setDemoOpen(o=>!o)} className="text-[10px] text-[#6A2CCC] font-bold bg-[#EDE5FD] px-2.5 py-1.5 rounded-full flex items-center gap-1">Mode démo <ChevronDown size={12}/></button></div>}
     {route!=='savings'&&route!=='pot'&&route!=='goal'&&demoOpen && <Panel className="p-4 space-y-3"><div className="flex justify-between items-center"><strong className="text-sm">Tester les droits par profil</strong><button type="button" aria-label="Fermer" onClick={()=>setDemoOpen(false)}><X size={17}/></button></div>
       {family?.members.map(m=><button key={m.id} type="button" onClick={()=>switchViewer(m.id)} className="w-full flex items-center gap-2 p-2 bg-[#F8F5FE] rounded-xl text-left"><Avatar member={m} size={29}/><span className="text-xs font-bold flex-1">{m.name}</span><Tag tone={m.id===data.viewerId?'green':'gray'}>{roleLabel(m.role)}</Tag></button>)}
       <button type="button" className="text-xs font-bold text-[#8C4DDA]" onClick={()=>{setData(createDemoState());toDashboard();setDemoOpen(false);show('Scénario initial restauré.')}}><RotateCcw size={13} className="inline mr-1"/> Restaurer les données fictives</button>
     </Panel>}
     {!family ? <div className="space-y-4 pt-7"><Panel className="p-6 text-center space-y-4"><div className="text-5xl">💜</div><h2 className="text-[24px] font-extrabold leading-tight">Votre famille, au même endroit</h2><p className="text-sm text-[#80758D]">Créez un espace pour gérer vos proches, leurs pockets et vos services familiaux.</p><PillButton onClick={()=>launch('new-family',{openAccount:'false',emoji:'💜'})}>Créer ma famille <ArrowRight size={17}/></PillButton></Panel><button className="w-full text-sm font-bold text-[#6C2BCF]" onClick={()=>{setData(createDemoState());toDashboard()}}>Explorer le scénario de démonstration</button></div> : <>
     {route==='dashboard' && <>
       {/* Family identity and family switcher: one shared entry for changing or adding a family. */}
       <div className="space-y-3">
         <section className="relative min-h-[212px] overflow-hidden rounded-[29px] shadow-[0_12px_34px_rgba(66,20,126,0.18)]">
           <img src={familyPhoto} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-center"/>
           <div className="absolute inset-0 bg-gradient-to-r from-[#240958]/95 via-[#42147C]/72 to-[#290C5A]/30"/>
           <div className="relative z-10 min-h-[212px] p-5 flex flex-col justify-between text-white">
             <div className="flex items-start justify-between gap-2">
               <div className="min-w-0">
                 <p className="text-[10px] font-bold text-white/75 uppercase tracking-[0.12em]">Notre espace familial</p>
                 <h2 className="mt-2 text-[23px] font-extrabold font-display leading-tight break-words">{family.name}</h2>
                 <p className="text-[12px] text-white/85 mt-1">{family.members.length} membre{family.members.length>1?'s':''} · {roleLabel(viewer?.role||'member')}</p>
               </div>
               <button type="button" ref={familySelectorButtonRef} onClick={toggleFamilySelector} aria-haspopup="menu" aria-controls="family-selector-menu" aria-expanded={selectorOpen} aria-label="Changer ou ajouter une famille"
                 className="family-hover-glass shrink-0 bg-white/20 backdrop-blur-md border border-white/35 text-white rounded-full px-3 py-2 text-[11px] font-bold flex items-center gap-1.5">
                 Mes familles <ChevronDown size={14}/>
               </button>
             </div>
             <div className="flex items-end justify-between gap-3">
               <button type="button" onClick={()=>mainGo('members')} className="family-hover-hero text-[12px] font-bold rounded-full px-3.5 py-2.5 bg-white text-[#5120A8] inline-flex items-center gap-2">
                 Voir les membres <ArrowRight size={15}/>
               </button>
               <div className="flex -space-x-2" aria-label="Aperçu des membres">
                 {family.members.slice(0,3).map(m=><Avatar key={m.id} member={m} size={34}/>)}
                 {family.members.length>3&&<button type="button" onClick={()=>mainGo('members')}
                   aria-label={`Voir les ${family.members.length-3} autres membres`}
                   className="relative shrink-0 w-[34px] h-[34px] rounded-full flex items-center justify-center bg-white/25 text-white border-2 border-white/80 text-[11px] font-extrabold backdrop-blur-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
                   +{family.members.length-3}
                 </button>}
               </div>
             </div>
           </div>
         </section>
         
       </div>

       {/* Deux rappels contextuels sur la Home ; liste complète dans « Voir tout ». */}
       {familyFollowUps.length>0&&<section>
         <Heading title="À suivre en famille" right={<button type="button" onClick={()=>mainGo('alerts')} className="family-hover-link text-[12px] text-[#6428DF] font-bold flex items-center">Voir tout <ChevronRight size={15}/></button>}/>
         <Panel className="px-4">
           {homeFollowUps.map(item=><AlertItem key={item.id} icon={followUpIcons[item.kind]}
             title={item.title} subtitle={item.subtitle} badge={item.badge}
             tone={item.priority==='urgent'?'amber':'violet'} onClick={()=>openFollowUp(item)}/>)}
         </Panel>
       </section>}

       <section>
         <Heading title="Comptes partagés" right={<button type="button" onClick={()=>mainGo('accounts')} className="family-hover-link text-[12px] text-[#6428DF] font-bold flex items-center">Voir tout <ChevronRight size={15}/></button>}/>
         <div className="grid grid-cols-2 gap-3">
           <button type="button" onClick={()=>mainGo('sub-account')} className="family-hover-card bg-white border border-[#EBE4F4] rounded-[23px] p-4 text-left min-h-[126px] flex flex-col shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7630E3]">
             <div className="flex justify-between items-center"><Landmark size={21} className="text-[#7430DD]"/><ArrowUpRight size={16} className="text-[#A99EB8]"/></div>
             <p className="text-[11px] leading-tight text-[#726582] mt-3">Sous-compte Famille</p><p className="text-[10px] text-[#756785] mt-0.5">Dépenses communes</p>
             <p className="text-[17px] font-extrabold tracking-tight leading-tight mt-auto pt-2">{family.account?(canViewFamilyAccount?showBalance(family.account.balance):'Accès restreint'):'À créer'}</p>
           </button>
           {canViewJointAccount(family,data.viewerId)&&<button type="button" onClick={()=>mainGo('joint-account')} className="family-hover-card bg-white border border-[#EBE4F4] rounded-[23px] p-4 text-left min-h-[126px] flex flex-col shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7630E3]">
             <div className="flex justify-between items-center"><HeartHandshake size={21} className="text-[#7430DD]"/><ArrowUpRight size={16} className="text-[#A99EB8]"/></div>
             <p className="text-[11px] leading-tight text-[#726582] mt-3">Compte joint</p><p className="text-[10px] text-[#756785] mt-0.5">Compte bancaire à deux</p>
             <p className="text-[17px] font-extrabold tracking-tight leading-tight mt-auto pt-2">{showBalance(family.joint.balance)}</p>
           </button>}
           {admin&&!family.joint&&<button type="button" onClick={()=>mainGo('joint-account')} className="family-hover-card bg-[#F5F0FC] border border-dashed border-[#D6C4F0] rounded-[23px] p-4 text-left min-h-[126px] flex flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7630E3]">
             <div className="flex justify-between items-center"><HeartHandshake size={21} className="text-[#8F69C2]"/><Plus size={16} className="text-[#8F69C2]"/></div>
             <p className="text-[11px] leading-tight text-[#726582] mt-3">Compte joint</p><p className="text-[10px] text-[#756785] mt-0.5">Compte bancaire à deux</p>
             <p className="text-[13px] font-bold text-[#6B35B1] mt-1">{family.jointApplication&&[family.jointApplication.requesterId,family.jointApplication.coHolderId].includes(data.viewerId)?(family.jointApplication.status==='awaiting'?'Accord en attente':family.jointApplication.status==='review'?'En cours de validation':'Demande refusée'):'À ouvrir'}</p>
           </button>}
         </div>
       </section>

       <section>
         <Heading title="Pockets des membres" right={<button type="button" onClick={()=>mainGo('pockets')} className="family-hover-link text-[12px] text-[#6428DF] font-bold flex items-center">Voir tout <ChevronRight size={15}/></button>}/>
         <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pr-3 scroll-smooth snap-x snap-mandatory scroll-px-1">
           {visiblePockets.slice(0,3).map(p=>{const m=findMember(family,p.ownerId);return <button key={p.id} type="button" onClick={()=>navigateToMember(p.ownerId)}
             className="family-hover-card shrink-0 snap-start w-[152px] rounded-[23px] p-4 bg-white border border-[#E9E1F5] text-left shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7630E3]">
             <div className="flex items-center justify-between"><Avatar member={m} size={36}/><ArrowUpRight size={16} className="text-[#8D67C9]"/></div>
             <p className="mt-3 text-[11px] text-[#82778F] truncate">Pocket {m?.name}</p>
             <p className="font-extrabold text-[16px] mt-1 truncate">{showBalance(p.balance)}</p>
           </button>})}
           {visiblePockets.length===0&&<Panel className="p-4 w-full"><p className="text-[12px] text-[#81758E]">Aucun pocket accessible avec votre profil.</p></Panel>}
         </div>
       </section>

       {/* Two cards visible in each preview; swipe to view the second. */}
       <section>
         <Heading title="Nos projets d’épargne" right={<button type="button" onClick={()=>mainGo('savings')} className="family-hover-link text-[12px] text-[#6428DF] font-bold flex items-center">Voir tout <ChevronRight size={15}/></button>}/>
         {visibleGoals.some(g=>g.status==='active')?
           <FamilyPreviewCarousel label="Projets d’épargne, faire défiler horizontalement">
             {visibleGoals.filter(g=>g.status==='active').slice(0,2).map(g=><FamilyProgressPhotoCard key={g.id} id={g.coverId||g.id} kind="goal" title={g.title}
               description={`Échéance : ${dateFor(g.deadline)}`} current={g.balance} target={g.target} showAmounts={showAmounts} onClick={()=>navigateToGoal(g.id)}/>)}
           </FamilyPreviewCarousel>:
           <Panel className="p-5 flex items-center gap-3"><PiggyBank size={24} className="text-[#7732D9] shrink-0"/>
             <div className="flex-1"><p className="text-[13px] font-bold">Un projet à préparer ensemble ?</p>
               <button type="button" onClick={()=>mainGo('savings')} className="text-[12px] font-bold text-[#6929D4] mt-1">Créer un projet <ArrowRight size={14} className="inline"/></button>
             </div>
           </Panel>}
       </section>
       <section>
         <Heading title="Nos cagnottes" right={<button type="button" onClick={()=>mainGo('pots')} className="family-hover-link text-[12px] text-[#6428DF] font-bold flex items-center">Voir tout <ChevronRight size={15}/></button>}/>
         {family.pots.some(p=>p.status==='active')?
           <FamilyPreviewCarousel label="Cagnottes, faire défiler horizontalement">
             {family.pots.filter(p=>p.status==='active').slice(0,2).map(p=><FamilyProgressPhotoCard key={p.id} id={p.id} kind="pot" title={p.title}
               description={`Cagnotte collective · ${p.members.length} participants`} current={p.balance} target={p.target} showAmounts={showAmounts} onClick={()=>navigateToPot(p.id)}/>)}
           </FamilyPreviewCarousel>:
           <Panel className="p-5 flex items-center gap-3"><Gift size={24} className="text-[#198A66] shrink-0"/>
             <div className="flex-1"><p className="text-[13px] font-bold">Une occasion à célébrer ?</p>
               <button type="button" onClick={()=>mainGo('pots')} className="text-[12px] font-bold text-[#6929D4] mt-1">Créer une cagnotte <ArrowRight size={14} className="inline"/></button>
             </div>
           </Panel>}
       </section>

       <section>
         <Heading title="Services familiaux" right={<button type="button" onClick={()=>mainGo('services')} className="family-hover-link text-[12px] text-[#6428DF] font-bold flex items-center">Tous les services <ChevronRight size={15}/></button>}/>
         <Panel className="px-3 py-4">
           <div className="grid grid-cols-4 gap-1.5">
             {[{label:'Chat familial',icon:MessageCircle,screen:'chat'},{label:'Simple Trip',icon:Plane,screen:'trip'},{label:'Documents',icon:LockKeyhole,screen:'vault'},{label:'Autres',icon:MoreHorizontal,screen:'services'}].map(item=>
               <button type="button" key={item.label} onClick={()=>item.screen==='trip'?openTrip():mainGo(item.screen as Route)} className="family-hover-service w-full min-w-0 min-h-[76px] rounded-2xl px-0.5 py-1 flex flex-col items-center justify-start gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7630E3]">
                 <span className="w-11 h-11 rounded-[16px] bg-[#F2EAFE] text-[#6E28D7] flex items-center justify-center"><item.icon size={20}/></span>
                 <span className="text-[10px] font-bold text-center leading-tight text-[#554568] break-words">{item.label}</span>
               </button>)}
           </div>
         </Panel>
       </section>

       <section className="rounded-[26px] border border-[#E1D4FA] bg-gradient-to-r from-[#F0E8FF] to-[#EDEBFD] p-4 flex items-start gap-3">
         <div className="bg-white text-[#7731DF] w-11 h-11 rounded-full flex items-center justify-center shrink-0"><Sparkles size={21}/></div>
         <div className="flex-1"><p className="text-[14px] font-extrabold">Pilotez les finances de votre foyer</p>
           <p className="text-[12px] text-[#7E7394] mt-1 leading-relaxed">Analysez vos dépenses familiales, suivez vos budgets et recevez des conseils adaptés.</p>
           <button type="button" onClick={()=>mainGo('pfm')} className="family-hover-link text-[12px] text-[#6024D1] font-bold mt-2 flex items-center gap-1">Découvrir Mon foyer <ArrowRight size={14}/></button>
         </div>
       </section>
     </>}

     {route==='alerts'&&<>
        <Panel className="p-5 space-y-2">
          <h2 className="text-[18px] font-extrabold">Les alertes de ma famille</h2>
          <p className="text-[12px] text-[#81758F] leading-relaxed">Retrouvez les actions importantes à suivre avec votre famille, selon vos droits.</p>
          {familyFollowUps.length>0&&<div className="flex flex-wrap gap-2 pt-1">
            <Tag tone="violet">{familyFollowUps.length} à suivre</Tag>
            {familyFollowUps.some(item=>item.priority==='urgent')&&<Tag tone="amber">{familyFollowUps.filter(item=>item.priority==='urgent').length} prioritaire(s)</Tag>}
          </div>}
        </Panel>
        {familyFollowUps.length>0?<Panel className="px-4">
          {familyFollowUps.map(item=><AlertItem key={item.id} icon={followUpIcons[item.kind]}
            title={item.title} subtitle={item.subtitle} badge={item.badge}
            tone={item.priority==='urgent'?'amber':'violet'} onClick={()=>openFollowUp(item)}/>)}
        </Panel>:<Panel className="p-6 space-y-2 text-center">
          <CheckCircle2 size={26} className="mx-auto text-[#20A475]"/>
          <h3 className="text-[14px] font-extrabold">Tout est à jour !</h3>
          <p className="text-[12px] text-[#81758F]">Aucune action à suivre avec votre profil actuellement.</p>
        </Panel>}
        <p className="px-1 text-[11px] text-[#897B9A]">Événements et échéances calculés à partir du scénario fictif. Aucune notification bancaire réelle n’est envoyée.</p>
      </>}

      {route==='members' && <>
       <Panel className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-[#887C97]">Composition de la famille</p><h2 className="font-extrabold text-[22px] mt-1">{family.members.length} membres</h2></div><div className="text-3xl">👨‍👩‍👧</div></div></Panel>
       <section><Heading title="Membres" right={admin&&<button type="button" onClick={()=>launch('invite',{relation:'Proche',role:'member',simpleOne:'false'})} className="text-xs font-bold text-[#6725D8] flex items-center gap-1"><Plus size={15}/>Inviter</button>}/><Panel className="px-4">{family.members.map(m=>{const p=family.pockets.find(x=>x.ownerId===m.id);return <div key={m.id} className="py-3.5 flex items-center gap-3 border-b last:border-none border-[#F0EBF6]"><Avatar member={m} size={46}/><button type="button" onClick={()=>navigateToMemberProfile(m.id)} aria-label={`Consulter la fiche de ${m.name}`} className="text-left flex-1 min-w-0"><p className="text-[14px] font-extrabold">{m.name} {m.id===data.viewerId&&<span className="text-[#9359DA] text-[10px]">(vous)</span>}</p><p className="text-[11px] text-[#80758E]">{m.relation} · Pocket {p&&canViewPocket(family,data.viewerId,m.id)?showBalance(p.balance):p?'Accès réservé':'—'}</p><div className="mt-1"><Tag tone={m.role==='leader'?'violet':m.simpleOne?'amber':'gray'}>{m.simpleOne?'Simple One':roleLabel(m.role)}</Tag></div></button>{leader&&m.role!=='leader'&&!m.simpleOne&&<select aria-label={`Rôle de ${m.name}`} className="text-[10px] w-[93px] bg-[#F8F4FF] rounded-xl px-1 py-2" value={m.role} onChange={e=>updateMemberRole(m.id,e.target.value as Role)}><option value="member">Membre</option><option value="coleader">Co-leader</option></select>}{admin&&m.role!=='leader'&&(m.role!=='coleader'||leader)&&<button type="button" aria-label={`Retirer ${m.name}`} onClick={()=>{setSelectedMember(m.id);launch('member-delete')}} className="text-[#B68BAF] p-1.5"><Trash2 size={16}/></button>}</div>})}</Panel></section>
       <section><Heading title="Invitations en attente"/><Panel className="p-4 space-y-2">{family.invites.length?family.invites.map(inv=><div key={inv.id} className="flex items-center justify-between gap-2 p-2 bg-[#FAF7FF] rounded-xl"><div><p className="text-[13px] font-bold">{inv.name}</p><p className="text-[11px] text-[#887D98]">{inv.relation} · Invitation en attente</p></div>{admin&&<button type="button" className="text-[11px] rounded-full px-3 py-2 bg-[#E7FAEF] text-[#168253] font-bold" onClick={()=>acceptInvite(inv.id)}>Simuler acceptation</button>}</div>):<p className="text-[12px] text-[#81768F]">Aucune invitation en attente.</p>}</Panel></section>
       <Panel className="p-4 flex items-start gap-2.5"><ShieldCheck size={18} className="text-[#6535D7] shrink-0"/><p className="text-[11px] leading-relaxed text-[#7F758D]">Les invitations et rattachements sont simulés. Un membre Simple One ne peut pas devenir Co-leader. Les autorisations réelles restent à confirmer avec les équipes métiers.</p></Panel>
     </>}

     {route==='member' && owner && <MemberProfile
       key={owner.id}
       family={family}
       memberId={owner.id}
       viewerId={data.viewerId}
       showAmounts={showAmounts}
       onPocket={()=>navigateToMember(owner.id)}
       onTopup={()=>launch('transfer',{from:admin&&family.account?'account':`simple:${data.viewerId}`,to:`pocket:${owner.id}`})}
       onTransfer={()=>launch('transfer',{from:`pocket:${owner.id}`,to:`simple:${data.viewerId}`})}
       onCards={()=>openMemberCards(owner.id)}
       onGoal={navigateToGoal}
       onPermissions={()=>mainGo('preferences')}
       onTrip={()=>openTripForMember(owner.id)}
       onDocuments={()=>mainGo('vault')}
       onChat={()=>mainGo('chat')}
     />}

     {route==='accounts' && <>
        <section>
          <Heading title="Choisissez votre compte" subtitle="Deux usages distincts pour votre famille"/>
          <div className="space-y-3">
            <button type="button" onClick={()=>mainGo('sub-account')} className="card-simple w-full p-5 text-left hover:bg-[#FBF8FF] transition-colors flex gap-3 items-center">
              <span className="w-12 h-12 rounded-2xl bg-[#F2EAFE] text-[#7028DB] flex items-center justify-center shrink-0"><Landmark size={23}/></span>
              <span className="min-w-0 flex-1"><span className="font-extrabold text-[14px] block">Sous-compte Famille</span>
                <span className="block text-[11px] text-[#81758E] mt-1">Dépenses communes et accès familiaux</span>
                <span className="block text-[16px] font-extrabold mt-2">{family.account?(canViewFamilyAccount?showBalance(family.account.balance):'Accès restreint'):'À créer'}</span>
              </span><ChevronRight size={18} className="text-[#8D79AC] shrink-0"/>
            </button>
            <button type="button" onClick={()=>mainGo('joint-account')} className="card-simple w-full p-5 text-left hover:bg-[#FBF8FF] transition-colors flex gap-3 items-center">
              <span className="w-12 h-12 rounded-2xl bg-[#F2EAFE] text-[#7028DB] flex items-center justify-center shrink-0"><HeartHandshake size={23}/></span>
              <span className="min-w-0 flex-1"><span className="font-extrabold text-[14px] block">Compte joint</span>
                <span className="block text-[11px] text-[#81758E] mt-1">Compte bancaire détenu par deux cotitulaires</span>
                <span className="block text-[16px] font-extrabold mt-2">{family.joint?(canViewJointAccount(family,data.viewerId)?showBalance(family.joint.balance):'Accès restreint'):family.jointApplication&&[family.jointApplication.requesterId,family.jointApplication.coHolderId].includes(data.viewerId)?'Ouverture en cours':'À ouvrir'}</span>
              </span><ChevronRight size={18} className="text-[#8D79AC] shrink-0"/>
            </button>
          </div>
        </section>
        <Panel className="px-4">
          <ActionLine icon={WalletCards} title="Pockets des membres" subtitle="Soldes et alimentation de chaque pocket" onClick={()=>mainGo('pockets')}/>
          <ActionLine icon={BarChart3} title="Comprendre les dépenses partagées" subtitle="Aperçu PFM · uniquement les comptes consultables" onClick={()=>mainGo('pfm')}/>
        </Panel>
      </>}

      {mountedAccountRoute&&<div className={isAccountRoute(route)?'':'hidden'}>
        <AccountJourneys
          ref={accountJourneyRef}
          showAmounts={showAmounts}
          key={family.id+mountedAccountRoute}
          kind={mountedAccountRoute==='sub-account'?'sub':'joint'} family={family}
          viewerId={data.viewerId} canViewSub={canViewFamilyAccount}
          onUpdate={fn=>mutate((_d,f)=>fn(f))}
          onBack={back} onHome={toDashboard} onToast={show}
          onOpenMembers={()=>mainGo('members')}
        />
      </div>}

      {route==='pockets'&&<>
       <Panel className="p-5 space-y-2">
         <div className="w-11 h-11 rounded-2xl bg-[#F1E8FF] text-[#6D2DDB] flex items-center justify-center"><WalletCards size={22}/></div>
         <h2 className="text-[18px] font-extrabold">Les pockets de la famille</h2>
         <p className="text-[12px] leading-relaxed text-[#81758F]">Chaque pocket est associée à un membre. Son solde est distinct de la sous-compte Famille et des projets d’épargne.</p>
       </Panel>
       <section><Heading title="Pockets accessibles" subtitle="Selon votre rôle et les permissions familiales"/>
         <Panel className="px-4">
           {visiblePockets.map(p=>{const m=findMember(family,p.ownerId);return <button type="button" onClick={()=>navigateToMember(p.ownerId)} key={p.id} className="w-full flex items-center gap-3 text-left py-3.5 border-b last:border-none border-[#F0EBF6]">
             <Avatar member={m} size={43}/>
             <div className="flex-1 min-w-0"><p className="font-bold text-[13px]">Pocket {m?.name}</p><p className="text-[11px] text-[#81768F] mt-0.5">Plafond indicatif : {currency(p.limit)}</p></div>
             <span className="text-[13px] font-extrabold whitespace-nowrap">{showBalance(p.balance)}</span><ChevronRight size={15} className="text-[#AAA0B8] shrink-0"/>
           </button>})}
           {visiblePockets.length===0&&<p className="py-5 text-[12px] text-[#81758F]">Aucune pocket accessible avec ce profil.</p>}
         </Panel>
       </section>
     </>}

     {route==='pocket'&&pocket&&owner&&<PocketDetail
       key={family.id+owner.id}
       family={family} ownerId={owner.id} viewerId={data.viewerId} showAmounts={showAmounts}
       onTopup={()=>launch('transfer',{from:admin&&family.account?'account':`simple:${data.viewerId}`,to:`pocket:${owner.id}`})}
       onTransfer={()=>launch('transfer',{from:`pocket:${owner.id}`,to:`simple:${data.viewerId}`})}
       onCards={()=>openMemberCards(owner.id)}
       onLimit={()=>launch('limit',{amount:String(pocket.limit)})}
       onProfile={()=>navigateToMemberProfile(owner.id)}
     />}

     {route==='cards'&&<FamilyCardsView
       family={family} viewerId={data.viewerId} memberFilter={cardsMemberFilter}
       onToggle={toggleCard} onOpenPocket={navigateToMember}
       onCreate={()=>launch('create-card',{
         source:cardsMemberFilter?`pocket:${cardsMemberFilter}`:family.account?'family':`pocket:${data.viewerId}`,
         holder:cardsMemberFilter||data.viewerId
       })}
     />}

     {route==='savings'&&<>
       <Panel className="p-4 bg-[#F1EAFC] border border-[#E1D5F5] shadow-none">
         <div className="flex items-center gap-2 text-[#6730BE]"><PiggyBank size={18}/><p className="text-[12px] font-semibold">Total épargné dans nos projets</p></div>
         <p className="text-[28px] font-extrabold text-[#361753] mt-2">{showBalance(visibleGoals.filter(g=>g.status==='active').reduce((sum,g)=>sum+g.balance,0))}</p>
         <div className="flex items-center gap-2 mt-1 text-[#806D99]"><Target size={14}/><p className="text-[11px]">{visibleGoals.filter(g=>g.status==='active').length} projet{visibleGoals.filter(g=>g.status==='active').length!==1?'s':''} en cours{admin?'':' · Selon vos accès'}</p></div>
       </Panel>
       <section>
         <Heading title="Tous nos projets" right={
           <button type="button" aria-label="Créer un nouveau projet d'épargne"
             onClick={()=>launch('new-goal',{owner:data.viewerId,deadline:'2027-07-15',contributors:admin?family.members.map(m=>m.id).join(','):data.viewerId})}
             className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-white bg-[#6B26D8] text-[12px] font-bold shadow-sm">
             <Plus size={15}/> Nouveau
           </button>
         }/>
         <div role="group" aria-label="Filtrer les projets" className="grid grid-cols-3 bg-[#EDE6F8] p-1 rounded-[17px] gap-1 mb-3">
           {([{value:'all',label:'Tous'},{value:'active',label:'En cours'},{value:'closed',label:'Terminés'}] as const).map(option=>
             <button type="button" key={option.value} aria-pressed={projectFilter===option.value}
               onClick={()=>setProjectFilter(option.value)}
               className={'rounded-[13px] py-2 px-1 text-[11px] font-bold transition-colors '+(projectFilter===option.value?'bg-white text-[#6D24DA] shadow-sm':'text-[#827391] hover:bg-white/65')}>
               {option.label}
             </button>)}
         </div>
         <p className="text-[11px] text-[#887A98] px-1 mb-3">{filteredGoals.length} projet{filteredGoals.length!==1?'s':''} affiché{filteredGoals.length!==1?'s':''}</p>
         <div className="space-y-3">
           {filteredGoals.map(g=><button key={g.id} type="button" onClick={()=>navigateToGoal(g.id)}
             className="block w-full rounded-[23px] bg-white border border-[#EBE3F5] p-3 text-left shadow-sm hover:shadow-[0_6px_20px_rgba(85,35,135,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8000EB]">
             <div className="flex gap-3 items-center">
               <div className="w-[83px] h-[83px] shrink-0 rounded-[18px] overflow-hidden bg-[#F0E9F9]">
                 <FamilyPhotoCover id={g.coverId||g.id} kind="goal" label={`Photo du projet ${g.title}`}/>
               </div>
               <div className="min-w-0 flex-1">
                 <div className="flex items-start gap-1 justify-between">
                   <h3 className="text-[13px] font-extrabold leading-snug text-[#2D1D40] line-clamp-2">{g.title}</h3>
                   <ChevronRight size={16} className="text-[#AA99BA] shrink-0"/>
                 </div>
                 <p className="text-[10px] text-[#887A99] mt-1">{g.deadline?`Échéance : ${dateFor(g.deadline)}`:'Sans échéance'}</p>
                 <div className="mt-2"><Progress value={g.balance} total={g.target}/></div>
                 <div className="flex justify-between items-center mt-1.5 gap-2">
                   <span className="text-[11px] font-extrabold text-[#6627D5]">{showBalance(g.balance)}</span>
                   <span className="text-[11px] font-bold text-[#83748F]">{g.target>0?Math.round(g.balance/g.target*100):0} %</span>
                 </div>
               </div>
             </div>
             <div className="flex justify-between gap-2 mt-2 pt-2 border-t border-[#F1ECF8] px-1">
               <span className="text-[10px] text-[#827590]">{g.status==='closed'?'Projet terminé':'Objectif : '+showBalance(g.target)}</span>
               <span className="text-[10px] text-[#827590] truncate">{goalHomeLabel(g)}</span>
             </div>
           </button>)}
           {filteredGoals.length===0&&<Panel className="p-6 text-center space-y-3">
             <div className="w-12 h-12 rounded-full bg-[#F1E9FF] text-[#772DDC] mx-auto flex justify-center items-center">{projectFilter==='closed'?<CheckCircle2 size={24}/>:<Target size={24}/>}</div>
             <p className="font-extrabold text-[14px]">{projectFilter==='closed'?'Aucun projet terminé':projectFilter==='active'?'Aucun projet en cours':'Aucun projet pour le moment'}</p>
             <p className="text-[12px] text-[#817690]">{projectFilter==='closed'?'Vos projets clôturés apparaîtront ici.':'Créez un projet pour commencer à épargner ensemble.'}</p>
             {projectFilter==='closed'
               ?<button type="button" onClick={()=>setProjectFilter('active')} className="text-[#6C28D4] text-[12px] font-bold">Voir les projets en cours <ArrowRight size={14} className="inline"/></button>
               :<PillButton onClick={()=>launch('new-goal',{owner:data.viewerId,deadline:'2027-07-15',contributors:data.viewerId})}>Créer un projet <Plus size={16}/></PillButton>}
           </Panel>}
         </div>
       </section>
     </>}

     {route==='goal'&&goal&&visibleGoals.some(g=>g.id===goal.id)&&<>
       <FamilyProgressPhotoCard id={goal.coverId||goal.id} kind="goal" title={goal.title}
         description={`Échéance : ${dateFor(goal.deadline)} · Pour ${initialsFor(goal.ownerId)}`}
         current={goal.balance} target={goal.target} status={goal.status} showAmounts={showAmounts} detail/>
       <button type="button" onClick={()=>openChatWithDraft(composeFamilyMessage({kind:'goal',title:goal.title}))}
         className="w-full rounded-[17px] border border-[#E9DDF7] bg-[#F6F0FF] p-3 text-[12px] font-bold text-[#6A2DCE] flex items-center justify-center gap-2">
         <MessageCircle size={17}/> Préparer un message pour la famille <ArrowRight size={15}/>
       </button>

       <Panel className="p-4 space-y-2">
         <div className="flex justify-between items-center gap-2">
          <span className={'text-[11px] font-extrabold rounded-full px-3 py-1.5 '+(goalDisplayState(goal,nowDate()).tone==='green'?'bg-[#E5F8EE] text-[#178C64]':goalDisplayState(goal,nowDate()).tone==='orange'?'bg-[#FFF2DE] text-[#A66C1F]':'bg-[#F1EAFD] text-[#6E2DCA]')}>
           {goalDisplayState(goal,nowDate()).label}</span>
          <span className="text-[11px] text-[#80728E]">Pour {findMember(family,goal.ownerId)?.name||'le bénéficiaire'}</span>
         </div>
         <p className="text-[12px] leading-relaxed text-[#716580]">{goalDisplayState(goal,nowDate()).description}</p>
         {goal.settledAmount!==undefined&&<div className="flex justify-between items-center gap-2 border-t border-[#EFE6F7] pt-3 text-[12px]">
          <span className="text-[#81728F]">Reversé au propriétaire (simulation)</span>
          <strong className="text-[#178A65]">{showBalance(goal.settledAmount)}</strong>
         </div>}
        </Panel>

       {goal.status==='active'&&<div className="grid grid-cols-2 gap-3">
         <PillButton disabled={!canFundSavingsGoal(family,data.viewerId,goal)} onClick={()=>launch('goal-deposit',{amount:''})}><Plus size={16}/> Contribuer</PillButton>
         <PillButton secondary disabled={!canWithdrawSavingsGoal(family,data.viewerId,goal)} onClick={()=>launch('goal-withdraw',{amount:''})}>Retirer <ArrowRight size={16}/></PillButton>
       </div>}

       <section>
         <Heading title="Versements programmés"/>
         <Panel className="p-4 space-y-3">
           <div className="flex gap-3 items-start">
             <div className="w-11 h-11 rounded-2xl bg-[#F3ECFF] text-[#7228D6] flex items-center justify-center shrink-0"><CalendarClock size={20}/></div>
             <div className="min-w-0 flex-1">
               <p className="text-[13px] font-extrabold">{goal.scheduledAmount>0?currency(goal.scheduledAmount):'Aucun versement programmé'}</p>
               <p className="text-[11px] text-[#857795] mt-1">{goal.scheduledAmount>0?`Fréquence : ${goal.scheduledFrequency==='weekly'?'hebdomadaire':'mensuelle'}`:'Planifiez une contribution régulière pour avancer vers votre objectif.'}</p>
             </div>
           </div>
           {goal.scheduledAmount>0&&<div className="flex items-center justify-between gap-2 border-t border-[#F0EAF7] pt-3 text-[12px]">
             <span className="text-[#82758F]">Prochain versement indicatif</span>
             <span className="font-bold text-[#443254]">{goal.nextScheduledDate?dateFor(goal.nextScheduledDate):'À définir'}</span>
           </div>}
           <p className="text-[10px] text-[#9A8CA8]">Simulation uniquement · aucun débit automatique.</p>
           {goal.status==='active'&&canScheduleGoal&&<button type="button"
             onClick={()=>launch('goal-schedule',{amount:goal.scheduledAmount?String(goal.scheduledAmount):'',frequency:goal.scheduledFrequency||'monthly',nextDate:goal.nextScheduledDate||nowDate()})}
             className="flex items-center gap-1.5 text-[#692AD8] text-[12px] font-bold">
             {goal.scheduledAmount>0?'Modifier la programmation':'Programmer un versement'} <ArrowRight size={15}/>
           </button>}
           {goal.status==='closed'&&<p className="text-[11px] text-[#897A9A]">La programmation est désactivée pour ce projet clôturé.</p>}
         </Panel>
       </section>

       <section>
         <Heading title="Les contributeurs" subtitle="Membres habilités à participer"/>
         <Panel className="px-4">
           {goalContributions(goal).filter(({memberId})=>family.members.some(m=>m.id===memberId)).map(({memberId:id,total})=>{
             const member=findMember(family,id);
             return <div key={id} className="flex items-center gap-3 py-3.5 border-b last:border-none border-[#F0EAF7]">
               <Avatar size={42} member={member}/>
               <div className="flex-1 min-w-0"><p className="text-[13px] font-extrabold">{member?.name||'Membre'}</p><p className="text-[11px] text-[#897C96] mt-0.5">{id===goal.ownerId?'Bénéficiaire · ':''}Contributeur habilité</p></div>
               <div className="shrink-0 text-right"><p className="text-[13px] font-extrabold text-[#5B24BA]">{currency(total)}</p><p className="text-[10px] text-[#9487A1] mt-0.5">Total versé</p></div>
             </div>;
           })}
         </Panel>
       </section>

       <section>
         <Heading title="Historique des mouvements" right={goal.history.length>2&&
           <button type="button" onClick={()=>setShowAllGoalMovements(v=>!v)}
             className="flex items-center gap-1 text-[#692AD8] text-[12px] font-bold">{showAllGoalMovements?'Réduire':'Voir tout'} <ChevronRight size={15}/></button>}/>
         <Panel className="px-4">
           {goal.history.length?(showAllGoalMovements?goal.history:goal.history.slice(0,2)).map(h=>
             <div key={h.id} className="flex gap-3 items-center py-3.5 border-b last:border-none border-[#F0EAF7]">
               <div className="w-10 h-10 shrink-0 rounded-2xl bg-[#F0E9FF] text-[#7A35E0] flex items-center justify-center">{h.kind==='deposit'?<ArrowDownLeft size={19}/>:<ArrowUpRight size={19}/>}</div>
               <div className="min-w-0 flex-1"><p className="text-[12px] font-bold">{h.kind==='deposit'?'Contribution':h.kind==='settlement'?'Reversement au propriétaire':'Retrait'} · {findMember(family,h.memberId)?.name||'Membre'}</p><p className="text-[10px] text-[#8A8097] mt-0.5">{h.date}</p></div>
               <p className={'text-[12px] font-bold whitespace-nowrap '+(h.kind==='deposit'?'text-[#4B306D]':'text-[#A24C70]')}>{h.kind==='deposit'?'+':'−'}{currency(h.amount)}</p>
             </div>
           ):<p className="py-4 text-[12px] text-[#81758F]">Aucun mouvement pour le moment.</p>}
         </Panel>
       </section>

       {canManageGoal&&<section>
         <button type="button" aria-expanded={goalManageOpen} onClick={()=>setGoalManageOpen(v=>!v)}
           className="w-full bg-[#F3EDFC] border border-[#E7DCF8] rounded-[22px] px-4 py-4 flex items-center gap-3 text-left">
           <Settings2 size={20} className="text-[#6929CF] shrink-0"/>
           <div className="flex-1 min-w-0"><p className="text-[13px] font-extrabold">Gérer le projet</p><p className="text-[11px] text-[#81738E] mt-0.5">Paramètres, contributeurs et clôture</p></div>
           <ChevronDown size={18} className={'text-[#6B30CF] transition-transform '+(goalManageOpen?'rotate-180':'')}/>
         </button>
         {goalManageOpen&&<Panel className="px-4 mt-2">
           {goal.status==='active'&&<>
             <ActionLine icon={PenLine} title="Modifier le projet" subtitle="Nom, image, montant, échéance et membres habilités"
               onClick={()=>launch('goal-edit',{title:goal.title,target:String(goal.target),deadline:goal.deadline,coverId:goal.coverId||(['goal_vac','goal_school','goal_weekend'].includes(goal.id)?goal.id:'goal_vac'),contributors:goal.contributors.join(',')})}/>
             <ActionLine icon={CheckCircle2} title="Clôturer le projet" subtitle="Arrêter les contributions et la programmation" onClick={()=>launch('goal-close')}/>
           </>}
           {goal.status==='active'
             ?<ActionLine icon={Trash2} title="Supprimer le projet" subtitle="Suppression simulée avec restitution du solde" onClick={()=>launch('goal-delete')}/>
             :<p className="text-[12px] text-[#81758F] py-3">Ce projet est clôturé et conservé pour consultation.</p>}
         </Panel>}
       </section>}
     </>}

     {route==='pots'&&<><Heading title="Les cagnottes familiales"/><p className="text-[12px] text-[#847791]">Cagnottes partagées : démonstration d'usage. Les règles transactionnelles détaillées de Famille restent à valider.</p><div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-3" aria-label="Toutes les cagnottes">
       {family.pots.map(p=><FamilyProgressPhotoCard key={p.id} id={p.id} kind="pot" title={p.title}
         description={`Cagnotte collective · ${p.members.length} participants`} current={p.balance} target={p.target} showAmounts={showAmounts} onClick={()=>navigateToPot(p.id)}/>)}
       </div><PillButton onClick={()=>launch('new-pot')}>Créer une cagnotte <Plus size={16}/></PillButton></>}
     {route==='pot'&&pot&&<>
       <div className="flex items-center justify-between px-1">
         <div className="flex items-center gap-2 text-[#7A678D] text-[11px] font-semibold"><Gift size={16} className="text-[#189B72]"/> Cagnotte familiale</div>
         {canManagePot&&<div className="relative">
           <button type="button" aria-label="Gérer la cagnotte" aria-expanded={potMenuOpen}
             onClick={()=>setPotMenuOpen(v=>!v)}
             className="w-9 h-9 rounded-full border border-[#EEE6F6] bg-white flex items-center justify-center text-[#6F28D0]">
             <MoreHorizontal size={20}/>
           </button>
           {potMenuOpen&&<div className="absolute right-0 top-11 z-30 w-[205px] p-2 bg-white rounded-2xl shadow-[0_8px_28px_rgba(39,21,75,0.18)] border border-[#EDE6F4] space-y-1">
             <button type="button" onClick={()=>{setPotMenuOpen(false);launch('pot-edit',{title:pot.title,description:pot.description||'',target:String(pot.target),deadline:pot.deadline||''})}}
               disabled={pot.status!=='active'} className="w-full flex items-center gap-2.5 text-[12px] font-bold text-[#402D5B] text-left rounded-xl py-2.5 px-2 hover:bg-[#F5F0FC] disabled:opacity-40"><PenLine size={16}/> Modifier la cagnotte</button>
             <button type="button" onClick={()=>{setPotMenuOpen(false);launch('pot-close')}} disabled={pot.status!=='active'}
               className="w-full flex items-center gap-2.5 text-[12px] font-bold text-[#A7496E] text-left rounded-xl py-2.5 px-2 hover:bg-[#FFF1F5] disabled:opacity-40"><CheckCircle2 size={16}/> Clôturer la collecte</button>
           </div>}
         </div>}
       </div>

       <FamilyProgressPhotoCard id={pot.id} kind="pot" title={pot.title}
         description={pot.description||'Une collecte pour partager un beau moment ensemble.'}
         current={pot.balance} target={pot.target} status={pot.status}
         statusLabel={pot.status==='closed'?(pot.closedReason==='target'?'Objectif atteint':'Collecte clôturée'):potDisplayState(pot,nowDate()).label}
         statusTone={potDisplayState(pot,nowDate()).tone==='orange'?'amber':potDisplayState(pot,nowDate()).tone==='green'?'green':'violet'}
         showAmounts={showAmounts} detail/>
       {(canManagePot||canSeePotHistory)&&<button type="button"
         onClick={()=>openChatWithDraft(composeFamilyMessage({kind:'pot',title:pot.title}))}
         className="w-full rounded-[17px] border border-[#E9DDF7] bg-[#F6F0FF] p-3 text-[12px] font-bold text-[#6A2DCE] flex items-center justify-center gap-2">
         <MessageCircle size={17}/> Préparer un message pour la famille <ArrowRight size={15}/>
       </button>}
       {(pot.status==='closed'||potDisplayState(pot,nowDate()).tone==='orange')&&
         <p className="px-3 py-2 rounded-[14px] bg-[#F8F5FF] text-[11px] leading-relaxed text-[#786A87]">
           {potDisplayState(pot,nowDate()).description}
         </p>}
       {pot.deadline&&<p className="text-[11px] text-[#86768F] flex gap-1.5 items-center justify-center"><CalendarDays size={14}/> Fin prévue : {dateFor(pot.deadline)}</p>}

       {(pot.pendingInvites||[]).includes(data.viewerId)&&pot.status==='active'&&<Panel className="p-4 border-[#D8C8F5] bg-[#F7F2FF] space-y-3">
         <p className="text-[13px] font-bold text-[#3D2459]">Vous êtes invité(e) à participer</p>
         <p className="text-[11px] text-[#837292]">Acceptez l'invitation pour rejoindre cette cagnotte.</p>
         <div className="grid grid-cols-2 gap-2">
           <button type="button" onClick={()=>{
             mutate((_d,f)=>{const p=f.pots.find(x=>x.id===selectedPot)!;p.pendingInvites=(p.pendingInvites||[]).filter(id=>id!==data.viewerId);if(!p.members.includes(data.viewerId))p.members.push(data.viewerId)});
             show('Vous avez rejoint la cagnotte (simulation).');
           }} className="bg-[#6525D4] text-white rounded-full py-2.5 text-[12px] font-bold">Accepter</button>
           <button type="button" onClick={()=>{
             mutate((_d,f)=>{const p=f.pots.find(x=>x.id===selectedPot)!;p.pendingInvites=(p.pendingInvites||[]).filter(id=>id!==data.viewerId)});
             show('Invitation refusée (simulation).');
           }} className="bg-white border border-[#E2D6F3] text-[#6C4F89] rounded-full py-2.5 text-[12px] font-bold">Refuser</button>
         </div>
       </Panel>}

       <section>
         <Heading title="Les participants" right={canManagePot&&pot.status==='active'&&
           <button type="button" disabled={potInviteCandidates.length===0}
             onClick={()=>launch('pot-invite',{memberId:potInviteCandidates[0]?.id||''})}
             className="flex items-center gap-1 text-[#6426D3] text-[12px] font-bold disabled:opacity-40"><UserPlus size={16}/> Inviter</button>}/>
         <Panel className="p-4 space-y-3">
           <div className="flex items-center gap-3">
             <div className="flex -space-x-2 shrink-0">
               {pot.members.filter(id=>family.members.some(m=>m.id===id)).slice(0,4).map(id=><Avatar key={id} member={findMember(family,id)} size={41}/>)}
             </div>
             <div className="min-w-0 flex-1">
               <p className="text-[13px] font-extrabold">{pot.members.filter(id=>family.members.some(m=>m.id===id)).length} participant{pot.members.length!==1?'s':''}</p>
               <p className="text-[11px] text-[#8A7C97] mt-1 leading-snug">{pot.members.map(id=>findMember(family,id)?.name).filter(Boolean).join(', ')||'Aucun participant'}</p>
             </div>
           </div>
           {(pot.pendingInvites||[]).length>0&&canManagePot&&<div className="border-t border-[#F0EAF7] pt-3">
             <p className="text-[11px] text-[#8A7D98] mb-2">Invitations en attente</p>
             <div className="flex flex-wrap gap-2">
               {(pot.pendingInvites||[]).map(id=><span key={id} className="rounded-full px-2.5 py-1.5 bg-[#F3ECFF] text-[#7336BE] text-[11px] font-medium">{findMember(family,id)?.name||'Membre'} · En attente</span>)}
             </div>
           </div>}
         </Panel>
       </section>

       <section>
         {canSeePotHistory&&potContributions(pot).length>0&&<Panel className="p-4 space-y-2">
          <p className="text-[12px] font-bold text-[#382448]">Contributions par participant</p>
          {potContributions(pot).map(({memberId,total})=><div key={memberId} className="flex justify-between items-center gap-2 border-t border-[#F1EAF7] py-2 text-[12px]">
            <span className="text-[#786A8A]">{findMember(family,memberId)?.name||'Membre'}</span>
            <strong className="text-[#632CC1]">{showBalance(total)}</strong>
          </div>)}
        </Panel>}

        <Heading title="Contributions récentes" right={canSeePotHistory&&(pot.contributions||[]).length>2&&
           <button type="button" onClick={()=>setShowAllPotContributions(v=>!v)}
             className="text-[#6A26D8] text-[12px] font-bold flex items-center gap-1">
             {showAllPotContributions?'Réduire':'Voir tout'} <ChevronRight size={15}/>
           </button>}/>
         <Panel className="px-4">
           {!canSeePotHistory
             ?<p className="text-[12px] text-[#847791] py-4">L'historique est réservé aux participants de la cagnotte.</p>
             :(pot.contributions||[]).length===0
               ?<p className="text-[12px] text-[#847791] py-4">Aucune contribution enregistrée pour le moment.</p>
               :(showAllPotContributions?pot.contributions||[]:(pot.contributions||[]).slice(0,2)).map(h=>
                 <div key={h.id} className="flex items-center gap-3 py-3.5 border-b last:border-b-0 border-[#F1EBF7]">
                   <Avatar member={findMember(family,h.memberId)} size={39}/>
                   <div className="min-w-0 flex-1">
                     <p className="font-bold text-[13px] text-[#31223F]">{findMember(family,h.memberId)?.name||'Membre'}</p>
                     <p className="text-[11px] text-[#887B97] mt-0.5">Contribution · {h.date}</p>
                   </div>
                   <p className="text-[13px] font-extrabold text-[#169C72] shrink-0">+{currency(h.amount)}</p>
                 </div>)
           }
         </Panel>
       </section>

       {pot.status==='active'&&canParticipateInPot&&<PillButton onClick={()=>launch('pot-deposit',{source:`simple:${data.viewerId}`,amount:''})}>
         Participer à la cagnotte <Plus size={17}/>
       </PillButton>}
       {pot.status==='active'&&!canParticipateInPot&&!(pot.pendingInvites||[]).includes(data.viewerId)&&
         <Panel className="p-4 text-[12px] text-[#7E728E]">Vous ne participez pas encore à cette cagnotte. Un organisateur peut vous inviter à la rejoindre.</Panel>}
       {pot.status==='closed'&&<Panel className="p-4 flex items-center gap-2 text-[#158767]">
         <CheckCircle2 size={19}/><p className="text-[12px] font-bold">Cette collecte est clôturée. Les contributions ne sont plus possibles.</p>
       </Panel>}
     </>}

     {route==='services'&&<>
       <p className="px-1 pt-1 pb-1 text-[13px] leading-relaxed text-[#645775]">Retrouvez les services utiles à votre famille.</p>

       {serviceLinks.length>0&&<section className="space-y-3">
         <div className="flex items-center justify-between gap-2 px-1">
           <h2 className="text-[17px] leading-tight font-extrabold text-[#2C1C40]">Pour votre famille</h2>
           {serviceLinks.length>2&&<button type="button"
             aria-expanded={showAllServiceSuggestions} aria-controls="family-service-suggestions"
             onClick={()=>setShowAllServiceSuggestions(v=>!v)}
             className="min-h-[36px] inline-flex items-center gap-1 text-[12px] font-bold text-[#6E2ACE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7934D6] rounded-md">
             {showAllServiceSuggestions?'Voir moins':'Voir tout'} <ChevronRight size={15} className={showAllServiceSuggestions?'rotate-90':''}/>
           </button>}
         </div>
         <div id="family-service-suggestions" className="rounded-[24px] border border-[#E4D9F9] bg-[#F2ECFE] p-2 shadow-[0_4px_14px_rgba(87,44,142,0.05)]">
           {serviceLinks.slice(0,showAllServiceSuggestions?serviceLinks.length:2).map((link,i)=><React.Fragment key={link.id}>
             {i>0&&<div className="mx-2 border-t border-white/80"/>}
             <FamilyServiceRow variant="suggestion" icon={serviceIcons[link.kind]}
               title={link.title} description={link.subtitle} onClick={()=>openServiceLink(link)}/>
           </React.Fragment>)}
         </div>
       </section>}

       <section className="space-y-5 pt-1">
         <h2 className="px-1 text-[18px] leading-tight font-extrabold text-[#2C1C40]">Tous les services</h2>

         <section>
           <FamilyServiceCategory icon={WalletCards} color="amber" title="Paiements et réservations"/>
           <div className="bg-white rounded-[24px] border border-[#ECE5F5] p-2 shadow-[0_5px_16px_rgba(72,30,132,0.045)]">
             <FamilyServiceRow icon={Send} title="Simple Pay Famille"
               description="Envoyer de l'argent à vos proches"
               badge={!admin?'Accès responsable':!family.account?'Compte requis':undefined}
               disabled={!admin||!family.account} onClick={()=>launch('simple-pay',{from:'account'})}/>
             <div className="mx-2 border-t border-[#F0EAF7]"/>
             <FamilyServiceRow icon={ReceiptText} title="Payer une facture"
               description="Régler les dépenses communes" onClick={()=>launch('pay-bill',{from:admin&&family.account?'account':`simple:${data.viewerId}`})}/>
             <div className="mx-2 border-t border-[#F0EAF7]"/>
             <FamilyServiceRow icon={Plane} title="Simple Trip"
               description="Préparer un voyage en famille" onClick={openTrip}/>
           </div>
         </section>

         <section>
           <FamilyServiceCategory icon={Users} color="purple" title="Vie de famille"/>
           <div className="bg-white rounded-[24px] border border-[#ECE5F5] p-2 shadow-[0_5px_16px_rgba(72,30,132,0.045)]">
             <FamilyServiceRow icon={MessageCircle} title="Chat Famille"
               description="Échanger avec vos proches" onClick={()=>mainGo('chat')}/>
             <div className="mx-2 border-t border-[#F0EAF7]"/>
             <FamilyServiceRow icon={LockKeyhole} title="Coffre-fort numérique"
               description="Retrouver les documents partagés" onClick={()=>mainGo('vault')}/>
             <div className="mx-2 border-t border-[#F0EAF7]"/>
             <FamilyServiceRow icon={Gift} title="Cagnottes familiales"
               description="Créer et suivre une cagnotte" onClick={()=>mainGo('pots')}/>
           </div>
         </section>

         <section>
           <FamilyServiceCategory icon={Landmark} color="green" title="Avantages et financement"/>
           <div className="bg-white rounded-[24px] border border-[#ECE5F5] p-2 shadow-[0_5px_16px_rgba(72,30,132,0.045)]">
             <FamilyServiceRow icon={Coins} title="Fidélité Famille"
               description="Suivre vos points et avantages" onClick={()=>mainGo('loyalty')}/>
             <div className="mx-2 border-t border-[#F0EAF7]"/>
             <FamilyServiceRow icon={Landmark} title="Demande de crédit"
               description="Explorer une demande de financement" onClick={()=>mainGo('loan')}/>
           </div>
         </section>
       </section>
     </>}

     {route==='chat'&&<FamilyChatView
       family={family} viewerId={data.viewerId} activeId={activeChatId}
       onOpen={openChatThread}
       onInbox={()=>{setActiveChatId(null);setChatInput('');scrollTop()}}
       onDirect={startPrivateConversation}
       onGroup={startGroupConversation}
       onEditGroup={editChatGroup}
     />}
      {route==='vault'&&<>
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F1EAFF] text-[#7631DD] flex items-center justify-center"><LockKeyhole size={23}/></div>
            <div className="flex-1"><h2 className="text-lg font-extrabold">Documents de famille</h2>
              <p className="text-xs text-[#8B7F98] mt-1">Retrouvez les références partagées selon vos autorisations.</p>
            </div>
          </div>
        </Panel>
        {family.documents.filter(d=>canViewFamilyDocument(family,data.viewerId,d)).map(d=>
          <Panel className="p-4 flex items-center gap-3" key={d.id}>
            <FileText size={23} className="text-[#7132DC] shrink-0"/>
            <div className="flex-1 min-w-0"><strong className="text-[13px]">{d.title}</strong>
              <p className="text-[11px] text-[#897D96]">{d.type}{d.expiry?` · Expire le ${dateFor(d.expiry)}`:''}</p>
              <p className="text-[10px] text-[#887C97]">Fiche visible uniquement par les personnes autorisées</p>
            </div>
          </Panel>)}
        {!family.documents.some(d=>canViewFamilyDocument(family,data.viewerId,d))&&
          <Panel className="p-5 text-[12px] text-[#81738D]">Aucun document accessible avec votre profil.</Panel>}
        <PillButton onClick={()=>launch('new-document',{type:'Autre',visibleTo:data.viewerId})}>
          <Plus size={17}/> Ajouter une fiche document
        </PillButton>
        <p className="text-xs text-[#897D97]">Aucun fichier n’est chargé ou hébergé par ce prototype ; seules des métadonnées locales sont utilisées.</p>
       </>}
       {route==='trip'&&<>
        <Panel className="p-5 space-y-3">
          <div className="text-4xl">🌍</div>
          <h2 className="text-[21px] font-extrabold">Voyagez en famille</h2>
          <p className="text-xs text-[#867A92]">Préparez le séjour avec vos proches. Les réservations restent fictives, sans connexion à Simple Trip.</p>
          {tripTravelerId&&admin&&<div className="rounded-[15px] bg-[#F1EAFE] text-[#7033B9] px-3 py-2 text-[12px] font-bold">
            Voyage pour {findMember(family,tripTravelerId)?.name||'un membre de la famille'}
          </div>}
        </Panel>
        <section className="space-y-3">
          <Heading title="Vos réservations fictives"/>
          {family.bookings.filter(b=>admin||b.travelerId===data.viewerId).map(b=>
            <Panel key={b.id} className="p-4 space-y-3">
              <div className="flex gap-3 items-center">
                <Plane size={20} className="text-[#7432DF] shrink-0"/>
                <div className="flex-1"><p className="text-sm font-bold">{b.destination}</p>
                  <p className="text-xs text-[#877A96]">{initialsFor(b.travelerId)} · {dateFor(b.date)}</p>
                </div>
              </div>
              <button type="button"
                onClick={()=>openChatWithDraft(composeFamilyMessage({
                  kind:'trip',destination:b.destination,travelerName:initialsFor(b.travelerId)
                }))}
                className="w-full flex items-center justify-between text-[#6C2FD2] text-[12px] font-bold border-t border-[#F0EAF7] pt-3">
                Préparer un message dans le chat <MessageCircle size={17}/>
              </button>
            </Panel>)}
          {!family.bookings.some(b=>admin||b.travelerId===data.viewerId)&&
            <Panel className="p-4 text-[12px] text-[#82758D]">Aucune réservation fictive accessible pour le moment.</Panel>}
          {admin&&<PillButton onClick={()=>launch('new-trip',{
            traveler:tripTravelerId||data.viewerId,date:nowDate()
          })}>
            Simuler une réservation <ArrowRight size={15}/>
          </PillButton>}
          {!admin&&<p className="text-xs text-[#897D96]">Les réservations sont créées par un Leader ou Co-leader. Vous pouvez consulter celles dont vous êtes le voyageur.</p>}
        </section>
        <section className="space-y-2">
          <Heading title="Préparer le voyage ensemble"/>
          <Panel className="px-4">
            {visibleGoals.filter(g=>g.status==='active'&&/vacan|voyage|week.end|séjour/i.test(g.title)).slice(0,2).map(g=>
              <ActionLine key={g.id} icon={Target} title={g.title} subtitle="Suivre notre objectif d’épargne" onClick={()=>navigateToGoal(g.id)}/>)}
            <ActionLine icon={FileText} title="Documents utiles" subtitle="Consulter les fiches accessibles avant le départ" onClick={()=>mainGo('vault')}/>
            <ActionLine icon={MessageCircle} title="Chat familial" subtitle="Se coordonner sans quitter Ma famille" onClick={()=>mainGo('chat')}/>
          </Panel>
        </section>
       </>}
     {route==='loyalty'&&<><Panel className="p-6 text-center bg-gradient-to-br from-[#4A1A94] to-[#7A37E9] text-white border-none"><Gift size={31} className="mx-auto"/><p className="text-sm text-white/75 mt-3">Fidélité Famille</p><p className="text-[38px] font-extrabold mt-1">{family.loyaltyPoints.toLocaleString('fr-FR')}</p><p className="text-sm">Points illustratifs</p></Panel><Panel className="px-4"><ActionLine icon={CreditCard} title="Paiements éligibles" subtitle="Points selon le barème métier à valider"/><ActionLine icon={Target} title="Objectifs atteints" subtitle="Possibles bonus de fidélité"/><ActionLine icon={Sparkles} title="Défis familiaux" subtitle="Éligibilité et récompenses à définir"/></Panel><p className="text-xs text-[#8A7D95]">Les règles de calcul sont fictives. Les virements entre membres et les contributions ne génèrent pas de points dans le cadrage.</p></>}
     {route==='loan'&&<><Panel className="p-5"><h2 className="text-xl font-extrabold">Demander un crédit</h2><p className="text-xs text-[#867991] mt-2">Chaque membre peut initier une demande. Les comptes associés dépendent de son rôle ; les avantages conjoints sont soumis à vérification.</p></Panel>{family.creditRequests.filter(req=>req.applicantId===data.viewerId||admin).map(req=><Panel key={req.id} className="p-4"><Tag tone="amber">{req.status}</Tag><p className="text-base font-extrabold mt-2">{currency(req.amount)}</p><p className="text-xs text-[#857A94]">Demande fictive · {initialsFor(req.applicantId)}</p></Panel>)}<PillButton onClick={()=>launch('new-credit',{account:`simple:${data.viewerId}`})}>Simuler une demande <ArrowRight size={16}/></PillButton>{family.members.some(m=>m.role==='coleader'&&m.relation==='Conjoint')&&<Panel className="p-4 space-y-1"><p className="text-sm font-bold">Avantages conjoints</p><p className="text-xs text-[#85788F]">Le cadrage prévoit l’héritage de conventions éligibles entre conjoints vérifiés. Aucune convention, taux ou éligibilité n’est inventé dans cette démonstration.</p></Panel>}<p className="text-xs text-[#887C95]">Aucun scoring ni vérification bancaire ; ce formulaire ne constitue pas une demande réelle.</p></>}

     {route==='pfm'&&<HouseholdPFMBridge
       family={family} viewerId={data.viewerId} showAmounts={showAmounts}
       onAccounts={()=>mainGo('accounts')} onSavings={()=>mainGo('savings')}
       onGoals={navigateToGoal} onPots={()=>mainGo('pots')} onPot={navigateToPot}
       onMembers={()=>mainGo('members')}
     />}

          {route==='preferences'&&<>
       <Panel className="px-4"><ActionLine icon={Users} title="Gérer les membres" subtitle="Rôles, invitations, rattachements" onClick={()=>mainGo('members')}/>{admin&&<ActionLine icon={PenLine} title="Nom et identité" subtitle="Modifier le nom de votre famille" onClick={()=>launch('rename',{name:family.name,emoji:family.emoji})}/>}<ActionLine icon={ShieldCheck} title="Seuil de double validation" subtitle={`${currency(family.otpThreshold)} · Hypothèse de démo, pas une règle validée`} onClick={()=>show('Seuil affiché à titre de scénario UX ; sa valeur est à définir par les métiers.')}/></Panel>
       {admin&&family.account&&<Panel className="p-4 space-y-3"><h3 className="text-sm font-extrabold">Visibilité du sous-compte Famille</h3><p className="text-xs text-[#8B7F97]">Accordez ou retirez la consultation du solde et de l’historique. Les droits d’opération restent réservés aux administrateurs.</p>{family.members.filter(m=>m.role==='member').map(m=><label key={m.id} className="flex items-center justify-between text-xs"><span>{m.name}</span><input type="checkbox" className="accent-[#732CDF]" checked={family.accountViewIds.includes(m.id)} onChange={e=>mutate((_d,f)=>{if(e.target.checked){f.accountViewIds=[...new Set([...f.accountViewIds,m.id])]}else f.accountViewIds=f.accountViewIds.filter(id=>id!==m.id)})}/></label>)}</Panel>}
       <Panel className="p-4"><h3 className="text-sm font-extrabold">Langue de la famille</h3><p className="text-xs text-[#8B7F97] mt-1 mb-3">Seuls Leader et Co-leaders peuvent changer la langue. La traduction exhaustive n'est pas implémentée dans ce prototype.</p><select disabled={!admin} aria-label="Langue" value={family.language} onChange={e=>{mutate((_d,f)=>{f.language=e.target.value as Family['language']});show('Préférence enregistrée ; traduction réelle non incluse.')}} className="w-full h-11 rounded-2xl border border-[#EBE2F7] bg-[#F9F6FF] px-3 text-sm"><option>Français</option><option>العربية</option><option>English</option></select></Panel>
       {leader&&<button type="button" onClick={()=>launch('family-delete')} className="w-full flex gap-2 justify-center items-center text-[#B84E70] py-3 text-[12px] font-bold"><Trash2 size={15}/>Supprimer cette famille (démo)</button>}
       <PillButton secondary onClick={()=>launch('new-family',{openAccount:'false',emoji:'💜'})}>Créer une autre famille <Plus size={16}/></PillButton>
     </>}
     </>}
   </div>
   {selectorOpen&&route==='dashboard'&&family&&document.getElementById('simple-device-frame')&&createPortal(
   <div id="family-selector-menu" ref={familySelectorMenuRef} role="menu" aria-label="Mes familles"
    style={{top:selectorPosition.top,right:selectorPosition.right,width:selectorPosition.width,maxHeight:'min(430px, 65vh)'}}
    className="simple-family-interactions absolute z-[45] overflow-y-auto rounded-[18px] border border-[#EAE0F7] bg-white p-2.5 shadow-[0_16px_38px_rgba(36,16,81,0.24)] text-[#251838]">
    <p className="px-2.5 pb-2 pt-1 text-[12px] font-extrabold text-[#655674]">Mes familles</p>
    <div className="space-y-1">
     {data.families.map(f=><button type="button" role="menuitemradio" aria-checked={f.id===family.id} key={f.id} onClick={()=>switchFamily(f.id)}
      className={'w-full rounded-xl px-3 py-2.5 flex items-center gap-2.5 text-left border family-hover-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7430DD] '+(f.id===family.id?'border-[#CFB8FA] bg-[#F2EBFF]':'border-transparent bg-white')}>
      <span className="text-xl shrink-0">{f.emoji}</span>
      <span className="flex-1 min-w-0"><span className="block text-[12px] font-bold truncate">{f.name}</span><span className="block text-[10px] text-[#817494]">{f.members.length} membre{f.members.length>1?'s':''}</span></span>
      {f.id===family.id&&<Check size={16} className="text-[#6225DB] shrink-0"/>}
     </button>)}
    </div>
    <div className="my-2 border-t border-[#EDE7F6]"/>
    <button type="button" role="menuitem" onClick={()=>{setSelectorOpen(false);launch('new-family',{openAccount:'false',emoji:'💜'})}}
     className="w-full rounded-xl px-3 py-2.5 flex items-center gap-2.5 text-left text-[12px] font-bold text-[#6428D1] family-hover-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7430DD]">
     <Plus size={17} className="shrink-0"/> Créer une famille
    </button>
    <button type="button" role="menuitem" onClick={()=>{setSelectorOpen(false);launch('join-family')}}
     className="w-full rounded-xl px-3 py-2.5 flex items-center gap-2.5 text-left text-[12px] font-bold text-[#6428D1] family-hover-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7430DD]">
     <UserPlus size={17} className="shrink-0"/> Rejoindre une famille
    </button>
   </div>,
   document.getElementById('simple-device-frame')!
  )}
  {route==='chat' && activeChatId && family && getVisibleChat(family,data.viewerId,activeChatId) && document.getElementById('simple-chat-composer-slot') && createPortal(
      <div className="simple-family-interactions bg-white/95 backdrop-blur-md border-t border-[#ECE6F6] shadow-[0_-8px_26px_rgba(35,18,70,0.05)] px-5 pt-3 pb-5">
        <form onSubmit={createMessage} className="flex items-center gap-2.5">
          <input aria-label="Écrire un message" value={chatInput} onChange={e=>setChatInput(e.target.value)}
            className="flex-1 min-w-0 h-12 rounded-full bg-[#F8F6FC] border border-[#E8E0F4] px-4 outline-none focus:ring-2 focus:ring-[#C6A9FF] text-[13px] text-[#241536]"
            placeholder="Écrire un message…" />
          <button type="submit" aria-label="Envoyer le message" disabled={!chatInput.trim()}
            className="w-12 h-12 shrink-0 rounded-full flex justify-center items-center bg-[#6324D8] text-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all">
            <Send size={19}/>
          </button>
        </form>
        <p className="text-[10px] text-center text-[#91869E] mt-2">Messages simulés, enregistrés uniquement sur cet appareil.</p>
      </div>,
      document.getElementById('simple-chat-composer-slot')!
    )}
    {toast&&<div role="status" className="sticky bottom-[78px] z-40 mx-5 mb-2 bg-[#2B1751] text-white text-xs rounded-2xl px-4 py-3 shadow-lg flex items-start gap-2"><CheckCircle2 size={16} className="shrink-0 text-[#A7E7C7]"/>{toast}</div>}
   {modal&&createPortal(<div className="simple-family-interactions absolute inset-0 z-50 flex flex-col justify-end bg-[#1C1234]/45 backdrop-blur-[2px]" onClick={close}>
    <div onClick={e=>e.stopPropagation()} className="max-h-[94%] min-h-[240px] overflow-y-auto no-scrollbar bg-white rounded-t-[32px] shadow-2xl px-5 pt-3 pb-7">
      <div className="w-12 h-1 rounded-full bg-[#DAD3E6] mx-auto mb-5"/>
      <div className="flex items-start justify-between gap-2 mb-4"><div><h3 className="text-[19px] font-extrabold">{({
       'new-family':'Créer ma famille','join-family':'Rejoindre une famille','invite':'Inviter un membre','rename':'Personnaliser ma famille','open-account':'Créer un sous-compte Famille',
       'open-joint':'Ouvrir un compte joint','transfer':'Effectuer un virement','simple-pay':'Simple Pay Famille','pay-bill':'Payer une facture','create-card':'Nouvelle carte virtuelle',
       'new-goal':'Nouvel objectif d’épargne','goal-deposit':'Contribuer à l’objectif','goal-withdraw':'Retirer de l’épargne','goal-delete':'Supprimer l’objectif',
       'goal-schedule':'Programmer une contribution','goal-edit':'Modifier le projet','goal-close':'Clôturer le projet','new-pot':'Créer une cagnotte','pot-deposit':'Participer à la cagnotte','pot-invite':'Inviter à la cagnotte','pot-edit':'Modifier la cagnotte','pot-close':'Clôturer la cagnotte','new-document':'Ajouter un document',
       'new-trip':'Réserver pour un membre','new-credit':'Demande de crédit digitale','member-delete':'Retirer ce membre','family-delete':'Supprimer la famille',
       'limit':'Modifier le plafond','otp':'Double validation (simulation)'
      } as Record<string,string>)[modal]}</h3><p className="text-[11px] text-[#887B95] mt-1">Parcours de démonstration · données fictives</p></div><button type="button" aria-label="Fermer" onClick={close} className="w-8 h-8 shrink-0 bg-[#F6F2FB] rounded-full flex items-center justify-center"><X size={17}/></button></div>
      {modal==='join-family'? <div className="space-y-4"><div className="rounded-2xl bg-[#F7F2FF] p-4 text-[13px] leading-relaxed text-[#55446B]"><UserPlus size={23} className="text-[#7430DF] mb-2"/><p className="font-bold mb-1">Rejoindre une famille sur invitation</p><p>Demandez à l’administrateur de la famille de vous inviter. Dans ce prototype, l’envoi et la réception d’invitations entre comptes ne sont pas connectés ; les invitations sont simulées dans « Membres et accès ».</p></div><PillButton onClick={close}>Compris <Check size={16}/></PillButton></div> : modal==='otp'? <div className="space-y-4"><div className="bg-[#F4EFFF] rounded-2xl p-4 text-sm"><ShieldCheck size={23} className="text-[#752CE2] mb-2"/><p className="font-bold">{otpStage===1?'Validation 1/2 · Leader':'Validation 2/2 · Co-leader'}</p><p className="text-[#7E708E] mt-1 text-xs">Montant : {currency(pendingPayment?.amount||0)}. Aucun OTP réel n’est envoyé.</p></div><PillButton onClick={()=>{if(otpStage===1)setOtpStage(2);else if(pendingPayment)commitPayment(pendingPayment)}}>{otpStage===1?'Simuler validation Leader':'Simuler validation Co-leader'} <Check size={16}/></PillButton></div> :
      <form className="space-y-4" onSubmit={submit}>
       {modal==='new-family'&&<><Input label="Nom de la famille" value={form.name} onChange={v=>setField('name',v)} placeholder="Ex. Notre famille" required/><SelectInput label="Illustration" value={form.emoji||'💜'} onChange={v=>setField('emoji',v)} options={['💜','🏡','🌿','🌸'].map(x=>({value:x,label:x+' Famille'}))}/><label className="flex items-start gap-3 p-3 bg-[#F8F4FF] rounded-2xl"><input type="checkbox" checked={form.openAccount==='true'} onChange={e=>setField('openAccount',String(e.target.checked))} className="mt-1 accent-[#722DDD]"/><span className="text-xs"><strong>Créer un sous-compte Famille maintenant</strong><br/><span className="text-[#84778F]">Facultatif : ouverture possible plus tard. Un pocket est créé automatiquement pour vous.</span></span></label></>}
       {modal==='rename'&&<><Input label="Nom de la famille" value={form.name} onChange={v=>setField('name',v)}/><SelectInput label="Icône" value={form.emoji} onChange={v=>setField('emoji',v)} options={['💜','🏡','🌿','🌸'].map(x=>({value:x,label:x}))}/></>}
       {modal==='invite'&&<><Input label="Prénom du membre" value={form.name} onChange={v=>setField('name',v)} placeholder="Ex. Amine" required/><SelectInput label="Lien familial" value={form.relation||'Proche'} onChange={v=>setField('relation',v)} options={['Conjoint','Fils','Fille','Parent','Proche','Autre'].map(x=>({value:x,label:x}))}/><SelectInput label="Type de compte" value={form.simpleOne||'false'} onChange={v=>{setField('simpleOne',v);if(v==='true')setField('role','member')}} options={[{value:'false',label:'Simple'},{value:'true',label:'Simple One (enfant)'}]}/><SelectInput label="Rôle dans la famille" value={form.role||'member'} onChange={v=>setField('role',v)} options={[{value:'member',label:'Membre'},...(form.simpleOne==='true'?[]:[{value:'coleader',label:'Co-leader'}])]}/><p className="text-xs text-[#83778F]">Un membre invité peut accepter ou refuser. Dans cette version, l'acceptation est simulée depuis « Membres ».</p></>}
       {modal==='open-account'&&<p className="text-sm text-[#7F748F]">Le sous-compte Famille est facultatif, unique par famille, et sera initialisé à 0 DH. Les opérations réelles nécessitent l'intégration bancaire.</p>}
       {modal==='open-joint'&&<p className="text-sm text-[#7F748F]">Le compte joint est réservé à un couple Leader / Co-leader. La vérification du couple et les validations réelles sont hors de ce prototype.</p>}
       {modal==='transfer'&&<><SelectInput label="Depuis" value={form.from||transferOptions[0]?.value} onChange={v=>setField('from',v)} options={transferOptions}/><SelectInput label="Vers" value={form.to||transferOptions[1]?.value||transferOptions[0]?.value} onChange={v=>setField('to',v)} options={transferOptions}/><Input label="Montant (DH)" type="number" min="0.01" value={form.amount} onChange={v=>setField('amount',v)} placeholder="Ex. 300"/><Input label="Libellé (facultatif)" value={form.label} onChange={v=>setField('label',v)} placeholder="Argent de poche"/></>}
       {(modal==='pay-bill'||modal==='simple-pay')&&<><SelectInput label="Compte à débiter" value={form.from||transferOptions[0]?.value} onChange={v=>setField('from',v)} options={transferOptions.filter(o=>modal==='pay-bill'||o.value==='account')}/><Input label={modal==='simple-pay'?'Destinataire':'Organisme / facture'} value={form.beneficiary} onChange={v=>setField('beneficiary',v)} placeholder={modal==='simple-pay'?'Bénéficiaire':'Électricité, Internet…'}/><Input label="Montant (DH)" type="number" min="0.01" value={form.amount} onChange={v=>setField('amount',v)} readOnly={modal==='pay-bill'&&Boolean(form.alertId)}/>{modal==='pay-bill'&&form.alertId&&<p className="text-[11px] text-[#82758E]">Montant exact de la facture prérempli. Les paiements partiels ne sont pas prévus dans cette démonstration.</p>}</>}
       {modal==='create-card'&&<><Input label="Nom de la carte" value={form.label} onChange={v=>setField('label',v)} placeholder="Carte courses"/><SelectInput label="Compte ou pocket associé" value={form.source} onChange={v=>setField('source',v)} options={[...(family?.account?[{value:'family',label:'Sous-compte Famille'}]:[]),...(family&&canViewJointAccount(family,data.viewerId)?[{value:'joint',label:'Compte joint'}]:[]),...(family?.pockets||[]).map(p=>({value:`pocket:${p.ownerId}`,label:`Pocket ${initialsFor(p.ownerId)}`}))]}/><SelectInput label="Titulaire de la carte" value={form.holder} onChange={v=>setField('holder',v)} options={memberOptions}/></>}
       {modal==='new-goal'&&<><Input label="Nom de l’objectif" value={form.title} onChange={v=>setField('title',v)} placeholder="Vacances, études…" required/><Input label="Montant cible (DH)" type="number" min="1" value={form.target} onChange={v=>setField('target',v)}/><Input label="Date de fin" type="date" min={nowDate()} value={form.deadline} onChange={v=>setField('deadline',v)}/><SelectInput label="Bénéficiaire / propriétaire" value={form.owner||data.viewerId} onChange={v=>setField('owner',v)} options={admin?memberOptions:memberOptions.filter(x=>x.value===data.viewerId)}/><div><p className="text-xs font-bold text-[#56466A] mb-2">Membres autorisés à contribuer</p><div className="space-y-2">{family?.members.map(m=><label key={m.id} className="flex items-center gap-2 p-2 rounded-xl bg-[#FAF8FE] text-[12px]"><input type="checkbox" className="accent-[#762ADC]" checked={(form.contributors||'').split(',').includes(m.id)} onChange={e=>{const s=new Set((form.contributors||'').split(',').filter(Boolean));if(e.target.checked)s.add(m.id);else s.delete(m.id);setField('contributors',[...s].join(','))}}/>{m.name}</label>)}</div></div></>}
       {(modal==='goal-deposit'||modal==='goal-withdraw'||modal==='limit')&&<>
          <Input label={modal==='limit'?'Plafond par virement sortant (DH)':'Montant (DH)'} type="number" min="0" value={form.amount} onChange={v=>setField('amount',v)} placeholder="Ex. 500"/>
          <p className="text-xs text-[#847992]">{modal==='limit'?'Plafond appliqué aux virements sortants de la pocket uniquement dans la démonstration. Ce n’est pas un plafond bancaire Simple One.':`Disponible sur votre compte Simple fictif : ${currency(viewer?.simpleBalance||0)}.`}</p>
        </>}
        {modal==='goal-schedule'&&<>
          <Input label="Montant par versement (DH)" type="number" min="0" value={form.amount} onChange={v=>setField('amount',v)} placeholder="Ex. 250"/>
          <SelectInput label="Fréquence" value={form.frequency||'monthly'} onChange={v=>setField('frequency',v)}
            options={[{value:'monthly',label:'Chaque mois'},{value:'weekly',label:'Chaque semaine'}]}/>
          <Input label="Date du prochain versement" type="date" min={nowDate()} value={form.nextDate||nowDate()} onChange={v=>setField('nextDate',v)}/>
          <p className="text-[11px] text-[#847992]">Programmation indicative uniquement : aucun virement automatique n'est exécuté. Pour arrêter les versements, indiquez 0 DH.</p>
        </>}
        {modal==='goal-edit'&&<>
          <Input label="Nom du projet" value={form.title} onChange={v=>setField('title',v)} required placeholder="Vacances en famille"/>
          <SelectInput label="Image du projet" value={form.coverId||'goal_vac'} onChange={v=>setField('coverId',v)}
            options={[{value:'goal_vac',label:'Voyage en famille'},{value:'goal_school',label:'Études'},{value:'goal_weekend',label:'Week-end en famille'}]}/>
          <Input label="Montant cible (DH)" type="number" min="1" value={form.target} onChange={v=>setField('target',v)} required/>
          <Input label="Date d'échéance" type="date" min={nowDate()} value={form.deadline} onChange={v=>setField('deadline',v)} required/>
          <p className="text-[11px] text-[#847992]">Bénéficiaire : {goal?initialsFor(goal.ownerId):'—'}. Il reste inchangé.</p>
          <div className="space-y-2">
            <p className="text-[12px] font-bold text-[#554967]">Membres habilités à contribuer</p>
            {family?.members.map(m=><label key={m.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F9F6FE] text-[12px]">
              <input type="checkbox" disabled={m.id===goal?.ownerId} checked={(form.contributors||'').split(',').includes(m.id)}
                onChange={e=>{const selected=new Set((form.contributors||'').split(',').filter(Boolean));if(e.target.checked)selected.add(m.id);else selected.delete(m.id);setField('contributors',[...selected].join(','))}} className="accent-[#762ADC]"/>
              <span>{m.name}{m.id===goal?.ownerId?' · bénéficiaire':''}</span>
            </label>)}
          </div>
        </>}
        {modal==='goal-close'&&<div className="bg-[#FFF4F7] p-4 rounded-[20px] space-y-2">
          <p className="text-[13px] font-extrabold text-[#944260]">Clôturer ce projet ?</p>
          <p className="text-[12px] text-[#87687A]">Les contributions et la programmation seront arrêtées. Le solde disponible ({goal?currency(goal.balance):'0 DH'}) sera reversé fictivement sur le compte Simple du propriétaire, avec une trace dans l’historique. Aucun virement bancaire réel.</p>
        </div>}
       {(modal==='new-pot'||modal==='pot-edit')&&<>
          <Input label="Nom de la cagnotte" value={form.title} onChange={v=>setField('title',v)} placeholder="Anniversaire, sortie…" required/>
          <Input label="Montant à collecter (DH)" value={form.target} onChange={v=>setField('target',v)} type="number" min="1" required/>
          <Input label="Description (facultative)" value={form.description} onChange={v=>setField('description',v)} placeholder="Pourquoi cette collecte ?"/>
          <Input label="Date de fin (facultative)" type="date" min={nowDate()} value={form.deadline} onChange={v=>setField('deadline',v)}/>
          <p className="text-[11px] text-[#867A90]">Collecte simulée : aucune transaction réelle. Vous pourrez inviter des membres après création.</p>
        </>}
        {modal==='pot-invite'&&<>
          {potInviteCandidates.length>0
            ? <><SelectInput label="Membre de votre famille" value={form.memberId||potInviteCandidates[0]?.id} onChange={v=>setField('memberId',v)}
                 options={potInviteCandidates.map(m=>({value:m.id,label:m.name+(m.simpleOne?' · Simple One':'' )}))}/>
               <p className="text-[12px] text-[#867A92] bg-[#F7F2FE] p-3 rounded-2xl">Une invitation en attente sera créée. Le membre doit l'accepter dans son profil de démonstration pour rejoindre la cagnotte.</p></>
            :<p className="text-[12px] text-[#867A92]">Tous les membres participent déjà ou ont une invitation en attente.</p>}
        </>}
        {modal==='pot-deposit'&&(form.stage==='confirm'
          ?<div className="space-y-3">
             <p className="text-[12px] font-bold text-[#553E71]">Vérifiez votre contribution</p>
             <div className="bg-[#F7F2FE] rounded-[22px] p-4 space-y-3">
               <div className="flex justify-between gap-3 text-[12px]"><span className="text-[#7E7091]">Cagnotte</span><span className="font-bold text-right">{pot?.title}</span></div>
               <div className="flex justify-between gap-3 text-[12px]"><span className="text-[#7E7091]">Compte à débiter</span><span className="font-bold text-right">{potFundingOptions.find(o=>o.value===form.source)?.label||'Mon compte Simple'}</span></div>
               <div className="flex justify-between gap-3 text-[13px] pt-3 border-t border-[#E7DDF4]"><span className="text-[#624E79]">Montant</span><span className="font-extrabold text-[#6B28D7]">{currency(parseMoney(form.amount||'0'))}</span></div>
             </div>
             <p className="text-[11px] text-[#8C809B]">Confirmation simulée : seuls les soldes fictifs de votre prototype seront modifiés.</p>
             <button type="button" onClick={()=>setField('stage','')} className="text-[12px] font-bold text-[#6829D6]">Modifier le montant ou le compte</button>
           </div>
          :<><SelectInput label="Compte à débiter" value={form.source||`simple:${data.viewerId}`} onChange={v=>setField('source',v)} options={potFundingOptions}/>
             <Input label="Montant à contribuer (DH)" type="number" min="0.01" value={form.amount} onChange={v=>setField('amount',v)} placeholder="Ex. 100" required/>
             <p className="text-[11px] text-[#897B96]">Reste à collecter : {pot?currency(Math.max(0,pot.target-pot.balance)):'0 DH'}. Débit simulé sur le compte sélectionné.</p></>)}
        {modal==='pot-close'&&<div className="bg-[#FFF4F7] p-4 rounded-[20px] space-y-2">
          <p className="font-bold text-[13px] text-[#994461]">Clôturer cette collecte ?</p>
          <p className="text-[12px] text-[#87687A]">Il ne sera plus possible de contribuer ni d'inviter des membres. Les {pot?currency(pot.balance):'fonds'} déjà collectés resteront affichés. Aucun transfert ni remboursement réel n'est effectué par ce prototype.</p>
        </div>}
        {modal==='new-document'&&<><Input label="Titre du document" value={form.title} onChange={v=>setField('title',v)} placeholder="Assurance, attestation…"/><SelectInput label="Type" value={form.type||'Autre'} onChange={v=>setField('type',v)} options={['Autre','Assurance','Identité','Scolarité','Logement'].map(x=>({value:x,label:x}))}/><Input label="Date d’expiration (facultative)" type="date" value={form.expiry} onChange={v=>setField('expiry',v)}/><p className="text-xs font-bold">Personnes autorisées</p>{family?.members.map(m=><label key={m.id} className="flex items-center gap-2 text-xs"><input type="checkbox" className="accent-[#722DDD]" checked={(form.visibleTo||'').split(',').includes(m.id)} onChange={e=>{const s=new Set((form.visibleTo||'').split(',').filter(Boolean));e.target.checked?s.add(m.id):s.delete(m.id);setField('visibleTo',[...s].join(','))}}/>{m.name}</label>)}<p className="text-[11px] text-[#83768F]">Ce prototype ne stocke pas les fichiers eux-mêmes.</p></>}
       {modal==='new-trip'&&<><SelectInput label="Voyageur" value={form.traveler||data.viewerId} onChange={v=>setField('traveler',v)} options={memberOptions}/><Input label="Destination" value={form.destination} onChange={v=>setField('destination',v)} placeholder="Marrakech…"/><Input label="Date" type="date" value={form.date} onChange={v=>setField('date',v)}/><Input label="Budget indicatif (DH)" value={form.amount} onChange={v=>setField('amount',v)} type="number"/></>}
       {modal==='new-credit'&&<><Input label="Montant souhaité (DH)" value={form.amount} onChange={v=>setField('amount',v)} type="number" min="1"/><SelectInput label="Compte associé" value={form.account||`simple:${data.viewerId}`} onChange={v=>setField('account',v)} options={[{value:`simple:${data.viewerId}`,label:'Mon compte Simple'},...(admin&&family?.account?[{value:'account',label:'Sous-compte Famille'}]:[]),...(family&&canViewJointAccount(family,data.viewerId)?[{value:'joint',label:'Compte joint'}]:[])]}/><p className="text-xs text-[#867991]">Aucune demande bancaire réelle ne sera transmise.</p></>}
       {(modal==='goal-delete'||modal==='member-delete'||modal==='family-delete')&&<div className="bg-[#FFF4F7] p-4 rounded-2xl"><p className="text-[13px] text-[#A13F66] font-semibold">Cette action modifie les données locales du prototype.</p><p className="text-[11px] text-[#94667B] mt-1">{modal==='member-delete'?'Le retrait est bloqué tant que des fonds ou des engagements sont associés au membre.':modal==='goal-delete'?'Le solde de l’épargne active sera simulé comme reversé au propriétaire.':'La famille disparaîtra de cette démonstration.'}</p></div>}
       {error&&<p role="alert" className="text-xs text-[#BE3463] bg-[#FFF0F4] rounded-xl px-3 py-2">{error}</p>}
       <button type="submit" className="btn-simple-primary w-full h-12 text-sm font-bold flex gap-2 items-center justify-center">{modal==='member-delete'||modal==='family-delete'||modal==='goal-delete'?'Confirmer la suppression':modal==='goal-close'?'Clôturer le projet':modal==='goal-edit'?'Enregistrer les modifications':modal==='goal-schedule'?'Enregistrer la programmation':modal==='pot-close'?'Clôturer la collecte':modal==='pot-invite'?'Envoyer l’invitation':modal==='pot-edit'?'Enregistrer':modal==='pot-deposit'?(form.stage==='confirm'?'Confirmer ma contribution':'Vérifier ma contribution'):modal==='open-account'||modal==='open-joint'?'Confirmer l’ouverture':'Continuer'} <ArrowRight size={17}/></button>
       <button type="button" onClick={close} className="w-full text-xs font-bold py-2 text-[#8B7F98]">Annuler</button>
      </form>}
    </div>
   </div>, document.getElementById('simple-device-frame') ?? document.body)}
 </div>;
}
