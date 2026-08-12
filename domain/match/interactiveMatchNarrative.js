// Compose les étapes présentables d'un match jouable. Ce module ne modifie pas le State.
import { MATCH_COPY, contextualFlow, stablePick } from './matchNarrativeLibrary.js';
import { decisionNarration } from './matchDecisionNarration.js';
import { decisionOutcomeText } from './matchDecisionOutcomeText.js';

const scoreSnapshot = session => ({ home: Number(session?.score?.home) || 0, away: Number(session?.score?.away) || 0 });

function stableNumber(seed, min, max) {
    const text = String(seed || 'match');
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return min + ((hash >>> 0) % Math.max(1, max - min + 1));
}

function step(session, values = {}) {
    return {
        id: `${session.id}:${values.phase}`,
        phase: values.phase,
        kind: values.kind || 'narration',
        label: values.label || 'MATCH',
        progress: Number(values.progress) || 0,
        minute: values.minute ?? null,
        title: values.title || '',
        text: values.text || '',
        team: session.team,
        opponent: session.opponent,
        competition: session.competition,
        home: session.home,
        score: scoreSnapshot(session),
        choices: values.choices || [],
        items: values.items || [],
        // Une scène narrative n'avance jamais seule. Seules les décisions explicitement
        // marquées timedDecision peuvent expirer dans l'UI.
        timedDecision: values.timedDecision || null,
        actionLabel: values.actionLabel || 'Continuer'
    };
}

function contextText(session = {}) {
    return [
        session.level,
        session.competition,
        session.match?.competitionName,
        session.match?.competition,
        session.match?.ageCategory,
        session.match?.category,
        session.match?.level,
        session.match?.division
    ].filter(Boolean).join(' ').toLowerCase();
}

function playerAge(session = {}) {
    return Number(
        session.playerAge ??
        session.match?.playerAge ??
        session.match?.age ??
        session.match?.player?.age ??
        0
    ) || 0;
}

function careerTier(session = {}) {
    const age = playerAge(session);
    const text = contextText(session);
    if ((age && age <= 15) || /\bu ?15\b|moins de 15/.test(text)) return 'u15';
    if ((age && age <= 18) || /\bu ?1[678]\b|formation|academy|académie|jeune/.test(text)) return 'youth';
    if (/amateur|semi.?pro|régional|regional|national 2|national 3|district/.test(text)) return 'semi';
    return 'pro';
}

function stadiumCapacity(session = {}) {
    return Number(
        session.stadiumCapacity ??
        session.capacity ??
        session.match?.stadiumCapacity ??
        session.match?.capacity ??
        session.match?.stadium?.capacity ??
        0
    ) || 0;
}

function attendance(session = {}) {
    const capacity = stadiumCapacity(session);
    const known = Number(session.attendance ?? session.match?.attendance ?? 0);
    if (known > 0) return Math.max(1, Math.round(capacity > 0 ? Math.min(known, capacity) : known));

    const tier = careerTier(session);
    const special = session.type === 'rival' || session.type === 'final' || ['important', 'exceptional'].includes(session.importance);
    const ranges = {
        u15: special ? [70, 240] : [25, 130],
        youth: special ? [180, 1200] : [70, 480],
        semi: special ? [700, 6500] : [180, 2800],
        pro: special ? [18000, 62000] : [5000, 39000]
    };
    let [min, max] = ranges[tier];
    if (capacity > 0) {
        max = Math.min(max, capacity);
        min = Math.min(min, max);
    }

    const reputation = Number(session.clubReputation ?? session.match?.clubReputation ?? session.match?.reputation ?? 50);
    const base = stableNumber(`${session.match?.id || session.matchIndex || ''}:${session.opponent}:${session.competition}:${session.importance}`, min, max);
    const factor = Number.isFinite(reputation) ? Math.max(0.65, Math.min(1.15, 0.75 + reputation / 200)) : 1;
    const adjusted = Math.round(base * factor);
    return Math.max(1, capacity > 0 ? Math.min(adjusted, capacity) : adjusted);
}

