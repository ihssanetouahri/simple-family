import React from 'react';
import { ArrowLeft, Bell, CreditCard, Home, Menu, Sparkles } from 'lucide-react';

export type Screen = 'HOME' | 'MENU' | 'CARDS' | 'FAMILY' | 'FINANCE_INFO';
export type Navigate = (screen: Screen) => void;

export const SimpleBarsIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#5E1DF0' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="13" width="4" height="7" rx="2" fill={color} />
    <rect x="10" y="9" width="4" height="11" rx="2" fill={color} />
    <rect x="16" y="4" width="4" height="16" rx="2" fill={color} />
  </svg>
);

export const SimpleRobotIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path d="M13.5 4.5V7.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="13.5" cy="3.8" r="1.3" fill={color} />
    <rect x="5.5" y="8" width="16" height="13" rx="6.5" stroke={color} strokeWidth="2" />
    <circle cx="10.8" cy="14" r="1.4" fill={color} /><circle cx="16.2" cy="14" r="1.4" fill={color} />
    <path d="M11.2 17.2C12 18 15 18 15.8 17.2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M22.5 4.5V8.5M20.5 6.5H24.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const MobileHeader: React.FC<{ title: string; subtitle?: string; onBack: () => void }> = ({ title, subtitle, onBack }) => (
  <header className="sticky top-0 z-30 bg-[#F6F3FE]/85 backdrop-blur-md px-5 pt-3 pb-2.5 flex items-center justify-between">
    <div className="flex items-center gap-2.5 min-w-0">
      <button type="button" onClick={onBack} aria-label="Retour" className="w-10 h-10 rounded-full bg-white shadow-[0_4px_14px_rgba(20,17,31,0.06)] flex items-center justify-center text-[#14111F]"><ArrowLeft size={20} /></button>
      <div><h1 className="text-[18px] font-bold text-[#14111F] leading-tight">{title}</h1>{subtitle && <p className="text-[12px] text-[#7D7693] mt-0.5">{subtitle}</p>}</div>
    </div>
    <button type="button" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm" aria-label="Notifications" title="Notifications - maquette" disabled><Bell size={18} /></button>
  </header>
);

export const BottomBankingNav: React.FC<{ screen: Screen; navigate: Navigate }> = ({ screen, navigate }) => {
  const navItems = [
    { label: 'Accueil', screen: 'HOME' as Screen, Icon: Home },
    { label: 'Cartes', screen: 'CARDS' as Screen, Icon: CreditCard },
    { label: 'Menu', screen: 'MENU' as Screen, Icon: Menu },
  ];
  return (
    <div className="sticky bottom-0 left-0 right-0 z-30 pt-2 mt-auto">
      <nav className="relative bg-white/95 backdrop-blur-md rounded-t-[30px] shadow-[0_-8px_30px_rgba(20,17,31,0.06)] border-t border-[#F0ECF9] h-[74px] pl-6 pr-24 grid grid-cols-3 items-center">
        {navItems.map(({ label, screen: target, Icon }) => {
          const active = screen === target;
          return <button type="button" key={target} onClick={() => navigate(target)} className={`flex flex-col items-center justify-center min-h-[48px] transition-colors ${active ? 'text-[#5E1DF0]' : 'text-[#8E87A6]'}`}>
            <Icon size={22} strokeWidth={active ? 2.4 : 1.9} fill={target === 'HOME' && active ? '#5E1DF0' : 'none'} />
            <span className="text-[11px] font-semibold mt-1">{label}</span>
            {active && <span className="w-1.5 h-1.5 rounded-full bg-[#5E1DF0] mt-0.5" />}
          </button>;
        })}
        <button type="button" onClick={() => navigate('FINANCE_INFO')} aria-label="Ouvrir le Coach financier" title="Coach financier (projet PFM distinct)" className="absolute -top-3 right-5 w-14 h-14 rounded-full bg-gradient-to-br from-[#834BFF] via-[#6222F5] to-[#4A12D4] text-white shadow-[0_10px_24px_rgba(94,29,240,0.42)] border-2 border-white flex items-center justify-center active:scale-95 transition-all">
          <SimpleRobotIcon size={27} color="#FFFFFF" />
        </button>
      </nav>
    </div>
  );
};

export const SimpleFeatureIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="w-11 h-11 rounded-full bg-[#F2EDFF] text-[#5E1DF0] flex items-center justify-center shrink-0">{children}</div>;
export const SimpleButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', children, ...rest }) => (
  <button type="button" className={`btn-simple-primary w-full h-[48px] text-[14px] font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.99] ${className}`} {...rest}>{children}</button>
);

/** Simple original cards and pill tokens remain defined in src/index.css. */
export const SimpleInfoLabel: React.FC = () => <span className="text-[11px] font-semibold text-[#8000EB] flex items-center gap-1"><Sparkles size={13} /> Nouvel espace Simple</span>;
