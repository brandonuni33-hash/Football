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

## Propriétaires déjà clarifiés

- `main.js` : point d'entrée web uniquement.
- `application/gameEngine.js` : bootstrap applicatif.
- `application/gameApplication.js` : commandes applicatives et abonnements.
- `application/systemRegistry.js` : composition root unique.
- `application/uiGateway.js` : contrat entre UI et application.
- `state/stateManager.js` : propriétaire de la persistance/migration.
- `domain/player/playerSystem.js` : modèle joueur canonique.
- `domain/calendar/calendarSystem.js` : orchestration du calendrier.
- `domain/match/simulatedMatchSystem.js` : simulation de matchs non interactifs.
- `domain/match/interactiveMatchSystem.js` : propriétaire canonique du cycle interactif d'un match.
- `domain/match/interactiveMatchController.js` : session, décisions et résolution du résultat interactif.
- `domain/match/blockMatchSimulator.js` : simulation des matchs d'un bloc, statistiques et progression liée au bloc.
- `domain/match/matchHelpers.js` : fonctions pures partagées par les moteurs de match.
- `domain/notification/notificationSystem.js` : notifications.
- `ui/creationEnhancements.js` : présentation enrichie de la création.
- `ui/creationController.js` : orchestration de la création.
- `ui/viewCoordinator.js` : rendu canonique du dashboard et des applications UI.
- `ui/modalController.js` : modales et réactions narratives.
- `ui/blockResultController.js` : orchestration de l'après-bloc.
- `ui/views/` : écrans spécialisés et sans logique métier.
- `ui.js` : façade de compatibilité mince.
- `cupSystem.js` : propriétaire canonique des coupes nationales.
- `application/systemRegistry.js` : publication des dépendances UI/application, dont `MatchChoiceManager`.

## Ce qui reste à nettoyer

### Priorité 1 — modules historiques racine

Les systèmes historiques suivants restent des dépendances de compatibilité :

`careerSystem.js`, `competitionSystem.js`, `worldSystem.js`, `coachSystem.js`, `events.js`, `media.js`, `economy.js`, `entrainement.js`, `transferMarket.js`, `potentialSystem.js`, `consequenceSystem.js`, `cupSystem.js`, `matchChoices.js`.

Règle : aucune nouvelle mécanique ne doit être ajoutée directement dans ces fichiers lorsqu'un propriétaire de domaine existe.

### Priorité 2 — façades restantes

`matchBlock.js` reste une façade de compatibilité. Elle pourra être supprimée lorsque les derniers imports historiques auront été migrés.

### Priorité 3 — assets UI historiques

`ui-enhancement.css` et `ui-live-polish.css` restent des feuilles de style héritées. Elles peuvent être consolidées plus tard dans `ui/coreStyles.js` et des feuilles de style UI nommées par responsabilité, sans modifier le comportement métier.

## Nettoyage déjà effectué

- suppression de `domain/career/consequenceSystem.js` en doublon ;
- suppression de `gameEngine.js` racine et de l'ancien `LegacyGameBridge` ;
- suppression du doublon `application/notificationSystem.js` ;
- découpage réel de `matchBlock.js` ;
- regroupement de la création dans `ui/creationEnhancements.js` + `ui/creationController.js` ;
- suppression de `creation-ui-polish.js`, `ui-creation-constants-bridge.js` et `ui-creation-ux-v2.js` ;
- suppression de `ui-gameplay-hotfix.js` ;
- suppression de `ui-interactive-match.js` ;
- suppression de `ui-successor-transition.js` ;
- suppression de `ui-live-polish.js` et de son `MutationObserver` ;
- réduction de `ui.js` à une façade ;
- extraction des vues `messages`, `bank`, `stats` et `settings` ;
- absorption de l'ancienne implémentation `cupSystemV2.js` dans `cupSystem.js` ;
- exposition de `MatchChoiceManager` depuis le registry canonique.

## Règles permanentes

1. Un concept métier possède un seul propriétaire.
2. Un fichier de logique vise moins de 350 lignes.
3. Au-dessus de 350 lignes, le découpage devient prioritaire.
4. Au-dessus de 600 lignes, le fichier doit être découpé avant toute nouvelle fonctionnalité.
5. Les catalogues de données peuvent être longs s'ils ne contiennent pas de logique.
6. `main.js` ne connaît jamais les systèmes métier.
7. Un domaine ne doit pas créer de dépendance vers l'UI.
8. Les systèmes historiques racine servent uniquement de compatibilité pendant la migration.
9. Les nouveaux fichiers doivent porter un nom de responsabilité, jamais une version (`V2`, `V4`) ou un état temporaire (`hotfix`, `patch`, `polish`).
10. Toute nouvelle mécanique doit être branchée depuis `application/systemRegistry.js`.
