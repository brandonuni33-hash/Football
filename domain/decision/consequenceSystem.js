// domain/decision/consequenceSystem.js
// Moteur canonique des conséquences de choix.
// Les valeurs chiffrées restent cachées au joueur.

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

const EMOTIONAL_LIMITS = {
    morale: [0, 100], confidence: [0, 100], mental: [0, 100],
    relationCoach: [0, 100], vestiaire: [0, 100], discipline: [0, 100],
    fame: [0, 100], reputation: [0, 100]
};

const LABELS = {
    morale: 'Moral', confidence: 'Confiance', mental: 'Mental',
    relationCoach: 'Relation avec le coach', vestiaire: 'Vestiaire', discipline: 'Discipline',
    fame: 'Image publique', reputation: 'Réputation', fitness: 'État physique',
    balance: 'Finances', injuryDuration: 'Indisponibilité'
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
    return {
        title: c.title || choice.title || null,
        message: c.message || choice.message || null,
        response: c.response || choice.response || null,
        permanent,
        temporary
    };
}

function randomDelay(effect = {}, source = 'Choix') {
    if (Number.isFinite(Number(effect.delayBlocks))) return Math.max(1, Math.min(4, Math.round(Number(effect.delayBlocks))));
    if (source === 'Match') return 1;
    return 1 + Math.floor(Math.random() * 3);
}

function createId(prefix = 'consequence') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildImmediateReaction(choice, normalized, source) {
    if (normalized.response) return normalized.response;
    const text = choice.text || choice.texte || choice.label || 'ta décision';
    const targets = Object.keys(normalized.permanent);
    const has = key => targets.includes(key) || normalized.temporary.some(effect => effect?.stat === key);
    const negative = key => num(normalized.permanent[key]) < 0;
    const positive = key => num(normalized.permanent[key]) > 0;
    if (has('relationCoach')) return negative('relationCoach') ? 'Le coach ne répond pas tout de suite. Son regard laisse pourtant comprendre qu’il n’a pas vraiment apprécié ta décision.' : 'Le coach acquiesce. Il semble avoir apprécié ta façon de gérer la situation.';
    if (has('vestiaire')) return negative('vestiaire') ? 'Quelques regards changent autour de toi. La décision ne fait visiblement pas l’unanimité dans le vestiaire.' : 'L’ambiance autour de toi semble s’améliorer. Certains coéquipiers apprécient clairement ton choix.';
    if (has('fitness') || has('injuryDuration') || has('isInjured')) return negative('fitness') || has('isInjured') ? 'Tu assumes ta décision, mais ton corps risque de te rappeler que chaque choix a un prix.' : 'Tu prends une décision prudente. Le staff semble rassuré par ton attitude.';
    if (has('balance')) return 'La décision a un coût concret. Tu assumes la dépense sans savoir encore ce qu’elle changera pour la suite.';
    if (has('fame') || has('reputation') || has('media.hypeLevel') || has('media.followers')) return positive('fame') || positive('reputation') || positive('media.hypeLevel') ? 'Ta décision commence à circuler. Pour l’instant, les réactions sont plutôt favorables.' : 'Ta décision attire quelques réactions. Il faudra voir comment la situation évolue.';
    if (has('discipline')) return negative('discipline') ? 'Tu sais que le staff a remarqué ton attitude. La suite dépendra surtout de ce que tu feras maintenant.' : 'Ton attitude est remarquée. Le staff semble apprécier ton sérieux.';
    if (source === 'Coach') return 'Le coach prend acte de ta réponse. Il attend maintenant de voir tes actes.';
    if (source === 'Média') return 'La réponse est publiée. Les premières réactions commencent déjà à apparaître.';
    return `Tu as choisi : « ${text} ». La décision est prise, et le monde autour de toi commence à réagir.`;
}

