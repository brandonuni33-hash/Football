# Contribuer à Street to Pro

Cette convention protège la stabilité du jeu et son architecture. Elle s'applique à toute modification du dépôt.

## Branches canoniques

- `main` contient uniquement du code fonctionnel, testé et prêt à être déployé.
- `gh-pages` sert uniquement à la publication. Aucun développement n'y est réalisé directement.
- `gh-pages` ne peut avancer que vers un commit déjà présent dans `main` et validé sur ce même commit par `Architecture Check` et `Browser tests`.
- Aucun push direct, force-push ou développement direct n'est autorisé sur `main` ou `gh-pages`.

## Cycle obligatoire d'une modification

1. Mettre à jour les références locales avec `git fetch --prune`.
2. Créer une branche courte depuis le dernier `main`.
3. Traiter un seul sujet précis dans cette branche.
4. Ajouter ou adapter les tests de non-régression nécessaires.
5. Réintégrer le dernier `main` avant la fusion, de préférence par rebase.
6. Ouvrir une Pull Request vers `main`.
7. Fusionner uniquement lorsque les contrôles obligatoires sont verts et les discussions résolues.
8. Utiliser `Squash and merge` afin de conserver un commit lisible par chantier.
9. Supprimer la branche de travail après la fusion.
10. Synchroniser `gh-pages` uniquement après la validation complète du commit fusionné.

## Nomenclature des branches

Le nom suit le format `type/description-en-kebab-case` :

- `feature/nom-fonctionnalite` pour une fonctionnalité ;
- `fix/nom-du-bug` pour une correction ;
- `refactor/nom-chantier` pour une restructuration sans changement fonctionnel ;
- `chore/description` pour la maintenance et l'outillage ;
- `test/description` pour les tests seuls ;
- `docs/description` pour la documentation seule.

Exemples : `fix/match-score-coherence`, `feature/save-system`, `refactor/narrative-engine`.

## Périmètre d'une branche et d'une PR

- Une branche et une PR correspondent à un seul objectif vérifiable.
- Une correction, une fonctionnalité et un refactor indépendant ne sont pas mélangés.
- Un problème découvert en cours de chantier reçoit sa propre branche, sauf s'il bloque directement le sujet en cours.
- Une PR décrit le problème, sa cause, la solution, les effets utilisateur et les validations réalisées.
- Aucun fichier temporaire, rapport de test généré, dépendance installée ou sauvegarde locale ne doit être commité.

## Commits

- Chaque commit représente une étape cohérente et utilise un message décrivant son résultat.
- Les messages vagues comme `update`, `fix` ou `changes` sont interdits.
- La fusion finale utilise un squash pour produire un commit canonique par chantier dans `main`.

## Validation obligatoire

Une PR n'est fusionnable que si :

- `Architecture Check` réussit ;
- `Browser tests` réussit intégralement ;
- les tests portent sur le même commit que celui qui sera fusionné ;
- aucun conflit avec `main` ne subsiste ;
- aucune incohérence métier connue n'est ignorée ;
- toute nouvelle règle métier importante possède un test de non-régression.

Un test instable, ignoré ou relancé jusqu'à réussite sans diagnostic ne constitue pas une validation.

## Propriété et cohérence métier

- `state` reste la source de vérité.
- Un concept métier possède un seul propriétaire canonique.
- L'interface présente les faits mais ne recalcule pas les règles métier.
- Le Narrative Engine interprète des résultats déjà cohérents et ne corrige jamais les scores ou statistiques.
- Toute statistique individuelle doit être compatible avec le résultat collectif correspondant.
- Les nouveaux systèmes sont assemblés dans `application/systemRegistry.js`.
- Aucun doublon `V2`, `V3`, `hotfix` ou logique métier nouvelle à la racine n'est accepté.

## Tags et points de restauration

- Les branches `backup/*` sont interdites.
- Un état important est figé avec un tag annoté et explicite.
- Les versions suivent de préférence le versionnage sémantique : `vMAJEUR.MINEUR.CORRECTIF`.
- Pour publier un tag précis : `git push origin <nom-du-tag>`.
- Éviter `git push origin --tags`, qui peut publier des tags locaux non souhaités.

Exemple :

```bash
git tag -a v1.0.0-before-narrative-refactor -m "État stable avant la refonte narrative"
git push origin v1.0.0-before-narrative-refactor
```

## Nettoyage

- Les branches fusionnées sont supprimées sur GitHub et localement.
- Exécuter régulièrement `git fetch --prune` pour retirer les références distantes obsolètes.
- Une branche non fusionnée n'est supprimée qu'après confirmation de son abandon ou récupération de son travail utile.

## Méthode de travail

Tout chantier suit l'ordre : **audit → plan → modification → contrôle → tests → nettoyage → Pull Request → fusion → publication**.
