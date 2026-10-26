# Simple Family V2 — Correctif prioritaire 01 : montants et factures

## Origine du correctif

Recette vidéo du 26 octobre 2026 : plusieurs saisies entières étaient considérées comme invalides par les champs numériques du navigateur. Avec `min="0.01"` et le pas de `1` implicite pour `type="number"`, les valeurs 200 ou 390 ne correspondaient pas à l'incrément autorisé ; les valeurs 200,01 / 390,01 passaient le contrôle du champ, créant un décalage par rapport au montant attendu.

L'alerte « Facture Internet à régler » ne disparaissait pas après un paiement dont le montant ne correspondait pas exactement aux 390 DH attendus.

## Corrections

1. **Saisie :** le composant de saisie partagé de Simple Family et le champ des parcours Sous-compte / Compte joint ont désormais `step="0.01"`. Les montants entiers et les centimes sont acceptés sans ajouter artificiellement 0,01 DH.
2. **Validation :** `parseMoney` valide uniquement les valeurs à **deux décimales maximum**, avec point ou virgule pour le centime ; `roundMoney` stabilise les calculs de soldes.
3. **Soldes :** les mouvements Simple/pockets/comptes, les contributions aux projets/cagnottes et les restitutions fictives utilisent la précision au centime, sans modifier les montants de la démo initiale.
4. **Facture liée à une alerte :** le montant exact est **verrouillé** dans le formulaire ; le règlement est refusé s'il ne correspond pas au montant ou au bénéficiaire de la facture, si elle n'existe plus, ou si elle est déjà résolue.
5. **Statut de facture :** l'alerte n'est marquée comme réglée **qu'après le règlement fictif confirmé**. La Home et « Voir tout » reprennent la liste calculée des factures non résolues ; une facture réglée n'est donc plus affichée.
6. **Paiement manuel :** la fonction « Payer une facture » peut toujours servir à un autre paiement fictif non lié à une alerte, sans solder automatiquement une facture sans référence.

Aucune opération réelle n'est effectuée. Les **paiements partiels** d'une facture liée à une alerte ne sont pas modélisés.

## Fichiers

- `src/family/model.ts` — `parseMoney` et `roundMoney`.
- `src/family/payments/billRules.ts` — vérification d'une facture liée.
- `src/family/FamilyExperience.tsx` — pas du champ, formulaire facture verrouillé, contrôle du paiement et mise à jour des soldes.
- `src/family/AccountJourneys.tsx` — pas des montants et calculs au centime.
- `src/family/savings/savingsRules.ts` — montant de restitution arrondi.
- `scripts/amounts-and-bills-test.cjs` — tests dédiés inclus dans `npm run test`.
- `package.json` — enregistrement du test.

## Scénarios à tester visuellement dans Cursor

1. **Lamia → À suivre en famille → Facture Internet à régler** : montant **390 DH** prérempli, montant non éditable, bénéficiaire Internet. Confirmer le paiement fictif.
2. Vérifier que le Sous-compte Famille diminue **exactement de 390 DH** et que l'alerte disparaît de la Home et de « Voir tout ».
3. **Yasmine → Pocket → Alimenter** : saisir **200 DH**. La saisie doit être acceptée et le solde doit augmenter de **200 DH exactement**, sans `+0,01`.
4. **Cagnotte Anniversaire de Yasmine → Participer** : saisir **100 DH**, vérifier le récapitulatif puis la confirmation. La cagnotte doit augmenter de **100 DH exactement**.
5. Tester **200,50 DH** : le montant affiché et le mouvement doivent rester à deux décimales.
6. Tester **200,001 DH** : la saisie de plus de deux décimales doit être refusée.
7. Si la facture a été réglée, tenter de la régler à nouveau dans la même session : le rappel n'existe plus. Avec **F5**, l'état fictif initial est rétabli.
8. Vérifier que la carte photo « Notre famille », le menu « Mes familles » et les autres écrans restent inchangés.

## Limites

Les tests de logique vérifient l'intégrité des données, des contrôles et de la précision des centimes. Ils ne remplacent pas une observation du comportement de saisie et des retours visuels sur ton navigateur. La branche `main` ne doit pas être fusionnée avant la recette visuelle.
