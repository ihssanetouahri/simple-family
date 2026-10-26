# Simple Family — Chat Famille : refonte visuelle de la liste des discussions

## Objectif

Adapter **l'interface** du Chat Famille au modèle mental courant d'une messagerie sans toucher aux règles de confidentialité, au groupe principal, aux discussions privées, à la création de groupes ni aux messages fictifs déjà enregistrés dans la démo.

Le travail est implémenté exclusivement sur la branche `feature/family-ux-v2`. La branche `main` n'est pas modifiée.

## Changements UX

- **Titre unique :** le header principal s'intitule « Discussions » dans la liste. Il affiche le nom de la conversation ouverte (avec avatar) dans un fil de messages ; il n'y a plus de deuxième carte de titre à l'intérieur de l'écran.
- **Action unique :** un pictogramme « Nouvelle discussion » dans le header. Il ouvre le choix déjà disponible entre message privé et nouveau groupe. Le bouton violet pleine largeur en bas de la liste est supprimé.
- **Recherche :** champ compact directement sous le header, sans grand bloc blanc introductif.
- **Liste :** chaque conversation apparaît sous forme d'une ligne fluide, avec avatar, nom, dernière phrase et heure alignée à droite. Les séparateurs commencent après l'avatar. Le groupe familial reste le premier fil de la liste de démonstration.
- **Personnalisation :** les messages privés affichent la photo existante de Lamia, Karim ou Yasmine quand elle est disponible ; les groupes ont un avatar collectif.
- **Paramètres secondaires :** le menu discret « … » près du nombre de conversations ouvre les informations de gestion des discussions pour les responsables, au lieu d'un grand bouton sous la liste.
- **Conversation ouverte :** le nom et l'avatar passent dans le header. Un responsable autorisé peut ouvrir les paramètres d'un groupe en appuyant sur son nom. Le champ de message reste ancré en bas.
- **Prototype :** la barre « PROTOTYPE INTERACTIF / Mode démo » est masquée dans l'écran du chat pour éviter d'interrompre l'expérience. Le changement de profil reste disponible depuis la Home Ma famille.
- **Aucun faux non-lu :** aucun badge de message non lu n'a été ajouté, puisque le prototype ne conserve pas encore les statuts de lecture.
- **Retour :** dans une conversation, la flèche Retour revient d'abord à la liste ; depuis la liste, elle revient à l'écran précédent.
- **Aucune autre page refondue :** la Home « Notre famille », le contenu des comptes, pockets, épargne, cagnottes et Services familiaux restent inchangés.

## Parcours et droits conservés

- Notre famille est le fil principal partagé et conserve les messages existants.
- Les discussions privées et groupes sont visibles exclusivement par leurs participants.
- Un Leader ou Co-leader ne peut pas consulter les messages privés de tiers de manière automatique.
- Le formulaire « Nouvelle discussion » permet toujours de sélectionner un membre, créer un groupe et modifier les participants autorisés.
- Les raccourcis **« Préparer un message pour la famille »** depuis les objectifs, cagnottes et voyages ouvrent le fil principal avec un brouillon ; l'envoi reste volontaire.
- Aucune messagerie réelle ni supervision parentale réelle n'est activée.

## Fichiers mis à jour

- `src/components/SimpleUI.tsx` — MobileHeader accepte une action, un avatar et un titre interactif facultatifs.
- `src/family/chat/FamilyChatView.tsx` — nouvelle liste de messages, avatars photo, recherche, gestion secondaire ; conservation des bottom sheets.
- `src/family/FamilyExperience.tsx` — titre et icône de composition dans le header, état des panneaux et nettoyage du chrome inutile en messagerie.
- `scripts/chat-layout-test.cjs` — tests spécifiques du modèle mental de messagerie.
- `package.json` — ajout du nouveau test à la CI.

## Validation manuelle dans Cursor

1. Depuis la branche `feature/family-ux-v2`, récupérer les modifications avec `git pull origin feature/family-ux-v2` puis actualiser `http://localhost:3000/`.
2. **Ma famille → Chat familial :** voir un seul titre « Discussions » dans le header, l'icône de création, la recherche et la liste sans carte globale.
3. **Liste :** vérifier les avatars et les aperçus de Notre famille, Karim et Voyage en famille ; les noms ne doivent pas être tronqués inutilement sur un iPhone.
4. **Icône crayon en haut :** Nouveau message → sélectionner Yasmine → écrire un texte ; vérifier le même fil au deuxième essai.
5. **Nouveau groupe :** choisir deux participants, nommer le groupe, créer, revenir à la liste.
6. **Groupe créé :** cliquer sur le nom dans le header pour ouvrir les paramètres, modifier les participants, revenir au fil.
7. **Menu « … » :** depuis Lamia, consulter les paramètres secondaires, sans possibilité de voir un chat privé auquel elle ne participe pas.
8. **Mode démo Yasmine :** depuis la Home, activer son profil puis ouvrir le chat. Les conversations privées Lamia-Karim ne doivent pas apparaître.
9. **Projet Vacances en famille → Préparer un message :** ouverture de Notre famille avec un texte prérempli, non envoyé.
10. Tester le Retour, le clavier et la saisie sur un écran iPhone 375–390 px.

## Résultats et limites

GitHub Actions exécute TypeScript, tests de messagerie, tests de lisibilité/structure, les autres tests de non-régression et le build. Les interactions tactiles et le rendu final doivent encore être vérifiés visuellement dans Cursor.

Ce prototype reste strictement fictif. `main` n'a pas été fusionnée.
