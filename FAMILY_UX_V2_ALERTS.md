# Simple Family — UX V2 · Étape 7 : À suivre en famille

## Statut

Implémentation sur `feature/family-ux-v2`, sans fusion vers `main` et sans modification de la carte photo « Notre famille ».

## Principe

La section **« À suivre en famille »** et sa page **« Voir tout »** sont alimentées par le même moteur `getFamilyFollowUps(family, viewerId, today)`, sans base de données supplémentaire et sans notification bancaire réelle.

- Home : **2 rappels maximum** (préserve la hauteur et le layout de la Home).
- « Voir tout » : liste complète avec résumé du nombre de rappels et de ceux qui sont prioritaires.
- Affichage déterminé par le **profil actif**, les droits et l'état fictif actuel.
- Les alertes sont triées par degré d'attention : urgent, prochainement, information. Les dates passées sont présentées comme **« En retard »** au lieu de faux J-n.
- Il n'y a pas de mécanisme de suppression artificielle des événements : ils se mettent à jour après les actions effectives du scénario (paiement de facture, acceptation d'une invitation, progression de demande ou clôture d'objectif).
- Pas de monitoring, de push, d'envoi de SMS/OTP ni de service bancaire réel.

## Événements reliés à des parcours

| Événement | Profils autorisés | Parcours ouvert |
|---|---|---|
| Facture familiale non réglée | Leader et Co-leader | Formulaire existant « Payer une facture » |
| Invitation d'un nouveau membre | Leader et Co-leader | Membres et accès |
| Demande de Compte joint en attente | Uniquement demandeur ou second cotitulaire | Compte joint : suivi de la demande et réponse |
| Compte joint validé ou refusé | Personnes concernées (selon l'état) | Compte joint |
| Invitation à une cagnotte | Destinataire invité, tant que la cagnotte est active | Cagnotte concernée, avec Acceptation / Refus |
| Objectif d'épargne à échéance proche ou dépassée | Membres autorisés à voir cet objectif | Détail du projet |
| Cagnotte familiale à échéance proche ou dépassée | Responsable ou participant habilité | Détail de la cagnotte |
| Document du coffre-fort proche de l'expiration | Propriétaire, Leader ou membre explicitement habilité | Coffre-fort |

Les événements d'échéance sont pris en compte à partir de **30 jours avant la date** et restent visibles si elle est dépassée tant que le projet ou la cagnotte est encore actif. Les documents sont accessibles selon leurs droits ; les montants de factures ne sont pas divulgués aux membres non administrateurs.

Le prototype ne fabrique pas de nouveaux événements bancaires (refus de paiement réel, suspension de carte automatique, OTP, solde insuffisant en temps réel, etc.).

## Fichiers

- `src/family/alerts/followUps.ts` : nouveau module de collecte, filtrage, priorité et navigation contextuelle.
- `src/family/FamilyExperience.tsx` : présentation des deux premiers rappels sur la Home et de tous les rappels dans « Voir tout », avec actions.
- `scripts/alerts-test.cjs` : tests indépendants pour les droits, délais, changements d'état et destinations.
- `package.json` : ajout des tests au pipeline GitHub Actions.

## Scénarios de recette manuelle

1. Depuis **Lamia**, ouvrir **À suivre en famille → Voir tout** : retrouver la facture Internet et l'invitation d'Amine (et tout événement contextualisé dans le scénario).
2. Cliquer sur la facture Internet : ouvrir son formulaire avec les informations préremplies. Simuler le paiement ; vérifier que la facture disparaît des alertes.
3. Cliquer sur l'invitation Amine : ouvrir **Membres et accès**. Simuler l'acceptation ; vérifier que l'alerte disparaît.
4. **Lamia → Compte joint → demande avec Karim** : l'événement « accord en attente » apparaît dans les rappels du demandeur.
5. **Mode démo → Karim** : un rappel prioritaire « votre accord est attendu » mène au Compte joint et permet de répondre. **Mode démo → Yasmine** : aucune donnée sur la demande de Compte joint.
6. **Cagnotte familiale → inviter Yasmine** : en Mode démo Yasmine, voir l'invitation et ouvrir la cagnotte concernée. Accepter : le rappel disparaît.
7. **Échéances :** modifier la date d'un objectif en cours ou d'une cagnotte dans les 30 prochains jours ; vérifier le rappel. Une date dépassée affiche « En retard » mais ne déclenche pas de transfert.
8. **Coffre-fort :** créer ou modifier une fiche document visible par un profil autorisé avec une date d'expiration proche ; vérifier son rappel. Les autres profils ne voient pas cette information.
9. Vérifier que la Home ne montre **pas plus de deux rappels**. « Voir tout » affiche la liste complète sans divergence.
10. **F5** restaure la démo initiale ; vérifier que la carte photo « Notre famille » reste inchangée.

## Validation automatique

Exécuter :
```powershell
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

Les tests protègent aussi le visuel de la carte « Notre famille », le menu « Mes familles », les droits, les comptes et les opérations des précédentes étapes.

## Prochaine étape après validation

Étape 8 : relier contextuellement les services (chat familial, Simple Trip, coffre-fort, Simple Pay, etc.) aux situations de la famille, tout en conservant les quatre raccourcis de la Home et l'entrée « Autres ».
