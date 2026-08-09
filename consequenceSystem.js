/**
 * consequenceSystem.js
 * Centralise les conséquences des choix :
 * - bonus / malus permanents
 * - bonus / malus temporaires
 * - XP
 * - confiance
 * - discipline
 * - réputation
 * - relation coach
 * - vestiaire
 * - aperçu des conséquences pour l'UI
 *
 * Philosophie d'équilibrage :
 * - les choix ne donnent presque jamais directement de l'OVR ;
 * - les petits choix restent autour de ±1 / ±2 ;
 * - les bonus de performance sont temporaires ;
 * - les valeurs sont bornées ;
 * - les effets temporaires expirent automatiquement.
 */

const LIMITS = {
    confidence: [0, 100],
    discipline: [0, 100],
    reputation: [0, 100],
    relationCoach: [0, 100],
    vestiaire: [0, 100],
    form: [0, 100],
    fitness: [0, 100],
    mental: [0, 100]
};

const LABELS = {
    confidence: "Confiance",
    discipline: "Discipline",
    reputation: "Réputation",
    relationCoach: "Relation coach",
    vestiaire: "Vestiaire",
    form: "Forme",
    fitness: "Condition physique",
    mental: "Mental",
    technique: "Technique",
    physique: "Physique",
    passe: "Passe",
    defense: "Défense",
    dribble: "Dribble",
    tir: "Tir"
};

const clamp = (value, min, max) => {
    return Math.min(max, Math.max(min, value));
};

const num = (value, fallback = 0) => {
    return Number.isFinite(Number(value))
        ? Number(value)
        : fallback;
};

function ensurePlayer(player) {
    if (!player) {
        throw new Error(
            "ConsequenceSystem : joueur manquant."
        );
    }

    player.stats ||= {};
    player.attributes ||= {};
    player.temporaryEffects ||= [];

    const defaults = {
        confidence: 50,
        discipline: 50,
        reputation: 20,
        relationCoach: 50,
        vestiaire: 50,
        mental: 50
    };

    for (const [key, value] of Object.entries(defaults)) {
        if (player.stats[key] === undefined) {
            player.stats[key] = value;
        }
    }

    if (player.form === undefined) {
        player.form = 75;
    }

    if (player.fitness === undefined) {
        player.fitness = 100;
    }

    if (player.xp === undefined) {
        player.xp = 0;
    }

    return player;
}

function getContainer(player, stat) {
    if (
        LIMITS[stat] ||
        Object.prototype.hasOwnProperty.call(
            player.stats,
            stat
        )
    ) {
        return player.stats;
    }

    if (
        Object.prototype.hasOwnProperty.call(
            player.attributes,
            stat
        )
    ) {
        return player.attributes;
    }

    return player.stats;
}

function applyPermanent(player, stat, delta) {
    const container = getContainer(player, stat);

    const before = num(container[stat]);
    const rawAfter = before + num(delta);

    const limits = LIMITS[stat];

    container[stat] = limits
        ? clamp(
            rawAfter,
            limits[0],
            limits[1]
        )
        : Math.max(0, rawAfter);

    return {
        type: "permanent",
        stat,
        label: LABELS[stat] || stat,
        before,
        after: container[stat],
        delta: container[stat] - before
    };
}

function normalizeTemporary(effect) {
    if (!effect || !effect.stat) {
        return null;
    }

    const duration = clamp(
        Math.round(
            num(effect.duration, 1)
        ),
        1,
        3
    );

    return {
        id:
            effect.id ||
            `effect_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 7)}`,

        stat: effect.stat,

        value: num(effect.value),

        duration,

        remainingMatches: duration,

        source: effect.source || "Choix",

        label:
            effect.label ||
            LABELS[effect.stat] ||
            effect.stat,

        description:
            effect.description || null
    };
}

