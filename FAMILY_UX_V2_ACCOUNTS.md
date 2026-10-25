# Simple Family — UX V2 · Étape 5 : comptes partagés

## Statut

Implémentation sur `feature/family-ux-v2` uniquement. Aucune fusion vers `main`, aucun appel bancaire réel.

## Sous-compte Famille

Parcours existant de création et de gestion préservé. Le détail du compte possède désormais un parcours de **clôture** accessible depuis les paramètres **uniquement au Leader**. Conditions préalables :
- Solde du Sous-compte Famille à **0 DH** (l'utilisateur doit transférer préalablement le solde dans un parcours autorisé).
- Toutes les cartes associées **suspendues**.
- Accord fictif explicite du Leader.
- Au moment de la clôture, le prototype revérifie les conditions sur la famille courante, retire les cartes fictives associées, révoque les droits de consultation et met le compte à `null`. Il ne débite ni ne reverse des fonds automatiquement.

La simulation **ne gère pas** les virements permanents bancaires, les documents contractuels de clôture ni des remboursements réglementaires. Les règles métier complètes de clôture doivent être validées.

## Compte joint

L'ouverture est toujours réservée au couple Leader/Co-leader éligible, selon le cadrage. États du parcours :
1. Demande du premier cotitulaire et présentation des conditions fictives.
2. `awaiting` : **en attente de la personne désignée**, et non approbation de sa part par le demandeur.
3. Via **Mode démo**, basculer sur le profil du deuxième cotitulaire (Karim dans le scénario initial) puis accéder au Compte joint pour confirmer ou refuser.
4. `review` : accord du deuxième cotitulaire enregistré. Étape ultérieure de **validation bancaire simulée**.
5. `rejected` : refus visible ; le demandeur initial peut reprendre une nouvelle demande.
6. Compte actif : deux titulaires enregistrés dans `jointHolderIds`, droits d'opération vérifiés par cette liste.

Le Compte joint conserve une clôture nécessitant un solde nul, les cartes suspendues et deux accords simulés. La clôture retire également les cartes fictives liées, les deux titulaires et les demandes en attente. **Ces cases ne sont pas des signatures distinctes** : dans une application bancaire réelle, l'accord devrait être vérifié côté serveur.

## Virements et paiements

Nouveau module de vérification pure `src/family/accounts/accountRules.ts` :
- Prend en compte l'existence du compte, le rôle, la titularité, la source, la destination et les montants.
- Rejette une source interdite, une destination non autorisée, un bénéficiaire de paiement vide ou un montant supérieur au solde.
- Applique `account.limit` comme **plafond fictif de sortie par opération**, pour les deux comptes, dans les écrans dédiés et les formulaires familiaux.
- Distinction de la **double validation fictive** après `otpThreshold`, avec deux responsables éligibles.
- Le récapitulatif et l'écran d'approbation expliquent les limites des validations.

Le modèle fictif des données n'a pas été modifié ; F5 réinitialise les données. Les seuils ne sont pas des décisions bancaires officielles.

## Confidentialité et contrôle des accès

Un profil non habilité ne peut plus afficher les détails bancaires d'un compte ouvert ni les informations d'une demande de Compte joint qui ne le concerne pas. Les cartes rattachées à un compte sont filtrées selon les autorisations du profil actif.

## Fichiers mis à jour

- `src/family/accounts/accountRules.ts` : nouveau module de règles et d'états.
- `src/family/AccountJourneys.tsx` : suivis de demandes, formulaires et clôture.
- `src/family/FamilyExperience.tsx` : plafond cohérent et retrait d'un ancien raccourci direct d'ouverture du compte joint.
- `scripts/accounts-test.cjs` : nouveaux tests de sécurité, consentement et clôture.
- `package.json` : lancement automatique des tests.

## Recette manuelle conseillée

1. **Lamia → Compte joint → Ouvrir** : choisir Karim, valider la simulation des conditions et envoyer la demande.
2. Sur l'écran d'attente, constater que Lamia **ne peut plus simuler l'accord de Karim**.
3. **Mode démo → Karim → Compte joint** : accepter la demande et vérifier l'état de validation bancaire. Tester aussi le scénario de refus (après réinitialisation).
4. Finaliser la validation bancaire simulée. Contrôler le compte actif et les deux cotitulaires.
5. **Mode démo → Yasmine** : contrôler que les détails du Compte joint restent masqués.
6. Pour le Sous-compte Famille, ouvrir **Paramètres → Clôturer** avec Lamia : vérifier les conditions bloquantes quand le solde est non nul et la carte active.
7. Transférer le solde fictif dans un compte autorisé, suspendre la carte, puis vérifier que la clôture devient possible et que le retour vers la Home fonctionne.
8. Après la clôture, confirmer la disparition du Sous-compte Famille et de ses cartes associées, sans modification des pockets ou des projets.
9. Vérifier que le Co-leader Karim n'a pas le droit de clôturer le Sous-compte Famille.
10. F5 : le scénario fictif initial doit revenir. Tester aussi le bouton Retour durant les parcours à plusieurs écrans.

## Non-régression

La **carte photo « Notre famille »**, la Home, le menu flottant « Mes familles », les pockets et les fiches membres sont protégés et n'ont pas été redessinés. Les contrôles de TypeScript, les tests et le build sont exécutés par GitHub Actions sur la branche.

## Prochaine étape proposée

Étape 6 — objectifs d'épargne et cagnottes : participants, contributions, échéances, états de fin et traitement distinct des règles non validées pour les cagnottes familiales.
