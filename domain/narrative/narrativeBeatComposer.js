// Compose les beats de présentation à partir d'un plan déjà validé.

import { impactLevel } from './narrativeSignificance.js';
import { stableNarrativeId } from './narrativeFactNormalizer.js';

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

function resultView(fact = {}) {
    const metrics = fact.metrics || {}, payload = fact.payload || {};
    return {
        factId: fact.id,
        fixture: payload.fixture || {},
        matchIndex: metrics.matchIndex,
        opponent: payload.opponent || 'Adversaire',
        competitionName: payload.competitionName || 'Match',
        importance: payload.importance,
        phase: payload.phase,
        round: payload.round,
        result: fact.outcome?.result || null,
        teamGoals: n(metrics.teamGoals),
        opponentGoals: n(metrics.opponentGoals),
        rating: metrics.rating === null ? null : n(metrics.rating),
        goals: n(metrics.goals),
        assists: n(metrics.assists),
        playerPlayed: metrics.playerPlayed !== false,
        started: metrics.started !== false,
        minutesPlayed: n(metrics.minutesPlayed),
        interactive: Boolean(metrics.interactive),
        appearance: payload.appearance || (metrics.started === false ? 'substitute' : 'starter')
    };
}

function scoreText(result) { return `${n(result?.teamGoals)}-${n(result?.opponentGoals)}`; }

function appearanceLabel(result = {}) {
    if (result.playerPlayed === false) return result.appearance === 'bench' ? 'Resté sur le banc' : 'Hors groupe';
    if (result.started === false) return `Entré en jeu · ${n(result.minutesPlayed)} min`;
    if (n(result.minutesPlayed)) return `Titulaire · ${n(result.minutesPlayed)} min`;
    return 'Titulaire';
}

function impactLabel(level) {
    return {
        decisive: 'Impact décisif', strong: 'Impact fort', present: 'Présent',
        difficult: 'En difficulté', unused: 'Non utilisé'
    }[level] || 'Présent';
}

function impactDetail(result = {}) {
    if (result.playerPlayed === false) return appearanceLabel(result);
    const parts = [], goals = n(result.goals), assists = n(result.assists), rating = n(result.rating);
    if (goals) parts.push(`${goals} but${goals > 1 ? 's' : ''}`);
    if (assists) parts.push(`${assists} passe${assists > 1 ? 's' : ''} décisive${assists > 1 ? 's' : ''}`);
    parts.push(`note ${rating.toFixed(1)}`);
    return parts.join(' · ');
}

function outcomeText(result) {
    const opponent = result?.opponent || 'l’adversaire';
    if (result?.result === 'win') return `Le coup de sifflet final confirme la victoire ${scoreText(result)} face à ${opponent}.`;
    if (result?.result === 'loss') return `Le match s’achève sur une défaite ${scoreText(result)} face à ${opponent}.`;
    return `Au terme d’une rencontre indécise, les deux équipes se quittent sur un ${scoreText(result)} face à ${opponent}.`;
}

function goalHaulText(goals) {
    const labels = { 2: 'un doublé', 3: 'un triplé', 4: 'un quadruplé', 5: 'un quintuplé', 6: 'un sextuplé' };
    return labels[goals] ? `${labels[goals]} qui a pesé` : `${goals} buts qui ont pesé`;
}

