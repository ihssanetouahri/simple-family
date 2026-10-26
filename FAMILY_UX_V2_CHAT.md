# Simple Family — Chat Famille : discussions privées et groupes

## Version

Amélioration implémentée sur `feature/family-ux-v2` uniquement, sans fusion vers `main`. Prototype fictif React/Vite, **aucun envoi de message réel**.

## Nouvelle expérience

**Entrée « Chat familial » → écran Discussions**, au lieu d'ouvrir immédiatement la conversation commune.

- Recherche dans les conversations que le profil courant a le droit de lire.
- Le groupe initial **« Notre famille »** est conservé, avec ses anciens messages et l'ensemble des membres.
- Une conversation privée **Lamia ↔ Karim** et un groupe fictif **« Voyage en famille »** illustrent la liste initiale.
- Bouton **« Nouvelle discussion »** : choisir un membre pour une discussion privée ou créer un groupe.
- **Discussion privée** : chacun peut contacter un autre membre de la même famille ; si le fil privé existe déjà, on le réutilise au lieu de le dupliquer.
- **Groupe personnalisé** : saisir un nom et sélectionner au moins deux autres membres ; le créateur est automatiquement participant.
- **Gestion du groupe** : le créateur ou un responsable Leader/Co-leader qui participe au groupe peut modifier son nom et ses participants. Le créateur reste dans le groupe ; un groupe ne peut pas être laissé sans autre participant.
- Le formulaire de saisie existant est réutilisé dans la conversation choisie, avec envoi **explicite**.
- **Retour** dans une conversation → liste des discussions, puis retour vers la page précédente.
- Les bottom sheets restent contenus à l'intérieur du cadre iPhone.

## Confidentialité et droits

- Tous les membres actifs peuvent participer au groupe principal.
- **Seuls les participants** peuvent voir ou envoyer des messages dans les conversations privées et groupes personnalisés.
- Le rôle Leader ou Co-leader ne donne **aucun accès automatique** aux discussions privées d'autrui, même lorsqu'un enfant Simple One est participant.
- Un responsable peut gérer le nom et les membres des groupes personnalisés **auxquels il participe**, sans devenir lecteur des groupes privés des autres.
- Les « Paramètres des discussions » décrivent le périmètre des droits et signalent que la supervision parentale des enfants doit être **validée avec les parties prenantes**. Cette démo n'invente ni surveillance des messages privés, ni contrôle parental réel.
- La suppression d'un membre est bloquée lorsque les conversations le concernant nécessitent une gestion préalable de l'historique, pour éviter les références orphelines.

## Compatibilité et données

Le tableau `family.chat` conserve les messages du groupe familial historique. Les nouvelles conversations se trouvent dans `family.conversations`, champ facultatif pour rester compatible avec les précédentes démonstrations.

- `src/family/model.ts` : types, conservation des messages initiaux et conversations de démo.
- `src/family/chat/chatRules.ts` : filtrage et droits, démarrage des discussions, création/modification des groupes et envoi.
- `src/family/chat/FamilyChatView.tsx` : liste, recherche, conversation, création, édition, informations de supervision.
- `src/family/FamilyExperience.tsx` : routage chat, envoi explicite, bouton Retour et maintien des raccourcis depuis les projets, cagnottes et voyages.
- `src/family/quality/familyIntegrity.ts` : sécurité des historiques lors du retrait d'un membre.
- `scripts/chat-test.cjs` : tests des parcours et de la confidentialité, lancés avec `npm run test`.

Toutes les données sont fictives et ne persistent que dans la session de démonstration ; F5 réinitialise l'état initial.

## Recette manuelle dans Cursor

1. Récupérer les changements : `git pull origin feature/family-ux-v2`, puis actualiser `http://localhost:3000/`.
2. **Ma famille → Chat familial** : voir **Discussions**, contenant **Notre famille**, **Karim** et **Voyage en famille**. Les anciens messages du groupe familial sont préservés.
3. **Notre famille** : envoyer un nouveau message, puis utiliser Retour. L'envoi n'affecte pas les autres conversations.
4. **Nouvelle discussion → Message privé → Yasmine** : commencer un fil depuis Lamia. Revenir plus tard, recommencer avec Yasmine : ouvrir le même fil, sans doublon.
5. **Nouvelle discussion → Créer un groupe** : choisir Karim et Yasmine, saisir « Organisation vacances » puis Créer. Vérifier le nouvel écran de discussion et l'envoi d'un message.
6. Depuis le groupe créé, ouvrir la **roue des paramètres**, renommer et modifier les participants. Vérifier la disparition du groupe pour une personne retirée.
7. **Mode démo → Karim** : vérifier que les discussions contenant Karim sont visibles, sans accès aux discussions auxquelles il ne participe pas.
8. **Mode démo → Yasmine** : vérifier que la discussion privée Lamia–Karim n'apparaît pas et que les fils où elle est invitée sont accessibles.
9. **Mode démo → Lamia → Paramètres des discussions** : les explications des droits sont visibles, sans bouton prétendant donner accès aux messages privés.
10. Depuis le **projet Vacances en famille → Préparer un message**, vérifier que le groupe **Notre famille** est ouvert avec le texte prérempli **mais non envoyé**. Même vérification depuis une cagnotte et une réservation.
11. Vérifier le clavier et les bottom sheets sur un écran iPhone 375–390 px : pas de débordement horizontal, panneau dans le téléphone, bouton Envoyer accessible.
12. Vérifier que le hero **Notre famille**, les quatre raccourcis Home et les autres parcours restent inchangés.

## Limites métier à valider avec Hanane

- Les droits précis d'invitation, d'exclusion et d'administration des groupes.
- La création des discussions privées pour les enfants Simple One, les éventuels contrôles parentaux et leur consentement.
- Signalement/modération, archivage, notifications, statuts de lecture, pièces jointes et messagerie en temps réel.
- Conservation et suppression de l'historique lors du départ d'un membre.
- Les données fictives et les règles front-end ne sont pas des contrôles serveur ni des garanties de confidentialité pour une application de production.

## Vérifications techniques

GitHub Actions : `npm run lint`, `npm run test` (dont `chat-test.cjs`) et `npm run build`.

Le rendu mobile réel doit encore être validé dans le navigateur avant une fusion éventuelle sur `main`.
