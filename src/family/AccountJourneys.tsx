import React, { useState } from 'react';
import {
  ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, CheckCircle2, ChevronRight,
  CreditCard, FileText, HeartHandshake, Landmark, LockKeyhole, Plus,
  ReceiptText, Send, Settings2, ShieldCheck, Users, WalletCards, XCircle, Eye,
  ArrowLeftRight, PiggyBank
} from 'lucide-react';
import { avatarFor, currency, findMember, moneyValid, roleLabel, today, uid, type Family, type FamilyCard, type Member } from './model';
import {
  canManageFamily, canOperateFamilyAccount, canOperateJointAccount,
  canViewJointAccount, canRequestJointAccount, canViewFamilyAccount,
  requiresDemoDualApproval
} from './permissions';
import lamiaAvatar from '../assets/images/lamia_avatar.jpg';
import karimAvatar from '../assets/images/karim.jpg';
import yasmineAvatar from '../assets/images/yasmine.jpg';
import familyPhoto from '../assets/images/family_photo.jpg';

type Kind = 'sub' | 'joint';
type Action = 'add' | 'transfer' | 'pay';
type View = 'overview' | 'intro' | 'sub-config' | 'approval' | 'coholder' | 'identity' | 'terms' | 'opening' | 'opening-success'
  | 'money' | 'review' | 'money-success' | 'history' | 'transaction'
  | 'members' | 'person' | 'cards' | 'card' | 'documents' | 'settings' | 'closure';
type Props = {
  kind: Kind; family: Family; viewerId: string; canViewSub: boolean;
  onUpdate: (fn:(family:Family)=>void)=>void;
  onHome:()=>void; onBack:()=>void; onToast:(message:string)=>void; onOpenMembers:()=>void;
};
export type AccountJourneyHandle = { goBack: () => boolean };
// Same tokens and avatar treatment as the other Ma famille screens.
const PersonAvatar = ({member,size=44}:{member?:Member;size?:number})=>{
 const src=member?({lamia:lamiaAvatar,karim:karimAvatar,yasmine:yasmineAvatar} as Record<string,string>)[avatarFor(member.id)]:undefined;
 return <span style={{width:size,height:size}} className="rounded-full border-2 border-white shadow-sm shrink-0 overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#DFCCFF] to-[#A68BEB] text-[#482096] font-extrabold">
   {src?<img src={src} alt="" className="w-full h-full object-cover"/>:<span style={{fontSize:Math.max(13,size*.32)}}>{member?.name?.slice(0,1)||'+'}</span>}
 </span>;
};
const AvatarStack=({members}:{members:Member[]})=><div className="flex -space-x-2.5 shrink-0">
 {members.slice(0,3).map(m=><PersonAvatar key={m.id} member={m} size={35}/>)}
 </div>;
const Button = ({children,onClick,secondary=false,disabled=false}:{
 children:React.ReactNode;onClick:()=>void;secondary?:boolean;disabled?:boolean;
})=><button type="button" disabled={disabled} onClick={onClick} className={
 (secondary?'bg-[#F0EAFC] text-[#6225CE] border border-[#E5D8FA]':'btn-simple-primary text-white')+
 ' w-full rounded-full min-h-[46px] px-4 text-[13px] font-bold inline-flex justify-center items-center gap-2 transition hover:brightness-105 active:scale-[0.985] disabled:opacity-40 disabled:cursor-not-allowed'
}>{children}</button>;
const Card=({children,className=''}:{children:React.ReactNode;className?:string})=>
 <section className={'card-simple p-4 '+className}>{children}</section>;
const SectionHead=({title,action}:{title:string;action?:React.ReactNode})=>
 <div className="flex justify-between items-center gap-2 px-1 mb-3">
  <h3 className="text-[17px] font-extrabold leading-tight text-[#211535]">{title}</h3>{action}
 </div>;
const Row=({icon:Icon,title,caption,onClick,avatar,trailing}:{
 icon:React.ComponentType<{size?:number;className?:string}>;title:string;caption?:string;onClick:()=>void;avatar?:Member;trailing?:React.ReactNode;
})=><button type="button" onClick={onClick} className="flex w-full gap-3 py-3.5 items-center text-left border-b border-[#F1EDF7] last:border-b-0 rounded-xl transition hover:bg-[#FAF7FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7C36DA]">
 {avatar?<PersonAvatar member={avatar} size={42}/>:<span className="w-10 h-10 shrink-0 bg-[#F2EAFE] text-[#702CD6] rounded-2xl flex items-center justify-center"><Icon size={19}/></span>}
 <span className="flex-1 min-w-0"><span className="text-[13px] block font-bold text-[#261737] truncate">{title}</span>
 {caption&&<span className="text-[11px] text-[#81758D] mt-1 block leading-snug">{caption}</span>}</span>
 {trailing||<ChevronRight size={16} className="text-[#9D91AB] shrink-0"/>}
 </button>;
const PersonTile=({member,label,onClick,selected=false}:{
 member?:Member;label:string;onClick?:()=>void;selected?:boolean;
})=>{
 const cls='flex items-center gap-3 p-3.5 w-full rounded-[19px] text-left border transition-colors '+(selected?'border-[#B990F9] bg-[#F3EBFF]':'border-[#EFE8F7] bg-white')+(onClick?' hover:border-[#B990F9] hover:bg-[#F9F5FF]':'');
 const inside=<><PersonAvatar member={member} size={46}/><span className="flex-1 min-w-0"><span className="text-[13px] font-extrabold block truncate">{member?.name||'Membre'}</span><span className="text-[11px] text-[#81758D] block mt-1">{label}</span></span>{selected?<Check size={18} className="text-[#702DD5] shrink-0"/>:onClick?<ChevronRight size={17} className="text-[#9D91AB] shrink-0"/>:null}</>;
 return onClick?<button type="button" onClick={onClick} className={cls}>{inside}</button>:<div className={cls}>{inside}</div>;
};
const BankCard=({card,holder,label}:{card:FamilyCard;holder?:Member;label:string})=>
 <div className="rounded-[23px] p-5 min-h-[177px] text-white bg-gradient-to-br from-[#2E0B69] via-[#5016A5] to-[#7436E4] shadow-[0_11px_24px_rgba(85,30,173,0.19)]">
  <div className="flex items-center justify-between text-[12px] font-bold"><span>Simple <span className="text-white/75 font-medium">{label}</span></span><CreditCard size={22} className="text-white/85"/></div>
  <p className="mt-8 text-[17px] font-mono tracking-[.12em]">•••• •••• •••• {card.last4}</p>
  <div className="flex items-center justify-between mt-4 gap-2 text-[11px]">
   <div className="flex items-center gap-2 min-w-0"><PersonAvatar member={holder} size={29}/><span className="font-bold truncate">{holder?.name||'Membre'}</span></div>
   <span className="rounded-full bg-white/15 border border-white/25 px-2 py-1 shrink-0">{card.active?'Active':'Suspendue'}</span>
  </div>
 </div>;
