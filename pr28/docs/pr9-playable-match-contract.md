# PR9 — Contrat du match jouable

Cette reprise de la PR #9 transforme un résultat de football en match vécu.

## Invariants

1. **Le joueur contrôle le rythme.** Aucune scène narrative importante ne possède d'auto-avancement. Seules certaines décisions sous forte pression peuvent expirer.
2. **La structure varie.** Match ordinaire: 1–2 décisions; important: 2–4; rivalité: 3–5; finale: 4–6; remplaçant: 1–3 selon ses minutes.
3. **Le temps écoulé est une conséquence.** Une décision chronométrée expirée ne choisit jamais une option au hasard: l'occasion se referme et la session enregistre l'hésitation.
4. **L'identité du joueur compte.** Les options techniques lisent les attributs techniques et l'origine. FUTSAL et STREET favorisent l'apparition de solutions de petit espace / 1v1, sans garantir leur réussite.
5. **Le risque technique existe.** Un geste spectaculaire peut échouer; sa réussite dépend notamment du niveau technique.
6. **La session est la vérité du match.** Le résultat final porte `matchId`, décisions et événements de cette même session.
7. **L'UI ne crée pas le gameplay.** Elle affiche les étapes du domaine et ne fait que transmettre choix, Continuer ou expiration d'une décision chronométrée.

## Suite du chantier #9

Le prochain lot doit approfondir les conséquences persistantes à l'intérieur du match (défenseur averti, fatigue, espaces créés, répétition d'un duel), puis la séquence visuelle canonique de but et enfin les rapports/réactions strictement liés au même `matchId`.
