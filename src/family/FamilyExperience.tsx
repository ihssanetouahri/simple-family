import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, Bell, BookOpen, CalendarDays, CalendarClock, Check,
  CheckCircle2, ChevronDown, ChevronRight, CircleHelp, Clock3, CreditCard, Crown, FileText,
  Gift, HeartHandshake, Home, Landmark, LockKeyhole, MessageCircle, MoreHorizontal, Plus,
  ReceiptText, RotateCcw, Send, Settings2, ShieldCheck, Sparkles, Target, Trash2, Users,
  Wallet, X, Eye, PiggyBank, Plane, Coins, PenLine, CheckCheck, UserPlus, Camera,
  WalletCards, Download, Info, BadgeCheck, ExternalLink
} from 'lucide-react';
import { MobileHeader, SimpleButton, type Navigate } from '../components/SimpleUI';
import {
  avatarFor, canSeePocket, createDemoState, currency, findMember, isAdmin, loadFamilyState,
  moneyValid, parseMoney, roleLabel, saveFamilyState, today, uid,
  type Family, type FamilyState, type Member, type Role
} from './model';
import lamiaAvatar from '../assets/images/lamia_avatar.jpg';
import karimAvatar from '../assets/images/karim.jpg';
import yasmineAvatar from '../assets/images/yasmine.jpg';
import familyPhoto from '../assets/images/family_photo.jpg';
import { AccountJourneys, type AccountJourneyHandle } from './AccountJourneys';

type Route = 'dashboard'|'members'|'accounts'|'pocket'|'cards'|'savings'|'goal'|'pots'|'pot'|
 'pockets'|'services'|'chat'|'vault'|'trip'|'loyalty'|'loan'|'pfm'|'preferences'|'invite'|'alerts'|'sub-account'|'joint-account';
type ModalKind = 'new-family'|'join-family'|'invite'|'rename'|'transfer'|'open-account'|'open-joint'|'create-card'|
  'new-goal'|'goal-deposit'|'goal-withdraw'|'goal-delete'|'new-pot'|'pot-deposit'|'new-document'|
  'pay-bill'|'simple-pay'|'new-trip'|'new-credit'|'member-delete'|'family-delete'|'otp'|
  'limit'|'goal-schedule'|null;
type FormData = Record<string,string>;
type PendingPayment = { from: string; to:string; amount:number; label:string; category:string; alertId?:string };
const nowDate = () => new Date().toISOString().slice(0,10);
const cx = 'text-[#171126]';
const subtle = 'text-[#817895]';
const softBorder='border border-[#EDE7F6]';

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
function PillButton({children,onClick,secondary=false,disabled=false}: {children:React.ReactNode;onClick:()=>void;secondary?:boolean;disabled?:boolean}) {return <button disabled={disabled} type="button" onClick={onClick} className={`${secondary?'bg-[#F0EAFC] text-[#6225CE]':'btn-simple-primary text-white'} h-[45px] rounded-full px-4 flex items-center justify-center gap-2 font-bold text-[13px] w-full disabled:opacity-40 disabled:cursor-not-allowed`}>{children}</button>}
function ActionLine({icon:Icon,title,subtitle,onClick,trailing,disabled=false}:{icon:React.ComponentType<{size?:number;className?:string}>;title:string;subtitle?:string;onClick?:()=>void;trailing?:React.ReactNode;disabled?:boolean}) {return <button disabled={disabled} onClick={onClick} type="button" className="w-full text-left py-3.5 flex items-center gap-3 border-b last:border-b-0 border-[#F1EDF7] disabled:opacity-40"><div className="w-10 h-10 shrink-0 rounded-2xl bg-[#F4EEFF] text-[#6824DC] flex items-center justify-center"><Icon size={19}/></div><div className="min-w-0 flex-1"><p className="text-[13px] font-bold text-[#221633] truncate">{title}</p>{subtitle&&<p className="text-[11px] text-[#817895] mt-0.5 leading-snug">{subtitle}</p>}</div>{trailing||<ChevronRight size={17} className="text-[#A69EB9] shrink-0"/>}</button>}
function Input({label,value,onChange,type='text',placeholder='',min,required=false}:{label:string;value?:string;onChange:(v:string)=>void;type?:string;placeholder?:string;min?:string;required?:boolean}) {return <label className="block space-y-1.5"><span className="text-[12px] font-bold text-[#554967]">{label}</span><input required={required} min={min} type={type} value={value??''} placeholder={placeholder} onChange={e=>onChange(e.target.value)} className="w-full h-11 rounded-2xl bg-[#F8F6FD] border border-[#E9E1F4] text-[#241536] px-3.5 text-[13px] outline-none focus:ring-2 focus:ring-[#C9AFFB]"/></label>}
function SelectInput({label,value,onChange,options}:{label:string;value?:string;onChange:(v:string)=>void;options:{value:string;label:string}[]}) {return <label className="block space-y-1.5"><span className="text-[12px] font-bold text-[#554967]">{label}</span><select value={value??''} onChange={e=>onChange(e.target.value)} className="w-full h-11 rounded-2xl bg-[#F8F6FD] border border-[#E9E1F4] text-[#241536] px-3.5 text-[13px] outline-none focus:ring-2 focus:ring-[#C9AFFB]">{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>}
function Progress({value,total,tone='violet'}:{value:number;total:number;tone?:'violet'|'green'|'amber'}) { const colors={violet:'bg-[#7926EB]',green:'bg-[#18AB7F]',amber:'bg-[#F4A344]'}; return <div className="h-2.5 rounded-full bg-[#EEEAF4] overflow-hidden"><div className={`h-full rounded-full ${colors[tone]} transition-all`} style={{width:`${Math.min(100,Math.max(0,total?value/total*100:0))}%`}}/></div> }
const dateFor = (date:string) => date ? new Date(date+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}):'À définir';
const daysUntil = (date:string) => {const today=new Date();today.setHours(12,0,0,0);return Math.max(0,Math.round((new Date(date+'T12:00:00').getTime()-today.getTime())/86400000));};

