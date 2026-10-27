import React from 'react';
import { Gift, Plus, Target } from 'lucide-react';

type Props = { kind:'goal'|'pot'; onCreate:()=>void };

/** Dernière carte du carrousel : visuellement distincte des projets déjà créés. */
export function FamilyCreateCarouselCard({kind,onCreate}:Props) {
 const isGoal=kind==='goal';
 const title=isGoal?'Un nouveau projet en tête ?':'Un projet à partager ?';
 const description=isGoal
  ?'Épargnez pour ce qui compte pour vous.'
  :'Rassemblez vos proches autour d’une cagnotte.';
 const buttonLabel=isGoal?'Créer un objectif':'Créer une cagnotte';
 const Icon=isGoal?Target:Gift;
 return <button type="button" onClick={onCreate}
   aria-label={buttonLabel}
   className="family-hover-card group shrink-0 snap-start w-[264px] min-h-[316px] rounded-[27px] border border-dashed border-[#D8C4F5] bg-[#F8F5FF] p-5 text-center shadow-[0_5px_16px_rgba(72,30,132,0.035)] flex flex-col items-center justify-center gap-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8000EB]">
   <span className="w-[62px] h-[62px] rounded-full bg-[#EBDEFF] text-[#752BDC] flex items-center justify-center transition-transform group-hover:scale-105">
     <Icon size={25} strokeWidth={1.9}/>
   </span>
   <span className="flex flex-col items-center gap-2">
     <span className="font-extrabold text-[15px] leading-[1.35] text-[#32194F]">{title}</span>
     <span className="text-[12px] leading-[1.5] text-[#756688]">{description}</span>
   </span>
   <span className="inline-flex items-center justify-center gap-2 rounded-full bg-[#7129D7] text-white text-[12px] font-bold px-4 min-h-[41px] transition-colors group-hover:bg-[#5C19B9]">
     <Plus size={16}/> {buttonLabel}
   </span>
 </button>;
}
