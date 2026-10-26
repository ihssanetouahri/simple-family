# Simple Family — UX V2 · Étape 10 : recette globale

## Statut au 26 octobre 2026

**Recette automatisée effectuée sur `feature/family-ux-v2`.** Revue visuelle interactive au format iPhone : **reste à exécuter sur le prototype local**. La branche `main` reste inchangée.

## Contrôles automatisés effectués

Les contrôles GitHub Actions exécutent successivement :
- `npm run lint` : vérification TypeScript.
- `npm run test` : smoke test, permissions, profils membres, pockets, cartes, comptes partagés, épargne, alertes, services, PFM et **nouvelle recette transversale**.
- `npm run build` : compilation Vite de production.

Ces tests couvrent l'état initial fictif, la protection de la photo « Notre famille », l'ordre des sections Home, le dropdown « Mes familles », l'existence des parcours, les principales règles de droits, les événements contextuels, les montants visibles, les cycles de vie et les retours de navigation. Ils ne démontrent pas à eux seuls le rendu final sur un navigateur mobile.

## Corrections réalisées durant cette étape

### 1. Cartes, compte joint et confidentialité

- Une carte issue du Compte joint n'est plus automatiquement visible par un Co-leader **non cotitulaire**.
- Les cartes de Sous-compte Famille et de pockets restent filtrées selon leur source et le rôle du profil.
- La suspension/réactivation d'une carte vérifie les droits sur **la source de cette carte**, au moment du clic et dans la mise à jour.
- Un responsable non cotitulaire ne voit plus le Compte joint comme source de virement ou de création de carte.
- Le formulaire de demande de crédit fictif ne propose plus une source Compte joint sans cotitularité.

### 2. Masquage des montants

- Les menus d'alimentation et de transfert affichent des valeurs masquées si le masquage est activé.
- Les écrans du Sous-compte Famille et du Compte joint reçoivent désormais le paramètre de masquage, sans altérer les calculs de montants.
- Les cartes de progression des projets d'épargne et des cagnottes respectent aussi le masquage des montants, tout en conservant leur pourcentage de progression.

Le prototype utilise toujours des données entièrement fictives. Les valeurs saisies volontairement dans un formulaire peuvent rester visibles à l'utilisateur pendant l'édition.

### 3. Retrait d'un membre et intégrité

Une suppression directe est refusée lorsqu'un membre a encore une pocket avec solde, une titularité/demande de Compte joint, des épargnes ou cagnottes associées, des cartes actives, des documents dont il est propriétaire, des réservations ou des demandes de crédit.

Le formulaire explique les obstacles ; il ne peut plus présenter un « reversement » de pocket après avoir supprimé la fiche propriétaire et les références de ses fonds. Lorsqu'un nouveau membre n'a aucune dépendance bloquante, sa suppression nettoie la liste des membres, sa pocket vide, ses cartes et les autorisations de consultation.

**À valider avec les métiers :** réattribution d'un projet, procédure réelle de retrait d'un membre disposant de fonds, conservation des historiques et clôture des comptes liés. Ces règles ne sont pas inventées par cette étape.

## Parcours de recette UX manuelle (à tester dans Cursor)

| # | Profil / départ | Actions | Résultat attendu |
|---|---|---|---|
| 1 | Lamia · Home | Vérifier « Notre famille » et « Mes familles », puis défiler | Hero, photo, sélecteur flottant, sections et raccourcis inchangés |
| 2 | Lamia · Membres | Ouvrir Yasmine, sa pocket, puis Retour | Fiche membre, détails et retour corrects |
| 3 | Yasmine · Mode démo | Consulter ses propres cartes et pockets | Les informations privées de Lamia et Karim ne sont pas visibles |
| 4 | Lamia · Pocket Yasmine | Alimenter, transférer, consulter Entrées / Sorties | Solde et historique cohérents ; limites fictives appliquées |
| 5 | Lamia · Compte joint | Demander l'ouverture puis basculer en Karim | Accord réservé à Karim ; états en attente / validation corrects |
| 6 | Compte joint actif | Revenir sur un profil non cotitulaire | Solde, cartes et sources de transferts joint masqués |
| 7 | Lamia · Comptes | Essayer de clôturer un Sous-compte avec un solde non nul | Motif de blocage puis clôture possible uniquement après conditions remplies |
| 8 | Lamia · Objectif | Contribuer, clôturer et revenir au détail | Reversement fictif enregistré une fois ; aucune double restitution |
| 9 | Lamia · Cagnotte | Inviter, contribuer, clôturer | Totaux et participants mis à jour ; aucune restitution inventée |
| 10 | Lamia / Karim / Yasmine | « À suivre en famille », puis « Voir tout » | Rappels visibles selon les droits et liens vers les bonnes pages |
| 11 | Tous les services | Voyager depuis la fiche Yasmine ; préparer un brouillon de chat | Voyageur présélectionné, brouillon non envoyé automatiquement |
| 12 | Mon foyer PFM | Afficher les dépenses communes, puis changer de profil | Catégories filtrées par compte et autorisation, pas de données de comptes personnels |
| 13 | Chaque profil | Masquer les montants, puis parcourir cartes d'épargne et comptes | Montants protégés là où le masquage est pris en charge |
| 14 | Nouveau membre sans dépendance | Ajouter puis retirer le membre | Retrait possible ; droits de consultation révoqués |
| 15 | Membre avec fonds/projets | Demander son retrait | Action refusée avec une explication lisible |
| 16 | Tous parcours | Utiliser Retour, fermer les bottom sheets, recharger F5 | Navigation cohérente ; F5 rétablit la démo initiale |

## Vérifications spécifiques iPhone / responsive (à faire manuellement)

- Écran 375 × 812 px et, si possible, largeur 390 px.
- Aucun scroll horizontal involontaire sur Home, fiches membres, comptes, cagnottes, PFM et feuilles de formulaire.
- Aucun texte, montant ou CTA tronqué.
- Les boutons d'action et la flèche Retour restent accessibles d'une main ; focus et état désactivé lisibles.
- Les bottom sheets n'empiètent pas sur les actions importantes et défilent si le contenu dépasse la hauteur.
- Le clavier mobile ne rend pas inaccessibles les champs de saisie ou la validation.
- Le menu « Mes familles » est affiché au-dessus de la Home, sans modifier sa hauteur.

Les contrôles **visuels, tactiles et clavier mobile** ne peuvent pas être certifiés par les scripts actuels. Ils nécessitent une recette dans le navigateur ou sur appareil.

## Commandes pour recette locale

```powershell
git status
git pull origin feature/family-ux-v2
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd run dev
```

Accéder à `http://localhost:3000`. Si `git status` montre des modifications locales non enregistrées, les conserver avant d'exécuter `git pull`.

## Décision de validation

- **Code et tests automatiques :** validés lorsque la dernière action GitHub est verte.
- **Visuel iPhone et gestuelle :** à valider avec le propriétaire du prototype dans Cursor.
- **Règles métier définitives :** toujours à confirmer pour les plafonds Simple One, consentements réels, cagnottes, clôtures et transfert de responsabilités.
- **Mise en production / branche main :** non demandée et non effectuée.

Ne pas fusionner `feature/family-ux-v2` avant le contrôle visuel et la validation métier.
