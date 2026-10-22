# Construire « Ma famille » — premiers pas dans AI Studio

Le projet fourni est une **base UI légère**, sans les fonctionnalités du PFM. Ne pas tenter de réimporter le ZIP du PFM complet.

## Déroulé conseillé

1. Mettre cette base de code dans un **nouveau dépôt GitHub privé** ; importer le dépôt dans un **nouveau projet AI Studio Build**.
2. Vérifier l'affichage : Accueil, Menu, Cartes, Ma famille ; vérifier que la charte Simple est conservée.
3. Créer les parcours Famille **un par un** ; éviter un prompt global qui réécrit tous les écrans.
4. Commencer par première visite, création de famille, invitation, rôles ; seulement ensuite comptes et pockets.
5. Construire la passerelle vers le PFM ultérieurement, sans importer son code complet.

## Premier prompt conseillé, après import

> Dans l'espace « Ma famille » existant, ajoute uniquement un écran de première visite avant la création d'une famille. Conserve le header, la navigation, les couleurs, typographies et composants UI du projet. Le CTA principal est « Créer ma famille ». Ne construis pas encore les étapes de création ni les écrans de gestion. Ne modifie aucun autre écran.

## Points métier à respecter dans les itérations suivantes

- Un leader et plusieurs co-leaders possibles ; droits différents selon rôle.
- L'utilisateur peut appartenir à plusieurs familles : prévoir plus tard la sélection.
- Chaque membre reçoit un pocket à la création de sa famille.
- Le sous-compte Famille est facultatif.
- Le PFM Famille reste une expérience complémentaire distincte.

Ces éléments ne sont pas encore codés dans la base ; ils servent à cadrer le développement futur.
