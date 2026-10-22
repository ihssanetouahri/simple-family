import React from 'react';
import { ArrowRight } from 'lucide-react';
import { MobileHeader, SimpleButton, type Navigate } from '../components/SimpleUI';
import { FamilyExperience } from '../family/FamilyExperience';

/** Full interactive local prototype of Simple Family. */
export const FamilyBaseScreen: React.FC<{navigate:Navigate}> = ({navigate}) => <FamilyExperience navigate={navigate}/>;

export const FinancePlaceholderScreen: React.FC<{ navigate: Navigate }> = ({ navigate }) => (
  <div className="flex flex-col min-h-full bg-simple-canvas">
    <MobileHeader title="Mes finances" onBack={() => navigate('HOME')} />
    <div className="px-5 py-6 space-y-4">
      <div className="card-simple p-6 space-y-3">
        <h2 className="text-xl font-extrabold text-[#14111F]">PFM : prototype distinct</h2>
        <p className="text-sm text-[#7D7693] leading-relaxed">L’expérience PFM complète n’est pas importée dans cette base légère. Elle reste dans votre projet Simple PFM d’origine.</p>
        <p className="text-sm text-[#7D7693] leading-relaxed">Nous définirons ensemble les passerelles Famille ↔ PFM une fois les parcours Famille conçus.</p>
      </div>
      <SimpleButton onClick={() => navigate('FAMILY')}>Revenir à Ma famille <ArrowRight size={16} /></SimpleButton>
    </div>
  </div>
);
