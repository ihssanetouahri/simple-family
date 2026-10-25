/** Règles de parcours Pocket V2 : uniquement pour la simulation locale. */
import { type Family } from '../model';
import { canDebitFamilySource, canViewPocket } from '../permissions';

export type PocketDebitValidation={ok:true}|{ok:false;reason:string};

/**
 * `pocket.limit` est utilisé comme plafond indicatif par *virement sortant* dans la démo.
 * Il ne représente ni le plafond réel de Simple One ni un plafond de paiement par carte.
 */
export function validatePocketDebit(family:Family, viewerId:string, source:string, amount:number):PocketDebitValidation {
 if(!source.startsWith('pocket:')) return {ok:true};
 const ownerId=source.slice(7);
 const pocket=family.pockets.find(p=>p.ownerId===ownerId);
 if(!pocket || !canDebitFamilySource(family,viewerId,source)){
  return {ok:false,reason:'Vous ne pouvez pas débiter cette pocket.'};
 }
 if(!Number.isFinite(amount) || amount<=0){
  return {ok:false,reason:'Saisissez un montant positif valide.'};
 }
 if(amount>pocket.balance){
  return {ok:false,reason:'Solde de la pocket insuffisant.'};
 }
 if(amount>pocket.limit){
  return {ok:false,reason:'Ce virement dépasse le plafond par opération défini pour la démonstration.'};
 }
 return {ok:true};
}

/** Détails d'accès destinés à l'écran de supervision. */
export function pocketSupervision(family:Family, viewerId:string, ownerId:string) {
 const owner=family.members.find(m=>m.id===ownerId);
 const pocket=family.pockets.find(p=>p.ownerId===ownerId);
 return {
  accessible:Boolean(owner&&pocket&&canViewPocket(family,viewerId,ownerId)),
  isSimpleOne:Boolean(owner?.simpleOne),
  isSelf:viewerId===ownerId,
  pocketExists:Boolean(pocket),
  ceiling:pocket?.limit??0,
  balance:pocket?.balance??0
 };
}
