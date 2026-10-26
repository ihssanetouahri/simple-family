// QA V2: role matrix, sensitive values, member removal, Home, navigation.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const read=(f)=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
function moduleFrom(file,deps={}){
 const js=ts.transpileModule(read(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};
 vm.runInNewContext(js,{module:mod,exports:mod.exports,structuredClone,localStorage:{removeItem(){}},require:(id)=>{
  if(!Object.hasOwn(deps,id))throw Error('Unexpected '+id);return deps[id];
 }},{filename:file});
 return mod.exports;
}
const m=moduleFrom('src/family/model.ts');
const p=moduleFrom('src/family/permissions.ts',{'./model':m});
const integrity=moduleFrom('src/family/quality/familyIntegrity.ts',{'../model':m});
const f=m.createDemoState().families[0];
const source=read('src/family/FamilyExperience.tsx');
const cards=read('src/family/pockets/FamilyCardsView.tsx');
const account=read('src/family/AccountJourneys.tsx');

assert(p.canViewFamilyCard(f,'lamia',f.cards[0]));
assert(p.canViewFamilyCard(f,'karim',f.cards[0]));
assert(!p.canViewFamilyCard(f,'yasmine',f.cards[0]),'Simple One must not see family debit card');
assert(p.canViewFamilyCard(f,'yasmine',f.cards[1]));
assert(!p.canViewFamilyCard(f,'yasmine',{...f.cards[1],source:'pocket:lamia'}));
assert(!p.canToggleFamilyCard(f,'yasmine',f.cards[1]),'Simple One cannot suspend own card');
assert(p.canToggleFamilyCard(f,'lamia',f.cards[1]));
assert(!p.canViewFamilyCard(f,'unknown',f.cards[0]));

f.joint={id:'joint_qa',label:'Compte joint',balance:900,limit:2000};
f.jointHolderIds=['lamia'];
const jointCard={id:'jointCard',label:'Carte joint',source:'joint',holderId:'lamia',active:true,last4:'4812'};
f.cards.push(jointCard);
assert(p.canViewFamilyCard(f,'lamia',jointCard));
assert(p.canToggleFamilyCard(f,'lamia',jointCard));
assert(!p.canViewFamilyCard(f,'karim',jointCard),'Co-leader non cotitulaire: carte invisible');
assert(!p.canToggleFamilyCard(f,'karim',jointCard),'Co-leader non cotitulaire: action interdite');
assert(!p.canViewFamilyCard(f,'yasmine',jointCard));
f.joint=null;f.jointHolderIds=[];
assert(!p.canViewFamilyCard(f,'lamia',jointCard),'Closed joint account must hide old card');

assert(integrity.memberRemovalIssues(f,'yasmine').length>0,'Active resources block removal');
assert(integrity.memberRemovalIssues(f,'karim').length>0,'Active contributions block removal');
assert(integrity.memberRemovalIssues(f,'missing').length>0);
const newMember={id:'invited',name:'Amine',relation:'Fils',role:'member',simpleOne:false,simpleBalance:300,avatar:''};
f.members.push(newMember);f.pockets.push({id:'p_invited',ownerId:'invited',balance:0,limit:500});
assert.equal(integrity.memberRemovalIssues(f,'invited').length,0,'New member without dependencies may be removed');
f.pockets.find(x=>x.ownerId==='invited').balance=10;
assert(integrity.memberRemovalIssues(f,'invited').some(x=>x.includes('pocket')));
f.pockets.find(x=>x.ownerId==='invited').balance=0;
f.jointApplication={status:'awaiting',requesterId:'lamia',coHolderId:'invited'};
assert(integrity.memberRemovalIssues(f,'invited').some(x=>x.includes('compte joint')));
f.jointApplication=null;

assert(source.includes('canToggleFamilyCard(family,data.viewerId,card)'),'Toggle checks access before mutation');
assert(source.includes('canToggleFamilyCard(f,data.viewerId,target)'),'Toggle rechecks current state');
assert(cards.includes('canToggleFamilyCard(family,viewerId,card)'),'UI hides forbidden card controls');
assert(source.includes("if(canViewJointAccount(family,data.viewerId)) opts.push("),'Transfer menu must hide joint balance from non-holders');
assert(source.includes("onClick={()=>mainGo('pfm')}"),'PFM home entry remains');
assert(source.includes('showAmounts?currency(viewer.simpleBalance)'), 'Account balance selector must honor masking');
assert(source.includes('showAmounts?currency(p.balance)'), 'Pocket balance selector must honor masking');
assert(source.includes('const issues=memberRemovalIssues(family,selectedMember)'),'Member removal blocks data loss');
assert(source.includes("canViewJointAccount(family,data.viewerId)?[{value:'joint',label:'Compte joint'}]"),'Card creation source must respect joint co-ownership');
assert(source.includes('f.accountViewIds=f.accountViewIds.filter(id=>id!==selectedMember)'),
 'Member removal revokes read-only account access');
assert(account.includes("canRespondJointApplication(family,viewerId)"),'Second holder must confirm on own demo profile');
assert(source.includes("const stackedAccountRoute=[...stack].reverse().find(isAccountRoute)||null;"),
 'Return navigation preserves previous bank journey');
for(const file of ['src/family/FamilyExperience.tsx','src/family/members/MemberProfile.tsx','src/family/pockets/PocketDetail.tsx','src/family/pockets/FamilyCardsView.tsx','src/family/pfm/HouseholdPFMBridge.tsx']){
 const parsed=ts.createSourceFile(file,read(file),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.equal(parsed.parseDiagnostics.length,0,'Invalid TSX: '+file);
}
console.log('OK — QA permissions cartes/comptes, masquage, retrait sécurisé, Retour et TSX.');
