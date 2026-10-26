// Recette UX 3 : carrousels, avatar +N, suggestions et catalogue.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const read=(p)=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const carouselFile='src/family/components/FamilyPreviewCarousel.tsx';
const carouselSource=read(carouselFile);
const compiled=ts.transpileModule(carouselSource,{compilerOptions:{
 module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true
}}).outputText;
const mod={exports:{}};
vm.runInNewContext(compiled,{module:mod,exports:mod.exports,
 require:(id)=>{'use strict';if(id==='react')return React;if(id==='react/jsx-runtime')return require('react/jsx-runtime');
 throw Error('Unexpected dependency '+id);}}, {filename:carouselFile});
const Carousel=mod.exports.FamilyPreviewCarousel;
assert.equal(typeof Carousel,'function');
const node=(n)=>React.createElement('div',{key:n,'data-card':n},'Card '+n);
const render=(n)=>renderToStaticMarkup(React.createElement(Carousel,{
 label:'Projets d’épargne, faire défiler horizontalement'
},...Array.from({length:n},(_,i)=>node(i))));
const one=render(1),two=render(2),three=render(3);
assert(one.includes('Card 0'));
assert(!one.includes('Afficher la carte 1 sur 1'),'No irrelevant dots for one item');
assert(two.includes('Afficher la carte 1 sur 2'));
assert(two.includes('Afficher la carte 2 sur 2'));
assert(two.includes('1/2'),'Show current position');
assert(!two.includes('Afficher la carte 3 sur 3'));
assert(three.includes('Afficher la carte 3 sur 3'));
assert(three.includes('1/3'));
assert(carouselSource.includes('onScroll={onScroll}'),'Touch swipes must update the current dot');
assert(carouselSource.includes('scrollTo('),'Indicator buttons must navigate');
assert(carouselSource.includes('aria-current={index===i'),'Current position must be exposed');

const ui=read('src/family/FamilyExperience.tsx');
const occurrences=(value)=>ui.split(value).length-1;
assert.equal(occurrences('<FamilyPreviewCarousel label='),2,'Only savings and pot Home previews are enhanced');
assert.equal(occurrences('</FamilyPreviewCarousel>'),2);
assert(ui.includes("visibleGoals.filter(g=>g.status==='active').slice(0,2)"));
assert(ui.includes("family.pots.filter(p=>p.status==='active').slice(0,2)"));
assert(ui.includes('family.members.length>3&&<button'),'Do not show +N with exactly three members');
assert(ui.includes('+{family.members.length-3}'),'Extra avatar number must match hidden members');
assert(ui.includes("onClick={()=>mainGo('members')}"),'Extra member badge must open members');
assert(ui.includes('Pour votre famille'));
assert(ui.includes('>Tous les services</h2>'));
assert(ui.includes('serviceLinks.slice(0,showAllServiceSuggestions?serviceLinks.length:2)'));
assert(ui.includes("label:'Autres',icon:MoreHorizontal"),'Home service shortcuts remain intact');
const suggestions=read('src/family/services/serviceLinks.ts');
assert(!suggestions.includes("id:'chat:family'"),'Generic chat no longer repeated in suggestions');
assert(ui.includes('title="Chat Famille"'),'Chat remains available in full catalog');
for(const p of [carouselFile,'src/family/FamilyExperience.tsx']){
 const parsed=ts.createSourceFile(p,read(p),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.equal(parsed.parseDiagnostics.length,0,p+': '+parsed.parseDiagnostics.map(e=>ts.flattenDiagnosticMessageText(e.messageText,' ')).join('; '));
}
const snapshot=read('scripts/snapshots/family-hero.tsx.snap');
const marker='<section className="relative min-h-[212px]';
const start=ui.indexOf(marker),end=ui.indexOf('</section>',start);
assert.equal(ui.slice(start,end+'</section>'.length),snapshot,'All other hero markup must remain protected');
console.log('OK — dots/carousel, +N members, clearer services, protected Hero and TSX.');
