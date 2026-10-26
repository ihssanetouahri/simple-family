# Simple Family — UX V2 · Étape 9 : passerelle « Ma famille » / PFM « Mon foyer »

## Statut

Implémentée sur la seule branche `feature/family-ux-v2`, sans fusionner le prototype PFM Google AI Studio et Simple Family.

## Objectif

Faire comprendre la séparation des usages :
- **Ma famille : Gérer** les membres, rôles, accès, comptes, pockets, cartes, projets et cagnottes.
- **Mon foyer (aperçu PFM) : Comprendre** des mouvements financiers partagés accessibles, suivre les projets de la famille, puis revenir aux actions dans « Ma famille ».
- Le cycle produit cible **Comprendre → Agir → Apprendre** est explicité, sans simuler des budgets, diagnostics IA, défis, recommandations ou Learn & Earn qui ne sont pas intégrés à ce code.

## Nouvelle page de démonstration « Mon foyer · PFM »

Le raccourci existant « Découvrir Mon foyer » sur la Home mène à une nouvelle page en lecture seule composée de :

1. **En-tête de présentation** : finalité de l'accompagnement financier familial, et articulation Comprendre/Agir/Apprendre.
2. **Deux espaces complémentaires** : Ma famille (gouvernance) versus Mon foyer PFM (lecture financière), avec retour vers Comptes partagés.
3. **Périmètre de données autorisées** : profil actif, liste explicite des comptes partagés accessibles, rappel que comptes Simple personnels et pockets ne sont pas intégrés dans les chiffres.
4. **Dépenses partagées visibles** : total des mouvements fictifs sortants et répartition par catégories, avec barres colorées ; un état restreint remplace les totaux si aucun compte partagé n'est consultable.
5. **Suivi des projets accessibles** : épargne en cours, cagnottes actives, liens directs vers les objectifs et les collectes.
6. **Vision cible distincte** : diagnostics, budgets, recommandations, défis et apprentissage identifiés comme **à connecter**, sans faux boutons d'accès.

Un bouton contextuel **« Comprendre les dépenses partagées »** a été ajouté depuis l'écran de **Comptes partagés**. Les actions dans la nouvelle vue ouvrent les routes existantes (Comptes, Membres, Projets, Cagnottes), avec une navigation Retour normale.

## Garantie de confidentialité

Le module de sélection `src/family/pfm/householdInsights.ts` applique les règles suivantes :

- Seuls les comptes partagés **actifs et consultables** par le profil courant sont éligibles : Sous-compte Famille (droit de lecture) et Compte joint (**cotitularité**, pas simplement rôle Co-leader).
- Les transactions comptabilisées doivent être des **débits à source explicite** de ces comptes. Les sources reconnues pour le Sous-compte sont `account`, `family`, `Sous-compte Famille` et son identifiant fictif ; pour le Compte joint, `joint`, `Compte joint` et son identifiant fictif.
- Les transferts entrants, virements depuis comptes Simple personnels, pockets et sources non reconnues ne sont pas comptés dans les dépenses.
- Aucune opération liée au Compte joint n'est visible à un responsable non cotitulaire.
- Les projets d'épargne sont filtrés selon `canViewSavingsGoal` et seules les épargnes **actives** sont additionnées.
- Les cagnottes sont consultables selon les règles de contribution et de responsabilité. Elles **ne sont pas additionnées aux soldes d'épargne**.
- L'option globale du prototype `showAmounts` masque les valeurs monétaires dans la nouvelle vue.
- La page des Comptes partagés protège désormais aussi le **solde du Compte joint** des visiteurs non cotitulaires.

**Important :** les données d'opérations de la démo ne constituent pas un relevé exhaustif et ne possèdent pas de référentiel temporel fiable pour présenter « dépenses du mois », revenus, budget ou taux d'épargne. La page parle donc d'**opérations de démonstration visibles**, et non de chiffres mensuels.

## Fichiers

| Chemin | Travail |
|---|---|
| `src/family/pfm/householdInsights.ts` | Sélecteurs de mouvements et projets autorisés, catégorisation |
| `src/family/pfm/HouseholdPFMBridge.tsx` | Page UX de lecture PFM, sans actions bancaires |
| `src/family/FamilyExperience.tsx` | Navigation Family → PFM, PFM → comptes/projets, correction de confidentialité du compte joint |
| `scripts/pfm-test.cjs` | Vérification des autorisations, périmètres, données exclues et navigation |
| `package.json` | Inclusion du test au pipeline |

Les sources des données fictives de l'application restent inchangées.

## Scénarios de recette manuelle dans Cursor

1. Avec le profil **Lamia**, depuis la Home, cliquer « Découvrir Mon foyer ». Les cartes présentent la différence entre gestion de la famille et aperçu PFM.
2. Dans « Périmètre de cet aperçu », vérifier « Sous-compte Famille ». Le Compte joint n'apparaît pas tant qu'il n'a pas été ouvert et attribué aux cotitulaires.
3. La démo Lamia affiche **1 250 DH de sorties communes fictives**, réparties entre **Courses (520 DH), Factures (420 DH) et Loisirs (310 DH)**. L'alimentation de la pocket Yasmine (300 DH) ne doit pas compter comme dépense.
4. Cliquer sur « Vacances en famille » puis Retour : le parcours revient à l'aperçu PFM, sans casser la navigation.
5. Depuis la PFM, ouvrir « Gérer les comptes » ; depuis Comptes partagés, cliquer sur « Comprendre les dépenses partagées » pour refaire le trajet inverse.
6. Passer en **Mode démo → Yasmine** et rouvrir Mon foyer : les dépenses du Sous-compte Famille sont **restreintes** ; seuls les objectifs/cagnottes visibles avec son profil peuvent apparaître.
7. Dans « Réglages Famille », sous le profil habilité, accorder puis retirer à Yasmine le droit de lecture sur le Sous-compte Famille. Vérifier que le résumé réagit immédiatement.
8. Depuis Lamia et Karim, simuler l'ouverture du Compte joint : seules les personnes effectivement déclarées cotitulaires voient son solde, ses opérations et le périmètre PFM du compte joint.
9. Utiliser le contrôle de masquage des montants du prototype : le résumé PFM doit respecter ce choix.
10. Vérifier le bouton Retour, le contenu des 4 raccourcis « Services familiaux », et l'aspect strictement inchangé de la carte « Notre famille ».

## Limites explicites

La passerelle **ne synchronise pas** le prototype Family avec le prototype PFM séparé. Elle ne dispose pas de connexion bancaire, de consentement d'open banking, de coach IA, de catégorisation automatique, de budgets ni de mouvement bancaire réel. Les contenus visualisés se basent uniquement sur les données fictives et les droits front-end actuels. Les futures habilitations doivent aussi être contrôlées côté serveur.

## Étape suivante (après validation)

**Étape 10 — recette UX globale :** navigation de bout en bout, rôles, états vides, retours, affichages sensibles, responsive iPhone, messages et interactions. Corriger les anomalies constatées, sans remodeler la Home.
