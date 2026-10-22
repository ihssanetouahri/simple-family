# Simple — repères UI issus du code du prototype PFM

> Repères de conception identifiés dans le code transmis, à préserver dans le prototype Famille. Ce sont des styles du prototype, pas une charte de marque officielle validée.

## Couleurs

- Violet marque utilisé pour CTA sur bannière : `#8000EB`
- Violet principal des icônes / navigation : `#5E1DF0`
- Violet foncé : `#290764`
- Texte principal : `#14111F`
- Texte secondaire : `#7D7693` et `#8E87A6`
- Fond canvas : dégradé radial `#F2EBFF` → `#F8F6FE` → `#F9F8FC`
- Cartes blanches : `#FFFFFF`

## Typographie

- Texte courant : `DM Sans`
- Titres : `Plus Jakarta Sans`
- Chiffres : chiffres tabulaires (`font-variant-numeric: tabular-nums`)

## Géométrie et composants

- Cartes `.card-simple` : radius `28px`, bordure lavande subtile, ombre violette légère
- CTA `.btn-simple-primary` : dégradé violet, pilule, ombre
- Navigation basse : hauteur `74px`, fond blanc translucide, coins hauts `30px`
- Conteneur preview iPhone : largeur `412px`, bordure `11px`, radius `52px`
- Header des sous-pages : fond très clair translucide, bouton retour rond
- Paddings horizontaux des écrans : en général `20px` (`px-5`)

## Emploi dans le prototype Famille

- Réutiliser les composants `MobileHeader`, `BottomBankingNav`, `SimpleButton`, `SimpleBarsIcon`, `SimpleRobotIcon`.
- Continuer à utiliser la Home existante. Ne pas remplacer les espaces PFM par des versions inventées.
- Ajouter chaque parcours fonctionnel dans un composant isolé du dossier `src/screens/`.
- Utiliser uniquement des données fictives ; les règles métier seront ajoutées à partir du cadrage.
