// domain/coach/coachSystem.js

import { ConsequenceSystem } from '../decision/consequenceSystem.js';
import { EventBus } from '../../core/eventBus.js';
import { EVENTS } from '../../core/events.js';
import { COACH_COPY, stableCareerPick } from '../narrative/careerLifeNarrativeLibrary.js';

const clampRelation = value => Math.min(100, Math.max(0, Number(value ?? 50)));
const recentCoachEventIds = state => (state?.careerMemory || []).filter(item => item?.type === 'coach-choice' || item?.source === 'Coach').slice(-4).map(item => item.eventId).filter(Boolean);
const YOUTH_CONTEXT = /\bu\s?(?:15|16|17|18|19|20|21|23)\b|youth|jeune|academy|acad[eé]mie|formation|r[eé]serve|espoirs?/i;
const PRO_CONTEXT = /professional|professionnel|\bpro\b|first.?team|premi[eè]re.?[eé]quipe|\bsenior\b/i;

export const YOUTH_COACH_PHASES = Object.freeze({
    OBSERVING:'observing',
    NOTICED:'noticed',
    DEVELOPING:'developing',
    MENTOR:'mentor'
});

const YOUTH_COACH_COPY = Object.freeze({
    attention:[
        "À l’entraînement, le coach pose un peu plus souvent les yeux sur toi.",
        "Depuis quelques séances, tu remarques que le coach te regarde un peu plus longtemps.",
        "Le coach suit ton exercice de près. Il ne dit rien pour l’instant."
    ],
    touch:[
        "Ta première touche plaît au coach. Il te le fait comprendre d’un simple signe.",
        "Sur un exercice, ton toucher de balle attire le regard du coach.",
        "Tu réussis plusieurs contrôles propres. Le coach continue de te regarder."
    ],
    effort:[
        "Le coach remarque ton sérieux aujourd’hui. Un petit signe de tête suffit.",
        "Tu ne lâches pas la séance. Le coach le voit.",
        "À la fin d’un exercice, le coach te glisse simplement : « Continue comme ça. »"
    ],
    noticed:[
        "Après la séance, le coach t’arrête une seconde. « Tu as quelque chose. Continue comme ça. »",
        "Il te regarde finir l’exercice puis vient vers toi. « Garde ça. C’est intéressant. »",
        "Cette fois, il ne se contente pas de regarder. « Il y a un petit truc chez toi. À toi de le faire grandir. »"
    ],
    developing:[
        "Avant l’exercice, le coach vient directement te parler. Il veut voir si tu continues sur la même lancée.",
        "Il te garde deux minutes après la séance. Pas pour tout corriger : juste pour t’aider sur un détail.",
        "Le coach commence à venir vers toi sans attendre une erreur. Il suit vraiment ta progression."
    ],
    mentor:[
        "Le coach vient te voir avant les autres. « Si quelque chose te bloque, tu viens me parler. »",
        "Avec le temps, il ne fait plus que t’observer. Il te suit vraiment, séance après séance.",
        "Après l’entraînement, il t’attend quelques secondes. « On va continuer à travailler ensemble. »"
    ],
    tension:[
        "Le coach te parle moins qu’avant. Son regard passe plus vite sur toi.",
        "Tu sens un peu de distance avec le coach ces derniers jours.",
        "À l’entraînement, le coach reste plus froid avec toi. Tu le remarques tout de suite."
    ],
    fatigue:[
        "Le coach voit que tes jambes sont lourdes et vient te demander si ça va.",
        "Tu tires un peu sur les jambes. Le coach le remarque avant la fin de la séance.",
        "Le coach te fait souffler quelques minutes. Il a vu que tu étais fatigué."
    ]
});

function seedFor(state) { return state?.narrativeState?.seed || state?.career?.seed || state?.player?.id || 'coach'; }
function coachLine(state, key, pool) { return stableCareerPick(seedFor(state), `${state?.calendar?.currentSeasonYear || 0}:${state?.calendar?.currentMonth || 0}:${key}`, pool); }

