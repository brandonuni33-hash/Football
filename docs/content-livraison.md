# Street to Pro — CONTENT delivery

Cette livraison isole le périmètre CONTENT du moteur et de l'orchestration narrative.

## Contenu livré

- six familles éditoriales : scènes de carrière, dialogues, voix intérieure, décisions de match, réactions du monde et moments marquants ;
- métadonnées d'éligibilité par âge, étape de carrière, contexte, état émotionnel, faits requis et relation ;
- une première banque de voix intérieure centrée sur l'attachement au joueur ;
- variantes jeunes/pro pour éviter qu'un texte U15 apparaisse dans un contexte professionnel, ou inversement ;
- garde-fous factuels pour ne pas raconter une apparition pro, un transfert, un contrat ou un moment marquant avant qu'il n'ait réellement eu lieu ;
- choix de match uniquement formulés côté joueur, sans bonus ou probabilités cachés dans le texte.

## Frontières

CONTENT fournit des données éditoriales et des filtres purs. Il ne modifie ni le World Model ENGINE, ni les systèmes de conséquences, ni l'état narratif, ni la logique de simulation. Le branchement par NARRATIVE/ENGINE peut se faire ultérieurement en consommant `domain/content/index.js`.
