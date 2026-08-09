// potentialSystem.js
// Moteur de potentiel vivant : une seule évolution du potentiel au bilan
// de saison. Le potentiel reste une valeur cachée et n'est jamais une récompense
// automatique pour une bonne série de matchs.

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const n = (value, fallback = 0) => {
    if (value === null || value === undefined || value === '') return fallback;
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
};

export const POTENTIAL_RULES = {
    START_MIN: 75,
    START_MAX: 80,
    DELTA_LIMIT: 15,
    ABSOLUTE_MIN: 69,
    EXCEPTIONAL_MAX: 99,
    SEASON_CHANGE_MIN: -3,
    SEASON_CHANGE_MAX: 2,
    PEAK_MIN_AGE: 15,
    PEAK_MAX_AGE: 28,
    RETIREMENT_AVAILABLE_AGE: 34,
    CAREER_END_AGE: 42,
    MOMENTUM_MIN: -24,
    MOMENTUM_MAX: 24,
    EXCEPTIONAL_THRESHOLD: 4,
    LEGENDARY_THRESHOLD: 3
};

function weightedInitialPotential() {
    const roll = Math.random();
    if (roll < 0.16) return 75;
    if (roll < 0.34) return 76;
    if (roll < 0.55) return 77;
    if (roll < 0.75) return 78;
    if (roll < 0.92) return 79;
    return 80;
}

function generatePeakAge() {
    const weights = [10, 9, 9, 9, 9, 9, 9, 9, 8, 8, 7, 6, 5, 3];
    const total = weights.reduce((sum, value) => sum + value, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < weights.length; i += 1) {
        roll -= weights[i];
        if (roll <= 0) return POTENTIAL_RULES.PEAK_MIN_AGE + i;
    }
    return POTENTIAL_RULES.PEAK_MAX_AGE;
}

function generatePeakStrength() {
    return Number((0.88 + Math.random() * 0.30).toFixed(2));
}

export function createPotentialProfile(base = null) {
    const initial = clamp(
        Math.round(n(base, weightedInitialPotential())),
        POTENTIAL_RULES.START_MIN,
        POTENTIAL_RULES.START_MAX
    );

    return {
        base: initial,
        current: initial,
        min: Math.max(POTENTIAL_RULES.ABSOLUTE_MIN, initial - POTENTIAL_RULES.DELTA_LIMIT),
        max: Math.min(initial + POTENTIAL_RULES.DELTA_LIMIT, POTENTIAL_RULES.EXCEPTIONAL_MAX),
        exceptionalMax: POTENTIAL_RULES.EXCEPTIONAL_MAX,
        peakAge: generatePeakAge(),
        peakStrength: generatePeakStrength(),
        careerMomentum: 0,
        breakthroughAttempts: 0,
        legendaryAttempts: 0,
        badSeasonStreak: 0,
        seasonSignals: {
            performance: 0,
            training: 0,
            playingTime: 0,
            health: 0,
            decisions: 0,
            discipline: 0,
            coach: 0,
            risk: 0
        },
        history: []
    };
}

function ensureSignals(profile) {
    profile.seasonSignals ||= {};
    const defaults = {
        performance: 0,
        training: 0,
        playingTime: 0,
        health: 0,
        decisions: 0,
        discipline: 0,
        coach: 0,
        risk: 0
    };
    for (const [key, value] of Object.entries(defaults)) {
        profile.seasonSignals[key] = n(profile.seasonSignals[key], value);
    }
}

function syncProgressionCeilings(player) {
    const model = player?.progression;
    if (!model) return;

    const currentPotential = n(player.potentialProfile?.current, player.potential);
    const deltas = model.origineDeltas || model.origine?.deltas || null;
    model.plafondsStats ||= {};

    const attrs = ['vitesse', 'tir', 'passes', 'dribble', 'defense', 'physique', 'tete'];
    for (const attr of attrs) {
        const oldCap = n(model.plafondsStats[attr], currentPotential);
        const nuance = deltas ? Math.round(n(deltas[attr]) / 3) : 0;
        const desired = clamp(Math.round(currentPotential + nuance), 35, 99);
        const currentStat = n(model.stats?.[attr], 1);

        // Une baisse du potentiel ne retire jamais un point déjà acquis.
        // Elle réduit seulement la marge future.
        model.plafondsStats[attr] = Math.max(currentStat, desired, Math.min(oldCap, currentStat));
    }
}

