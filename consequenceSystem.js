// consequenceSystem.js
// Moteur canonique des conséquences de choix.
// Les effets de carrière sont latents : ils sont enregistrés puis appliqués
// à un bloc ultérieur. Les choix de match restent gérés dans le moteur du match.

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

const EMOTIONAL_LIMITS = {
    morale: [0, 100], confidence: [0, 100], mental: [0, 100],
    relationCoach: [0, 100], vestiaire: [0, 100], discipline: [0, 100],
    fame: [0, 100], reputation: [0, 100]
};

const LABELS = {
    morale: 'Moral', confidence: 'Confiance', mental: 'Mental',
    relationCoach: 'Relation coach', vestiaire: 'Vestiaire', discipline: 'Discipline',
    fame: 'Réputation', reputation: 'Réputation'
};

const EMOTIONAL = new Set(Object.keys(EMOTIONAL_LIMITS));

function ensure(player) {
    if (!player) throw new Error('ConsequenceSystem : joueur manquant.');
    player.stats ||= {};
    player.temporaryEffects ||= [];
    for (const [key, value] of Object.entries({
        morale: 50, confidence: 50, mental: 50,
        relationCoach: 50, vestiaire: 50, discipline: 50,
        fame: 10, reputation: 10
    })) {
        if (player[key] === undefined && player.stats[key] === undefined) player[key] = value;
    }
    return player;
}

function read(player, key) {
    return player?.[key] !== undefined ? num(player[key]) : num(player?.stats?.[key]);
}

function write(player, key, delta) {
    if (!EMOTIONAL.has(key)) return null;
    const before = read(player, key);
    const [min, max] = EMOTIONAL_LIMITS[key];
    const after = clamp(before + num(delta), min, max);
    if (player[key] !== undefined) player[key] = after;
    else player.stats[key] = after;
    return { stat: key, label: LABELS[key] || key, before, after, delta: after - before, type: 'emotional' };
}

function normalize(choice = {}) {
    const c = choice.consequences && typeof choice.consequences === 'object' ? choice.consequences : {};
    const legacy = choice.impacts || {};
    const permanent = { ...(c.permanent || {}), ...(c.emotional || {}) };

    for (const [key, value] of Object.entries(legacy)) {
        if (typeof value === 'number' && permanent[key] === undefined) permanent[key] = value;
    }

    const temporary = [
        ...(Array.isArray(c.temporary) ? c.temporary : []),
        ...(Array.isArray(c.effects) ? c.effects : [])
    ];

    if (legacy.matchBonuses) {
        for (const [key, value] of Object.entries(legacy.matchBonuses)) {
            if (typeof value === 'number') temporary.push({ stat: `matchBonus.${key}`, value, duration: 1, label: key });
        }
    }

    return { title: c.title || choice.title || null, message: c.message || choice.message || null, permanent, temporary };
}

function randomDelay(effect = {}, source = 'Choix') {
    if (Number.isFinite(Number(effect.delayBlocks))) return Math.max(1, Math.min(4, Math.round(Number(effect.delayBlocks))));
    if (source === 'Match') return 1;
    return 1 + Math.floor(Math.random() * 3);
}

function createId(prefix = 'consequence') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function queueEffect(state, choiceId, effect, options = {}) {
    state.consequences ||= [];
    const source = options.source || 'Choix';
    const magnitude = num(effect.value ?? effect.magnitude);
    const delayBlocks = randomDelay(effect, source);
    return {
        id: createId(), choiceId, source,
        target: effect.stat || effect.target,
        type: effect.type || 'modifier', magnitude,
        duration: Math.max(1, Math.min(6, Math.round(num(effect.duration, 1)))),
        delayBlocks, remainingBlocks: delayBlocks,
        visibility: 'hidden', label: effect.label || effect.stat || effect.target || 'Conséquence',
        trigger: effect.trigger || 'block_start', createdAt: new Date().toISOString(),
        resolved: false, revealed: false
    };
}

function queueChoice(state, choice, options = {}) {
    if (!state?.player) return null;
    ensure(state.player);
    const normalized = normalize(choice);
    const choiceId = choice.id || choice.choiceId || createId('choice');
    const queued = [];

    for (const [target, value] of Object.entries(normalized.permanent)) {
        if (!num(value)) continue;
        queued.push(queueEffect(state, choiceId, { target, magnitude: value }, options));
    }
    for (const effect of normalized.temporary) {
        if (!effect?.stat || !num(effect.value)) continue;
        queued.push(queueEffect(state, choiceId, effect, options));
    }

    state.consequences.push(...queued);
    return {
        choiceId, source: options.source || 'Choix', title: normalized.title || 'Décision prise',
        message: normalized.message || null, queued: queued.length, hidden: true, revealed: false
    };
}

