// content/verticalSlice/pastFragments.js
// Fragments de passé validés pour la vertical slice.
// Aucun poids de trait ni bonus visible n'est stocké ici : le contenu reste non-optimisable côté joueur.

const freezeAnswers = answers => Object.freeze(answers.map(answer => Object.freeze({ ...answer })));

export const PAST_FRAGMENTS = Object.freeze([
    Object.freeze({
        id: 'decisive-penalty',
        visualKey: 'penalty',
        memoryLabel: 'Un souvenir',
        situation: 'Dernier penalty. Tout le monde regarde.',
        question: "Qu’est-ce qui te traverse en premier ?",
        prompt: 'Tu poses le ballon.',
        answers: freezeAnswers([
            { id: 'fear-ridicule', text: 'Pourvu que je ne me ridiculise pas.' },
            { id: 'already-decided', text: 'Je sais déjà où je vais tirer.' },
            { id: 'keeper-nervous', text: 'Le gardien est peut-être aussi nerveux que moi.' },
            { id: 'take-responsibility', text: 'Je veux le prendre. Même si je le rate.' }
        ])
    }),
    Object.freeze({
        id: 'friend-qualifying-goal',
        visualKey: 'celebration',
        memoryLabel: 'Un souvenir',
        situation: 'Ton pote marque le but qui vous qualifie.',
        question: "Sur le moment, qu’est-ce qui compte le plus ?",
        prompt: 'Tout le monde court vers lui.',
        answers: freezeAnswers([
            { id: 'happy-for-him', text: 'Je suis heureux pour lui.' },
            { id: 'wish-it-were-me', text: 'J’aurais aimé que ce soit moi.' },
            { id: 'qualified-first', text: 'Peu importe. On est qualifiés.' },
            { id: 'remember-assist', text: 'J’espère qu’il se rappelle qui lui a donné le ballon.' }
        ])
    }),
    Object.freeze({
        id: 'level-judgment',
        visualKey: 'locker-room-judgment',
        memoryLabel: 'Un souvenir',
        situation: "Quelqu’un te dit que tu n’es peut-être pas assez bon.",
        question: "Qu’est-ce qui te vient en premier ?",
        prompt: 'Tu l’entends jusqu’au bout.',
        answers: freezeAnswers([
            { id: 'maybe-right', text: 'Peut-être qu’il a raison.' },
            { id: 'who-judges-me', text: 'Pour qui il se prend pour me juger ?' },
            { id: 'just-play', text: 'Rien. Je préfère jouer.' },
            { id: 'prove-it', text: 'Très bien. Je vais lui montrer.' }
        ])
    }),
    Object.freeze({
        id: 'best-match-locker-room',
        visualKey: 'locker-room-praise',
        memoryLabel: 'Un souvenir',
        situation: 'Après ton meilleur match, le vestiaire parle de toi.',
        question: "Qu’est-ce que ça change pour toi ?",
        prompt: 'Tu les entends parler.',
        answers: freezeAnswers([
            { id: 'they-exaggerate', text: 'Ils exagèrent.' },
            { id: 'next-match-pressure', text: 'Ça ne voudra rien dire si je rate le prochain.' },
            { id: 'seen-differently', text: 'Les gens vont peut-être me regarder autrement.' },
            { id: 'want-replay', text: 'Rien. J’ai juste envie de rejouer.' }
        ])
    })
]);

export function getPastFragmentById(id) {
    return PAST_FRAGMENTS.find(fragment => fragment.id === id) ?? null;
}
