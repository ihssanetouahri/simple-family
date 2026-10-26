# Simple Family — Amélioration UX 3 : détails de navigation et services

## Statut

Implémentée sur `feature/family-ux-v2`, sans changement de la branche `main`. C'est un ajustement UX ciblé, pas une refonte de l'application.

## 1. Repères de navigation des carrousels

- Les aperçus Home **« Nos projets d'épargne »** et **« Nos cagnottes »** conservent leurs cartes, photos et leur défilement horizontal.
- Sous chaque carrousel contenant deux cartes ou plus, de petits indicateurs violets montrent la position courante, complétés d'un discret **1/2** ou **2/2**.
- Les indicateurs sont cliquables : un clic provoque un défilement animé vers la carte correspondante.
- Un glissement tactile ou à la souris actualise aussi le repère de position. L'élément actif est annoncé aux aides techniques.
- Avec zéro ou une seule carte, les points ne sont **pas** affichés.
- L'aperçu de la Home conserve les **deux premières cartes actives** ; le bouton « Voir tout » reste disponible pour explorer la collection complète.
- Le composant est isolé dans `src/family/components/FamilyPreviewCarousel.tsx`.

## 2. Nombre de membres sur la carte « Notre famille »

- La **photo, le gradient violet, le titre, les deux CTA/commandes, les dimensions et le positionnement** du hero sont conservés.
- La carte affiche toujours les trois premiers avatars. À partir du quatrième membre, une petite pastille **+1**, **+2**, etc. apparaît immédiatement après ces avatars.
- La pastille est **absente** dans l'état fictif initial, qui compte trois membres.
- Cliquer sur la pastille conduit à la page « Membres et accès ».
- Une nouvelle référence de non-régression (`scripts/snapshots/family-hero.tsx.snap`) autorise uniquement cette évolution du groupe d'avatars. Les autres éléments du hero restent protégés.

## 3. Suggestions versus catalogue des services

- La page « Tous vos services » distingue désormais :
  - **Suggestions pour votre famille** : raccourcis ciblés vers un projet d'épargne actif, une cagnotte active, un voyage fictif existant ou un document accessible au profil.
  - **Explorer tous les services** : catalogue complet, organisé en « Paiements et réservations », « Vie de famille » et « Autres avantages ».
- Le lien générique « Reprendre la discussion familiale » n'est plus répété dans les suggestions. Le chat reste disponible dans le catalogue et sur la Home.
- Les droits existants par profil sont conservés. Les suggestions ne montrent aucune information inaccessible à l'utilisateur actuel.
- Les quatre raccourcis Home **Chat familial, Simple Trip, Documents et Autres** restent identiques.

## Fichiers mis à jour

- `src/family/components/FamilyPreviewCarousel.tsx` (nouveau)
- `src/family/FamilyExperience.tsx`
- `src/family/services/serviceLinks.ts`
- `scripts/snapshots/family-hero.tsx.snap`
- `scripts/ux-visual-details-test.cjs` (nouveau)
- `package.json`

## Recette locale conseillée

1. Dans le terminal Cursor, `git status`, puis `git pull origin feature/family-ux-v2` si la branche est bien la branche de travail et s'il n'existe pas de modifications locales non enregistrées.
2. Ouvrir `http://localhost:3000/` et actualiser.
3. Depuis Lamia, faire défiler **Nos projets d'épargne** puis **Nos cagnottes** : le repère doit passer de 1/2 à 2/2. Cliquer sur le premier point pour revenir.
4. Ouvrir **Voir tout** : la liste complète doit rester accessible. Si une seule carte reste active, aucun point n'apparaît sous le carrousel.
5. La Home initiale comporte trois membres : aucun **+N** ne doit être affiché.
6. Ajouter un quatrième membre dans la démo : la carte « Notre famille » doit afficher trois avatars et **+1**. Un clic sur **+1** doit ouvrir les membres.
7. Depuis les services, vérifier la séparation **Suggestions pour votre famille** / **Explorer tous les services** et le classement du catalogue. Le chat ne doit plus être répété en suggestion générique.
8. Passer sur le profil Yasmine : les suggestions doivent suivre ses permissions, sans exposer de données privées.
9. Contrôler le rendu et la zone tactile des points sur un écran iPhone (375–390 px), sans scroll horizontal de la page.

## Contrôles automatisés

GitHub Actions : `npm run lint`, `npm run test` (dont tests de structure et rendu serveur React du nouveau carrousel) et `npm run build`. Les tests ne remplacent pas une revue tactile sur le véritable prototype local.

## Suite à discuter après validation

Effectuer une nouvelle capture ou vidéo de courte durée sur l'écran iPhone pour confirmer les améliorations 1, 2 et 3, puis préparer si souhaité la fusion contrôlée vers `main`. Aucun merge n'est effectué ici.
