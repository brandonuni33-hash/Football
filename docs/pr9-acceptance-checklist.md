# PR9 — Checklist d'acceptation

- [x] Aucune scène narrative importante n'avance seule.
- [x] Les décisions ordinaires attendent indéfiniment le joueur.
- [x] Certaines décisions de finale/rivalité peuvent être chronométrées.
- [x] Une expiration ne choisit jamais une réponse à la place du joueur.
- [x] Match ordinaire 1–2 décisions; important 2–4; rivalité 3–5; finale 4–6; remplaçant 1–3.
- [x] Les choix techniques lisent les attributs et l'origine FUTSAL/STREET.
- [x] Un geste technique peut échouer et son risque baisse avec la technique.
- [x] Catalogue contextuel: lob, panenka, bicyclette, talonnade, petit pont, sombrero, extérieur, frappe enroulée, volée, tacle désespéré, duel, tirage de maillot, célébration provocatrice.
- [x] Modèle de mémoire intra-match pour conséquences différées.
- [x] `matchId` canonique sur le résultat interactif.
- [x] Présentation de but impossible sans but canonique identifiable.
- [x] Overlay de but attend explicitement « Continuer ».
- [x] Modèle séparé pour « Ton match », « meilleure performance », « récit du match », « résultats du bloc ».
- [x] Rapport narratif du match lié au `matchId` interactif.
- [x] Réactions avec voix distinctes et fait précis du même match.

## À valider par CI avant merge

Tests unitaires, tests navigateur Playwright et Architecture Check doivent être verts. Aucun merge forcé.