function visibilityFor(target, magnitude) {
    if (target === 'isInjured' || target === 'injuryDuration' || target === 'fitness') return magnitude < 0 ? 'probable' : 'immediate';
    if (target === 'relationCoach' || target === 'vestiaire') return 'probable';
    if (target === 'media.hypeLevel' || target === 'media.followers' || target === 'fame' || target === 'reputation') return 'indirect';
    if (target === 'balance') return 'immediate';
    if (target?.startsWith?.('attributes.')) return 'hidden';
    return 'indirect';
}

function memoryLabel(target, magnitude) {
    const label = LABELS[target] || LABELS[target?.split?.('.').pop()] || target || 'ta carrière';
    if (magnitude > 0) return `Ta décision a renforcé ${label.toLowerCase()}.`;
    if (magnitude < 0) return `Ta décision a fragilisé ${label.toLowerCase()}.`;
    return `Ta décision a laissé une trace dans ${label.toLowerCase()}.`;
}

function addMemory(state, entry) {
    state.careerMemory ||= [];
    state.careerMemory.push({ id: entry.id, type: 'choice', createdAt: entry.createdAt, age: state.player?.age ?? null, season: state.calendar?.currentSeasonYear ?? state.season ?? null, source: entry.source, choiceId: entry.choiceId, text: entry.choiceText, immediateReaction: entry.immediateReaction, trace: entry.trace, status: 'active' });
    if (state.careerMemory.length > 150) state.careerMemory = state.careerMemory.slice(-150);
}

