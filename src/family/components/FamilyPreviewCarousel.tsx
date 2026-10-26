import React, { useEffect, useRef, useState } from 'react';

type Props={children:React.ReactNode;label:string};

/** Aperçu tactile avec indicateurs de position, sans remplacer les cartes existantes. */
export function FamilyPreviewCarousel({children,label}:Props) {
 const items=React.Children.toArray(children);
 const count=items.length;
 const ref=useRef<HTMLDivElement>(null);
 const [index,setIndex]=useState(0);
 useEffect(()=>{setIndex(0);if(ref.current)ref.current.scrollLeft=0;},[count]);
 const select=(position:number)=>{
   const element=ref.current;
   if(!element)return;
   const last=Math.max(0,element.scrollWidth-element.clientWidth);
   const next=Math.min(count-1,Math.max(0,position));
   element.scrollTo({left:count>1?last*next/(count-1):0,behavior:'smooth'});
   setIndex(next);
 };
 const onScroll=(event:React.UIEvent<HTMLDivElement>)=>{
   const el=event.currentTarget;
   const max=Math.max(0,el.scrollWidth-el.clientWidth);
   setIndex(count>1&&max>0?Math.min(count-1,Math.round((el.scrollLeft/max)*(count-1))):0);
 };
 return <div className="space-y-2">
   <div ref={ref} onScroll={onScroll}
     className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth overscroll-x-contain no-scrollbar pb-3 -mx-1 px-1"
     aria-label={label} aria-roledescription="carrousel">
     {items}
   </div>
   {count>1&&<div className="flex items-center justify-center gap-1.5" aria-label={`Navigation du carrousel : ${label}`}>
     {items.map((_,i)=><button type="button" key={i}
       onClick={()=>select(i)}
       aria-label={`Afficher la carte ${i+1} sur ${count} : ${label}`}
       aria-current={index===i?'true':undefined}
       className="min-w-[25px] min-h-[25px] flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6B2CD2]">
       <span className={`block rounded-full h-1.5 transition-all ${index===i?'w-[18px] bg-[#722DDD]':'w-1.5 bg-[#D8C9E9]'}`}/>
     </button>)}
     <span className="ml-1 text-[10px] font-semibold tabular-nums text-[#8D8099]" aria-live="polite">{index+1}/{count}</span>
   </div>}
  </div>;
}
