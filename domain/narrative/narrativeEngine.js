// domain/narrative/narrativeEngine.js
// Couche d'interprétation narrative. Elle lit les faits et la mémoire existante,
// mais ne modifie jamais les règles métier ni les statistiques du joueur.

const IMPORTANCE_SCORE = Object.freeze({ low: 0, normal: 1, important: 2, major: 3, exceptional: 4 });
const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

function importanceOf(result = {}) {
    const fixture = result.fixture || {};
    const explicit = String(result.importance || fixture.importance || '').toLowerCase();
    if (IMPORTANCE_SCORE[explicit] !== undefined) return explicit;
    const phase = `${result.phase || fixture.phase || ''} ${result.round || fixture.round || ''}`.toLowerCase();
    if (phase.includes('final')) return 'exceptional';
    if (fixture.isDerby || fixture.rival || fixture.rivalry) return 'major';
    return 'normal';
}

function storyScore(result = {}) {
    const importance = IMPORTANCE_SCORE[importanceOf(result)] || 0;
    const rating = n(result.rating);
    const decisive = n(result.goals) * 3 + n(result.assists) * 2;
    const resultWeight = result.result === 'win' ? 2 : result.result === 'loss' ? 1 : 0;
    const interactive = result.interactive ? 1.5 : 0;
    const appearance = result.playerPlayed === false ? -8 : 0;
    return importance * 10 + decisive + Math.max(0, rating - 6) + resultWeight + interactive + appearance;
}

function impactScore(result = {}) {
    if (result?.playerPlayed === false) return -100;
    const rating = n(result.rating);
    return n(result.goals) * 4 + n(result.assists) * 3 + Math.max(-2, rating - 6) * 1.5;
}

function impactLevel(result = {}) {
    if (result?.playerPlayed === false) return 'unused';
    const goals = n(result.goals);
    const assists = n(result.assists);
    const rating = n(result.rating);
    if (goals >= 2 || goals + assists >= 2 || rating >= 8.2) return 'decisive';
    if (goals + assists >= 1 || rating >= 7.5) return 'strong';
    if (rating >= 6) return 'present';
    return 'difficult';
}

function impactLabel(level) {
    return {
        decisive: 'Impact décisif',
        strong: 'Impact fort',
        present: 'Présent',
        difficult: 'En difficulté',
        unused: 'Non utilisé'
    }[level] || 'Présent';
}

function appearanceLabel(result = {}) {
    if (result.playerPlayed === false) {
        if (result.appearance === 'bench') return 'Resté sur le banc';
        return 'Hors groupe';
    }
    if (result.started === false) return `Entré en jeu · ${n(result.minutesPlayed)} min`;
    if (n(result.minutesPlayed)) return `Titulaire · ${n(result.minutesPlayed)} min`;
    return 'Titulaire';
}

function impactDetail(result = {}) {
    if (result?.playerPlayed === false) return appearanceLabel(result);
    const goals = n(result.goals);
    const assists = n(result.assists);
    const rating = n(result.rating);
    const parts = [];
    if (goals) parts.push(`${goals} but${goals > 1 ? 's' : ''}`);
    if (assists) parts.push(`${assists} passe${assists > 1 ? 's' : ''} décisive${assists > 1 ? 's' : ''}`);
    parts.push(`note ${rating.toFixed(1)}`);
    return parts.join(' · ');
}

function featuredResult(results = []) {
    return [...results].filter(Boolean).sort((a, b) => storyScore(b) - storyScore(a))[0] || null;
}

function strongestImpactResult(results = []) {
    return [...results].filter(result => result && result.playerPlayed !== false).sort((a, b) => impactScore(b) - impactScore(a))[0] || null;
}

