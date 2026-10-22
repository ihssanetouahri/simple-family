# Simple Family — Correspondance au cadrage métier (octobre 2026)

**Sources de cadrage :** `Cadrage Simple Family - V2.pptx` (fourni par l'équipe Famille et Communauté) et la synthèse PFM / Ma famille. Les éléments ci-dessous décrivent ce que code cette **démonstration front-end**, et non l'état de production d'une offre bancaire.

| Sujet métier | Dans le prototype | Reste à brancher ou valider |
|---|---|---|
| Multi-famille, Leader / Co-leaders / membres | Création, sélection, suppression, rôles | Vérification d'identité, cycle de vie, invitations réelles |
| Inviter un membre Simple / Simple One | Formulaire + acceptation simulée | Notifications, expiration et enrôlement réel |
| Pocket automatique | Oui, chaque nouveau membre reçoit un pocket | Contrat du produit, liens au compte, conformité |
| Compte Famille facultatif (1 par famille) | Ouverture et solde fictifs | Core banking, comptes confrères, droits, agence, clôture |
| Compte joint | Ouverture simulée si Co-leader présent | Vérification du couple, exigences légales, signature |
| Virements et alimentations | Écrans et transfert entre soldes fictifs | API de paiement, garde-fous, audit, plafonds réels |
| Double OTP | Deux confirmations démonstratives | Véritable OTP, identification des valideurs, seuil métier |
| Pockets, cartes virtuelles, plafonds | Consultation, création/suspension simulée, plafonds | Contrôles de paiements domestiques/internationaux, émetteur de cartes |
| Épargne avec objectif | Création, contributions, suivis, retrait et clôture en local | Moteur d'épargne, comptes réels, ordres permanents, consentements |
| Cagnottes familiales | Démo simplifiée création/participation | Règles de cagnotte Famille et de remboursement |
| Simple Pay et factures | Paiements fictifs débitant les soldes locaux | Services de paiement et catalogue de facturiers |
| Simple Trip | Réservation fictive d'un membre | Intégration réservation, disponibilité, paiement |
| Crédit / avantages conjoints | Demande fictive et indication des avantages | Conventions, éligibilité, tarification, workflow métier |
| Chat Famille | Fil de messages local | Messagerie multi-utilisateur, sous-groupes, modération parentale |
| Coffre-fort | Métadonnées et visibilité locale | Upload sécurisé, chiffrement, liens expirants, audit |
| Fidélité | Solde de points illustratif | Barèmes, portefeuille partagé, récompenses |
| Langue de la famille | Préférence enregistrée | Traduction FR/AR/EN complète |
| Mon foyer PFM | Aperçu des dépenses/épargne autorisées | Synchronisation avec le vrai projet PFM, budgets, insights, coach |

## Périmètre maintenu distinct

- Le **PFM** conserve l'analyse des dépenses, budgets familiaux, recommandations, défis et apprentissage.
- Les **opérations bancaires** (membres, comptes, pockets, cartes, virements, services) restent dans **« Ma famille »**.
- Le **partage de dépenses communautaire** reste dans la fonctionnalité **Communauté** ; aucune nouvelle mécanique transactionnelle de partage n'est inventée ici.

## Points à arbitrer avant industrialisation

Droits de consultation des comptes et des enfants Simple One ; statut juridique du compte joint ; création automatique des pockets ; flux de clôture ; seuil et personnes autorisées pour le double OTP ; épargne avec objectif en chevauchement avec le PFM ; règles de cagnotte familiale ; calcul de la fidélité ; traduction et confidentialité.