function crowdText(session = {}) {
    const count = attendance(session);
    const tier = careerTier(session);
    const formatted = count.toLocaleString('fr-FR');
    if (tier === 'u15') return `${formatted} spectateurs entourent le terrain. On reconnaît surtout des familles, des éducateurs et quelques habitués du club.`;
    if (tier === 'youth') return `${formatted} personnes suivent la rencontre. Les familles se mêlent aux éducateurs et à quelques regards venus observer la génération.`;
    if (tier === 'semi') return `${formatted} spectateurs sont présents. Les habitués prennent place près de la main courante et dans la petite tribune.`;
    return `${formatted} spectateurs sont annoncés. Le bruit change à mesure que les deux équipes terminent leur échauffement.`;
}

function stakesText(session) {
    const crowd = crowdText(session);
    if (session.type === 'final') return `${crowd} Une finale face à ${session.opponent}. Dans les dernières minutes avant de sortir, les conversations deviennent plus courtes.`;
    if (session.type === 'rival') return `${crowd} Face à ${session.opponent}, les premiers duels semblent déjà avoir commencé pendant l’échauffement.`;
    if (session.importance === 'important' || session.importance === 'exceptional') return `${crowd} Ce rendez-vous contre ${session.opponent} peut modifier la dynamique de la saison.`;
    return crowd;
}

function matchSeed(session = {}) {
    return session.match?.id || `${session.matchIndex || 0}:${session.team}:${session.opponent}:${session.competition}`;
}

function positionNarrativeLabel(position) {
    const p = String(position || '').toUpperCase();
    if (['GK', 'GB', 'G'].includes(p)) return 'gardien';
    if (['DC', 'CB', 'DD', 'RB', 'DG', 'LB', 'D'].includes(p)) return 'défenseur';
    if (['MC', 'CM', 'MOC', 'CAM', 'MD', 'MG', 'M', 'MDC', 'CDM'].includes(p)) return 'milieu';
    if (['AD', 'RW', 'AG', 'LW'].includes(p)) return 'ailier';
    if (['BU', 'ST', 'AC', 'CF'].includes(p)) return 'attaquant';
    return position || null;
}

function memoryFromSession(session = {}) {
    const decisions = session.decisions || [];
    const events = session.events || [];
    const pressureMisses = decisions.filter(item => item?.timedOut).length;
    const technicalFailures = events.filter(item => /échoue|ne passe pas|perd le ballon|récupère|trop long/i.test(`${item?.title || ''} ${item?.text || ''}`)).length;
    const successfulDuels = events.filter(item => /duel|défense recule|gagne du terrain/i.test(`${item?.title || ''} ${item?.text || ''}`) && !/échoue|perd/i.test(item?.text || '')).length;
    return { pressureMisses, technicalFailures, defenderStress: successfulDuels >= 2 ? 0.5 : successfulDuels ? 0.25 : 0 };
}

function playerScore(session = {}) {
    return Number(session.score?.[session.home ? 'home' : 'away']) || 0;
}

function opponentScore(session = {}) {
    return Number(session.score?.[session.home ? 'away' : 'home']) || 0;
}

function confidenceValue(session = {}) {
    const raw = Number(session.playerConfidence ?? session.confidence ?? session.match?.playerConfidence ?? 50);
    return Number.isFinite(raw) ? raw : 50;
}

function fatigueValue(session = {}) {
    const raw = Number(session.playerFatigue ?? session.fatigue ?? session.match?.playerFatigue);
    if (Number.isFinite(raw)) return raw;
    return Math.max(0, Math.min(100, (Number(session.modifiers?.fatigue) || 0) * 11));
}

export function buildPreMatchStep(session) {
    return step(session, {
        phase: 'pre_match',
        label: 'AVANT-MATCH',
        progress: 4,
        title: `${session.team} · ${session.opponent}`,
        text: stakesText(session),
        actionLabel: 'Entrer sur la pelouse'
    });
}

export function buildKickoffStep(session) {
    const tier = careerTier(session);
    const opening = stablePick(matchSeed(session), 'kickoff', MATCH_COPY.opening);
    const venue = session.home
        ? (tier === 'u15' || tier === 'youth' ? 'Depuis le bord du terrain, les premières voix accompagnent chaque duel.' : 'Ton public réagit aux premières prises de balle.')
        : (tier === 'u15' || tier === 'youth' ? 'Quelques voix adverses se font entendre près de la main courante.' : 'Le public adverse réagit à chaque ballon récupéré par son équipe.');
    return step(session, {
        phase: 'kickoff',
        label: 'COUP D’ENVOI',
        progress: 10,
        minute: 0,
        title: 'Les premières secondes',
        text: `${venue} ${opening}`,
        actionLabel: 'Continuer'
    });
}