function queueEffect(state, choiceId, effect, options = {}) {
    state.consequences ||= [];
    const source = options.source || 'Choix';
    const magnitude = num(effect.value ?? effect.magnitude);
    const target = effect.stat || effect.target;
    const delayBlocks = randomDelay(effect, source);
    return { id: createId(), choiceId, source, target, type: effect.type || 'modifier', magnitude, duration: Math.max(1, Math.min(6, Math.round(num(effect.duration, 1)))), delayBlocks, remainingBlocks: delayBlocks, visibility: visibilityFor(target, magnitude), label: effect.label || LABELS[target] || target || 'Conséquence', trigger: effect.trigger || 'block_start', createdAt: new Date().toISOString(), resolved: false, revealed: false };
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
    const immediateReaction = buildImmediateReaction(choice, normalized, options.source || 'Choix');
    const trace = queued.length ? queued.map(item => ({ id: item.id, visibility: item.visibility, hint: memoryLabel(item.target, item.magnitude) })) : [{ id: createId('trace'), visibility: 'indirect', hint: 'Cette décision pourra influencer la suite de ta carrière.' }];
    const memoryEntry = { id: createId('memory'), choiceId, source: options.source || 'Choix', choiceText: choice.text || choice.texte || choice.label || normalized.title || 'Décision', immediateReaction, trace, createdAt: new Date().toISOString() };
    addMemory(state, memoryEntry);
    state.lastChoiceReaction = { choiceId, source: memoryEntry.source, text: memoryEntry.choiceText, reaction: immediateReaction, traceCount: trace.length, createdAt: memoryEntry.createdAt };
    return { choiceId, source: memoryEntry.source, title: normalized.title || 'Décision prise', message: normalized.message || null, responseText: immediateReaction, immediateReaction, queued: queued.length, hidden: true, revealed: false, changes: [], temporary: [], memory: { recorded: true, traceCount: trace.length } };
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
    if (target === 'fitness') { const before = num(player.fitness, 90); const after = clamp(before + value, 0, 100); player.fitness = after; return { stat: target, before, after, delta: after - before, type: 'state' }; }
    if (target === 'balance') { state.career ||= { balance: 0, seasonHistory: [], totalCareerIncome: 0 }; const before = num(state.career.balance); state.career.balance = before + value; return { stat: target, before, after: state.career.balance, delta: value, type: 'economy' }; }
    if (target === 'media.hypeLevel') { state.media ||= { followers: 0, hypeLevel: 0, feed: [], recentDilemma: null }; const before = num(state.media.hypeLevel); state.media.hypeLevel = clamp(before + value, 0, 100); return { stat: target, before, after: state.media.hypeLevel, delta: state.media.hypeLevel - before, type: 'media' }; }
    if (target === 'media.followers') { state.media ||= { followers: 0, hypeLevel: 0, feed: [], recentDilemma: null }; const before = num(state.media.followers); state.media.followers = Math.max(0, Math.round(before + value)); return { stat: target, before, after: state.media.followers, delta: state.media.followers - before, type: 'media' }; }
    if (target === 'isInjured') { const before = Boolean(player.isInjured); player.isInjured = Boolean(value); return { stat: target, before, after: player.isInjured, delta: player.isInjured === before ? 0 : 1, type: 'state' }; }
    if (target === 'injuryDuration') { const before = num(player.injuryDuration); player.injuryDuration = Math.max(0, Math.round(value)); if (player.injuryDuration > 0) player.isInjured = true; return { stat: target, before, after: player.injuryDuration, delta: player.injuryDuration - before, type: 'state' }; }
    if (target === 'canRetire' || target === 'careerEnded') { const before = Boolean(player[target]); player[target] = Boolean(value); return { stat: target, before, after: player[target], delta: 0, type: 'state' }; }
    if (target?.startsWith?.('attributes.')) { const key = target.slice('attributes.'.length); const before = num(player.attributes?.[key], 50); player.attributes ||= {}; player.attributes[key] = clamp(before + value, 0, 99); return { stat: target, before, after: player.attributes[key], delta: value, type: 'attribute' }; }
    if (target?.startsWith?.('matchBonus.')) { player.temporaryEffects.push({ id: consequence.id, stat: target, value, duration: consequence.duration, remainingMatches: consequence.duration, source: consequence.source, label: consequence.label }); return { stat: target, before: 0, after: value, delta: value, type: 'temporary' }; }
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
        const memory = state.careerMemory?.find(entry => entry.choiceId === consequence.choiceId && entry.status === 'active');
        const hint = change?.delta > 0 ? `Tu commences à voir les effets positifs d’une décision prise plus tôt.` : change?.delta < 0 ? `Tu commences à voir les effets d’une décision prise plus tôt.` : `Une décision passée semble avoir laissé une trace.`;
        if (memory) { memory.status = 'resolved'; memory.resolution = { visibility: consequence.visibility, hint, resolvedAt: consequence.resolvedAt }; }
        revealed.push({ id: consequence.id, choiceId: consequence.choiceId, source: consequence.source, label: consequence.label, visibility: consequence.visibility, narrative: hint, result: consequence.visibility === 'hidden' ? null : change });
    }
    if ((state.consequences || []).length > 100) state.consequences = state.consequences.slice(-100);
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
    applyMatchChoice(player, choice = {}) { ensure(player); return { choiceId: choice.id || null, source: 'Match', hidden: true, revealed: false, queued: 0 }; },
    resolvePending(state, trigger = 'block_start') { return resolvePending(state, trigger); },
    getTemporaryModifier(player, stat) { ensure(player); return player.temporaryEffects.filter(effect => effect.stat === stat).reduce((sum, effect) => sum + num(effect.value), 0); },
    getActiveModifiers(player) { ensure(player); return player.temporaryEffects.reduce((result, effect) => { result[effect.stat] = (result[effect.stat] || 0) + num(effect.value); return result; }, {}); },
    advanceMatch(player) { ensure(player); const expired = []; player.temporaryEffects = player.temporaryEffects.filter(effect => { effect.remainingMatches = num(effect.remainingMatches, effect.duration) - 1; if (effect.remainingMatches <= 0) { expired.push(effect); return false; } return true; }); return expired; },
    preview() { return { hidden: true, message: 'Les valeurs exactes restent inconnues, mais tes choix auront des réactions et des traces dans ta carrière.' }; },
    sanitize(choice = {}) { const copy = JSON.parse(JSON.stringify(choice)); delete copy.xp; delete copy.experience; return copy; }
};

export default ConsequenceSystem;
