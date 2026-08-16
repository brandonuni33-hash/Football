// content/verticalSlice/pastFragments.js
// Storyboard canonique des souvenirs d'enfance.
// Les réponses nourriront plus tard des signaux cachés ; aucun bonus chiffré n'est exposé ici.

const freezeAnswers = answers => Object.freeze(answers.map(answer => Object.freeze({ ...answer })));

export const PAST_FRAGMENTS = Object.freeze([
    Object.freeze({
        id: 'memory-salon', visualKey: 'salon', memoryLabel: 'Souvenir 01',
        question: "Quand tu regardes un joueur, qu’est-ce que tu remarques en premier ?",
        answers: freezeAnswers([
            { id: 'information', text: 'Sa prise d’information.' },
            { id: 'risk', text: 'Sa prise de risque.' },
            { id: 'first-touch', text: 'Sa première touche.' }
        ])
    }),
    Object.freeze({
        id: 'memory-cour', visualKey: 'cour', memoryLabel: 'Souvenir 02',
        question: "Quand t’as le ballon, qu’est-ce que tu regardes en premier ?",
        answers: freezeAnswers([
            { id: 'opponent-distance', text: 'La distance entre moi et l’adversaire.' },
            { id: 'teammate-position', text: 'Le placement de mon coéquipier.' },
            { id: 'space', text: 'L’espace pour créer quelque chose.' }
        ])
    }),
    Object.freeze({
        id: 'memory-city', visualKey: 'city', memoryLabel: 'Souvenir 03',
        question: "Qu’est-ce qui te frustre le plus dans un match ?",
        answers: freezeAnswers([
            { id: 'cannot-try', text: 'Ne pas pouvoir tenter ce que j’ai en tête.' },
            { id: 'too-slow', text: 'Quand le jeu devient trop lent.' },
            { id: 'too-individual', text: 'Quand chacun joue personnel.' }
        ])
    }),
    Object.freeze({
        id: 'memory-chambre', visualKey: 'chambre', memoryLabel: 'Souvenir 04',
        question: "Si ton coéquipier réussit là où toi tu voulais briller, tu ressens quoi en premier ?",
        answers: freezeAnswers([
            { id: 'team-first', text: 'Tant qu’on gagne, ça me va.' },
            { id: 'happy-but-me', text: 'Je suis content pour lui, mais j’aurais aimé que ce soit moi.' },
            { id: 'prove-worth', text: 'Ça me donne encore plus envie de montrer ce que je vaux.' },
            { id: 'hidden-anger', text: 'Ça m’énerve, même si je le montre pas.' }
        ])
    }),
    Object.freeze({
        id: 'memory-porte', visualKey: 'porte', memoryLabel: 'Souvenir 05',
        question: "Quand tout le monde commence à douter de toi, qu’est-ce qui te pousse à continuer ?",
        answers: freezeAnswers([
            { id: 'prove-wrong', text: 'Leur prouver qu’ils se trompent.' },
            { id: 'find-limit', text: 'Voir jusqu’où je peux vraiment aller.' },
            { id: 'too-much-given', text: 'J’ai déjà trop donné pour m’arrêter maintenant.' },
            { id: 'love-game', text: 'Parce que jouer reste ce que j’aime le plus.' }
        ])
    })
]);

export function getPastFragmentById(id) {
    return PAST_FRAGMENTS.find(fragment => fragment.id === id) ?? null;
}
