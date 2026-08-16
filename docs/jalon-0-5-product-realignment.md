# Jalon 0.5 — PR #28 : visualisation du match simulé

## Périmètre définitif

Cette PR ne développe aucun gameplay dans lequel l'utilisateur contrôle directement son joueur. Le futur moteur jouable sera conçu séparément. La PR #28 transforme uniquement les faits produits par la simulation canonique en une visualisation mobile lisible et immersive.

## Pipeline canonique

```text
SimulatedMatchSystem -> résultat résolu -> SimulatedMatchTimeline
                     -> SimulatedMatchTacticalSituation
                     -> SimulatedMatchVisualizationController
```

Le domaine produit minute, score courant, possession, zone, porteur, type de situation et texte. L'UI ne recalcule aucun fait et ne décide d'aucun résultat.

## Contrat visuel football

- vue du dessus ;
- terrain toujours entièrement cadré ;
- exactement 11 joueurs par équipe et un ballon ;
- deux équipes immédiatement différenciables ;
- coup d'envoi et fin de match : chaque équipe dans sa moitié ;
- changement de côté après la mi-temps ;
- formations stables pendant un match mais variables entre matchs, avec davantage de variété chez l'adversaire ;
- identité visuelle de l'équipe du joueur stable à domicile comme à l'extérieur ;
- joueur de référence mappé sur le slot réel correspondant au poste choisi dans la formation courante ;
- sur une action où le joueur est impliqué, il ne devient porteur que si son poste est cohérent avec l'action ou si une contribution canonique l'impose ;
- en phase offensive, le bloc en possession remonte avec l'action et la première ligne adverse redescend pour éviter des équipes artificiellement coupées ;
- organisation moins parfaite chez les jeunes, de façon déterministe, sans chaos artificiel.

## Ballon et trajectoires

Le ballon part toujours du porteur identifié. Tant qu'aucune trajectoire n'est représentée, il reste au pied du joueur. Pour une frappe, un centre ou un coup de pied arrêté, le domaine fournit une trajectoire explicite et la vue l'anime vers sa cible :

- frappe / but / coup franc direct / penalty : vers la cage ;
- centre / coup franc excentré / corner : vers une zone de réception crédible dans la surface.

La direction s'inverse naturellement après la mi-temps.

## Coups de pied arrêtés

- coup franc direct : tireur au ballon, mur de 3 à 4 joueurs maximum, gardien et joueurs de second ballon placés de manière crédible ;
- coup franc excentré : petit mur et densité dans la surface ;
- corner : tireur au coin, cibles et marquages dans la surface ;
- penalty : ballon au point, gardien sur sa ligne, tous les autres hors de la surface ;
- aucun penalty n'est inventé si le fait canonique ne l'indique pas.

## Chronologie

Les événements visibles utilisent une seed dérivée du `matchId`. Une même seed redonne la même chronologie. Les minutes sont distribuées dans des fenêtres football crédibles, avec temps additionnel au format `45+2'` / `90+3'` et prise en charge de `105+1'` / `120+2'` lorsque la prolongation existe. Le vieux placement mécanique autour de la 47e minute n'est pas utilisé par cette visualisation.

## Présentation

Le match simulé devient une scène plein écran mobile. Le texte apparaît progressivement ; un toucher l'affiche immédiatement et `prefers-reduced-motion` désactive les animations non essentielles. Les autres résultats de la journée restent derrière un espace secondaire repliable dans le récapitulatif.

## Limite absolue

Aucune commande de déplacement, passe, tir, dribble, feinte, prise d'information, angle mort, course contrôlée ou logique online n'est ajoutée. Les anciens modules interactifs présents dans le socle historique ne sont pas étendus par cette PR et le parcours principal ne les lance plus.

## Garde-fous

Les tests vérifient le 11 contre 11 + ballon, le cadrage sur plusieurs tailles mobiles, la cohérence porteur/ballon, le mapping du joueur focal selon son poste, la direction des trajectoires, la compacité des blocs, les formations, les côtés, les coups de pied arrêtés, les minutes variées, le temps additionnel, le déterminisme, le texte progressif et l'absence de boutons de gameplay contrôlable.