function isYouthCoachContext(state = {}) {
    const player = state.player || {};
    const age = Number(player.age || 0);
    const labels = [player.careerStage,player.stage,player.squadStatus,player.squad,player.teamStatus,player.contract?.type,player.contractType,state.career?.stage,state.careerStage].filter(Boolean).join(' ');
    if (PRO_CONTEXT.test(labels)) return false;
    if (YOUTH_CONTEXT.test(labels)) return true;
    return age > 0 && age <= 18;
}

function ensureYouthCoachArc(coachState = {}) {
    coachState.youthPhase ||= YOUTH_COACH_PHASES.OBSERVING;
    coachState.youthInteractionCount = Math.max(0, Number(coachState.youthInteractionCount || 0));
    coachState.seasonsTogether = Math.max(1, Number(coachState.seasonsTogether || 1));
    coachState.noticedTrait ||= null;
    coachState.mentorSinceSeason ||= null;
    return coachState;
}

function youthEvent(coachState, event) {
    return { ...event, youthCoach:true, coachPhase:coachState.youthPhase };
}

function noticedTraitFor(eventData = {}) {
    const id = String(eventData.id || '');
    if (id.includes('touch')) return 'touch';
    if (id.includes('effort')) return 'seriousness';
    if (id.includes('fatigue')) return 'honesty';
    return 'instinct';
}

function phaseTransitionCopy(phase, coachName) {
    if (phase === YOUTH_COACH_PHASES.NOTICED) return `${coachName} ne te regarde plus comme un joueur parmi les autres. Il a repéré quelque chose.`;
    if (phase === YOUTH_COACH_PHASES.DEVELOPING) return `${coachName} commence à suivre ta progression plus personnellement.`;
    if (phase === YOUTH_COACH_PHASES.MENTOR) return `${coachName} te prend vraiment sous son aile.`;
    return '';
}

function advanceYouthCoachArc(state, coachState, eventData) {
    if (!eventData?.youthCoach) return null;
    ensureYouthCoachArc(coachState);
    coachState.youthInteractionCount += 1;
    if (!coachState.noticedTrait) coachState.noticedTrait = noticedTraitFor(eventData);
    const count = coachState.youthInteractionCount, relation = clampRelation(coachState.relation), seasons = Math.max(1, Number(coachState.seasonsTogether || 1));
    const previous = coachState.youthPhase;
    if (previous === YOUTH_COACH_PHASES.OBSERVING && count >= 2 && relation >= 55) coachState.youthPhase = YOUTH_COACH_PHASES.NOTICED;
    else if (previous === YOUTH_COACH_PHASES.NOTICED && count >= 4 && relation >= 64) coachState.youthPhase = YOUTH_COACH_PHASES.DEVELOPING;
    else if (previous === YOUTH_COACH_PHASES.DEVELOPING && count >= 6 && relation >= 72 && seasons >= 2) {
        coachState.youthPhase = YOUTH_COACH_PHASES.MENTOR;
        coachState.mentorSinceSeason = state.calendar?.currentSeasonYear || null;
    }
    if (coachState.youthPhase === previous) return null;
    return { from:previous, to:coachState.youthPhase, text:phaseTransitionCopy(coachState.youthPhase, coachState.name || 'Le coach') };
}

