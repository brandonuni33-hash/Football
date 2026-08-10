// domain/match/matchPerformanceEngine.js
// Moteur commun de performance individuelle.
// La même logique est utilisée pour les matchs simulés et les matchs interactifs.

const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));
const n = v => Number.isFinite(Number(v)) ? Number(v) : 0;
const rand = (min, max) => min + Math.random() * (max - min);

const ROLE_WEIGHTS = {
    attacker: {
        finish: 0.23, speed: 0.12, dribble: 0.14, pass: 0.10, defense: 0.04, physical: 0.09, mental: 0.12, positioning: 0.16
    },
    midfielder: {
        finish: 0.06, speed: 0.09, dribble: 0.12, pass: 0.24, defense: 0.12, physical: 0.09, mental: 0.14, positioning: 0.14
    },
    defender: {
        finish: 0.02, speed: 0.09, dribble: 0.06, pass: 0.13, defense: 0.29, physical: 0.16, mental: 0.15, positioning: 0.10
    },
    goalkeeper: {
        finish: 0.01, speed: 0.05, dribble: 0.03, pass: 0.13, defense: 0.28, physical: 0.13, mental: 0.24, positioning: 0.13
    }
};

function roleOf(position) {
    const p = String(position || '').toUpperCase();
    if (['GK', 'GB', 'G'].includes(p)) return 'goalkeeper';
    if (['DC', 'CB', 'DD', 'RB', 'DG', 'LB', 'D', 'LAT'].includes(p)) return 'defender';
    if (['MC', 'CM', 'MOC', 'CAM', 'MD', 'MG', 'M', 'MDEF', 'MOFF'].includes(p)) return 'midfielder';
    return 'attacker';
}

function attribute(player, key, fallback = 50) {
    const a = player?.attributes || {};
    return clamp(a[key] ?? fallback, 1, 99);
}

function expressionFactor(player) {
    const fitness = clamp(player?.fitness ?? 80, 0, 100);
    const morale = clamp(player?.morale ?? 70, 0, 100);
    const mental = attribute(player, 'mental', 50);
    const confidence = clamp((morale * 0.55) + (mental * 0.45), 0, 100);
    const fatiguePenalty = Math.pow((100 - fitness) / 100, 1.35) * 0.22;
    const mentalPenalty = Math.pow((100 - confidence) / 100, 1.15) * 0.14;
    return clamp(1 - fatiguePenalty - mentalPenalty, 0.58, 1.04);
}

function consistency(player) {
    const hidden = n(player?.hidden?.consistency);
    // Les anciennes valeurs sont sur une petite échelle ; on les convertit sans exposer la stat.
    return clamp(0.82 + hidden / 100, 0.80, 0.99);
}

function relativeLevel(player, opponentStrength = 50) {
    const role = roleOf(player?.position);
    const w = ROLE_WEIGHTS[role];
    const raw =
        attribute(player, 'tir') * w.finish +
        attribute(player, 'vitesse') * w.speed +
        attribute(player, 'dribble') * w.dribble +
        attribute(player, 'passe') * w.pass +
        attribute(player, 'defense') * w.defense +
        attribute(player, 'physique') * w.physical +
        attribute(player, 'mental') * w.mental +
        ((attribute(player, 'defense') + attribute(player, 'mental')) / 2) * w.positioning;
    const opponent = clamp(opponentStrength, 25, 95);
    return clamp((raw - opponent) / 45, -0.55, 0.55);
}

function situationProfile(player, context = {}) {
    const role = roleOf(player?.position);
    const a = player?.attributes || {};
    const fitness = clamp(player?.fitness ?? 80, 0, 100);
    const morale = clamp(player?.morale ?? 70, 0, 100);
    const opponentStrength = n(context.opponentStrength ?? context.opponentOverall ?? 55) || 55;
    const difficulty = clamp((opponentStrength - 50) / 50, -0.5, 0.9);
    const expression = expressionFactor(player);
    const relative = relativeLevel(player, opponentStrength);
    const consistencyFactor = consistency(player);

    const base = 6.25 + relative * 1.15 + (expression - 0.82) * 1.15;
    const pressure = context.important ? (n(a.mental) - 50) / 250 : 0;
    const randomness = rand(-0.48, 0.48) * consistencyFactor;

    return {
        role,
        expression,
        relative,
        difficulty,
        base,
        ratingBase: base + pressure + randomness,
        fitness,
        morale,
        mental: n(a.mental),
        consistencyFactor
    };
}

