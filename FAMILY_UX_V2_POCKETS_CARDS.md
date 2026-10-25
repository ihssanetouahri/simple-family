# Simple Family — UX V2 · Étape 4 : pockets et cartes virtuelles

## Statut

Implémenté uniquement sur `feature/family-ux-v2`. Aucune modification de la branche `main`. Le parcours est entièrement fictif, sans transaction, carte ni validation bancaire réelles.

## Nouveaux parcours

### Détail d'une pocket

`Ma famille` → `Pockets des membres` → `Pocket Yasmine`, ou
`Ma famille` → `Voir les membres` → `Yasmine` → `Voir les détails de la pocket`.

Le détail affiche :
- le propriétaire, la photo, le type de compte et le solde ;
- les actions d'alimentation et de transfert liées au formulaire existant ;
- les cartes associées à **cette pocket** avec statut actif ou suspendu ;
- l'historique des mouvements de la pocket avec filtres **Tous / Entrées / Sorties** ;
- le détail d'un mouvement (date, montant, catégorie, source et destination) ;
- les réglages accessibles aux responsables et un retour vers la fiche membre.

Une liste vide affiche un état explicite ; les mouvements appartiennent à la pocket et ne contiennent pas le détail des comptes privés des autres membres.

### Supervision Simple One

Pour Yasmine, le responsable peut consulter sa pocket et ses cartes, suspendre ou réactiver une carte fictive et ajuster un **plafond fictif de virement sortant par opération**. Yasmine peut consulter ses ressources accessibles, mais ne peut pas paramétrer les plafonds ou suspendre une carte familiale.

**Attention :** le plafond `pocket.limit` est dorénavant appliqué uniquement aux **virements sortants depuis une pocket dans cette démo**. Il n'est pas un plafond de paiement par carte, un plafond réglementaire Simple One, ni un cumul mensuel. Il ne limite pas les alimentations entrantes. Les règles bancaires réelles restent à préciser.

Le prototype n'affiche plus un graphique « solde / plafond » laissant croire que le plafond était un objectif de solde.

### Cartes familiales

- Liste des cartes accessibles selon le profil.
- Filtrage sur le membre sélectionné lorsque la liste est ouverte depuis une fiche membre ou une pocket.
- Carte masquée, titulaire, source (Sous-compte / Compte joint / pocket), statut.
- Détails extensibles et raccourci vers la pocket associée.
- Suspension et réactivation fictives par les responsables habilités.
- Création de carte : validation de la cohérence entre **source, titulaire et droits**. Par exemple une carte de pocket ne peut pas être attribuée à un autre membre et une carte de compte joint exige une véritable titularité.

Le prototype n'exécute **aucun paiement par carte**. Aucune carte bancaire réelle n'est émise ni bloquée.

## Fichiers

| Fichier | Modification |
|---|---|
| `src/family/pockets/PocketDetail.tsx` | Nouvel écran de détail de pocket, historique et supervision |
| `src/family/pockets/FamilyCardsView.tsx` | Gestion des cartes avec détails et statuts |
| `src/family/pockets/pocketRules.ts` | Vérification du plafond fictif de sortie et des droits |
| `src/family/permissions.ts` | Vérification de création de cartes selon source/titulaire |
| `src/family/FamilyExperience.tsx` | Raccordement aux routes et actions existantes |
| `src/family/members/MemberProfile.tsx` | Clarification du plafond vs solde |
| `scripts/pockets-test.cjs` | Nouveaux contrôles automatisés |
| `scripts/member-profile-test.cjs` | Adaptation au composant de cartes extrait |

## Recette manuelle conseillée dans Cursor

1. **Lamia → Yasmine → Pocket** : vérifier le solde, le plafond fictif et l'historique.
2. **Alimenter** la pocket avec une somme fictive : vérifier le solde et l'apparition d'une entrée dans l'historique.
3. **Transférer** depuis la pocket et vérifier l'apparition d'une sortie dans l'historique.
4. Pour tester le plafond : avec une pocket disposant d'un solde suffisant, saisir un montant supérieur au plafond configuré et vérifier le message de refus.
5. **Cartes associées → Détails et gestion** : suspendre puis réactiver une carte, vérifier que le statut évolue.
6. **Mode démo → Yasmine** : vérifier qu'elle ne peut ni modifier un plafond ni suspendre une carte et qu'elle ne voit pas les ressources personnelles de Karim.
7. **Créer une carte** pour la pocket Yasmine : vérifier l'attribution au bon titulaire ; une combinaison non éligible doit être refusée.
8. Tester la flèche Retour à partir d'un parcours de compte vers un membre, puis sa pocket et ses cartes.
9. **F5** : retrouver la démo initiale.
10. Vérifier la carte « Notre famille » : visuel et structure inchangés.

## Limites métier

- Les seuils réglementaires et opérationnels de Simple One, l'âge et les règles d'autorisation bancaire sont à valider auprès des responsables métier.
- Le plafond de cette étape est uniquement un garde-fou fictif appliqué aux virements sortants de pocket, pas un contrôle transactionnel serveur.
- L'historique des mouvements de pocket provient des opérations simulées présentes dans la démo ; il ne remplace pas un relevé bancaire complet.
- La suspension/réactivation ne déclenche aucun appel bancaire et ne modifie pas les paiements existants.

## Prochaine étape

Étape 5 — compléter **Sous-compte Famille** et **Compte joint** : état des demandes, sécurité à deux, erreurs, reprise, plafond, clôture et conséquences sur les fonds/cartes, sur la même branche et sans redessiner la Home.
