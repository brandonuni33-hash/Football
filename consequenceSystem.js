import { PlayerLogic } from './player.js';
import { PotentialSystem } from './potentialSystem.js';
/**
 * consequenceSystem.js
 * Point central des conséquences des choix du jeu.
 *
 * Compatible avec les anciens formats :
 *   impacts: { morale: +2, fitness: -5, 'attributes.physique': +1 }
 *   impacts: { stats: {...}, matchBonuses: {...} }
 *
 * Et avec le nouveau format :
 *   consequences: {
 *      permanent: {...},
 *      temporary: [...],
 *      xp: 10
 *   }
 */

const LIMITS = {
    morale: [0, 100],
    fitness: [0, 100],
    fame: [0, 100],
    discipline: [0, 100],
    mental: [0, 100],
    relationCoach: [0, 100],
    careerMomentum: [-24, 24],
    vestiaire: [0, 100],
    confidence: [0, 100],
    reputation: [0, 100],
    balance: [-Infinity, Infinity]
};

const LABELS = {
    morale: 'Moral',
    fitness: 'Forme',
    fame: 'Réputation',
    discipline: 'Discipline',
    mental: 'Mental',
    relationCoach: 'Relation coach',
    vestiaire: 'Vestiaire',
    confidence: 'Confiance',
    reputation: 'Réputation',
    careerMomentum: 'Dynamique de carrière',
    balance: 'Finances',
    vitesse: 'Vitesse',
    tir: 'Tir',
    passe: 'Passe',
    dribble: 'Dribble',
    defense: 'Défense',
    physique: 'Physique',
    technique: 'Technique',
    charisme: 'Charisme'
};

const LEGACY_ATTRIBUTE_MAP = {
    vitesse: 'vitesse',
    tir: 'tir',
    passe: 'passe',
    passes: 'passe',
    dribble: 'dribble',
    defense: 'defense',
    physique: 'physique',
    mental: 'mental',
    tete: 'mental',
    mental: 'mental'
};

const MATCH_BONUS_LABELS = {
    ratingBonus: 'Note de match',
    ratingBoost: 'Note de match',
    goalChance: 'Chance de but',
    assistChance: 'Chance de passe décisive',
    duelBonus: 'Duels',
    fatigueRisk: 'Fatigue',
    cardRisk: 'Risque de carton',
    passAccuracy: 'Précision de passe',
    teamBoost: 'Impact collectif'
};

const clamp = (value, min, max) =>
    Math.min(max, Math.max(min, value));

const num = (value, fallback = 0) =>
    Number.isFinite(Number(value)) ? Number(value) : fallback;

function clone(value) {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}

function normalizeDuration(value) {
    return clamp(Math.round(num(value, 1)), 1, 3);
}

function ensurePlayer(player) {
    if (!player) throw new Error('ConsequenceSystem : joueur manquant.');

    player.stats ||= {};
    player.attributes ||= {};
    player.temporaryEffects ||= [];
    PotentialSystem.ensure(player);

    // Ne crée les nouvelles stats que si elles n'existent pas déjà.
    // Les stats historiques (morale, fame, etc.) restent la référence.
    const defaults = {
        morale: 50,
        fitness: 80,
        fame: 10,
        discipline: 50,
        mental: 50,
        relationCoach: 50
    };

    for (const [key, value] of Object.entries(defaults)) {
        if (player[key] === undefined && player.stats[key] === undefined) {
            player[key] = value;
        }
    }

    if (player.xp === undefined) player.xp = 0;

    return player;
}

function readValue(player, key) {
    if (key === 'careerMomentum') {
        const before = n(player.potentialProfile?.careerMomentum);
        const after = n(player.potentialProfile?.careerMomentum);
        return {
            stat: key,
            label: LABELS[key],
            before,
            after,
            delta: after - before
        };
    }

    if (key.startsWith('attributes.')) {
        return num(player.attributes?.[key.slice(11)]);
    }

    if (player[key] !== undefined) return num(player[key]);
    if (player.stats?.[key] !== undefined) return num(player.stats[key]);
    if (player.attributes?.[key] !== undefined) return num(player.attributes[key]);

    return 0;
}

