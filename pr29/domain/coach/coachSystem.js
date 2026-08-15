// domain/coach/coachSystem.js

import { ConsequenceSystem } from '../decision/consequenceSystem.js';
import { EventBus } from '../../core/eventBus.js';
import { EVENTS } from '../../core/events.js';
import { COACH_COPY, stableCareerPick } from '../narrative/careerLifeNarrativeLibrary.js';

const clampRelation = value => Math.min(100, Math.max(0, Number(value ?? 50)));
const recentCoachEventIds = state => (state?.careerMemory || []).filter(item => item?.type === 'coach-choice' || item?.source === 'Coach').slice(-4).map(item => item.eventId).filter(Boolean);

function seedFor(state) { return state?.narrativeState?.seed || state?.career?.seed || state?.player?.id || 'coach'; }
function coachLine(state, key, pool) { return stableCareerPick(seedFor(state), `${state?.calendar?.currentSeason || 0}:${state?.calendar?.currentMonth || 0}:${key}`, pool); }

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
    if (!pool.length) return null;
    const seed = seedFor(state);
    const key = `${state?.calendar?.currentSeason || 0}:${state?.calendar?.currentMonth || 0}:coach-scene:${pool.map(item => item.id).join('|')}`;
    return stableCareerPick(seed, key, pool);
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
                id:'coach_role_detail', title:`🧠 ${coachState.name} te retient après la séance`,
                description:coachLine(state,'role',COACH_COPY.role),
                choices:[
                    {text:'Lui demander ce qu’il veut voir précisément',impacts:{mental:2,relationCoach:7},opinionChange:'Fier',response:'Il prend le temps de te montrer deux situations concrètes. « Je ne veux pas moins de personnalité. Je veux que tu voies plus tôt. »'},
                    {text:'Dire que tu préfères jouer à l’instinct',impacts:{charisme:1,relationCoach:-5},opinionChange:'Neutre',response:'Il accepte l’idée, puis répond : « L’instinct, ça se prépare aussi. »'},
                    {text:'Promettre de travailler ce point dès demain',impacts:{discipline:3,relationCoach:5},opinionChange:'Satisfait',response:'Il acquiesce. « Ne me le promets pas. Montre-le-moi. »'}
                ]
            });
            candidates.push({
                id:'coach_competition_place', title:`👀 ${coachState.name} parle de ta place`,
                description:coachLine(state,'competition',COACH_COPY.competition),
                choices:[
                    {text:'Dire que la concurrence te pousse',impacts:{mental:3,relationCoach:6},opinionChange:'Fier',response:'Il apprécie la réponse. « Alors utilise-la. Une hiérarchie n’est jamais complètement figée. »'},
                    {text:'Demander clairement plus de temps de jeu',impacts:{charisme:2,relationCoach:-2,morale:2},opinionChange:'Neutre',response:'Il ne fuit pas la demande. « Je t’ai entendu. Maintenant donne-moi une raison simple de changer. »'},
                    {text:'Dire que tu mérites déjà d’être titulaire',impacts:{charisme:3,relationCoach:-9,discipline:-2},opinionChange:'Déçu',response:'Son regard se ferme légèrement. « Mériter, ça se prouve tous les jours. Pas dans mon bureau. »'}
                ]
            });
            if (Number(player.fitness ?? 100) < 68) candidates.push({
                id:'coach_fatigue_warning', title:`💬 ${coachState.name} remarque ta fatigue`,
                description:coachLine(state,'fatigue',COACH_COPY.fatigue),
                choices:[
                    {text:'Accepter et récupérer',impacts:{fitness:12,relationCoach:8,morale:2},opinionChange:'Fier',response:'« Bien. Je préfère te revoir frais que courageux pour rien. »'},
                    {text:'Finir la séance normalement',impacts:{mental:2,fitness:-3,relationCoach:0},opinionChange:'Neutre',response:'Il te laisse finir, mais garde un œil sur tes appuis jusqu’à la dernière répétition.'},
                    {text:'Insister pour en rajouter',impacts:{morale:3,fitness:-6,relationCoach:-5},opinionChange:'Déçu',response:'Il te coupe net. « Travailler plus n’est pas toujours travailler mieux. »'}
                ]
            });
            if (coachState.relation >= 65) candidates.push({
                id:'coach_trust', title:`🤝 ${coachState.name} te confie davantage`,
                description:coachLine(state,'trust',COACH_COPY.trust),
                choices:[
                    {text:'Accepter sans en faire trop',impacts:{charisme:2,vestiaire:2,relationCoach:6},opinionChange:'Fier',response:'Il te confie la responsabilité sans grand discours. Le simple fait qu’il te l’ait demandé suffit.'},
                    {text:'Dire que tu préfères te concentrer sur ton jeu',impacts:{mental:2,relationCoach:-2},opinionChange:'Neutre',response:'Il respecte ta réponse. « D’accord. Mais un jour, ton rôle dépassera peut-être ce que tu fais avec le ballon. »'}
                ]
            });
            if (coachState.relation <= 40) candidates.push({
                id:'coach_tension', title:`⚠️ La relation avec ${coachState.name} se tend`,
                description:coachLine(state,'tension',COACH_COPY.tension),
                choices:[
                    {text:'Reconnaître que la frustration t’a fait sortir du cadre',impacts:{mental:2,relationCoach:7,discipline:2},opinionChange:'Neutre',response:'Le coach ne cherche pas une excuse parfaite. Le fait que tu reconnaisses le problème suffit à rouvrir la discussion.'},
                    {text:'Lui demander ce qu’il attend concrètement de toi',impacts:{mental:2,relationCoach:4},opinionChange:'Neutre',response:'La conversation revient enfin au terrain. Il te donne deux attentes précises pour les prochaines semaines.'},
                    {text:'Dire que tu n’es pas d’accord avec sa gestion',impacts:{charisme:3,relationCoach:-8},opinionChange:'Déçu',response:'Il accepte que tu sois en désaccord, mais le ton refroidit encore la relation. « Très bien. Maintenant il faudra vivre avec ce désaccord. »'}
                ]
            });
            if (origin.includes('futsal')) candidates.push({
                id:'coach_origin_futsal', title:`⚽ ${coachState.name} revient sur un automatisme`,
                description:`Sur une séquence en espace réduit, ${coachState.name} aime ta vitesse d’exécution. Il te demande seulement de reconnaître les moments où le grand terrain exige une touche de plus.`,
                choices:[
                    {text:'Travailler la lecture avant la réception',impacts:{technique:2,mental:2,relationCoach:7},opinionChange:'Fier',response:'Il te montre comment conserver ta vitesse sans précipiter la décision. Le futsal reste une origine, pas une étiquette.'},
                    {text:'Assumer ton jeu très rapide',impacts:{charisme:2,relationCoach:-3},opinionChange:'Neutre',response:'Il ne veut pas enlever ton identité. Il veut simplement que tu choisisses mieux quand l’utiliser.'}
                ]
            });
            if (origin.includes('street') || origin.includes('rue') || origin.includes('quartier')) candidates.push({
                id:'coach_origin_street', title:`🔥 ${coachState.name} parle de tes prises de risque`,
                description:`Il aime ta capacité à provoquer, mais te demande de reconnaître les moments où le duel sert réellement l’équipe et ceux où il ne sert que ton envie de gagner l’action.`,
                choices:[
                    {text:'Demander où prendre davantage de risques',impacts:{technique:2,mental:2,relationCoach:7},opinionChange:'Fier',response:'Il te montre deux zones du terrain où ton audace peut faire mal sans déséquilibrer l’équipe.'},
                    {text:'Dire que provoquer fait partie de ton identité',impacts:{charisme:2,relationCoach:-2},opinionChange:'Neutre',response:'Il sourit à moitié. « Je ne veux pas te lisser. Je veux te rendre plus efficace. »'}
                ]
            });
        } else {
            candidates.push({
                id:'coach_post_transfer', title:`📱 Un message de ${coachState.name}`,
                description:coachLine(state,'old-coach',COACH_COPY.oldCoach),
                choices:[
                    {text:'Le remercier pour ce qu’il t’a appris',impacts:{relationCoach:10,morale:4},opinionChange:'Fier',response:'Il te répond qu’il continuera à suivre ta route, même de loin.'},
                    {text:'Lui dire que tu avais besoin de partir',impacts:{mental:3,relationCoach:1},opinionChange:'Neutre',response:'Il comprend. Certaines relations restent fortes précisément parce que les chemins ont fini par se séparer.'},
                    {text:'Ne pas répondre',impacts:{relationCoach:-12},opinionChange:'Déçu',response:'Le message reste sans réponse. Rien ne se casse brutalement, mais le lien refroidit.'}
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
        EventBus.emit(EVENTS.RELATIONSHIP_ADVICE, { state, relation: 'coach', advice: choice.response || choice.opinionChange || null, playerId: state.player.id });
        return { ...result, responseText: choice.response || result.responseText, relationshipHint: choice.response || choice.opinionChange || 'Le coach garde ta réponse en tête.', newRelation: coachState?.relation ?? 50, newOpinion: coachState?.opinion || 'Neutre', memoryId: memory?.id || null };
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
