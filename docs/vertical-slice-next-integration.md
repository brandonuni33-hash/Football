# Intégration différée

Cette baseline ne branche volontairement rien dans les surfaces actuellement en mouvement.

Après stabilisation des PR #28 et #29, le prochain lot pourra :

1. raccorder `playerCreationDraft` au parcours de création réel ;
2. utiliser les fragments de passé via une orchestration de traits cachés non visible ;
3. connecter les scènes du prologue au renderer de panneaux narratifs ;
4. transmettre `city-3v3` au moteur de match stabilisé ;
5. implémenter la caméra 2.5D broadcast selon le contrat produit, sans dupliquer la simulation football.

Aucun de ces raccords ne doit être anticipé dans cette branche.