function AlertItem({icon:Icon,title,subtitle,badge,onClick,tone='violet'}:{icon:React.ComponentType<{size?:number;className?:string}>;title:string;subtitle:string;badge?:string;onClick:()=>void;tone?:'violet'|'amber'}) {
 return <button type="button" onClick={onClick} className="w-full flex items-center gap-3 py-3.5 text-left border-b last:border-b-0 border-[#F0EBF6] transition-colors hover:bg-[#FAF7FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7630E3]">
  <span className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center ${tone==='amber'?'bg-[#FFF3E1] text-[#BF7A12]':'bg-[#F1E9FF] text-[#7430DD]'}`}><Icon size={19}/></span>
  <span className="flex-1 min-w-0"><span className="block text-[13px] font-extrabold text-[#241932] leading-snug truncate">{title}</span><span className="block text-[11px] text-[#746884] mt-1 leading-snug">{subtitle}</span></span>
  <span className="shrink-0 flex items-center gap-1.5">{badge&&<span className="rounded-full bg-[#FFF0D7] text-[#A56B12] px-2 py-1 text-[10px] font-bold">{badge}</span>}<ChevronRight size={16} className="text-[#9487A4]"/></span>
 </button>;
}


export function FamilyExperience({navigate,onChatViewChange}:{navigate:Navigate;onChatViewChange?:(active:boolean)=>void}) {
 const [data,setData]=useState<FamilyState>(loadFamilyState);
 const [route,setRoute]=useState<Route>('dashboard');
 const [stack,setStack]=useState<Route[]>([]);
 const accountJourneyRef=useRef<AccountJourneyHandle>(null);
 const [modal,setModal]=useState<ModalKind>(null);
 const [form,setForm]=useState<FormData>({});
 const [error,setError]=useState('');
 const [toast,setToast]=useState('');
 const [selectedMember,setSelectedMember]=useState('yasmine');
 const [selectedGoal,setSelectedGoal]=useState('goal_vac');
 const [selectedPot,setSelectedPot]=useState('pot1');
 const [pendingPayment,setPendingPayment]=useState<PendingPayment|null>(null);
 const [otpStage,setOtpStage]=useState(1);
 const [chatInput,setChatInput]=useState('');
 const [selectorOpen,setSelectorOpen]=useState(false);
 const [selectorPosition,setSelectorPosition]=useState({top:0,right:12,width:252});
 const familySelectorButtonRef=useRef<HTMLButtonElement>(null);
 const familySelectorMenuRef=useRef<HTMLDivElement>(null);
 const [demoOpen,setDemoOpen]=useState(false);
 const [showAmounts,setShowAmounts]=useState(true);
 const family = data.families.find(f=>f.id===data.activeFamilyId) || null;
 const viewer = family?.members.find(m=>m.id===data.viewerId) || null;
 const admin = family ? isAdmin(family,data.viewerId):false;
 const leader = viewer?.role==='leader';
 const canViewFamilyAccount = family ? admin || family.accountViewIds.includes(data.viewerId) : false;
 const visibleGoals=family?.goals.filter(g=>admin||g.ownerId===data.viewerId||g.contributors.includes(data.viewerId)||g.history.some(h=>h.memberId===data.viewerId))||[];
 const goal=family?.goals.find(g=>g.id===selectedGoal);
 const pocket = family?.pockets.find(p=>p.ownerId===selectedMember);
 const owner=family?.members.find(m=>m.id===selectedMember);
 const pot=family?.pots.find(p=>p.id===selectedPot);
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
   onChatViewChange?.(route==='chat');
   return ()=>onChatViewChange?.(false);
 },[route,onChatViewChange]);
 useEffect(()=>{
   if(route!=='chat')return;
   const scrollable=document.getElementById('simple-scroll-area');
   if(scrollable)scrollable.scrollTop=scrollable.scrollHeight;
 },[route,family?.chat.length]);
 const memberOptions=family?.members.map(m=>({value:m.id,label:`${m.name}${m.simpleOne?' · Simple One':''}`}))||[];
 const visiblePockets=family?.pockets.filter(p=>canSeePocket(family,data.viewerId,p.ownerId))||[];
 const transferOptions=useMemo(()=>{
   if(!family||!viewer)return [];
   const opts=[{value:`simple:${viewer.id}`,label:`Mon compte Simple · ${currency(viewer.simpleBalance)}`}];
   if(admin&&family.account) opts.push({value:'account',label:`Sous-compte Famille · ${currency(family.account.balance)}`});
   if(admin&&family.joint) opts.push({value:'joint',label:`Compte joint · ${currency(family.joint.balance)}`});
   family.pockets.filter(p=>canSeePocket(family,viewer.id,p.ownerId)).forEach(p=>{
     const m=findMember(family,p.ownerId);opts.push({value:`pocket:${p.ownerId}`,label:`Pocket ${m?.name||''} · ${currency(p.balance)}`});
   });
   return opts;
 },[family,viewer,admin]);
 function currentBalance(f:Family,ref:string):number|undefined {
   if(ref==='account')return f.account?.balance;
   if(ref==='joint')return f.joint?.balance;
   if(ref.startsWith('simple:'))return f.members.find(m=>m.id===ref.slice(7))?.simpleBalance;
   if(ref.startsWith('pocket:'))return f.pockets.find(p=>p.ownerId===ref.slice(7))?.balance;
   return undefined;
 }
 function changeBalance(f:Family,ref:string,delta:number){
   if(ref==='account'&&f.account)f.account.balance+=delta;
   if(ref==='joint'&&f.joint)f.joint.balance+=delta;
   if(ref.startsWith('simple:')){const m=findMember(f,ref.slice(7));if(m)m.simpleBalance+=delta;}
   if(ref.startsWith('pocket:')){const p=f.pockets.find(p=>p.ownerId===ref.slice(7));if(p)p.balance+=delta;}
 }
 function commitPayment(payment:PendingPayment){
  mutate((_d,f)=>{
    changeBalance(f,payment.from,-payment.amount);
    if(payment.to!=='external')changeBalance(f,payment.to,payment.amount);
    f.transactions.unshift({id:uid('tx'),date:today(),title:payment.label,amount:payment.to==='external'?-payment.amount:payment.amount,category:payment.category,source:payment.from,target:payment.to});
    if(payment.to==='external')f.loyaltyPoints+=Math.floor(payment.amount/50); // illustrative, not a business rule
    if(payment.alertId){const alert=f.alerts.find(a=>a.id===payment.alertId);if(alert)alert.resolved=true;}
  });
  close();show(`${payment.label} · ${currency(payment.amount)} (simulation)`);
 }
 function requestPayment(payment:PendingPayment){
  if(!family||!viewer){setError('Aucune famille sélectionnée.');return false;}
  if(!moneyValid(payment.amount)){setError('Saisissez un montant positif valide.');return false;}
  if(payment.from===payment.to){setError('Choisissez deux comptes différents.');return false;}
  const balance=currentBalance(family,payment.from);
  if(balance===undefined||balance<payment.amount){setError('Solde insuffisant pour cette simulation.');return false;}
  if((payment.from==='account'||payment.from==='joint')&&!admin){setError('Cette opération est réservée au Leader et aux Co-leaders.');return false;}
  if(payment.from==='joint'&&!family.joint){setError('Aucun compte joint.');return false;}
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
      if(!admin||family.joint||!family.members.some(m=>m.role==='coleader'&&m.relation==='Conjoint')){setError('Le compte joint nécessite un couple Leader / Co-leader.');return;}
      mutate((_d,f)=>{f.joint={id:uid('joint'),label:'Compte joint',balance:0,limit:9000}});close();show('Compte joint créé (simulation).');break;
   }
   case 'transfer':{
      const amount=parseMoney(form.amount||'0');
      requestPayment({from:form.from||`simple:${viewer?.id}`,to:form.to||'account',amount,label:form.label?.trim()||'Virement familial',category:'Transferts'});break;
   }
   case 'simple-pay':case 'pay-bill':{
      const amount=parseMoney(form.amount||'0');
      const linkedBill=modal==='pay-bill'?family.alerts.find(a=>a.id===form.alertId&&a.beneficiary===form.beneficiary&&a.amount===amount):undefined;
      requestPayment({from:form.from||'account',to:'external',amount,label:modal==='simple-pay'?`Simple Pay · ${form.beneficiary||'Destinataire'}`:`Facture · ${form.beneficiary||'Service'}`,category:modal==='simple-pay'?'Simple Pay':'Factures',alertId:linkedBill?.id});break;
   }
   case 'create-card':{
     if(!admin){setError('Seul un Leader ou Co-leader peut attribuer une carte familiale.');return;}
     if(!form.source){setError('Choisissez un compte ou pocket.');return;}
     const holder=findMember(family,form.holder||data.viewerId);
     const linkedOwner=form.source.startsWith('pocket:')?form.source.slice(7):null;
     if(!holder||((form.source==='family'||form.source==='joint')&&holder.role==='member') || (linkedOwner&&holder.id!==linkedOwner&&holder.role==='member')){
       setError('Ce compte ne peut être utilisé que par un titulaire habilité.');return;
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
     if(!goal.contributors.includes(data.viewerId)&&!admin){setError('Vous ne pouvez pas contribuer à cet objectif.');return;}
     const amount=parseMoney(form.amount||'0');
     if(!moneyValid(amount)||amount>goal.target-goal.balance){setError('Montant invalide ou supérieur au reste à atteindre.');return;}
     if((viewer?.simpleBalance||0)<amount){setError('Solde Simple insuffisant.');return;}
     mutate((_d,f)=>{const g=f.goals.find(x=>x.id===selectedGoal)!;const m=findMember(f,data.viewerId)!;m.simpleBalance-=amount;g.balance+=amount;g.history.unshift({id:uid('gh'),memberId:m.id,amount,date:today(),kind:'deposit'});if(g.balance>=g.target){g.status='closed';const own=findMember(f,g.ownerId);if(own)own.simpleBalance+=g.balance;}});
     close();show(goal.balance+amount>=goal.target?'Objectif atteint : fonds reversés au propriétaire (simulation).':'Contribution ajoutée.');break;
   }
   case 'goal-withdraw':{
     if(!goal||goal.status!=='active'||!(admin||goal.ownerId===data.viewerId)){setError('Retrait non autorisé.');return;}
     const amount=parseMoney(form.amount||'0');if(!moneyValid(amount)||amount>goal.balance){setError('Montant supérieur à l’épargne disponible.');return;}
     mutate((_d,f)=>{const g=f.goals.find(x=>x.id===selectedGoal)!;g.balance-=amount;g.history.unshift({id:uid('gh'),memberId:data.viewerId,amount,date:today(),kind:'withdrawal'});findMember(f,g.ownerId)!.simpleBalance+=amount});close();show('Retrait simulé vers le compte du propriétaire.');break;
   }
   case 'goal-delete':{
     if(!goal||!(admin||goal.creatorId===data.viewerId)){setError('Action non autorisée.');return;}
     mutate((_d,f)=>{const g=f.goals.find(x=>x.id===selectedGoal)!;const own=findMember(f,g.ownerId);if(own&&g.status==='active')own.simpleBalance+=g.balance;f.goals=f.goals.filter(x=>x.id!==selectedGoal)});close();back();show('Objectif supprimé et fonds restitués (simulation).');break;
   }
   case 'goal-schedule':{
     if(!goal||!(admin||goal.ownerId===data.viewerId)){setError('Modification non autorisée.');return;}
     const amount=parseMoney(form.amount||'0');if(amount<0||!Number.isFinite(amount)){setError('Montant invalide.');return;}
     mutate((_d,f)=>{f.goals.find(x=>x.id===selectedGoal)!.scheduledAmount=amount});close();show('Programmation illustrative enregistrée, sans virement automatique.');break;
   }
   case 'new-pot':{
     const target=parseMoney(form.target||'0');if(!moneyValid(target)||!form.title?.trim()){setError('Nom et objectif valides requis.');return;}
     mutate((_d,f)=>f.pots.push({id:uid('pot'),title:form.title.trim(),target,balance:0,members:f.members.map(m=>m.id),status:'active'}));close();show('Cagnotte familiale ajoutée (modalités à valider).');break;
   }
   case 'pot-deposit':{
     if(!pot||pot.status!=='active'){setError('Cagnotte indisponible.');return;}
     const amount=parseMoney(form.amount||'0');if(!moneyValid(amount)||amount>pot.target-pot.balance||(viewer?.simpleBalance||0)<amount){setError('Montant invalide ou solde insuffisant.');return;}
     mutate((_d,f)=>{findMember(f,data.viewerId)!.simpleBalance-=amount;const p=f.pots.find(x=>x.id===selectedPot)!;p.balance+=amount;if(p.balance>=p.target)p.status='closed'});close();show('Participation à la cagnotte simulée.');break;
   }
   case 'new-document':{
     if(!form.title?.trim()){setError('Le nom du document est requis.');return;}
     mutate((_d,f)=>f.documents.push({id:uid('doc'),title:form.title.trim(),type:form.type||'Autre',expiry:form.expiry||'',ownerId:data.viewerId,visibleTo:(form.visibleTo||data.viewerId).split(',')}));close();show('Fiche document ajoutée (fichier non hébergé).');break;
   }
   case 'new-trip':{
     if(!admin){setError('Réservations réservées aux Leader et Co-leaders.');return;}
     if(!form.destination?.trim()||!form.date){setError('Destination et date requises.');return;}
     mutate((_d,f)=>f.bookings.push({id:uid('trip'),travelerId:form.traveler||data.viewerId,destination:form.destination.trim(),date:form.date,amount:parseMoney(form.amount||'0')||0}));close();show('Réservation fictive ajoutée, sans paiement.');break;
   }
   case 'new-credit':{
     const amount=parseMoney(form.amount||'0');if(!moneyValid(amount)){setError('Montant invalide.');return;}
     mutate((_d,f)=>f.creditRequests.push({id:uid('credit'),applicantId:data.viewerId,amount,account:form.account||`simple:${data.viewerId}`,status:'En étude'}));close();show('Demande fictive enregistrée, non transmise à une banque.');break;
   }
   case 'member-delete':{
     if(!admin||selectedMember===data.viewerId){setError('Suppression non autorisée.');return;}
     const toRemove=findMember(family,selectedMember);if(!toRemove||toRemove.role==='leader'||(toRemove.role==='coleader'&&!leader)){setError('La suppression d’un Co-leader est réservée au Leader.');return;}
     mutate((_d,f)=>{const member=findMember(f,selectedMember)!;const p=f.pockets.find(x=>x.ownerId===member.id);if(p)member.simpleBalance+=p.balance;
       f.pockets=f.pockets.filter(x=>x.ownerId!==member.id);f.members=f.members.filter(x=>x.id!==member.id);f.cards=f.cards.filter(c=>c.holderId!==member.id&&c.source!==`pocket:${member.id}`);});close();go('members');show('Membre retiré, pocket clôturé et fonds simulés reversés.');break;
   }
   case 'family-delete':{
     if(!leader){setError('Seul le Leader peut supprimer la famille.');return;}
     setData(prev=>{const families=prev.families.filter(f=>f.id!==prev.activeFamilyId);return {...prev,families,activeFamilyId:families[0]?.id||null,viewerId:'lamia'}});close();toDashboard();show('Famille supprimée de la démonstration.');break;
   }
   case 'limit':{
     const limit=parseMoney(form.amount||'0');if(!admin||!moneyValid(limit)){setError('Un Leader ou Co-leader doit saisir un plafond valide.');return;}
     mutate((_d,f)=>{const p=f.pockets.find(x=>x.ownerId===selectedMember);if(p)p.limit=limit});close();show('Plafond indicatif mis à jour.');break;
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
   if(!family||!leader)return;const m=findMember(family,memberId);if(!m||m.role==='leader'||(m.simpleOne&&role==='coleader')){show('Rôle non autorisé.');return;}
   mutate((_d,f)=>{findMember(f,memberId)!.role=role});show('Rôle mis à jour dans la démonstration.');
 }
 function createMessage(e:React.FormEvent){e.preventDefault();if(!chatInput.trim()||!viewer)return;mutate((_d,f)=>f.chat.push({id:uid('msg'),authorId:viewer.id,text:chatInput.trim(),date:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}));setChatInput('');}
 function toggleCard(id:string){if(!admin){show('Seuls Leader et Co-leaders gèrent les cartes familiales.');return;}mutate((_d,f)=>{const c=f.cards.find(x=>x.id===id);if(c)c.active=!c.active});show('État de la carte actualisé (simulation).')}
 function switchFamily(id:string){const f=data.families.find(x=>x.id===id);if(!f)return;setData(prev=>({...prev,activeFamilyId:id,viewerId:f.members.find(x=>x.id==='lamia')?.id||f.members[0].id}));setSelectorOpen(false);toDashboard();}
 function switchViewer(id:string){setData(prev=>({...prev,viewerId:id}));setDemoOpen(false);toDashboard();show('Profil fictif changé : les accès se mettent à jour.');}
 const initialsFor = (id:string) => family?.members.find(m=>m.id===id)?.name||'Membre';
 const showBalance=(n:number)=>showAmounts?currency(n):'•••• DH';
 const context={}; void context;

 const pageTitles:Record<Route,string>={dashboard:'Ma famille',members:'Membres et accès',accounts:'Comptes partagés','sub-account':'Sous-compte Famille','joint-account':'Compte joint',pockets:'Pockets des membres',pocket:`Pocket ${owner?.name||''}`,cards:'Cartes virtuelles',savings:'Nos projets d’épargne',goal:'Objectif d’épargne',pots:'Cagnottes familiales',pot:'Cagnotte',services:'Services familiaux',chat:'Chat Famille',vault:'Coffre-fort',trip:'Simple Trip',loyalty:'Ma fidélité',loan:'Demande de crédit',pfm:'Mon foyer · PFM',preferences:'Réglages Famille',invite:'Invitations',alerts:'À suivre en famille'};
 const mainGo=(next:Route)=>{if(route===next)return;go(next)};
 const isAccountRoute=(value:Route|undefined):value is 'sub-account'|'joint-account'=>value==='sub-account'||value==='joint-account';
 // Keep the journey mounted when visiting family member management, so the back arrow
 // restores the exact account screen rather than resetting to account overview.
 const previousFamilyRoute=stack[stack.length-1];
 const mountedAccountRoute=isAccountRoute(route)?route:(route==='members'&&isAccountRoute(previousFamilyRoute)?previousFamilyRoute:null);
 const navigateToMember=(id:string)=>{setSelectedMember(id);go('pocket')};
 const navigateToGoal=(id:string)=>{setSelectedGoal(id);go('goal')};
 const navigateToPot=(id:string)=>{setSelectedPot(id);go('pot')};
 const balances={family:family?.account?.balance||0,joint:family?.joint?.balance||0};void balances;
 const goalHomeLabel=(g:Family['goals'][number])=>{
   if(g.contributors.length<=1)return `Objectif d’épargne · ${initialsFor(g.ownerId)}`;
   const n=new Set(g.history.filter(h=>h.kind==='deposit').map(h=>h.memberId)).size;
   return n?`Projet familial · ${n} contributeur${n>1?'s':''}`:'Projet familial · Contributions ouvertes';
 };
 const upcomingFollowUpGoal=visibleGoals.find(g=>{
   if(g.status!=='active'||g.balance>=g.target||!g.deadline)return false;
   const days=(new Date(g.deadline+'T12:00:00').getTime()-Date.now())/86400000;
   return days>=0&&days<=30;
 })||null;
 const dueBill=admin?family?.alerts.find(a=>a.type==='bill'&&!a.resolved)||null:null;
 const pendingInvite=admin?family?.invites[0]||null:null;
 const displayUpcomingGoal=Boolean(upcomingFollowUpGoal&&(Number(Boolean(dueBill))+Number(Boolean(pendingInvite))<2));
 const hasFamilyFollowUps=Boolean(dueBill||pendingInvite||displayUpcomingGoal);
 const openDueBill=(bill:Family['alerts'][number])=>launch('pay-bill',{from:'account',beneficiary:bill.beneficiary,amount:String(bill.amount),alertId:bill.id});

 return <div className="min-h-full flex flex-col bg-simple-canvas relative">
   {route==='dashboard' ? <div className="sticky top-0 z-30 bg-[#F6F3FE]/85 backdrop-blur-md px-5 pt-3 pb-3">
    <div className="flex items-center justify-between gap-2"><button onClick={()=>navigate('HOME')} type="button" aria-label="Retour accueil" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><ArrowLeft size={19}/></button>
     <div className="text-center min-w-0 flex-1"><p className="text-[11px] text-[#85769D]">Espace familial</p><h1 className="font-extrabold text-[18px] leading-tight truncate">Ma famille</h1></div>
     <button type="button" aria-label="Réglages de la famille" onClick={()=>mainGo('preferences')} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><Settings2 size={19}/></button>
    </div></div> : <MobileHeader title={pageTitles[route]} onBack={handleBack} subtitle={route==='pfm'?'Aperçu de la passerelle':'Services de votre famille'}/>}
   <div className="px-5 pb-7 pt-3 space-y-5 flex-1">
     <div className="flex items-center justify-between gap-2 px-1"><span className="flex items-center gap-1.5 text-[10px] font-bold text-[#7E4DBD]"><span className="w-1.5 h-1.5 bg-[#7B34E8] rounded-full"/> PROTOTYPE INTERACTIF</span><button type="button" onClick={()=>setDemoOpen(o=>!o)} className="text-[10px] text-[#6A2CCC] font-bold bg-[#EDE5FD] px-2.5 py-1.5 rounded-full flex items-center gap-1">Mode démo <ChevronDown size={12}/></button></div>
     {demoOpen && <Panel className="p-4 space-y-3"><div className="flex justify-between items-center"><strong className="text-sm">Tester les droits par profil</strong><button type="button" aria-label="Fermer" onClick={()=>setDemoOpen(false)}><X size={17}/></button></div>
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
                 className="shrink-0 bg-white/20 backdrop-blur-md border border-white/35 text-white rounded-full px-3 py-2 text-[11px] font-bold flex items-center gap-1.5">
                 Mes familles <ChevronDown size={14}/>
               </button>
             </div>
             <div className="flex items-end justify-between gap-3">
               <button type="button" onClick={()=>mainGo('members')} className="text-[12px] font-bold rounded-full px-3.5 py-2.5 bg-white text-[#5120A8] inline-flex items-center gap-2">
                 Voir les membres <ArrowRight size={15}/>
               </button>
               <div className="flex -space-x-2" aria-label="Aperçu des membres">
                 {family.members.slice(0,3).map(m=><Avatar key={m.id} member={m} size={34}/>)}
               </div>
             </div>
           </div>
         </section>
         
       </div>

       {/* Alertes fictives, actionnables et visibles uniquement quand elles sont en attente. */}
       {hasFamilyFollowUps&&<section>
         <Heading title="À suivre en famille" right={<button type="button" onClick={()=>mainGo('alerts')} className="text-[12px] text-[#6428DF] font-bold flex items-center">Voir tout <ChevronRight size={15}/></button>}/>
         <Panel className="px-4">
           {dueBill&&<AlertItem icon={CalendarClock} title={dueBill.title} subtitle={`${currency(dueBill.amount)} · Échéance le ${dateFor(dueBill.dueDate)}`} badge={`J-${daysUntil(dueBill.dueDate)}`} tone="amber" onClick={()=>openDueBill(dueBill)}/>}
           {pendingInvite&&<AlertItem icon={UserPlus} title="Invitation en attente" subtitle={`${pendingInvite.name} · Gérer son invitation`} onClick={()=>mainGo('members')}/>}
           {displayUpcomingGoal&&upcomingFollowUpGoal&&<AlertItem icon={CalendarDays} title={upcomingFollowUpGoal.title} subtitle={`Échéance le ${dateFor(upcomingFollowUpGoal.deadline)} · Suivre le projet`} onClick={()=>navigateToGoal(upcomingFollowUpGoal.id)}/>}
         </Panel>
       </section>}

       <section>
         <Heading title="Comptes partagés" right={<button type="button" onClick={()=>mainGo('accounts')} className="text-[12px] text-[#6428DF] font-bold flex items-center">Voir tout <ChevronRight size={15}/></button>}/>
         <div className="grid grid-cols-2 gap-3">
           <button type="button" onClick={()=>mainGo('sub-account')} className="bg-white border border-[#EBE4F4] rounded-[23px] p-4 text-left min-h-[126px] flex flex-col shadow-sm transition-all duration-150 hover:border-[#CBB8EE] hover:shadow-md active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7630E3]">
             <div className="flex justify-between items-center"><Landmark size={21} className="text-[#7430DD]"/><ArrowUpRight size={16} className="text-[#A99EB8]"/></div>
             <p className="text-[11px] leading-tight text-[#726582] mt-3">Sous-compte Famille</p><p className="text-[10px] text-[#756785] mt-0.5">Dépenses communes</p>
             <p className="text-[17px] font-extrabold tracking-tight leading-tight mt-auto pt-2">{family.account?(canViewFamilyAccount?showBalance(family.account.balance):'Accès restreint'):'À créer'}</p>
           </button>
           {admin&&family.joint&&<button type="button" onClick={()=>mainGo('joint-account')} className="bg-white border border-[#EBE4F4] rounded-[23px] p-4 text-left min-h-[126px] flex flex-col shadow-sm transition-all duration-150 hover:border-[#CBB8EE] hover:shadow-md active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7630E3]">
             <div className="flex justify-between items-center"><HeartHandshake size={21} className="text-[#7430DD]"/><ArrowUpRight size={16} className="text-[#A99EB8]"/></div>
             <p className="text-[11px] leading-tight text-[#726582] mt-3">Compte joint</p><p className="text-[10px] text-[#756785] mt-0.5">Compte bancaire à deux</p>
             <p className="text-[17px] font-extrabold tracking-tight leading-tight mt-auto pt-2">{showBalance(family.joint.balance)}</p>
           </button>}
           {admin&&!family.joint&&<button type="button" onClick={()=>mainGo('joint-account')} className="bg-[#F5F0FC] border border-dashed border-[#D6C4F0] rounded-[23px] p-4 text-left min-h-[126px] flex flex-col transition-colors hover:bg-[#EEE5FC] hover:border-[#AB8CD9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7630E3]">
             <div className="flex justify-between items-center"><HeartHandshake size={21} className="text-[#8F69C2]"/><Plus size={16} className="text-[#8F69C2]"/></div>
             <p className="text-[11px] leading-tight text-[#726582] mt-3">Compte joint</p><p className="text-[10px] text-[#756785] mt-0.5">Compte bancaire à deux</p>
             <p className="text-[13px] font-bold text-[#6B35B1] mt-1">{family.jointApplication?(family.jointApplication.status==='awaiting'?'Accord en attente':family.jointApplication.status==='review'?'En cours de validation':'Demande refusée'):'À ouvrir'}</p>
           </button>}
         </div>
       </section>

       <section>
         <Heading title="Pockets des membres" right={<button type="button" onClick={()=>mainGo('pockets')} className="text-[12px] text-[#6428DF] font-bold flex items-center">Voir tout <ChevronRight size={15}/></button>}/>
         <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pr-3 scroll-smooth snap-x snap-mandatory scroll-px-1">
           {visiblePockets.slice(0,3).map(p=>{const m=findMember(family,p.ownerId);return <button key={p.id} type="button" onClick={()=>navigateToMember(p.ownerId)}
             className="shrink-0 snap-start w-[152px] rounded-[23px] p-4 bg-white border border-[#E9E1F5] text-left shadow-sm transition-all duration-150 hover:border-[#CBB8EE] hover:shadow-md active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7630E3]">
             <div className="flex items-center justify-between"><Avatar member={m} size={36}/><ArrowUpRight size={16} className="text-[#8D67C9]"/></div>
             <p className="mt-3 text-[11px] text-[#82778F] truncate">Pocket {m?.name}</p>
             <p className="font-extrabold text-[16px] mt-1 truncate">{showBalance(p.balance)}</p>
           </button>})}
           {visiblePockets.length===0&&<Panel className="p-4 w-full"><p className="text-[12px] text-[#81758E]">Aucun pocket accessible avec votre profil.</p></Panel>}
         </div>
       </section>

       {/* Savings goals and collection pots are different user intents. */}
       <section>
         <Heading title="Nos projets d’épargne" right={<button type="button" onClick={()=>mainGo('savings')} className="text-[12px] text-[#6428DF] font-bold flex items-center">Voir tout <ChevronRight size={15}/></button>}/>
         <Panel className="px-4 py-2 divide-y divide-[#F0EAF7]">
           {visibleGoals.filter(g=>g.status==='active').slice(0,2).map(g=><button key={g.id} type="button" onClick={()=>navigateToGoal(g.id)}
             className="block w-full text-left py-3.5 space-y-2.5 rounded-xl transition-colors hover:bg-[#FAF7FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7630E3]">
             <div className="flex items-center gap-2.5">
               <div className="w-10 h-10 shrink-0 rounded-2xl bg-[#F3EAFF] text-[#7530DC] flex items-center justify-center"><Target size={19}/></div>
               <div className="flex-1 min-w-0">
                 <p className="text-[13px] font-bold text-[#2B1B3E] truncate">{g.title}</p>
                 <p className="text-[11px] text-[#776A86] truncate">{goalHomeLabel(g)}</p>
               </div>
               <span className="text-[12px] font-bold text-[#7529DB] shrink-0">{Math.round(g.balance/g.target*100)} %</span>
             </div>
             <Progress value={g.balance} total={g.target}/>
             <p className="text-[11px] text-[#80758E]">{showBalance(g.balance)} sur {showBalance(g.target)}</p>
           </button>)}
           {visibleGoals.filter(g=>g.status==='active').length===0&&
             <div className="py-5 flex items-center gap-3">
               <PiggyBank size={24} className="text-[#7732D9] shrink-0"/>
               <div className="flex-1"><p className="text-[13px] font-bold">Un projet à préparer ensemble ?</p>
               <button type="button" onClick={()=>mainGo('savings')} className="text-[12px] font-bold text-[#6929D4] mt-1">Créer un projet <ArrowRight size={14} className="inline"/></button></div>
             </div>}
         </Panel>
       </section>

       <section>
         <Heading title="Nos cagnottes" right={<button type="button" onClick={()=>mainGo('pots')} className="text-[12px] text-[#6428DF] font-bold flex items-center">Voir tout <ChevronRight size={15}/></button>}/>
         <Panel className="px-4 py-2 divide-y divide-[#F0EAF7]">
           {family.pots.filter(p=>p.status==='active').slice(0,2).map(p=><button type="button" key={p.id} onClick={()=>navigateToPot(p.id)}
             className="block w-full py-3.5 text-left space-y-2.5 rounded-xl transition-colors hover:bg-[#FAF7FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7630E3]">
             <div className="flex items-center gap-2.5">
               <div className="w-10 h-10 shrink-0 rounded-2xl bg-[#E8F8F0] text-[#198A66] flex items-center justify-center"><Gift size={19}/></div>
               <div className="flex-1 min-w-0">
                 <p className="text-[13px] font-bold text-[#2B1B3E] truncate">{p.title}</p>
                 <p className="text-[11px] text-[#847991]">Cagnotte collective</p>
               </div>
               <span className="text-[12px] font-bold text-[#198A66] shrink-0">{Math.round(p.balance/p.target*100)} %</span>
             </div>
             <Progress value={p.balance} total={p.target} tone="green"/>
             <p className="text-[11px] text-[#80758E]">{showBalance(p.balance)} sur {showBalance(p.target)}</p>
           </button>)}
           {family.pots.filter(p=>p.status==='active').length===0&&
             <div className="py-5 flex items-center gap-3">
               <Gift size={24} className="text-[#198A66] shrink-0"/>
               <div className="flex-1"><p className="text-[13px] font-bold">Une occasion à célébrer ?</p>
               <button type="button" onClick={()=>mainGo('pots')} className="text-[12px] font-bold text-[#6929D4] mt-1">Créer une cagnotte <ArrowRight size={14} className="inline"/></button></div>
             </div>}
         </Panel>
       </section>

       <section>
         <Heading title="Services familiaux" right={<button type="button" onClick={()=>mainGo('services')} className="text-[12px] text-[#6428DF] font-bold flex items-center">Tous les services <ChevronRight size={15}/></button>}/>
         <Panel className="px-3 py-4">
           <div className="grid grid-cols-4 gap-1.5">
             {[{label:'Chat familial',icon:MessageCircle,screen:'chat'},{label:'Simple Trip',icon:Plane,screen:'trip'},{label:'Documents',icon:LockKeyhole,screen:'vault'},{label:'Autres',icon:MoreHorizontal,screen:'services'}].map(item=>
               <button type="button" key={item.label} onClick={()=>mainGo(item.screen as Route)} className="w-full min-w-0 min-h-[76px] rounded-2xl px-0.5 py-1 flex flex-col items-center justify-start gap-1.5 transition-colors hover:bg-[#F7F1FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7630E3]">
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
           <button type="button" onClick={()=>mainGo('pfm')} className="text-[12px] text-[#6024D1] font-bold mt-2 flex items-center gap-1">Découvrir Mon foyer <ArrowRight size={14}/></button>
         </div>
       </section>
     </>}

     {route==='alerts'&&<>
        <Panel className="p-5 space-y-1">
          <h2 className="text-[18px] font-extrabold">Les alertes de ma famille</h2>
          <p className="text-[12px] text-[#81758F] leading-relaxed">Retrouvez les actions importantes à suivre avec votre famille.</p>
        </Panel>
        {hasFamilyFollowUps?<Panel className="px-4">
          {admin&&family.alerts.filter(a=>a.type==='bill'&&!a.resolved).map(a=><AlertItem key={a.id} icon={CalendarClock} title={a.title} subtitle={`${currency(a.amount)} · Échéance le ${dateFor(a.dueDate)}`} badge={`J-${daysUntil(a.dueDate)}`} tone="amber" onClick={()=>openDueBill(a)}/>)}
          {admin&&family.invites.map(inv=><AlertItem key={inv.id} icon={UserPlus} title="Invitation en attente" subtitle={`${inv.name} · Gérer son invitation`} onClick={()=>mainGo('members')}/>)}
          {upcomingFollowUpGoal&&<AlertItem icon={CalendarDays} title={upcomingFollowUpGoal.title} subtitle={`Échéance le ${dateFor(upcomingFollowUpGoal.deadline)}`} onClick={()=>navigateToGoal(upcomingFollowUpGoal.id)}/>}
        </Panel>:<Panel className="p-6 space-y-2 text-center">
          <CheckCircle2 size={26} className="mx-auto text-[#20A475]"/>
          <h3 className="text-[14px] font-extrabold">Tout est à jour !</h3>
          <p className="text-[12px] text-[#81758F]">Aucune action urgente pour votre famille actuellement.</p>
        </Panel>}
        <p className="px-1 text-[11px] text-[#897B9A]">Scénario de démonstration : ces alertes et leurs échéances sont fictives.</p>
      </>}

      {route==='members' && <>
       <Panel className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-[#887C97]">Composition de la famille</p><h2 className="font-extrabold text-[22px] mt-1">{family.members.length} membres</h2></div><div className="text-3xl">👨‍👩‍👧</div></div></Panel>
       <section><Heading title="Membres" right={admin&&<button type="button" onClick={()=>launch('invite',{relation:'Proche',role:'member',simpleOne:'false'})} className="text-xs font-bold text-[#6725D8] flex items-center gap-1"><Plus size={15}/>Inviter</button>}/><Panel className="px-4">{family.members.map(m=>{const p=family.pockets.find(x=>x.ownerId===m.id);return <div key={m.id} className="py-3.5 flex items-center gap-3 border-b last:border-none border-[#F0EBF6]"><Avatar member={m} size={46}/><button type="button" onClick={()=>navigateToMember(m.id)} className="text-left flex-1 min-w-0"><p className="text-[14px] font-extrabold">{m.name} {m.id===data.viewerId&&<span className="text-[#9359DA] text-[10px]">(vous)</span>}</p><p className="text-[11px] text-[#80758E]">{m.relation} · Pocket {p?showBalance(p.balance):'—'}</p><div className="mt-1"><Tag tone={m.role==='leader'?'violet':m.simpleOne?'amber':'gray'}>{m.simpleOne?'Simple One':roleLabel(m.role)}</Tag></div></button>{leader&&m.role!=='leader'&&!m.simpleOne&&<select aria-label={`Rôle de ${m.name}`} className="text-[10px] w-[93px] bg-[#F8F4FF] rounded-xl px-1 py-2" value={m.role} onChange={e=>updateMemberRole(m.id,e.target.value as Role)}><option value="member">Membre</option><option value="coleader">Co-leader</option></select>}{admin&&m.role!=='leader'&&(m.role!=='coleader'||leader)&&<button type="button" aria-label={`Retirer ${m.name}`} onClick={()=>{setSelectedMember(m.id);launch('member-delete')}} className="text-[#B68BAF] p-1.5"><Trash2 size={16}/></button>}</div>})}</Panel></section>
       <section><Heading title="Invitations en attente"/><Panel className="p-4 space-y-2">{family.invites.length?family.invites.map(inv=><div key={inv.id} className="flex items-center justify-between gap-2 p-2 bg-[#FAF7FF] rounded-xl"><div><p className="text-[13px] font-bold">{inv.name}</p><p className="text-[11px] text-[#887D98]">{inv.relation} · Invitation en attente</p></div>{admin&&<button type="button" className="text-[11px] rounded-full px-3 py-2 bg-[#E7FAEF] text-[#168253] font-bold" onClick={()=>acceptInvite(inv.id)}>Simuler acceptation</button>}</div>):<p className="text-[12px] text-[#81768F]">Aucune invitation en attente.</p>}</Panel></section>
       <Panel className="p-4 flex items-start gap-2.5"><ShieldCheck size={18} className="text-[#6535D7] shrink-0"/><p className="text-[11px] leading-relaxed text-[#7F758D]">Les invitations et rattachements sont simulés. Un membre Simple One ne peut pas devenir Co-leader. Les autorisations réelles restent à confirmer avec les équipes métiers.</p></Panel>
     </>}

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
                <span className="block text-[16px] font-extrabold mt-2">{family.joint?showBalance(family.joint.balance):family.jointApplication?'Ouverture en cours':'À ouvrir'}</span>
              </span><ChevronRight size={18} className="text-[#8D79AC] shrink-0"/>
            </button>
          </div>
        </section>
        <Panel className="px-4"><ActionLine icon={WalletCards} title="Pockets des membres" subtitle="Soldes et alimentation de chaque pocket" onClick={()=>mainGo('pockets')}/></Panel>
      </>}

      {mountedAccountRoute&&<div className={route==='members'?'hidden':''}>
        <AccountJourneys
          ref={accountJourneyRef}
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

     {route==='pocket'&&pocket&&owner&&<>
       <Panel className="p-5 bg-gradient-to-br from-[#3B117A] to-[#6F2EE3] text-white border-none"><div className="flex items-center gap-2"><Avatar member={owner} size={49}/><div><p className="text-[11px] text-white/75">Pocket personnel</p><h2 className="text-lg font-bold">{owner.name}</h2></div></div><p className="text-white/60 text-xs mt-6">Solde disponible</p><p className="text-[29px] font-extrabold mt-1">{showBalance(pocket.balance)}</p><p className="text-xs text-white/70 mt-4">Plafond indicatif : {currency(pocket.limit)}</p><div className="mt-2 h-2 rounded-full bg-white/20 overflow-hidden"><div className="bg-white h-full rounded-full" style={{width:`${Math.min(100,pocket.balance/pocket.limit*100)}%`}}/></div></Panel>
       <div className="grid grid-cols-2 gap-3"><PillButton onClick={()=>launch('transfer',{from:admin&&family.account?'account':`simple:${data.viewerId}`,to:`pocket:${owner.id}`})}>Alimenter <Plus size={16}/></PillButton><PillButton secondary onClick={()=>launch('transfer',{from:`pocket:${owner.id}`,to:`simple:${data.viewerId}`})}>Transférer <ArrowRight size={16}/></PillButton></div>
       <Panel className="px-4"><ActionLine icon={CreditCard} title="Cartes virtuelles associées" subtitle={`${family.cards.filter(c=>c.source===`pocket:${owner.id}`||c.source===pocket.id).length} carte(s)`} onClick={()=>mainGo('cards')}/>{admin&&<ActionLine icon={Settings2} title="Adapter le plafond" subtitle="Simulation de paramétrage" onClick={()=>launch('limit',{amount:String(pocket.limit)})}/>}<ActionLine icon={ShieldCheck} title="Droits d'accès" subtitle={owner.simpleOne?'Compte Simple One : règles spécifiques':'Visibilité : titulaire, Leader et Co-leader'} onClick={()=>show('Les règles d’autorisation sont appliquées dans le prototype selon le profil.')}/></Panel>
       <Panel className="p-4"><p className="text-[12px] text-[#7E738C]">Les opérations et cartes présentées sont des exemples. Aucun RIB réel ni service bancaire n’est connecté.</p></Panel>
     </>}

     {route==='cards'&&<>
      <Heading title="Les cartes associées à la famille"/><div className="space-y-3">{family.cards.filter(c=>admin||c.holderId===data.viewerId).map(c=>{const m=findMember(family,c.holderId);return <Panel key={c.id} className="p-4"><div className="rounded-[23px] bg-gradient-to-br from-[#2E0B69] to-[#7436E4] text-white p-5"><div className="flex justify-between items-center text-xs"><span className="font-bold">Simple Family</span><CreditCard size={20}/></div><p className="mt-7 font-mono text-[17px] tracking-[.1em]">•••• •••• •••• {c.last4}</p><div className="mt-5 flex items-center justify-between text-[11px]"><span>{m?.name}</span><span>{c.active?'Active':'Suspendue'}</span></div></div><div className="flex items-center justify-between pt-3"><p className="text-[12px] font-bold">{c.label}</p><button type="button" disabled={!admin} onClick={()=>toggleCard(c.id)} className="bg-[#EFE8FF] text-[#6828D4] text-[11px] font-bold px-3 py-2 rounded-full disabled:opacity-40">{c.active?'Suspendre':'Réactiver'}</button></div></Panel>})}</div>
      {admin&&<PillButton onClick={()=>launch('create-card',{source:family.account?'family':`pocket:${data.viewerId}`,holder:data.viewerId})}>Créer une carte virtuelle <Plus size={16}/></PillButton>}
      <Panel className="p-4"><p className="text-[12px] text-[#80758F]">Attribution et suspension simulées. Les plafonds Simple One, contrôles et règles de cartes réelles doivent être intégrés côté banque.</p></Panel>
     </>}

     {route==='savings'&&<>
       <Panel className="p-5 bg-gradient-to-br from-[#4F178F] to-[#8C43E6] text-white border-none"><div className="flex items-center gap-2 text-white/80 text-xs"><PiggyBank size={18}/> Objectifs d’épargne</div><p className="text-[29px] font-extrabold mt-4">{showBalance(visibleGoals.filter(g=>g.status==='active').reduce((s,g)=>s+g.balance,0))}</p><p className="text-[11px] text-white/75 mt-1">Épargne active de cette famille</p></Panel>
       <div className="flex justify-between items-center"><h3 className="text-lg font-extrabold">Nos projets</h3><button type="button" onClick={()=>launch('new-goal',{owner:data.viewerId,deadline:'2027-07-15',contributors:family.members.map(m=>m.id).join(',')})} className="text-xs font-bold text-[#6625DE] flex gap-1 items-center"><Plus size={15}/> Nouveau</button></div>
       {visibleGoals.length===0&&<Panel className="p-6 text-center space-y-3"><div className="text-4xl">✈️</div><h3 className="font-extrabold text-[18px]">Quel projet vous fait rêver ?</h3><p className="text-sm text-[#8B8098]">Un voyage, une fête ou un projet à préparer ensemble.</p><PillButton onClick={()=>launch('new-goal',{owner:data.viewerId,deadline:'2027-07-15',contributors:data.viewerId})}>Créer un objectif</PillButton></Panel>}
       {visibleGoals.map(g=><button type="button" onClick={()=>navigateToGoal(g.id)} key={g.id} className="card-simple p-4 block w-full text-left"><div className="flex justify-between items-center mb-3"><div className="w-10 h-10 rounded-2xl bg-[#F1E8FF] flex items-center justify-center text-xl">{g.title.toLowerCase().includes('vacan')?'✈️':'🎯'}</div><Tag tone={g.status==='closed'?'green':'violet'}>{g.status==='closed'?'Terminé':`${Math.round(g.balance/g.target*100)} %`}</Tag></div><p className="text-[15px] font-extrabold">{g.title}</p><div className="flex justify-between items-end mt-2 mb-2"><span className="text-[13px] font-bold text-[#6529DB]">{currency(g.balance)}</span><span className="text-[11px] text-[#837990]">sur {currency(g.target)}</span></div><Progress value={g.balance} total={g.target}/><p className="text-[11px] text-[#857A95] mt-2">Échéance : {dateFor(g.deadline)} · Pour {initialsFor(g.ownerId)}</p></button>)}
     </>}

     {route==='goal'&&goal&&visibleGoals.some(g=>g.id===goal.id)&&<>
       <div className="card-simple p-5 space-y-4"><div className="flex justify-between items-center"><span className="text-4xl">{goal.title.toLowerCase().includes('vacan')?'✈️':'🎯'}</span><Tag tone={goal.status==='closed'?'green':'violet'}>{goal.status==='closed'?'Clôturé':'En cours'}</Tag></div><div><h2 className="text-[21px] font-extrabold">{goal.title}</h2><p className="text-[11px] text-[#8A7D96] mt-1">Bénéficiaire : {initialsFor(goal.ownerId)} · {dateFor(goal.deadline)}</p></div><div className="flex justify-between items-end"><p className="text-[28px] font-extrabold">{currency(goal.balance)}</p><p className="text-[13px] text-[#857990]">/ {currency(goal.target)}</p></div><Progress value={goal.balance} total={goal.target}/><p className="text-[12px] text-[#806F99]">Encore {currency(Math.max(0,goal.target-goal.balance))} à atteindre</p></div>
       {goal.status==='active'&&<div className="grid grid-cols-2 gap-3"><PillButton onClick={()=>launch('goal-deposit',{amount:''})}><Plus size={16}/>Contribuer</PillButton><PillButton secondary disabled={!(admin||goal.ownerId===data.viewerId)} onClick={()=>launch('goal-withdraw',{amount:''})}>Retirer <ArrowRight size={16}/></PillButton></div>}
       <Panel className="p-4 space-y-3"><div className="flex items-center justify-between"><p className="text-[13px] font-extrabold">Contributeurs habilités</p><Users size={18} className="text-[#7A35E6]"/></div><div className="flex -space-x-2">{goal.contributors.map(id=><Avatar key={id} size={36} member={findMember(family,id)}/>)}</div><p className="text-[11px] text-[#837891]">Versement programmé fictif : {goal.scheduledAmount?currency(goal.scheduledAmount)+'/mois':'non défini'}</p>{(admin||goal.ownerId===data.viewerId)&&goal.status==='active'&&<button type="button" onClick={()=>launch('goal-schedule',{amount:String(goal.scheduledAmount)})} className="text-[#692AD8] text-[12px] font-bold flex items-center gap-1"><CalendarDays size={15}/> Paramétrer une programmation</button>}</Panel>
       <section><Heading title="Historique des mouvements"/><Panel className="px-4">{goal.history.length?goal.history.map(h=><div key={h.id} className="flex items-center py-3 border-b last:border-none border-[#F0EAF7] gap-3"><div className="bg-[#F0E9FF] p-2 rounded-xl text-[#7A35E0]"><ArrowDownLeft size={18}/></div><div className="flex-1"><p className="text-[12px] font-bold">{h.kind==='deposit'?'Contribution':'Retrait'} · {initialsFor(h.memberId)}</p><p className="text-[10px] text-[#8A8097]">{h.date}</p></div><span className="text-[12px] font-bold">{h.kind==='deposit'?'+':'−'}{currency(h.amount)}</span></div>):<p className="py-4 text-xs text-[#81758F]">Aucun mouvement pour le moment.</p>}</Panel></section>
       {(admin||goal.creatorId===data.viewerId)&&goal.status==='active'&&<button type="button" className="w-full py-3 text-[#AB5070] font-semibold text-xs" onClick={()=>launch('goal-delete')}>Supprimer l’objectif d’épargne</button>}
     </>}

     {route==='pots'&&<><Heading title="Les cagnottes familiales"/><p className="text-[12px] text-[#847791]">Cagnottes partagées : démonstration d'usage. Les règles transactionnelles détaillées de Famille restent à valider.</p>{family.pots.map(p=><button type="button" onClick={()=>navigateToPot(p.id)} key={p.id} className="card-simple p-4 text-left w-full space-y-3"><div className="flex items-center justify-between"><span className="text-3xl">🎁</span><Tag tone={p.status==='closed'?'green':'violet'}>{p.status==='closed'?'Terminée':'En cours'}</Tag></div><h3 className="font-extrabold text-[16px]">{p.title}</h3><div className="flex justify-between text-xs"><strong>{currency(p.balance)}</strong><span className="text-[#80748F]">{currency(p.target)}</span></div><Progress value={p.balance} total={p.target} tone="green"/></button>)}<PillButton onClick={()=>launch('new-pot')}>Créer une cagnotte <Plus size={16}/></PillButton></>}
     {route==='pot'&&pot&&<><Panel className="p-5 text-center space-y-4"><div className="text-5xl">🎁</div><h2 className="text-2xl font-extrabold">{pot.title}</h2><p className="text-3xl font-extrabold text-[#6728D9]">{currency(pot.balance)}</p><p className="text-xs text-[#8D8199]">Objectif : {currency(pot.target)}</p><Progress value={pot.balance} total={pot.target} tone="green"/></Panel>{pot.status==='active'&&<PillButton onClick={()=>launch('pot-deposit')}>Participer à la cagnotte <Plus size={16}/></PillButton>}</>}

     {route==='services'&&<>
       <Panel className="p-5"><p className="text-xs text-[#8738DB] font-bold">Simple Family</p><h2 className="text-[22px] font-extrabold mt-1">Tous vos services</h2><p className="text-xs text-[#84798F] mt-1">Un seul espace pour les usages bancaires et familiaux du quotidien.</p></Panel>
       <section><Heading title="Paiements et réservations"/><Panel className="px-4"><ActionLine icon={Send} title="Simple Pay Famille" subtitle="Réservé au Leader et aux Co-leaders" disabled={!admin||!family.account} onClick={()=>launch('simple-pay',{from:'account'})}/><ActionLine icon={ReceiptText} title="Payer une facture" subtitle="Selon les comptes et droits attribués" onClick={()=>launch('pay-bill',{from:admin&&family.account?'account':`simple:${data.viewerId}`})}/><ActionLine icon={Plane} title="Simple Trip" subtitle="Réservations pour les membres de la famille" onClick={()=>mainGo('trip')}/></Panel></section>
       <section><Heading title="Vie de famille"/><Panel className="px-4"><ActionLine icon={MessageCircle} title="Chat Famille" subtitle="Échangez avec vos proches" onClick={()=>mainGo('chat')}/><ActionLine icon={LockKeyhole} title="Coffre-fort numérique" subtitle="Documents et accès partagés" onClick={()=>mainGo('vault')}/><ActionLine icon={Gift} title="Cagnottes familiales" subtitle="Contributions et objectifs partagés" onClick={()=>mainGo('pots')}/></Panel></section>
       <section><Heading title="Autres avantages"/><Panel className="px-4"><ActionLine icon={Coins} title="Fidélité Famille" subtitle="Points liés aux opérations éligibles" onClick={()=>mainGo('loyalty')}/><ActionLine icon={Landmark} title="Demande de crédit" subtitle="Selon le profil et les droits" onClick={()=>mainGo('loan')}/></Panel></section>
     </>}

     {route==='chat'&&<div className="space-y-3">
        <div className="flex items-center gap-2 px-1 text-[#7A6C90] text-[11px]">
          <Users size={16} className="text-[#762DDC]"/>
          <span>{family.members.length} membres · Discussion familiale</span>
        </div>
        <div className="space-y-4 pb-3" aria-label="Messages du chat famille">
          {family.chat.map(msg=><div key={msg.id} className={`flex ${msg.authorId===data.viewerId?'justify-end':'justify-start'}`}>
            <div className={`rounded-[18px] max-w-[83%] px-3.5 py-2.5 ${msg.authorId===data.viewerId?'bg-[#6226D9] text-white rounded-br-sm':'bg-white border border-[#EBE3F5] text-[#352746] rounded-bl-sm'}`}>
              <p className="text-[10px] font-bold opacity-70 mb-1">{initialsFor(msg.authorId)}</p>
              <p className="text-[13px] break-words whitespace-pre-wrap">{msg.text}</p>
              <p className="text-[10px] opacity-60 text-right mt-1">{msg.date}</p>
            </div>
          </div>)}
        </div>
      </div>}
      {route==='vault'&&<><Panel className="p-5"><div className="flex gap-3"><div className="w-12 h-12 rounded-2xl flex justify-center items-center bg-[#F1EAFF] text-[#7631DD]"><LockKeyhole size={23}/></div><div className="flex-1"><h2 className="text-lg font-extrabold">Documents de famille</h2><p className="text-xs text-[#8B7F98]">Centralisez les références utiles.</p></div></div></Panel>{family.documents.filter(d=>leader||d.visibleTo.includes(data.viewerId)||d.ownerId===data.viewerId).map(d=><Panel className="p-4 flex items-center gap-3" key={d.id}><FileText size={23} className="text-[#7132DC]"/><div className="flex-1"><strong className="text-[13px]">{d.title}</strong><p className="text-[11px] text-[#897D96]">{d.type}{d.expiry?` · Expire le ${dateFor(d.expiry)}`:''}</p><p className="text-[10px] text-[#887C97]">Accessible à {leader?'Leader / personnes autorisées':d.visibleTo.length+' membre(s)'}</p></div></Panel>)}<PillButton onClick={()=>launch('new-document',{type:'Autre',visibleTo:data.viewerId})}><Plus size={17}/>Ajouter une fiche document</PillButton><p className="text-xs text-[#897D97]">Aucun fichier n’est chargé ou hébergé par ce prototype ; il stocke uniquement des métadonnées locales.</p></>}
     {route==='trip'&&<><Panel className="p-5 space-y-3"><div className="text-4xl">🌍</div><h2 className="text-[21px] font-extrabold">Voyagez en famille</h2><p className="text-xs text-[#867A92]">Le Leader et les Co-leaders peuvent réserver pour les membres, dont les enfants. Simulation sans connexion à Simple Trip.</p></Panel>{family.bookings.map(b=><Panel key={b.id} className="p-4"><div className="flex gap-3"><Plane size={20} className="text-[#7432DF]"/><div><p className="text-sm font-bold">{b.destination}</p><p className="text-xs text-[#877A96]">{initialsFor(b.travelerId)} · {dateFor(b.date)}</p></div></div></Panel>)}{admin&&<PillButton onClick={()=>launch('new-trip',{traveler:data.viewerId,date:'2027-07-15'})}>Simuler une réservation <ArrowRight size={15}/></PillButton>}{!admin&&<p className="text-xs text-[#897D96]">Seul un Leader ou Co-leader peut réserver pour un membre de la famille.</p>}</>}
     {route==='loyalty'&&<><Panel className="p-6 text-center bg-gradient-to-br from-[#4A1A94] to-[#7A37E9] text-white border-none"><Gift size={31} className="mx-auto"/><p className="text-sm text-white/75 mt-3">Fidélité Famille</p><p className="text-[38px] font-extrabold mt-1">{family.loyaltyPoints.toLocaleString('fr-FR')}</p><p className="text-sm">Points illustratifs</p></Panel><Panel className="px-4"><ActionLine icon={CreditCard} title="Paiements éligibles" subtitle="Points selon le barème métier à valider"/><ActionLine icon={Target} title="Objectifs atteints" subtitle="Possibles bonus de fidélité"/><ActionLine icon={Sparkles} title="Défis familiaux" subtitle="Éligibilité et récompenses à définir"/></Panel><p className="text-xs text-[#8A7D95]">Les règles de calcul sont fictives. Les virements entre membres et les contributions ne génèrent pas de points dans le cadrage.</p></>}
     {route==='loan'&&<><Panel className="p-5"><h2 className="text-xl font-extrabold">Demander un crédit</h2><p className="text-xs text-[#867991] mt-2">Chaque membre peut initier une demande. Les comptes associés dépendent de son rôle ; les avantages conjoints sont soumis à vérification.</p></Panel>{family.creditRequests.filter(req=>req.applicantId===data.viewerId||admin).map(req=><Panel key={req.id} className="p-4"><Tag tone="amber">{req.status}</Tag><p className="text-base font-extrabold mt-2">{currency(req.amount)}</p><p className="text-xs text-[#857A94]">Demande fictive · {initialsFor(req.applicantId)}</p></Panel>)}<PillButton onClick={()=>launch('new-credit',{account:`simple:${data.viewerId}`})}>Simuler une demande <ArrowRight size={16}/></PillButton>{family.members.some(m=>m.role==='coleader'&&m.relation==='Conjoint')&&<Panel className="p-4 space-y-1"><p className="text-sm font-bold">Avantages conjoints</p><p className="text-xs text-[#85788F]">Le cadrage prévoit l’héritage de conventions éligibles entre conjoints vérifiés. Aucune convention, taux ou éligibilité n’est inventé dans cette démonstration.</p></Panel>}<p className="text-xs text-[#887C95]">Aucun scoring ni vérification bancaire ; ce formulaire ne constitue pas une demande réelle.</p></>}

     {route==='pfm'&&<>
       <Panel className="p-5 space-y-2"><span className="text-[11px] text-[#7F36E2] font-extrabold">APERÇU PFM · DISTINCT</span><h2 className="text-[21px] font-extrabold">Comprendre les finances de {family.name.toLowerCase()}</h2><p className="text-xs text-[#8A8096]">Une lecture financière des données autorisées ; les comptes et droits restent gérés dans Ma famille.</p></Panel>
       <div className="grid grid-cols-2 gap-3"><Panel className="p-4"><p className="text-xs text-[#857995]">Dépenses illustratives</p><p className="text-lg font-extrabold text-[#E18A4E] mt-2">{canViewFamilyAccount?currency(Math.abs(family.transactions.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0))):'Non autorisé'}</p></Panel><Panel className="p-4"><p className="text-xs text-[#857995]">Épargne en cours</p><p className="text-lg font-extrabold text-[#19A57C] mt-2">{currency(visibleGoals.filter(g=>g.status==='active').reduce((s,g)=>s+g.balance,0))}</p></Panel></div>
       <Panel className="p-4"><Heading title="Dépenses par catégorie"/>{!canViewFamilyAccount&&<p className="text-xs text-[#8D819B]">Vous n’avez pas l’autorisation de consulter les opérations de ce compte.</p>}{[...new Set((canViewFamilyAccount?family.transactions:[]).filter(t=>t.amount<0).map(t=>t.category))].map(category=>{const spend=Math.abs(family.transactions.filter(t=>t.category===category&&t.amount<0).reduce((s,t)=>s+t.amount,0));const total=Math.abs(family.transactions.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0));return <div key={category} className="mb-4"><div className="flex justify-between text-xs mb-1.5"><span>{category}</span><strong>{currency(spend)}</strong></div><Progress value={spend} total={total}/></div>})}</Panel>
       <Panel className="p-4 space-y-2"><p className="text-sm font-bold">Vos objectifs familiaux</p>{visibleGoals.filter(g=>g.status==='active').map(g=><button key={g.id} onClick={()=>navigateToGoal(g.id)} className="flex justify-between w-full text-xs py-2"><span>{g.title}</span><strong className="text-[#7A32E0]">{Math.round(g.balance/g.target*100)} %</strong></button>)}</Panel>
       <div className="rounded-[22px] bg-[#EFE7FC] p-4"><p className="text-[12px] text-[#75698E]">Ici, la passerelle est une prévisualisation : le véritable parcours « Mon foyer » reste dans le prototype PFM original, séparé de ce code.</p></div>
     </>}

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
    className="absolute z-[45] overflow-y-auto rounded-[18px] border border-[#EAE0F7] bg-white p-2.5 shadow-[0_16px_38px_rgba(36,16,81,0.24)] text-[#251838]">
    <p className="px-2.5 pb-2 pt-1 text-[12px] font-extrabold text-[#655674]">Mes familles</p>
    <div className="space-y-1">
     {data.families.map(f=><button type="button" role="menuitemradio" aria-checked={f.id===family.id} key={f.id} onClick={()=>switchFamily(f.id)}
      className={'w-full rounded-xl px-3 py-2.5 flex items-center gap-2.5 text-left border transition-colors hover:bg-[#F5EEFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7430DD] '+(f.id===family.id?'border-[#CFB8FA] bg-[#F2EBFF]':'border-transparent bg-white')}>
      <span className="text-xl shrink-0">{f.emoji}</span>
      <span className="flex-1 min-w-0"><span className="block text-[12px] font-bold truncate">{f.name}</span><span className="block text-[10px] text-[#817494]">{f.members.length} membre{f.members.length>1?'s':''}</span></span>
      {f.id===family.id&&<Check size={16} className="text-[#6225DB] shrink-0"/>}
     </button>)}
    </div>
    <div className="my-2 border-t border-[#EDE7F6]"/>
    <button type="button" role="menuitem" onClick={()=>{setSelectorOpen(false);launch('new-family',{openAccount:'false',emoji:'💜'})}}
     className="w-full rounded-xl px-3 py-2.5 flex items-center gap-2.5 text-left text-[12px] font-bold text-[#6428D1] transition-colors hover:bg-[#F5EEFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7430DD]">
     <Plus size={17} className="shrink-0"/> Créer une famille
    </button>
    <button type="button" role="menuitem" onClick={()=>{setSelectorOpen(false);launch('join-family')}}
     className="w-full rounded-xl px-3 py-2.5 flex items-center gap-2.5 text-left text-[12px] font-bold text-[#6428D1] transition-colors hover:bg-[#F5EEFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7430DD]">
     <UserPlus size={17} className="shrink-0"/> Rejoindre une famille
    </button>
   </div>,
   document.getElementById('simple-device-frame')!
  )}
  {route==='chat' && document.getElementById('simple-chat-composer-slot') && createPortal(
      <div className="bg-white/95 backdrop-blur-md border-t border-[#ECE6F6] shadow-[0_-8px_26px_rgba(35,18,70,0.05)] px-5 pt-3 pb-5">
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
   {modal&&createPortal(<div className="absolute inset-0 z-50 flex flex-col justify-end bg-[#1C1234]/45 backdrop-blur-[2px]" onClick={close}>
    <div onClick={e=>e.stopPropagation()} className="max-h-[94%] min-h-[240px] overflow-y-auto no-scrollbar bg-white rounded-t-[32px] shadow-2xl px-5 pt-3 pb-7">
      <div className="w-12 h-1 rounded-full bg-[#DAD3E6] mx-auto mb-5"/>
      <div className="flex items-start justify-between gap-2 mb-4"><div><h3 className="text-[19px] font-extrabold">{({
       'new-family':'Créer ma famille','join-family':'Rejoindre une famille','invite':'Inviter un membre','rename':'Personnaliser ma famille','open-account':'Créer un sous-compte Famille',
       'open-joint':'Ouvrir un compte joint','transfer':'Effectuer un virement','simple-pay':'Simple Pay Famille','pay-bill':'Payer une facture','create-card':'Nouvelle carte virtuelle',
       'new-goal':'Nouvel objectif d’épargne','goal-deposit':'Contribuer à l’objectif','goal-withdraw':'Retirer de l’épargne','goal-delete':'Supprimer l’objectif',
       'goal-schedule':'Programmer une contribution','new-pot':'Créer une cagnotte','pot-deposit':'Participer à la cagnotte','new-document':'Ajouter un document',
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
       {(modal==='pay-bill'||modal==='simple-pay')&&<><SelectInput label="Compte à débiter" value={form.from||transferOptions[0]?.value} onChange={v=>setField('from',v)} options={transferOptions.filter(o=>modal==='pay-bill'||o.value==='account')}/><Input label={modal==='simple-pay'?'Destinataire':'Organisme / facture'} value={form.beneficiary} onChange={v=>setField('beneficiary',v)} placeholder={modal==='simple-pay'?'Bénéficiaire':'Électricité, Internet…'}/><Input label="Montant (DH)" type="number" min="0.01" value={form.amount} onChange={v=>setField('amount',v)}/></>}
       {modal==='create-card'&&<><Input label="Nom de la carte" value={form.label} onChange={v=>setField('label',v)} placeholder="Carte courses"/><SelectInput label="Compte ou pocket associé" value={form.source} onChange={v=>setField('source',v)} options={[...(family?.account?[{value:'family',label:'Sous-compte Famille'}]:[]),...(family?.joint?[{value:'joint',label:'Compte joint'}]:[]),...(family?.pockets||[]).map(p=>({value:`pocket:${p.ownerId}`,label:`Pocket ${initialsFor(p.ownerId)}`}))]}/><SelectInput label="Titulaire de la carte" value={form.holder} onChange={v=>setField('holder',v)} options={memberOptions}/></>}
       {modal==='new-goal'&&<><Input label="Nom de l’objectif" value={form.title} onChange={v=>setField('title',v)} placeholder="Vacances, études…" required/><Input label="Montant cible (DH)" type="number" min="1" value={form.target} onChange={v=>setField('target',v)}/><Input label="Date de fin" type="date" min={nowDate()} value={form.deadline} onChange={v=>setField('deadline',v)}/><SelectInput label="Bénéficiaire / propriétaire" value={form.owner||data.viewerId} onChange={v=>setField('owner',v)} options={admin?memberOptions:memberOptions.filter(x=>x.value===data.viewerId)}/><div><p className="text-xs font-bold text-[#56466A] mb-2">Membres autorisés à contribuer</p><div className="space-y-2">{family?.members.map(m=><label key={m.id} className="flex items-center gap-2 p-2 rounded-xl bg-[#FAF8FE] text-[12px]"><input type="checkbox" className="accent-[#762ADC]" checked={(form.contributors||'').split(',').includes(m.id)} onChange={e=>{const s=new Set((form.contributors||'').split(',').filter(Boolean));if(e.target.checked)s.add(m.id);else s.delete(m.id);setField('contributors',[...s].join(','))}}/>{m.name}</label>)}</div></div></>}
       {(modal==='goal-deposit'||modal==='goal-withdraw'||modal==='pot-deposit'||modal==='goal-schedule'||modal==='limit')&&<><Input label={modal==='goal-schedule'?'Montant mensuel (DH)':modal==='limit'?'Nouveau plafond (DH)':'Montant (DH)'} type="number" min="0" value={form.amount} onChange={v=>setField('amount',v)} placeholder="Ex. 500"/><p className="text-xs text-[#847992]">{modal==='goal-schedule'?'Paramètre indicatif uniquement : pas de virement programmé réel.':modal==='limit'?'Plafond indicatif de démonstration.':`Disponible sur votre compte Simple fictif : ${currency(viewer?.simpleBalance||0)}.`}</p></>}
       {modal==='new-pot'&&<><Input label="Nom de la cagnotte" value={form.title} onChange={v=>setField('title',v)} placeholder="Anniversaire, sortie…"/><Input label="Objectif (DH)" value={form.target} onChange={v=>setField('target',v)} type="number" min="1"/><p className="text-[11px] text-[#867A90]">Participation démonstrative uniquement ; règles Famille à confirmer.</p></>}
       {modal==='new-document'&&<><Input label="Titre du document" value={form.title} onChange={v=>setField('title',v)} placeholder="Assurance, attestation…"/><SelectInput label="Type" value={form.type||'Autre'} onChange={v=>setField('type',v)} options={['Autre','Assurance','Identité','Scolarité','Logement'].map(x=>({value:x,label:x}))}/><Input label="Date d’expiration (facultative)" type="date" value={form.expiry} onChange={v=>setField('expiry',v)}/><p className="text-xs font-bold">Personnes autorisées</p>{family?.members.map(m=><label key={m.id} className="flex items-center gap-2 text-xs"><input type="checkbox" className="accent-[#722DDD]" checked={(form.visibleTo||'').split(',').includes(m.id)} onChange={e=>{const s=new Set((form.visibleTo||'').split(',').filter(Boolean));e.target.checked?s.add(m.id):s.delete(m.id);setField('visibleTo',[...s].join(','))}}/>{m.name}</label>)}<p className="text-[11px] text-[#83768F]">Ce prototype ne stocke pas les fichiers eux-mêmes.</p></>}
       {modal==='new-trip'&&<><SelectInput label="Voyageur" value={form.traveler||data.viewerId} onChange={v=>setField('traveler',v)} options={memberOptions}/><Input label="Destination" value={form.destination} onChange={v=>setField('destination',v)} placeholder="Marrakech…"/><Input label="Date" type="date" value={form.date} onChange={v=>setField('date',v)}/><Input label="Budget indicatif (DH)" value={form.amount} onChange={v=>setField('amount',v)} type="number"/></>}
       {modal==='new-credit'&&<><Input label="Montant souhaité (DH)" value={form.amount} onChange={v=>setField('amount',v)} type="number" min="1"/><SelectInput label="Compte associé" value={form.account||`simple:${data.viewerId}`} onChange={v=>setField('account',v)} options={[{value:`simple:${data.viewerId}`,label:'Mon compte Simple'},...(admin&&family?.account?[{value:'account',label:'Sous-compte Famille'}]:[]),...(admin&&family?.joint?[{value:'joint',label:'Compte joint'}]:[])]}/><p className="text-xs text-[#867991]">Aucune demande bancaire réelle ne sera transmise.</p></>}
       {(modal==='goal-delete'||modal==='member-delete'||modal==='family-delete')&&<div className="bg-[#FFF4F7] p-4 rounded-2xl"><p className="text-[13px] text-[#A13F66] font-semibold">Cette action modifie les données locales du prototype.</p><p className="text-[11px] text-[#94667B] mt-1">{modal==='member-delete'?'Le pocket du membre sera clôturé.':modal==='goal-delete'?'Le solde de l’épargne active sera simulé comme reversé au propriétaire.':'La famille disparaîtra de cette démonstration.'}</p></div>}
       {error&&<p role="alert" className="text-xs text-[#BE3463] bg-[#FFF0F4] rounded-xl px-3 py-2">{error}</p>}
       <button type="submit" className="btn-simple-primary w-full h-12 text-sm font-bold flex gap-2 items-center justify-center">{modal==='member-delete'||modal==='family-delete'||modal==='goal-delete'?'Confirmer la suppression':modal==='open-account'||modal==='open-joint'?'Confirmer l’ouverture':'Continuer'} <ArrowRight size={17}/></button>
       <button type="button" onClick={close} className="w-full text-xs font-bold py-2 text-[#8B7F98]">Annuler</button>
      </form>}
    </div>
   </div>, document.getElementById('simple-device-frame') ?? document.body)}
 </div>;
}
