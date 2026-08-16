# IA 3v3 — contrat V1

Cette vertical slice utilise uniquement des règles déterministes, un cerveau d'équipe et une Utility AI. Aucun modèle entraîné ni machine learning n'intervient.

## Pipeline

1. `teamBrain.js` construit un plan partagé par équipe.
   - attaque : un soutien et une solution de profondeur pour former un triangle ;
   - défense : pression, couverture et équilibre ;
   - ballon libre : un récupérateur par équipe, les autres gardent une structure.
2. `utilityAI.js` note les options du porteur et le risque du tacle.
   - chaque décision conserve ses scores et sa raison dans `player.aiUtility` et `player.aiChoice` ;
   - un APPEL ajoute du poids à la passe sans annuler le contrôle de la ligne de passe.
3. `footwork.js` transforme les décisions en appuis.
   - `BALANCED`, `LEANING_LEFT`, `LEANING_RIGHT`, `COMMITTED`, `RECOVERING` ;
   - une feinte transfère l'appui mais ne provoque jamais de stun ;
   - repartir contre l'appui réduit temporairement l'accélération.

## Réglages principaux

- Le curseur IA 0–100 conserve son rôle : il modifie le délai de décision et l'imprécision de déplacement.
- `RULES.passLaneBlockRadius` règle la sévérité d'une ligne de passe coupée.
- Les scores d'utilité sont volontairement lisibles dans `utilityAI.js` pour permettre l'équilibrage sans comportement caché.
- Le 2 contre 1 reste une dérivation rare de la couverture près d'une ligne, jamais une poursuite générale à trois.

## Ballon et conséquences physiques

Le ballon conserve sa propre position. En conduite, il avance par petites touches et la distance joueur-ballon varie. Une touche trop longue libère le ballon ; les récupérations passent ensuite par la fenêtre physique commune (distance, vitesse, orientation, équilibre).