const Field = ({label,value,onChange,children}:{
  label:string;value:string;onChange:(v:string)=>void;children?:React.ReactNode;
})=><label className="block space-y-1.5"><span className="text-[12px] font-bold text-[#514365]">{label}</span>
  <input type="number" min="0" inputMode="decimal" value={value} onChange={e=>onChange(e.target.value)}
    className="w-full h-12 bg-[#F8F5FE] border border-[#E5DBF3] rounded-2xl px-4 outline-none focus:ring-2 focus:ring-[#C7ABFA] text-[14px]"/>
  {children}</label>;
const Notes = ({children}:{children:React.ReactNode})=><p className="text-[11px] leading-relaxed text-[#84758F]">{children}</p>;
const LinkBack = ({onClick}:{onClick:()=>void})=><button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#6B2AD2] hover:underline"><ArrowLeft size={15}/> Retour</button>;
function accountBalance(f:Family,source:string) {
 if(source==='account')return f.account?.balance;
 if(source==='joint')return f.joint?.balance;
 if(source.startsWith('simple:'))return findMember(f,source.slice(7))?.simpleBalance;
 if(source.startsWith('pocket:'))return f.pockets.find(p=>p.ownerId===source.slice(7))?.balance;
 return undefined;
}
function adjustBalance(f:Family,source:string,delta:number) {
 if(source==='account'&&f.account)f.account.balance+=delta;
 else if(source==='joint'&&f.joint)f.joint.balance+=delta;
 else if(source.startsWith('simple:')){const m=findMember(f,source.slice(7));if(m)m.simpleBalance+=delta;}
 else if(source.startsWith('pocket:')){const p=f.pockets.find(item=>item.ownerId===source.slice(7));if(p)p.balance+=delta;}
}
export const AccountJourneys = React.forwardRef<AccountJourneyHandle,Props>(function AccountJourneys({kind,family,viewerId,canViewSub,onUpdate,onHome,onBack,onToast,onOpenMembers},ref){
 const viewer=findMember(family,viewerId);
 const admin=canManageFamily(family,viewerId);
 const coholders=family.jointHolderIds||[];
 const jointOwner=canViewJointAccount(family,viewerId);
 const canRequestJoint=canRequestJointAccount(family,viewerId);
 const authorized=kind==='sub'?canOperateFamilyAccount(family,viewerId):canOperateJointAccount(family,viewerId);
 const account=kind==='sub'?family.account:family.joint;
 const title=kind==='sub'?'Sous-compte Famille':'Compte joint';
 const initialView:View=kind==='sub'?(family.account?'overview':'intro'):(family.joint?'overview':family.jointApplication?'opening':'intro');
 const [view,setView]=useState<View>(initialView);
 const [trail,setTrail]=useState<View[]>([]);
 const [action,setAction]=useState<Action>('add');
 const [amount,setAmount]=useState('');
 const [destination,setDestination]=useState('');
 const [beneficiary,setBeneficiary]=useState('Facture familiale');
 const [selectedTransaction,setSelectedTransaction]=useState<string|null>(null);
 const [selectedMember,setSelectedMember]=useState(viewerId);
 const [selectedCard,setSelectedCard]=useState<string|null>(null);
 const [historyFilter,setHistoryFilter]=useState('all');
 const [limit,setLimit]=useState(String(account?.limit||9000));
 const [openingHolder,setOpeningHolder]=useState('');
 const [termsAccepted,setTermsAccepted]=useState(false);
 const [firstSignature,setFirstSignature]=useState(false);
 const [subAccess,setSubAccess]=useState<string[]>(family.accountViewIds);
 const [approvalFirst,setApprovalFirst]=useState(false);
 const [approvalSecond,setApprovalSecond]=useState(false);
 const [closureAccepted,setClosureAccepted]=useState(false);
 const [closureSecondAccepted,setClosureSecondAccepted]=useState(false);
 const [notice,setNotice]=useState('');
 const [notifications,setNotifications]=useState(true);
 const scrollTop=()=>{const el=document.getElementById('simple-scroll-area');if(el)el.scrollTop=0;};
 const jump=(next:View)=>{setTrail(prev=>[...prev,view]);setView(next);setNotice('');scrollTop();};
 // The inner breadcrumb is authoritative while navigating through account steps.
 // Returning false lets the parent go back to the screen that opened this account.
 const goBack=():boolean=>{
  if(!trail.length)return false;
  setView(trail[trail.length-1]);
  setTrail(current=>current.slice(0,-1));
  setNotice('');
  scrollTop();
  return true;
 };
 React.useImperativeHandle(ref,()=>({goBack}));
 const previous=()=>{if(!goBack())onBack();};
 const root=()=>{setTrail([]);setView('overview');setNotice('');scrollTop();};
 const begin=(type:Action)=>{setAction(type);setAmount('');setBeneficiary('Facture familiale');setDestination('');setApprovalFirst(false);setApprovalSecond(false);jump('money');};
 const membersEligible=family.members.filter(m=>m.id!==viewerId&&!m.simpleOne&&
   (m.relation==='Moi'||m.relation==='Conjoint') && m.relation!==viewer?.relation &&
   canManageFamily(family,m.id));
 const application=family.jointApplication;
 const readable=kind==='sub'?(canViewSub&&canViewFamilyAccount(family,viewerId)):jointOwner;
 const bankKey=kind==='sub'?'account':'joint';
 const source=action==='add'?'simple:'+viewerId:bankKey;
 const subTargets=family.pockets.filter(p=>admin||p.ownerId===viewerId).map(p=>({value:'pocket:'+p.ownerId,label:'Pocket '+(findMember(family,p.ownerId)?.name||'Membre')}));
 const targets=kind==='sub'?[...subTargets,{value:'simple:'+viewerId,label:'Mon compte Simple'}]:
  [{value:'simple:'+viewerId,label:'Mon compte Simple'},...(admin&&family.account?[{value:'account',label:'Sous-compte Famille'}]:[])];
 const dest=action==='add'?bankKey:action==='pay'?'external':destination||targets[0]?.value||'';
 const sourceBalance=accountBalance(family,source)||0;
 const amountValue=Number(amount.replace(',','.'));
 const validAmount=Number.isFinite(amountValue)&&moneyValid(amountValue);
 const canSubmit=authorized&&validAmount&&sourceBalance>=amountValue&&Boolean(dest);
 const needsDemoApproval=action!=='add'&&validAmount&&requiresDemoDualApproval(family,kind==='sub'?'account':'joint',amountValue);
 const approvalNames=(kind==='sub'?family.members.filter(m=>m.role==='leader'||m.role==='coleader'):family.members.filter(m=>coholders.includes(m.id))).slice(0,2).map(m=>m.name);
 const linkedCards=family.cards.filter(c=>kind==='sub'?['family','account',family.account?.id].includes(c.source):['joint',family.joint?.id].includes(c.source));
 const transactions=family.transactions.filter(t=>kind==='sub'?
  ['account','family','Sous-compte Famille'].includes(t.source)||['account','family','Sous-compte Famille'].includes(t.target):
  ['joint','Compte joint'].includes(t.source)||['joint','Compte joint'].includes(t.target));
 const filteredTransactions=historyFilter==='all'?transactions:transactions.filter(t=>t.category===historyFilter);
 const tx=transactions.find(t=>t.id===selectedTransaction);
 const selectedCardItem=linkedCards.find(c=>c.id===selectedCard);
 const hasPendingClosure=linkedCards.some(c=>c.active)||Boolean(account&&account.balance!==0);

 function commitMoney(){
  if(!authorized||!validAmount||!dest||sourceBalance<amountValue||(needsDemoApproval&&(!approvalFirst||!approvalSecond))){setNotice('Vérifiez le montant, le solde et vos autorisations.');return;}
  onUpdate(f=>{
   if((accountBalance(f,source)||0)<amountValue)return;
   adjustBalance(f,source,-amountValue);
   if(dest!=='external')adjustBalance(f,dest,amountValue);
   const description=action==='add'?'Alimentation '+title:action==='transfer'?'Virement '+title:'Paiement · '+beneficiary;
   f.transactions.unshift({id:uid('tx'),date:today(),title:description,amount:action==='add'?amountValue:-amountValue,
    category:action==='pay'?'Factures':'Transferts',source:action==='add'?source:bankKey,target:dest});
  });
  jump('money-success');onToast('Opération fictive enregistrée.');
 }
 function requestJoint(){
  if(!canRequestJoint||!openingHolder||!termsAccepted||!firstSignature)return;
  onUpdate(f=>{f.jointApplication={status:'awaiting',requesterId:viewerId,coHolderId:openingHolder};});
  jump('opening');onToast('Demande fictive envoyée au deuxième cotitulaire.');
 }
 function respondJoint(accepted:boolean){
  if(!application||application.status!=='awaiting')return;
  onUpdate(f=>{if(f.jointApplication)f.jointApplication.status=accepted?'review':'rejected';});
  onToast(accepted?'Accord fictif du deuxième cotitulaire enregistré.':'Demande refusée dans la simulation.');
 }
 function activateJoint(){
  if(!application||application.status!=='review')return;
  onUpdate(f=>{
   const a=f.jointApplication;
   if(!a||a.status!=='review')return;
   f.joint={id:uid('joint'),label:'Compte joint',balance:0,limit:9000};
   f.jointHolderIds=[a.requesterId,a.coHolderId];
   f.jointApplication=null;
  });
  jump('opening-success');onToast('Compte joint ouvert (simulation).');
 }
 function createSub(){
  if(!admin||family.account)return;
  onUpdate(f=>{f.account={id:uid('account'),label:'Sous-compte Famille',balance:0,limit:9000};f.accountViewIds=[...new Set([...f.members.filter(m=>m.role==='leader'||m.role==='coleader').map(m=>m.id),...subAccess])];});
  jump('opening-success');onToast('Sous-compte créé (simulation).');
 }
 function newCard(){
  if(!authorized)return;
  onUpdate(f=>f.cards.push({id:uid('card'),label:'Carte '+(kind==='sub'?'Famille':'joint'),last4:'••••',
   source:bankKey,holderId:viewerId,active:true}));
  onToast('Carte fictive ajoutée. Aucun moyen de paiement réel créé.');
 }
 const MiniHead=({heading,desc}:{heading:string;desc?:string})=><div className="space-y-2 px-1">
  <LinkBack onClick={previous}/><h2 className="font-extrabold text-[19px] text-[#251635] leading-tight">{heading}</h2>
  {desc&&<Notes>{desc}</Notes>}</div>;
 const nextLabel=action==='add'?'Alimenter':action==='transfer'?'Transférer':'Payer';
 const jointPeople=coholders.map(id=>findMember(family,id)?.name||'Cotitulaire').join(' & ');
 return <div className="space-y-4 pb-5 text-[#251635]">
  {view==='overview'&&account&&<>
   <div className="relative overflow-hidden rounded-[28px] p-5 bg-gradient-to-br from-[#32106E] via-[#5416A9] to-[#7837E5] text-white shadow-[0_12px_30px_rgba(74,26,148,0.20)]">
    <div className="flex items-start justify-between gap-3">
     <div className="flex items-center gap-2 text-white/90 font-bold text-[12px]">
      {kind==='sub'?<Landmark size={19}/>:<HeartHandshake size={19}/>} {title}
     </div>
     <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[10px] font-bold">Actif</span>
    </div>
    <p className="mt-7 text-[11px] text-white/70">Solde disponible</p>
    <p className="mt-1 text-[31px] tracking-tight font-extrabold tabular-nums">{readable?currency(account.balance):'Solde masqué'}</p>
    <div className="flex items-center justify-between gap-3 mt-6">
     <div className="min-w-0">
      <p className="text-[12px] font-bold">{kind==='sub'?'Dépenses communes':'Compte partagé à deux'}</p>
      <p className="text-[11px] text-white/70 mt-1">{kind==='sub'?family.name:jointPeople}</p>
     </div>
     <AvatarStack members={kind==='sub'?family.members:family.members.filter(m=>coholders.includes(m.id))}/>
    </div>
   </div>
   <div className="grid grid-cols-3 gap-2.5">
    {[{type:'add' as Action,label:'Alimenter',Icon:Plus},{type:'transfer' as Action,label:'Transférer',Icon:ArrowLeftRight},{type:'pay' as Action,label:'Payer',Icon:ReceiptText}].map(item=>
     <button key={item.type} type="button" disabled={!authorized} onClick={()=>begin(item.type)}
      className="card-simple min-h-[90px] flex flex-col gap-2 items-center justify-center p-3 text-[#732ADC] hover:border-[#CBB8EE] hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed">
      <span className="rounded-2xl p-2.5 bg-[#F1E8FF] flex items-center justify-center"><item.Icon size={20}/></span>
      <span className="text-[11px] font-bold text-[#45365C]">{item.label}</span>
     </button>)}
   </div>
   {!authorized&&<Notes>{kind==='sub'?'Les opérations sont réservées aux membres disposant des droits de gestion.':'Seuls les cotitulaires peuvent effectuer les opérations sur ce compte.'}</Notes>}
   <section>
    <SectionHead title="Opérations récentes" action={<button type="button" onClick={()=>jump('history')} className="text-[12px] text-[#6D28DB] font-bold inline-flex items-center gap-1">Voir tout <ChevronRight size={15}/></button>}/>
    <Card className="px-4 py-1">
     {readable&&transactions.length?transactions.slice(0,3).map(t=><Row key={t.id} icon={t.amount>=0?ArrowDownLeft:ReceiptText} title={t.title} caption={t.date+' · '+t.category}
      trailing={<span className={'font-extrabold text-[12px] shrink-0 '+(t.amount>=0?'text-[#1F966D]':'text-[#302040]')}>{t.amount>0?'+':''}{currency(t.amount)}</span>}
      onClick={()=>{setSelectedTransaction(t.id);jump('transaction');}}/>):
      <div className="py-4 text-center"><ReceiptText size={23} className="mx-auto text-[#9F80CF] mb-2"/><Notes>{readable?'Aucune opération sur ce compte.':'Historique non accessible avec ce profil.'}</Notes></div>}
    </Card>
   </section>
   <section>
    <SectionHead title={kind==='sub'?'Espace de gestion':'Gérer le compte joint'}/>
    <Card className="px-4 py-1">
     <Row icon={Users} title={kind==='sub'?'Membres & accès':'Cotitulaires & droits'}
      caption={kind==='sub'?family.members.length+' membres de la famille':jointPeople} onClick={()=>jump('members')}
      trailing={<span className="flex items-center gap-2"><AvatarStack members={kind==='sub'?family.members:family.members.filter(m=>coholders.includes(m.id))}/><ChevronRight size={16} className="text-[#9D91AB]"/></span>}/>
     <Row icon={CreditCard} title="Cartes associées" caption={linkedCards.length+' carte'+(linkedCards.length>1?'s':'')} onClick={()=>jump('cards')}/>
     {kind==='joint'&&<Row icon={FileText} title="RIB & documents" onClick={()=>jump('documents')}/>}
     <Row icon={Settings2} title="Paramètres du compte" onClick={()=>jump('settings')}/>
    </Card>
   </section>
   <Notes>Parcours de démonstration : aucune opération réelle ni ouverture bancaire n'est exécutée.</Notes>
  </>}
  {view==='intro'&&<>
   <div className="relative overflow-hidden min-h-[225px] rounded-[28px] shadow-[0_12px_34px_rgba(66,20,126,0.16)]">
    <img src={familyPhoto} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-center"/>
    <div className="absolute inset-0 bg-gradient-to-r from-[#25095D]/95 via-[#45117A]/85 to-[#38116F]/55"/>
    <div className="relative min-h-[225px] p-5 flex flex-col justify-between text-white">
     <div className="w-11 h-11 rounded-2xl border border-white/25 bg-white/15 flex items-center justify-center">
      {kind==='sub'?<Landmark size={23}/>:<HeartHandshake size={23}/>}
     </div>
     <div className="mt-7">
      <h2 className="text-[21px] font-extrabold leading-tight">{kind==='sub'?'Un espace pour vos dépenses communes':'Un compte à deux, pour vos projets communs'}</h2>
      <p className="text-[12px] text-white/80 leading-relaxed mt-2">{kind==='sub'?'Organisez vos dépenses familiales et adaptez les accès de vos proches.':'Partagez un compte bancaire avec votre conjoint, selon les droits et conditions de la banque.'}</p>
     </div>
    </div>
   </div>
   <Card className="p-4 space-y-3">
    <div className="flex items-center justify-between gap-3">
     <div><p className="font-extrabold text-[13px]">Votre famille</p><Notes>{family.members.length} membres · {family.name}</Notes></div>
     <AvatarStack members={family.members}/>
    </div>
    <div className="border-t border-[#F0EBF6]"/>
    <Row icon={Users} title={kind==='sub'?'Accès adaptés aux membres':'Deux cotitulaires distincts'} onClick={()=>onToast('Les droits seront définis lors de la configuration.')} />
    <Row icon={ShieldCheck} title="Autorisations et sécurité" onClick={()=>onToast('Les modalités bancaires restent à confirmer.')} />
    <Row icon={CreditCard} title="Cartes et paiements selon l'offre" onClick={()=>onToast('Fonctionnalité simulée, sous réserve des conditions bancaires.')} />
   </Card>
   {kind==='sub'?<Button disabled={!admin} onClick={()=>jump('sub-config')}>Créer mon sous-compte <ArrowRight size={16}/></Button>:
    <Button disabled={!canRequestJoint} onClick={()=>jump('coholder')}>Ouvrir un compte joint <ArrowRight size={16}/></Button>}
   <Notes>{kind==='joint'&&!canRequestJoint?'L’ouverture n’est pas accessible à ce profil dans le scénario. ':''}Offre, éligibilité, tarifs et conventions bancaires à valider. L'ouverture ici est uniquement simulée.</Notes>
  </>}
  {view==='sub-config'&&<>
   <MiniHead heading="Configurer votre sous-compte" desc="Choisissez qui pourra consulter le solde et l'historique du compte familial."/>
   <Card className="p-4">
    <SectionHead title="Accès des membres"/>
    <div className="space-y-2">
     {family.members.map(m=>{
      const locked=m.role==='leader'||m.role==='coleader';
      return <label key={m.id} className="flex items-center gap-3 p-3 rounded-[18px] border border-[#EEE7F8] bg-[#FCFAFF] cursor-pointer">
       <PersonAvatar member={m} size={43}/>
       <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold truncate">{m.name}</span>
        <span className="block text-[11px] mt-0.5 text-[#81758D]">{locked?'Accès de gestion':m.simpleOne?'Compte Simple One':'Consultation facultative'}</span>
       </span>
       <input aria-label={`Autoriser la consultation à ${m.name}`} type="checkbox" disabled={locked} checked={locked||subAccess.includes(m.id)}
        onChange={e=>setSubAccess(prev=>e.target.checked?[...new Set([...prev,m.id])]:prev.filter(id=>id!==m.id))}
        className="w-4 h-4 accent-[#772DDD] shrink-0"/>
      </label>;
     })}
    </div>
   </Card>
   <Card className="flex items-start gap-3 bg-[#F1EBFD] border-[#E1D2FA]">
    <ShieldCheck size={21} className="text-[#7230DA] shrink-0"/>
    <Notes>Autoriser la consultation ne donne pas le droit d'effectuer des paiements. Les opérations restent soumises aux droits de gestion.</Notes>
   </Card>
   <Button disabled={!admin} onClick={createSub}>Confirmer la création fictive <ArrowRight size={17}/></Button>
  </>}
  {view==='coholder'&&<>
   <MiniHead heading="Choisir votre cotitulaire" desc="Sélectionnez le membre adulte avec qui vous souhaitez ouvrir ce compte."/>
   <Card className="p-4 space-y-3">
    <SectionHead title="Membre éligible"/>
    {membersEligible.length?membersEligible.map(m=><PersonTile key={m.id} member={m}
      selected={openingHolder===m.id} label={m.relation+' · Compte Simple'}
      onClick={()=>setOpeningHolder(m.id)}/>):
     <div className="py-4 text-center"><Users size={23} className="text-[#7430D8] mx-auto mb-2"/><Notes>Aucun conjoint adulte éligible dans la famille.</Notes></div>}
   </Card>
   <Card className="flex items-start gap-3 bg-[#F3ECFF] border-[#E7DBFC]">
    <Users size={21} className="text-[#712BDA] shrink-0"/>
    <Notes>Le rôle de Leader ou Co-leader dans « Ma famille » ne remplace pas le statut bancaire de cotitulaire.</Notes>
   </Card>
   <Button disabled={!openingHolder} onClick={()=>jump('identity')}>Continuer <ArrowRight size={16}/></Button>
  </>}
  {view==='identity'&&<>
   <MiniHead heading="Vérifier les informations" desc="Retrouvez les deux personnes associées à la demande."/>
   <Card className="p-4 space-y-3">
    <div><p className="text-[11px] font-bold text-[#82718F] mb-2">Premier cotitulaire</p><PersonTile member={viewer} label="Demandeur · Vous"/></div>
    <div><p className="text-[11px] font-bold text-[#82718F] mb-2">Deuxième cotitulaire</p>
     <PersonTile member={findMember(family,openingHolder)} label="Conjoint · À confirmer"/></div>
   </Card>
   <Card className="flex gap-3 bg-[#F1EBFD] border-[#E1D2FA] items-start">
    <ShieldCheck size={20} className="text-[#742ADA] shrink-0"/>
    <Notes>Les informations sont fictives. Dans un parcours réel, l'identification et l'éligibilité des deux cotitulaires seront vérifiées par la banque.</Notes>
   </Card>
   <Button onClick={()=>jump('terms')}>Continuer <ArrowRight size={16}/></Button>
  </>}
  {view==='terms'&&<>
   <MiniHead heading="Conditions du compte joint" desc="Prenez connaissance des règles de fonctionnement avant de poursuivre."/>
   <Card className="p-4 space-y-4">
    <div className="flex items-center gap-3">
     <span className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[#F1E8FF] text-[#6F2BD7]"><FileText size={21}/></span>
     <div className="flex-1"><p className="font-extrabold text-[13px]">Convention du compte</p><Notes>Conditions illustratives à confirmer</Notes></div>
    </div>
    <div className="space-y-3 border-t border-[#F0EBF6] pt-4">
     {['Titularité et droits des deux parties','Modalités de fonctionnement du compte','Responsabilités contractuelles','Frais et documents selon la convention'].map(t=>
      <div key={t} className="flex items-start gap-2.5 text-[12px]"><CheckCircle2 size={17} className="text-[#7430DD] shrink-0"/><span>{t}</span></div>)}
    </div>
    <div className="rounded-[17px] bg-[#FFF7E8] p-3"><Notes>Ce contenu est une simulation UX et ne constitue pas une convention bancaire.</Notes></div>
   </Card>
   <Card className="p-4 space-y-3">
    <label className="flex items-start gap-3 text-[12px] leading-relaxed"><input type="checkbox" className="accent-[#712BDA] mt-1 w-4 h-4 shrink-0" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)}/>J'ai consulté la présentation fictive des conditions.</label>
    <div className="border-t border-[#EFE9F7]"/>
    <label className="flex items-start gap-3 text-[12px] leading-relaxed"><input type="checkbox" className="accent-[#712BDA] mt-1 w-4 h-4 shrink-0" checked={firstSignature} onChange={e=>setFirstSignature(e.target.checked)}/>Je confirme ma demande comme premier cotitulaire (simulation).</label>
   </Card>
   <Button disabled={!termsAccepted||!firstSignature} onClick={requestJoint}>Envoyer la demande à {findMember(family,openingHolder)?.name||'mon conjoint'} <Send size={16}/></Button>
  </>}
  {view==='opening'&&<>
   <MiniHead heading="Suivi de l'ouverture" desc="Suivez la demande et simulez les validations de chaque cotitulaire."/>
   <Card className="p-5 space-y-4">
    <div className="flex items-center justify-between gap-3">
     <div><p className="text-[11px] text-[#80738D]">Compte joint</p><h3 className="font-extrabold text-[17px] mt-1">Ouverture à deux</h3></div>
     <span className="w-11 h-11 rounded-2xl bg-[#F1E9FF] flex justify-center items-center text-[#7231D6]"><HeartHandshake size={22}/></span>
    </div>
    <div className="flex items-center gap-3 rounded-[18px] bg-[#F9F5FF] p-3">
     <AvatarStack members={family.members.filter(m=>m.id===application?.requesterId||m.id===application?.coHolderId)}/>
     <div className="min-w-0"><p className="font-bold text-[12px]">{findMember(family,application?.requesterId||'')?.name} & {findMember(family,application?.coHolderId||'')?.name}</p><Notes>Deux futurs cotitulaires</Notes></div>
    </div>
    <div className="border-t border-[#EFE9F7] pt-3 flex items-start gap-3">
     <span className={'w-9 h-9 rounded-full flex items-center justify-center shrink-0 '+(application?.status==='review'?'bg-[#E6F8EE] text-[#208965]':application?.status==='rejected'?'bg-[#FFF0F3] text-[#B34B6C]':'bg-[#FFF3E1] text-[#B77E22]')}>
      {application?.status==='review'?<Check size={18}/>:application?.status==='rejected'?<XCircle size={18}/>:<CalendarDays size={18}/>}</span>
     <div><p className="font-extrabold text-[13px]">{application?.status==='awaiting'?'En attente de confirmation':application?.status==='review'?'Les deux accords ont été simulés':application?.status==='rejected'?'Demande refusée':'Demande indisponible'}</p>
      <Notes>{application?.status==='awaiting'?'Le deuxième cotitulaire doit donner son accord.':application?.status==='review'?'La validation bancaire reste à simuler.':'Vous pouvez recommencer avec une nouvelle demande.'}</Notes></div>
    </div>
   </Card>
   {application?.status==='awaiting'&&<Card className="p-4 space-y-3">
    <PersonTile member={findMember(family,application.coHolderId)} label="Confirmation du deuxième cotitulaire"/>
    <Button onClick={()=>respondJoint(true)}>Simuler son accord <Check size={16}/></Button>
    <Button secondary onClick={()=>respondJoint(false)}>Simuler un refus <XCircle size={16}/></Button>
   </Card>}
   {application?.status==='review'&&<Card className="p-4 space-y-3">
    <Notes>Les deux accords fictifs sont obtenus. Les vérifications bancaires sont uniquement illustrées.</Notes>
    <Button onClick={activateJoint}>Simuler la validation bancaire <CheckCircle2 size={16}/></Button>
   </Card>}
   {application?.status==='rejected'&&<Button onClick={()=>{onUpdate(f=>{f.jointApplication=null;});setOpeningHolder('');setTermsAccepted(false);setFirstSignature(false);jump('coholder');}}>Nouvelle demande <ArrowRight size={16}/></Button>}
  </>}
  {view==='opening-success'&&<Card className="p-6 text-center space-y-4">
    <span className="w-[70px] h-[70px] flex items-center justify-center rounded-full bg-[#E8F8EF] text-[#20A77C] mx-auto"><CheckCircle2 size={39}/></span>
    <h2 className="text-[21px] font-extrabold">{kind==='sub'?'Sous-compte Famille créé !':'Compte joint ouvert !'}</h2>
    <div className="flex justify-center"><AvatarStack members={kind==='sub'?family.members:family.members.filter(m=>coholders.includes(m.id))}/></div>
    <Notes>Succès simulé. Aucun produit bancaire réel n'a été ouvert.</Notes>
    <Button onClick={root}>Accéder au compte <ArrowRight size={16}/></Button>
   </Card>}
  {view==='money'&&<>
   <MiniHead heading={nextLabel} desc={`Depuis ${title} · Opération fictive`}/>
   <Card className="p-4 space-y-4">
    <div className="flex items-center gap-3 p-3 rounded-[19px] bg-[#F7F2FF] border border-[#EDE3FA]">
     <span className="rounded-2xl bg-white w-11 h-11 shrink-0 flex items-center justify-center text-[#722DD8]">
      {action==='add'?<WalletCards size={22}/>:kind==='sub'?<Landmark size={22}/>:<HeartHandshake size={22}/>}
     </span>
     <div className="min-w-0"><Notes>Compte à débiter</Notes><p className="font-extrabold text-[13px] mt-1">{action==='add'?'Mon compte Simple':title}</p>
      <p className="text-[11px] text-[#776687] mt-1">Disponible : {currency(sourceBalance)}</p></div>
    </div>
    {action==='transfer'&&<>
     <label className="block space-y-2"><span className="font-bold text-[12px]">Envoyer à</span>
      <select value={dest} onChange={e=>setDestination(e.target.value)} className="w-full h-12 border border-[#E7DFF2] rounded-2xl bg-[#F9F6FF] px-3 text-[13px]">
       {targets.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
      </select></label>
     {dest.startsWith('pocket:')&&<PersonTile member={findMember(family,dest.slice(7))} label="Pocket familiale · Membre destinataire"/>}
    </>}
    {action==='pay'&&<label className="block space-y-2"><span className="font-bold text-[12px]">Bénéficiaire / facture</span>
     <input value={beneficiary} onChange={e=>setBeneficiary(e.target.value)}
      className="w-full h-12 border border-[#E4D9F4] rounded-2xl bg-[#F8F5FE] px-3 text-[13px] outline-none focus:ring-2 focus:ring-[#D4BCF6]"/></label>}
    <Field label="Montant (DH)" value={amount} onChange={setAmount}/>
    {validAmount&&amountValue>sourceBalance&&<p className="text-xs text-[#B4435C] bg-[#FFF1F4] p-2 rounded-lg">Solde insuffisant pour effectuer cette opération.</p>}
    {action==='pay'&&!beneficiary.trim()&&<p className="text-xs text-[#B4435C]">Ajoutez un bénéficiaire.</p>}
   </Card>
   <Button disabled={!canSubmit||(action==='pay'&&!beneficiary.trim())} onClick={()=>jump('review')}>Continuer <ArrowRight size={16}/></Button>
  </>}
  {view==='review'&&<>
   <MiniHead heading="Vérifier l'opération" desc="Contrôlez les informations avant de confirmer."/>
   <Card className="p-5 space-y-4">
    <div className="text-center py-2"><p className="text-[11px] text-[#81738F]">Montant de l'opération</p>
     <p className="text-[30px] mt-2 font-extrabold tracking-tight text-[#6C2ADD] tabular-nums">{currency(amountValue)}</p></div>
    <div className="border-t border-[#EEE8F5]"/>
    <div className="flex gap-3 items-center"><span className="w-9 h-9 bg-[#F1E8FF] rounded-xl flex justify-center items-center text-[#752EDC]"><WalletCards size={17}/></span>
     <div className="flex-1"><Notes>Depuis</Notes><p className="text-[13px] font-bold">{action==='add'?'Mon compte Simple':title}</p></div></div>
    <div className="flex gap-3 items-center"><span className="w-9 h-9 bg-[#F1E8FF] rounded-xl flex justify-center items-center text-[#752EDC]"><ArrowLeftRight size={17}/></span>
     <div className="flex-1"><Notes>Vers</Notes><p className="text-[13px] font-bold">{action==='pay'?beneficiary:dest==='account'?'Sous-compte Famille':dest==='joint'?'Compte joint':dest.startsWith('pocket:')?'Pocket '+findMember(family,dest.slice(7))?.name:dest.startsWith('simple:')?'Compte Simple':title}</p></div>
     {dest.startsWith('pocket:')&&<PersonAvatar member={findMember(family,dest.slice(7))} size={35}/>}
    </div>
   </Card>
   <Card className="flex gap-3 items-start bg-[#F3EDFE] border-[#E3D7FA]">
    <ShieldCheck size={20} className="text-[#722ADA] shrink-0"/>
    <Notes>{needsDemoApproval?'Cette opération demandera deux accords fictifs.':'Une validation de sécurité pourra être nécessaire selon les règles bancaires.'}</Notes>
   </Card>
   {notice&&<p className="text-[12px] text-[#B4435C]">{notice}</p>}
   <Button disabled={!canSubmit} onClick={()=>needsDemoApproval?jump('approval'):commitMoney()}>Confirmer (simulation) <Check size={17}/></Button>
  </>}
  {view==='approval'&&<>
    <MiniHead heading="Double validation" desc="Simulation de l'approbation renforcée d'une opération importante."/>
    <Card className="p-5 space-y-4">
     <div className="text-center border-b border-[#EEE7F6] pb-4"><ShieldCheck size={30} className="mx-auto text-[#7029D6] mb-2"/>
      <p className="font-extrabold text-[25px]">{currency(amountValue)}</p><Notes>Montant à autoriser</Notes></div>
     {approvalNames.length<2&&<p className="text-xs text-[#A74963]">Deux personnes autorisées sont nécessaires dans ce scénario.</p>}
     {(kind==='sub'?family.members.filter(m=>m.role==='leader'||m.role==='coleader'):family.members.filter(m=>coholders.includes(m.id))).slice(0,2).map((m,i)=>
      <label key={m.id} className="flex items-center gap-3 rounded-[18px] bg-[#FAF7FF] border border-[#EEE6FA] p-3">
       <PersonAvatar member={m} size={43}/>
       <span className="flex-1"><span className="font-bold text-[12px] block">{m.name}</span><span className="text-[11px] text-[#83778F]">Validation {i+1}/2 (fictive)</span></span>
       <input type="checkbox" checked={i===0?approvalFirst:approvalSecond} onChange={e=>i===0?setApprovalFirst(e.target.checked):setApprovalSecond(e.target.checked)} className="accent-[#762BDD] w-4 h-4"/>
      </label>)}
    </Card>
    <Button disabled={!canSubmit||approvalNames.length<2||!approvalFirst||!approvalSecond} onClick={commitMoney}>Valider l'opération <ShieldCheck size={17}/></Button>
   </>}
  {view==='money-success'&&<Card className="p-6 text-center space-y-4">
    <span className="w-[72px] h-[72px] mx-auto rounded-full bg-[#E7F8EE] text-[#20A67A] flex items-center justify-center"><CheckCircle2 size={40}/></span>
    <h2 className="text-[20px] font-extrabold">Opération effectuée !</h2>
    <p className="text-[28px] font-extrabold text-[#6D2BD8] tabular-nums">{currency(amountValue)}</p>
    <div className="rounded-2xl bg-[#F6F1FE] p-3 text-left flex items-center gap-2">
     {dest.startsWith('pocket:')?<PersonAvatar member={findMember(family,dest.slice(7))} size={40}/>:<CheckCircle2 size={23} className="text-[#762ED9]"/>}
     <Notes>Les soldes et l'historique fictifs ont été actualisés.</Notes>
    </div>
    <Button onClick={root}>Retour au compte <ArrowRight size={16}/></Button>
   </Card>}
  {view==='history'&&<>
   <MiniHead heading="Historique des opérations" desc="Mouvements associés uniquement à ce compte."/>
   <Card className="p-4">
    <label className="block text-[12px] font-bold text-[#504365]">Filtrer par catégorie
     <select value={historyFilter} onChange={e=>setHistoryFilter(e.target.value)} className="block w-full mt-2 h-11 bg-[#F9F6FF] border border-[#E7DFF0] rounded-2xl px-3 outline-none focus:ring-2 focus:ring-[#C7ABFA]">
      <option value="all">Toutes les opérations</option>
      {[...new Set(transactions.map(t=>t.category))].map(c=><option key={c} value={c}>{c}</option>)}
     </select>
    </label>
   </Card>
   <section><SectionHead title="Mouvements"/>
    <Card className="px-4 py-1">{readable&&filteredTransactions.length?filteredTransactions.map(t=><Row key={t.id}
     icon={t.amount>=0?ArrowDownLeft:ReceiptText} title={t.title} caption={t.date+' · '+t.category}
     trailing={<span className={'text-[12px] font-extrabold shrink-0 '+(t.amount>=0?'text-[#178A65]':'text-[#302040]')}>{t.amount>0?'+':''}{currency(t.amount)}</span>}
     onClick={()=>{setSelectedTransaction(t.id);jump('transaction');}}/>):
     <div className="py-5 text-center"><ReceiptText size={25} className="mx-auto text-[#9D79D5] mb-2"/><Notes>Aucune opération disponible avec ces filtres ou ces autorisations.</Notes></div>}</Card>
   </section>
  </>}
  {view==='transaction'&&tx&&<>
   <MiniHead heading="Détail de l'opération"/>
   <Card className="p-5 space-y-4">
    <div className="text-center"><span className="w-12 h-12 bg-[#F2EAFF] text-[#7530D8] flex items-center justify-center rounded-2xl mx-auto"><ReceiptText size={23}/></span>
     <p className="text-[28px] font-extrabold mt-3">{currency(tx.amount)}</p><Notes>{tx.title}</Notes></div>
    <div className="border-t border-[#EEE6F7] pt-3 space-y-1">
     {[['Libellé',tx.title],['Date',tx.date],['Catégorie',tx.category],['Source',tx.source],['Destination',tx.target]].map(([k,v])=>
      <div key={k} className="flex justify-between items-center gap-3 text-[12px] border-b last:border-0 border-[#F0EAF7] py-2.5">
       <span className="text-[#81758F]">{k}</span><span className="font-bold text-right break-words">{v}</span>
      </div>)}
    </div>
   </Card>
   <Notes>Le justificatif bancaire officiel n'est pas disponible dans cette simulation.</Notes>
  </>}
  {view==='members'&&<>
   <MiniHead heading={kind==='sub'?'Membres & accès':'Cotitulaires & droits'} desc={kind==='sub'?'Qui peut consulter et gérer le sous-compte ?':'Les deux titulaires de ce compte bancaire.'}/>
   <Card className="p-4 space-y-2">
    {(kind==='sub'?family.members:family.members.filter(m=>coholders.includes(m.id))).map(m=>
     <PersonTile key={m.id} member={m} selected={m.id===viewerId}
      label={kind==='joint'?'Cotitulaire':(m.simpleOne?'Simple One · ':roleLabel(m.role)+' · ')+(admin||family.accountViewIds.includes(m.id)?'Consultation autorisée':'Consultation restreinte')}
      onClick={()=>{setSelectedMember(m.id);jump('person');}}/>)}
   </Card>
   <Card className="bg-[#F3ECFE] border-[#E5D9FA] flex items-start gap-3">
    <ShieldCheck size={20} className="text-[#7230DA] shrink-0"/>
    <Notes>{kind==='sub'?'La consultation et les opérations nécessitent des droits distincts.':'Les cotitulaires ont les droits et obligations prévus par la convention bancaire.'}</Notes>
   </Card>
   {kind==='sub'&&admin&&<Button secondary onClick={onOpenMembers}>Invitations et gestion des membres <Users size={16}/></Button>}
  </>}
  {view==='person'&&<>
   <MiniHead heading="Droits et accès"/>
   <Card className="p-4 space-y-4">
    <PersonTile member={findMember(family,selectedMember)} label={kind==='joint'?'Cotitulaire · Compte joint':(findMember(family,selectedMember)?.simpleOne?'Compte Simple One':roleLabel(findMember(family,selectedMember)?.role||'member'))}/>
    {kind==='sub'&&<>
     <div className="rounded-[18px] bg-[#F8F5FF] p-4">
      <p className="text-[12px] font-bold">Consultation du sous-compte</p>
      <p className="text-[11px] text-[#81758D] mt-1">{admin||family.accountViewIds.includes(selectedMember)?'Autorisée':'Restreinte'}</p>
     </div>
     {admin&&selectedMember!==viewerId&&<label className="flex gap-3 items-center p-3 border border-[#EBE4F5] rounded-2xl text-[12px]">
      <span className="flex-1">Autoriser la consultation du solde et de l'historique</span>
      <input type="checkbox" checked={family.accountViewIds.includes(selectedMember)}
       onChange={e=>onUpdate(f=>{f.accountViewIds=e.target.checked?[...new Set([...f.accountViewIds,selectedMember])]:f.accountViewIds.filter(id=>id!==selectedMember);})} className="accent-[#7030DC] w-4 h-4"/>
     </label>}
     <Notes>Le droit de dépenser ou de transférer est séparé et ne peut pas être attribué par ce réglage.</Notes>
    </>}
    {kind==='joint'&&<Notes>La modification des cotitulaires nécessite des formalités contractuelles non simulées ici.</Notes>}
   </Card>
  </>}
  {view==='cards'&&<>
   <MiniHead heading="Cartes associées" desc="Cartes fictives rattachées à ce compte."/>
   {linkedCards.length?linkedCards.map(c=><button key={c.id} type="button" className="w-full text-left space-y-2 hover:brightness-105" onClick={()=>{setSelectedCard(c.id);jump('card');}}>
    <BankCard card={c} holder={findMember(family,c.holderId)} label={kind==='sub'?'Famille':'Joint'}/>
    <div className="flex justify-between items-center px-1 text-[12px] font-bold"><span>{c.label}</span><span className="text-[#722AD5] flex items-center gap-1">Gérer <ChevronRight size={15}/></span></div>
   </button>):
    <Card className="p-6 text-center space-y-3"><CreditCard size={31} className="mx-auto text-[#7630DA]"/><h3 className="font-bold text-[14px]">Aucune carte associée</h3><Notes>Ajoutez une carte fictive pour découvrir sa gestion et ses paramètres.</Notes></Card>}
   {authorized&&<Button secondary onClick={newCard}>Ajouter une carte fictive <Plus size={16}/></Button>}
   <Notes>Les cartes n'ont aucune valeur de paiement. Plafonds et droits réels restent à confirmer.</Notes>
  </>}
  {view==='card'&&selectedCardItem&&<>
   <MiniHead heading={selectedCardItem.label}/>
   <BankCard card={selectedCardItem} holder={findMember(family,selectedCardItem.holderId)} label={kind==='sub'?'Famille':'Joint'}/>
   <Card className="p-4 space-y-3">
    <PersonTile member={findMember(family,selectedCardItem.holderId)} label="Titulaire de la carte"/>
    <div className="flex justify-between items-center px-1 pt-1"><p className="text-[12px] font-bold">Statut de la carte</p>
     <span className={'text-[11px] px-3 py-1 rounded-full font-bold '+(selectedCardItem.active?'bg-[#E6F8EF] text-[#16885D]':'bg-[#FFF1D9] text-[#A86E17]')}>{selectedCardItem.active?'Active':'Suspendue'}</span></div>
    {authorized&&<Button secondary onClick={()=>{onUpdate(f=>{const card=f.cards.find(c=>c.id===selectedCardItem.id);if(card)card.active=!card.active;});onToast('Statut fictif actualisé.');}}>
     {selectedCardItem.active?'Suspendre la carte':'Réactiver la carte'}</Button>}
   </Card>
  </>}
  {view==='documents'&&<>
   <MiniHead heading="RIB & documents"/>
   <Card className="p-5 space-y-4">
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#F1E8FF] text-[#702BD8]"><FileText size={25}/></div>
    <h3 className="font-extrabold text-[16px]">Documents du compte joint</h3>
    <div className="space-y-2">
     <div className="flex items-center justify-between rounded-[18px] bg-[#FAF7FE] border border-[#EEE7F7] p-3"><div className="flex gap-3 items-center"><Landmark size={19} className="text-[#782ED8]"/><span className="text-[12px] font-bold">RIB du compte</span></div><span className="text-[10px] rounded-full bg-[#EFE9F5] px-2 py-1 text-[#7D7189]">Non disponible</span></div>
     <div className="flex items-center justify-between rounded-[18px] bg-[#FAF7FE] border border-[#EEE7F7] p-3"><div className="flex gap-3 items-center"><FileText size={19} className="text-[#782ED8]"/><span className="text-[12px] font-bold">Relevés et convention</span></div><span className="text-[10px] rounded-full bg-[#EFE9F5] px-2 py-1 text-[#7D7189]">Non disponible</span></div>
    </div>
    <Notes>Les documents contractuels et le RIB ne sont pas générés dans ce prototype. Aucun identifiant bancaire fictif n'est présenté comme réel.</Notes>
   </Card>
  </>}
  {view==='settings'&&<>
   <MiniHead heading="Paramètres du compte"/>
   <Card className="p-4 space-y-3">
    <SectionHead title="Préférences"/>
    <label className="flex items-center gap-3 rounded-[18px] bg-[#FAF7FF] p-3.5">
     <span className="w-10 h-10 rounded-2xl bg-[#F1E8FF] text-[#702CD6] flex items-center justify-center"><Settings2 size={20}/></span>
     <span className="flex-1"><span className="block text-[13px] font-bold">Notifications</span><span className="text-[11px] text-[#81758D] block mt-1">Alertes fictives liées au compte</span></span>
     <input aria-label="Recevoir les notifications du compte" type="checkbox" className="accent-[#722ADA] w-4 h-4" checked={notifications} onChange={e=>setNotifications(e.target.checked)}/>
    </label>
   </Card>
   <Card className="p-4 space-y-4">
    <SectionHead title="Plafonds"/>
    <div className="flex gap-3 items-center rounded-[17px] bg-[#F7F2FF] p-3"><ShieldCheck size={21} className="text-[#712AD7]"/><div className="flex-1"><p className="font-bold text-[12px]">Plafond indicatif</p><Notes>Pour la démonstration uniquement</Notes></div></div>
    <Field label="Plafond (DH)" value={limit} onChange={setLimit}/>
    <Button secondary disabled={!authorized||!moneyValid(Number(limit))} onClick={()=>{onUpdate(f=>{const a=kind==='sub'?f.account:f.joint;if(a)a.limit=Number(limit);});onToast('Plafond fictif actualisé.');}}>Enregistrer</Button>
   </Card>
   {kind==='joint'&&authorized&&<Card className="p-4">
    <Row icon={LockKeyhole} title="Clôturer le compte joint" caption="Conditions et accords des deux cotitulaires"
     onClick={()=>{setClosureAccepted(false);setClosureSecondAccepted(false);jump('closure');}}/>
   </Card>}
   <Notes>Les plafonds, autorisations et modalités bancaires sont à valider selon les conventions applicables.</Notes>
  </>}
  {view==='closure'&&<>
   <MiniHead heading="Clôture du compte joint" desc="Vérifiez les conditions et simulez la confirmation des deux cotitulaires."/>
   <Card className="p-4 space-y-4">
    <SectionHead title="Vérifications"/>
    <div className="rounded-[18px] bg-[#F8F5FF] p-3 space-y-2">
     <div className="flex justify-between gap-2 text-[12px]"><span className="text-[#81758D]">Solde actuel</span><strong>{currency(account?.balance||0)}</strong></div>
     <div className="flex justify-between gap-2 text-[12px]"><span className="text-[#81758D]">Cartes actives</span><strong>{linkedCards.filter(c=>c.active).length}</strong></div>
    </div>
    <div className={'p-3 rounded-[17px] text-[12px] font-bold '+(hasPendingClosure?'bg-[#FFF1F4] text-[#B14C61]':'bg-[#EAF8F1] text-[#16875B]')}>
     {hasPendingClosure?'Le compte doit être vide et les cartes suspendues.':'Conditions simulées satisfaites.'}
    </div>
   </Card>
   <Card className="p-4 space-y-3">
    <SectionHead title="Accords des cotitulaires"/>
    {coholders.slice(0,2).map((id,i)=>{
     const m=findMember(family,id);
     return <label key={id} className="flex items-center gap-3 rounded-[17px] bg-[#FAF7FF] p-3">
      <PersonAvatar member={m} size={42}/><span className="flex-1 text-[12px] font-bold">{m?.name||'Cotitulaire'}<span className="block text-[11px] text-[#81758D] font-normal mt-1">Accord fictif {i+1}/2</span></span>
      <input type="checkbox" checked={i===0?closureAccepted:closureSecondAccepted} onChange={e=>i===0?setClosureAccepted(e.target.checked):setClosureSecondAccepted(e.target.checked)} className="accent-[#752DDB] w-4 h-4"/>
     </label>;
    })}
   </Card>
   <Button disabled={coholders.length<2||hasPendingClosure||!closureAccepted||!closureSecondAccepted} onClick={()=>{onUpdate(f=>{f.joint=null;f.jointHolderIds=[];f.jointApplication=null;});onToast('Compte joint clôturé (simulation).');onHome();}}>Simuler la clôture <Check size={16}/></Button>
   <Notes>Aucune demande réelle de clôture n'est envoyée. Les conditions bancaires restent à confirmer.</Notes>
  </>}
 </div>;
});
