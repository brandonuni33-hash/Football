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

        // Les bornes sont recalculées AVANT de normaliser current.
        // Cela évite qu'une ancienne sauvegarde conserve des min/max incohérents.
        profile.min = Math.max(
            POTENTIAL_RULES.ABSOLUTE_MIN,
            profile.base - POTENTIAL_RULES.DELTA_LIMIT
        );
        profile.max = Math.min(
            profile.base + POTENTIAL_RULES.DELTA_LIMIT,
            POTENTIAL_RULES.EXCEPTIONAL_MAX
        );
        profile.exceptionalMax = clamp(
            n(profile.exceptionalMax, POTENTIAL_RULES.EXCEPTIONAL_MAX),
            profile.max,
            POTENTIAL_RULES.EXCEPTIONAL_MAX
        );

        profile.current = clamp(
            Math.round(n(profile.current, n(player.potential, profile.base))),
            profile.min,
            profile.exceptionalMax
        );
        profile.peakAge = clamp(Math.round(n(profile.peakAge, 22)), 15, 28);
        profile.peakStrength = clamp(n(profile.peakStrength, 1), 0.75, 1.25);
        profile.careerMomentum = clamp(n(profile.careerMomentum), -24, 24);
        profile.breakthroughAttempts = Math.max(0, Math.floor(n(profile.breakthroughAttempts, 0)));
        profile.legendaryAttempts = Math.max(0, Math.floor(n(profile.legendaryAttempts, 0)));
        profile.badSeasonStreak = Math.max(0, Math.floor(n(profile.badSeasonStreak, 0)));
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

        // Le repos récupère la forme mais ne doit jamais être interprété comme
        // une bonne performance de développement du potentiel.
        if (fitnessCost < 0 || trainingReport.name === 'Repos') {
            return;
        }

        const quality = clamp((xp - 80) / 120, -0.5, 1)
            - clamp(fitnessCost / 40, 0, 0.35);

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

        // Une saison moyenne ne donne rien automatiquement.
        // Une bonne saison donne +1/+2, une excellente +3.
        // Le seuil monte légèrement après 84 pour conserver la rareté du haut
        // potentiel sans rendre 85+ frustrant.
        if (adjusted <= -5) profile.badSeasonStreak += 1;
        else if (adjusted >= 0) profile.badSeasonStreak = 0;

        // Une seule mauvaise saison ne doit pas faire s'effondrer le potentiel.
        // Les vraies baisses apparaissent surtout lorsque la mauvaise trajectoire
        // se répète.
        if (profile.badSeasonStreak >= 7 && adjusted <= -18) return Math.random() < 0.65 ? -3 : -2;
        if (profile.badSeasonStreak >= 5 && adjusted <= -10) return Math.random() < 0.55 ? -2 : -1;
        if (profile.badSeasonStreak >= 3 && adjusted <= -5) return Math.random() < 0.45 ? -1 : 0;

        if (current < 82) {
            if (adjusted < 2) return 0;
            if (adjusted < 6) return 1;
            if (adjusted < 11) return 2;
            return 3;
        }

        // 82–83 : le joueur peut encore atteindre 84 normalement, mais le
        // rendement commence à ralentir.
        if (current < 84) {
            if (adjusted < 3) return 0;
            if (adjusted < 8) return 1;
            if (adjusted < 14) return 2;
            return 3;
        }

        // 84 est une zone de maîtrise : le premier passage à 85+ demande
        // une percée, puis le joueur peut de nouveau progresser normalement.
        if (current < 90) {
            if (adjusted < 4) return 0;
            if (adjusted < 9) return 1;
            if (adjusted < 15) return 2;
            return 3;
        }

        // Au-dessus de 90, chaque point supplémentaire demande une saison
        // d'élite, ce qui protège la rareté du 95+.
        if (adjusted < 5) return 0;
        if (adjusted < 10) return 1;
        if (adjusted < 16) return 2;
        return 3;
    },

    exceptionalUpgradeChance(player, momentum) {
        const profile = this.ensure(player);
        if (!profile) return 0;

        if (profile.current < 84 || momentum < POTENTIAL_RULES.EXCEPTIONAL_THRESHOLD) {
            return 0;
        }

        const state = this.getPeakState(player);

        if (profile.current < 90) {
            // On ne donne que quelques véritables occasions de franchir 84.
            // Cela évite qu'une carrière devienne mécaniquement exceptionnelle
            // simplement parce qu'elle dure longtemps.
            if (profile.breakthroughAttempts >= 4) return 0;
            if (state !== 'pic' && state !== 'fenetre_explosion' && momentum < 20) {
                return 0;
            }

            let chance = 0.45;
            if (state === 'pic') chance += 0.20;
            else if (state === 'fenetre_explosion') chance += 0.10;
            if (momentum >= 20) chance += 0.10;
            return clamp(chance, 0, 0.75);
        }

        // Une fois à 90+, la fenêtre légendaire dispose de davantage d'essais,
        // mais le franchissement de 95 reste une vraie rareté.
        if (profile.legendaryAttempts >= 8) return 0;

        let chance = 0.78;
        if (state === 'pic') chance += 0.08;
        else if (state === 'fenetre_explosion') chance += 0.05;
        if (momentum >= 20) chance += 0.05;
        if (profile.current >= 93) chance += 0.03;
        if (profile.current >= 95) chance += 0.02;

        return clamp(chance, 0, 0.30);
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

        // 84 est le plafond souple des carrières normales. Un joueur ne peut
        // pas passer directement de 83 à 86 avec un simple +3 : le franchissement
        // de 84 doit toujours passer par la mécanique de percée.
        if (oldPotential < 84) {
            target = Math.min(target, 84);
        }

        target = clamp(target, profile.min, profile.max);

        // Dépassement du plafond normal : uniquement dans une saison d'élite.
        // Une percée donne 1 point, exceptionnellement 2, afin d'éviter les
        // bonds artificiels vers 95+.
        const needsBreakthrough =
            oldPotential === 84 &&
            change > 0;

        const reachesNormalCap =
            change > 0 &&
            target >= profile.max &&
            oldPotential >= profile.max - 1;

        if (needsBreakthrough || reachesNormalCap) {
            const chance = this.exceptionalUpgradeChance(player, momentum);

            if (oldPotential < 90) profile.breakthroughAttempts += 1;
            else profile.legendaryAttempts += 1;

            if (Math.random() <= chance) {
                const breakthrough = Math.random() < 0.10 ? 2 : 1;
                target = Math.min(oldPotential + breakthrough, profile.exceptionalMax);
            } else if (oldPotential >= 84 && oldPotential < profile.max) {
                // Échec d'une tentative de percée : on reste stable, on ne
                // punit pas artificiellement une bonne carrière.
                target = oldPotential;
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
