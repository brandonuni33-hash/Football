# Jalon 0 — contrat de progression de match

`domain/player/matchProgressionSystem.js` est le propriétaire canonique de la progression issue d'un match.

Les chemins simulé et interactif lui transmettent les mêmes faits : `rating`, `goals`, `assists`, `minutesPlayed`, `playerPlayed` et `matchId`. Aucun consommateur ne calcule ni ne reconvertit d'XP.

## Appel interactif à intégrer après le chantier des buts

Dans `domain/match/interactiveMatchController.js`, après validation/idempotence du résultat canonique :

```js
import { applyMatchProgression } from '../player/matchProgressionSystem.js';

canonical.progression = applyMatchProgression(player, canonical, {
    matchId: canonical.matchId,
    chapterId: state?.career?.progressionChapterId ?? null,
    trainingFocus: state?.trainingFocus
});
```

L'appel remplace entièrement `PlayerLogic.applyProgression(...xp...)`. Il doit rester après le garde-fou empêchant de committer deux fois le même `matchId`.

## Plafonds provisoires

- six apparitions par chapitre ou fenêtre automatique ;
- `+1` de général maximum ;
- `+2` sur l'attribut ciblé maximum ;
- fractions conservées dans `player.matchProgression` ;
- ancienne sauvegarde sans ledger initialisée paresseusement au premier match.

## Simulation déterministe

`node scripts/run-short-career-simulation.js` exécute les 1 008 carrières et affiche le bilan des invariants.

`node scripts/run-short-career-simulation.js --json` produit le rapport complet, où chaque ligne est repérable par `seed`, `origin`, `archetype` et numéro de `match`.