function youthCoachCandidates(state, coachState) {
    ensureYouthCoachArc(coachState);
    const player = state.player || {}, phase = coachState.youthPhase;
    const candidates = [];

    if (phase === YOUTH_COACH_PHASES.OBSERVING) {
        candidates.push(
            youthEvent(coachState,{id:'coach_youth_attention',title:`👀 ${coachState.name} te remarque davantage`,description:coachLine(state,'youth-attention',YOUTH_COACH_COPY.attention),choices:[
                {text:'Continuer simplement',impacts:{mental:1,relationCoach:4},opinionChange:'Satisfait',response:'Tu continues sans chercher à en faire plus. Il garde un œil sur toi.'},
                {text:'Lui demander ce qu’il a remarqué',impacts:{mental:2,relationCoach:6},opinionChange:'Fier',response:'Il sourit : « Continue. Je regarde. »'}
            ]}),
            youthEvent(coachState,{id:'coach_youth_touch',title:`⚽ Ton ballon plaît à ${coachState.name}`,description:coachLine(state,'youth-touch',YOUTH_COACH_COPY.touch),choices:[
                {text:'Rester naturel',impacts:{technique:1,relationCoach:4},opinionChange:'Satisfait',response:'Tu gardes ton jeu simple. Il apprécie.'},
                {text:'Lui demander un conseil',impacts:{technique:2,mental:1,relationCoach:6},opinionChange:'Fier',response:'Il te donne un conseil très court, puis te renvoie jouer.'}
            ]}),
            youthEvent(coachState,{id:'coach_youth_effort',title:`👍 ${coachState.name} voit tes efforts`,description:coachLine(state,'youth-effort',YOUTH_COACH_COPY.effort),choices:[
                {text:'Continuer comme ça',impacts:{discipline:2,relationCoach:5},opinionChange:'Satisfait',response:'Tu repars dans l’exercice. Il n’a pas besoin d’en dire plus.'},
                {text:'Lui dire que tu veux progresser',impacts:{mental:2,relationCoach:6},opinionChange:'Fier',response:'« Alors garde cette envie. »'}
            ]})
        );
    } else if (phase === YOUTH_COACH_PHASES.NOTICED) {
        candidates.push(
            youthEvent(coachState,{id:'coach_youth_noticed',title:`👀 ${coachState.name} a repéré quelque chose`,description:coachLine(state,'youth-noticed',YOUTH_COACH_COPY.noticed),choices:[
                {text:'L’écouter',impacts:{mental:2,relationCoach:6},opinionChange:'Fier',response:'Tu hoches la tête. Il te laisse repartir avec cette phrase en tête.'},
                {text:'Lui demander ce qu’il voit',impacts:{mental:2,technique:1,relationCoach:7},opinionChange:'Fier',response:'Il reste simple : « Tu as de la personnalité avec le ballon. Ne la perds pas. »'}
            ]}),
            youthEvent(coachState,{id:'coach_youth_touch_followup',title:`⚽ ${coachState.name} revient vers toi`,description:'Il te regarde réussir deux gestes simples, puis te fait signe de continuer exactement comme ça.',choices:[
                {text:'Continuer sans forcer',impacts:{technique:1,relationCoach:5},opinionChange:'Satisfait',response:'Tu reprends l’exercice. Son regard reste sur toi un peu plus longtemps.'},
                {text:'Lui demander si tu progresses',impacts:{mental:2,relationCoach:6},opinionChange:'Fier',response:'« Oui. Continue surtout à rester toi-même. »'}
            ]})
        );
    } else if (phase === YOUTH_COACH_PHASES.DEVELOPING) {
        candidates.push(
            youthEvent(coachState,{id:'coach_youth_developing',title:`🤝 ${coachState.name} te suit de plus près`,description:coachLine(state,'youth-developing',YOUTH_COACH_COPY.developing),choices:[
                {text:'Prendre le conseil',impacts:{mental:2,technique:1,relationCoach:6},opinionChange:'Fier',response:'La discussion dure à peine deux minutes. Mais elle est vraiment pour toi.'},
                {text:'Lui dire ce que tu veux améliorer',impacts:{mental:3,relationCoach:7},opinionChange:'Fier',response:'Il écoute jusqu’au bout. « D’accord. On va suivre ça. »'}
            ]}),
            youthEvent(coachState,{id:'coach_youth_personal_check',title:`💬 ${coachState.name} vient prendre de tes nouvelles`,description:'Avant la séance, il te demande simplement comment tu te sens en ce moment.',choices:[
                {text:'Lui répondre franchement',impacts:{morale:2,relationCoach:7},opinionChange:'Fier',response:'Il écoute sans transformer la discussion en leçon.'},
                {text:'Dire que tout va bien',impacts:{mental:1,relationCoach:3},opinionChange:'Satisfait',response:'Il acquiesce et te laisse rejoindre le groupe.'}
            ]})
        );
    } else {
        candidates.push(
            youthEvent(coachState,{id:'coach_youth_mentor',title:`🤝 ${coachState.name} est devenu un vrai repère`,description:coachLine(state,'youth-mentor',YOUTH_COACH_COPY.mentor),choices:[
                {text:'Lui dire que tu lui fais confiance',impacts:{morale:3,relationCoach:7},opinionChange:'Fier',response:'Il ne fait pas de grand discours. « Très bien. On continue. »'},
                {text:'Lui parler de ce qui te préoccupe',impacts:{mental:3,morale:2,relationCoach:8},opinionChange:'Fier',response:'Il prend le temps de t’écouter avant que la séance commence.'}
            ]}),
            youthEvent(coachState,{id:'coach_youth_mentor_followup',title:`👤 ${coachState.name} te garde près de lui après la séance`,description:'Les autres rentrent. Il reste deux minutes avec toi pour savoir comment tu vis ta saison.',choices:[
                {text:'Lui parler de ta saison',impacts:{mental:2,relationCoach:7},opinionChange:'Fier',response:'Il écoute. Cette fois, la discussion dépasse l’exercice du jour.'},
                {text:'Le remercier',impacts:{morale:2,relationCoach:6},opinionChange:'Fier',response:'Il sourit : « Tu feras pareil pour quelqu’un un jour. »'}
            ]})
        );
    }

    if (Number(player.fitness ?? 100) < 68) candidates.push(youthEvent(coachState,{
        id:'coach_youth_fatigue',title:`💬 ${coachState.name} vient te voir`,description:coachLine(state,'youth-fatigue',YOUTH_COACH_COPY.fatigue),choices:[
            {text:'Dire que tu es fatigué',impacts:{fitness:10,relationCoach:7},opinionChange:'Fier',response:'Il te fait souffler. « C’est bien de me le dire. »'},
            {text:'Dire que ça va',impacts:{mental:1,fitness:-2,relationCoach:0},opinionChange:'Neutre',response:'Il te laisse continuer, mais garde un œil sur toi.'}
        ]
    }));
    if (coachState.relation <= 40) candidates.push(youthEvent(coachState,{
        id:'coach_youth_distance',title:`↔️ ${coachState.name} est plus distant`,description:coachLine(state,'youth-tension',YOUTH_COACH_COPY.tension),choices:[
            {text:'Aller lui parler',impacts:{mental:2,relationCoach:6},opinionChange:'Neutre',response:'La discussion est courte, mais le contact revient un peu.'},
            {text:'Rester dans ta séance',impacts:{discipline:1,relationCoach:-2},opinionChange:'Neutre',response:'Tu continues à travailler. Le froid reste là pour l’instant.'}
        ]
    }));
    return candidates;
}