function writeValue(player, key, delta) {
    if (key === 'technique') {
        const beforePasses = num(player.attributes?.passe);
        const beforeDribble = num(player.attributes?.dribble);
        if (player.attributes?.passe === undefined || player.attributes?.dribble === undefined) return null;

        const half = num(delta) / 2;
        player.attributes.passe = clamp(beforePasses + half, 1, 99);
        player.attributes.dribble = clamp(beforeDribble + half, 1, 99);

        return {
            stat: key,
            label: LABELS[key],
            before: Number(((beforePasses + beforeDribble) / 2).toFixed(2)),
            after: Number(((player.attributes.passe + player.attributes.dribble) / 2).toFixed(2)),
            delta: num(delta)
        };
    }

    if (key === 'careerMomentum') {
        const before = n(player.potentialProfile?.careerMomentum);
        const after = PotentialSystem.addMomentum(player, n(delta), 'decisions');
        return {
            stat: key,
            label: LABELS[key],
            before,
            after,
            delta: after - before
        };
    }

    if (key.startsWith('attributes.')) {
        const attr = key.slice(11);
        const before = num(player.attributes?.[attr]);

        if (player.attributes?.[attr] === undefined) {
            return null;
        }

        player.attributes[attr] = clamp(
            before + num(delta),
            1,
            Math.min(99, num(player.potential, 99))
        );

        return {
            stat: key,
            label: LABELS[attr] || LABELS[key] || attr,
            before,
            after: player.attributes[attr],
            delta: player.attributes[attr] - before
        };
    }

    if (player[key] !== undefined) {
        const before = num(player[key]);
        const limits = LIMITS[key] || [0, 100];

        player[key] = clamp(
            before + num(delta),
            limits[0],
            limits[1]
        );

        return {
            stat: key,
            label: LABELS[key] || key,
            before,
            after: player[key],
            delta: player[key] - before
        };
    }

    if (player.stats?.[key] !== undefined) {
        const before = num(player.stats[key]);
        const limits = LIMITS[key] || [0, 100];

        player.stats[key] = clamp(
            before + num(delta),
            limits[0],
            limits[1]
        );

        return {
            stat: key,
            label: LABELS[key] || key,
            before,
            after: player.stats[key],
            delta: player.stats[key] - before
        };
    }

    if (player.attributes?.[key] !== undefined) {
        const before = num(player.attributes[key]);

        player.attributes[key] = clamp(
            before + num(delta),
            1,
            Math.min(99, num(player.potential, 99))
        );

        return {
            stat: key,
            label: LABELS[key] || key,
            before,
            after: player.attributes[key],
            delta: player.attributes[key] - before
        };
    }

    // Une stat secondaire absente ne doit pas provoquer de undefined.
    // On la place dans stats afin de garder le système extensible.
    const before = 50;
    player.stats[key] = clamp(before + num(delta), 0, 100);

    return {
        stat: key,
        label: LABELS[key] || key,
        before,
        after: player.stats[key],
        delta: player.stats[key] - before
    };
}

