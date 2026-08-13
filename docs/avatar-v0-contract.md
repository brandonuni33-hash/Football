# STP Avatar V0 — contrat de prototype

## But

Valider une identité visuelle de joueur canonique avant de produire les portraits manga détaillés et les sprites 2D.

Le prototype doit permettre de créer plusieurs joueurs reconnaissables à partir du même format de données, sans introduire de logique de carrière, de Narrative Engine, de progression ou d'online.

## Source de vérité

`prototype/avatar-v0/avatarModel.js` est la source unique du prototype pour :

- les options autorisées ;
- les valeurs par défaut ;
- la normalisation ;
- la signature d'identité déterministe.

Les futurs renderers manga et 2D doivent lire cette apparence. Ils ne doivent pas inventer leur propre format concurrent.

## Périmètre V0

- 4 teintes de peau ;
- 6 coiffures ;
- 5 couleurs de cheveux ;
- 3 états de barbe ;
- 4 accessoires de tête ;
- 3 morphologies simplifiées ;
- manches courtes ou longues ;
- 4 couleurs de chaussures ;
- numéro de maillot de 1 à 99.

L'aperçu actuel est volontairement géométrique. Il sert à vérifier la modularité et la lisibilité des différences, pas la direction artistique finale.

## Critères de validation

Avant de produire le premier portrait manga :

1. trois presets doivent être immédiatement différenciables ;
2. une modification d'apparence doit être reflétée par la fiche canonique ;
3. une valeur cosmétique inconnue doit être rejetée au profit d'une valeur sûre ;
4. le même avatar doit produire la même signature ;
5. le prototype doit rester totalement isolé du State, du Narrative Engine et du système de match.

## Prochaine étape après validation

Créer un seul portrait manga neutre, modulaire, à partir du même contrat d'apparence. Le premier objectif artistique n'est pas de couvrir toutes les combinaisons, mais de prouver qu'au moins trois identités différentes peuvent être représentées avec un style STP cohérent.
