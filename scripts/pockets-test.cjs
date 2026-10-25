// Pocket/card UX V2: authorization, simulated debit ceilings and navigation.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function source(name) {return fs.readFileSync(path.join(__dirname,'..',name),'utf8');}
function compile(name,deps={}) {
 const js=ts.transpileModule(source(name),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
 }).outputText;
 const mod={exports:{}};
 vm.runInNewContext(js,{
  module:mod,exports:mod.exports,structuredClone,localStorage:{removeItem(){}},
  require:(id)=>{if(!Object.hasOwn(deps,id))throw Error('unexpected import '+id);return deps[id];}
 },{filename:name});
 return mod.exports;
}
const model=compile('src/family/model.ts');
const permissions=compile('src/family/permissions.ts',{'./model':model});
const pockets=compile('src/family/pockets/pocketRules.ts',{'../permissions':permissions});
const family=model.createDemoState().families[0];
const debit=(who,source,amount)=>pockets.validatePocketDebit(family,who,source,amount);
assert(debit('yasmine','pocket:yasmine',100).ok,'Member can move funds within own pocket');
assert(!debit('yasmine','pocket:karim',100).ok,'Simple One cannot debit another member');
assert(!debit('unknown','pocket:yasmine',100).ok,'Non-member cannot debit');
assert(!debit('lamia','pocket:yasmine',601).ok,'Pocket transfer ceiling applies to parents too');
assert(debit('lamia','pocket:lamia',600).ok,'Amount below demo limit and balance succeeds');
assert(!debit('lamia','pocket:lamia',1900).ok,'Cannot debit more than balance');
assert(!debit('lamia','pocket:lamia',0).ok,'Zero invalid');
assert(!debit('lamia','pocket:lamia',NaN).ok,'Non-finite amount invalid');
assert(debit('lamia','account',5000).ok,'Pocket ceiling cannot block other account journeys');
// Isolate the ceiling from insufficient-balance checks.
const pocket=family.pockets.find(p=>p.ownerId==='yasmine');
pocket.balance=1000;
assert(!debit('yasmine','pocket:yasmine',650).ok,'Configured ceiling enforced separately from balance');
assert(debit('yasmine','pocket:yasmine',600).ok,'Exact ceiling allowed');
pocket.limit=250;
assert(!debit('yasmine','pocket:yasmine',251).ok,'Adjusted ceiling takes effect');
assert(debit('yasmine','pocket:yasmine',250).ok);
assert.equal(pockets.pocketSupervision(family,'yasmine','lamia').accessible,false);
assert.equal(pockets.pocketSupervision(family,'lamia','yasmine').isSimpleOne,true);
assert.equal(pockets.pocketSupervision(family,'lamia','yasmine').ceiling,250);

// Holder/source consistency, distinct from generic administrator privileges.
assert(permissions.canIssueFamilyCard(family,'lamia','pocket:yasmine','yasmine'));
assert(!permissions.canIssueFamilyCard(family,'yasmine','pocket:yasmine','yasmine'));
assert(!permissions.canIssueFamilyCard(family,'lamia','pocket:yasmine','lamia'));
assert(!permissions.canIssueFamilyCard(family,'lamia','family','yasmine'));
assert(permissions.canIssueFamilyCard(family,'karim','family','karim'));
assert(!permissions.canIssueFamilyCard(family,'lamia','joint','lamia'));
assert(!permissions.canIssueFamilyCard(family,'lamia','unknown','lamia'));
family.joint={id:'j1',label:'Compte joint',balance:0,limit:9000};
family.jointHolderIds=['lamia','karim'];
assert(permissions.canIssueFamilyCard(family,'lamia','joint','karim'));
family.jointHolderIds=['karim'];
assert(!permissions.canIssueFamilyCard(family,'lamia','joint','karim'),
 'Cannot issue joint card unless requester is coholder');

const ui=source('src/family/FamilyExperience.tsx');
assert(ui.includes("<PocketDetail"),'Dedicated pocket detail screen not connected');
assert(ui.includes("<FamilyCardsView"),'Card view not connected');
assert(ui.includes('validatePocketDebit(family,data.viewerId,payment.from,payment.amount)'),
 'Enforce pocket debit ceiling when payment submitted');
assert(ui.includes('canIssueFamilyCard(family,data.viewerId,form.source,holder.id)'),
 'Enforce card ownership rules on creation');
assert(ui.includes("onOpenPocket={navigateToMember}"),'Card must link to pocket');
assert(ui.includes("onProfile={()=>navigateToMemberProfile(owner.id)}"),'Pocket must link back to member');
assert(!source('src/family/members/MemberProfile.tsx').includes('maxPercentage'),
 'Pocket balance must not be displayed as percentage of spending limit');
for(const filename of ['src/family/pockets/PocketDetail.tsx','src/family/pockets/FamilyCardsView.tsx']) {
 const parsed=ts.createSourceFile(filename,source(filename),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.equal(parsed.parseDiagnostics.length,0,
  filename+': '+parsed.parseDiagnostics.map(x=>ts.flattenDiagnosticMessageText(x.messageText,' ')).join('; '));
}
console.log('OK — pocket, plafond fictif, Simple One, cartes, confidentialité, historique et navigation.');
