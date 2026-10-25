# Simple Family — UX V2 · Étape 3 : fiche membre

## Statut

Implémentation sur `feature/family-ux-v2`, sans modification de la Home ni fusion vers `main`.

## Parcours livré

`Ma famille` → bouton **« Voir les membres »** (inchangé) → `Membres et accès` → cliquer **Lamia**, **Karim** ou **Yasmine** → **fiche membre**.

La nouvelle fiche comporte :
1. **Identité** : photo, nom, relation, rôle familial et type de compte (Simple ou Simple One).
2. **Pocket** : solde fictif, plafond indicatif, progression, raccourcis Alimenter, Transférer, et Détail de pocket.
3. **Cartes virtuelles** : cartes visibles pour le profil actif, statut, numéro masqué et accès à la gestion des cartes du membre.
4. **Activité récente** : uniquement les mouvements rattachés à la pocket de ce membre, jamais toute l'activité du Sous-compte Famille ou d'un compte personnel tiers.
5. **Objectifs associés** : objectifs du membre accessibles au profil connecté ; ouverture du détail existant.
6. **Droits et accès** : permissions de consultation/opération du profil actif, accès du membre au Sous-compte Famille, et titularité du Compte joint si ouvert.

## Intégration technique

- `src/family/members/MemberProfile.tsx` : composant indépendant de profil.
- `src/family/members/memberSelectors.ts` : filtre des mouvements, cartes et objectifs selon l'utilisateur actif.
- `src/family/FamilyExperience.tsx` :
  - nouvelle route `member` ;
  - clic sur la liste des membres → fiche, et non plus directement pocket ;
  - les raccourcis pockets de la Home continuent d'ouvrir directement la pocket ;
  - accès aux cartes filtré par membre (via le profil ou la pocket) ;
  - boutons d'action reliés aux formulaires existants ;
  - conservation des étapes internes de compte à travers les pages membre/pocket/cartes lorsque le compte figure dans la pile de navigation.

## Sécurité et règles métier

- L'utilisateur Simple One peut consulter sa pocket et sa carte selon les droits existants, mais ne voit pas celles d'autres membres.
- Un Leader/Co-leader peut visualiser les données de pocket autorisées.
- Aucune donnée de compte personnel d'un autre membre n'est affichée.
- Les mouvements affichés dans la fiche ne comprennent **que les mouvements de la pocket** : il ne s'agit pas d'un relevé bancaire exhaustif ni d'une analyse de toutes les dépenses du membre.
- Le plafonnement Simple One réel, la supervision parentale avancée et l'historique bancaire complet feront l'objet de la phase suivante.
- Les actions restent des simulations locales, sans appel aux systèmes bancaires.

## Non-régression

Les éléments suivants restent inchangés : la carte « Notre famille », son visuel et son bouton « Mes familles » ; l'architecture de la Home ; les données fictives de Lamia, Karim et Yasmine ; et les interfaces du Sous-compte Famille et du Compte joint.

Tests ajoutés dans `scripts/member-profile-test.cjs` et exécutés via `npm run test` : données accessibles par profil, confidentialité, filtrage de cartes, activité de pocket, objectifs, navigation et préservation des étapes bancaires.

## Recette manuelle conseillée

1. Lamia → « Voir les membres » → Yasmine : voir son identité, sa pocket fictive, sa carte virtuelle, son alimentation et l'objectif « Études de Yasmine ».
2. Cliquer « Alimenter » : saisir une somme fictive et vérifier son solde de pocket.
3. Cliquer « Gérer les cartes » : voir uniquement les cartes du membre et leur statut.
4. Revenir en arrière : fiche membre → liste des membres.
5. Sur la Home, cliquer directement sur la pocket Yasmine : constater que le parcours existant ouvre toujours le détail pocket.
6. Dans « Mode démo », choisir Yasmine : elle doit voir sa fiche, mais pas la pocket ni les cartes privées de Lamia et Karim.
7. Actualiser F5 : toutes les données fictives retrouvent leur valeur initiale.

## Étape suivante (après validation)

Étape 4 — enrichissement des pockets/cartes : historique détaillé, supervision Simple One, comportements des plafonds et contrôle des opérations.