function applyStateTarget(state, consequence) {
    const target = consequence.target;
    const value = consequence.magnitude;
    const player = state.player;

    if (EMOTIONAL.has(target)) {
        const result = write(player, target, value);
        if (target === 'relationCoach' && state.social?.coachData) {
            state.social.coachData.relation = read(player, 'relationCoach');
            state.player.stats.relationCoach = state.social.coachData.relation;
        }
        return result;
    }

    if (target === 'fitness') {
        const before = num(player.fitness, 90);
        const after = clamp(before + value, 0, 100);
        player.fitness = after;
        return { stat: target, before, after, delta: after - before, type: 'state' };
    }

    if (target === 'balance') {
        state.career ||= { balance: 0, seasonHistory: [], totalCareerIncome: 0 };
        const before = num(state.career.balance);
        state.career.balance = before + value;
        return { stat: target, before, after: state.career.balance, delta: value, type: 'economy' };
    }

    if (target === 'media.hypeLevel') {
        state.media ||= { followers: 0, hypeLevel: 0, feed: [], recentDilemma: null };
        const before = num(state.media.hypeLevel);
        state.media.hypeLevel = clamp(before + value, 0, 100);
        return { stat: target, before, after: state.media.hypeLevel, delta: state.media.hypeLevel - before, type: 'media' };
    }

    if (target === 'media.followers') {
        state.media ||= { followers: 0, hypeLevel: 0, feed: [], recentDilemma: null };
        const before = num(state.media.followers);
        state.media.followers = Math.max(0, Math.round(before + value));
        return { stat: target, before, after: state.media.followers, delta: state.media.followers - before, type: 'media' };
    }

    if (target === 'isInjured') {
        const before = Boolean(player.isInjured);
        player.isInjured = Boolean(value);
        return { stat: target, before, after: player.isInjured, delta: player.isInjured === before ? 0 : 1, type: 'state' };
    }

    if (target === 'injuryDuration') {
        const before = num(player.injuryDuration);
        player.injuryDuration = Math.max(0, Math.round(value));
        if (player.injuryDuration > 0) player.isInjured = true;
        return { stat: target, before, after: player.injuryDuration, delta: player.injuryDuration - before, type: 'state' };
    }

    if (target === 'canRetire' || target === 'careerEnded') {
        const before = Boolean(player[target]);
        player[target] = Boolean(value);
        return { stat: target, before, after: player[target], delta: 0, type: 'state' };
    }

    if (target?.startsWith?.('attributes.')) {
        const key = target.slice('attributes.'.length);
        const before = num(player.attributes?.[key], 50);
        player.attributes ||= {};
        player.attributes[key] = clamp(before + value, 0, 99);
        return { stat: target, before, after: player.attributes[key], delta: value, type: 'attribute' };
    }

    if (target?.startsWith?.('matchBonus.')) {
        player.temporaryEffects.push({
            id: consequence.id, stat: target, value,
            duration: consequence.duration, remainingMatches: consequence.duration,
            source: consequence.source, label: consequence.label
        });
        return { stat: target, before: 0, after: value, delta: value, type: 'temporary' };
    }

    return null;
}

function resolvePending(state, trigger = 'block_start') {
    if (!state?.player) return [];
    ensure(state.player);
    const revealed = [];

    for (const consequence of state.consequences || []) {
        if (consequence.resolved || consequence.trigger !== trigger) continue;
        consequence.remainingBlocks = num(consequence.remainingBlocks, consequence.delayBlocks) - 1;
        if (consequence.remainingBlocks > 0) continue;

        const change = applyStateTarget(state, consequence);
        consequence.resolved = true;
        consequence.revealed = true;
        consequence.resolvedAt = new Date().toISOString();
        consequence.result = change;
        revealed.push({ id: consequence.id, choiceId: consequence.choiceId, source: consequence.source, label: consequence.label, result: change });
    }

    if ((state.consequences || []).length > 80) state.consequences = state.consequences.slice(-80);
    return revealed;
}

export const ConsequenceSystem = {
    EMOTIONAL_LIMITS,
    LABELS,
    initialize(player) { ensure(player); return player; },
    normalizeChoice: normalize,
    apply(player, choice = {}, options = {}) { return queueChoice(options.state || { player }, choice, options); },
    applyToState(state, choice = {}, options = {}) { return queueChoice(state, choice, options); },
    applyCoachChoice(state, choice = {}) { return queueChoice(state, choice, { source: 'Coach' }); },
    applyEventChoice(state, choice = {}) { return queueChoice(state, choice, { source: 'Événement' }); },
    applyMediaChoice(state, choice = {}) { return queueChoice(state, choice, { source: 'Média' }); },

    // Les décisions prises pendant un match sont déjà consommées par MatchBlockManager.
    applyMatchChoice(player, choice = {}) {
        ensure(player);
        return { choiceId: choice.id || null, source: 'Match', hidden: true, revealed: false, queued: 0 };
    },

    resolvePending(state, trigger = 'block_start') { return resolvePending(state, trigger); },
    getTemporaryModifier(player, stat) { ensure(player); return player.temporaryEffects.filter(effect => effect.stat === stat).reduce((sum, effect) => sum + num(effect.value), 0); },
    getActiveModifiers(player) { ensure(player); return player.temporaryEffects.reduce((result, effect) => { result[effect.stat] = (result[effect.stat] || 0) + num(effect.value); return result; }, {}); },
    advanceMatch(player) {
        ensure(player);
        const expired = [];
        player.temporaryEffects = player.temporaryEffects.filter(effect => {
            effect.remainingMatches = num(effect.remainingMatches, effect.duration) - 1;
            if (effect.remainingMatches <= 0) { expired.push(effect); return false; }
            return true;
        });
        return expired;
    },
    preview() { return { hidden: true, message: 'Cette décision aura des conséquences. Certaines se révéleront plus tard.' }; },
    sanitize(choice = {}) { const copy = JSON.parse(JSON.stringify(choice)); delete copy.xp; delete copy.experience; return copy; }
};

export default ConsequenceSystem;
