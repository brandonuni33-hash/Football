# Jalon 0.5 — Réalignement produit

## But

Faire correspondre l'expérience réellement jouée avec les décisions produit déjà validées pour Street to Pro, sans rouvrir les invariants techniques stabilisés au Jalon 0.

## Parcours audité

Version GitHub Pages jouée de bout en bout :

1. création d'un buteur de 14 ans, origine Futsal ;
2. choix de la France et de Blagnac FC ;
3. tableau de carrière ;
4. avant-match U15 contre le RC Lens U15 ;
5. coup d'envoi, deux décisions, un but, fin de match ;
6. vestiaire, coach et bord du terrain.

## Verdict

Le match possède désormais une boucle correcte et un score cohérent. Le retard perçu vient surtout de la présentation et du manque de différenciation émotionnelle : l'écran raconte une meilleure simulation que ce qu'il fait ressentir.

## Écarts constatés

### P0 — Identité du match

- Le `CameraController` validé existe dans un prototype séparé mais n'est pas le langage visuel du match jouable.
- Les étapes restent présentées dans une modale textuelle identique, quelle que soit leur intensité.
- Un but change le texte et le score, mais pas suffisamment la mise en scène.
- La voix intérieure peut produire une formule générique (`Ah là là, oui !`) sans lien assez précis avec la pression, le doute ou le geste vécu.

### P0 — Conséquences des choix

- Deux gestes différents peuvent produire exactement la même structure de conséquence : « [geste] passe », rotation des hanches, demi-mètre gagné.
- Une décision réussie ne distingue pas assez une frappe, un contrôle orienté, un centre, un duel ou une passe.
- La conséquence immédiate ne rend pas toujours visible ce que le choix a changé avant la résolution du but.

### P1 — Continuité narrative

- L'avant-match introduit un adversaire direct crédible, mais cette relation n'est pas assez rappelée dans l'après-match.
- Les réactions annoncent que certains moments reviendront plus tard sans montrer immédiatement quelle trace a été créée.
- Le coach évoque des « décisions précises » sans toujours nommer le geste ou l'erreur retenue.

### P1 — Tableau de carrière

- « La carrière suit son cours » et « Reste concentré » donnent une impression de tableau générique dès la première minute.
- Les huit entrées de navigation ont le même poids, alors que le prochain enjeu devrait guider l'écran.
- Le profil chiffré domine l'histoire alors que STP promet d'abord une carrière vécue.

### P2 — Création du joueur

- L'origine Futsal est décrite comme un bonus de profil, mais elle n'est pas encore vécue comme une histoire fondatrice.
- Le premier club est surtout comparé par indemnité, prestige et objectif de général.
- Le choix ne montre pas assez les personnes, le lieu et le compromis humain de départ.

## Ce qui fonctionne et doit être conservé

- Affluence U15 crédible et séparée du récit.
- Presse professionnelle absente au niveau U15.
- Score, but du joueur et chronologie cohérents.
- Rythme : avant-match, coup d'envoi, décision, conséquence, événement inattendu, seconde décision, fin et réactions.
- Adversaire direct et choix techniques contextualisés.
- Réactions distinctes du vestiaire, du coach et des proches.

## Ordre d'exécution

### Lot 1 — Faire ressentir les choix

- conséquences spécifiques par famille de geste ;
- voix intérieure rare et liée à l'émotion réelle ;
- trace explicite du choix retenu par le coach ou le vestiaire ;
- tests empêchant deux gestes différents de recevoir la même conséquence générique.

### Lot 2 — Donner une identité visuelle au match

- intégrer le langage du `CameraController` dans le match jouable ;
- différencier visuellement narration, danger, duel, tir et but ;
- réserver la mise en scène manga aux pics émotionnels ;
- vérifier la lisibilité mobile avant toute intensification.

### Lot 3 — Recentrer le tableau de carrière

- remplacer les messages de remplissage par le prochain enjeu réel ;
- hiérarchiser l'écran autour de la situation actuelle ;
- faire remonter les fils coach, famille, rivalité et progression.

### Lot 4 — Refaire l'entrée dans la carrière

- donner une scène fondatrice à l'origine ;
- présenter les premiers clubs comme des chemins de vie ;
- préparer l'évolution visuelle de l'avatar avec l'âge.

## Gate du Jalon 0.5

Le jalon est validé quand une personne peut jouer le premier match et décrire, sans lire les statistiques cachées :

- l'enjeu de la rencontre ;
- l'adversaire ou le rapport de force principal ;
- ce que chacune de ses décisions a changé ;
- l'émotion dominante du joueur ;
- la trace laissée auprès du coach, du groupe ou des proches.

