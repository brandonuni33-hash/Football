// Projection tactique légère du match jouable.
// Le domaine fournit les positions; l'UI ne fait que les dessiner.
// Les équipes de jeunes gardent une structure plausible mais moins parfaite que les équipes seniors.

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

const EXPERIENCE_PROFILES = Object.freeze({
    U15: Object.freeze({ id: 'U15', discipline: .52, disorder: 4.8, lineStagger: 3.6, ballAttraction: .12 }),
    YOUTH: Object.freeze({ id: 'YOUTH', discipline: .68, disorder: 3.1, lineStagger: 2.4, ballAttraction: .075 }),
    SEMI_PRO: Object.freeze({ id: 'SEMI_PRO', discipline: .84, disorder: 1.65, lineStagger: 1.25, ballAttraction: .035 }),
    PRO: Object.freeze({ id: 'PRO', discipline: .96, disorder: .7, lineStagger: .5, ballAttraction: .012 })
});

function signedUnit(seed = '') {
    let hash = 2166136261;
    for (const char of String(seed)) {
        hash ^= char.charCodeAt(0);
        hash = Math.imul(hash, 16777619);
    }
    return ((hash >>> 0) % 2001) / 1000 - 1;
}

export function tacticalExperienceProfile({ playerAge = 0, competition = '' } = {}) {
    const age = Number(playerAge) || 0;
    const text = String(competition || '').toLowerCase();
    const explicitYouth = /\bu\s?1[3456789]\b|moins de 1[3456789]|academy|académie|formation|juvenil|youth/.test(text);
    const explicitU15 = /\bu\s?15\b|moins de 15/.test(text);
    const explicitSeniorPro = /ligue\s?[12]|premier league|championship|la liga|segunda|bundesliga|serie\s?[ab]|champions league|europa league/.test(text);
    const explicitSemi = /national|regional|régional|semi.?pro|district|serie c|league one|3\. liga|primera federaci[oó]n/.test(text);

    if (explicitU15) return EXPERIENCE_PROFILES.U15;
    if (explicitYouth) return age && age <= 15 ? EXPERIENCE_PROFILES.U15 : EXPERIENCE_PROFILES.YOUTH;
    if (explicitSeniorPro) return EXPERIENCE_PROFILES.PRO;
    if (explicitSemi) return EXPERIENCE_PROFILES.SEMI_PRO;
    if (age && age <= 15) return EXPERIENCE_PROFILES.U15;
    if (age && age <= 18) return EXPERIENCE_PROFILES.YOUTH;
    return EXPERIENCE_PROFILES.PRO;
}

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

function lineId(index) {
    if (index === 0) return 'goalkeeper';
    if (index <= 4) return 'defence';
    if (index <= 7) return 'midfield';
    return 'attack';
}

function applyExperienceShape(points, { profile, ball, seed, team }) {
    return points.map((p, index) => {
        if (p.role === 'goalkeeper') {
            const y = p.y + signedUnit(`${seed}:${team}:gk:y`) * profile.disorder * .18;
            return point(p.x, y, p.role);
        }

        const roleFactor = p.role === 'focus' ? .5 : 1;
        const line = lineId(index);
        const lineDrift = signedUnit(`${seed}:${team}:${line}:line-x`) * profile.lineStagger;
        const xNoise = signedUnit(`${seed}:${team}:${index}:x`) * profile.disorder * roleFactor;
        const yNoise = signedUnit(`${seed}:${team}:${index}:y`) * profile.disorder * 1.12 * roleFactor;
        const attraction = profile.ballAttraction * (p.role === 'focus' ? .35 : 1);

        // Les jeunes ont tendance à suivre davantage le ballon, à perdre un peu la largeur
        // côté faible et à garder des lignes moins synchronisées. On dégrade la structure,
        // jamais le nombre de joueurs ni la cohérence générale de l'action.
        const x = p.x + lineDrift + xNoise + (ball.x - p.x) * attraction * .34;
        const y = p.y + yNoise + (ball.y - p.y) * attraction;
        return point(x, y, p.role);
    });
}

function stateLayout(state) {
    if (state === 'SET_PIECE') return setPieceLayout();

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

    return { home, away, ball };
}

export function buildInteractiveMatchTacticalSituation({
    cameraState = 'NORMAL',
    playerAge = 0,
    competition = '',
    seed = 'match'
} = {}) {
    const state = String(cameraState || 'NORMAL').toUpperCase();
    const layout = stateLayout(state);
    const organization = tacticalExperienceProfile({ playerAge, competition });
    const stableSeed = `${seed}:${state}:${organization.id}`;
    const home = applyExperienceShape(layout.home, { profile: organization, ball: layout.ball, seed: stableSeed, team: 'home' });
    const away = applyExperienceShape(layout.away, { profile: organization, ball: layout.ball, seed: stableSeed, team: 'away' });

    return {
        state,
        home,
        away,
        ball: layout.ball,
        organization: {
            level: organization.id,
            discipline: organization.discipline
        }
    };
}

export default buildInteractiveMatchTacticalSituation;
