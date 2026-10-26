# Simple Family — Amélioration UX 2 : parcours simplifiés

## Périmètre livré

Suite à l'analyse de la vidéo de démonstration, trois améliorations ont été implémentées sur `feature/family-ux-v2`. Il ne s'agit pas d'une refonte et `main` n'est pas modifiée.

### 1. Fiche membre : Finances / Services / Accès

- En-tête et photo du membre conservés.
- Trois onglets compacts juste sous la fiche : **Finances**, **Services**, **Accès**.
- **Finances** : pocket, cartes, opérations récentes et projets d'épargne, avec les mêmes droits de consultation et d'opération.
- **Services** : voyage, documents accessibles, chat familial.
- **Accès** : permissions de pocket, Sous-compte Famille et Compte joint, avec renvoi vers les réglages si autorisé.
- Un changement de membre réinitialise l'onglet **Finances**.
- Les droits ne sont pas élargis par le changement de navigation.

### 2. Compte joint : parcours d'ouverture raccourci

Avant : Présentation → Choix du cotitulaire → Vérification des informations → Conditions → Demande/accord du second cotitulaire → Validation bancaire fictive.

Maintenant : **Présentation → Choix du cotitulaire (étape 1/2) → Vérification des deux personnes et conditions (étape 2/2) → Suivi de la demande**.

- Le récapitulatif des deux personnes est intégré à l'écran des conditions, avec un lien pour modifier le cotitulaire.
- La lecture des conditions et la confirmation fictive du premier titulaire restent nécessaires.
- Le second titulaire doit toujours basculer sur **son propre profil dans Mode démo** pour confirmer ou refuser.
- La validation bancaire simulée après l'accord reste une étape séparée.
- Aucun OTP réel, KYC bancaire ou signature contractuelle n'est prétendu effectif.

### 3. Cagnotte : statut regroupé avec la progression

- Le badge de statut est maintenant affiché dans **la carte de progression de la cagnotte**, avec les montants collectés et restants.
- Suppression de la deuxième carte qui répétait « Collecte en cours » et le nombre de participants.
- Un message court est conservé uniquement pour les situations particulières : date proche/dépassée ou collecte clôturée.
- Distinction « Objectif atteint » et « Collecte clôturée ».
- Les participants, invitations, montants par membre, contributions récentes, brouillon de chat, menu de modification et clôture restent disponibles.

## Tests automatisés

Un nouveau test `scripts/ux-simplification-test.cjs` vérifie les trois onglets, le chemin raccourci du Compte joint, le maintien des validations et les fonctionnalités de cagnotte, en plus des suites de tests précédentes. GitHub Actions exécute lint, tests et build.

## Recette manuelle dans Cursor

1. `git pull origin feature/family-ux-v2`, puis ouvrir `http://localhost:3000/`.
2. **Ma famille → Membres → Yasmine** : basculer entre Finances, Services et Accès. Vérifier l'absence de long défilement et la présence des anciennes fonctionnalités dans leur onglet.
3. Revenir aux membres et ouvrir **Karim** : l'onglet initial doit redevenir Finances.
4. **Compte joint → Ouvrir** : choisir Karim, aller directement à l'écran « Vérifier et confirmer », vérifier les deux noms et les conditions.
5. Cliquer **Modifier** : retour au choix du cotitulaire.
6. Confirmer la demande depuis Lamia, puis **Mode démo → Karim** pour accepter ou refuser. La validation bancaire fictive doit rester disponible après acceptation.
7. **Cagnottes → Anniversaire de Yasmine** : vérifier que statut, pourcentage et montants apparaissent ensemble, sans seconde carte « Collecte en cours ».
8. Vérifier les invitations, participants, contributions et les états cible atteinte/collecte clôturée.
9. Vérifier la carte photo « Notre famille » et tous les raccourcis Home. Aucune modification attendue.

## Limites

Le code a été testé automatiquement, mais l'ergonomie tactile, la hauteur de l'en-tête collant et les retours dans des parcours réels doivent toujours être vérifiés dans le navigateur mobile avant fusion sur `main`.

## Suite proposée, après validation

Amélioration 3 : indicateurs de carrousel, `+N` avatars dans le hero familial et clarification des sections « Suggestions » / « Tous les services ». Aucun changement automatique avant accord.
