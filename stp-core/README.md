# STP Core Foundations V1

Objectif : poser uniquement les cinq fondations minimales avant tout terrain, joueur ou ballon.

## Native

- C++20
- CMake
- GLFW 3.4
- OpenGL 3.3 Core
- V-Sync activé
- boucle de rendu variable
- logique/physique fixe à 60 Hz via accumulateur
- clavier AZERTY + flèches
- lecture manette analogique via GLFW
- durée d'appui de tir
- ResourceManager minimal avec cycle preload/unload
- SceneManager minimal avec Entity + Transform

### Build

```bash
cmake -S . -B build
cmake --build build --config Release
```

Le binaire produit est `stp_core` (`stp_core.exe` sous Windows selon le générateur).

## Aperçu navigateur

`web/index.html` est un moniteur visuel des mêmes cinq systèmes pour permettre de tester immédiatement via un lien. Il utilise WebGL2 pour l'aperçu, car un exécutable C++/GLFW natif ne peut pas être lancé directement depuis une page web.

L'aperçu affiche en direct : FPS, deltaTime, tick physique 60 Hz, accumulateur, entrées ZQSD/flèches, durée d'appui ESPACE, axes/gâchettes de manette, état du ResourceManager et Entity/Transform racine.

Aucun terrain, joueur ou ballon n'est inclus dans cette étape.
