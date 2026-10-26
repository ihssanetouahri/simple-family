// UX Chat: recognizable inbox, one compose action, participant photos and preserved flows.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const read=(p)=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const parent=read('src/family/FamilyExperience.tsx');
const chat=read('src/family/chat/FamilyChatView.tsx');
const header=read('src/components/SimpleUI.tsx');

assert(parent.includes("title={route==='chat'?(chatHeaderRoom?.title||'Discussions'):pageTitles[route]}"),
  'The app header should be the only Discussions title');
const inbox=chat.slice(chat.indexOf("return <div className=\"space-y-4 pb-5"),chat.indexOf("{sheet&&document.getElementById"));
assert(!inbox.includes('<h2 className="text-[20px] font-extrabold">Discussions</h2>'),
  'Remove secondary Discussions title inside a heavy card');
assert(!inbox.includes('Vos discussions'), 'Avoid duplicated inbox headings');
assert(!inbox.includes('Nouvelle discussion</button>'), 'No redundant bottom CTA');
assert(!inbox.includes('Paramètres des discussions</button>'), 'No oversized settings CTA');
assert(inbox.includes('role="list" aria-label="Discussions accessibles"'), 'Flat conversation list');
assert(inbox.includes('role="listitem" onClick={()=>onOpen(chat.id)}'), 'Each row must navigate');
assert(inbox.includes("chat.messages.at(-1)"), 'Last message preview');
assert(inbox.includes("last?.date||''"), 'Time next to conversation title');
assert(inbox.includes('ml-[88px] mr-5'), 'Subtle separators align with text, not avatar');
assert(inbox.includes('placeholder="Rechercher une conversation"'), 'Search lives immediately below header');
assert(inbox.includes('memberId={other}'), 'Direct messages show member-specific photos');
assert(chat.includes('lamia_avatar.jpg')&&chat.includes('karim.jpg')&&chat.includes('yasmine.jpg'));
assert(inbox.includes('chat.kind!==\'direct\''), 'Group receives visual identity');
assert(parent.includes('aria-label="Nouvelle discussion"'), 'One composer action in top bar');
assert.equal((inbox.match(/SquarePen/g)||[]).length,0, 'No second compose button within inbox');
assert(parent.includes("onClick={()=>setChatCreateSignal(i=>i+1)}"), 'Top compose icon must work');
assert(chat.includes("createSignal!==lastCreateSignal.current"), 'Do not reopen old modal on remount');
assert(chat.includes("setSheet('new')"), 'Top composer opens the new discussion flow');
assert(inbox.includes("onClick={()=>open('settings')}"), 'Settings available as secondary overflow');
assert(inbox.includes('onClick={()=>open(\'manage\')}'), 'Manage group inside conversation');
assert(parent.includes("onTitleClick={route==='chat'&&chatHeaderRoom?.kind==='group'"),
 'Group title exposes settings for authorized participants');
assert(chat.includes("manageSignal!==lastManageSignal.current"),'Group title opens the manage panel');
assert(parent.includes("route==='chat'&&activeChatId"), 'Back returns to inbox before leaving chat');
assert(parent.includes("route!=='goal'&&route!=='chat'&&<div"),
 'Prototype toolbar should not interrupt familiar chat screen');
assert(header.includes('rightAction?: React.ReactNode')&&header.includes('avatar?:React.ReactNode'),
 'Global header permits messenger-style avatar and compose');
assert(parent.includes('onSubmit={createMessage}'), 'Message send remains explicit');
assert(parent.includes('getVisibleChat(family,data.viewerId,activeChatId)'),
 'Messaging composer only for permitted participants');
assert(chat.includes("sheet==='direct'")&&chat.includes("sheet==='group'")&&chat.includes("sheet==='manage'"),
 'DM and group creation/management flows preserved');
for(const filename of ['src/family/FamilyExperience.tsx','src/family/chat/FamilyChatView.tsx','src/components/SimpleUI.tsx']){
 const ast=ts.createSourceFile(filename,read(filename),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.equal(ast.parseDiagnostics.length,0,filename+' must parse as TSX');
}
console.log('OK — chat inbox hierarchy, avatar photos, top compose, settings and message access.');
