import React from 'react';
import { ArrowRight, ChevronRight, CreditCard, PiggyBank, Users, Wallet } from 'lucide-react';
import { MobileHeader, SimpleBarsIcon, SimpleButton, type Navigate } from '../components/SimpleUI';
import { loadFamilyState } from '../family/model';
import { demoBalance, formatDH } from '../data/demoData';

export const MenuScreen: React.FC<{ navigate: Navigate }> = ({ navigate }) => (
  <div className="flex flex-col bg-simple-canvas min-h-full">
    <MobileHeader title="Menu" onBack={() => navigate('HOME')} />
    <div className="p-5 space-y-4">
      <section className="card-simple p-5 space-y-3">
        <div className="flex items-center gap-3.5"><div className="w-12 h-12 rounded-full bg-[#F2EDFF] text-[#5E1DF0] flex items-center justify-center"><Users size={24} /></div><div><span className="text-[11px] font-bold text-[#5E1DF0]">Services familiaux</span><h2 className="text-[17px] font-extrabold">Ma famille</h2><p className="text-[12px] text-[#7D7693]">Membres, comptes, pockets et épargne</p></div></div>
        <SimpleButton onClick={() => navigate('FAMILY')}>Ouvrir Ma famille <ArrowRight size={16}/></SimpleButton>
      </section>
      <section className="card-simple p-4 space-y-3">
        <div className="flex items-center gap-3.5"><div className="w-11 h-11 rounded-full bg-[#F2EDFF] flex items-center justify-center"><SimpleBarsIcon size={20}/></div><div><h2 className="text-[16px] font-bold">Mes finances</h2><p className="text-[12px] text-[#7D7693]">Accompagnement PFM (projet distinct)</p></div></div>
        <button type="button" onClick={() => navigate('FINANCE_INFO')} className="text-[#5E1DF0] font-bold text-sm flex items-center gap-1">En savoir plus <ChevronRight size={16}/></button>
      </section>
      <div className="card-simple p-3">
        {[
          { title: 'Comptes et pockets', Icon: Wallet },
          { title: 'Notre épargne', Icon: PiggyBank },
        ].map(({ title, Icon }) => <button type="button" key={title} onClick={() => navigate('FAMILY')} className="w-full py-3.5 px-2 flex gap-3 items-center text-left"><Icon size={19} className="text-[#5E1DF0]"/><span className="flex-1 text-[14px] font-bold">{title}</span><ChevronRight size={16} className="text-[#8E87A6]"/></button>)}
      </div>
    </div>
  </div>
);

export const CardsScreen: React.FC<{ navigate: Navigate }> = ({ navigate }) => (
  <div className="flex flex-col bg-simple-canvas min-h-full">
    <MobileHeader title="Mes cartes" onBack={() => navigate('HOME')} />
    <div className="p-5 space-y-4">
      <div className="rounded-[28px] bg-gradient-to-br from-[#290764] via-[#4612A8] to-[#5E1DF0] p-6 text-white shadow-[0_14px_30px_rgba(94,29,240,0.22)]">
        <div className="flex justify-between items-center"><span className="text-xs font-semibold text-[#E9D5FF]">Simple Visa Platinum</span><CreditCard size={22}/></div>
        <p className="text-lg font-mono tracking-widest mt-6">•••• •••• •••• 4821</p>
        <div className="flex items-end justify-between mt-6 pt-4 border-t border-white/15 text-xs"><div><span className="text-white/70 block text-[10px]">Titulaire fictif</span><strong>LAMIA BENNANI</strong></div><div className="text-right"><span className="text-white/70 block text-[10px]">Solde affiché</span><strong>{formatDH(loadFamilyState().families.flatMap(f=>f.members).find(m=>m.id==='lamia')?.simpleBalance ?? demoBalance)}</strong></div></div>
      </div>
      <div className="card-simple p-5"><p className="text-sm text-[#7D7693]">La gestion réelle des cartes reste hors du périmètre de cette base UI.</p></div>
      <SimpleButton onClick={() => navigate('FAMILY')}>Accéder à Ma famille <ArrowRight size={16}/></SimpleButton>
    </div>
  </div>
);
