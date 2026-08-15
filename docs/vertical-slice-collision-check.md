# Collision check — baseline vertical slice

Contrôle effectué au démarrage de `feature/baseline-player-creation-prologue`.

## PR #28

Périmètre observé : match interactif, caméra/presentation state, situation tactique, styles match, célébration, tests match et `index.html`.

La baseline n'écrit dans aucun de ces fichiers.

## PR #29

Périmètre observé : Career Hub, ViewCoordinator, Dashboard, Vie, Joueur et tests associés.

La baseline n'écrit dans aucun de ces fichiers.

## Périmètre de cette branche

- `ui/verticalSlice/*`
- `content/verticalSlice/*`
- `tests/unit/verticalSlice/*`
- `docs/vertical-slice-*`

Conclusion : les lots restent physiquement séparés. Toute future intégration dans le parcours principal ou le moteur de match sera faite dans un lot ultérieur, après stabilisation des PR #28 et #29.
