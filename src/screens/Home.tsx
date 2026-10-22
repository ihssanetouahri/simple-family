import React, { useState } from 'react';
import { ArrowRight, Bell, ChevronRight, CreditCard, Eye, EyeOff, MoreHorizontal, ReceiptText, Search, Send, Smartphone, Sparkles, ShoppingBag, ShoppingCart, TrainFront, Users, Wifi } from 'lucide-react';
import { loadFamilyState } from '../family/model';
import { demoBalance, demoTransactions, formatDH, type DemoTransaction } from '../data/demoData';
import { SimpleBarsIcon, SimpleButton, type Navigate } from '../components/SimpleUI';
import lamiaAvatar from '../assets/images/lamia_avatar.jpg';

const TransactionIcon: React.FC<{ category: DemoTransaction['category'] }> = ({ category }) => {
  const icons = { Courses: ShoppingCart, Shopping: ShoppingBag, Factures: Wifi, Transport: TrainFront };
  const Icon = icons[category];
  const colors = { Courses: 'bg-[#FCEFE3] text-[#DA822E]', Shopping: 'bg-[#FCE7F0] text-[#CE5791]', Factures: 'bg-[#E7F1FF] text-[#4A80CD]', Transport: 'bg-[#E8F8F1] text-[#17865C]' };
  return <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colors[category]}`}><Icon size={18} /></div>;
};

export const BankingHomeScreen: React.FC<{ navigate: Navigate }> = ({ navigate }) => {
  const [hideBalance, setHideBalance] = useState(false);
  const [notice, setNotice] = useState('');
  const familyState = loadFamilyState();
  const lamiaBalance = familyState.families.flatMap(f=>f.members).find(m=>m.id==='lamia')?.simpleBalance ?? demoBalance;
  const [integerPart, decimalPart] = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(lamiaBalance).split(',');
  const info = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 3200); };

  return (
    <div className="flex flex-col bg-simple-canvas">
      <header className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-[0_4px_12px_rgba(20,17,31,0.08)] bg-[#EFEAFF] flex items-center justify-center shrink-0">
            <img src={lamiaAvatar} alt="Portrait fictif du prototype" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#7D7693] leading-tight">Bienvenue</p>
            <h1 className="text-[20px] font-extrabold text-[#14111F] leading-tight mt-0.5">Lamia</h1>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={() => navigate('MENU')} aria-label="Rechercher" className="w-11 h-11 rounded-full bg-white shadow-[0_4px_14px_rgba(20,17,31,0.06)] flex items-center justify-center text-[#14111F]"><Search size={19} /></button>
          <button type="button" onClick={() => info('Aucune nouvelle notification dans cette base UI.')} aria-label="Notifications" className="w-11 h-11 rounded-full bg-white shadow-[0_4px_14px_rgba(20,17,31,0.06)] flex items-center justify-center text-[#14111F] relative"><Bell size={19} /><span className="w-2.5 h-2.5 rounded-full bg-[#5E1DF0] border-2 border-white absolute top-2 right-2.5" /></button>
        </div>
      </header>

      {notice && <div role="status" className="mx-5 rounded-xl bg-[#290764] text-white px-4 py-3 text-xs">{notice}</div>}

      <div className="px-5 space-y-5 flex-1 pb-4">
        <section className="pt-4 pb-1 text-center">
          <div className="inline-flex items-center gap-2.5">
            <span className="text-[15px] font-medium text-[#14111F]">Compte principal</span>
            <button type="button" onClick={() => navigate('CARDS')} className="px-3 py-1 rounded-full bg-[#EAE3FF] text-[#6B5E94] text-[12px] font-semibold inline-flex items-center gap-0.5"><span>Détails</span><ChevronRight size={13} /></button>
          </div>
          <div className="mt-2.5 flex items-center justify-center gap-2.5">
            {hideBalance ? <p className="text-[36px] font-extrabold text-[#14111F] tracking-tight tabular-nums leading-none">•••••• DH</p> :
              <p className="font-extrabold text-[#14111F] tracking-tight tabular-nums leading-none"><span className="text-[40px]">{integerPart}</span><span className="text-[28px]">,{decimalPart} DH</span></p>}
            <button type="button" onClick={() => setHideBalance(prev => !prev)} aria-label="Afficher ou masquer le solde" className="w-9 h-9 rounded-full flex items-center justify-center text-[#8E87A6]">{hideBalance ? <EyeOff size={21} /> : <Eye size={21} />}</button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3.5"><span className="w-2 h-2 rounded-full bg-[#5E1DF0]" /><span className="w-2 h-2 rounded-full bg-[#DED8F0]" /><span className="w-2 h-2 rounded-full bg-[#DED8F0]" /></div>
        </section>

        <section className="flex items-stretch gap-2.5">
          {[
            { label: 'Virement', Icon: Send }, { label: 'Factures', Icon: ReceiptText }, { label: 'Recharge', Icon: Smartphone }
          ].map(({ label, Icon }) => (
            <button key={label} type="button" onClick={() => info(`${label} : parcours bancaire non inclus dans la base visuelle.`)} className="flex-1 bg-white rounded-[24px] py-3.5 px-2 shadow-[0_8px_24px_rgba(94,29,240,0.05)] border border-[#F2EFFA] flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-all">
              <div className="w-11 h-11 rounded-full bg-[#F2EDFF] text-[#5E1DF0] flex items-center justify-center"><Icon size={19} /></div>
              <span className="text-[13px] font-bold text-[#14111F] whitespace-nowrap">{label}</span>
            </button>
          ))}
          <button type="button" onClick={() => navigate('MENU')} aria-label="Plus d'actions" className="w-14 bg-white rounded-[24px] shadow-[0_8px_24px_rgba(94,29,240,0.05)] border border-[#F2EFFA] flex items-center justify-center text-[#5E1DF0] shrink-0"><MoreHorizontal size={22} strokeWidth={2.4}/></button>
        </section>

        {/* New feature entry; keeps the familiar Home UI. */}
        <section className="card-simple p-5 space-y-3.5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-[#F2EDFF] text-[#5E1DF0] flex items-center justify-center shrink-0"><Users size={21} /></div>
            <div className="flex-1">
              <span className="text-[11px] font-semibold text-[#8000EB]">Votre espace familial</span>
              <h2 className="text-[18px] font-extrabold text-[#14111F] leading-tight mt-0.5">Ma famille</h2>
              <p className="text-[13px] text-[#7D7693] leading-relaxed mt-1">Retrouvez vos proches et les services bancaires de la famille au même endroit.</p>
            </div>
          </div>
          <SimpleButton onClick={() => navigate('FAMILY')}>Découvrir Ma famille <ArrowRight size={16} /></SimpleButton>
        </section>

        {/* Preserved PFM promotional asset, no PFM routes imported. */}
        <section aria-label="Découvrir mes finances" className="relative rounded-[28px] overflow-hidden bg-[#EEE5FB] p-5 border border-[#D2B4FE] shadow-[0_10px_28px_rgba(91,32,170,0.14)] min-h-[275px] flex flex-col justify-between">
          <img src="/assets/aistudio/pfm-discovery-banner.png" alt="" aria-hidden="true" className="absolute left-[-8.31%] top-[-6.96%] w-[116.91%] h-[121.61%] max-w-none pointer-events-none select-none" />
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="flex items-center gap-1.5 text-[#8000EB] text-[11.5px] font-semibold tracking-wide"><Sparkles size={13} className="text-[#8000EB]" /><span>Votre compagnon financier</span></div>
            <h2 className="mt-2.5 max-w-[190px] text-[17px] font-bold text-[#180A33] leading-[1.25] tracking-[-0.015em]">Votre solde ne raconte pas tout.</h2>
            <p className="my-auto py-3 max-w-[182px] text-[13px] font-normal text-[#62586F] leading-[1.44]">Et si on découvrait ensemble tout ce que vos finances peuvent vous permettre de réaliser ?</p>
          </div>
          <div className="relative z-10">
            <button type="button" onClick={() => navigate('FINANCE_INFO')} className="w-full h-[48px] rounded-full bg-[#8000EB] text-white transition-all flex items-center justify-center gap-2 text-[14px] font-semibold shadow-[0_4px_16px_rgba(128,0,235,0.25)]"><span>Découvrir mes finances</span><ArrowRight size={16} strokeWidth={2.4} /></button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1"><h2 className="text-[19px] font-extrabold text-[#14111F]">Mes opérations</h2><button type="button" onClick={() => info('Historique bancaire non inclus dans cette base UI.')} className="text-[13px] font-semibold text-[#5E1DF0] inline-flex items-center gap-1"><span>Voir plus</span><ChevronRight size={15} /></button></div>
          <div className="card-simple px-4 py-2 divide-y divide-[#F3EFFA]">
            {demoTransactions.map((tx) => <div key={tx.id} className="w-full py-3.5 flex items-center justify-between gap-3 text-left px-1">
              <div className="flex items-center gap-3.5 min-w-0"><TransactionIcon category={tx.category} /><div className="min-w-0"><p className="text-[14px] font-bold text-[#14111F] truncate">{tx.merchant}</p><p className="text-[12px] text-[#8E87A6] truncate mt-0.5">{tx.date} · {tx.category}</p></div></div>
              <span className="text-[14px] font-extrabold tabular-nums text-[#14111F] shrink-0">- {formatDH(tx.amount)}</span>
            </div>)}
          </div>
        </section>
      </div>
    </div>
  );
};
