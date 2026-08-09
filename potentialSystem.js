// potentialSystem.js
// Moteur de potentiel vivant : le potentiel de départ est une base cachée,
// puis évolue une seule fois par saison selon la carrière réelle du joueur.
//
// Règles principales :
// - départ : 75–80 ;
// - variation normale : jusqu'à base +15 ;
// - plancher de carrière : 69 ;
// - 95+ est une zone légendaire accessible à toutes les bases, mais seulement
//   après une excellente trajectoire et une fenêtre d'explosion bien exploitée ;
// - âge d'explosion individuel : 15–28 ans ;
// - l'explosion accélère la conversion du momentum en potentiel, elle ne
//   donne jamais directement des points d'OVR ;
// - les signaux sont accumulés pendant la saison, puis consommés au bilan.

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
    SEASON_CHANGE_MAX: 3,
    PEAK_MIN_AGE: 15,
    PEAK_MAX_AGE: 28,
    RETIREMENT_AVAILABLE_AGE: 34,
    CAREER_END_AGE: 42,
    MOMENTUM_MIN: -24,
    MOMENTUM_MAX: 24,
    EXCEPTIONAL_THRESHOLD: 14,
    LEGENDARY_THRESHOLD: 18
};

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function weightedInitialPotential() {
    // Centre de gravité 77–78, tout en gardant 75 et 80 possibles.
    const roll = Math.random();
    if (roll < 0.18) return 75;
    if (roll < 0.36) return 76;
    if (roll < 0.56) return 77;
    if (roll < 0.74) return 78;
    if (roll < 0.90) return 79;
    return 80;
}

function generatePeakAge() {
    // Tous les âges 15–28 sont possibles, mais les extrêmes sont plus rares.
    const weights = [
        10, 9, 9, 9, 9, 9, 9, 9, 8, 8, 7, 6, 5, 3
    ];
    const total = weights.reduce((sum, value) => sum + value, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < weights.length; i += 1) {
        roll -= weights[i];
        if (roll <= 0) return POTENTIAL_RULES.PEAK_MIN_AGE + i;
    }
    return POTENTIAL_RULES.PEAK_MAX_AGE;
}

