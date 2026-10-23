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
