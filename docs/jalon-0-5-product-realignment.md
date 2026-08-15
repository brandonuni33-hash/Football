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

## Contrat visuel

- vue du dessus ;
- terrain toujours entièrement cadré ;
- exactement 11 joueurs par équipe et un ballon ;
- deux équipes immédiatement différenciables ;
- positions et orientations liées à l'action (construction, pressing, duel, transition, centre, frappe, coup de pied arrêté, but) ;
- ballon lié au porteur ou à la trajectoire de frappe ;
- organisation moins parfaite chez les jeunes, de façon déterministe, sans chaos artificiel.

## Chronologie

Les événements visibles utilisent une seed dérivée du `matchId`. Une même seed redonne la même chronologie. Les minutes sont distribuées dans des fenêtres football crédibles, avec temps additionnel au format `45+2'` / `90+3'` et prise en charge de `105+1'` / `120+2'` lorsque la prolongation existe. Le vieux placement mécanique autour de la 47e minute n'est pas utilisé par cette visualisation.

## Présentation

Le match simulé devient une scène plein écran mobile. Le texte apparaît progressivement ; un toucher l'affiche immédiatement et `prefers-reduced-motion` désactive cette animation. Les autres résultats de la journée restent derrière un espace secondaire repliable dans le récapitulatif.

## Limite absolue

Aucune commande de déplacement, passe, tir, dribble, feinte, prise d'information, angle mort, course contrôlée ou logique online n'est ajoutée. Les anciens modules interactifs présents dans le socle historique ne sont pas étendus par cette PR et le parcours principal ne les lance plus.

## Garde-fous

Les tests vérifient le 11 contre 11 + ballon, le cadrage sur plusieurs tailles mobiles, la cohérence porteur/ballon, les minutes variées, le temps additionnel, le déterminisme, le texte progressif et l'absence de boutons de gameplay contrôlable.
