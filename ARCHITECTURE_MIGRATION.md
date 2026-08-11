# Nettoyage architectural — Street to Pro

## Objectif

Conserver une base `main` sur laquelle une nouvelle fonctionnalité peut être ajoutée dans un domaine précis, sans multiplier les fichiers `V2`, `V4`, `hotfix`, les doublons de systèmes ou les gros fichiers fourre-tout.

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

`ui/` reste la couche de présentation. `application/` orchestre. `domain/` porte les règles métier. `state/` porte la persistance et les migrations. `core/` porte les mécanismes génériques.

## Propriétaires canoniques

- `main.js` : point d'entrée web uniquement.
- `application/gameEngine.js` : bootstrap applicatif.
- `application/gameApplication.js` : commandes applicatives et abonnements.
- `application/systemRegistry.js` : composition root unique.
- `application/uiGateway.js` : contrat entre UI et application.
- `state/stateManager.js` : propriétaire de la persistance/migration.
- `domain/player/playerSystem.js` : modèle joueur canonique.
- `domain/player/potentialSystem.js` : potentiel vivant.
- `domain/career/careerSystem.js` : trajectoire de carrière.
- `domain/calendar/calendarSystem.js` : calendrier.
- `domain/competition/competitionSystem.js` : orchestration des compétitions.
- `domain/competition/cupSystem.js` : coupes nationales.
- `domain/competition/internationalSystem.js` : compétitions internationales.
- `domain/match/` : simulation, match interactif, choix et helpers.
- `domain/decision/consequenceSystem.js` : conséquences différées des choix.
- `domain/events/eventSystem.js` : événements carrière.
- `domain/media/mediaSystem.js` : média et dilemmes médiatiques.
- `domain/coach/coachSystem.js` : relation et interactions coach.
- `domain/economy/economySystem.js` : économie et finances.
- `domain/training/trainingManager.js` + `trainingSystem.js` : entraînement.
- `domain/transfer/transferMarket.js` + `transferSystem.js` : marché des transferts.
- `domain/notification/notificationSystem.js` : notifications.
- `ui/creationController.js` et `ui/creationEnhancements.js` : création.
- `ui/viewCoordinator.js` : orchestration du rendu.
- `ui/modalController.js` : modales.
- `ui/blockResultController.js` : après-bloc.
- `ui/views/` : écrans spécialisés.
- `ui.js` : façade de compatibilité mince.

## État du nettoyage

### Modules racine migrés

Les anciens propriétaires racine suivants ont été supprimés après migration des consommateurs :

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

Les imports applicatifs et domaine concernés utilisent maintenant leurs propriétaires canoniques dans `domain/`.

### Dernier module historique restant

`worldSystem.js` reste le dernier gros propriétaire racine à migrer. Il contient à la fois le catalogue de clubs et la logique du monde : sa migration doit donc être faite en séparant au minimum :

```text
domain/world/
├── worldCatalog.js
├── worldSystem.js
└── leagueSimulation.js
```

Le catalogue peut rester volumineux car il s'agit de données ; la logique du monde doit rester sous 350 lignes par fichier.

### Compatibilité volontaire

`player.js` et `state.js` restent autorisés comme façades de compatibilité. Ils ne doivent pas redevenir des propriétaires métier.

`matchBlock.js` reste également une façade historique tant que tous les consommateurs externes ne sont pas migrés.

### UI historique

`style.css` reste la feuille globale historique. Son nettoyage doit être effectué par cartographie des sélecteurs avant suppression ou découpage afin de ne pas casser les écrans existants.

## Règles permanentes

1. Un concept métier possède un seul propriétaire.
2. Un fichier de logique vise moins de 350 lignes.
3. Au-dessus de 350 lignes, le découpage devient prioritaire.
4. Au-dessus de 600 lignes, le fichier doit être découpé avant toute nouvelle fonctionnalité.
5. Les catalogues de données peuvent être longs s'ils ne contiennent pas de logique.
6. `main.js` ne connaît jamais les systèmes métier.
7. Un domaine ne doit pas créer de dépendance vers l'UI.
8. Les systèmes historiques racine ne sont acceptables que pendant une migration contrôlée.
9. Les nouveaux fichiers portent un nom de responsabilité, jamais une version (`V2`, `V4`) ou un état temporaire (`hotfix`, `patch`, `polish`).
10. Toute nouvelle mécanique est branchée depuis `application/systemRegistry.js`.
