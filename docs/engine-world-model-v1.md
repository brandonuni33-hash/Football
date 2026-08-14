# ENGINE — World Data Model V1

Cette étape pose uniquement les contrats de données nécessaires à la future simulation mondiale. Elle ne remplace pas encore `WorldSystem`, ne change pas le potentiel actuel et ne modifie pas l'interface.

## Principe

Le monde est complet partout mais sa précision augmente autour de la carrière.

- `BUBBLE` : club du joueur et acteurs directement liés ; état individuel complet destiné à la simulation fine.
- `ACTIVE` : championnat du joueur et clubs devenus directement pertinents ; simulation détaillée mais moins coûteuse.
- `GLOBAL` : reste du monde jouable ; état léger et cohérent, sans matérialiser tous les détails inutiles.

Un club peut changer de profondeur au cours de la carrière sans être recréé ni perdre son histoire.

## Contrats posés

`WorldPlayerRecord` sépare explicitement :
- identité et rattachement club/effectif ;
- `currentLevel`, utilisé comme niveau footballistique actuel ;
- `development.dynamicPotential` ;
- `development.rawCeiling` ;
- vitesse de développement et profil de maturité ;
- forme, condition, blessure et statut sportif ;
- contrat ;
- profondeur de simulation.

Le potentiel dynamique et le plafond brut ne peuvent jamais être inférieurs au niveau actuel. Cette PR ne définit toutefois aucune règle de progression : ce sera le chantier Potentiel évolutif V2.

`ClubWorldProfile` adapte les clubs du catalogue existant vers un contrat moteur stable : niveau sportif, prestige, formation, finances, profil de recrutement et capacité de passage vers le monde pro.

## Migration sans big bang

`WorldModelBridge` monte `state.world.model` à côté du monde actuel. `world.leagues`, classements, calendrier, matchs, montées/descentes et `BlockSystem` continuent donc de fonctionner comme avant.

Aucune donnée CONTENT n'est réécrite ici. Les noms de clubs, ligues, générateurs de noms fictifs et profils éditoriaux restent la responsabilité de CONTENT. ENGINE définit uniquement la forme que ces données doivent respecter.

## Étape suivante ENGINE

Après validation/intégration : matérialisation d'effectifs fictifs autour du club de départ et simulation légère des autres clubs, sans encore toucher au bouton « Continuer la carrière ».
