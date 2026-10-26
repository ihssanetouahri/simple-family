/** Validations des factures liées aux rappels de la démonstration.
 * Un règlement partiel n'est pas modélisé : le montant exact est obligatoire. */
import { roundMoney, type Family } from '../model';
export type LinkedBillValidation={ok:true}|{ok:false;reason:string};
export function validateLinkedBillPayment(
 family:Family,alertId:string,beneficiary:string,amount:number
):LinkedBillValidation {
 const bill=family.alerts.find(a=>a.id===alertId&&a.type==='bill');
 if(!bill||bill.resolved)return {ok:false,reason:'Cette facture n’est plus à régler.'};
 if(bill.beneficiary.trim().toLocaleLowerCase('fr-FR')!==beneficiary.trim().toLocaleLowerCase('fr-FR'))
   return {ok:false,reason:'Le bénéficiaire ne correspond pas à la facture sélectionnée.'};
 if(!Number.isFinite(amount)||!Number.isFinite(bill.amount)||
    roundMoney(amount)!==roundMoney(bill.amount))
   return {ok:false,reason:'Le montant doit correspondre exactement à la facture. Aucun paiement partiel n’est prévu dans la démo.'};
 return {ok:true};
}