function normalizeTemporary(effect) {
    if (!effect?.stat) return null;

    const duration = normalizeDuration(effect.duration);

    return {
        id: effect.id ||
            `effect_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        stat: effect.stat,
        value: num(effect.value),
        duration,
        remainingMatches: duration,
        source: effect.source || 'Choix',
        label: effect.label || LABELS[effect.stat] || effect.stat,
        description: effect.description || null
    };
}

function flattenLegacyImpacts(impacts = {}) {
    const permanent = {};
    const temporary = [];

    for (const [key, value] of Object.entries(impacts || {})) {
        if (key === 'stats' || key === 'matchBonuses') continue;

        if (typeof value === 'number') {
            permanent[key] = value;
        }
    }

    for (const [key, value] of Object.entries(impacts.stats || {})) {
        if (typeof value !== 'number') continue;
        const mapped = LEGACY_ATTRIBUTE_MAP[key];
        const target = mapped ? `attributes.${mapped}` : key;
        permanent[target] = (permanent[target] || 0) + value;
    }

    // Les matchBonuses restent temporaires et sont consommés par matchBlock.js.
    for (const [key, value] of Object.entries(impacts.matchBonuses || {})) {
        if (typeof value !== 'number' || value === 0) continue;

        temporary.push({
            stat: `matchBonus.${key}`,
            value,
            duration: 1,
            label: MATCH_BONUS_LABELS[key] || key
        });
    }

    return { permanent, temporary };
}

function normalizeChoice(choice = {}) {
    const hasExplicitConsequences =
        !!choice &&
        typeof choice.consequences === 'object' &&
        choice.consequences !== null;

    const explicit = hasExplicitConsequences
        ? choice.consequences
        : {};

    const legacy = choice.impacts || (
        hasExplicitConsequences
            ? {}
            : choice
    );

    const permanent = {
        ...(explicit.permanent || {}),
        ...(explicit.stats || {})
    };

    // Format historique : impacts: { fitness, morale, stats, matchBonuses }.
    const legacyFlattened = flattenLegacyImpacts(legacy);

    for (const [key, value] of Object.entries(legacyFlattened.permanent)) {
        // Ne pas doubler un champ lorsque le même objet est déjà fourni
        // sous explicit.permanent / explicit.stats.
        if (permanent[key] === undefined) {
            permanent[key] = num(value);
        } else if (!hasExplicitConsequences) {
            permanent[key] = num(value);
        }
    }

    const temporary = [
        ...(explicit.temporary || explicit.buffs || explicit.effects || []),
        ...legacyFlattened.temporary
    ];

    return {
        title:
            explicit.title ||
            choice.title ||
            null,

        message:
            explicit.message ||
            choice.message ||
            null,

        permanent,
        temporary,

        xp: num(
            explicit.xp ??
            explicit.experience ??
            legacy.xp ??
            legacy.experience,
            0
        )
    };
}

export const ConsequenceSystem = {
    LIMITS,
    LABELS,
    MATCH_BONUS_LABELS,

    initialize(player) {
        return ensurePlayer(player);
    },

    normalizeChoice,

    /**
     * Applique des conséquences directement au joueur.
     */
    apply(player, consequence = {}, options = {}) {
        ensurePlayer(player);

        const normalized = normalizeChoice(consequence);
        const changes = [];
        const temporary = [];

        for (const [stat, delta] of Object.entries(normalized.permanent)) {
            if (!Number.isFinite(Number(delta)) || num(delta) === 0) continue;

            const change = writeValue(player, stat, delta);
            if (change) {
                changes.push({
                    ...change,
                    type: 'permanent'
                });
            }
        }

        for (const rawEffect of normalized.temporary) {
            const effect = normalizeTemporary({
                ...rawEffect,
                source: rawEffect.source || options.source || 'Choix'
            });

            if (!effect || effect.value === 0) continue;

            // Les matchBonus sont des données de bloc et ne doivent pas
            // s'accumuler dans le joueur : matchBlock les consomme directement.
            if (effect.stat.startsWith('matchBonus.')) continue;

            if (player.temporaryEffects.length >= 8) {
                player.temporaryEffects.shift();
            }

            player.temporaryEffects.push(effect);
            temporary.push(effect);
        }

        const xp = clamp(Math.round(normalized.xp), 0, 30);
        if (xp > 0) PlayerLogic.applyProgression(player, { xp, type: 'choixCarriere' });

        PotentialSystem.recordConsequenceChanges(player, changes);

        return {
            title: normalized.title || 'Conséquences',
            message: normalized.message,
            source: options.source || 'Choix',
            changes,
            temporary,
            xp
        };
    },

    /**
     * Applique une conséquence à l'état complet.
     * Gère notamment balance/finances et les anciennes sauvegardes.
     */
    applyToState(state, choice = {}, options = {}) {
        if (!state?.player) return null;

        ensurePlayer(state.player);

        const normalized = normalizeChoice(choice);
        const changes = [];
        const temporary = [];

        for (const [stat, delta] of Object.entries(normalized.permanent)) {
            if (!Number.isFinite(Number(delta)) || num(delta) === 0) continue;

            if (stat === 'balance') {
                state.career ||= { balance: 0 };
                state.career.balance = num(state.career.balance) + num(delta);

                changes.push({
                    type: 'permanent',
                    stat,
                    label: LABELS.balance,
                    before: state.career.balance - num(delta),
                    after: state.career.balance,
                    delta: num(delta)
                });

                continue;
            }

            const change = writeValue(state.player, stat, delta);
            if (change) {
                changes.push({
                    ...change,
                    type: 'permanent'
                });
            }
        }

        for (const rawEffect of normalized.temporary) {
            const effect = normalizeTemporary({
                ...rawEffect,
                source: rawEffect.source || options.source || 'Choix'
            });

            if (!effect || effect.value === 0) continue;
            if (effect.stat.startsWith('matchBonus.')) continue;

            if (state.player.temporaryEffects.length >= 8) {
                state.player.temporaryEffects.shift();
            }

            state.player.temporaryEffects.push(effect);
            temporary.push(effect);
        }

        const xp = clamp(Math.round(normalized.xp), 0, 30);
        if (xp > 0) PlayerLogic.applyProgression(state.player, { xp, type: 'choixCarriere' });

        PotentialSystem.recordConsequenceChanges(state.player, changes);

        return {
            title: normalized.title || 'Conséquences',
            message: normalized.message,
            source: options.source || 'Choix',
            changes,
            temporary,
            xp
        };
    },

    applyCoachChoice(state, choice = {}) {
        return this.applyToState(state, choice, { source: 'Coach' });
    },

    applyEventChoice(state, choice = {}) {
        return this.applyToState(state, choice, { source: 'Événement' });
    },

    applyMatchChoice(player, choice = {}) {
        return this.apply(player, choice, { source: 'Match' });
    },

    /**
     * Retourne les bonus temporaires hors match.
     */
    getTemporaryModifier(player, stat) {
        ensurePlayer(player);

        return player.temporaryEffects
            .filter(effect => effect.stat === stat)
            .reduce((total, effect) => total + num(effect.value), 0);
    },

    getActiveModifiers(player) {
        ensurePlayer(player);

        return player.temporaryEffects.reduce((result, effect) => {
            result[effect.stat] = (result[effect.stat] || 0) + num(effect.value);
            return result;
        }, {});
    },

    /**
     * À appeler après chaque bloc de matchs.
     */
    advanceMatch(player) {
        ensurePlayer(player);

        const expired = [];

        player.temporaryEffects = player.temporaryEffects.filter(effect => {
            effect.remainingMatches =
                num(effect.remainingMatches, effect.duration) - 1;

            if (effect.remainingMatches <= 0) {
                expired.push(effect);
                return false;
            }

            return true;
        });

        return expired;
    },

    /**
     * Prévisualise sans modifier le joueur.
     * Comprend les anciens impacts et le nouveau format.
     */
    preview(choice = {}) {
        const normalized = normalizeChoice(choice);
        const effects = [];

        for (const [stat, rawDelta] of Object.entries(normalized.permanent)) {
            const delta = num(rawDelta);
            if (!delta) continue;

            effects.push({
                type: 'permanent',
                stat,
                label: LABELS[stat] || stat.replace('attributes.', ''),
                delta,
                direction: delta > 0 ? 'positive' : 'negative'
            });
        }

        for (const rawEffect of normalized.temporary) {
            const effect = normalizeTemporary(rawEffect);
            if (!effect || !effect.value) continue;

            effects.push({
                type: 'temporary',
                stat: effect.stat,
                label: effect.label,
                delta: effect.value,
                duration: effect.duration,
                direction: effect.value > 0 ? 'positive' : 'negative',
                description: effect.description
            });
        }

        if (normalized.xp > 0) {
            effects.push({
                type: 'xp',
                stat: 'xp',
                label: 'XP',
                delta: Math.min(30, Math.round(normalized.xp)),
                direction: 'positive'
            });
        }

        return {
            title: normalized.title || 'Conséquences',
            message: normalized.message || null,
            effects
        };
    },

    /**
     * Garde-fou pour le nouveau contenu.
     * Le format historique n'est pas altéré ici : ses valeurs ont
     * déjà leur propre équilibre dans les fichiers de contenu.
     */
    sanitize(consequence = {}) {
        const cloneValue = clone(consequence);

        const permanent = cloneValue.permanent || cloneValue.stats || {};
        for (const stat of Object.keys(permanent)) {
            permanent[stat] = clamp(num(permanent[stat]), -3, 3);
        }

        const xpKey =
            cloneValue.xp !== undefined ? 'xp' : 'experience';

        if (cloneValue[xpKey] !== undefined) {
            cloneValue[xpKey] =
                clamp(Math.round(num(cloneValue[xpKey])), 0, 30);
        }

        const temporary =
            cloneValue.temporary ||
            cloneValue.buffs ||
            cloneValue.effects ||
            [];

        for (const effect of temporary) {
            effect.value = clamp(num(effect.value), -0.06, 0.06);
            effect.duration = normalizeDuration(effect.duration);
        }

        return cloneValue;
    }
};

export default ConsequenceSystem;
