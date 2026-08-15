# Street to Pro

Simulation de carrière football en JavaScript.

## Architecture

```text
main.js
  ↓
application/
  ↓
domain/
  ↓
state/ + core/
```

`application/` orchestre les systèmes, `domain/` porte les règles métier, `state/` gère la persistance et `ui/` la présentation.

## Règles de contribution

Un concept métier possède un seul propriétaire. Les nouveaux systèmes sont branchés depuis `application/systemRegistry.js`. Les modules métier ne doivent pas être recréés à la racine.

## Développement

Le jeu est publié via GitHub Pages depuis la branche de publication synchronisée avec `main`.
