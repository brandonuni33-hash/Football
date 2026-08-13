# STP Avatar — pipeline de production officiel

## Référence visuelle verrouillée

La planche de casting validée avec **Elias Morel, Malik Sissoko et Nao Ferreira à 24 ans** devient la référence visuelle officielle pour les avatars STP.

À partir de maintenant, on ne recherche plus une nouvelle direction artistique. Toute production avatar doit reprendre le même ADN :

- visages et proportions crédibles ;
- finition semi-réaliste manga ;
- trait net et ombrage graphique ;
- maillot STP noir avec accents jaune-orangé ;
- fond sombre, texturé et dynamique ;
- expression calme et déterminée ;
- légère vue 3/4 ;
- même traitement de lumière, mêmes proportions et même niveau de détail entre les identités.

Le ratio **70–80 % crédible / 20–30 % manga** reste la référence pour l'avatar standard. Les scènes émotionnelles peuvent ponctuellement augmenter l'intensité manga si le récit le justifie, sans modifier l'identité visuelle.

La prochaine question à résoudre n'est plus « quel style choisir ? », mais : **reconnaît-on immédiatement le même joueur à différents âges puis dans son sprite 2D ?**

## Principe

**Une seule personne, trois couches visuelles.**

Le système ne doit jamais confondre l'identité du joueur, son style actuel et les transformations liées à l'âge.

```text
IDENTITÉ PERMANENTE
        +
APPARENCE / STYLE ACTUELS
        +
ÂGE / STADE VISUEL DÉRIVÉ
        ↓
PORTRAIT MANGA + SPRITE 2D
```

## 1. Identité permanente

Cette couche définit **qui est le joueur**. Elle doit rester stable même si le joueur change volontairement de coiffure, de barbe, de chaussures ou de numéro.

V0 :

- teinte de peau ;
- forme générale du visage ;
- couleur des yeux.

À terme, d'autres ancrages faciaux pourront être ajoutés uniquement s'ils améliorent réellement la reconnaissance.

## 2. Apparence / style actuels

Cette couche peut évoluer pendant une carrière par choix du joueur ou par changement de contexte.

V0 :

- coiffure ;
- couleur de cheveux ;
- barbe ;
- accessoire de tête ;
- morphologie actuelle ;
- manches ;
- chaussures ;
- numéro.

Un changement dans cette couche ne crée jamais une nouvelle identité de joueur.

## 3. Âge / stade visuel

L'âge est dérivé de l'âge courant de la carrière. Il ne remplace jamais les choix du joueur.

Étapes :

- 14–16 : `academy` ;
- 17–20 : `young` ;
- 21–27 : `prime` ;
- 28–33 : `experienced` ;
- 34–45 : `veteran`.

Le vieillissement peut modifier visuellement : maturité du visage, définition de la mâchoire, développement corporel, densité potentielle de barbe, rides d'expression tardives, posture et regard.

Il ne change jamais automatiquement : coiffure, couleur de cheveux, accessoires, tatouages, chaussures, numéro ou style personnel.

## 4. Portrait manga — ordre des couches

Le portrait premium doit être produit sur un gabarit commun afin que les variantes restent compatibles.

Ordre recommandé :

1. fond ;
2. silhouette / corps de pose ;
3. base peau ;
4. géométrie du visage ;
5. yeux ;
6. cheveux arrière ;
7. cheveux avant ;
8. barbe ;
9. accessoire de tête ;
10. tenue / maillot ;
11. ombrages et lumière ;
12. expression ;
13. marqueurs d'âge ;
14. effets narratifs éventuels.

Les couches 11 à 14 peuvent être plus manga dans une scène émotionnelle forte. Les couches 2 à 10 doivent rester crédibles et cohérentes.

### Gabarit V1 recommandé

- une seule pose neutre de buste ;
- cadrage identique pour toutes les variantes ;
- fond transparent pour les couches modulaires ;
- même point d'ancrage du visage, du cou et des épaules ;
- export master haute définition avant déclinaisons UI.

### Orientation UI

L'orientation du portrait peut être adaptée à sa position dans l'interface. Si l'image est affichée à gauche, le joueur peut regarder légèrement vers l'intérieur de l'écran. Cette orientation est une variante de composition, pas une nouvelle DA.

## 5. Sprite 2D — identité minimale obligatoire

Le sprite n'a pas besoin de reproduire le visage détaillé. Il doit permettre de reconnaître le joueur en moins d'une seconde grâce à :

- teinte de peau ;
- forme + couleur des cheveux ;
- accessoire distinctif ;
- gabarit ;
- manches ;
- chaussures ;
- numéro quand il est lisible.

L'âge agit très légèrement sur le sprite : proportions générales, posture et volume corporel. Les rides, détails de mâchoire ou nuances du regard restent réservés au portrait.

## 6. Règle de cohérence portrait ↔ sprite

Le portrait manga et le sprite 2D lisent **le même contrat d'apparence**.

Interdit :

- une coupe disponible sur le portrait mais impossible à représenter sur le sprite ;
- une couleur différente entre les deux représentations ;
- un accessoire visible uniquement dans l'une sans raison ;
- modifier l'identité du visage pour compenser un changement d'âge.

## 7. Règle de production des cosmétiques

Un cosmétique doit être conçu comme une couche remplaçable, pas comme une nouvelle illustration complète.

Exemple : une nouvelle coiffure doit pouvoir se monter sur la pose neutre existante et, à terme, être déclinée sur les animations 2D nécessaires.

Les cosmétiques premium peuvent être plus distinctifs, mais les looks irréalistes ne deviennent jamais la norme visuelle de base.

## 8. Validation avant production en volume

Le système n'est pas considéré validé tant que le même pipeline n'a pas produit :

- 3 identités clairement différentes ;
- chacune à 5 stades d'âge ;
- avec au moins 2 styles capillaires différents sur une même identité ;
- sans perte de reconnaissance de la personne.

### Test obligatoire

Pour chaque rendu :

1. croit-on à ce personnage comme footballeur ?
2. reconnaît-on la même personne malgré l'âge ?
3. les changements de style restent-ils volontaires et distincts du vieillissement ?
4. le portrait et le sprite partagent-ils les mêmes marqueurs visibles ?
5. respecte-t-on la charte STP : réalité du football, émotion du manga ?

## 9. Premier lot d'assets à produire

Ne pas produire des dizaines de poses.

Premier lot :

- 1 pose manga neutre ;
- 3 identités de test ;
- 5 stades d'âge ;
- 1 sprite simplifié correspondant par identité ;
- 1 seul kit neutre STP ;
- aucun effet émotionnel fort.

Le casting de référence est désormais verrouillé : **Elias Morel, Malik Sissoko et Nao Ferreira**.

Une fois le vieillissement et les sprites validés, la prochaine pose à produire sera une **pose de but important**, pas une bibliothèque complète.
