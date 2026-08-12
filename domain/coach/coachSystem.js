// domain/coach/coachSystem.js

import { ConsequenceSystem } from '../decision/consequenceSystem.js';
import { EventBus } from '../../core/eventBus.js';
import { EVENTS } from '../../core/events.js';

const clampRelation = value => Math.min(100, Math.max(0, Number(value ?? 50)));
const recentCoachEventIds = state => (state?.careerMemory || []).filter(item => item?.type === 'coach-choice' || item?.source === 'Coach').slice(-3).map(item => item.eventId).filter(Boolean);

function enrichCoachMemory(state, { result, eventData, choice, coachState }) {
    const memory = state.careerMemory?.findLast?.(item => item?.choiceId === result?.choiceId && item?.source === 'Coach')
        || [...(state.careerMemory || [])].reverse().find(item => item?.choiceId === result?.choiceId && item?.source === 'Coach');
    if (!memory) return null;
    memory.type = 'coach-choice';
    memory.eventId = eventData?.id || null;
    memory.coachName = coachState?.name || state.social?.formativeCoach || "l'entraîneur";
    memory.eventTitle = eventData?.title || null;
    memory.eventDescription = eventData?.description || null;
    memory.choiceText = choice?.text || memory.text || null;
    memory.responseText = choice?.response || memory.immediateReaction || null;
    memory.opinion = coachState?.opinion || choice?.opinionChange || 'Neutre';
    memory.relationAtChoice = clampRelation(coachState?.relation ?? state.player?.stats?.relationCoach ?? 50);
    memory.relationIntent = Number(choice?.impacts?.relationCoach || choice?.consequences?.emotional?.relationCoach || 0);
    return memory;
}

function pickFresh(state, candidates) {
    const recent = new Set(recentCoachEventIds(state));
    const fresh = candidates.filter(event => !recent.has(event.id));
    const pool = fresh.length ? fresh : candidates;
    return pool[Math.floor(Math.random() * pool.length)] || null;
}

export class CoachSystem {
    static checkCoachInteraction(state) {
        if (!state?.player) return null;
        const player = state.player;
        const coachName = state.social?.coachData?.name || state.social?.formativeCoach || "l'entraîneur";
        const rawOrigin = player.origin || state.selectedData?.origin || 'academy';
        const origin = typeof rawOrigin === 'string' ? rawOrigin.toLowerCase() : 'academy';
        state.social ||= {};
        state.social.coachData ||= { name: coachName, relation: player.stats?.relationCoach || 50, opinion: 'Neutre', hasLeftClub: false };
        const coachState = state.social.coachData;
        coachState.relation = clampRelation(coachState.relation ?? player.stats?.relationCoach ?? 50);
        if (player.stats) player.stats.relationCoach = coachState.relation;
        const hasTransferred = coachState.hasLeftClub || (state.social?.youthClubName && player.club !== state.social.youthClubName);
        if (Math.random() >= 0.42) return null;

        const candidates = [];
        if (!hasTransferred) {
            candidates.push({
                id:'coach_role_detail', title:`🧠 ${coachState.name} vous arrête après la séance`,
                description:`${coachState.name} ne parle pas de votre niveau général. Il revient sur un détail : vos déplacements sans ballon et ce qu'ils provoquent chez les autres.`,
                choices:[
                    {text:'Lui demander ce qu’il veut voir précisément',impacts:{mental:2,relationCoach:7},opinionChange:'Fier',response:'Il prend le temps de vous montrer deux situations concrètes sur la tablette.'},
                    {text:'Dire que vous préférez jouer à l’instinct',impacts:{charisme:1,relationCoach:-5},opinionChange:'Neutre',response:'Il accepte l’idée, mais vous rappelle que l’instinct se prépare aussi.'},
                    {text:'Promettre de travailler ce point dès demain',impacts:{discipline:3,relationCoach:5},opinionChange:'Satisfait',response:'Il acquiesce : il vérifiera surtout vos actes.'}
                ]
            });
            candidates.push({
                id:'coach_competition_place', title:`👀 Un mot de ${coachState.name} sur votre place`,
                description:`À la fin de la séance, ${coachState.name} vous parle de la concurrence à votre poste. Il ne promet rien, mais veut savoir comment vous vivez la situation.`,
                choices:[
                    {text:'Dire que la concurrence vous pousse',impacts:{mental:3,relationCoach:6},opinionChange:'Fier',response:'Il apprécie que vous transformiez la concurrence en énergie.'},
                    {text:'Demander plus de temps de jeu',impacts:{charisme:2,relationCoach:-2,morale:2},opinionChange:'Neutre',response:'Il entend la demande, sans vous donner de garantie.'},
                    {text:'Dire que vous méritez déjà d’être titulaire',impacts:{charisme:3,relationCoach:-9,discipline:-2},opinionChange:'Déçu',response:'Son regard se ferme : il veut des preuves sur le terrain, pas une déclaration.'}
                ]
            });
            if (Number(player.fitness ?? 100) < 68) candidates.push({
                id:'coach_fatigue_warning', title:`💬 ${coachState.name} remarque votre fatigue`,
                description:`Pendant le retour au calme, ${coachState.name} voit que vos appuis sont moins nets. Il vous propose d’alléger une partie du travail.`,
                choices:[
                    {text:'Accepter et récupérer',impacts:{fitness:12,relationCoach:8,morale:2},opinionChange:'Fier',response:'Il préfère vous revoir frais que courageux pour rien.'},
                    {text:'Finir la séance normalement',impacts:{mental:2,fitness:-3,relationCoach:0},opinionChange:'Neutre',response:'Il vous laisse faire, mais garde un œil sur vos sensations.'},
                    {text:'Insister pour en rajouter',impacts:{morale:3,fitness:-6,relationCoach:-5},opinionChange:'Déçu',response:'Il vous coupe : travailler plus n’est pas toujours travailler mieux.'}
                ]
            });
            if (coachState.relation >= 65) candidates.push({
                id:'coach_trust', title:`🤝 ${coachState.name} vous confie quelque chose`,
                description:`La relation a changé. ${coachState.name} vous demande désormais d’aider à faire passer une consigne au groupe avant le prochain match.`,
                choices:[
                    {text:'Accepter sans en faire trop',impacts:{charisme:2,vestiaire:2,relationCoach:6},opinionChange:'Fier',response:'Il vous confie la responsabilité sans discours supplémentaire.'},
                    {text:'Dire que vous préférez vous concentrer sur votre jeu',impacts:{mental:2,relationCoach:-2},opinionChange:'Neutre',response:'Il respecte votre réponse, mais note que vous n’êtes pas encore prêt à porter ce rôle.'}
                ]
            });
            if (origin.includes('futsal')) candidates.push({
                id:'coach_origin_futsal', title:`⚽ ${coachState.name} parle de vos réflexes futsal`,
                description:`Sur grand terrain, ${coachState.name} aime votre vitesse d’exécution mais veut que vous choisissiez mieux les moments où jouer en une touche.`,
                choices:[
                    {text:'Travailler la lecture avant la réception',impacts:{technique:2,mental:2,relationCoach:7},opinionChange:'Fier',response:'Il vous montre comment conserver votre vitesse sans précipiter la décision.'},
                    {text:'Assumer votre jeu très rapide',impacts:{charisme:2,relationCoach:-3},opinionChange:'Neutre',response:'Il ne veut pas enlever votre identité, seulement lui donner un cadre.'}
                ]
            });
            if (origin.includes('street') || origin.includes('rue') || origin.includes('quartier')) candidates.push({
                id:'coach_origin_street', title:`🔥 ${coachState.name} veut canaliser votre jeu de rue`,
                description:`Il aime votre capacité à provoquer, mais vous demande de reconnaître les moments où le duel sert réellement l’équipe.`,
                choices:[
                    {text:'Demander où prendre davantage de risques',impacts:{technique:2,mental:2,relationCoach:7},opinionChange:'Fier',response:'Il vous répond avec deux zones du terrain où votre audace peut faire mal.'},
                    {text:'Dire que provoquer fait partie de votre identité',impacts:{charisme:2,relationCoach:-2},opinionChange:'Neutre',response:'Il sourit à moitié : il ne veut pas vous lisser, juste vous rendre plus efficace.'}
                ]
            });
        } else {
            candidates.push({
                id:'coach_post_transfer', title:`📱 Un message de ${coachState.name}`,
                description:`Après votre départ, ${coachState.name} vous écrit après avoir vu quelques images de votre nouveau club. Son message est bref, mais personnel.`,
                choices:[
                    {text:'Le remercier pour ce qu’il vous a appris',impacts:{relationCoach:10,morale:4},opinionChange:'Fier',response:'Il vous répond qu’il continuera à suivre votre route.'},
                    {text:'Lui dire que vous aviez besoin de partir',impacts:{mental:3,relationCoach:1},opinionChange:'Neutre',response:'Il comprend. Certaines relations restent fortes même quand les chemins se séparent.'},
                    {text:'Ne pas répondre',impacts:{relationCoach:-12},opinionChange:'Déçu',response:'Le message reste sans réponse et le lien se refroidit.'}
                ]
            });
        }
        return pickFresh(state, candidates);
    }

