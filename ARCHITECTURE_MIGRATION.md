# Migration backlog

## Completed in the current cleanup

- `main.js` is a minimal web entrypoint.
- `gameEngine.js` moved to `application/gameEngine.js`.
- `application/legacyGameBridge.js` removed; gameplay commands now use application handlers.
- `state.js` reduced to a compatibility facade; persistence/migration now lives in `state/stateManager.js`.
- `application/notificationSystem.js` removed; notifications have a single owner in `domain/notification/notificationSystem.js`.
- Interactive and simulated matches now have explicit registry names: `interactiveMatchSystem` and `simulatedMatchSystem`.
- Duplicate legacy `domain/career/consequenceSystem.js` removed previously.
- Architecture guard added under `scripts/checkArchitecture.mjs` and CI workflow added under `.github/workflows/architecture-check.yml`.

## Next cleanup targets

### High priority

`ui.js` remains too large and owns both rendering and embedded styling. It should be split into presentation modules plus dedicated CSS without changing the public `UserInterface` contract in one step.

`matchBlock.js` remains the large historical implementation behind `domain/match/interactiveMatchSystem.js`. It should be split into match session, decision resolution, result/statistics, and progression adapters.

### Medium priority

The historical root modules `careerSystem.js`, `competitionSystem.js`, `worldSystem.js`, `coachSystem.js`, `events.js`, `media.js`, `economy.js`, `entrainement.js`, `transferMarket.js`, `potentialSystem.js`, `cupSystem.js` and `matchChoices.js` should progressively become small compatibility facades or move into their canonical domains.

### Rule
Do not add new business logic to a historical root module when a domain owner already exists. Prefer adding a new small domain module and wiring it through `application/systemRegistry.js`.
