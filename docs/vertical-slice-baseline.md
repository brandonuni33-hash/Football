# STP — Vertical Slice Baseline

Cette branche avance la vertical slice sans modifier les zones actuellement travaillées par les PR #28 et #29.

## Objectif

Stabiliser les contrats déjà validés pour :

- création du joueur ;
- fragments du passé ;
- premières scènes du prologue ;
- langage de navigation narrative.

Aucun de ces éléments n'est encore branché au Career Hub ni au moteur de match principal.

## Création du joueur

La vertical slice commence à 14 ans.

Six écrans :

1. identité ;
2. visage ;
3. gabarit ;
4. poste + pied fort ;
5. nationalités ;
6. pays où le joueur a grandi.

Le pied fort est obligatoire : `RIGHT` ou `LEFT`. L'ambidextrie n'est pas un choix gratuit à la création.

La création ne choisit volontairement ni origine football, ni club formateur, ni club de cœur. Ces éléments doivent émerger du prologue et du monde.

## Fragments du passé

Quatre fragments validés sont stockés dans `content/verticalSlice/pastFragments.js`.

Le contenu ne contient aucun bonus visible, malus, poids de trait ou delta de statistique. Les réponses doivent rester ambiguës et non optimisables côté joueur.

Le raccord futur vers les traits cachés appartient à une couche d'orchestration séparée et ne doit pas être déduit directement par l'UI.

## Langage narratif

Contrat de présentation validé :

- 3 panneaux empilés ;
- aucune barre ou habillage en haut ;
- une seule case active ;
- dialogue uniquement sur la case active ;
- swipe horizontal ;
- gauche = avancer ;
- droite = revenir.

Les données de scène sont indépendantes du composant de rendu afin de pouvoir faire évoluer le renderer sans réécrire le contenu.

## Caméra gameplay — spécification uniquement

La cible produit est une caméra **2.5D broadcast** : latérale/inclinée, mobile dans son cadrage, avec léger pivot dynamique et petits zooms. La rotation reste limitée et ne devient jamais une caméra libre 360°.

Cette branche ne modifie aucun fichier de caméra ou de match. L'intégration attendra la stabilisation de la PR #28.

## Frontières avec PR #28 et PR #29

Cette branche ne doit pas modifier :

- `domain/match/*` ;
- `ui/interactiveMatch*` ;
- `ui/styles/interactiveMatch*` ;
- `ui/viewCoordinator.js` ;
- `ui/views/dashboardView.js` ;
- `ui/views/lifeView.js` ;
- `ui/views/playerView.js` ;
- `ui/career/careerHubPresenter.js` ;
- `index.html`.

Le branchement dans le parcours principal sera fait après arbitrage et intégration des lots concernés.

## Principe de baseline

> On stabilise d'abord les contrats produit et les données validées. On connecte ensuite au moteur sans redéfinir l'expérience.