function performanceText(player, result) {
    const name = player?.firstName || 'Tu';
    if (!result) return `Le staff ne t’a pas utilisé sur cette période. Ta place dans la rotation reste à gagner.`;
    if (result.playerPlayed === false) return result.appearance === 'bench'
        ? `Tu as suivi cette rencontre depuis le banc sans entrer en jeu.`
        : `Tu n’étais pas dans le groupe pour cette rencontre.`;
    const rating = n(result.rating), goals = n(result.goals), assists = n(result.assists);
    if (result.started === false && rating >= 7) return `Entré en cours de match, tu as profité de tes minutes pour marquer des points auprès du staff.`;
    if (goals >= 2) return `${name} quitte la pelouse après ${goalHaulText(goals)} lourd dans cette rencontre.`;
    if (goals === 1 && assists >= 1) return `Un but et une passe décisive : tu as directement pesé sur deux actions décisives.`;
    if (goals === 1) return `Ton but donne une dimension personnelle à ce match et restera associé à cette soirée.`;
    if (assists >= 2) return `Tes ${assists} passes décisives ont placé ton influence au cœur du résultat.`;
    if (assists === 1) return `Ta passe décisive a laissé une trace concrète dans le scénario du match.`;
    if (rating >= 8) return `Sans forcément apparaître au tableau des buteurs, ta prestation a marqué la rencontre.`;
    if (rating < 5.5) return `Tu quittes le terrain avec le sentiment d’être passé à côté de ton match.`;
    return `Ta prestation s’inscrit dans le mouvement collectif, sans geste décisif mais avec son poids dans le match.`;
}

function blockOverviewText(results, impactMatch) {
    if (results.length <= 1) return null;
    const wins = results.filter(result => result.result === 'win').length;
    const draws = results.filter(result => result.result === 'draw').length;
    const losses = results.filter(result => result.result === 'loss').length;
    const appearances = results.filter(result => result.playerPlayed !== false).length;
    const starts = results.filter(result => result.playerPlayed !== false && result.started !== false).length;
    const record = [`${wins} victoire${wins > 1 ? 's' : ''}`];
    if (draws) record.push(`${draws} nul${draws > 1 ? 's' : ''}`);
    if (losses) record.push(`${losses} défaite${losses > 1 ? 's' : ''}`);
    if (!appearances) return `Cette période comptait ${results.length} matchs pour ton équipe : ${record.join(', ')}. Le staff ne t’a pas utilisé.`;
    const opponent = impactMatch?.opponent || 'un adversaire';
    return `Cette période comptait ${results.length} matchs pour ton équipe : ${record.join(', ')}. Tu as disputé ${appearances} rencontre${appearances > 1 ? 's' : ''}, dont ${starts} comme titulaire. Ton empreinte la plus nette est venue face à ${opponent}.`;
}

function atmosphereText(result, importance) {
    const fixture = result?.fixture || {};
    if (importance === 'exceptional') return `Pendant quelques secondes, tout semble ralentir. Ce genre de match ne ressemble pas aux autres.`;
    if (importance === 'major') return fixture.isDerby || fixture.rival || fixture.rivalry
        ? `La tension retombe lentement autour du terrain. Un derby ne se termine jamais vraiment au coup de sifflet.`
        : `Le stade reste chargé d’une tension particulière bien après la dernière action.`;
    if (result?.result === 'win') return `Dans les tribunes, les chants accompagnent encore les joueurs qui quittent la pelouse.`;
    if (result?.result === 'loss') return `Les bruits du stade paraissent plus lointains au moment de rejoindre le tunnel.`;
    return `Les joueurs se dispersent lentement pendant que le stade retrouve son calme.`;
}

function titleFor(result, importance, matchCount) {
    if (matchCount > 1) return 'Une période, plusieurs histoires';
    const opponent = result?.opponent || 'Adversaire';
    if (importance === 'exceptional') return `Une soirée qui peut compter longtemps`;
    if (importance === 'major') return `Plus qu’un simple match contre ${opponent}`;
    if (result?.result === 'win') return `Le travail est fait`;
    if (result?.result === 'loss') return `Une soirée à digérer`;
    return `Un match qui laisse des questions`;
}

function toneFor(result) {
    if (result?.result === 'win') return n(result.rating) >= 7.5 ? 'triumph' : 'relief';
    if (result?.result === 'loss') return n(result.rating) >= 7 ? 'bittersweet' : 'disappointment';
    return 'reflection';
}

