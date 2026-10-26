# Simple Family — UX V2 · Étape 8 : services familiaux contextualisés

## Statut

Implémenté exclusivement sur la branche `feature/family-ux-v2`. Aucun appel bancaire, aucune réservation réelle, aucun fichier hébergé et aucun message envoyé automatiquement.

## Intention UX

Faire évoluer les services de simples destinations indépendantes vers des actions utiles **depuis le contexte familial**, sans déplacer ni redessiner la carte photo « Notre famille » ni modifier les **4 raccourcis** de la Home : Chat familial, Simple Trip, Documents, Autres.

## Nouveautés

### 1. « Tous vos services » : rubrique « Pour votre famille »

Suggestions affichées uniquement quand elles correspondent au scénario et aux habilitations :

- Réservation familiale fictive accessible → rejoindre Simple Trip.
- Objectif d'épargne « Vacances », « Voyage », « Week-end » ou « Séjour » actif et accessible → suivre le projet.
- Cagnotte active que l'utilisateur peut consulter → ouvrir sa cagnotte.
- Document dont l'utilisateur a le droit de voir les métadonnées → ouvrir son coffre-fort.
- Discussion familiale existante → revenir au Chat.

Quatre suggestions maximum, sans répliquer la section d'alertes de l'étape 7. Les recommandations ne prétendent pas provenir d'un moteur IA bancaire.

### 2. Fiche membre → services

Depuis « Voir les membres » → fiche Lamia, Karim ou Yasmine :

- Un Leader ou Co-leader peut **préparer un voyage pour ce membre** : l'écran Simple Trip s'ouvre, avec son nom en contexte, et l'éventuel formulaire de nouvelle réservation le présélectionne.
- Un membre peut **consulter les documents accessibles** selon les droits déjà définis.
- Un membre peut **ouvrir le chat familial** pour échanger avec ses proches.

Aucun fichier, carte ou solde privé d'un autre membre n'est exposé par ce raccourci.

### 3. Projets, cagnottes, réservations → chat

Les fiches d'objectif d'épargne et de cagnotte accessibles ainsi que les réservations visibles proposent « Préparer un message pour la famille ».

- La destination est le **chat familial existant**.
- Le message est **prérempli** avec le nom du projet, de la cagnotte ou du voyage, sans montants ni informations bancaires privées.
- L'utilisateur peut modifier le texte, l'effacer ou l'envoyer volontairement.
- Aucun message n'est envoyé au simple clic sur le raccourci.

### 4. Simple Trip : accompagnement plutôt que parcours isolé

- Quand on y accède depuis une fiche membre, le **voyageur est préselectionné**.
- Seuls le Leader et les Co-leaders peuvent créer une réservation fictive ; le voyageur doit appartenir à la famille.
- Une date passée, une destination vide ou un budget négatif sont refusés.
- Les responsables peuvent consulter les réservations fictives de la famille ; un membre standard consulte uniquement celles où il est le voyageur.
- Une réservation peut être préparée en brouillon pour le chat.
- La page relie aussi les objectifs de voyage accessibles, le coffre-fort et le chat.

**Limite :** aucune réservation Simple Trip n'est réellement réalisée, ni aucun cashback calculé ; l'intégration à l'application Simple n'est pas effective.

### 5. Coffre-fort : droits et lisibilité

- Liste des références filtrée par la politique d'autorisation existante.
- État vide explicite lorsqu'aucune fiche n'est consultable.
- Les personnes habilitées à une fiche document sont limitées aux membres existants. Son propriétaire reste autorisé.
- Aucun téléversement, téléchargement ou stockage de contenu documentaire n'est implémenté : ce sont des fiches de métadonnées fictives.

## Fichiers modifiés

| Fichier | Description |
|---|---|
| `src/family/services/serviceLinks.ts` | Nouvelle logique des suggestions par profil, brouillons du chat et droits de réservation |
| `src/family/members/MemberProfile.tsx` | Raccourcis de services depuis chaque fiche membre |
| `src/family/FamilyExperience.tsx` | Hub des services, parcours Trip, liste de documents et brouillons contextuels |
| `scripts/services-test.cjs` | Tests des suggestions, de la confidentialité, des réservations et des brouillons |
| `package.json` | Tests des services exécutés dans GitHub Actions |

## Recette manuelle recommandée

1. Depuis la Home, confirmer que les quatre raccourcis sont strictement **Chat familial / Simple Trip / Documents / Autres**.
2. Ouvrir **Autres → Pour votre famille** : vérifier les liens vers un objectif, une cagnotte, les documents et le chat selon le scénario.
3. **Voir les membres → Yasmine → Préparer un voyage pour Yasmine** : vérifier l'en-tête avec Yasmine puis le formulaire de réservation, prérempli avec Yasmine.
4. Simuler une réservation avec destination et date à venir, puis vérifier son apparition dans Simple Trip.
5. Sur la réservation, cliquer **Préparer un message dans le chat** : constater que le texte est prérempli, mais non envoyé.
6. Revenir au projet « Vacances en famille » et préparer un message ; vérifier que le texte peut être modifié avant un envoi manuel.
7. Effectuer le même test depuis la cagnotte « Anniversaire de Yasmine ».
8. **Mode démo → Yasmine** : le bouton de création de réservation n'apparaît pas. Yasmine peut uniquement voir les réservations où elle est désignée comme voyageuse, et les documents partagés avec elle.
9. Depuis le coffre-fort, ajouter une fiche avec un partage limité, puis changer de profil pour vérifier sa confidentialité. La fiche doit rester dans la démo en cours, sans fichier uploadé.
10. F5 réinitialise la démo. Vérifier le bouton Retour et l'apparence inchangée de la carte « Notre famille ».

## Points restant à valider par les métiers

- Intégration effective à Simple Trip (réservation, identité, consentement, éligibilité, paiements, cashback).
- Classification et stockage réel des documents, partage, révocation, date d'expiration et habilitations bancaires.
- Canal de chat réel, confidentialité inter-familles, notifications, modération et conservation des messages.
- Habilitations plus fines selon l'âge et le statut Simple One.

## Validation

```powershell
git pull origin feature/family-ux-v2
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

## Étape suivante après validation

Étape 9 — articuler « Ma famille » et le PFM « Mon foyer » sans les confondre, puis étape 10 — recette UX globale et corrections de régression.
