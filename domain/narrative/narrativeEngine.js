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
    return importance * 10 + decisive + Math.max(0, rating - 6) + resultWeight + interactive;
}

function featuredResult(results = []) {
    return [...results]
        .filter(Boolean)
        .sort((a, b) => storyScore(b) - storyScore(a))[0] || null;
}

function scoreText(result) {
    const team = n(result?.teamGoals);
    const opponent = n(result?.opponentGoals);
    return `${team}-${opponent}`;
}

function outcomeText(result) {
    const opponent = result?.opponent || 'l’adversaire';
    if (result?.result === 'win') return `Le coup de sifflet final confirme la victoire ${scoreText(result)} face à ${opponent}.`;
    if (result?.result === 'loss') return `Le match s’achève sur une défaite ${scoreText(result)} face à ${opponent}.`;
    return `Au terme d’une rencontre indécise, les deux équipes se quittent sur un ${scoreText(result)} face à ${opponent}.`;
}

function performanceText(player, result) {
    const name = player?.firstname || player?.firstName || 'Tu';
    const rating = n(result?.rating);
    const goals = n(result?.goals);
    const assists = n(result?.assists);
    if (goals >= 2) return `${name} quitte la pelouse après un doublé qui a pesé lourd dans cette rencontre.`;
    if (goals === 1 && assists >= 1) return `Un but et une passe décisive : tu as directement pesé sur deux actions décisives.`;
    if (goals === 1) return `Ton but donne une dimension personnelle à ce match et restera associé à cette soirée.`;
    if (assists >= 2) return `Tes ${assists} passes décisives ont placé ton influence au cœur du résultat.`;
    if (assists === 1) return `Ta passe décisive a laissé une trace concrète dans le scénario du match.`;
    if (rating >= 8) return `Sans forcément apparaître au tableau des buteurs, ta prestation a marqué la rencontre.`;
    if (rating < 5.5) return `Tu quittes le terrain avec le sentiment d’être passé à côté de ton match.`;
    return `Ta prestation s’inscrit dans le mouvement collectif, sans geste décisif mais avec son poids dans le match.`;
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
    const candidates = memories
        .slice(-80)
        .reverse()
        .filter(memory => {
            if (opponentClubId && memory?.clubId === opponentClubId) return true;
            if (!opponent || opponent.length < 3) return false;
            const text = `${memory?.title || ''} ${memory?.text || ''} ${memory?.source || ''}`.toLowerCase();
            return text.includes(opponent);
        });
    const memory = candidates[0];
    if (!memory) return null;
    const age = memory.age ? ` à ${memory.age} ans` : '';
    return `Ce rendez-vous réveille aussi une trace plus ancienne de ta carrière${age}. Le contexte a changé, mais le passé n’a pas complètement disparu.`;
}

function recentFormContext(state, result) {
    const history = Array.isArray(state?.career?.seasonHistory) ? state.career.seasonHistory : [];
    const last = history.at(-1);
    if (!last) return null;
    const label = last.summary || last.label || last.title;
    if (!label) return null;
    if (result?.result === 'win') return `Cette victoire arrive dans une carrière qui s’est déjà construite par étapes : ${label}.`;
    return null;
}

function titleFor(result, importance) {
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

export class NarrativeEngine {
    composeMatchEnd({ state, report } = {}) {
        const results = report?.summary?.matchResults || report?.results || [];
        const featured = featuredResult(Array.isArray(results) ? results : []);
        if (!state?.player || !featured) return null;

        const importance = importanceOf(featured);
        const callback = memoryCallback(state, featured);
        const continuity = recentFormContext(state, featured);
        const beats = [
            { kind: 'atmosphere', text: atmosphereText(featured, importance), delay: 700 },
            { kind: 'result', text: outcomeText(featured), delay: 950, emphasis: true },
            { kind: 'player', text: performanceText(state.player, featured), delay: 1050 }
        ];
        if (callback) beats.push({ kind: 'memory', text: callback, delay: 1200, callback: true });
        else if (continuity) beats.push({ kind: 'continuity', text: continuity, delay: 1100 });

        return {
            id: `narrative_match_${Date.now()}_${featured.matchIndex ?? 0}`,
            type: 'match.end',
            importance,
            tone: toneFor(featured),
            title: titleFor(featured, importance),
            subtitle: `${featured.competitionName || featured.fixture?.competitionName || 'Match'} · ${featured.opponent || 'Adversaire'}`,
            matchIndex: featured.matchIndex ?? null,
            interactive: Boolean(featured.interactive),
            beats,
            facts: {
                result: featured.result || null,
                score: scoreText(featured),
                rating: n(featured.rating),
                goals: n(featured.goals),
                assists: n(featured.assists)
            }
        };
    }
}

export default NarrativeEngine;
