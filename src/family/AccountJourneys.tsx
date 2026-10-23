import React, { useState } from 'react';
import {
  ArrowDownLeft, ArrowLeft, ArrowRight, Bell, Check, CheckCircle2, ChevronRight,
  CreditCard, FileText, HeartHandshake, Info, Landmark, LockKeyhole, Plus,
  ReceiptText, Send, Settings2, ShieldCheck, Users, WalletCards, XCircle
} from 'lucide-react';
import { currency, findMember, isAdmin, moneyValid, today, uid, type Family, type FamilyCard, type FamilyTransaction } from './model';

type Kind = 'sub' | 'joint';
type Action = 'add' | 'transfer' | 'pay';
type View = 'overview' | 'intro' | 'sub-config' | 'approval' | 'coholder' | 'identity' | 'terms' | 'opening' | 'opening-success'
  | 'money' | 'review' | 'money-success' | 'history' | 'transaction'
  | 'members' | 'person' | 'cards' | 'card' | 'documents' | 'settings' | 'closure';
type Props = {
  kind: Kind; family: Family; viewerId: string; canViewSub: boolean;
  onUpdate: (fn:(family:Family)=>void)=>void;
  onHome:()=>void; onToast:(message:string)=>void;
};
const Button = ({children,onClick,secondary=false,disabled=false}:{
  children:React.ReactNode;onClick:()=>void;secondary?:boolean;disabled?:boolean;
}) => <button type="button" disabled={disabled} onClick={onClick} className={
  (secondary?'bg-[#F1EAFE] text-[#6427CC] border border-[#E1D4F6]':'bg-[#6C26DC] text-white')+
  ' w-full rounded-full min-h-[46px] px-4 text-[13px] font-bold inline-flex justify-center items-center gap-2 transition hover:brightness-95 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed'
}>{children}</button>;
const Card = ({children,className=''}:{children:React.ReactNode;className?:string}) =>
  <div className={'card-simple p-4 '+className}>{children}</div>;
const Row = ({icon:Icon,title,caption,onClick}:{
  icon:React.ComponentType<{size?:number;className?:string}>;title:string;caption?:string;onClick:()=>void;
}) => <button type="button" onClick={onClick} className="flex w-full gap-3 py-3.5 items-center text-left border-b border-[#F1EDF7] last:border-b-0 rounded-lg transition hover:bg-[#FAF7FF]">
  <span className="w-10 h-10 shrink-0 bg-[#F2EAFE] text-[#702CD6] rounded-2xl flex items-center justify-center"><Icon size={19}/></span>
  <span className="flex-1 min-w-0"><span className="text-[13px] block font-bold text-[#261737]">{title}</span>
  {caption&&<span className="text-[11px] text-[#81758D] mt-1 block">{caption}</span>}</span>
  <ChevronRight size={16} className="text-[#9D91AB]"/>