function recap(facts, featuredFact, impactFact, evaluations) {
    return facts.map(fact => {
        const result = resultView(fact);
        const level = evaluations.get(fact.id)?.impactLevel || impactLevel(fact);
        return {
            matchIndex: result.matchIndex,
            opponent: result.opponent,
            competition: result.competitionName,
            score: scoreText(result),
            result: result.result,
            rating: result.playerPlayed === false ? null : n(result.rating),
            goals: n(result.goals),
            assists: n(result.assists),
            interactive: result.interactive,
            playerPlayed: result.playerPlayed,
            started: result.started,
            appearance: result.appearance,
            minutesPlayed: result.minutesPlayed,
            appearanceLabel: appearanceLabel(result),
            impactLevel: level,
            impactLabel: impactLabel(level),
            impactDetail: impactDetail(result),
            isNarrativeFocus: fact.id === featuredFact.id,
            isImpactMatch: fact.id === impactFact?.id && result.playerPlayed !== false
        };
    });
}

export class NarrativeBeatComposer {
    compose({ plan, context, memory } = {}) {
        if (!plan?.primary?.featuredFact || !context?.player) return { primaryScene: null, callbackCommands: [] };
        const { featuredFact, impactFact, facts, evaluation, evaluations, arc } = plan.primary;
        const results = facts.map(resultView), featured = resultView(featuredFact);
        const impactMatch = impactFact ? resultView(impactFact) : null;
        const playerResults = results.filter(result => result.playerPlayed !== false);
        const importance = evaluation?.importance || 'normal';
        const callback = memory?.callbacksByFactId?.[featuredFact.id] || null;
        const continuity = memory?.continuityByFactId?.[featuredFact.id] || null;
        const overview = blockOverviewText(results, impactMatch);
        const beats = [];
        const addBeat = beat => beats.push({ ...beat, key: `${featuredFact.id}:${beat.kind}` });
        if (overview) addBeat({ kind: 'block-overview', text: overview, delay: 800, emphasis: true });
        addBeat({ kind: 'atmosphere', text: atmosphereText(featured, importance), delay: 700 });
        addBeat({ kind: 'result', text: outcomeText(featured), delay: 950, emphasis: true });
        addBeat({ kind: 'player', text: performanceText(context.player, impactMatch || (featured.playerPlayed ? featured : null)), delay: 1050 });
        if (callback) addBeat({ kind: 'memory', text: callback.text, delay: 1200, callback: true });
        else if (continuity) addBeat({ kind: 'continuity', text: continuity, delay: 1100 });

        const scene = {
            id: stableNarrativeId('narrative_match', featuredFact.id),
            type: 'match.end',
            importance,
            tone: toneFor(featured),
            title: titleFor(featured, importance, results.length),
            subtitle: results.length > 1
                ? `${results.length} matchs d'équipe · ${playerResults.length} apparition${playerResults.length > 1 ? 's' : ''}`
                : `${featured.competitionName} · ${featured.opponent}`,
            matchIndex: featured.matchIndex ?? null,
            impactMatchIndex: impactMatch?.matchIndex ?? null,
            interactive: featured.interactive,
            matches: recap(facts, featuredFact, impactFact, evaluations),
            beats,
            arc,
            narrativeSeed: context.seed,
            sourceFactIds: facts.map(fact => fact.id),
            facts: {
                matchCount: results.length,
                appearances: playerResults.length,
                result: featured.result,
                score: scoreText(featured),
                rating: impactMatch ? n(impactMatch.rating) : 0,
                goals: playerResults.reduce((sum, result) => sum + n(result.goals), 0),
                assists: playerResults.reduce((sum, result) => sum + n(result.assists), 0)
            }
        };
        const callbackCommands = callback ? [{
            id: stableNarrativeId('callback', { memoryId: callback.memoryId, factId: featuredFact.id }),
            action: 'record',
            memoryId: callback.memoryId,
            factId: featuredFact.id,
            sceneId: scene.id,
            occurredAt: featuredFact.occurredAt
        }] : [];
        return { primaryScene: scene, callbackCommands };
    }
}

export default NarrativeBeatComposer;