function enrichCoachMemory(state, { result, eventData, choice, coachState }) {
    const memory = state.careerMemory?.findLast?.(item => item?.choiceId === result?.choiceId && item?.source === 'Coach')
        || [...(state.careerMemory || [])].reverse().find(item => item?.choiceId === result?.choiceId && item?.source === 'Coach');
    if (!memory) return null;
    memory.type = 'coach-choice';memory.eventId = eventData?.id || null;memory.coachName = coachState?.name || state.social?.formativeCoach || "l'entraîneur";memory.eventTitle = eventData?.title || null;memory.eventDescription = eventData?.description || null;memory.choiceText = choice?.text || memory.text || null;memory.responseText = choice?.response || memory.immediateReaction || null;memory.opinion = coachState?.opinion || choice?.opinionChange || 'Neutre';memory.relationAtChoice = clampRelation(coachState?.relation ?? state.player?.stats?.relationCoach ?? 50);memory.relationIntent = Number(choice?.impacts?.relationCoach || choice?.consequences?.emotional?.relationCoach || 0);memory.coachPhase = coachState?.youthPhase || null;
    return memory;
}

function pickFresh(state, candidates) {
    const recent = new Set(recentCoachEventIds(state));const fresh = candidates.filter(event => !recent.has(event.id));const pool = fresh.length ? fresh : candidates;if (!pool.length) return null;const seed = seedFor(state);const key = `${state?.calendar?.currentSeasonYear || 0}:${state?.calendar?.currentMonth || 0}:coach-scene:${pool.map(item => item.id).join('|')}`;return stableCareerPick(seed, key, pool);
}

