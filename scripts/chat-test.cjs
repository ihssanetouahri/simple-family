// Messagerie : groupe familial, privés, groupes, permissions et non-régression des raccourcis.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
function load(file,deps={}){
 const js=ts.transpileModule(read(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};
 vm.runInNewContext(js,{
  module:mod,exports:mod.exports,structuredClone,localStorage:{removeItem(){}},
  require:(name)=>{if(!Object.hasOwn(deps,name))throw Error('Unexpected import '+name);return deps[name];}
 },{filename:file});return mod.exports;
}
const model=load('src/family/model.ts');
const permissions=load('src/family/permissions.ts',{'./model':model});
const chats=load('src/family/chat/chatRules.ts',{'../model':model,'../permissions':permissions});
const f=model.createDemoState().families[0],familyId=chats.FAMILY_ROOM_ID;
const list=who=>chats.visibleChats(f,who);
const thread=(who,id)=>chats.getVisibleChat(f,who,id);
assert.equal(list('stranger').length,0,'A nonmember sees no conversations');
for(const member of ['lamia','karim','yasmine'])assert(thread(member,familyId),
 'Every family member can see common room');
assert.equal(thread('lamia',familyId).messages.length,2,'Legacy family messages preserved');
assert(thread('lamia','chat_karim_lamia'),'Lamia sees private chat');
assert(thread('karim','chat_karim_lamia'),'Karim sees his private chat');
assert.equal(thread('yasmine','chat_karim_lamia'),null,
 'Simple One cannot see adult private chat even if Leader is active elsewhere');
assert(thread('yasmine','chat_travel_demo'),'Yasmine belongs to trip discussion');
assert.equal(chats.startDirectChat(f,'lamia','karim'),'chat_karim_lamia','Existing DM reused');
assert.equal(chats.startDirectChat(f,'lamia','lamia'),null);
assert.equal(chats.startDirectChat(f,'stranger','karim'),null);
assert.equal(chats.startDirectChat(f,'lamia','unknown'),null);
const before=(f.conversations||[]).length;
const dm=chats.startDirectChat(f,'yasmine','karim','dm_child');
assert.equal(dm,'dm_child');
assert.equal(f.conversations.length,before+1);
assert(thread('yasmine',dm));
assert(thread('karim',dm));
assert.equal(thread('lamia',dm),null,
 'Leader must not automatically see child direct chat');
assert(!chats.sendChatMessage(f,'lamia',dm,'Surveillance cachée'),
 'Leader cannot send a message to a chat she cannot access');
assert(chats.sendChatMessage(f,'yasmine',dm,'Salut Karim !'));
assert.equal(thread('karim',dm).messages.length,1);
assert.equal(thread('lamia',dm),null);
assert(!chats.sendChatMessage(f,'yasmine',dm,'   '));
assert(!chats.sendChatMessage(f,'yasmine',dm,'a'.repeat(1001)));
assert(chats.sendChatMessage(f,'lamia',familyId,'On prépare nos vacances ?'));
assert.equal(f.chat.length,3,'Common chat writes to legacy collection');
assert.equal(thread('karim',familyId).messages.at(-1).authorId,'lamia');
assert.equal(thread('yasmine',familyId).messages.at(-1).text,'On prépare nos vacances ?');
const total=f.conversations.length;
assert.equal(chats.createGroupChat(f,'yasmine','Voyage privé',['lamia'],'bad'),null,
 'Group needs at least three participants including creator');
assert.equal(chats.createGroupChat(f,'lamia','Groupe', ['karim','nonmember'],'bad2'),null);
assert.equal(chats.createGroupChat(f,'lamia','', ['karim','yasmine'],'bad3'),null);
assert.equal(f.conversations.length,total);
const gid=chats.createGroupChat(f,'yasmine','Projets scolaires',['karim','lamia'],'group_school');
assert.equal(gid,'group_school');
assert.equal(thread('karim',gid).title,'Projets scolaires');
assert(chats.canManageChatGroup(f,'yasmine',gid),'Child creator can manage own private group in demo');
assert(chats.canManageChatGroup(f,'lamia',gid),'Leader participant can manage group');
assert(!chats.canManageChatGroup(f,'stranger',gid));
assert(!chats.canManageChatGroup(f,'lamia','chat_karim_lamia'),'Private DM is not manageable group');
assert(!chats.updateChatGroup(f,'stranger',gid,'Autre',['lamia']));
assert(!chats.updateChatGroup(f,'lamia',gid,'Vide',[]),'Cannot remove everyone except creator');
assert(chats.updateChatGroup(f,'yasmine',gid,'Groupe d’études',['karim']));
assert.equal(thread('lamia',gid),null,'Removed participant immediately loses message access');
assert.equal(thread('karim',gid).title,'Groupe d’études');
assert(!chats.sendChatMessage(f,'lamia',gid,'Essai non autorisé'));
assert(chats.sendChatMessage(f,'karim',gid,'On révise demain ?'));
assert.equal(thread('yasmine',gid).messages.at(-1).text,'On révise demain ?');
assert.equal(thread('lamia',gid),null);

// Member switching cannot leak a selected room or its messages.
const another=f.conversations.find(c=>c.id===gid);
another.participantIds=['yasmine','karim'];
assert.equal(chats.getVisibleChat(f,'lamia',gid),null);
const noChats={...f,conversations:undefined};
assert.equal(chats.visibleChats(noChats,'lamia').length,1,'Old family chat still works');

// Static wiring checks; live keyboard and device behavior still require manual UX testing.
const family=read('src/family/FamilyExperience.tsx');
const view=read('src/family/chat/FamilyChatView.tsx');
assert(family.includes("const [activeChatId,setActiveChatId]=useState<string|null>(null)"));
assert(family.includes("setActiveChatId(FAMILY_ROOM_ID);setChatInput(draft);go('chat')"),
 'Contextual project/cagnotte drafts still open family group');
assert(family.includes("if(route==='chat'&&activeChatId){setActiveChatId(null)"),
 'Header Back returns first to discussions inbox');
assert(family.includes('onSubmit={createMessage}'),'Explicit Send control still required');
assert(family.includes("sendChatMessage(f,viewer.id,threadId,text)"),'Composer checks current room membership');
assert(family.includes("route==='chat' && activeChatId && family && getVisibleChat("),
 'Composer only visible for accessible open room');
assert(view.includes("role=\"dialog\""),'Conversation creation has an accessible sheet');
assert(view.includes("document.getElementById('simple-device-frame')"),
 'Sheet stays within phone frame');
assert(view.includes("sheet==='direct'"),'DM flow exists');
assert(view.includes("sheet==='group'"),'Group flow exists');
assert(view.includes("sheet==='manage'"),'Group participants management exists');
assert(view.includes("canManageChatGroup(family,viewerId,active.id)"),
 'Only authorized participant gets group edit option');
assert(view.includes("Un Leader ou Co-leader n'a pas accès automatiquement"),
 'No private chat surveillance should be presented as active');
assert(view.includes("role=\"tablist\"")===false,'Chat view should not claim nonimplemented tabs');
for(const file of ['src/family/FamilyExperience.tsx','src/family/chat/FamilyChatView.tsx']){
 const parsed=ts.createSourceFile(file,read(file),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.equal(parsed.parseDiagnostics.length,0,'TSX syntax '+file);
}
console.log('OK — groupe familial, messages privés, groupes, gestion, confidentialité et brouillons.');
