// QA — last cards create savings goal and family pot in Home previews.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const ui=read('src/family/FamilyExperience.tsx');
const createFile='src/family/components/FamilyCreateCarouselCard.tsx';
const card=read(createFile);
const carousel=read('src/family/components/FamilyPreviewCarousel.tsx');
const goalStart=ui.indexOf('<Heading title="Nos projets d’épargne"');
const potStart=ui.indexOf('<Heading title="Nos cagnottes"');
const next=ui.indexOf('<Heading title="Services familiaux"',potStart);
assert(goalStart>=0&&potStart>goalStart&&next>potStart);
const goals=ui.slice(goalStart,potStart),pots=ui.slice(potStart,next);
assert(goals.includes('<FamilyPreviewCarousel label="Projets d’épargne'));
assert(pots.includes('<FamilyPreviewCarousel label="Cagnottes'));
const goalContents=goals.slice(goals.indexOf('<FamilyPreviewCarousel'),goals.indexOf('</FamilyPreviewCarousel>'));
const potContents=pots.slice(pots.indexOf('<FamilyPreviewCarousel'),pots.indexOf('</FamilyPreviewCarousel>'));
assert(goalContents.indexOf('<FamilyProgressPhotoCard')<goalContents.indexOf('<FamilyCreateCarouselCard'),
  'Goal action must come last');
assert(potContents.indexOf('<FamilyProgressPhotoCard')<potContents.indexOf('<FamilyCreateCarouselCard'),
  'Pot action must come last');
assert(goalContents.includes("visibleGoals.filter(g=>g.status==='active').slice(0,2)"),
  'Existing goal card order unchanged');
assert(potContents.includes("family.pots.filter(p=>p.status==='active').slice(0,2)"),
  'Existing pot card order unchanged');
assert(goalContents.includes('viewer&&<FamilyCreateCarouselCard key="create-goal" kind="goal"'));
assert(potContents.includes('viewer&&<FamilyCreateCarouselCard key="create-pot" kind="pot"'));
assert(goalContents.includes("launch('new-goal',{owner:data.viewerId,deadline:'2027-07-15',contributors:admin?family.members.map(m=>m.id).join(','):data.viewerId})"),
 'Existing goal form and initial permissions preserved');
assert(potContents.includes("onCreate={()=>launch('new-pot')}"),'Existing pot form preserved');
assert(goals.includes("onClick={()=>mainGo('savings')}"),'See all goals remains');
assert(pots.includes("onClick={()=>mainGo('pots')}"),'See all pots remains');
assert(card.includes('shrink-0 snap-start w-[264px]'), 'Match existing cards width');
assert(card.includes('min-h-[316px]'));
assert(card.includes('border-dashed')&&card.includes('bg-[#F8F5FF]'));
assert(card.includes('<button type="button" onClick={onCreate}'));
assert(carousel.includes('React.Children.toArray(children)'), 'Create card is included in dot count');
assert(carousel.includes('itemPositions(element)'), 'Navigate dots to individual card positions');
assert(carousel.includes('count>1&&'), 'Hide lone card indicator');
const compiled=ts.transpileModule(card,{compilerOptions:{
 module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true
}}).outputText;
const mod={exports:{}};
vm.runInNewContext(compiled,{module:mod,exports:mod.exports,
 require:(id)=>id==='react'?React:id==='react/jsx-runtime'?require('react/jsx-runtime'):
 id==='lucide-react'?require('lucide-react'):(()=>{throw Error('Unexpected module '+id)})()
},{filename:createFile});
const Component=mod.exports.FamilyCreateCarouselCard;
for(const entry of [['goal','Créer un objectif'],['pot','Créer une cagnotte']]){
 const kind=entry[0],cta=entry[1];
 const html=renderToStaticMarkup(React.createElement(Component,{kind,onCreate:()=>{}}));
 assert(html.includes(cta),'Visible CTA for '+kind);
 assert(html.includes('aria-label="'+cta+'"'),'Accessible CTA for '+kind);
 assert(html.includes('snap-start w-[264px]'));
 assert(html.includes('border-dashed'));
}
for(const file of [createFile,'src/family/FamilyExperience.tsx','src/family/components/FamilyPreviewCarousel.tsx']){
 const tree=ts.createSourceFile(file,read(file),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.equal(tree.parseDiagnostics.length,0,'TSX parse '+file);
}
const hero=read('scripts/snapshots/family-hero.tsx.snap'),marker='<section className="relative min-h-[212px]';
const i=ui.indexOf(marker),j=ui.indexOf('</section>',i);
assert.equal(ui.slice(i,j+'</section>'.length),hero,'Protected Home hero unchanged');
console.log('OK — last-card creation, existing flows, visuals, carousel indicators and Home protections.');