export function buildDecisionStep(session, decision, index) {
    const total = Math.max(1, session.moments?.length || 1);
    const narration = decisionNarration({
        minute: decision.minute,
        opponent: session.opponent,
        memory: memoryFromSession(session),
        index,
        position: positionNarrativeLabel(session.playerPosition || session.match?.playerPosition),
        age: playerAge(session),
        level: contextText(session),
        competition: session.competition,
        score: scoreSnapshot(session),
        home: session.home,
        confidence: confidenceValue(session),
        fatigue: fatigueValue(session),
        coachTrust: Number(session.coachTrust ?? session.match?.coachTrust ?? 50)
    });
    return step(session, {
        phase: `moment_${index + 1}`,
        kind: 'decision',
        label: `MOMENT ${index + 1}/${total}`,
        progress: Math.round(18 + ((index + 1) / (total + 1)) * 62),
        minute: decision.minute,
        title: decision.title,
        text: narration || decision.description,
        choices: decision.choices,
        timedDecision: decision.timedDecision || null,
        actionLabel: 'Choisir'
    });
}

function genericControllerCopy(text = '') {
    return /donne de l’air au collectif|déplace le rapport de force|imposes? ton choix dans l’impact|match absorbe ton choix|assumes? ta décision|initiative crée une situation dangereuse|prix de l’audace/i.test(text);
}

export function buildConsequenceStep(session, event, index) {
    const source = `${event?.title || ''} ${event?.text || ''}`;
    const failed = /échoue|ne passe pas|perd le ballon|récupère|fenêtre se referme/i.test(source);
    const duel = /duel/i.test(source);
    let text = event?.text || '';
    if (event?.timedOut || event?.gesture || duel) {
        text = decisionOutcomeText({
            gesture: event?.gesture || null,
            success: !failed,
            duel,
            timedOut: Boolean(event?.timedOut),
            minute: event?.minute,
            score: scoreSnapshot(session),
            home: session.home,
            position: positionNarrativeLabel(session.playerPosition || session.match?.playerPosition),
            confidence: confidenceValue(session)
        });
    } else if (!text || genericControllerCopy(text)) {
        text = stablePick(matchSeed(session), `consequence:${index}:${event?.minute || 0}`, failed ? MATCH_COPY.failure : MATCH_COPY.success);
    }
    return step(session, {
        phase: `consequence_${index + 1}`,
        label: 'CONSÉQUENCE',
        progress: Math.min(86, 28 + index * 13),
        minute: event.minute,
        title: event.title || (failed ? 'L’action se referme' : 'Tu gagnes un temps'),
        text,
        actionLabel: 'Continuer'
    });
}

export function buildContinuationStep(session) {
    const forGoals = playerScore(session);
    const againstGoals = opponentScore(session);
    const minute = session.moments?.[session.currentMoment] || 48;
    const text = contextualFlow({
        seed: matchSeed(session),
        key: `flow:${session.currentMoment}:${minute}:${forGoals}-${againstGoals}`,
        scoreFor: forGoals,
        scoreAgainst: againstGoals,
        confidence: confidenceValue(session),
        fatigue: fatigueValue(session)
    });
    const title = forGoals > againstGoals ? 'Ils doivent se découvrir' : forGoals < againstGoals ? 'Le temps prend du poids' : 'Le match reste ouvert';
    return step(session, {
        phase: 'match_continues',
        label: 'TEMPS DE JEU',
        progress: 52,
        minute,
        title,
        text,
        actionLabel: 'Continuer'
    });
}

