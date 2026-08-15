// Progression canonique issue des faits d'un match.
// Aucun consommateur ne doit reconvertir une quantité d'XP en performance.
import { FOOTBALL_ATTRIBUTES, ensure, calculateOverall } from './playerSystem.js';

const clamp = (value, min = 0, max = 1) =>
    Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : 0));

export const MATCH_PROGRESSION_RULES = Object.freeze({
    matchesPerChapter: 6,
    maxOverallGainPerChapter: 1,
    maxFocusedAttributeGainPerChapter: 2,
    ledgerVersion: 1
});

const ROLE_FOCUS_ATTRIBUTE = Object.freeze({
    attacker: 'finition',
    midfielder: 'passe',
    defender: 'defense',
    goalkeeper: 'placement'
});

const TRAINING_FOCUS_ATTRIBUTE = Object.freeze({
    TECHNIQUE: 'controle',
    FINITION: 'finition',
    DEPLACEMENT: 'placement',
    DEFENSE: 'defense'
});

function roleOf(position) {
    const value = String(position || '').toUpperCase();
    if (['GK', 'GB', 'G'].includes(value)) return 'goalkeeper';
    if (['DC', 'CB', 'DD', 'DG', 'RB', 'LB', 'D', 'LAT'].includes(value)) return 'defender';
    if (['MC', 'CM', 'MOC', 'CAM', 'MD', 'MG', 'M', 'MDEF', 'MOFF'].includes(value)) return 'midfielder';
    return 'attacker';
}

function ageFactor(age) {
    if (age <= 15) return 1.18;
    if (age <= 17) return 1.12;
    if (age <= 21) return 1.04;
    if (age <= 24) return .90;
    if (age <= 27) return .74;
    if (age <= 30) return .54;
    if (age <= 34) return .30;
    return .16;
}

export function progressionFocusAttribute(player, { focusAttribute = null, trainingFocus = null } = {}) {
    const explicit = String(focusAttribute || '').trim();
    if (FOOTBALL_ATTRIBUTES.includes(explicit)) return explicit;
    const trained = TRAINING_FOCUS_ATTRIBUTE[String(trainingFocus || '').toUpperCase()];
    return trained || ROLE_FOCUS_ATTRIBUTE[roleOf(player?.position)] || 'controle';
}

function safeAttributeRecord(value = {}, fallback = 0) {
    const record = {};
    for (const key of FOOTBALL_ATTRIBUTES) record[key] = clamp(value?.[key] ?? fallback, 0, 99);
    return record;
}

function normalizeLedger(player) {
    const raw = player.matchProgression && typeof player.matchProgression === 'object'
        ? player.matchProgression
        : {};
    const sequence = Math.max(0, Math.floor(clamp(raw.sequence, 0, Number.MAX_SAFE_INTEGER)));
    const fractions = {};
    for (const key of FOOTBALL_ATTRIBUTES) fractions[key] = clamp(raw.fractions?.[key], 0, 8);
    const current = raw.current && typeof raw.current === 'object' ? raw.current : null;
    const normalizedCurrent = current ? {
        id: String(current.id || `short:${sequence}`),
        mode: current.mode === 'explicit' ? 'explicit' : 'automatic',
        matches: Math.min(
            MATCH_PROGRESSION_RULES.matchesPerChapter,
            Math.max(0, Math.floor(clamp(current.matches, 0, MATCH_PROGRESSION_RULES.matchesPerChapter)))
        ),
        baselineOverall: clamp(current.baselineOverall ?? player.overall, 1, 99),
        baselineAttributes: safeAttributeRecord(current.baselineAttributes, 0),
        gains: safeAttributeRecord(current.gains, 0),
        appliedMatchIds: [...new Set(
            (Array.isArray(current.appliedMatchIds) ? current.appliedMatchIds : [])
                .filter(value => value !== null && value !== undefined)
                .map(String)
        )].slice(-MATCH_PROGRESSION_RULES.matchesPerChapter)
    } : null;
    const appliedMatchIds = [...new Set([
        ...(Array.isArray(raw.appliedMatchIds) ? raw.appliedMatchIds : []),
        ...(normalizedCurrent?.appliedMatchIds || [])
    ].filter(value => value !== null && value !== undefined).map(String))];
    player.matchProgression = {
        version: MATCH_PROGRESSION_RULES.ledgerVersion,
        sequence,
        fractions,
        appliedMatchIds,
        current: normalizedCurrent
    };
    return player.matchProgression;
}

function openChapter(player, ledger, chapterId = null) {
    const explicit = chapterId !== null && chapterId !== undefined && String(chapterId).length > 0;
    const expectedId = explicit ? `chapter:${String(chapterId)}` : null;
    const current = ledger.current;
    const mustReset = !current
        || (explicit && (current.mode !== 'explicit' || current.id !== expectedId))
        || (!explicit && (current.mode !== 'automatic' || current.matches >= MATCH_PROGRESSION_RULES.matchesPerChapter));
    if (!mustReset) return current;

    ledger.sequence += 1;
    ledger.current = {
        id: expectedId || `short:${ledger.sequence}`,
        mode: explicit ? 'explicit' : 'automatic',
        matches: 0,
        baselineOverall: calculateOverall(player),
        baselineAttributes: safeAttributeRecord(player.attributes, 50),
        gains: safeAttributeRecord({}, 0),
        appliedMatchIds: []
    };
    return ledger.current;
}

