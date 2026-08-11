# Nettoyage architectural — Street to Pro

## Architecture cible

```text
main.js
  ↓
application/
  ↓
domain/
  ↓
state/ + core/
```

- `main.js` : point d'entrée web.
- `application/` : orchestration et composition root.
- `domain/` : règles métier.
- `state/` : persistance et migrations.
- `ui/` : présentation.

## Propriétaires canoniques

- `application/systemRegistry.js` : composition root unique.
- `state/stateManager.js` : état persistant.
- `domain/player/playerSystem.js` : joueur.
- `domain/player/potentialSystem.js` : potentiel vivant.
- `domain/career/careerSystem.js` : carrière.
- `domain/calendar/calendarSystem.js` : calendrier.
- `domain/competition/competitionSystem.js` : compétitions.
- `domain/competition/cupSystem.js` : coupes nationales.
- `domain/competition/europeanCompetitionSystem.js` : Europe.
- `domain/match/` : simulation et match interactif.
- `domain/decision/consequenceSystem.js` : conséquences différées.
- `domain/events/eventSystem.js` : événements.
- `domain/media/mediaSystem.js` : médias.
- `domain/coach/coachSystem.js` : coach.
- `domain/economy/economySystem.js` : économie.
- `domain/training/` : entraînement.
- `domain/transfer/` : transferts.
- `domain/world/worldCatalog.js` : données monde.
- `domain/world/worldSystem.js` : comportement monde.

## Nettoyage effectué

Les anciens propriétaires racine suivants ont été supprimés après migration de leurs consommateurs :

- `careerSystem.js`
- `potentialSystem.js`
- `competitionSystem.js`
- `cupSystem.js`
- `coachSystem.js`
- `events.js`
- `media.js`
- `economy.js`
- `entrainement.js`
- `transferMarket.js`
- `consequenceSystem.js`
- `matchChoices.js`
- `worldSystem.js`

Le monde est maintenant séparé en données et comportement :

```text
domain/world/
├── worldCatalog.js
└── worldSystem.js
```

Le catalogue peut rester volumineux car il s'agit de données. La logique doit rester découpée et lisible.

## Compatibilité volontaire

`player.js` et `state.js` peuvent rester comme façades historiques. Ils ne doivent pas redevenir propriétaires métier.

`matchBlock.js` reste une façade tant que ses consommateurs externes ne sont pas tous migrés.

## CI

Le workflow historique `career-simulation.yml` référençait des modules supprimés et un simulateur qui n'existe plus. Il a été supprimé.

Le contrôle actif est `.github/workflows/architecture-check.yml`. Il exécute `scripts/checkArchitecture.mjs` sur les modifications JavaScript et peut être lancé manuellement.

## Règles permanentes

1. Un concept métier possède un seul propriétaire.
2. Un fichier de logique vise moins de 350 lignes.
3. Au-dessus de 350 lignes, le découpage devient prioritaire.
4. Au-dessus de 600 lignes, le fichier doit être découpé avant toute nouvelle fonctionnalité.
5. Les catalogues de données peuvent être longs s'ils ne contiennent pas de logique.
6. `main.js` ne connaît jamais les systèmes métier.
7. Un domaine ne dépend jamais de l'UI.
8. Aucun nouveau propriétaire métier ne doit être créé à la racine.
9. Aucun nouveau nom `V2`, `V4`, `hotfix`, `patch` ou `polish` pour une mécanique canonique.
10. Toute nouvelle mécanique est branchée depuis `application/systemRegistry.js`.