function simulateActions(player, context, profile) {
    const role = profile.role;
    const a = player.attributes || {};
    const minutes = clamp(n(context.minutes || 80), 20, 105);
    const volume = clamp(Math.round(minutes / 5 + rand(-2, 3)), 6, 24);
    const opponentStrength = n(context.opponentStrength ?? context.opponentOverall ?? 55) || 55;
    const difficulty = clamp((opponentStrength - 50) / 50, -0.4, 0.8);
    const actions = { chances: 0, keyActions: 0, successfulActions: 0, failedActions: 0, shots: 0, shotsOnTarget: 0, passes: 0, successfulPasses: 0, tackles: 0, interceptions: 0, duels: 0, duelsWon: 0, goals: 0, assists: 0, cleanSheet: false };

    const technical = clamp((n(a.passe) + n(a.dribble) + n(a.mental)) / 3 / 99, 0.1, 0.98);
    const attacking = clamp((n(a.tir) * .42 + n(a.dribble) * .20 + n(a.vitesse) * .18 + n(a.mental) * .20) / 99, 0.1, 0.98);
    const defensive = clamp((n(a.defense) * .52 + n(a.physique) * .18 + n(a.mental) * .30) / 99, 0.1, 0.98);

    for (let i = 0; i < volume; i += 1) {
        const pressure = clamp(difficulty + rand(-0.25, 0.25), -0.4, 0.9);
        if (role === 'attacker') {
            const chance = clamp(attacking * .34 - pressure * .09 + profile.expression * .08, .03, .40);
            if (Math.random() < chance) {
                actions.chances += 1;
                actions.shots += 1;
                const onTarget = Math.random() < clamp(n(a.tir) / 120 + profile.expression * .18, .18, .90);
                if (onTarget) actions.shotsOnTarget += 1;
                if (onTarget && Math.random() < clamp(n(a.tir) / 155 + profile.expression * .16 - pressure * .08, .03, .48)) actions.goals += 1;
            }
            const successful = Math.random() < clamp(technical * .72 - pressure * .08, .30, .94);
            successful ? actions.successfulActions += 1 : actions.failedActions += 1;
        } else if (role === 'midfielder') {
            actions.passes += 1 + Math.floor(Math.random() * 3);
            const passRate = clamp(technical * .90 - pressure * .08, .45, .96);
            actions.successfulPasses += Math.round(actions.passes > 0 ? (1 + Math.random() * 2) * passRate : 0);
            if (Math.random() < clamp((n(a.passe) + n(a.mental)) / 220 - pressure * .05, .06, .40)) actions.keyActions += 1;
            if (Math.random() < defensive * .24) { actions.tackles += 1; actions.duels += 1; if (Math.random() < defensive) actions.duelsWon += 1; }
        } else if (role === 'defender') {
            actions.duels += 1 + (Math.random() < .45 ? 1 : 0);
            const won = Math.random() < clamp(defensive * .92 - pressure * .06, .25, .93);
            if (won) actions.duelsWon += 1;
            if (Math.random() < defensive * .35) actions.tackles += 1;
            if (Math.random() < defensive * .25) actions.interceptions += 1;
            actions.passes += 1 + Math.floor(Math.random() * 2);
            actions.successfulPasses += Math.round(actions.passes * clamp(technical * .8, .35, .94));
        } else {
            const saves = Math.max(1, Math.round(rand(2, 7) + difficulty * 1.5));
            actions.keyActions += Math.max(0, Math.round(saves * clamp(n(a.defense) / 110, .25, .88)));
            actions.shotsOnTarget = saves;
            actions.successfulActions = actions.keyActions;
        }
    }

    if (role !== 'goalkeeper' && actions.passes > 0) actions.successfulPasses = Math.min(actions.passes, actions.successfulPasses);
    if (role === 'goalkeeper') actions.cleanSheet = Math.random() < clamp(.62 + n(a.defense) / 400 - difficulty * .18, .12, .78);
    if (role !== 'attacker') actions.assists = Math.random() < clamp((n(a.passe) + n(a.mental)) / 520, .02, .22) ? 1 : 0;
    else actions.assists = Math.random() < clamp((n(a.passe) + n(a.dribble)) / 600, .03, .24) ? 1 : 0;

    actions.keyActions += actions.shotsOnTarget + actions.interceptions;
    return actions;
}