function progressionFraction(player, result = {}) {
    const rating = clamp(result.rating, 0, 10);
    if (rating <= 0) return 0;
    const ratingQuality = clamp((rating - 5.5) / 3.5, 0, 1);
    const contributionQuality = Math.min(2, clamp(result.goals, 0, 20)) * .04
        + Math.min(2, clamp(result.assists, 0, 20)) * .03;
    const minutesFactor = clamp((result.minutesPlayed ?? 90) / 90, .25, 1);
    const ageMultiplier = ageFactor(Number(player.age) || 14);
    const remainingGap = Math.max(0, (Number(player.potential) || player.overall) - player.overall);
    if (remainingGap <= 0) return 0;
    const gapFactor = clamp(remainingGap / 12, .35, 1);
    const regularity = clamp(Number(player.mental?.regularite ?? 60) / 100, .65, 1);
    const consistency = clamp(Number(player.hidden?.consistency ?? 12) / 16, .65, 1);
    return clamp(
        (ratingQuality + contributionQuality) * .62 * minutesFactor * ageMultiplier * gapFactor * regularity * consistency,
        0,
        .60
    );
}

/**
 * Applique la progression d'une apparition à partir de faits de match.
 * Les fractions sont persistées sans modifier la forme des anciennes saves.
 */
export function applyMatchProgression(player, result = {}, options = {}) {
    if (!player) return null;
    ensure(player);
    const before = { overall: player.overall, attributes: { ...player.attributes } };
    if (result.playerPlayed === false || result.played === false || !Number.isFinite(Number(result.rating))) {
        return { applied: false, reason: 'no-appearance', before, after: before };
    }

    const ledger = normalizeLedger(player);
    const matchId = options.matchId ?? result.matchId ?? result.fixture?.id ?? null;
    const normalizedMatchId = matchId === null || matchId === undefined ? null : String(matchId);
    if (normalizedMatchId && ledger.appliedMatchIds.includes(normalizedMatchId)) {
        return {
            applied: false,
            reason: 'duplicate-match',
            matchId: normalizedMatchId,
            chapterId: ledger.current.id,
            before,
            after: before
        };
    }
    const chapter = openChapter(player, ledger, options.chapterId);
    if (chapter.mode === 'explicit' && chapter.matches >= MATCH_PROGRESSION_RULES.matchesPerChapter) {
        if (normalizedMatchId) ledger.appliedMatchIds.push(normalizedMatchId);
        return {
            applied: false,
            reason: 'chapter-complete',
            matchId: normalizedMatchId,
            chapterId: chapter.id,
            before,
            after: before
        };
    }

    const focusAttribute = progressionFocusAttribute(player, options);
    const fractionEarned = progressionFraction(player, result);
    ledger.fractions[focusAttribute] = clamp(Number(ledger.fractions[focusAttribute] || 0) + fractionEarned, 0, 8);
    chapter.matches = Math.min(MATCH_PROGRESSION_RULES.matchesPerChapter, chapter.matches + 1);
    if (normalizedMatchId) {
        ledger.appliedMatchIds.push(normalizedMatchId);
        chapter.appliedMatchIds.push(normalizedMatchId);
    }

    let attributeGain = 0;
    while (
        ledger.fractions[focusAttribute] + Number.EPSILON >= 1
        && Number(chapter.gains[focusAttribute] || 0) < MATCH_PROGRESSION_RULES.maxFocusedAttributeGainPerChapter
        && player.attributes[focusAttribute] < 99
    ) {
        const previousAttribute = player.attributes[focusAttribute];
        const previousOverall = player.overall;
        player.attributes[focusAttribute] = previousAttribute + 1;
        const candidateOverall = calculateOverall(player);
        const exceedsOverallCap = candidateOverall - chapter.baselineOverall > MATCH_PROGRESSION_RULES.maxOverallGainPerChapter;
        const exceedsPotential = candidateOverall > Math.max(previousOverall, Number(player.potential) || previousOverall);
        if (exceedsOverallCap || exceedsPotential) {
            player.attributes[focusAttribute] = previousAttribute;
            player.overall = previousOverall;
            break;
        }
        player.overall = candidateOverall;
        chapter.gains[focusAttribute] = Number(chapter.gains[focusAttribute] || 0) + 1;
        ledger.fractions[focusAttribute] = Math.max(0, ledger.fractions[focusAttribute] - 1);
        attributeGain += 1;
    }

    player.overall = calculateOverall(player);
    const after = { overall: player.overall, attributes: { ...player.attributes } };
    return {
        applied: true,
        matchId: normalizedMatchId,
        chapterId: chapter.id,
        chapterMatch: chapter.matches,
        chapterComplete: chapter.matches >= MATCH_PROGRESSION_RULES.matchesPerChapter,
        focusAttribute,
        fractionEarned: Number(fractionEarned.toFixed(6)),
        fractionalCarry: Number(ledger.fractions[focusAttribute].toFixed(6)),
        attributeGain,
        overallGain: after.overall - before.overall,
        chapterAttributeGain: Number(chapter.gains[focusAttribute] || 0),
        chapterOverallGain: after.overall - chapter.baselineOverall,
        before,
        after
    };
}

export default Object.freeze({
    rules: MATCH_PROGRESSION_RULES,
    applyMatchProgression,
    progressionFocusAttribute
});
