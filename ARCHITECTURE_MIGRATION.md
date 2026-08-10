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
- `domain/match/interactiveMatchSystem.js` : frontière canonique du moteur de match interactif pendant sa décomposition.
- `domain/notification/notificationSystem.js` : notifications.

## Ce qui reste à nettoyer

### Priorité 1 — gros fichiers

- `ui.js` : trop de responsabilités (shell, création, rendu historique, styles injectés, modales).
- `matchBlock.js` : session interactive, décisions, résultat, statistiques et progression encore regroupés.

Ces fichiers ne doivent pas recevoir de nouvelle logique métier avant leur découpage.

### Priorité 2 — modules historiques racine

Les systèmes historiques suivants restent des dépendances de compatibilité :

`careerSystem.js`, `competitionSystem.js`, `worldSystem.js`, `coachSystem.js`, `events.js`, `media.js`, `economy.js`, `entrainement.js`, `transferMarket.js`, `potentialSystem.js`, `consequenceSystem.js`, `cupSystem.js`, `matchChoices.js`.

Règle : aucune nouvelle mécanique ne doit être ajoutée directement dans ces fichiers lorsqu'un propriétaire de domaine existe.

### Priorité 3 — UI multi-couches

Les fichiers racine de type `ui-*`, `*-v2`, `*-hotfix`, `*-polish` doivent progressivement être remplacés par des modules nommés par responsabilité dans `ui/`, `ui/views/`, `ui/controllers/` ou `ui/components/`.

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

## État de cette reprise

La passe précédente a été volontairement interrompue lorsqu'un déplacement physique de `ui.js` a révélé que ses imports racine n'étaient pas encore migrés. Le déplacement a été annulé pour conserver `main` fonctionnel.

La suite correcte est donc un découpage réel du contenu de `ui.js` et `matchBlock.js`, puis la suppression progressive des implémentations historiques racine. Aucun simple déplacement de fichier ne doit être utilisé pour masquer les dépendances.
