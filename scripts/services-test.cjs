// Family services V2: context-sensitive links, privacy and explicit draft confirmation.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function source(name){return fs.readFileSync(path.join(__dirname,'..',name),'utf8');}
function compile(name,deps={}){
 const js=ts.transpileModule(source(name),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
 }).outputText;
 const mod={exports:{}};
 vm.runInNewContext(js,{module:mod,exports:mod.exports,structuredClone,
  localStorage:{removeItem(){}},require:(id)=>{
   if(!Object.hasOwn(deps,id))throw Error('Unexpected import '+id);return deps[id];
  }
 },{filename:name});
 return mod.exports;
}
const model=compile('src/family/model.ts');
const permission=compile('src/family/permissions.ts',{'./model':model});
const links=compile('src/family/services/serviceLinks.ts',{'../model':model,'../permissions':permission});
const f=model.createDemoState().families[0];
function list(id){return links.getFamilyServiceLinks(f,id);}
assert.equal(list('unrelated').length,0,'Non-members must not see family suggestions');
assert(list('lamia').some(x=>x.kind==='goal'&&x.action.route==='goal'));
assert(list('karim').some(x=>x.kind==='goal'));
assert(!list('yasmine').some(x=>x.kind==='goal'&&x.action.id==='goal_vac'),
 'Simple One does not see a private family holiday goal');
assert(list('lamia').some(x=>x.kind==='document'));
assert(!list('yasmine').some(x=>x.kind==='document'),
 'Document not shared with Yasmine must stay hidden');
assert(list('lamia').every(x=>x.id&&x.title&&x.subtitle&&x.action));
assert(list('lamia').length<=4,'Services suggestion list stays compact');
assert(links.canCreateFamilyBooking(f,'lamia','yasmine'));
assert(links.canCreateFamilyBooking(f,'karim','lamia'));
assert(!links.canCreateFamilyBooking(f,'yasmine','yasmine'));
assert(!links.canCreateFamilyBooking(f,'lamia','not-a-member'));
f.bookings.push({id:'b1',travelerId:'lamia',destination:'Fès',date:'2027-01-01',amount:120});
f.bookings.push({id:'b2',travelerId:'karim',destination:'Essaouira',date:'2027-02-01',amount:150});
assert(list('lamia').some(x=>x.kind==='trip'&&x.action.route==='trip'));
assert(list('karim').some(x=>x.kind==='trip'));
assert(!list('yasmine').some(x=>x.kind==='trip'),'Cannot see another member booking');
f.bookings.push({id:'b3',travelerId:'yasmine',destination:'Rabat',date:'2027-03-01',amount:100});
assert(list('yasmine').some(x=>x.kind==='trip'),'Traveler sees own family trip');
const goal=f.goals.find(x=>x.id==='goal_vac');goal.status='closed';
assert(!list('lamia').some(x=>x.kind==='goal'&&x.action.id===goal.id),
 'Closed travel project no longer suggested');

const draft=links.composeFamilyMessage({kind:'pot',title:'Anniversaire'});
assert(draft.includes('Anniversaire')&&draft.trim().endsWith('?'));
assert(links.composeFamilyMessage({kind:'goal',title:'Vacances en famille'}).includes('Vacances en famille'));
assert(links.composeFamilyMessage({kind:'trip',destination:'Agadir',travelerName:'Karim'}).includes('Agadir'));
assert(!draft.includes(' DH'),'Prepared drafts must not include balances by default');

const ui=source('src/family/FamilyExperience.tsx');
const member=source('src/family/members/MemberProfile.tsx');
assert(ui.includes("const serviceLinks=family?getFamilyServiceLinks(family,data.viewerId):[];"));
assert(ui.includes('serviceLinks.map(link=><ActionLine'),'Contextual service cards appear in hub');
assert(ui.includes("label:'Autres',icon:MoreHorizontal"),'Four existing shortcuts remain intact');
assert(ui.includes("onChat={()=>mainGo('chat')}"));
assert(ui.includes('onTrip={()=>openTripForMember(owner.id)}'));
assert(ui.includes('traveler:tripTravelerId||data.viewerId'),'Trip from member profile preselects member');
assert(ui.includes("if(!canCreateFamilyBooking(family,data.viewerId,travelerId))"),
 'Create booking must validate role and existing traveler');
assert(ui.includes("form.date<nowDate()"),'Demo booking date cannot be past');
assert(ui.includes("family.bookings.filter(b=>admin||b.travelerId===data.viewerId)"),
 'Member trip history must be filtered to visible bookings');
assert(ui.includes("family.documents.filter(d=>canViewFamilyDocument(family,data.viewerId,d))"),
 'Document list must enforce existing visibility permissions');
assert(ui.includes("setChatInput(draft);go('chat')"),'Share action only prepares a draft');
assert(ui.includes('onSubmit={createMessage}'),'User must still manually submit a draft');
assert(ui.includes("kind:'pot',title:pot.title"),'Pot can prepare a chat message');
assert(ui.includes("kind:'goal',title:goal.title"),'Goal can prepare a chat message');
assert(ui.includes("kind:'trip',destination:b.destination"),'Booking can prepare a chat message');
assert(member.includes('Services pour {member.name}'),'Member profile provides contextual service entrypoints');
assert(member.includes('onDocuments={')===false,'Member receives callbacks through parent only');

for(const p of ['src/family/FamilyExperience.tsx','src/family/members/MemberProfile.tsx']){
 const sf=ts.createSourceFile(p,source(p),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.equal(sf.parseDiagnostics.length,0,p+': '+sf.parseDiagnostics.map(x=>ts.flattenDiagnosticMessageText(x.messageText,' ')).join('; '));
}
console.log('OK — contextual family services, privacy, bookings, chat drafts and Home shortcuts.');
