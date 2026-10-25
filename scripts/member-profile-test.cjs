// Vérifie les sélecteurs de profils sans afficher les données privées d'un autre membre.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function compile(filename,deps={}) {
 const s=fs.readFileSync(path.join(__dirname,'..',filename),'utf8');
 const js=ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};
 vm.runInNewContext(js,{module:mod,exports:mod.exports,structuredClone,localStorage:{removeItem(){}},
  require:(name)=>{if(!Object.hasOwn(deps,name))throw Error('Unexpected dependency '+name);return deps[name];}
 },{filename});
 return mod.exports;
}
const model=compile('src/family/model.ts');
const permissions=compile('src/family/permissions.ts',{'./model':model});
const selectors=compile('src/family/members/memberSelectors.ts',{
 '../model':model,'../permissions':permissions
});
const family=model.createDemoState().families[0];
const act=selectors.getMemberPocketMovements;
const cards=selectors.getMemberVisibleCards;
const goals=selectors.getMemberVisibleGoals;

assert.equal(act(family,'lamia','yasmine').length,1,'Lamia voit le mouvement initial de Yasmine');
assert.equal(act(family,'lamia','yasmine')[0].signedAmount,300);
assert.equal(act(family,'yasmine','lamia').length,0,'Yasmine ne voit pas la pocket de Lamia');
assert.equal(act(family,'unknown','yasmine').length,0);
assert.equal(cards(family,'yasmine','yasmine').length,1);
assert.equal(cards(family,'yasmine','lamia').length,0,'Carte Lamia masquée pour Yasmine');
assert.equal(cards(family,'lamia','yasmine').length,1);
assert(goals(family,'lamia','yasmine').some(g=>g.title==='Études de Yasmine'));
assert(goals(family,'yasmine','yasmine').some(g=>g.id==='goal_school'));
assert(!goals(family,'yasmine','lamia').some(g=>g.id==='goal_vac'));

// Le filtre ne doit pas dévoiler des dépenses faites avec un compte familial
// simplement parce que le libellé contient le prénom du membre.
family.transactions.push({id:'outside',date:'21 oct.',title:'Yasmine sorties',amount:-100,
 category:'Loisirs',source:'Sous-compte Famille',target:'Café'});
assert(!act(family,'lamia','yasmine').some(t=>t.id==='outside'));

family.transactions.unshift({id:'outgoing',date:'22 oct.',title:'Paiement pocket',amount:50,
 category:'Achats',source:'pocket:yasmine',target:'external'});
const outgoing=act(family,'lamia','yasmine').find(x=>x.id==='outgoing');
assert.equal(outgoing.signedAmount,-50,'Débit de pocket affiché négatif');
assert.equal(act(family,'yasmine','yasmine').find(x=>x.id==='outgoing').signedAmount,-50);

// Cartes multi-membres : seul le titulaire ou responsable doit voir la carte.
family.cards.push({id:'c_private',label:'Carte pocket Karim',last4:'1234',holderId:'karim',
 source:'pocket:karim',active:true});
assert.equal(cards(family,'yasmine','karim').length,0);
assert(cards(family,'karim','karim').some(c=>c.id==='c_private'));
assert(cards(family,'lamia','karim').some(c=>c.id==='c_private'));

// Vérification de câblage des parcours, sans imposer de changement à la Home.
const familyUi=fs.readFileSync(path.join(__dirname,'../src/family/FamilyExperience.tsx'),'utf8');
assert(familyUi.includes("route==='member' && owner && <MemberProfile"),'Nouvelle route profil absente');
assert(familyUi.includes("navigateToMemberProfile(m.id)"),'Voir les membres doit ouvrir le profil');
assert(familyUi.includes("const navigateToMember=(id:string)=>{setSelectedMember(id);go('pocket')}"),
 'Entrées pocket existantes à préserver');
assert(familyUi.includes("getMemberVisibleCards(family,data.viewerId,cardsMemberFilter)"),
 'La page de cartes doit filtrer sur le membre sélectionné');
assert(familyUi.includes("const stackedAccountRoute=[...stack].reverse().find(isAccountRoute)||null;"),
 'La navigation interne des comptes doit survivre au détour par les fiches membres');

console.log('OK — profils Lamia/Karim/Yasmine, activité pocket, cartes, objectifs, confidentialité et navigation.');
