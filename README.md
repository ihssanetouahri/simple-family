# Simple Family — Prototype interactif autonome

Prototype UX/UI **React + TypeScript + Vite + Tailwind CSS 4**, construit à partir de la base UI extraite de **Simple — Mon Espace Financier (PFM)**. Il reproduit la Home Simple, la navigation, les polices, les couleurs, les images fictives et les composants de l'export fourni.

Il est destiné à **tester les parcours « Ma famille » indépendamment de Google AI Studio**. Il n'embarque pas les écrans et moteurs du PFM d'origine.

## Démarrer sur Windows

1. Installer Node.js si nécessaire.
2. Décompresser le ZIP.
3. Ouvrir le dossier et double-cliquer sur **`demarrer-windows.bat`** (ou ouvrir un terminal dans ce dossier).
4. Sinon, exécuter manuellement :

```bash
npm install
npm run dev
```

Ouvrir **http://localhost:3000** dans le navigateur. Un accès Internet est nécessaire lors de la première installation des dépendances NPM.

## Fonctionnalités de démonstration

- **Accueil Simple** : accès à « Ma famille », Menu, Cartes et placeholder du PFM historique.
- **Multi-famille** : sélection et création d'une ou plusieurs familles, personnalisation du nom, leader permanent.
- **Membres et rôles** : Leader, Co-leaders, membres, invitations (acceptation simulée), restriction Simple One, suppression et pockets automatiques.
- **Comptes / pockets** : sous-compte Famille facultatif et unique, compte joint sous condition de Co-leader, pockets individuels, soldes, plafonds et historique fictif.
- **Opérations** : virements internes fictifs avec contrôles de solde, mise à jour des comptes, double validation simulée au-delà d'un seuil de démonstration.
- **Cartes virtuelles** : création, titulaire, rattachement et suspension simulés selon les rôles.
- **Épargne avec objectif** : création, bénéficiaire, contributeurs habilités, contribution, retrait, suivi des progrès, programmation indicative, clôture et reversement fictifs.
- **Cagnottes familiales** : création, participation et progression illustratives ; règles complètes à arbitrer.
- **Services** : Simple Pay, paiement de factures, Simple Trip, chat familial, coffre-fort avec métadonnées de documents, fidélité et demandes de crédit (tous simulés).
- **Droits** : changer de profil via « Mode démo » pour vérifier les écrans Leader / Co-leader / Membre Simple One. Droit de consultation du compte Famille paramétrable.
- **Passerelle PFM** : aperçu des dépenses et projets autorisés avec raccourcis de retour vers Famille. **Le vrai PFM n'est pas intégré.**
- **Persistance locale** : les modifications sont sauvegardées dans le navigateur (`localStorage`). Restaurer le scénario depuis « Mode démo ».

## Parcours de test conseillés

1. Depuis la Home : **Ma famille** → observer Lamia Leader, Karim Co-leader, Yasmine Simple One.
2. **Alimenter** → Compte Famille → Pocket Yasmine, entrer 300 DH → constater les soldes actualisés.
3. **Notre épargne** → Vacances en famille → Contribuer 250 DH → constater l'augmentation de progression.
4. **Membres** → Inviter un enfant → simuler l'acceptation → un pocket vide apparaît automatiquement.
5. **Mode démo** → Yasmine → vérifier les accès réduits au compte Famille et aux autres pockets.
6. **Réglages** → créer une autre famille sans compte Famille → vérifier qu'elle possède son propre pocket initial et qu'un sous-compte peut être ouvert ultérieurement.
7. **Services familiaux** → explorer le chat, le coffre-fort, Simple Pay, les factures, Simple Trip et la demande de crédit.

## Important : il s'agit d'un prototype, pas d'une application bancaire

- **Aucune API bancaire, aucune authentification réelle, aucun transfert d'argent ni génération d'OTP**.
- Les personnages, comptes, cartes, numéros de carte partiels, soldes et messages sont fictifs.
- Les données sont uniquement stockées sur le navigateur local, **sans chiffrement adapté à des données réelles**. **Ne jamais saisir de vraies données de clients, mots de passe ou pièces d'identité.**
- Le seuil OTP de 2 000 DH est un **choix de démonstration**, pas une règle métier validée.
- Les points de fidélité et calculs PFM sont **illustratifs**, non contractuels.
- L'option de langue enregistre une préférence mais **n'implémente pas la traduction de toute l'interface**.
- Le coffre-fort stocke des **références de documents**, pas les fichiers.
- Le chat reste une conversation locale de démonstration, pas un vrai service de messagerie.
- Une cagnotte familiale et certaines opérations devront faire l'objet d'un arbitrage fonctionnel complémentaire.

## Architecture

```text
src/
  App.tsx                         shell iPhone, navigation globale
  components/SimpleUI.tsx        header, navigation, composants marque Simple
  screens/Home.tsx               Home préservée
  screens/MenuAndCards.tsx       navigation & cartes hors Famille
  screens/Family.tsx             entrée du module
  family/model.ts                modèle de données + scénario initial
  family/FamilyExperience.tsx    pages, formulaires, interactions, droits, simulation
  assets/images/                photos de la base initiale
```

## Commandes

```bash
npm run dev      # développement
npm run build    # compilation statique dans dist/
npm run preview  # ouvrir le build en local
npm run lint     # vérification TypeScript
npm test         # vérification du modèle de démonstration
```

Le projet n'a **pas pu être compilé avec ses dépendances dans l'environnement de génération**, l'accès à `registry.npmjs.org` étant indisponible. Une vérification de syntaxe TypeScript/TSX et un contrôle de types avec interfaces temporaires ont été exécutés, ainsi que des tests sur le modèle ; la compilation `npm run build` doit être effectuée après `npm install` dans votre environnement.

Pour le détail « fait / simulé / à valider », voir **`MATRICE_FONCTIONNELLE.md`**.
