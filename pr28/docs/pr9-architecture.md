# PR9 — Architecture

- `interactiveMatchController`: propriétaire de la session jouable et du résultat canonique.
- `interactiveMatchNarrative`: compose uniquement les étapes affichables, sans modifier le State.
- `interactiveMatchFlowController`: affiche et transmet Continuer/choix/expiration; aucune règle de gameplay.
- `matchDecisionPlan` / `matchPressurePolicy`: politiques explicites pour structure variable et chrono exceptionnel.
- `spectacularGestureCatalog` / `matchGestureOutcome`: disponibilité contextuelle et probabilité des gestes selon identité/technique.
- `interactiveMatchMemory` / `matchConsequenceChain`: mémoire locale et cinq niveaux de conséquences.
- `goalEventResolver` / `goalPresentation` / `goalCelebrationOverlay`: un but doit exister canoniquement avant sa mise en scène.
- `matchIdentityGuard` / `matchNarrativeInvariant`: empêchent le mélange de faits entre matchs.
- `matchBlockPresentation`: sépare Ton match, meilleure performance, récit et résultats du bloc.
- `matchStoryWriter` / `matchReactionVoices`: racontent le tournant et des réactions factuelles, jamais une seconde vérité du match.