function generatePeakStrength() {
    // La force du pic reste modérée : elle modifie surtout la vitesse de
    // développement autour du pic, pas le potentiel directement.
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
        max: initial + POTENTIAL_RULES.DELTA_LIMIT,
        exceptionalMax: POTENTIAL_RULES.EXCEPTIONAL_MAX,
        peakAge: generatePeakAge(),
        peakStrength: generatePeakStrength(),
        careerMomentum: 0,
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
    if (!player?.progression) return;
    const model = player.progression;
    const currentPotential = n(player.potentialProfile?.current, player.potential);
    const deltas = model?.origine && model?.origineDeltas ? model.origineDeltas : null;

    // On conserve les plafonds déjà calculés quand l'origine n'est plus
    // disponible dans une ancienne sauvegarde. Sinon, on les recalcule autour
    // du nouveau potentiel sans jamais faire redescendre une stat existante.
    model.plafondsStats ||= {};
    const attrs = ['vitesse', 'tir', 'passes', 'dribble', 'defense', 'physique', 'tete'];
    for (const attr of attrs) {
        const oldCap = n(model.plafondsStats[attr], currentPotential);
        const nuance = deltas ? Math.round(n(deltas[attr]) / 3) : 0;
        const desired = clamp(Math.round(currentPotential + nuance), 35, 99);
        const currentStat = n(model.stats?.[attr], 1);
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
                ? clamp(Math.round(numericPotential), 75, 80)
                : null;
            player.potentialProfile = createPotentialProfile(legacyBase);
        }

        const profile = player.potentialProfile;
        profile.base = clamp(Math.round(n(profile.base, 78)), 75, 80);
        profile.current = clamp(
            Math.round(n(profile.current, n(player.potential, profile.base))),
            profile.min ?? profile.base - 15,
            profile.exceptionalMax ?? profile.max ?? profile.base + 15
        );
        profile.min = Math.max(POTENTIAL_RULES.ABSOLUTE_MIN, profile.base - POTENTIAL_RULES.DELTA_LIMIT);
        profile.max = profile.base + POTENTIAL_RULES.DELTA_LIMIT;
        profile.exceptionalMax = clamp(n(profile.exceptionalMax, POTENTIAL_RULES.EXCEPTIONAL_MAX), profile.max, POTENTIAL_RULES.EXCEPTIONAL_MAX);
        profile.peakAge = clamp(Math.round(n(profile.peakAge, 22)), 15, 28);
        profile.peakStrength = clamp(n(profile.peakStrength, 1), 0.75, 1.25);
        profile.careerMomentum = clamp(n(profile.careerMomentum), -24, 24);
        profile.history ||= [];
        ensureSignals(profile);

        // Compatibilité avec l'ancien modèle : le jeu continue à lire
        // player.potential comme une valeur numérique.
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
        profile.seasonSignals[category] = n(profile.seasonSignals[category]) + value;
        return profile.careerMomentum;
    },

    recordMatch(player, summary = {}, matches = 0) {
        if (!player) return;
        const profile = this.ensure(player);
        const games = Math.max(0, n(matches));
        if (!games) return;

        const rating = n(summary.rating, 6);
        const ratingSignal = clamp((rating - 6.2) * games * 0.55, -4, 4);
        const goalSignal = clamp(n(summary.goals) * 0.65, 0, 2.5);
        const assistSignal = clamp(n(summary.assists) * 0.45, 0, 2);
        const cardPenalty = clamp(n(summary.yellowCards) * 0.35, 0, 1.5);

        this.addMomentum(player, ratingSignal + goalSignal + assistSignal - cardPenalty, 'performance');
        profile.seasonSignals.playingTime += clamp(games * 0.22, 0, 1.5);

        if (summary.injured) {
            this.addMomentum(player, -1.5, 'health');
        }
    },

    recordTraining(player, trainingReport = {}) {
        if (!player) return;
        const xp = n(trainingReport.xp, 0);
        const fitnessCost = n(trainingReport.fitnessCost, 0);
        const fitness = n(player.fitness, 80);
        const quality = clamp((xp - 80) / 120, -0.5, 1) - clamp(fitnessCost / 40, -0.2, 0.35);
        this.addMomentum(player, quality * 0.35, 'training');
    },

    recordConsequenceChanges(player, changes = []) {
        if (!player || !Array.isArray(changes)) return;

        let signal = 0;
        for (const change of changes) {
            const delta = n(change.delta);
            const stat = String(change.stat || '');
            if (!delta) continue;

            if (stat === 'morale') signal += delta * 0.10;
            else if (stat === 'discipline') signal += delta * 0.16;
            else if (stat === 'relationCoach') signal += delta * 0.12;
            else if (stat === 'fitness') signal += delta * 0.06;
            else if (stat === 'fame' || stat === 'reputation') signal += delta * 0.05;
            else if (stat.startsWith('attributes.')) signal += delta * 0.08;
        }

        this.addMomentum(player, clamp(signal, -2, 2), 'decisions');
    },

    getPeakMultiplier(player) {
        const profile = this.ensure(player);
        if (!profile) return 1;

        const age = n(player.age, 14);
        const distance = Math.abs(age - profile.peakAge);
        const gaussian = Math.exp(-(distance * distance) / (2 * 2.4 * 2.4));
        const raw = 0.86 + gaussian * 0.38 * profile.peakStrength;

        // Le joueur peut déjà développer avant son pic et après son pic,
        // mais la fenêtre d'explosion augmente clairement le rendement.
        return clamp(raw, 0.78, 1.28);
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
        if (!profile) return 0;
        ensureSignals(profile);

        // careerMomentum est la valeur agrégée ; seasonSignals ne sert qu'à
        // expliquer le bilan et ne doit surtout pas être additionné une seconde fois.
        return clamp(n(profile.careerMomentum), -24, 24);
    },

    momentumToPotentialChange(player, momentum) {
        const profile = this.ensure(player);
        if (!profile) return 0;

        const peakMultiplier = this.getPeakMultiplier(player);
        const adjusted = momentum * peakMultiplier;
        const current = profile.current;
        let change = 0;

        // On veut que la majorité des carrières se stabilisent autour de 82–84,
        // sans empêcher les très bonnes trajectoires de dépasser 85.
        // Sous 80 : développement encore assez accessible.
        // 80–83 : progression normale.
        // 84+ : chaque point supplémentaire demande une saison plus forte.
        const positive1 = current < 84 ? 0 : current === 84 ? 12 : current < 90 ? 5 : 3;
        const positive2 = current < 84 ? 7 : current === 84 ? 20 : current < 90 ? 14 : 10;
        const positive3 = current < 84 ? 12 : current === 84 ? 28 : current < 90 ? 22 : 18;

        if (adjusted <= -28) change = -3;
        else if (adjusted <= -20) change = -2;
        else if (adjusted <= -11) change = -1;
        else if (adjusted < positive1) change = 0;
        else if (adjusted < positive2) change = 1;
        else if (adjusted < positive3) change = 2;
        else change = 3;

        return clamp(change, POTENTIAL_RULES.SEASON_CHANGE_MIN, POTENTIAL_RULES.SEASON_CHANGE_MAX);
    },

    exceptionalUpgradeChance(player, momentum) {
        const profile = this.ensure(player);
        if (!profile) return 0;

        // Zone exceptionnelle : on peut dépasser base + 15, mais seulement
        // après avoir déjà construit une très grosse carrière.
        if (profile.current < 90) return 0;

        const state = this.getPeakState(player);
        const peakBonus = state === 'pic' ? 0.10 : state === 'fenetre_explosion' ? 0.06 : 0.02;
        const momentumBonus = Math.max(0, momentum - 8) * 0.012;
        const currentBonus = Math.max(0, profile.current - 90) * 0.025;

        // Environ 5 % des carrières doivent pouvoir franchir 95+, mais la
        // probabilité est conditionnée par une vraie carrière d'élite.
        return clamp(0.55 + peakBonus + momentumBonus + currentBonus, 0.12, 0.95);
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
        let change = this.momentumToPotentialChange(player, momentum);

        let target = oldPotential + change;
        target = clamp(target, profile.min, profile.max);

        // Le plafond normal reste base + 15. Le dépasser est une percée
        // exceptionnelle et ne donne jamais plus d'un point supplémentaire
        // par saison.
        if (oldPotential >= profile.max && change > 0) {
            const chance = this.exceptionalUpgradeChance(player, momentum);
            if (Math.random() <= chance) {
                target = Math.min(oldPotential + (Math.random() < 0.20 ? 2 : 1), profile.exceptionalMax);
            }
        } else if (oldPotential >= profile.max - 1 && target >= profile.max && momentum >= POTENTIAL_RULES.EXCEPTIONAL_THRESHOLD) {
            const chance = this.exceptionalUpgradeChance(player, momentum);
            if (Math.random() <= chance) {
                target = Math.min(oldPotential + (Math.random() < 0.20 ? 2 : 1), profile.exceptionalMax);
            }
        }

        // Une saison catastrophique pendant la fenêtre d'explosion peut faire
        // rater une partie du développement ; une excellente saison permet au
        // contraire de profiter davantage du pic.
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