</button>;
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
export function AccountJourneys({kind,family,viewerId,canViewSub,onUpdate,onHome,onToast}:Props){
 const viewer=findMember(family,viewerId);
 const admin=isAdmin(family,viewerId);
 const coholders=family.jointHolderIds||[];
 const jointOwner=coholders.includes(viewerId);
 const authorized=kind==='sub'?admin:jointOwner;
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
 const [notice,setNotice]=useState('');
 const [notifications,setNotifications]=useState(true);
 const scrollTop=()=>{const el=document.getElementById('simple-scroll-area');if(el)el.scrollTop=0;};
 const jump=(next:View)=>{setTrail(prev=>[...prev,view]);setView(next);setNotice('');scrollTop();};
 const previous=()=>{if(trail.length){setView(trail[trail.length-1]);setTrail(t=>t.slice(0,-1));setNotice('');scrollTop();}else onHome();};
 const root=()=>{setTrail([]);setView('overview');setNotice('');scrollTop();};
 const begin=(type:Action)=>{setAction(type);setAmount('');setBeneficiary('Facture familiale');setDestination('');setApprovalFirst(false);setApprovalSecond(false);jump('money');};
 const membersEligible=family.members.filter(m=>m.id!==viewerId&&!m.simpleOne&&m.relation==='Conjoint');
 const application=family.jointApplication;
 const readable=kind==='sub'?canViewSub:jointOwner;
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
 const needsDemoApproval=action!=='add'&&validAmount&&amountValue>=family.otpThreshold;
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
  if(!viewer||!openingHolder||!termsAccepted||!firstSignature)return;
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
 const MiniHead=({heading,desc}:{heading:string;desc?:string})=><div className="space-y-2">
  <LinkBack onClick={previous}/><h2 className="font-extrabold text-[19px] text-[#251635]">{heading}</h2>
  {desc&&<Notes>{desc}</Notes>}</div>;
 const nextLabel=action==='add'?'Alimenter':action==='transfer'?'Transférer':'Payer';
 const jointPeople=coholders.map(id=>findMember(family,id)?.name||'Cotitulaire').join(' & ');
 return <div className="space-y-4 pb-5 text-[#251635]">
  {view==='overview'&&account&&<>
   <Card className="bg-gradient-to-br from-[#FAF7FF] to-white">
    <div className="flex items-center justify-between"><div className="inline-flex items-center gap-2 text-[#6830D2] font-extrabold text-[13px]">
     {kind==='sub'?<Landmark size={19}/>:<HeartHandshake size={19}/>} {title}</div>
     <span className="text-[10px] font-bold px-2.5 py-1 bg-[#E7F8ED] text-[#16875B] rounded-full">Actif</span></div>
    <p className="text-[11px] mt-5 text-[#80728F]">Solde disponible</p>
    <p className="text-[30px] font-extrabold mt-1">{readable?currency(account.balance):'Solde masqué'}</p>
    <p className="text-[11px] text-[#83758F] mt-2">{kind==='sub'?'Dépenses communes · '+family.name:'Cotitulaires · '+jointPeople}</p>
   </Card>
   <div className="grid grid-cols-3 gap-2">
    {[{type:'add' as Action,label:'Alimenter',Icon:Plus},{type:'transfer' as Action,label:'Transférer',Icon:Send},{type:'pay' as Action,label:'Payer',Icon:ReceiptText}].map(item=>
     <button key={item.type} type="button" disabled={!authorized} onClick={()=>begin(item.type)}
      className="card-simple flex flex-col gap-2 items-center justify-center py-3 min-h-[86px] rounded-[18px] text-[#6C28DB] hover:bg-[#F8F2FF] disabled:opacity-40">
      <item.Icon size={21}/><span className="text-[11px] font-bold text-[#46345D]">{item.label}</span>
     </button>)}
   </div>
   {!authorized&&<Notes>{kind==='sub'?'Les opérations sont réservées aux membres disposant des droits de gestion.':'Seuls les cotitulaires peuvent effectuer les opérations sur ce compte.'}</Notes>}
   <section><div className="flex justify-between items-center mb-2"><h3 className="font-extrabold text-[16px]">Opérations récentes</h3>
    <button type="button" onClick={()=>jump('history')} className="text-[12px] font-bold text-[#6C2BD6]">Voir tout →</button></div>
    <Card className="px-4 py-1">
     {readable&&transactions.length?transactions.slice(0,3).map(t=><Row key={t.id} icon={ArrowDownLeft} title={t.title}
      caption={t.date+' · '+t.category} onClick={()=>{setSelectedTransaction(t.id);jump('transaction');}}/>):
      <p className="text-[12px] text-[#80768F] py-4">{readable?'Aucune opération sur ce compte.':'Historique non accessible avec ce profil.'}</p>}
    </Card>
   </section>
   <Card className="py-1">
    <Row icon={Users} title={kind==='sub'?'Membres & accès':'Cotitulaires & droits'} onClick={()=>jump('members')}/>
    <Row icon={CreditCard} title="Cartes associées" onClick={()=>jump('cards')}/>
    {kind==='joint'&&<Row icon={FileText} title="RIB & documents" onClick={()=>jump('documents')}/>}
    <Row icon={Settings2} title="Paramètres du compte" onClick={()=>jump('settings')}/>
   </Card>
   <Notes>Parcours fictif Simple. Aucune transaction réelle, signature bancaire ou création de compte n'est exécutée.</Notes>
  </>}
  {view==='intro'&&<>
   <Card className="p-6 text-center space-y-3 bg-gradient-to-br from-[#F2EBFF] to-white">
    <div className="rounded-full bg-white text-[#742CD8] w-14 h-14 flex items-center justify-center mx-auto">{kind==='sub'?<Landmark size={27}/>:<HeartHandshake size={27}/>}</div>
    <h2 className="text-[20px] font-extrabold">{kind==='sub'?'Un espace pour vos dépenses communes':'Un compte à deux, pour vos projets communs'}</h2>
    <p className="text-[13px] text-[#7E708F] leading-relaxed">{kind==='sub'?'Un sous-compte rattaché à votre espace familial pour organiser les dépenses partagées.':'Deux cotitulaires, un même compte bancaire, avec des droits et responsabilités définis par la convention.'}</p>
   </Card>
   <Card className="py-1">
    <Row icon={Users} title={kind==='sub'?'Accès adaptés aux membres':'Deux cotitulaires distincts'} onClick={()=>onToast('Les droits seront définis lors de la configuration.')} />
    <Row icon={ShieldCheck} title="Autorisations et sécurité" onClick={()=>onToast('Les modalités bancaires restent à confirmer.')} />
    <Row icon={CreditCard} title="Cartes et paiements selon l'offre" onClick={()=>onToast('Fonctionnalité simulée, sous réserve des conditions bancaires.')} />
   </Card>
   {kind==='sub'?<Button disabled={!admin} onClick={()=>jump('sub-config')}>Créer mon sous-compte <ArrowRight size={16}/></Button>:
    <Button onClick={()=>jump('coholder')}>Ouvrir un compte joint <ArrowRight size={16}/></Button>}
   <Notes>Offre, éligibilité, tarifs et conventions bancaires à valider. L'ouverture ici est uniquement simulée.</Notes>
  </>}
  {view==='sub-config'&&<>
   <MiniHead heading="Configurer votre sous-compte" desc="Définissez les membres autorisés à consulter le solde. Les droits de paiement restent distincts."/>
   <Card className="space-y-3">
    <p className="font-bold text-[13px]">Consultation du solde</p>
    {family.members.map(m=>{
     const locked=m.role==='leader'||m.role==='coleader';
     return <label key={m.id} className="flex items-center gap-3 py-2 border-b last:border-none border-[#EEE7F8] text-[12px]">
      <input type="checkbox" disabled={locked} checked={locked||subAccess.includes(m.id)}
       onChange={e=>setSubAccess(prev=>e.target.checked?[...new Set([...prev,m.id])]:prev.filter(id=>id!==m.id))}
       className="accent-[#772DDD]"/>
      <span className="flex-1"><strong>{m.name}</strong><span className="block text-[#81758D] text-[11px]">{locked?'Accès de gestion':'Consultation facultative'}</span></span>
     </label>;
    })}
   </Card>
   <Button disabled={!admin} onClick={createSub}>Confirmer la création fictive <Check size={16}/></Button>
   <Notes>La création et les droits sont simulés ; les règles bancaires définitives restent à valider.</Notes>
  </>}
  {view==='coholder'&&<>
   <MiniHead heading="Choisir le deuxième cotitulaire" desc="Sélectionnez un membre adulte éligible dans la famille. Le rôle familial ne confère pas automatiquement de droits bancaires."/>
   {membersEligible.length?<Card className="space-y-2">
    {membersEligible.map(m=><button key={m.id} type="button" onClick={()=>setOpeningHolder(m.id)}
      className={'w-full border rounded-2xl text-left p-4 flex gap-3 items-center '+(openingHolder===m.id?'border-[#8B56E5] bg-[#F6F0FF]':'border-[#E9E1F4]')}>
      <div className="w-10 h-10 bg-[#EAE0FE] text-[#6F2CD7] rounded-full flex items-center justify-center"><Users size={19}/></div>
      <div className="flex-1"><p className="text-[13px] font-bold">{m.name}</p><Notes>{m.relation} · Compte Simple</Notes></div>
      {openingHolder===m.id&&<Check size={19} className="text-[#6A28D4]"/>}
    </button>)}
   </Card>:<Card><Notes>Aucun conjoint éligible dans la famille. Ajoutez un membre adulte avant de poursuivre.</Notes></Card>}
   <Button disabled={!openingHolder} onClick={()=>jump('identity')}>Continuer <ArrowRight size={16}/></Button>
  </>}
  {view==='identity'&&<>
   <MiniHead heading="Vérifier les informations" desc="Les informations affichées sont fictives ; aucune identification réglementaire n'est réalisée."/>
   <Card className="space-y-3">
    <div><Notes>Premier cotitulaire</Notes><p className="font-bold text-[14px]">{viewer?.name}</p></div>
    <div className="border-t border-[#F0EAF7] pt-3"><Notes>Deuxième cotitulaire</Notes><p className="font-bold text-[14px]">{findMember(family,openingHolder)?.name}</p></div>
    <div className="bg-[#F6F2FF] rounded-xl p-3"><Notes>Dans une banque réelle, identité, éligibilité et informations requises seraient contrôlées.</Notes></div>
   </Card>
   <Button onClick={()=>jump('terms')}>Continuer <ArrowRight size={16}/></Button>
  </>}
  {view==='terms'&&<>
   <MiniHead heading="Conditions du compte joint" desc="Chaque cotitulaire doit prendre connaissance des conditions et exprimer son accord."/>
   <Card className="space-y-3">
    {['Titularité et droits des deux parties','Modalités de fonctionnement du compte','Responsabilités contractuelles','Frais et documents selon la convention'].map(t=>
     <div key={t} className="text-[12px] flex gap-2 items-start"><CheckCircle2 size={16} className="text-[#742CDC] shrink-0"/>{t}</div>)}
    <div className="rounded-xl bg-[#FFF7E8] p-3"><Notes>Ces textes sont une illustration UX, pas les véritables conditions contractuelles de Simple.</Notes></div>
    <label className="flex items-start gap-2 text-[12px]"><input type="checkbox" className="accent-[#712BDA] mt-1" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)}/>J'ai consulté la présentation fictive des conditions.</label>
    <label className="flex items-start gap-2 text-[12px]"><input type="checkbox" className="accent-[#712BDA] mt-1" checked={firstSignature} onChange={e=>setFirstSignature(e.target.checked)}/>Je confirme ma demande en tant que premier cotitulaire (simulation).</label>
   </Card>
   <Button disabled={!termsAccepted||!firstSignature} onClick={requestJoint}>Envoyer la demande à {findMember(family,openingHolder)?.name||'mon conjoint'} <Send size={16}/></Button>
  </>}
  {view==='opening'&&<>
   <MiniHead heading="Suivi de l'ouverture" desc="L'avancement est simulé. Le deuxième cotitulaire ne reçoit aucune véritable notification."/>
   <Card className="space-y-3">
    <div className="flex gap-3 items-center"><HeartHandshake size={24} className="text-[#732ADD]"/>
     <div><p className="font-bold text-[14px]">Compte joint</p><Notes>{findMember(family,application?.requesterId||'')?.name} & {findMember(family,application?.coHolderId||'')?.name}</Notes></div></div>
    <div className="border-t border-[#EAE2F3] pt-3"><p className="font-bold text-[13px]">{application?.status==='awaiting'?'En attente du deuxième cotitulaire':application?.status==='review'?'En cours de vérification':application?.status==='rejected'?'Demande refusée':'Aucune demande en cours'}</p></div>
   </Card>
   {application?.status==='awaiting'&&<Card className="space-y-3">
    <p className="text-[13px] font-bold">Simuler la réponse de {findMember(family,application.coHolderId)?.name}</p>
    <Button onClick={()=>respondJoint(true)}>Simuler son accord <Check size={16}/></Button>
    <Button secondary onClick={()=>respondJoint(false)}>Simuler un refus <XCircle size={16}/></Button>
   </Card>}
   {application?.status==='review'&&<Card className="space-y-3">
    <Notes>Les deux accords fictifs sont obtenus. La vérification réglementaire serait réalisée par la banque.</Notes>
    <Button onClick={activateJoint}>Simuler la validation bancaire <CheckCircle2 size={16}/></Button>
   </Card>}
   {application?.status==='rejected'&&<Button onClick={()=>{onUpdate(f=>{f.jointApplication=null;});setOpeningHolder('');setTermsAccepted(false);setFirstSignature(false);jump('coholder');}}>Nouvelle demande <ArrowRight size={16}/></Button>}
  </>}
  {view==='opening-success'&&<Card className="p-6 text-center space-y-4">
   <CheckCircle2 size={43} className="text-[#20A77C] mx-auto"/>
   <h2 className="text-[20px] font-extrabold">{kind==='sub'?'Sous-compte Famille créé !':'Compte joint ouvert !'}</h2>
   <Notes>Succès simulé. Aucun produit bancaire réel n'a été ouvert.</Notes>
   <Button onClick={root}>Accéder au compte <ArrowRight size={16}/></Button>
  </Card>}
  {view==='money'&&<>
   <MiniHead heading={nextLabel} desc={'Opération fictive depuis '+title}/>
   <Card className="space-y-3">
    <div><Notes>Compte à débiter</Notes><p className="font-bold text-[13px]">{action==='add'?'Mon compte Simple':title}</p><p className="text-[11px] text-[#83758F] mt-1">Disponible : {currency(sourceBalance)}</p></div>
    {action==='transfer'&&<label className="block space-y-2"><span className="text-[12px] font-bold">Destination</span>
     <select value={dest} onChange={e=>setDestination(e.target.value)} className="w-full h-12 border border-[#E4D9F4] rounded-2xl bg-[#F8F5FE] px-3 text-[13px]">
      {targets.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
     </select></label>}
    {action==='pay'&&<label className="block space-y-2"><span className="text-[12px] font-bold">Bénéficiaire / facture</span>
     <input value={beneficiary} onChange={e=>setBeneficiary(e.target.value)} className="w-full h-12 border border-[#E4D9F4] rounded-2xl bg-[#F8F5FE] px-3 text-[13px]"/></label>}
    <Field label="Montant (DH)" value={amount} onChange={setAmount}/>
    {validAmount&&amountValue>sourceBalance&&<p className="text-xs text-[#B4435C]">Solde insuffisant.</p>}
    {action==='pay'&&!beneficiary.trim()&&<p className="text-xs text-[#B4435C]">Ajoutez un bénéficiaire.</p>}
   </Card>
   <Button disabled={!canSubmit||(action==='pay'&&!beneficiary.trim())} onClick={()=>jump('review')}>Continuer <ArrowRight size={16}/></Button>
  </>}
  {view==='review'&&<>
   <MiniHead heading="Vérifier l'opération" desc="Contrôlez les informations avant confirmation."/>
   <Card className="space-y-4">
    <p className="text-[28px] font-extrabold text-[#6C2ADD]">{currency(amountValue)}</p>
    <div className="flex justify-between text-[12px]"><span className="text-[#7A7187]">Depuis</span><strong>{action==='add'?'Mon compte Simple':title}</strong></div>
    <div className="flex justify-between text-[12px]"><span className="text-[#7A7187]">Vers</span><strong>{action==='pay'?beneficiary:dest==='account'?'Sous-compte Famille':dest==='joint'?'Compte joint':dest.startsWith('pocket:')?'Pocket '+findMember(family,dest.slice(7))?.name:dest.startsWith('simple:')?'Compte Simple':title}</strong></div>
    <Notes>Dans un parcours bancaire réel, des validations de sécurité supplémentaires peuvent être exigées.</Notes>
   </Card>
   {notice&&<p className="text-[12px] text-[#B4435C]">{notice}</p>}
   <Button disabled={!canSubmit} onClick={()=>needsDemoApproval?jump('approval'):commitMoney()}>Confirmer (simulation) <Check size={17}/></Button>
  </>}
  {view==='approval'&&<>
    <MiniHead heading="Double validation (simulation)" desc="Hypothèse UX pour illustrer une validation renforcée au-dessus du seuil fictif défini dans le prototype."/>
    <Card className="space-y-4">
     <p className="font-extrabold text-[23px]">{currency(amountValue)}</p>
     {approvalNames.length<2&&<p className="text-xs text-[#A74963]">Deux personnes autorisées sont nécessaires dans ce scénario.</p>}
     <label className="flex gap-3 items-center text-[12px]"><input type="checkbox" checked={approvalFirst} onChange={e=>setApprovalFirst(e.target.checked)} className="accent-[#762BDD]"/>
      Accord fictif de {approvalNames[0]||'premier titulaire'}</label>
     <label className="flex gap-3 items-center text-[12px]"><input type="checkbox" checked={approvalSecond} onChange={e=>setApprovalSecond(e.target.checked)} className="accent-[#762BDD]"/>
      Accord fictif de {approvalNames[1]||'deuxième titulaire'}</label>
    </Card>
    <Button disabled={!canSubmit||approvalNames.length<2||!approvalFirst||!approvalSecond} onClick={commitMoney}>Valider l'opération <ShieldCheck size={17}/></Button>
   </>}
  {view==='money-success'&&<Card className="p-6 text-center space-y-4">
   <CheckCircle2 size={42} className="text-[#1CA67B] mx-auto"/>
   <h2 className="text-[20px] font-extrabold">Opération effectuée !</h2>
   <p className="text-[24px] font-extrabold text-[#6D2BD8]">{currency(amountValue)}</p>
   <Notes>Soldes et historique fictifs mis à jour.</Notes>
   <Button onClick={root}>Retour au compte <ArrowRight size={16}/></Button>
  </Card>}
  {view==='history'&&<>
   <MiniHead heading="Historique des opérations" desc="Mouvements associés uniquement à ce compte."/>
   <label className="block text-[12px]">Filtrer par catégorie
    <select value={historyFilter} onChange={e=>setHistoryFilter(e.target.value)} className="block w-full mt-2 h-11 bg-white border border-[#E7DFF0] rounded-xl px-3">
     <option value="all">Toutes les opérations</option>
     {[...new Set(transactions.map(t=>t.category))].map(c=><option key={c} value={c}>{c}</option>)}
    </select></label>
   <Card className="py-1">{readable&&filteredTransactions.length?filteredTransactions.map(t=><Row key={t.id} icon={ReceiptText} title={t.title} caption={t.date+' · '+currency(t.amount)}
     onClick={()=>{setSelectedTransaction(t.id);jump('transaction');}}/>):<Notes>Aucune opération disponible avec ces filtres et autorisations.</Notes>}</Card>
  </>}
  {view==='transaction'&&tx&&<>
   <MiniHead heading="Détail de l'opération"/>
   <Card className="space-y-3">
    <p className="text-[24px] font-extrabold">{currency(tx.amount)}</p>
    {[['Libellé',tx.title],['Date',tx.date],['Catégorie',tx.category],['Source',tx.source],['Destination',tx.target]].map(([k,v])=>
     <div key={k} className="flex justify-between gap-2 text-[12px] border-b border-[#F0EAF7] py-2"><span className="text-[#81758F]">{k}</span><span className="font-bold text-right">{v}</span></div>)}
    <Notes>Justificatif bancaire non disponible dans ce prototype fictif.</Notes>
   </Card>
  </>}
  {view==='members'&&<>
   <MiniHead heading={kind==='sub'?'Membres & accès':'Cotitulaires & droits'}/>
   <Card className="py-1">
    {(kind==='sub'?family.members:family.members.filter(m=>coholders.includes(m.id))).map(m=>
     <Row key={m.id} icon={Users} title={m.name}
      caption={kind==='joint'?'Cotitulaire':m.role+' · '+(admin||family.accountViewIds.includes(m.id)?'Consultation autorisée':'Consultation restreinte')}
      onClick={()=>{setSelectedMember(m.id);jump('person');}}/>)}
   </Card>
   <Notes>{kind==='sub'?'La consultation et l’opération sont deux permissions distinctes. Le rôle familial seul ne constitue pas un droit bancaire.':'Les cotitulaires possèdent les droits et obligations définis par la convention du compte joint. Ils ne sont pas de simples membres invités.'}</Notes>
  </>}
  {view==='person'&&<>
   <MiniHead heading={findMember(family,selectedMember)?.name||'Membre'}/>
   <Card className="space-y-3">
    <p className="text-[13px] font-bold">{kind==='joint'?'Cotitulaire':'Membre de la famille'}</p>
    {kind==='sub'&&<>
     <p className="text-[12px]">Consultation du sous-compte : {admin||family.accountViewIds.includes(selectedMember)?'Autorisée':'Restreinte'}</p>
     {admin&&selectedMember!==viewerId&&<label className="flex gap-2 items-center text-[12px]"><input type="checkbox" checked={family.accountViewIds.includes(selectedMember)}
      onChange={e=>onUpdate(f=>{f.accountViewIds=e.target.checked?[...new Set([...f.accountViewIds,selectedMember])]:f.accountViewIds.filter(id=>id!==selectedMember);})} className="accent-[#7030DC]"/>
      Autoriser la consultation du solde et de l’historique</label>}
     <Notes>Le droit de dépenser ou de transférer est géré séparément et ne peut pas être attribué par ce seul réglage.</Notes>
    </>}
    {kind==='joint'&&<Notes>La modification des cotitulaires et des droits bancaires requiert un parcours contractuel, non simulé ici.</Notes>}
   </Card>
  </>}
  {view==='cards'&&<>
   <MiniHead heading="Cartes associées" desc="Cartes fictives liées à ce compte."/>
   <Card className="py-1">
    {linkedCards.length?linkedCards.map(c=><Row key={c.id} icon={CreditCard} title={c.label} caption={'•••• '+c.last4+' · '+(c.active?'Active':'Suspendue')}
     onClick={()=>{setSelectedCard(c.id);jump('card');}}/>):<Notes>Aucune carte associée.</Notes>}
   </Card>
   {authorized&&<Button secondary onClick={newCard}>Ajouter une carte fictive <Plus size={16}/></Button>}
   <Notes>Les cartes n'ont aucune valeur de paiement. Les plafonds et droits réels restent à confirmer avec la banque.</Notes>
  </>}
  {view==='card'&&selectedCardItem&&<>
   <MiniHead heading={selectedCardItem.label}/>
   <Card className="space-y-3">
    <div className="rounded-2xl p-5 text-white bg-gradient-to-br from-[#391079] to-[#7A37E9]">
      <div className="flex justify-between items-center"><span className="font-bold text-[13px]">Simple Famille</span><CreditCard size={20}/></div>
      <p className="mt-7 font-mono text-[16px]">•••• •••• •••• {selectedCardItem.last4}</p>
      <p className="mt-3 text-[11px]">{findMember(family,selectedCardItem.holderId)?.name}</p>
    </div>
    <Notes>Statut : {selectedCardItem.active?'Active':'Suspendue'}</Notes>
    {authorized&&<Button secondary onClick={()=>{onUpdate(f=>{const card=f.cards.find(c=>c.id===selectedCardItem.id);if(card)card.active=!card.active;});onToast('État fictif de la carte mis à jour.');}}>
      {selectedCardItem.active?'Suspendre la carte':'Réactiver la carte'}</Button>}
   </Card>
  </>}
  {view==='documents'&&<>
   <MiniHead heading="RIB & documents"/>
   <Card className="space-y-3"><FileText size={27} className="text-[#702BD8]"/>
    <h3 className="font-extrabold text-[15px]">Documents du compte</h3>
    <Notes>Le RIB, les relevés et les documents contractuels ne sont pas disponibles dans la simulation. Aucun identifiant bancaire fictif ne sera présenté comme réel.</Notes>
   </Card>
  </>}
  {view==='settings'&&<>
   <MiniHead heading="Paramètres du compte"/>
   <Card className="space-y-3">
    <div className="flex items-center justify-between"><strong className="text-[13px]">Notifications</strong><input type="checkbox" className="accent-[#722ADA]" checked={notifications} onChange={e=>setNotifications(e.target.checked)}/></div>
    <Notes>Réglage d'affichage pour la démonstration uniquement.</Notes>
   </Card>
   <Card className="space-y-3">
    <strong className="text-[13px]">Plafond indicatif de démonstration</strong>
    <Field label="Plafond (DH)" value={limit} onChange={setLimit}/>
    <Button secondary disabled={!authorized||!moneyValid(Number(limit))} onClick={()=>{onUpdate(f=>{const a=kind==='sub'?f.account:f.joint;if(a)a.limit=Number(limit);});onToast('Plafond fictif actualisé.');}}>Enregistrer</Button>
   </Card>
   {kind==='joint'&&authorized&&<Button secondary onClick={()=>{setClosureAccepted(false);jump('closure');}}>Demander la clôture du compte <ArrowRight size={15}/></Button>}
   <Notes>Les règles opérationnelles, plafonds et demandes réelles dépendent des conventions bancaires applicables.</Notes>
  </>}
  {view==='closure'&&<>
   <MiniHead heading="Clôture du compte joint" desc="Ce parcours représente les vérifications et les deux accords nécessaires dans le scénario."/>
   <Card className="space-y-3">
    <p className="text-[13px] font-bold">Conditions à vérifier</p>
    <Notes>Solde du compte : {currency(account?.balance||0)}</Notes>
    <Notes>Cartes actives : {linkedCards.filter(c=>c.active).length}</Notes>
    {hasPendingClosure?<p className="text-[#B14C61] text-[12px] font-bold">Videz le compte et suspendez les cartes avant de poursuivre.</p>:
      <p className="text-[#19865F] text-[12px] font-bold">Conditions de démonstration satisfaites.</p>}
    <label className="flex items-start gap-2 text-[12px]"><input type="checkbox" className="accent-[#752DDB] mt-1" checked={closureAccepted} onChange={e=>setClosureAccepted(e.target.checked)}/>Je confirme les deux accords fictifs pour la clôture de ce compte.</label>
   </Card>
   <Button disabled={hasPendingClosure||!closureAccepted} onClick={()=>{onUpdate(f=>{f.joint=null;f.jointHolderIds=[];f.jointApplication=null;});onToast('Compte joint clôturé (simulation).');onHome();}}>Simuler la clôture <Check size={16}/></Button>
  </>}
 </div>;
}
