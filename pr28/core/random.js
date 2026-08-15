// core/random.js
// Point d'entrée unique pour le hasard du jeu.
// Centraliser le hasard permettra ensuite de rendre les simulations reproductibles.

export const Random = {
    float(min = 0, max = 1) {
        return Math.random() * (max - min) + min;
    },

    int(min, max) {
        if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
            throw new RangeError('Random.int requires integer bounds with max >= min');
        }

        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    chance(probability) {
        if (!Number.isFinite(probability)) return false;
        if (probability <= 0) return false;
        if (probability >= 1) return true;
        return Math.random() < probability;
    },

    pick(items) {
        if (!Array.isArray(items) || items.length === 0) return null;
        return items[Random.int(0, items.length - 1)];
    },

    weighted(items, weightAccessor = (item) => item.weight ?? 0) {
        if (!Array.isArray(items) || items.length === 0) return null;

        const weights = items.map((item) => Math.max(0, Number(weightAccessor(item)) || 0));
        const total = weights.reduce((sum, weight) => sum + weight, 0);

        if (total <= 0) return Random.pick(items);

        let cursor = Math.random() * total;

        for (let index = 0; index < items.length; index += 1) {
            cursor -= weights[index];
            if (cursor < 0) return items[index];
        }

        return items[items.length - 1];
    }
};

export default Random;