export class CoachSystem {
    static checkCoachInteraction(state) {
        if (!state?.player) return null;
        const player = state.player;const coachName = state.social?.coachData?.name || state.social?.formativeCoach || "l'entraîneur";const rawOrigin = player.origin || state.selectedData?.origin || 'academy';const origin = typeof rawOrigin === 'string' ? rawOrigin.toLowerCase() : 'academy';
        state.social ||= {};state.social.coachData ||= { name:coachName,relation:player.stats?.relationCoach || 50,opinion:'Neutre',hasLeftClub:false,seasonsTogether:1,youthPhase:YOUTH_COACH_PHASES.OBSERVING,youthInteractionCount:0 };
        const coachState = state.social.coachData;coachState.relation = clampRelation(coachState.relation ?? player.stats?.relationCoach ?? 50);if (player.stats) player.stats.relationCoach = coachState.relation;
        const hasTransferred = coachState.hasLeftClub || (state.social?.youthClubName && player.club !== state.social.youthClubName);
        if (Math.random() >= 0.42) return null;
        if (!hasTransferred && isYouthCoachContext(state)) { ensureYouthCoachArc(coachState);return pickFresh(state, youthCoachCandidates(state, coachState)); }

        const candidates = [];
        if (!hasTransferred) {
            candidates.push({id:'coach_role_detail',title:`🧠 ${coachState.name} te retient après la séance`,description:coachLine(state,'role',COACH_COPY.role),choices:[
                {text:'Lui demander ce qu’il veut voir précisément',impacts:{mental:2,relationCoach:7},opinionChange:'Fier',response:'Il prend le temps de te montrer deux situations concrètes. « Je ne veux pas moins de personnalité. Je veux que tu voies plus tôt. »'},
                {text:'Dire que tu préfères jouer à l’instinct',impacts:{charisme:1,relationCoach:-5},opinionChange:'Neutre',response:'Il accepte l’idée, puis répond : « L’instinct, ça se prépare aussi. »'},
                {text:'Promettre de travailler ce point dès demain',impacts:{discipline:3,relationCoach:5},opinionChange:'Satisfait',response:'Il acquiesce. « Ne me le promets pas. Montre-le-moi. »'}
            ]});
            candidates.push({id:'coach_competition_place',title:`👀 ${coachState.name} parle de ta place`,description:coachLine(state,'competition',COACH_COPY.competition),choices:[
                {text:'Dire que la concurrence te pousse',impacts:{mental:3,relationCoach:6},opinionChange:'Fier',response:'Il apprécie la réponse. « Alors utilise-la. Une hiérarchie n’est jamais complètement figée. »'},
                {text:'Demander clairement plus de temps de jeu',impacts:{charisme:2,relationCoach:-2,morale:2},opinionChange:'Neutre',response:'Il ne fuit pas la demande. « Je t’ai entendu. Maintenant donne-moi une raison simple de changer. »'},
                {text:'Dire que tu mérites déjà d’être titulaire',impacts:{charisme:3,relationCoach:-9,discipline:-2},opinionChange:'Déçu',response:'Son regard se ferme légèrement. « Mériter, ça se prouve tous les jours. Pas dans mon bureau. »'}
            ]});
            if (Number(player.fitness ?? 100) < 68) candidates.push({id:'coach_fatigue_warning',title:`💬 ${coachState.name} remarque ta fatigue`,description:coachLine(state,'fatigue',COACH_COPY.fatigue),choices:[
                {text:'Accepter et récupérer',impacts:{fitness:12,relationCoach:8,morale:2},opinionChange:'Fier',response:'« Bien. Je préfère te revoir frais que courageux pour rien. »'},
                {text:'Finir la séance normalement',impacts:{mental:2,fitness:-3,relationCoach:0},opinionChange:'Neutre',response:'Il te laisse finir, mais garde un œil sur tes appuis jusqu’à la dernière répétition.'},
                {text:'Insister pour en rajouter',impacts:{morale:3,fitness:-6,relationCoach:-5},opinionChange:'Déçu',response:'Il te coupe net. « Travailler plus n’est pas toujours travailler mieux. »'}
            ]});
            if (coachState.relation >= 65) candidates.push({id:'coach_trust',title:`🤝 ${coachState.name} te confie davantage`,description:coachLine(state,'trust',COACH_COPY.trust),choices:[
                {text:'Accepter sans en faire trop',impacts:{charisme:2,vestiaire:2,relationCoach:6},opinionChange:'Fier',response:'Il te confie la responsabilité sans grand discours. Le simple fait qu’il te l’ait demandé suffit.'},
                {text:'Dire que tu préfères te concentrer sur ton jeu',impacts:{mental:2,relationCoach:-2},opinionChange:'Neutre',response:'Il respecte ta réponse. « D’accord. Mais un jour, ton rôle dépassera peut-être ce que tu fais avec le ballon. »'}
            ]});
            if (coachState.relation <= 40) candidates.push({id:'coach_tension',title:`⚠️ La relation avec ${coachState.name} se tend`,description:coachLine(state,'tension',COACH_COPY.tension),choices:[
                {text:'Reconnaître que la frustration t’a fait sortir du cadre',impacts:{mental:2,relationCoach:7,discipline:2},opinionChange:'Neutre',response:'Le coach ne cherche pas une excuse parfaite. Le fait que tu reconnaisses le problème suffit à rouvrir la discussion.'},
                {text:'Lui demander ce qu’il attend concrètement de toi',impacts:{mental:2,relationCoach:4},opinionChange:'Neutre',response:'La conversation revient enfin au terrain. Il te donne deux attentes précises pour les prochaines semaines.'},
                {text:'Dire que tu n’es pas d’accord avec sa gestion',impacts:{charisme:3,relationCoach:-8},opinionChange:'Déçu',response:'Il accepte que tu sois en désaccord, mais le ton refroidit encore la relation. « Très bien. Maintenant il faudra vivre avec ce désaccord. »'}
            ]});
            if (origin.includes('futsal')) candidates.push({id:'coach_origin_futsal',title:`⚽ ${coachState.name} revient sur un automatisme`,description:`Sur une séquence en espace réduit, ${coachState.name} aime ta vitesse d’exécution. Il te demande seulement de reconnaître les moments où le grand terrain exige une touche de plus.`,choices:[
                {text:'Travailler la lecture avant la réception',impacts:{technique:2,mental:2,relationCoach:7},opinionChange:'Fier',response:'Il te montre comment conserver ta vitesse sans précipiter la décision. Le futsal reste une origine, pas une étiquette.'},
                {text:'Assumer ton jeu très rapide',impacts:{charisme:2,relationCoach:-3},opinionChange:'Neutre',response:'Il ne veut pas enlever ton identité. Il veut simplement que tu choisisses mieux quand l’utiliser.'}
            ]});
            if (origin.includes('street') || origin.includes('rue') || origin.includes('quartier')) candidates.push({id:'coach_origin_street',title:`🔥 ${coachState.name} parle de tes prises de risque`,description:`Il aime ta capacité à provoquer, mais te demande de reconnaître les moments où le duel sert réellement l’équipe et ceux où il ne sert que ton envie de gagner l’action.`,choices:[
                {text:'Demander où prendre davantage de risques',impacts:{technique:2,mental:2,relationCoach:7},opinionChange:'Fier',response:'Il te montre deux zones du terrain où ton audace peut faire mal sans déséquilibrer l’équipe.'},
                {text:'Dire que provoquer fait partie de ton identité',impacts:{charisme:2,relationCoach:-2},opinionChange:'Neutre',response:'Il sourit à moitié. « Je ne veux pas te lisser. Je veux te rendre plus efficace. »'}
            ]});
        } else {
            candidates.push({id:'coach_post_transfer',title:`📱 Un message de ${coachState.name}`,description:coachLine(state,'old-coach',COACH_COPY.oldCoach),choices:[
                {text:'Le remercier pour ce qu’il t’a appris',impacts:{relationCoach:10,morale:4},opinionChange:'Fier',response:'Il te répond qu’il continuera à suivre ta route, même de loin.'},
                {text:'Lui dire que tu avais besoin de partir',impacts:{mental:3,relationCoach:1},opinionChange:'Neutre',response:'Il comprend. Certaines relations restent fortes précisément parce que les chemins ont fini par se séparer.'},
                {text:'Ne pas répondre',impacts:{relationCoach:-12},opinionChange:'Déçu',response:'Le message reste sans réponse. Rien ne se casse brutalement, mais le lien refroidit.'}
            ]});
        }
        return pickFresh(state, candidates);
    }