function ratingFromActions(profile, actions, context = {}) {
    const role = profile.role;
    let score = profile.ratingBase;
    const totalActions = Math.max(1, actions.successfulActions + actions.failedActions);
    const successRate = actions.successfulActions / totalActions;
    score += (successRate - .55) * .72;
    score += Math.min(actions.keyActions, 8) * .055;
    score -= Math.min(actions.failedActions, 8) * .045;
    score += actions.goals * (role === 'attacker' ? .62 : .48);
    score += actions.assists * .30;
    if (role === 'attacker') score += actions.shotsOnTarget * .055;
    if (role === 'midfielder') score += actions.successfulPasses / Math.max(1, actions.passes) * .30;
    if (role === 'defender') score += actions.duelsWon * .055 + actions.interceptions * .08;
    if (role === 'goalkeeper') score += actions.keyActions * .08 + (actions.cleanSheet ? .32 : 0);
    if (context.result === 'win') score += .08;
    if (context.result === 'loss') score -= .08;
    return Number(clamp(score, 4.2, 9.4).toFixed(1));
}

export function evaluateMatch(player, context = {}) {
    const profile = situationProfile(player, context);
    const actions = simulateActions(player, context, profile);
    const rating = ratingFromActions(profile, actions, context);
    return {
        rating,
        goals: actions.goals,
        assists: actions.assists,
        tackles: actions.tackles,
        interceptions: actions.interceptions,
        successfulPasses: actions.successfulPasses,
        passes: actions.passes,
        cleanSheet: actions.cleanSheet,
        shots: actions.shots,
        shotsOnTarget: actions.shotsOnTarget,
        duels: actions.duels,
        duelsWon: actions.duelsWon,
        expression: Number(profile.expression.toFixed(3)),
        performanceLevel: Number(profile.relative.toFixed(3))
    };
}

export function recalibrateMatchResult(player, result = {}, context = {}) {
    const evaluated = evaluateMatch(player, { ...context, result: result.result, important: context.important ?? false });
    // Pour les matchs interactifs, on conserve l'effet des décisions sous forme
    // d'un petit déplacement de l'expression, plutôt que d'un bonus fixe de note.
    const decisionCount = Array.isArray(result.decisions) ? result.decisions.length : 0;
    const decisionQuality = Array.isArray(result.events) ? result.events.length : 0;
    const interactionShift = clamp((decisionCount * .025) + (decisionQuality * .015), -.12, .14);
    return {
        ...result,
        ...evaluated,
        rating: Number(clamp(evaluated.rating + interactionShift, 4.2, 9.4).toFixed(1))
    };
}

export function recalibrateReport(player, report, options = {}) {
    if (!report) return report;
    const results = Array.isArray(report.results) ? report.results : Array.isArray(report.summary?.matchResults) ? report.summary.matchResults : [];
    if (!results.length) return report;
    const recalibrated = results.map(result => recalibrateMatchResult(player, result, {
        opponentStrength: result.opponentStrength ?? options.opponentStrength ?? 55,
        opponentOverall: result.opponentOverall,
        important: ['final', 'rival'].includes(String(result.type || '').toLowerCase()) || result.importance === 'important'
    }));
    const summary = report.summary || {};
    const avgRating = Number((recalibrated.reduce((sum, r) => sum + n(r.rating), 0) / recalibrated.length).toFixed(1));
    const totals = {
        rating: avgRating,
        goals: recalibrated.reduce((s, r) => s + n(r.goals), 0),
        assists: recalibrated.reduce((s, r) => s + n(r.assists), 0),
        passes: recalibrated.reduce((s, r) => s + n(r.successfulPasses), 0),
        tackles: recalibrated.reduce((s, r) => s + n(r.tackles), 0),
        cleanSheets: recalibrated.reduce((s, r) => s + (r.cleanSheet ? 1 : 0), 0),
        matchesPlayed: recalibrated.length
    };
    return {
        ...report,
        results: recalibrated,
        summary: { ...summary, ...totals, matchResults: recalibrated }
    };
}

export default { evaluateMatch, recalibrateMatchResult, recalibrateReport };