    static resolveCoachChoice(state, choiceIndex, eventData) {
        if (!state?.player || !eventData?.choices?.[choiceIndex]) return null;
        const choice = eventData.choices[choiceIndex];
        const coachState = state.social?.coachData;
        const result = ConsequenceSystem.applyCoachChoice(state, choice);
        if (choice.opinionChange && coachState) coachState.opinion = choice.opinionChange;
        if (coachState) {
            coachState.relation = clampRelation(coachState.relation ?? state.player.stats?.relationCoach ?? 50);
            state.player.stats ||= {};
            state.player.stats.relationCoach = coachState.relation;
        }
        const memory = enrichCoachMemory(state, { result, eventData, choice, coachState });
        EventBus.emit(EVENTS.RELATIONSHIP_CHANGED, { state, relation: 'coach', score: coachState?.relation ?? null, playerId: state.player.id });
        EventBus.emit(EVENTS.RELATIONSHIP_ADVICE, { state, relation: 'coach', advice: choice.opinionChange || choice.response || null, playerId: state.player.id });
        return { ...result, responseText: choice.response || result.responseText, relationshipHint: choice.opinionChange || 'Le coach garde votre réponse en tête.', newRelation: coachState?.relation ?? 50, newOpinion: coachState?.opinion || 'Neutre', memoryId: memory?.id || null };
    }

    static getCoachData(state) {
        if (!state?.social) return null;
        const coachState = state.social.coachData || { name: state.social.formativeCoach || "l'entraîneur", relation: state.player?.stats?.relationCoach ?? 50, opinion: 'Neutre', hasLeftClub: false };
        let relationshipStatus = 'Neutre';
        if (coachState.relation >= 75) relationshipStatus = 'Fier / Excellent';
        else if (coachState.relation >= 60) relationshipStatus = 'Satisfait';
        else if (coachState.relation <= 30) relationshipStatus = 'Fâché / Déçu';
        return { name: coachState.name, vision: state.social.coachVision || 'Équilibré', relationshipScore: coachState.relation, relationshipStatus, opinion: coachState.opinion };
    }
}
export default CoachSystem;