export const ConsequenceSystem = {

    LIMITS,

    LABELS,

    /**
     * Initialise les structures nécessaires.
     */
    initialize(player) {
        return ensurePlayer(player);
    },

    /**
     * Applique une conséquence.
     *
     * Exemple :
     *
     * {
     *     permanent: {
     *         relationCoach: 2,
     *         confidence: -1
     *     },
     *
     *     temporary: [
     *         {
     *             stat: "matchPerformance",
     *             value: 0.03,
     *             duration: 2
     *         }
     *     ],
     *
     *     xp: 10
     * }
     */
    apply(
        player,
        consequence = {},
        options = {}
    ) {
        ensurePlayer(player);

        const permanent =
            consequence.permanent ||
            consequence.stats ||
            {};

        const temporary =
            consequence.temporary ||
            consequence.buffs ||
            consequence.effects ||
            [];

        const changes = [];
        const addedEffects = [];

        /*
         * BONUS / MALUS PERMANENTS
         */
        for (
            const [stat, delta]
            of Object.entries(permanent)
        ) {
            if (num(delta) !== 0) {
                changes.push(
                    applyPermanent(
                        player,
                        stat,
                        delta
                    )
                );
            }
        }

        /*
         * BONUS / MALUS TEMPORAIRES
         */
        for (const rawEffect of temporary) {
            const effect =
                normalizeTemporary(rawEffect);

            if (!effect || effect.value === 0) {
                continue;
            }

            /*
             * On évite d'empiler une infinité
             * de bonus temporaires.
             */
            if (
                player.temporaryEffects.length >= 5
            ) {
                player.temporaryEffects.shift();
            }

            player.temporaryEffects.push(effect);

            addedEffects.push(effect);
        }

        /*
         * XP
         *
         * Un seul choix ne peut pas donner
         * plus de 30 XP.
         */
        const xp = clamp(
            Math.round(
                num(
                    consequence.xp ??
                    consequence.experience,
                    0
                )
            ),
            0,
            30
        );

        player.xp += xp;

        return {
            title:
                consequence.title ||
                "Conséquences",

            message:
                consequence.message ||
                null,

            source:
                options.source ||
                consequence.source ||
                "Choix",

            changes,

            temporary:
                addedEffects,

            xp
        };
    },

    /**
     * Applique les conséquences d'un choix
     * du coach.
     */
    applyCoachChoice(
        player,
        choice = {}
    ) {
        return this.apply(
            player,
            choice.consequences ||
            choice.impacts ||
            choice,
            {
                source: "Coach"
            }
        );
    },

    /**
     * Applique les conséquences d'un choix
     * pendant un match.
     */
    applyMatchChoice(
        player,
        choice = {}
    ) {
        return this.apply(
            player,
            choice.consequences ||
            choice.impacts ||
            choice,
            {
                source: "Match"
            }
        );
    },

    /**
     * Applique les conséquences d'un événement.
     */
    applyEventChoice(
        player,
        choice = {}
    ) {
        return this.apply(
            player,
            choice.consequences ||
            choice.impacts ||
            choice,
            {
                source: "Événement"
            }
        );
    },

    /**
     * Retourne le bonus/malus temporaire
     * cumulé pour une caractéristique.
     *
     * Exemple :
     *
     * getTemporaryModifier(
     *     player,
     *     "matchPerformance"
     * )
     *
     * → 0.05
     */
    getTemporaryModifier(
        player,
        stat
    ) {
        ensurePlayer(player);

        return player.temporaryEffects
            .filter(
                effect =>
                    effect.stat === stat
            )
            .reduce(
                (total, effect) =>
                    total +
                    num(effect.value),
                0
            );
    },

    /**
     * Retourne tous les bonus/malus actifs.
     *
     * Exemple :
     *
     * {
     *     matchPerformance: 0.05,
     *     mediaPressure: -0.03
     * }
     */
    getActiveModifiers(player) {
        ensurePlayer(player);

        return player.temporaryEffects
            .reduce(
                (result, effect) => {

                    result[effect.stat] =
                        (
                            result[effect.stat] ||
                            0
                        ) +
                        num(effect.value);

                    return result;
                },
                {}
            );
    },

    /**
     * À appeler après chaque match.
     *
     * Chaque match réduit la durée restante
     * des effets temporaires.
     */
    advanceMatch(player) {
        ensurePlayer(player);

        const expired = [];

        player.temporaryEffects =
            player.temporaryEffects.filter(
                effect => {

                    effect.remainingMatches =
                        num(
                            effect.remainingMatches,
                            effect.duration
                        ) - 1;

                    if (
                        effect.remainingMatches <= 0
                    ) {
                        expired.push(effect);

                        return false;
                    }

                    return true;
                }
            );

        return expired;
    },

    /**
     * Prévisualise les conséquences
     * SANS modifier le joueur.
     *
     * Cette méthode est destinée à l'UI.
     */
    preview(consequence = {}) {

        const permanent =
            consequence.permanent ||
            consequence.stats ||
            {};

        const temporary =
            consequence.temporary ||
            consequence.buffs ||
            consequence.effects ||
            [];

        const effects = [];

        /*
         * Effets permanents
         */
        for (
            const [stat, rawDelta]
            of Object.entries(permanent)
        ) {
            const delta = num(rawDelta);

            if (!delta) {
                continue;
            }

            effects.push({
                type: "permanent",

                stat,

                label:
                    LABELS[stat] ||
                    stat,

                delta,

                direction:
                    delta > 0
                        ? "positive"
                        : "negative"
            });
        }

        /*
         * Effets temporaires
         */
        for (
            const rawEffect
            of temporary
        ) {
            const effect =
                normalizeTemporary(
                    rawEffect
                );

            if (
                !effect ||
                !effect.value
            ) {
                continue;
            }

            effects.push({
                type: "temporary",

                stat: effect.stat,

                label: effect.label,

                delta: effect.value,

                duration:
                    effect.duration,

                direction:
                    effect.value > 0
                        ? "positive"
                        : "negative",

                description:
                    effect.description
            });
        }

        /*
         * XP
         */
        const xp = clamp(
            Math.round(
                num(
                    consequence.xp ??
                    consequence.experience,
                    0
                )
            ),
            0,
            30
        );

        if (xp > 0) {
            effects.push({
                type: "xp",

                stat: "xp",

                label: "XP",

                delta: xp,

                direction: "positive"
            });
        }

        return {
            title:
                consequence.title ||
                "Conséquences",

            message:
                consequence.message ||
                null,

            effects
        };
    },

    /**
     * Garde-fou d'équilibrage.
     *
     * Empêche un contenu mal configuré
     * de donner des bonus énormes.
     *
     * Permanent :
     *      maximum ±3
     *
     * XP :
     *      maximum 30
     *
     * Bonus temporaires :
     *      maximum ±6%
     *      maximum 3 matchs
     */
    sanitize(
        consequence = {}
    ) {

        const clone =
            JSON.parse(
                JSON.stringify(
                    consequence
                )
            );

        const permanent =
            clone.permanent ||
            clone.stats ||
            {};

        for (
            const stat
            of Object.keys(permanent)
        ) {
            permanent[stat] =
                clamp(
                    num(
                        permanent[stat]
                    ),
                    -3,
                    3
                );
        }

        const xpKey =
            clone.xp !== undefined
                ? "xp"
                : "experience";

        if (
            clone[xpKey] !== undefined
        ) {
            clone[xpKey] =
                clamp(
                    Math.round(
                        num(
                            clone[xpKey]
                        )
                    ),
                    0,
                    30
                );
        }

        const temporary =
            clone.temporary ||
            clone.buffs ||
            clone.effects ||
            [];

        for (
            const effect
            of temporary
        ) {

            effect.value =
                clamp(
                    num(
                        effect.value
                    ),
                    -0.06,
                    0.06
                );

            effect.duration =
                clamp(
                    Math.round(
                        num(
                            effect.duration,
                            1
                        )
                    ),
                    1,
                    3
                );
        }

        return clone;
    },

    /*
     * PRESETS
     *
     * Ces exemples servent de référence
     * pour construire les futurs choix.
     */
    presets: {

        coach: {

            travaillerPlus: {

                title:
                    "Le coach remarque ton implication",

                message:
                    "Ton investissement est apprécié, mais l'effort supplémentaire te fatigue.",

                permanent: {
                    relationCoach: 2,
                    discipline: 1
                },

                temporary: [
                    {
                        stat:
                            "matchPerformance",

                        value:
                            0.02,

                        duration:
                            2,

                        label:
                            "Performance en match"
                    }
                ],

                xp:
                    8
            },

            repondreAvecConfiance: {

                title:
                    "Une réponse ambitieuse",

                message:
                    "Le coach apprécie ta confiance et attend maintenant des résultats.",

                permanent: {
                    confidence: 2,
                    relationCoach: 1
                },

                temporary: [
                    {
                        stat:
                            "matchPerformance",

                        value:
                            0.03,

                        duration:
                            1,

                        label:
                            "Confiance"
                    }
                ],

                xp:
                    6
            },

            resterHumble: {

                title:
                    "Une attitude mature",

                message:
                    "Le coach apprécie ton humilité et ton sérieux.",

                permanent: {
                    relationCoach: 2,
                    discipline: 1
                },

                temporary: [
                    {
                        stat:
                            "coachTrust",

                        value:
                            0.03,

                        duration:
                            2,

                        label:
                            "Confiance du coach"
                    }
                ],

                xp:
                    6
            }
        },

        match: {

            prendreRisques: {

                title:
                    "Tu prends des risques",

                message:
                    "Tu peux faire la différence, mais ton effort te coûtera physiquement.",

                permanent: {
                    confidence: 1
                },

                temporary: [
                    {
                        stat:
                            "matchPerformance",

                        value:
                            0.05,

                        duration:
                            1,

                        label:
                            "Performance offensive"
                    }
                ],

                xp:
                    5
            },

            jouerSimple: {

                title:
                    "Tu joues simple et propre",

                message:
                    "Une décision sûre qui favorise la régularité.",

                permanent: {
                    discipline: 1
                },

                temporary: [
                    {
                        stat:
                            "matchPerformance",

                        value:
                            0.02,

                        duration:
                            1,

                        label:
                            "Régularité"
                    }
                ],

                xp:
                    5
            },

            assurerDefensivement: {

                title:
                    "Tu sécurises ton côté",

                message:
                    "Moins de risques offensifs, mais une meilleure maîtrise défensive.",

                permanent: {
                    discipline: 1
                },

                temporary: [
                    {
                        stat:
                            "defensivePerformance",

                        value:
                            0.05,

                        duration:
                            1,

                        label:
                            "Solidité défensive"
                    }
                ],

                xp:
                    5
            }
        },

        event: {

            ambition: {

                title:
                    "Tu assumes tes ambitions",

                message:
                    "Ton ambition est remarquée. À toi maintenant de l'assumer sur le terrain.",

                permanent: {
                    confidence: 2,
                    reputation: 1
                },

                temporary: [
                    {
                        stat:
                            "matchPerformance",

                        value:
                            0.02,

                        duration:
                            2,

                        label:
                            "Confiance"
                    }
                ],

                xp:
                    8
            },

            prudence: {

                title:
                    "Tu préfères rester concentré",

                message:
                    "Tu évites la pression médiatique et conserves une bonne image auprès du staff.",

                permanent: {
                    relationCoach: 1,
                    discipline: 1
                },

                temporary: [
                    {
                        stat:
                            "mediaPressure",

                        value:
                            -0.03,

                        duration:
                            2,

                        label:
                            "Pression médiatique"
                    }
                ],

                xp:
                    6
            }
        }
    }
};

export default ConsequenceSystem;