const UNEXPECTED_CONTEXTS = [
    { id:'opponent_press', title:'Le pressing monte', text:'Leur première ligne avance d’un bloc. À chaque relance, tu as moins de temps pour contrôler et lever la tête.', effects:{rating:-.04,fatigue:2,opponentThreat:.16} },
    { id:'space_opens', title:'Un espace se dessine', text:'Leur milieu ne suit plus tous les décrochages. Entre les lignes, quelques mètres commencent à apparaître.', effects:{goal:.07,assist:.04,opponentThreat:-.03} },
    { id:'crowd_surge', title:'La tension monte', text:'Une décision arbitrale déclenche les réactions autour du terrain. Les duels deviennent plus nerveux.', effects:{rating:.05,fatigue:1,cards:.04,opponentThreat:.06} },
    { id:'coach_shift', title:'Le coach ajuste', text:'Depuis la ligne, le coach te fait signe de jouer plus haut et d’attaquer l’espace dès la récupération.', effects:{goal:.04,assist:.06,rating:.04,opponentThreat:.02} },
    { id:'direct_opponent', title:'Ton vis-à-vis change quelque chose', text:'Après plusieurs duels, ton adversaire direct ne défend plus aussi près. Il protège d’abord l’espace dans son dos.', effects:{goal:.035,assist:.025,duel:.04} },
    { id:'tempo_drop', title:'Le rythme retombe', text:'Pendant quelques minutes, les deux équipes prennent moins de risques. Les déplacements sans ballon deviennent plus importants que les accélérations.', effects:{fatigue:-1,opponentThreat:-.02} }
];

export function createUnexpectedContext(session, roll = Math.random()) {
    const index = Math.min(UNEXPECTED_CONTEXTS.length - 1, Math.floor(Math.max(0, roll) * UNEXPECTED_CONTEXTS.length));
    return { ...UNEXPECTED_CONTEXTS[index], effects: { ...UNEXPECTED_CONTEXTS[index].effects } };
}

export function buildUnexpectedStep(session, context) {
    return step(session, {
        phase: 'unexpected_event',
        label: 'LE MATCH CHANGE',
        progress: 61,
        minute: session.moments?.[session.currentMoment] || 57,
        title: context.title,
        text: context.text,
        actionLabel: 'Continuer'
    });
}

export function buildFullTimeStep(session, result) {
    const contribution = result.goals > 1 ? `${result.goals} buts` : result.goals === 1 ? '1 but' : '';
    const assist = result.assists > 1 ? `${result.assists} passes décisives` : result.assists === 1 ? '1 passe décisive' : '';
    const impact = [contribution, assist].filter(Boolean).join(' et ');
    const close = Math.abs(Number(result.teamGoals) - Number(result.opponentGoals)) <= 1;
    const ending = result.result === 'win'
        ? (close ? `${session.opponent} pousse encore. Ton équipe défend chaque seconde comme une possession.` : `${session.opponent} continue d’avancer, mais le match lui échappe peu à peu.`)
        : result.result === 'loss'
            ? `Ton équipe remet encore un ballon devant. Personne ne veut être celui qui accepte que ce soit fini.`
            : `Les deux équipes gardent assez d’énergie pour une dernière accélération.`;
    return step(session, {
        phase: 'full_time_sequence',
        label: 'FIN DE MATCH',
        progress: 90,
        minute: 90,
        title: 'Les dernières possessions',
        text: `${ending}${impact ? ` Ta rencontre porte déjà la trace de ${impact}.` : ''}`,
        actionLabel: 'Attendre le coup de sifflet'
    });
}

export function buildFinalWhistleStep(session, result) {
    const verdict = result.result === 'win'
        ? 'C’est gagné.'
        : result.result === 'loss'
            ? 'Le coup de sifflet coupe la dernière tentative. La défaite est là.'
            : 'Le coup de sifflet arrive sans que personne n’ait réussi à prendre le dernier avantage.';
    const tier = careerTier(session);
    const after = tier === 'u15' || tier === 'youth'
        ? 'Autour du terrain, les voix reviennent une à une pendant que les joueurs cherchent leur souffle.'
        : 'Pendant quelques secondes, les réactions autour de la pelouse couvrent les conversations entre joueurs.';
    return step(session, {
        phase: 'final_whistle',
        label: 'COUP DE SIFFLET',
        progress: 97,
        minute: 90,
        title: `${result.teamGoals} – ${result.opponentGoals}`,
        text: `${verdict} ${after}`,
        actionLabel: 'Voir les réactions'
    });
}

