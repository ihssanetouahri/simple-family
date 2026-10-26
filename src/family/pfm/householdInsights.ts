/**
 * Simple Family → PFM Mon foyer: selectors for READ-ONLY demo insights.
 * Neither the external PFM application nor banking accounts are connected here.
 * A family role does not grant ownership of private Simple or pocket transactions.
 */
import { findMember, type Family, type FamilyTransaction } from '../model';
import {
  canViewFamilyAccount, canViewJointAccount, canViewSavingsGoal,
  canViewFamilyPotHistory, canManageFamilyPot
} from '../permissions';

export type SharedAccountScope='sub'|'joint';
export type HouseholdCategory={name:string;amount:number;percent:number};
export type HouseholdInsight={
 scope:SharedAccountScope[];
 movements:FamilyTransaction[];
 spending:number;
 categories:HouseholdCategory[];
 goals:{id:string;title:string;balance:number;target:number;percentage:number}[];
 pots:{id:string;title:string;balance:number;target:number;percentage:number}[];
};

/**
 * Read access is necessary AND the account must exist.
 * Explicitly exclude pockets, personal accounts, unknown legacy descriptions.
 */
export function allowedSharedScopes(family:Family,viewerId:string):SharedAccountScope[]{
 if(!findMember(family,viewerId))return [];
 const result:SharedAccountScope[]=[];
 if(family.account&&canViewFamilyAccount(family,viewerId))result.push('sub');
 if(family.joint&&canViewJointAccount(family,viewerId))result.push('joint');
 return result;
}

export function sharedTransactionScope(family:Family,tx:FamilyTransaction):SharedAccountScope|null {
 const source=tx.source.trim();
 if(family.account&&['account','family','Sous-compte Famille',family.account.id].includes(source))return 'sub';
 if(family.joint&&['joint','Compte joint',family.joint.id].includes(source))return 'joint';
 return null;
}

const percentage=(balance:number,target:number)=>target>0?
 Math.max(0,Math.min(100,Math.round(balance/target*100))):0;

export function getHouseholdInsight(family:Family,viewerId:string):HouseholdInsight {
 const scope=allowedSharedScopes(family,viewerId);
 const movements=family.transactions.filter(tx=>
   scope.includes(sharedTransactionScope(family,tx) as SharedAccountScope) && tx.amount<0
 );
 const totals=new Map<string,number>();
 let spending=0;
 for(const tx of movements){
  const amount=Math.abs(tx.amount);
  spending+=amount;
  totals.set(tx.category,(totals.get(tx.category)||0)+amount);
 }
 const categories=[...totals.entries()]
  .map(([name,amount])=>({name,amount,percent:spending?Math.round(amount/spending*100):0}))
  .sort((a,b)=>b.amount-a.amount||a.name.localeCompare(b.name));
 const goals=family.goals.filter(g=>g.status==='active'&&
  canViewSavingsGoal(family,viewerId,g))
  .map(g=>({id:g.id,title:g.title,balance:g.balance,target:g.target,
    percentage:percentage(g.balance,g.target)}));
 const pots=family.pots.filter(p=>p.status==='active'&&
  (canViewFamilyPotHistory(family,viewerId,p)||canManageFamilyPot(family,viewerId,p)))
  .map(p=>({id:p.id,title:p.title,balance:p.balance,target:p.target,
    percentage:percentage(p.balance,p.target)}));
 return {scope,movements,spending,categories,goals,pots};
}