    static resolveCoachChoice(state, choiceIndex, eventData) {
        if (!state?.player || !eventData?.choices?.[choiceIndex]) return null;
        const choice = eventData.choices[choiceIndex];const coachState = state.social?.coachData;const result = ConsequenceSystem.applyCoachChoice(state, choice);
        if (choice.opinionChange && coachState) coachState.opinion = choice.opinionChange;
        if (coachState) {
            state.player.stats ||= {};
            // La conséquence relationCoach écrit d'abord la stat canonique : le profil coach la relit ensuite.
            coachState.relation = clampRelation(state.player.stats.relationCoach ?? coachState.relation ?? 50);
            state.player.stats.relationCoach = coachState.relation;
        }
        const transition = coachState ? advanceYouthCoachArc(state, coachState, eventData) : null;
        const memory = enrichCoachMemory(state, { result, eventData, choice, coachState });
        const responseText = [choice.response || result.responseText, transition?.text].filter(Boolean).join(' ');
        EventBus.emit(EVENTS.RELATIONSHIP_CHANGED, { state, relation:'coach', score:coachState?.relation ?? null, playerId:state.player.id });
        EventBus.emit(EVENTS.RELATIONSHIP_ADVICE, { state, relation:'coach', advice:responseText || choice.opinionChange || null, playerId:state.player.id });
        return { ...result, responseText, relationshipHint:responseText || choice.opinionChange || 'Le coach garde ta réponse en tête.', newRelation:coachState?.relation ?? 50, newOpinion:coachState?.opinion || 'Neutre', coachPhase:coachState?.youthPhase || null, coachPhaseChanged:Boolean(transition), memoryId:memory?.id || null };
    }

    static getCoachData(state) {
        if (!state?.social) return null;
        const coachState = state.social.coachData || { name:state.social.formativeCoach || "l'entraîneur",relation:state.player?.stats?.relationCoach ?? 50,opinion:'Neutre',hasLeftClub:false };
        let relationshipStatus = 'Neutre';if (coachState.relation >= 75) relationshipStatus = 'Fier / Excellent';else if (coachState.relation >= 60) relationshipStatus = 'Satisfait';else if (coachState.relation <= 30) relationshipStatus = 'Fâché / Déçu';
        return { name:coachState.name,vision:state.social.coachVision || 'Équilibré',relationshipScore:coachState.relation,relationshipStatus,opinion:coachState.opinion,youthPhase:coachState.youthPhase || null,seasonsTogether:Number(coachState.seasonsTogether || 0),isMentor:coachState.youthPhase === YOUTH_COACH_PHASES.MENTOR };
    }
}
export default CoachSystem;