export const PotentialSystem = {
    RULES: POTENTIAL_RULES,

    createProfile(base = null) {
        return createPotentialProfile(base);
    },

    ensure(player) {
        if (!player) return null;

        const numericPotential = Number(player.potential);
        if (!player.potentialProfile) {
            const legacyBase = Number.isFinite(numericPotential)
                ? clamp(Math.round(numericPotential), POTENTIAL_RULES.START_MIN, POTENTIAL_RULES.START_MAX)
                : null;
            player.potentialProfile = createPotentialProfile(legacyBase);
            if (Number.isFinite(numericPotential)) {
                // Migration sans perte : une ancienne sauvegarde à 90+ conserve
                // son potentiel au lieu d'être ramenée artificiellement à 75–80.
                player.potentialProfile.current = clamp(
                    Math.round(numericPotential),
                    POTENTIAL_RULES.ABSOLUTE_MIN,
                    POTENTIAL_RULES.EXCEPTIONAL_MAX
                );
            }
        }

        const profile = player.potentialProfile;
        profile.base = clamp(Math.round(n(profile.base, 78)), 75, 80);
        profile.min = Math.max(POTENTIAL_RULES.ABSOLUTE_MIN, profile.base - POTENTIAL_RULES.DELTA_LIMIT);
        profile.max = Math.min(profile.base + POTENTIAL_RULES.DELTA_LIMIT, POTENTIAL_RULES.EXCEPTIONAL_MAX);
        profile.exceptionalMax = clamp(
            n(profile.exceptionalMax, POTENTIAL_RULES.EXCEPTIONAL_MAX),
            profile.max,
            POTENTIAL_RULES.EXCEPTIONAL_MAX
        );

        const current = Math.round(n(profile.current, n(player.potential, profile.base)));
        // Le potentiel reste la limite de carrière : une ancienne sauvegarde
        // dont l'OVR dépasse ce plafond est réparée en ramenant l'OVR au potentiel,
        // jamais en gonflant artificiellement le potentiel.
        profile.current = clamp(
            current,
            profile.min,
            profile.exceptionalMax
        );
        if (player.overall !== undefined && n(player.overall) > profile.current) {
            player.overall = profile.current;
            if (player.progression) player.progression.general = profile.current;
        }

        profile.peakAge = clamp(Math.round(n(profile.peakAge, 22)), 15, 28);
        profile.peakStrength = clamp(n(profile.peakStrength, 1), 0.75, 1.25);
        profile.careerMomentum = clamp(n(profile.careerMomentum), -24, 24);
        profile.breakthroughAttempts = Math.max(0, Math.floor(n(profile.breakthroughAttempts, 0)));
        profile.legendaryAttempts = Math.max(0, Math.floor(n(profile.legendaryAttempts, 0)));
        profile.badSeasonStreak = Math.max(0, Math.floor(n(profile.badSeasonStreak, 0)));
        profile.history ||= [];
        ensureSignals(profile);

        player.potential = profile.current;
        if (player.progression) {
            player.progression.potentielMax = profile.current;
            syncProgressionCeilings(player);
        }

        return profile;
    },

    addMomentum(player, amount, category = 'decisions') {
        const profile = this.ensure(player);
        if (!profile || !Number.isFinite(Number(amount))) return 0;

        const value = n(amount);
        profile.careerMomentum = clamp(
            profile.careerMomentum + value,
            POTENTIAL_RULES.MOMENTUM_MIN,
            POTENTIAL_RULES.MOMENTUM_MAX
        );
        if (profile.seasonSignals[category] === undefined) category = 'decisions';
        profile.seasonSignals[category] = n(profile.seasonSignals[category]) + value;
        return profile.careerMomentum;
    },

    recordMatch(player, summary = {}, matches = 0) {
        if (!player) return;
        const profile = this.ensure(player);
        const games = Math.max(0, n(matches));
        if (!games) return;

        const rating = n(summary.rating, 6);
        // Les performances alimentent le momentum sans transformer une saison
        // correcte en saison exceptionnelle.
        const ratingSignal = clamp((rating - 6.2) * games * 0.07, -1.0, 1.0);
        const goalSignal = clamp(n(summary.goals) * 0.10, 0, 0.6);
        const assistSignal = clamp(n(summary.assists) * 0.07, 0, 0.5);
        const cardPenalty = clamp(n(summary.yellowCards) * 0.12, 0, 0.5);

        this.addMomentum(player, ratingSignal + goalSignal + assistSignal - cardPenalty, 'performance');
        profile.seasonSignals.playingTime += clamp(games * 0.10, 0, 1.0);

        if (summary.injured) this.addMomentum(player, -1.5, 'health');
    },

    recordTraining(player, trainingReport = {}) {
        if (!player) return;
        const xp = n(trainingReport.xp, 0);
        const fitnessCost = n(trainingReport.fitnessCost, 0);

        if (fitnessCost < 0 || trainingReport.name === 'Repos') return;

        const quality = clamp((xp - 120) / 300, -0.4, 0.8)
            - clamp(fitnessCost / 60, 0, 0.25);

        this.addMomentum(player, quality * 0.20, 'training');
    },

    recordConsequenceChanges(player, changes = []) {
        if (!player || !Array.isArray(changes)) return;

        let signal = 0;
        for (const change of changes) {
            const delta = n(change.delta);
            const stat = String(change.stat || '');
            if (!delta) continue;

            if (stat === 'morale') signal += delta * 0.06;
            else if (stat === 'discipline') signal += delta * 0.10;
            else if (stat === 'relationCoach') signal += delta * 0.08;
            else if (stat === 'fitness') signal += delta * 0.03;
            else if (stat === 'fame' || stat === 'reputation') signal += delta * 0.03;
            else if (stat.startsWith('attributes.')) signal += delta * 0.05;
        }

        this.addMomentum(player, clamp(signal, -1.2, 1.2), 'decisions');
    },

    getPeakMultiplier(player) {
        const profile = this.ensure(player);
        if (!profile) return 1;

        const age = n(player.age, 14);
        const distance = Math.abs(age - profile.peakAge);
        const gaussian = Math.exp(-(distance * distance) / (2 * 2.6 * 2.6));
        const ageFactor = age < profile.peakAge
            ? 0.90 + gaussian * 0.20
            : 0.82 + gaussian * 0.32;
        return clamp(ageFactor * profile.peakStrength, 0.72, 1.20);
    },

    getPeakState(player) {
        const profile = this.ensure(player);
        if (!profile) return 'stable';
        const distance = Math.abs(n(player.age, 14) - profile.peakAge);
        if (distance === 0) return 'pic';
        if (distance <= 2) return 'fenetre_explosion';
        if (distance <= 5) return 'approche';
        return 'stable';
    },

    calculateSeasonMomentum(player) {
        const profile = this.ensure(player);
        return profile ? clamp(n(profile.careerMomentum), -24, 24) : 0;
    },

    momentumToPotentialChange(player, momentum) {
        const profile = this.ensure(player);
        if (!profile) return 0;

        const adjusted = momentum * this.getPeakMultiplier(player);
        const current = profile.current;

        if (adjusted <= -5) profile.badSeasonStreak += 1;
        else if (adjusted >= 1) profile.badSeasonStreak = 0;

        if (profile.badSeasonStreak >= 6 && adjusted <= -12) return Math.random() < 0.55 ? -2 : -1;
        if (profile.badSeasonStreak >= 4 && adjusted <= -7) return Math.random() < 0.50 ? -1 : 0;
        if (profile.badSeasonStreak >= 2 && adjusted <= -5) return Math.random() < 0.50 ? -1 : 0;

        if (current < 82) {
            if (adjusted < 4) return 0;
            if (adjusted < 8) return 1;
            return 2;
        }

        if (current < 85) {
            if (adjusted < 3.5) return 0;
            if (adjusted < 8) return 1;
            return 2;
        }

        if (current < 90) {
            if (adjusted < 4) return 0;
            if (adjusted < 8) return 1;
            return 2;
        }

        if (adjusted < 6) return 0;
        if (adjusted < 10) return 1;
        return 2;
    },

    exceptionalUpgradeChance(player, momentum) {
        const profile = this.ensure(player);
        if (!profile) return 0;

        const state = this.getPeakState(player);
        const current = profile.current;

        // 84 -> 85+ : la percée est possible, mais seulement sur une vraie
        // saison d'élite, idéalement autour du pic individuel.
        if (current === 84) {
            if (momentum < POTENTIAL_RULES.EXCEPTIONAL_THRESHOLD) return 0;
            if (profile.breakthroughAttempts >= 6) return 0;

            let chance = 0.03;
            if (state === 'pic') chance += 0.06;
            else if (state === 'fenetre_explosion') chance += 0.03;
            if (momentum >= 10) chance += 0.03;
            return clamp(chance, 0, 0.17);
        }

        // 85–89 : progresser est possible normalement, mais dépasser le plafond
        // individuel demande encore une percée rare.
        if (current < 90) {
            if (momentum < 4 || profile.breakthroughAttempts >= 9) return 0;
            let chance = 0.42;
            if (state === 'pic') chance += 0.10;
            else if (state === 'fenetre_explosion') chance += 0.05;
            if (momentum >= 10) chance += 0.03;
            return clamp(chance, 0, 0.55);
        }

        // 90+ : zone légendaire. Le 95+ doit rester rare, même avec plusieurs
        // années de haut niveau.
        if (momentum < 3 || profile.legendaryAttempts >= 18) return 0;
        let chance = 0.35;
        if (state === 'pic') chance += 0.05;
        else if (state === 'fenetre_explosion') chance += 0.025;
        if (momentum >= 10) chance += 0.03;
        if (current >= 94) chance += 0.04;
        return clamp(chance, 0.20, 0.44);
    },

    refreshProgressionCaps(player) {
        const profile = this.ensure(player);
        if (!profile || !player.progression) return;
        player.progression.potentielMax = profile.current;
        syncProgressionCeilings(player);
    },

    finalizeSeason(player, seasonSummary = {}) {
        if (!player) return null;
        const profile = this.ensure(player);
        const momentum = this.calculateSeasonMomentum(player);
        const oldPotential = profile.current;
        let change = clamp(
            this.momentumToPotentialChange(player, momentum),
            POTENTIAL_RULES.SEASON_CHANGE_MIN,
            POTENTIAL_RULES.SEASON_CHANGE_MAX
        );

        let target = oldPotential + change;

        // La zone 85+ ne doit pas être atteinte automatiquement depuis 83 :
        // 84 est le dernier palier normal avant une vraie percée.
        if (oldPotential < 84) target = Math.min(target, 84);

        const needsBreakthrough = oldPotential === 84 && change > 0;
        const reachesNormalCap = change > 0 && oldPotential >= profile.max - 1;

        if (needsBreakthrough || reachesNormalCap) {
            const chance = this.exceptionalUpgradeChance(player, momentum);
            if (oldPotential < 90) profile.breakthroughAttempts += 1;
            else profile.legendaryAttempts += 1;

            if (Math.random() <= chance) {
                // +1 presque toujours ; +2 seulement dans une saison vraiment
                // exceptionnelle et autour du pic.
                const doubleJump = oldPotential >= 90 && momentum >= 8 && Math.random() < 0.50;
                target = oldPotential + (doubleJump ? 2 : 1);
            } else if (oldPotential >= 84) {
                target = oldPotential;
            }
        }

        profile.current = clamp(target, profile.min, profile.exceptionalMax);

        player.potential = profile.current;
        this.refreshProgressionCaps(player);

        profile.history.push({
            age: n(player.age, 14),
            potentialBefore: oldPotential,
            potentialAfter: profile.current,
            change: profile.current - oldPotential,
            momentum: Number(momentum.toFixed(2)),
            peakAge: profile.peakAge,
            peakState: this.getPeakState(player),
            peakMultiplier: Number(this.getPeakMultiplier(player).toFixed(3)),
            ...seasonSummary
        });

        profile.careerMomentum = 0;
        for (const key of Object.keys(profile.seasonSignals)) profile.seasonSignals[key] = 0;

        return {
            oldPotential,
            newPotential: profile.current,
            change: profile.current - oldPotential,
            momentum: Number(momentum.toFixed(2)),
            peakAge: profile.peakAge,
            peakState: this.getPeakState(player),
            peakMultiplier: Number(this.getPeakMultiplier(player).toFixed(3)),
            historyEntry: profile.history.at(-1)
        };
    },

    advanceAge(player) {
        if (!player) return;
        player.age = Math.min(POTENTIAL_RULES.CAREER_END_AGE, n(player.age, 14) + 1);
        if (player.progression) player.progression.age = player.age;
        player.canRetire = player.age >= POTENTIAL_RULES.RETIREMENT_AVAILABLE_AGE;
        player.careerEnded = player.age >= POTENTIAL_RULES.CAREER_END_AGE;
    },

    getCareerStatus(player) {
        const age = n(player?.age, 14);
        return {
            canRetire: age >= POTENTIAL_RULES.RETIREMENT_AVAILABLE_AGE,
            forcedRetirement: age >= POTENTIAL_RULES.CAREER_END_AGE,
            yearsUntilRetirementOption: Math.max(0, POTENTIAL_RULES.RETIREMENT_AVAILABLE_AGE - age),
            yearsUntilCareerEnd: Math.max(0, POTENTIAL_RULES.CAREER_END_AGE - age)
        };
    }
};

export default PotentialSystem;
