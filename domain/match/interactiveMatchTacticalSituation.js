// Projection tactique légère du match jouable.
// Le domaine fournit les positions; l'UI ne fait que les dessiner.

const clamp = value => Math.max(4, Math.min(96, Number(value) || 50));
const point = (x, y, role = 'outfield') => ({ x: clamp(x), y: clamp(y), role });

const BASE_HOME = Object.freeze([
    point(7, 50, 'goalkeeper'),
    point(21, 15), point(22, 37), point(22, 63), point(21, 85),
    point(40, 24), point(43, 50), point(40, 76),
    point(62, 18), point(66, 50, 'focus'), point(62, 82)
]);

const BASE_AWAY = Object.freeze([
    point(93, 50, 'goalkeeper'),
    point(79, 15), point(78, 37), point(78, 63), point(79, 85),
    point(60, 24), point(57, 50), point(60, 76),
    point(38, 18), point(34, 50), point(38, 82)
]);

function shift(points, dx = 0, squeeze = 1) {
    return points.map(p => point(p.x + dx, 50 + (p.y - 50) * squeeze, p.role));
}

function setPieceLayout() {
    return {
        home: [
            point(8,50,'goalkeeper'), point(35,14), point(36,35), point(36,65), point(35,86),
            point(57,20), point(58,40), point(60,62), point(74,28), point(76,50,'focus'), point(74,72)
        ],
        away: [
            point(93,50,'goalkeeper'), point(82,18), point(82,34), point(82,50), point(82,66), point(82,82),
            point(70,28), point(70,44), point(70,60), point(70,76), point(55,50)
        ],
        ball: point(69, 50, 'ball')
    };
}

export function buildInteractiveMatchTacticalSituation({ cameraState = 'NORMAL' } = {}) {
    const state = String(cameraState || 'NORMAL').toUpperCase();
    if (state === 'SET_PIECE') return { state, ...setPieceLayout() };

    let home = BASE_HOME.map(p => ({ ...p }));
    let away = BASE_AWAY.map(p => ({ ...p }));
    let ball = point(52, 50, 'ball');

    if (state === 'BUILD_UP') {
        home = shift(BASE_HOME, -5, .94);
        away = shift(BASE_AWAY, 3, .92);
        ball = point(38, 55, 'ball');
    } else if (state === 'COUNTER_ATTACK') {
        home = BASE_HOME.map((p, i) => point(p.x + (i >= 8 ? 13 : i >= 5 ? 8 : 2), p.y, p.role));
        away = shift(BASE_AWAY, 7, .88);
        ball = point(67, 47, 'ball');
    } else if (state === 'DANGER') {
        home = shift(BASE_HOME, 10, .88);
        away = shift(BASE_AWAY, 6, .78);
        ball = point(76, 50, 'ball');
    } else if (state === 'DUEL') {
        home = shift(BASE_HOME, 5, .92);
        away = shift(BASE_AWAY, 1, .9);
        ball = point(62, 51, 'ball');
    } else if (state === 'SHOT') {
        home = shift(BASE_HOME, 12, .86);
        away = shift(BASE_AWAY, 7, .74);
        ball = point(82, 49, 'ball');
    } else if (state === 'GOAL') {
        home = shift(BASE_HOME, 15, .84);
        away = shift(BASE_AWAY, 8, .72);
        ball = point(93, 50, 'ball');
    }

    return { state, home, away, ball };
}

export default buildInteractiveMatchTacticalSituation;