export function buildPostMatchReactions(state, session, result) {
    const tier = careerTier({ ...session, playerAge: state?.player?.age ?? playerAge(session) });
    const coachName = state?.social?.coachData?.name || state?.social?.formativeCoach || 'Le coach';
    const lockerText = result.result === 'win'
        ? (result.rating >= 7.5
            ? 'À peine entré, tu reçois deux tapes sur l’épaule. Tes partenaires savent où le match a basculé.'
            : 'Les discussions reprennent dans le vestiaire. La fatigue laisse enfin de la place au résultat.')
        : result.result === 'loss'
            ? 'Personne ne parle tout de suite. Chacun retrouve sa place et rejoue ses propres actions.'
            : 'Le groupe reste partagé. Quelques joueurs parlent déjà de l’action qui aurait pu faire basculer le match.';

    const coachText = result.rating >= 8
        ? `${coachName} te retient une seconde : « Garde ça. Mais demain, on repart de zéro. »`
        : result.rating < 5.8
            ? `${coachName} ne fait pas de discours. « Demain, on regarde ça ensemble. »`
            : `${coachName} s’arrête près de toi : « Il y a du bon. Et un détail qu’on va corriger. »`;

    let outside;
    if (tier === 'u15') {
        outside = { id:'outside', icon:'👥', label:'BORD DU TERRAIN', text:result.goals > 0 ? 'En quittant le terrain, quelques proches reparlent déjà de ton but. Toi, tu regardes surtout où sont tes coéquipiers.' : 'Les familles attendent près de la main courante. Le match reste un sujet de conversation, pas un événement médiatique.' };
    } else if (tier === 'youth') {
        outside = { id:'outside', icon:'📋', label:'FORMATION', text:result.rating >= 7.5 || result.goals || result.assists ? 'En regagnant les vestiaires, tu remarques quelques regards qui restent sur toi un peu plus longtemps que d’habitude.' : 'Les éducateurs échangent encore près du terrain. Rien de public, mais chaque match nourrit doucement la hiérarchie interne.' };
    } else if (tier === 'semi') {
        outside = { id:'outside', icon:'🗣️', label:'AUTOUR DU CLUB', text:result.goals >= 2 ? `Ton ${result.goals === 2 ? 'doublé' : `${result.goals} buts`} devient déjà le sujet des conversations à la sortie.` : result.rating >= 7.5 ? 'Quelques habitués du club commentent ta prestation en quittant la tribune.' : 'À la sortie, les discussions portent surtout sur le résultat collectif.' };
    } else {
        outside = { id:'outside', icon:'🎙️', label:'MÉDIAS', text:result.goals >= 2 ? `Les premières alertes retiennent ton ${result.goals === 2 ? 'doublé' : result.goals === 3 ? 'triplé' : `${result.goals} buts`}. Ton téléphone commence à vibrer.` : result.goals === 1 || result.assists > 0 ? 'Ton action décisive revient dans les premiers commentaires du match.' : result.rating >= 7.5 ? 'Quelques observateurs soulignent ton activité même sans statistique décisive.' : 'Les réactions parlent surtout du résultat collectif.' };
    }

    return [
        { id:'locker-room', icon:'👕', label:'VESTIAIRE', text:lockerText },
        { id:'coach', icon:'🧠', label:'COACH', text:coachText },
        outside
    ];
}

export function buildReactionsStep(session, reactions) {
    return step(session, {
        phase: 'reactions',
        kind: 'reactions',
        label: 'APRÈS-MATCH',
        progress: 100,
        title: 'Ce que le match laisse derrière lui',
        text: 'Le score ne bougera plus. En revanche, ce que le coach, le groupe et toi retenez de cette soirée peut revenir plus tard.',
        items: reactions,
        actionLabel: 'Continuer la carrière'
    });
}

export default {
    buildPreMatchStep,
    buildKickoffStep,
    buildDecisionStep,
    buildConsequenceStep,
    buildContinuationStep,
    createUnexpectedContext,
    buildUnexpectedStep,
    buildFullTimeStep,
    buildFinalWhistleStep,
    buildPostMatchReactions,
    buildReactionsStep
};
