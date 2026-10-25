// No application server or bank connection needed. Runs after npm install.
const fs=require('fs'), path=require('path'), vm=require('vm'), assert=require('assert');
const ts=require('typescript');
const modelSource=fs.readFileSync(path.join(__dirname,'../src/family/model.ts'),'utf8');
const compiled=ts.transpileModule(modelSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const moduleObject={exports:{}};
vm.runInNewContext(compiled,{module:moduleObject,exports:moduleObject.exports,localStorage:{getItem:()=>null}}, {filename:'family/model.js'});
const m=moduleObject.exports;
const demo=m.createDemoState();
const f=demo.families[0];
assert.strictEqual(f.name,'Notre famille');
assert.strictEqual(demo.viewerId,'lamia');
assert.strictEqual(f.members.filter(member=>member.role==='leader').length,1);
assert.strictEqual(f.members.length,3);
assert.strictEqual(f.pockets.length,f.members.length,'Chaque membre a un pocket');
assert.strictEqual(f.account.balance,6450);
assert.strictEqual(f.joint,null,'Compte joint optionnel');
assert.deepStrictEqual(Array.from(f.jointHolderIds||[]),[],'Aucun cotitulaire de compte joint initial');
assert.strictEqual(f.jointApplication,null,'Pas de demande initiale');
assert.strictEqual(f.alerts.length,1,'Une facture familiale fictive');
assert.strictEqual(f.invites.length,1,'Une invitation fictive');
assert(m.canSeePocket(f,'lamia','yasmine'));
assert(!m.canSeePocket(f,'yasmine','lamia'));
assert(!m.isAdmin(f,'yasmine'));
assert(m.isAdmin(f,'karim'));
assert(f.accountViewIds.includes('karim'));
assert(!f.accountViewIds.includes('yasmine'));
assert.strictEqual(f.goals[0].balance,4500);
assert.strictEqual(m.moneyValid(300),true);
assert.strictEqual(m.moneyValid(-50),false);
console.log('OK — modèle initial, droits, pockets, comptes, épargne et montants vérifiés.');
// Vérifie aussi que les nouveaux écrans TSX se parsèment correctement.
for (const name of ['AccountJourneys.tsx','FamilyExperience.tsx']) {
 const file=path.join(__dirname,'../src/family',name);
 const source=fs.readFileSync(file,'utf8');
 const parsed=ts.createSourceFile(name,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.strictEqual(parsed.parseDiagnostics.length,0,
  name+' — '+parsed.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('; '));
}
const familyScreen=fs.readFileSync(path.join(__dirname,'../src/family/FamilyExperience.tsx'),'utf8');
assert(familyScreen.includes("mainGo('sub-account')")&&familyScreen.includes("mainGo('joint-account')"),'Les deux cartes possèdent leurs parcours dédiés');
assert(familyScreen.includes("label:'Autres',icon:MoreHorizontal"),'Raccourci Autres conservé');
assert(!familyScreen.includes('selectorOpen&&<Panel'),'Le sélecteur Mes familles ne doit plus pousser la page');
console.log('OK — parcours dédiés, données de démonstration, routes et syntaxe TSX contrôlés.');


// FAMILY UX V2: protect the existing Home and ensure the demo resets on refresh.
const heroSnapshotFile=path.join(__dirname,'snapshots/family-hero.tsx.snap');
const marker='<section className="relative min-h-[212px]';
const start=familyScreen.indexOf(marker),end=familyScreen.indexOf('</section>',start);
assert(start>=0&&end>start,'Carte Notre famille manquante');
assert.strictEqual(familyScreen.indexOf(marker,start+1),-1,'La carte Notre famille doit être unique');
const heroMarkup=familyScreen.slice(start,end+'</section>'.length).replace(/\r\n/g,'\n');
const heroBaseline=fs.readFileSync(heroSnapshotFile,'utf8').replace(/\r\n/g,'\n');
assert.strictEqual(heroMarkup,heroBaseline,'Régression visuelle possible : la carte Notre famille a changé sans validation');

const homeStart=familyScreen.indexOf("{route==='dashboard' && <>");
const homeEnd=familyScreen.indexOf("{route==='alerts'&&<>",homeStart);
assert(homeStart>=0&&homeEnd>homeStart,'Le corps de la Home est introuvable');
const home=familyScreen.slice(homeStart,homeEnd);
const homeSections=['À suivre en famille','Comptes partagés','Pockets des membres',
 'Nos projets d’épargne','Nos cagnottes','Services familiaux'];
let cursor=-1;
for (const title of homeSections) {
 const at=home.indexOf(title,cursor+1);
 assert(at>cursor,'Section Home manquante ou déplacée : '+title);
 cursor=at;
}
assert(home.includes("mainGo('sub-account')")&&home.includes("mainGo('joint-account')"),'Accès aux deux comptes absents');
assert(home.includes("label:'Autres',icon:MoreHorizontal"),'Raccourci Autres absent');
assert(familyScreen.includes('id="family-selector-menu"'),'Le dropdown Mes familles manque');
assert(!familyScreen.includes('{selectorOpen&&<Panel'),'Le sélecteur Mes familles ne doit pas pousser le contenu');
assert(familyScreen.includes('onBack={handleBack}'),'La navigation Retour doit suivre les écrans précédents');

const accountScreen=fs.readFileSync(path.join(__dirname,'../src/family/AccountJourneys.tsx'),'utf8');
assert(accountScreen.includes('React.useImperativeHandle(ref,()=>({goBack}))'),
 'Retour depuis les sous-écrans des comptes non exposé à la navigation');
for (const view of ['overview','coholder','terms','opening','money','review','history','members','cards']) {
 assert(accountScreen.includes("view==='"+view+"'"),'Écran Compte manquant : '+view);
}
assert.strictEqual(f.account.label,'Sous-compte Famille','Le nom du sous-compte doit rester exact');
assert(f.cards.some(c=>c.holderId==='yasmine'),'Carte de Yasmine manquante');
assert(f.goals.some(g=>g.title==='Vacances en famille'),'Projet Vacances en famille manquant');
assert(f.pots.some(p=>p.title==='Anniversaire de Yasmine'),'Cagnotte familiale manquante');

function loadFreshModel() {
 const instance={exports:{}};
 const fakeStorage={removedKeys:[],removeItem(key){this.removedKeys.push(key);}};
 vm.runInNewContext(compiled,{
  module:instance,exports:instance.exports,localStorage:fakeStorage,structuredClone
 },{filename:'family/model.js'});
 return {api:instance.exports,storage:fakeStorage};
}
const session=loadFreshModel();
const initial=session.api.loadFamilyState();
assert.strictEqual(initial.families[0].account.balance,6450,'État démo initial erroné');
initial.families[0].account.balance=123;
session.api.saveFamilyState(initial);
assert.strictEqual(session.api.loadFamilyState().families[0].account.balance,123,
 'Les modifications doivent rester pendant la navigation');
const refreshed=loadFreshModel().api.loadFamilyState();
assert.strictEqual(refreshed.families[0].account.balance,6450,
 'Après F5, les données doivent revenir au scénario initial');
assert(session.storage.removedKeys.includes(session.api.STORE_KEY),
 'Les anciennes données locales doivent être invalidées');

console.log('OK — protection Notre famille, Home, navigation et remise à zéro F5.');
