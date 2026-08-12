// domain/match/matchChoiceManager.js
// Les impacts restent cachés : le joueur choisit une attitude, pas un bonus.

export class MatchChoiceManager {
    static shouldTriggerDilemma(matchType) {
        if (matchType === 'final' || matchType === 'rival') return true;
        return Math.random() < 0.35;
    }

    static getMatchDilemma(matchType, opponentName) {
        if (matchType === 'final') return {
            type: 'final',
            title: 'Quelques minutes avant la finale',
            description: `Le coach attend que le vestiaire soit silencieux puis vient vers toi. « Contre ${opponentName}, je veux savoir comment tu comptes entrer dans ce match. »`,
            choices: [
                { text: 'Presser très haut dès le début et imposer le rythme', response: 'Tu acquiesces. Tu sais que les premières courses vont coûter cher, mais tu veux que l’adversaire sente immédiatement la pression.', impacts: { stats: { physique: +2, mental: +1 }, matchBonuses: { goalChance: +0.07, ratingBonus: +0.15, fatigueRisk: +7 }, careerMomentum: +1 } },
                { text: 'Commencer simplement et laisser le match venir', response: '« Premier contrôle, première passe. Après, je joue. » Le coach hoche la tête sans ajouter un mot.', impacts: { stats: { technique: +2, discipline: +2 }, matchBonuses: { passAccuracy: +0.12, goalChance: -0.03, ratingBonus: +0.08 }, careerMomentum: +1 } },
                { text: 'Prendre la parole devant le groupe', response: 'Tu te lèves. Tu ne cherches pas une grande phrase, seulement quelques mots que les autres puissent emporter avec eux en sortant.', impacts: { stats: { charisme: +3, relationCoach: +2, vestiaire: +3 }, matchBonuses: { teamBoost: +0.10, ratingBonus: +0.12 }, careerMomentum: +1 } },
                { text: 'Rester dans ta bulle et te concentrer sur tes duels', response: 'Tu baisses les yeux vers tes crampons. Ce soir, tu veux réduire le match à quelque chose de simple : gagner le prochain duel.', impacts: { stats: { mental: +3 }, matchBonuses: { duelBonus: +0.10, assistChance: -0.03 } } }
            ]
        };

        if (matchType === 'rival') return {
            type: 'rival',
            title: `Le derby contre ${opponentName}`,
            description: 'Les premiers chants traversent déjà les murs du vestiaire. Ton capitaine vous rappelle une seule chose : ne pas laisser l’émotion décider à votre place.',
            choices: [
                { text: 'Répondre immédiatement dans les duels', response: 'Tu sais que le premier contact comptera. Tu décides de ne rien céder physiquement.', impacts: { stats: { physique: +2, discipline: -4 }, matchBonuses: { duelBonus: +0.12, cardRisk: +0.10 }, careerMomentum: +1 } },
                { text: 'Ignorer les provocations et répondre uniquement par le jeu', response: 'Tu regardes déjà vers la porte du vestiaire. S’ils veulent parler, tu les laisseras parler.', impacts: { stats: { mental: +3, technique: +1 }, matchBonuses: { passAccuracy: +0.10, ratingBonus: +0.12 }, careerMomentum: +1 } },
                { text: 'Chercher les un-contre-un et provoquer leur défense', response: 'Tu veux les obliger à défendre face à leur propre but. Le reste viendra des espaces que ça créera.', impacts: { stats: { charisme: +2, technique: +1 }, matchBonuses: { goalChance: +0.08, duelBonus: +0.06 }, careerMomentum: +1 } }
            ]
        };

        const classicDilemmas = [
            {
                title: 'Le coach ajuste ton rôle',
                description: `Juste avant de sortir, le coach te montre une zone sur le tableau. « Contre ${opponentName}, c’est ici que je veux te voir faire la différence. »`,
                choices: [
                    { text: 'Attaquer rapidement l’espace dès la récupération', response: 'Tu mémorises l’espace dans leur dos. Sur les premiers ballons récupérés, tu regarderas immédiatement devant.', impacts: { stats: { vitesse: +2 }, matchBonuses: { counterAttack: +0.12, passAccuracy: -0.03 }, careerMomentum: +1 } },
                    { text: 'Décrocher pour toucher plus de ballons et organiser le jeu', response: 'Tu décides de venir chercher le ballon plus bas pour participer davantage à la construction.', impacts: { stats: { technique: +2, mental: +1 }, matchBonuses: { assistChance: +0.08, goalChance: -0.03 }, careerMomentum: +1 } },
                    { text: 'Rester haut et attendre les erreurs de leur ligne défensive', response: 'Tu veux les obliger à regarder constamment derrière eux, même lorsque tu ne touches pas le ballon.', impacts: { stats: { mental: +2 }, matchBonuses: { goalChance: +0.08, fatigueRisk: +4 }, careerMomentum: +1 } }
                ]
            },
            {
                title: 'Une menace à gérer',
                description: `${opponentName} aime partir vite à la récupération. Le coach te demande comment tu veux gérer ton vis-à-vis lorsque le ballon est perdu.`,
                choices: [
                    { text: 'Sortir fort sur lui et empêcher la première accélération', response: 'Tu choisis de réduire l’espace immédiatement, quitte à accepter davantage de contacts.', impacts: { stats: { physique: +1, defense: +2 }, matchBonuses: { duelBonus: +0.08, cardRisk: +0.08 }, careerMomentum: +1 } },
                    { text: 'Garder une position équilibrée et fermer d’abord les lignes de passe', response: 'Tu préfères retarder l’action et attendre le soutien plutôt que de te jeter sur le premier mouvement.', impacts: { stats: { mental: +2, defense: +1 }, matchBonuses: { passAccuracy: +0.06, ratingBonus: +0.08 }, careerMomentum: +1 } }
                ]
            }
        ];
        return classicDilemmas[Math.floor(Math.random() * classicDilemmas.length)];
    }
}
export default MatchChoiceManager;
