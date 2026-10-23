/** Simple Family – prototype-only model. No API calls, authentication or real bank transactions. */
export type Role = 'leader' | 'coleader' | 'member';
export type Member = { id: string; name: string; relation: string; role: Role; simpleOne: boolean; simpleBalance: number; avatar: string; };
export type Pocket = { id: string; ownerId: string; balance: number; limit: number; };
export type BankAccount = { id: string; label: string; balance: number; limit: number; };
export type FamilyTransaction = { id: string; date: string; title: string; amount: number; category: string; source: string; target: string; };
export type SavingsGoal = { id: string; title: string; creatorId: string; ownerId: string; target: number; balance: number; deadline: string; contributors: string[]; scheduledAmount: number; scheduledFrequency?: 'weekly'|'monthly'; nextScheduledDate?: string; coverId?: string; status: 'active'|'closed'; history: { id:string; memberId: string; amount: number; date:string; kind: 'deposit'|'withdrawal' }[] };
export type PotContribution = { id: string; memberId: string; amount: number; date: string };
export type FamilyPot = {
  id: string; title: string; target: number; balance: number; members: string[]; status: 'active'|'closed';
  creatorId?: string; description?: string; deadline?: string;
  contributions?: PotContribution[]; pendingInvites?: string[];
};
export type FamilyCard = { id: string; label: string; last4: string; source: string; holderId: string; active: boolean; };
export type FamilyInvite = { id: string; name: string; relation: string; simpleOne: boolean; role: Role; };
export type FamilyAlert = { id: string; type: 'bill'; title: string; beneficiary: string; amount: number; dueDate: string; resolved: boolean; };
export type ChatMsg = { id: string; authorId: string; text: string; date: string; };
export type VaultDoc = { id: string; title: string; type: string; expiry: string; ownerId: string; visibleTo: string[]; };
export type FamilyBooking = { id: string; travelerId: string; destination: string; date: string; amount: number; };
export type CreditRequest = { id: string; applicantId: string; amount: number; account: string; status: 'En étude'; };
export type Family = {
  id: string; name: string; emoji: string; members: Member[]; pockets: Pocket[]; accountViewIds: string[];
  account: BankAccount | null; joint: BankAccount | null;
  jointHolderIds?: string[];
  jointApplication?: { status:'awaiting'|'review'|'rejected'; requesterId:string; coHolderId:string } | null;
  transactions: FamilyTransaction[]; goals: SavingsGoal[]; pots: FamilyPot[]; cards: FamilyCard[];
  invites: FamilyInvite[]; alerts: FamilyAlert[]; chat: ChatMsg[]; documents: VaultDoc[];
  bookings: FamilyBooking[]; creditRequests: CreditRequest[];
  loyaltyPoints: number; otpThreshold: number; language: 'Français'|'العربية'|'English';
};
export type FamilyState = { families: Family[]; activeFamilyId: string | null; viewerId: string; version: number };
export const uid = (prefix='id') => `${prefix}_${Math.random().toString(36).slice(2,9)}`;
export const today = () => new Date().toLocaleDateString('fr-FR', {day:'2-digit',month:'short',year:'numeric'});
export const currency = (n: number) => new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2,minimumFractionDigits:0}).format(n) + ' DH';
export const parseMoney = (value: string) => Number(value.replace(',','.'));
export const avatarFor = (memberId: string) => memberId === 'lamia' ? 'lamia' : memberId === 'karim' ? 'karim' : memberId === 'yasmine' ? 'yasmine' : '';
export const roleLabel = (role:Role) => role === 'leader' ? 'Leader' : role === 'coleader' ? 'Co-leader' : 'Membre';
const dateInDays = (days: number) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
};
export function createDemoState(): FamilyState {
  return { version: 2, activeFamilyId: 'family_main', viewerId: 'lamia', families: [
    { id:'family_main', name:'Notre famille', emoji:'💜',accountViewIds:['lamia','karim'], language:'Français', otpThreshold:2000,
      members:[
        {id:'lamia', name:'Lamia', relation:'Moi', role:'leader', simpleOne:false, simpleBalance:43109, avatar:'lamia'},
        {id:'karim', name:'Karim', relation:'Conjoint', role:'coleader', simpleOne:false, simpleBalance:9200, avatar:'karim'},
        {id:'yasmine', name:'Yasmine', relation:'Fille', role:'member', simpleOne:true, simpleBalance:650, avatar:'yasmine'},
      ],
      pockets:[
        {id:'p_lamia',ownerId:'lamia',balance:1850,limit:5000},
        {id:'p_karim',ownerId:'karim',balance:2300,limit:5000},
        {id:'p_yasmine',ownerId:'yasmine',balance:180,limit:600},
      ],
      account:{id:'account_family',label:'Sous-compte Famille',balance:6450,limit:9000},
      joint:null,jointHolderIds:[],jointApplication:null,
      transactions:[
        {id:'t1',date:'21 oct.',title:'Courses familiales',amount:-520,category:'Courses',source:'Sous-compte Famille',target:'Marjane'},
        {id:'t2',date:'18 oct.',title:'Facture électricité',amount:-420,category:'Factures',source:'Sous-compte Famille',target:'Lydec'},
        {id:'t3',date:'16 oct.',title:'Alimentation pocket Yasmine',amount:300,category:'Transferts',source:'Compte Simple',target:'Pocket Yasmine'},
        {id:'t4',date:'12 oct.',title:'Activités du week-end',amount:-310,category:'Loisirs',source:'Sous-compte Famille',target:'Sorties'},
      ],
      goals:[
        {id:'goal_vac',title:'Vacances en famille',creatorId:'lamia',ownerId:'lamia',target:10000,balance:4500,deadline:'2027-07-15',contributors:['lamia','karim'],scheduledAmount:0,status:'active',history:[{id:'g1',memberId:'lamia',amount:2500,date:'10 oct.',kind:'deposit'},{id:'g2',memberId:'karim',amount:2000,date:'15 oct.',kind:'deposit'}]},
        {id:'goal_school',title:'Études de Yasmine',creatorId:'lamia',ownerId:'yasmine',target:8000,balance:2400,deadline:'2027-09-01',contributors:['lamia','karim'],scheduledAmount:200,status:'active',history:[{id:'g3',memberId:'lamia',amount:1500,date:'08 oct.',kind:'deposit'},{id:'g4',memberId:'karim',amount:900,date:'17 oct.',kind:'deposit'}]},
        {id:'goal_weekend',title:'Week-end en famille',creatorId:'karim',ownerId:'karim',target:3500,balance:900,deadline:'2027-04-30',contributors:['lamia','karim'],scheduledAmount:0,status:'active',history:[{id:'g5',memberId:'karim',amount:900,date:'19 oct.',kind:'deposit'}]},
      ],
      pots:[
        {id:'pot1',title:'Anniversaire de Yasmine',creatorId:'lamia',
          description:'Ensemble, préparons une belle surprise pour Yasmine !',
          target:1500,balance:400,members:['lamia','karim'],status:'active',pendingInvites:[],
          contributions:[{id:'pc1',memberId:'lamia',amount:250,date:'20 oct.'},{id:'pc2',memberId:'karim',amount:150,date:'21 oct.'}]},
        {id:'pot2',title:'Cadeau pour Karim',creatorId:'lamia',
          description:'Un cadeau choisi ensemble pour faire plaisir à Karim.',
          target:2000,balance:650,members:['lamia','yasmine'],status:'active',pendingInvites:[],
          contributions:[{id:'pc3',memberId:'lamia',amount:400,date:'18 oct.'},{id:'pc4',memberId:'yasmine',amount:250,date:'20 oct.'}]},
        {id:'pot3',title:'Sortie en famille',creatorId:'karim',
          description:'Organisons notre prochaine sortie en famille.',
          target:1200,balance:300,members:['lamia','karim','yasmine'],status:'active',pendingInvites:[],
          contributions:[{id:'pc5',memberId:'karim',amount:200,date:'19 oct.'},{id:'pc6',memberId:'yasmine',amount:100,date:'21 oct.'}]},
      ],
      cards:[{id:'card1',label:'Carte Famille',last4:'4582',source:'family',holderId:'lamia',active:true}, {id:'card2',label:'Carte Pocket Yasmine',last4:'1046',source:'p_yasmine',holderId:'yasmine',active:true}],
      invites:[{id:'invite_amine',name:'Amine',relation:'Fils',simpleOne:true,role:'member'}],
      alerts:[{id:'bill_internet',type:'bill',title:'Facture Internet à régler',beneficiary:'Internet',amount:390,dueDate:dateInDays(3),resolved:false}],
      chat:[{id:'msg1',authorId:'karim',text:'On prévoit les courses samedi ?',date:'18:20'},{id:'msg2',authorId:'lamia',text:'Oui, je prépare la liste 😊',date:'18:21'}],
      documents:[{id:'doc1',title:'Assurance familiale',type:'Assurance',expiry:'2027-05-31',ownerId:'lamia',visibleTo:['lamia','karim']}],
      bookings:[],creditRequests:[],loyaltyPoints:720
    }
  ]};
}
export const STORE_KEY='simple-family-prototype-v2';
// Session-only demo state: navigation preserves edits, refreshing the page resets everything.
let demoSessionState: FamilyState | null = null;
export function loadFamilyState(): FamilyState {
  if (!demoSessionState) {
    // Remove legacy persisted edits so previous prototypes cannot restore stale data.
    try { localStorage.removeItem(STORE_KEY); } catch { /* storage disabled */ }
    demoSessionState = createDemoState();
  }
  return structuredClone(demoSessionState);
}
export function saveFamilyState(state: FamilyState): void {
  demoSessionState = structuredClone(state);
}
export function findMember(family:Family, id:string) { return family.members.find(m=>m.id===id); }
export function isAdmin(family:Family, viewerId:string) { return ['leader','coleader'].includes(findMember(family,viewerId)?.role||''); }
export function canSeePocket(family:Family, viewerId:string, ownerId:string) { return viewerId===ownerId || isAdmin(family,viewerId); }
export function moneyValid(amount:number) { return Number.isFinite(amount) && amount>0 && amount<100000000; }
