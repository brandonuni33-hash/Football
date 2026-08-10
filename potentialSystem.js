// potentialSystem.js
// Potentiel vivant : les performances de match font évoluer le plafond de carrière.
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export const POTENTIAL_RULES = {
    START_MIN: 75,
    START_MAX: 80,
    ABSOLUTE_MIN: 69,
    CAREER_MAX: 95,
    MIN_MATCHES_RELIABLE: 12,
    MIN_MATCHES_EXCEPTIONAL: 24,
    PEAK_MIN_AGE: 15,
    PEAK_MAX_AGE: 28,
    RETIREMENT_AVAILABLE_AGE: 34,
    CAREER_END_AGE: 42
};

function initialPotential() {
    const roll = Math.random();
    if (roll < .16) return 75;
    if (roll < .34) return 76;
    if (roll < .55) return 77;
    if (roll < .75) return 78;
    if (roll < .92) return 79;
    return 80;
}

function peakAge() {
    const weights = [10, 9, 9, 9, 9, 9, 9, 9, 8, 8, 7, 6, 5, 3];
    let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
    for (let index = 0; index < weights.length; index += 1) {
        roll -= weights[index];
        if (roll <= 0) return 15 + index;
    }
    return 28;
}

export function createPotentialProfile(base = null) {
    const start = clamp(
        Math.round(number(base, initialPotential())),
        POTENTIAL_RULES.START_MIN,
        POTENTIAL_RULES.START_MAX
    );

    return {
        base: start,
        current: start,
        min: Math.max(POTENTIAL_RULES.ABSOLUTE_MIN, start - 15),
        max: Math.min(POTENTIAL_RULES.CAREER_MAX, start + 15),
        peakAge: peakAge(),
        seasonPerformance: { weightedRating: 0, matches: 0 },
        history: []
    };
}

function ensure(player) {
    if (!player) return null;

    if (!player.potentialProfile) {
        const legacy = Number(player.potential);
        player.potentialProfile = createPotentialProfile(
            Number.isFinite(legacy) ? legacy : null
        );
        if (Number.isFinite(legacy)) {
            player.potentialProfile.current = clamp(
                Math.round(legacy),
                POTENTIAL_RULES.ABSOLUTE_MIN,
                player.potentialProfile.max
            );
        }
    }

    const profile = player.potentialProfile;
    profile.base = clamp(
        Math.round(number(profile.base, 78)),
        POTENTIAL_RULES.START_MIN,
        POTENTIAL_RULES.START_MAX
    );
    profile.min = Math.max(POTENTIAL_RULES.ABSOLUTE_MIN, profile.base - 15);
    profile.max = Math.min(POTENTIAL_RULES.CAREER_MAX, profile.base + 15);
    profile.peakAge = clamp(
        Math.round(number(profile.peakAge, 22)),
        POTENTIAL_RULES.PEAK_MIN_AGE,
        POTENTIAL_RULES.PEAK_MAX_AGE
    );
    profile.seasonPerformance ||= { weightedRating: 0, matches: 0 };
    profile.history ||= [];
    profile.current = clamp(
        Math.round(number(profile.current, profile.base)),
        profile.min,
        profile.max
    );
    player.potential = profile.current;
    return profile;
}

function seasonChange(player, report = {}) {
    const profile = ensure(player);
    const matches = Math.max(0, Math.round(number(report.matches)));
    const rating = number(report.averageRating);

    if (!profile || matches < POTENTIAL_RULES.MIN_MATCHES_RELIABLE || rating <= 0) {
        return 0;
    }

    if (rating < 5.8) {
        return matches >= 16 ? -1 : 0;
    }

    const current = profile.current;
    const threshold = current < 85
        ? 6.85
        : current < 90
            ? 7.05
            : current < 95
                ? 7.20
                : 7.40;

    if (rating < threshold) return 0;

    const chance = current < 85
        ? 1
        : current < 90
            ? .62
            : current < 95
                ? .18
                : 0;

    if (Math.random() >= chance) return 0;

    if (rating >= 7.85 && matches >= POTENTIAL_RULES.MIN_MATCHES_EXCEPTIONAL) {
        const exceptionalChance = current < 85
            ? .08
            : current < 90
                ? .045
                : current < 95
                    ? .015
                    : 0;
        if (Math.random() < exceptionalChance) return 2;
    }

    return 1;
}

export const PotentialSystem = {
    RULES: POTENTIAL_RULES,

    createProfile(base = null) {
        return createPotentialProfile(base);
    },

    ensure(player) {
        return ensure(player);
    },

    recordMatch(player, summary = {}, matches = 0) {
        const profile = ensure(player);
        const games = Math.max(0, number(matches));
        const rating = number(summary.rating ?? summary.averageRating);
        if (!profile || games <= 0 || rating <= 0) return;
        profile.seasonPerformance.weightedRating += rating * games;
        profile.seasonPerformance.matches += games;
    },

    getPeakMultiplier(player) {
        const profile = ensure(player);
        if (!profile) return 1;
        const distance = Math.abs(
            number(player.age, 14) - number(profile.peakAge, 22)
        );
        return distance === 0 ? 1.05 : distance <= 2 ? 1.02 : 1;
    },

    getPeakState(player) {
        const profile = ensure(player);
        if (!profile) return 'stable';
        const distance = Math.abs(
            number(player.age, 14) - number(profile.peakAge, 22)
        );
        if (distance === 0) return 'pic';
        if (distance <= 2) return 'fenetre_explosion';
        if (distance <= 5) return 'approche';
        return 'stable';
    },

    finalizeSeason(player, report = {}) {
        const profile = ensure(player);
        if (!profile) return null;

        const matches = Math.max(
            0,
            Math.round(number(report.matches, profile.seasonPerformance.matches))
        );
        const weightedAverage = profile.seasonPerformance.matches > 0
            ? profile.seasonPerformance.weightedRating / profile.seasonPerformance.matches
            : 0;
        const rating = number(report.averageRating, weightedAverage);
        const before = profile.current;
        const change = seasonChange(player, {
            matches,
            averageRating: rating
        });

        profile.current = clamp(
            before + change,
            profile.min,
            profile.max
        );
        player.potential = profile.current;

        const result = {
            season: report.seasonLabel || null,
            age: number(player.age, 14),
            before,
            after: profile.current,
            change,
            matches,
            averageRating: Number(rating.toFixed(2)),
            goals: Math.max(0, number(report.goals)),
            assists: Math.max(0, number(report.assists)),
            performanceDriven: true
        };

        profile.history.push(result);
        if (profile.history.length > 20) profile.history.shift();
        profile.seasonPerformance = { weightedRating: 0, matches: 0 };
        return result;
    },

    advanceAge(player) {
        if (!player) return;
        const profile = ensure(player);
        player.age = Math.min(POTENTIAL_RULES.CAREER_END_AGE, number(player.age, 14) + 1);
        if (profile) player.potential = profile.current;
    }
};

export default PotentialSystem;