function scoreText(result) {
    return `${n(result?.teamGoals)}-${n(result?.opponentGoals)}`;
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
    const name = player?.firstname || player?.firstName || 'Tu';
    if (!result) return `Le staff ne t’a pas utilisé sur cette période. Ta place dans la rotation reste à gagner.`;
    if (result.playerPlayed === false) return result.appearance === 'bench'
        ? `Tu as suivi cette rencontre depuis le banc sans entrer en jeu.`
        : `Tu n’étais pas dans le groupe pour cette rencontre.`;
    const rating = n(result?.rating);
    const goals = n(result?.goals);
    const assists = n(result?.assists);
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

function blockOverviewText(results = [], impactMatch = null) {
    if (results.length <= 1) return null;
    const wins = results.filter(result => result?.result === 'win').length;
    const draws = results.filter(result => result?.result === 'draw').length;
    const losses = results.filter(result => result?.result === 'loss').length;
    const appearances = results.filter(result => result?.playerPlayed !== false).length;
    const starts = results.filter(result => result?.playerPlayed !== false && result?.started !== false).length;
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

function memoryCallback(state, result) {
    const memories = Array.isArray(state?.careerMemory) ? state.careerMemory : [];
    if (!memories.length) return null;
    const opponent = String(result?.opponent || '').trim().toLowerCase();
    const opponentClubId = result?.fixture?.opponentClubId || result?.fixture?.clubId || null;
    const memory = memories.slice(-80).reverse().find(item => {
        if (opponentClubId && item?.clubId === opponentClubId) return true;
        if (!opponent || opponent.length < 3) return false;
        return `${item?.title || ''} ${item?.text || ''} ${item?.source || ''}`.toLowerCase().includes(opponent);
    });
    if (!memory) return null;
    const age = memory.age ? ` à ${memory.age} ans` : '';
    return `Ce rendez-vous réveille aussi une trace plus ancienne de ta carrière${age}. Le contexte a changé, mais le passé n’a pas complètement disparu.`;
}

function recentFormContext(state, result) {
    const history = Array.isArray(state?.career?.seasonHistory) ? state.career.seasonHistory : [];
    const last = history.at(-1);
    const label = last?.summary || last?.label || last?.title;
    return label && result?.result === 'win' ? `Cette victoire arrive dans une carrière qui s’est déjà construite par étapes : ${label}.` : null;
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

function buildMatchRecap(results, narrativeMatch, impactMatch) {
    return results.map((result, index) => {
        const level = impactLevel(result);
        return {
            matchIndex: Number.isFinite(Number(result?.matchIndex)) ? Number(result.matchIndex) : index,
            opponent: result?.opponent || 'Adversaire',
            competition: result?.competitionName || result?.fixture?.competitionName || 'Match',
            score: scoreText(result),
            result: result?.result || null,
            rating: result?.playerPlayed === false ? null : n(result?.rating),
            goals: n(result?.goals),
            assists: n(result?.assists),
            interactive: Boolean(result?.interactive),
            playerPlayed: result?.playerPlayed !== false,
            started: result?.started !== false,
            appearance: result?.appearance || (result?.started === false ? 'substitute' : 'starter'),
            minutesPlayed: n(result?.minutesPlayed),
            appearanceLabel: appearanceLabel(result),
            impactLevel: level,
            impactLabel: impactLabel(level),
            impactDetail: impactDetail(result),
            isNarrativeFocus: result === narrativeMatch,
            isImpactMatch: result === impactMatch && result?.playerPlayed !== false
        };
    });
}

export class NarrativeEngine {
    composeMatchEnd({ state, report } = {}) {
        const rawResults = report?.summary?.matchResults || report?.results || [];
        const results = Array.isArray(rawResults) ? rawResults.filter(Boolean) : [];
        const playerResults = results.filter(result => result?.playerPlayed !== false);
        const featured = featuredResult(playerResults.length ? playerResults : results);
        const impactMatch = strongestImpactResult(playerResults);
        if (!state?.player || !featured) return null;

        const importance = importanceOf(featured);
        const callback = memoryCallback(state, featured);
        const continuity = recentFormContext(state, featured);
        const overview = blockOverviewText(results, impactMatch);
        const beats = [];
        if (overview) beats.push({ kind: 'block-overview', text: overview, delay: 800, emphasis: true });
        beats.push(
            { kind: 'atmosphere', text: atmosphereText(featured, importance), delay: 700 },
            { kind: 'result', text: outcomeText(featured), delay: 950, emphasis: true },
            { kind: 'player', text: performanceText(state.player, impactMatch || (featured.playerPlayed !== false ? featured : null)), delay: 1050 }
        );
        if (callback) beats.push({ kind: 'memory', text: callback, delay: 1200, callback: true });
        else if (continuity) beats.push({ kind: 'continuity', text: continuity, delay: 1100 });

        return {
            id: `narrative_match_${Date.now()}_${featured.matchIndex ?? 0}`,
            type: 'match.end',
            importance,
            tone: toneFor(featured),
            title: titleFor(featured, importance, results.length),
            subtitle: results.length > 1
                ? `${results.length} matchs d'équipe · ${playerResults.length} apparition${playerResults.length > 1 ? 's' : ''}`
                : `${featured.competitionName || featured.fixture?.competitionName || 'Match'} · ${featured.opponent || 'Adversaire'}`,
            matchIndex: featured.matchIndex ?? null,
            impactMatchIndex: impactMatch?.matchIndex ?? null,
            interactive: Boolean(featured.interactive),
            matches: buildMatchRecap(results, featured, impactMatch),
            beats,
            facts: {
                matchCount: results.length,
                appearances: playerResults.length,
                result: featured.result || null,
                score: scoreText(featured),
                rating: impactMatch ? n(impactMatch.rating) : 0,
                goals: playerResults.reduce((sum, result) => sum + n(result.goals), 0),
                assists: playerResults.reduce((sum, result) => sum + n(result.assists), 0)
            }
        };
    }
}

export default NarrativeEngine;
