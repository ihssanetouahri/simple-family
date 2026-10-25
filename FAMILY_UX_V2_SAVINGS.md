# Simple Family — UX V2 · Étape 6 : objectifs d'épargne et cagnottes

## Statut

Implémenté exclusivement dans `feature/family-ux-v2`. Le prototype ne contient aucun service bancaire réel.

## Deux produits différents, deux comportements différents

**Objectif d'épargne :** montant cible, propriétaire bénéficiaire, contributeurs habilités, date cible, versement programmé purement illustratif, historique et clôture.

**Cagnotte familiale :** organisateur, participants, invitations, montant collectif, date facultative et historique des contributions. Les règles de restitution, déblocage, remboursement et versement aux bénéficiaires de la cagnotte Famille ne sont **pas finalisées** dans le cadrage. Le prototype ne doit donc pas en inventer.

## Parcours d'un objectif d'épargne

- **Actif :** alimenter depuis le compte Simple fictif si propriétaire ou contributeur habilité, effectuer un retrait selon les droits existants, modifier la cible/l'échéance et paramétrer des versements fictifs.
- **Échéance proche (≤ 30 jours) :** un indicateur orange suggère de poursuivre l'épargne ou d'adapter l'échéance.
- **Échéance dépassée :** un indicateur signale la date cible passée, mais le prototype ne clôture ni ne vire automatiquement des fonds sans décision.
- **Objectif atteint :** le dernier versement fictif ferme l'objectif ; le solde collecté est reversé **une seule fois** au compte Simple fictif du propriétaire ; la programmation s'arrête.
- **Clôture manuelle :** même restitution fictive du solde disponible au propriétaire, arrêt des programmations, historique conservé. Une deuxième clôture ne doit jamais recréditer des fonds.
- **Historique :** distinction « Contribution », « Retrait » et « Reversement au propriétaire » ; le montant collecté reste visible comme historique, mais la disponibilité devient 0 après restitution.
- **Suppression d'un objectif actif :** restitution fictive du solde existant avant suppression (ancienne logique conservée). Un objectif déjà clôturé ne génère pas de second reversement.

Les champs `closedReason`, `closedAt` et `settledAmount` distinguent les fins de vie. Les objectifs préexistants sont compatibles car les champs sont facultatifs. Les soldes de l'état initial demeurent inchangés.

## Parcours d'une cagnotte

- Participants et invitations restent gérés selon les droits existants.
- Le détail affiche les montants **par participant**, uniquement pour les profils autorisés à consulter l'historique.
- La date cible peut être proche ou dépassée : signalement visuel sans automatisme bancaire.
- **Montant cible atteint :** la collecte passe à l'état « Collecte terminée · Objectif atteint » et les invitations en attente sont closes.
- **Clôture manuelle :** la collecte devient « Clôturée », aucune nouvelle participation n'est possible.
- **Aucun reversement fictif** n'est déclenché lors d'une clôture ou d'un objectif atteint, faute de règles métier établies sur l'emploi et la restitution des fonds. Le montant reste visible dans la cagnotte en attendant la définition métier.
- Le financement depuis sa pocket respecte désormais aussi le plafond de virement fictif utilisé à l'étape 4.

## Structure du code

- `src/family/model.ts` — champs facultatifs de fin de vie des deux produits et type « settlement » dans l'historique d'un objectif.
- `src/family/savings/savingsRules.ts` — nouvelles fonctions pures : échéances, états, contributions, clôture d'objectif, clôture de cagnotte.
- `src/family/FamilyExperience.tsx` — utilise les fonctions partagées et affiche les états et récapitulatifs dans les vues détaillées.
- `scripts/savings-test.cjs` — scénarios pour les dates, les contributeurs, le reversement unique et l'absence de remboursement de cagnotte.
- `package.json` — ajout des nouveaux tests au pipeline de vérification.

## Recette de validation dans Cursor

1. `git pull origin feature/family-ux-v2`, puis actualiser le site sur `http://localhost:3000/`.
2. Depuis « Nos projets d'épargne », ouvrir « Vacances en famille » et vérifier l'échéance, le propriétaire et les contributions.
3. Tester un versement fictif. Les soldes doivent diminuer sur le compte contributeur et augmenter dans le projet.
4. Dans « Gérer le projet », choisir « Clôturer ». Vérifier le nouveau solde du propriétaire, la trace dans l'historique, la désactivation de la programmation et l'état « Projet clôturé ».
5. Dans une nouvelle démo (F5), alimenter un objectif jusqu'à sa cible : voir « Objectif atteint » et la restitution fictive unique. Refaire F5 pour tester la variante.
6. Ouvrir « Nos cagnottes » → « Anniversaire de Yasmine » : vérifier les participants et leurs montants collectés.
7. Faire une contribution fictive puis consulter l'historique et le nouveau total par participant.
8. Clôturer une cagnotte : elle n'accepte plus de participation, et le solde des membres ne reçoit aucun reversement nouveau à la clôture.
9. Avec « Mode démo → Yasmine », confirmer que l'affichage des contributions respecte les permissions, et que le plafond fictif s'applique lorsqu'une pocket est débitée.
10. Vérifier visuellement que la carte « Notre famille », la Home, les comptes et les fiches membres conservent leur présentation antérieure.

## Limites métier à faire valider

- Droit de retrait/reversement d'un objectif collectif, règles contractuelles de clôture et utilisation d'un compte Simple One comme bénéficiaire.
- Traitement d'un objectif arrivé à échéance.
- Fiscalité, frais, litiges et disponibilité effective des fonds.
- Règles de transfert et remboursement des cagnottes familiales, destinataire final, consentements et événements de sortie.

Ces points ne sont pas simulés comme des règles bancaires officielles.

## Étape suivante, après validation

**Étape 7 :** enrichir « À suivre en famille » avec événements, priorités et redirections utiles, sans modifier la carte « Notre famille ».
