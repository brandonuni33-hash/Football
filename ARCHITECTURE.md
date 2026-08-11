# Architecture — Street to Pro

## Règle d'or
Chaque responsabilité possède un propriétaire canonique. Les nouveaux systèmes doivent être ajoutés dans leur domaine, pas comme un nouveau fichier racine concurrent.

## Couches

```text
main.js
  ↓
application/
  ↓
domain/ + state/ + core/
  ↓
UI via ui/
```

### `main.js`
Point d'entrée web uniquement. Il ne contient pas de logique métier et ne construit plus directement les systèmes.

### `application/`
Orchestration, commandes, façades et composition du domaine. Aucun calcul métier détaillé ne doit y vivre.

### `domain/`
Propriétaire canonique des règles métier. Les systèmes sont regroupés par domaine : carrière, match, joueur, famille, relations, notifications, interactions, narration, etc.

### `state/`
Contrat, création et lecture du state. Une nouvelle fonctionnalité ne doit pas créer un second gestionnaire d'état parallèle.

### `core/`
Infrastructure générique : événements, commandes, bus et contrats transverses.

### `ui/`
Vues et coordination d'interface. La logique métier reste dans `application/` ou `domain/`.

## Narrative Engine

`domain/narrative/narrativeEngine.js` est la couche canonique d'interprétation narrative.

Il peut :
- lire les faits déjà résolus par les systèmes métier ;
- lire `careerMemory` et les mémoires spécialisées existantes ;
- hiérarchiser les moments ;
- construire des scènes et des beats narratifs ;
- proposer un ton et une importance de présentation.

Il ne peut pas :
- modifier les statistiques du joueur ;
- décider d'un résultat de match ;
- créer ou accepter un transfert ;
- modifier une relation ;
- créer une blessure ou une conséquence métier ;
- remplacer `ConsequenceSystem`, `NotificationSystem` ou les systèmes de domaine.

Les systèmes métier produisent les faits. Les mémoires conservent ce qui compte. Le Narrative Engine interprète. L'UI présente.

## Compatibilité racine
Quelques modules historiques à la racine peuvent rester temporairement comme façades publiques (ex. `player.js`) lorsqu'un grand nombre d'importations historiques les utilise encore. Une façade doit être petite et ne contenir aucune nouvelle règle métier.

## Taille des fichiers

- 0–250 lignes : normal.
- 251–400 : acceptable si mono-responsabilité.
- 401–600 : découpage à envisager.
- >600 : découpage obligatoire pour un fichier de logique.
- Les catalogues de données, CSS et fichiers générés sont exemptés de cette règle de logique.

## Nommage

Un concept ne doit pas avoir plusieurs implémentations portant le même nom dans des couches concurrentes. En particulier, éviter les couples `X.js` / `domain/**/X.js` qui contiennent deux implémentations.

## Nouvelle fonctionnalité

1. Identifier le domaine propriétaire.
2. Créer le plus petit module possible.
3. Brancher le module dans `systemRegistry.js`.
4. Exposer une commande applicative si l'UI en a besoin.
5. Ajouter un test ou une vérification dans `scripts/checkArchitecture.mjs`.
6. Ne pas ajouter une nouvelle logique dans un fichier historique simplement parce qu'il existe déjà.
