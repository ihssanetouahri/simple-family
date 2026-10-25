# Simple Family — UX V2 · Étape 2 : permissions et données

## Statut

Étape 2 : mise en place des règles **dans le prototype existant**, sans modification graphique.
Branche exclusive : `feature/family-ux-v2`. Ne pas fusionner automatiquement dans `main`.

## Source métier

Cadrage « Simple Family – V2 », octobre 2026, périmètre **Famille** exclusivement. Les règles proposées mais non confirmées par le cadrage sont marquées comme hypothèses de démonstration.

## Architecture

- `src/family/model.ts` : données fictives et schémas conservés inchangés, afin de ne pas interrompre les parcours existants.
- `src/family/permissions.ts` : **nouveau module central** de fonctions d'autorisation pures et sans UI.
- `src/family/FamilyExperience.tsx` : appelle maintenant les règles partagées pour les affichages, les membres, les cartes, les projets, les cagnottes et les transferts.
- `src/family/AccountJourneys.tsx` : appelle les mêmes règles pour les comptes et la titularité.
- `scripts/permissions-test.cjs` : tests par rôle/compte, exécutés par `npm run test`.

### Matrice fonctionnelle

| Fonction | Leader | Co-leader | Membre Simple | Membre Simple One |
|---|---|---|---|---|
| Gérer familles/invitations | Oui | Oui | Non | Non |
| Supprimer la famille | Oui | Non | Non | Non |
| Modifier rôles / retirer Co-leader | Oui | Non | Non | Non |
| Retirer un membre standard | Oui | Oui | Non | Non |
| Consulter le Sous-compte Famille | Oui | Oui | Si habilité | Si habilité |
| Opérer sur Sous-compte Famille | Oui | Oui | Non | Non |
| Clôturer Sous-compte Famille | Oui | Non | Non | Non |
| Voir sa pocket / sa carte | Oui | Oui | Oui | Oui |
| Voir les pockets des autres | Oui | Oui | Non | Non |
| Gérer / attribuer les cartes familiales | Oui | Oui | Non | Non |
| Initier Compte joint | Sous conditions couple | Sous conditions couple | Non | Non |
| Opérer sur Compte joint | Si cotitulaire | Si cotitulaire | Non | Non |
| Créer une réservation familiale | Oui | Oui | Non | Non |

**Important :** les règles sur le compte joint dépendent de la **titularité réelle dans la famille**, et non de la seule étiquette « Co-leader ».

### Épargne et cagnottes

- Objectif d'épargne : visibilité au Leader/Co-leaders, propriétaire, contributeurs habilités ou contributeurs historiques ; édition au créateur / Leader / Co-leader.
- Retrait sur l'objectif : Leader, Co-leaders ou propriétaire ; alimentation : propriétaire ou contributeur habilité. Ces distinctions ne sont pas encore raccordées à tous les formulaires d'épargne — elles servent de fondation à l'étape « projets ».
- Cagnotte : gestion par créateur ou responsable, contribution par participant autorisé, historique réservé aux participants ou responsables. Les détails de remboursement/clôture **Famille** restent à valider.

### Contrôles d'opération

Les transferts simulés rejettent désormais une **source** ou **destination** interdite par le rôle actif, même si un formulaire essaie de l'utiliser directement. Les comptes personnels des autres membres ne peuvent pas être utilisés arbitrairement. Les droits du compte joint vérifient la liste des cotitulaires.

Les plafonds spécifiques Simple One, règles bancaires de transfert vers des comptes externes, seuil de double validation définitif, EER des non-clients et protection serveur restent **hors périmètre de cette étape**. Le seuil stocké dans `otpThreshold` est uniquement un paramètre de démonstration.

## Non-régression

La Home, la photo « Notre famille », le sélecteur flottant « Mes familles », le contenu des comptes et les données fictives n'ont pas été redessinés.

Contrôles :

```powershell
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

## Étape 3 — après validation

Créer la **fiche membre centralisée** : Lamia, Karim et Yasmine, pocket, cartes, activité, permissions, puis raccorder les nouveaux écrans aux règles de ce module. Garder inchangée la carte « Notre famille » sur la Home.
