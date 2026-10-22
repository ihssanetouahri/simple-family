import React, { useEffect, useState } from 'react';
import { BottomBankingNav, type Screen } from './components/SimpleUI';
import { BankingHomeScreen } from './screens/Home';
import { FamilyBaseScreen, FinancePlaceholderScreen } from './screens/Family';
import { MenuScreen, CardsScreen } from './screens/MenuAndCards';

const PrototypeShell: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('HOME');
  const navigate = (target: Screen) => setScreen(target);
  useEffect(() => {
    const scrollable = document.getElementById('simple-scroll-area');
    if (scrollable) scrollable.scrollTop = 0;
  }, [screen]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EFEBF9] via-[#F7F5FC] to-[#EAE3FA] flex items-center justify-center lg:px-8">
      <div id="simple-device-frame" className="w-full sm:w-[412px] sm:my-6 sm:rounded-[52px] sm:border-[11px] sm:border-[#1D1B24] sm:shadow-[0_28px_70px_rgba(20,17,31,0.22)] bg-[#F7F4FE] relative overflow-hidden [transform:translateZ(0)] flex flex-col h-[100dvh] sm:h-[868px]">
        <div className="hidden sm:flex items-center justify-between px-8 pt-3 pb-2 bg-[#F4EEFF] text-[13px] font-bold text-[#14111F] select-none shrink-0 z-40">
          <span>9:41</span>
          <div className="w-[114px] h-[30px] bg-black rounded-full flex items-center justify-end pr-3"><span className="w-2.5 h-2.5 bg-[#16192B] rounded-full ring-1 ring-white/10" /></div>
          <div className="flex items-center gap-1.5"><svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor" aria-hidden="true"><rect x="0" y="7" width="2.5" height="4" rx="0.8"/><rect x="4" y="5" width="2.5" height="6" rx="0.8"/><rect x="8" y="2.5" width="2.5" height="8.5" rx="0.8"/><rect x="12" y="0" width="2.5" height="11" rx="0.8"/></svg><div className="w-6 h-3 rounded-[4px] border border-[#14111F]/50 p-0.5"><div className="w-full h-full bg-[#14111F] rounded-[2px]" /></div></div>
        </div>
        <main id="simple-scroll-area" className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col bg-simple-canvas">
          {screen === 'HOME' && <BankingHomeScreen navigate={navigate} />}
          {screen === 'MENU' && <MenuScreen navigate={navigate} />}
          {screen === 'CARDS' && <CardsScreen navigate={navigate} />}
          {screen === 'FAMILY' && <FamilyBaseScreen navigate={navigate} />}
          {screen === 'FINANCE_INFO' && <FinancePlaceholderScreen navigate={navigate} />}
          <BottomBankingNav screen={screen} navigate={navigate} />
        </main>
      </div>
    </div>
  );
};

export default function App() { return <PrototypeShell />; }
