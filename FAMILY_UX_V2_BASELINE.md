# Simple Family — UX V2 · Référence de départ (phase 00)

Statut : préparation technique uniquement. Cette phase ne modifie **aucun écran ni parcours fonctionnel**.

## Point de départ

- Dépôt : `ihssanetouahri/simple-family`
- Branche de travail : `feature/family-ux-v2` (créée depuis `main`)
- Application locale : React 19, TypeScript, Vite, Tailwind et données entièrement fictives.
- Références UI existantes : `DESIGN_SYSTEM.md` et les composants déjà employés dans le projet.
- Écrans existants :
  - `src/family/FamilyExperience.tsx` : Home « Ma famille », membres, pockets, épargne, cagnottes, services, menu de familles et navigation.
  - `src/family/AccountJourneys.tsx` : Sous-compte Famille, Compte joint, ouverture simulée, opérations, cartes, permissions, historique et paramètres.
  - `src/family/model.ts` : profils, droits simples, comptes, projets, données fictives et état de session.

## Invariants à ne pas casser

1. Conserver **à l'identique** la carte photo « Notre famille », y compris la photo, les boutons « Mes familles » et « Voir les membres », les avatars et les classes UI. Le test compare désormais cette section à `scripts/snapshots/family-hero.tsx.snap`.
2. Conserver l'ordre de la Home : « À suivre en famille », « Comptes partagés », « Pockets des membres », « Nos projets d’épargne », « Nos cagnottes » et « Services familiaux ».
3. Conserver le menu **flottant** « Mes familles » : il ne doit pas insérer un panneau dans le flux vertical de la Home.
4. Conserver les quatre raccourcis des services familiaux, notamment « Autres ».
5. Conserver les accès directs aux deux parcours : « Sous-compte Famille » et « Compte joint ».
6. Conserver la logique de retour vers **la page immédiatement précédente**, y compris dans les étapes internes d'un compte.
7. Conserver les profils fictifs Lamia, Karim et Yasmine et les scénarios existants.
8. Conserver les changements au cours d'une session de navigation, mais **réinitialiser toutes les données après actualisation F5**.
9. Ne pas confondre rôle familial et titularité/droits bancaires. Les fonctionnalités sans service réel restent signalées comme simulations.

## État fonctionnel actuel et prochaines évolutions

| Zone | Base présente | Travail futur, après validation |
|---|---|---|
| Membres | Liste, rôles, invitations | Fiche membre centrale et accès contextuels |
| Pockets | Soldes, mouvements simulés et cartes | Historique par pocket, droits et supervision Simple One |
| Sous-compte Famille | Parcours dédié, transferts, gestion | États d'erreur, contrôle des permissions, clôture et impacts |
| Compte joint | Découverte, demande à deux, accords fictifs, compte actif | Reprise, validation, exceptions, contrôles et consentements |
| Épargne | Projets, contributions, échéances | Fin de vie et coordination des virements programmés |
| Cagnottes | Contributions et participants | Règles de clôture et de reversement à valider |
| Alertes | Facture et invitation fictives | Déclencheurs multi-services, tri et résolution |
| Services | Chat, voyage, documents, paiements, fidélité | Passerelles entre parcours |
| PFM | Entrée / passerelle fictive | Lien vers la véritable expérience PFM distincte |

## Organisation future (sans refonte globale)

Lors des phases suivantes, extraire progressivement les sous-parcours de `FamilyExperience.tsx` (plus de 1 100 lignes) et `AccountJourneys.tsx` vers des modules isolés. Cibles possibles : `members/`, `pockets/`, `accounts/`, `savings/`, `services/`, `rules/` et `demo/`.

**Ne pas** créer tous ces dossiers ni déplacer le code en phase 00 : ce serait risqué et n'apporterait aucune valeur UX immédiate.

## Vérifications automatisées

`scripts/smoke-test.cjs` contrôle :
- le scénario de démonstration et les rôles/permissions de base ;
- la syntaxe TSX des deux parcours actuels ;
- le snapshot de la carte « Notre famille » ;
- les sections et raccourcis de la Home ;
- les routes des deux comptes et la navigation retour ;
- la conservation des modifications au cours d'une session et leur réinitialisation après chargement d'un nouveau module.

Le workflow `.github/workflows/family-ux-v2.yml` lance, pour la branche et pour les pull requests ciblant `main` :

```powershell
npm.cmd install --no-audit --no-fund
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

Sous macOS/Linux, utiliser `npm` au lieu de `npm.cmd`.

**Limites connues :**
- Le dépôt GitHub n'a actuellement pas de `package-lock.json` : le workflow utilise `npm install` et non `npm ci`. L'ajout contrôlé d'un lockfile serait préférable avant des livraisons de production.
- La réussite du workflow doit être vérifiée dans GitHub Actions. Les tests statiques ne remplacent pas la recette visuelle et interactive sur mobile.
- Les règles bancaires, seuils de validation et parcours non confirmés par le métier ne doivent pas être présentés comme des fonctionnalités bancaires réellement disponibles.

## Suite

Phase 01 : consolider les droits et les données avec de petits changements ciblés, puis valider une première fiche membre Lamia/Karim/Yasmine avant d'étendre les pockets.
