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
- `domain/match/matchImportanceSystem.js` : importance dynamique des matchs.
- `domain/decision/consequenceSystem.js` : conséquences différées.
- `domain/events/eventSystem.js` : événements.
- `domain/media/mediaSystem.js` : médias.
- `domain/coach/coachSystem.js` : coach.
- `domain/economy/economySystem.js` : économie.
- `domain/training/` : entraînement.
- `domain/transfer/` : transferts.
- `domain/world/worldCatalog.js` : données monde.
- `domain/world/worldSystem.js` : comportement monde.
- `domain/awards/awardsSystem.js` : récompenses.
- `domain/notification/` : notifications, signaux et journal de carrière.

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
- `awardsSystem.js`
- `careerSimulationV4.js`
- `creation-tinder.js`
- `matchBlock.js`

Le monde est séparé en données et comportement :

```text
domain/world/
├── worldCatalog.js
└── worldSystem.js
```

## Façades / catalogues encore à la racine

- `player.js` : façade historique mince vers `domain/player/playerSystem.js`.
- `state.js` : façade historique mince vers `state/stateManager.js`.
- `constants.js` : catalogue partagé de création encore consommé par les façades/UI. Il doit être déplacé vers un catalogue de domaine dédié lors d'une prochaine passe, sans modifier les données en cours de route.

Ces fichiers ne doivent pas redevenir des propriétaires métier.

## Modules racine encore actifs à migrer

Quelques modules historiques à la racine sont encore importés par l'application. Ils ne doivent pas être supprimés tant que leur propriétaire canonique n'est pas créé et que tous leurs consommateurs n'ont pas été migrés. Toute migration future doit suivre : recherche des consommateurs → création du propriétaire canonique → bascule des imports → suppression du module racine.

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
