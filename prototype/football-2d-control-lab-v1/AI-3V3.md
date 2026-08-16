# IA 3v3 — contrat V1

Cette vertical slice utilise uniquement des règles déterministes, un cerveau d'équipe et une Utility AI. Aucun modèle entraîné ni machine learning n'intervient.

## Pipeline

1. `teamBrain.js` construit un plan partagé par équipe.
   - attaque : le porteur, un soutien et une solution de profondeur occupent trois couloirs de largeur distincts ;
   - défense : chaque défenseur reçoit un adversaire unique, puis assume pression, couverture ou équilibre ;
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
- Une répulsion locale empêche deux partenaires IA de se superposer, sans casser leur cible tactique.
- Le socle défensif est un ensemble de trois duels individuels. La couverture peut aider ponctuellement, mais elle ne détruit pas les deux autres marquages.
- `FREIN` n'est autorisé que dans un duel frontal : défenseur côté but, à distance de contention et dans l'axe du porteur. Une poursuite dans le dos, une couverture ou un replacement utilisent une course défensive normale.

## Ballon et conséquences physiques

Le ballon conserve sa propre position. En conduite, il suit un compromis 50/50 : sa vitesse et ses petites touches restent libres, tandis qu'un guidage souple le ramène partiellement vers la zone de contrôle devant le pied. Une touche trop longue libère toujours le ballon ; les récupérations passent ensuite par la fenêtre physique commune (distance, vitesse, orientation, équilibre).
