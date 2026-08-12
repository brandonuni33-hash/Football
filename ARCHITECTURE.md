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

## Match jouable

`domain/match/interactiveMatchController.js` est l'unique propriétaire de la session
et de sa machine de phases. `InteractiveMatchSystem`, enregistré dans
`application/systemRegistry.js`, en expose l'API canonique. Les textes et modèles
présentables sont composés sans mutation par `interactiveMatchNarrative.js`.

La séquence est fixe :

```text
avant-match -> coup d'envoi -> moment 1 -> conséquence immédiate
-> reprise automatique -> événement inattendu -> moment 2
-> fin de match -> coup de sifflet -> vestiaire / coach / médias
```

Chaque match jouable contient exactement deux décisions. Les anciens
`impacts.matchBonuses` sont normalisés par le domaine avant application : l'UI ne
lit et ne calcule aucun bonus. `UIGateway` avance la session et
`ui/interactiveMatchFlowController.js` présente seulement l'étape courante. Le
résultat n'est validé et ajouté au bloc qu'après la séquence de réactions.

Invariants :

- une seule session active dans `state.activeMatchSession` ;
- le score affiché provient toujours de cette session ;
- les buts et passes du joueur sont inclus dans le score de son équipe ;
- les statistiques sont validées une seule fois à la fin ;
- les réactions d'après-match décrivent le résultat réellement résolu.

## Narrative Engine

`domain/narrative/narrativeEngine.js` est la couche canonique d'interprétation narrative.

Le flux canonique est :

```text
systèmes métier -> faits résolus -> NarrativeEngine -> commandes narratives
                 -> NarrativeStateReducer -> NarrativePresenter -> UI
```

Responsabilités internes :

- `NarrativeFactCollector` adapte les sorties existantes sans recalculer le métier ;
- `NarrativeFactNormalizer` impose un contrat immuable et un identifiant déterministe ;
- `NarrativeContextBuilder` construit un instantané de lecture minimal ;
- `NarrativeMemoryReader` retrouve uniquement des souvenirs réellement stockés ;
- `NarrativeSignificance` hiérarchise les faits ;
- `NarrativeThreadTracker` suit les histoires concrètes dans `narrativeState.storyThreads` ;
- `NarrativeArcInterpreter` interprète la phase du récit ;
- `NarrativeScenePlanner` limite un traitement à une scène principale ;
- `NarrativeBeatComposer` compose les beats sans écrire dans le State ;
- `NarrativeWorldBeatComposer` compose les observations passives et le journal ;
- `NarrativeContinuity` refuse contradictions et informations cachées ;
- `NarrativeStateReducer` est l'unique écrivain de `narrativeState`.

`application/narrativeOrchestrator.js` coordonne le moteur et
`application/narrativePresenter.js` expose un modèle de présentation sans DOM.

### Contrat d'un fait

Un fait narratif possède toujours : `id`, `type`, `source`, `occurredAt`,
`subjectId`, `actorIds`, `metrics`, `outcome`, `certainty`, `visibility`, `tags`,
`dedupeKey` et `payload`. Son identifiant dépend de sa clé de déduplication, jamais
de l'heure d'exécution.

### Etat et mémoires

- `careerMemory` conserve les souvenirs durables créés par leur système propriétaire ;
- `narrativeState` conserve les faits traités, fils narratifs, callbacks, hooks,
  cooldowns, clés de beats, journal et rythme ;
- `notifications.threads` reste la structure de livraison des notifications et ne
  doit jamais servir de fil narratif.

### Invariants

- un fait résolu n'est jamais modifié par la narration ;
- un même `id` de fait n'est traité qu'une fois ;
- une contradiction bloque le récit concerné au lieu d'être masquée ;
- un callback référence toujours une mémoire existante ;
- un fait `hidden` ne peut pas être présenté ;
- un traitement produit au maximum une scène principale ;
- seul `NarrativeStateReducer` modifie `narrativeState` ;
- la composition est déterministe à faits et contexte identiques.

### Fin d'un bloc

Le bloc résout d'abord les matchs, le monde, les médias, les événements, le coach,
la carrière, le mercato et la famille. Il remet ensuite ces résultats explicites à
`NarrativeEngine.processBlock()` avant d'avancer le calendrier. Le moteur peut ainsi
raconter la réaction du monde sans lire un état déjà passé à la période suivante.

Seules les étapes de mercato visibles par le joueur (`contact`, `offer`) deviennent
des observations. Le scouting exploratoire reste absent de la présentation. Les
observations les plus significatives rejoignent la scène courante et toutes les
observations visibles sont conservées dans `narrativeState.journalEntries`, que le
Dashboard et la vue Carrière lisent via `NarrativePresenter`.

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
