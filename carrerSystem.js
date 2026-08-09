// careerSystem.js
// Fondations de la trajectoire 14 -> professionnel : formation, contrats,
// rôles naturels et éventuelle reconversion de poste.

import { YOUTH_CLUBS_POOL, POSITIONS } from './constants.js';

const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const CAREER_STAGES = {
    ACADEMY: 'academy',
    SEMI_PRO: 'semi_pro',
    PROFESSIONAL: 'professional'
};

const POSITION_GROUPS = {
    BU: ['BU', 'MOC', 'AD', 'AG'],
    AD: ['AD', 'AG', 'BU', 'MOC'],
    AG: ['AG', 'AD', 'BU', 'MOC'],
    MOC: ['MOC', 'MC', 'AD', 'AG'],
    MC: ['MC', 'MOC', 'MDEF'],
    DD: ['DD', 'DG', 'DC'],
    DG: ['DG', 'DD', 'DC'],
    DC: ['DC', 'MDEF', 'DD', 'DG'],
    GK: ['GK']
};

const ROLE_DEFINITIONS = {
    BU: [
        ['Renard des surfaces', { tir: .40, vitesse: .15, tete: .20, mental: .15, dribble: .10 }],
        ['Attaquant de soutien', { passe: .30, dribble: .20, mental: .25, tir: .15, vitesse: .10 }],
        ['Attaquant complet', { tir: .24, vitesse: .18, dribble: .18, passe: .15, physique: .15, mental: .10 }]
    ],
    AD: [
        ['Ailier créateur', { dribble: .30, passe: .25, vitesse: .22, tir: .13, mental: .10 }],
        ['Ailier intérieur', { vitesse: .25, dribble: .25, tir: .25, mental: .15, passe: .10 }],
        ['Ailier travailleur', { vitesse: .25, physique: .25, dribble: .18, passe: .15, defense: .17 }]
    ],
    AG: [
        ['Ailier créateur', { dribble: .30, passe: .25, vitesse: .22, tir: .13, mental: .10 }],
        ['Ailier intérieur', { vitesse: .25, dribble: .25, tir: .25, mental: .15, passe: .10 }],
        ['Ailier travailleur', { vitesse: .25, physique: .25, dribble: .18, passe: .15, defense: .17 }]
    ],
    MOC: [
        ['Meneur de jeu', { passe: .34, mental: .28, dribble: .18, tir: .12, vitesse: .08 }],
        ['Milieu offensif', { tir: .25, passe: .25, dribble: .22, mental: .18, vitesse: .10 }],
        ['Créateur libre', { dribble: .28, passe: .28, mental: .24, vitesse: .12, tir: .08 }]
    ],
    MC: [
        ['Box-to-box', { physique: .25, passe: .20, defense: .20, vitesse: .15, mental: .20 }],
        ['Meneur de jeu', { passe: .35, mental: .25, dribble: .15, physique: .10, defense: .15 }],
        ['Milieu récupérateur', { defense: .35, physique: .30, mental: .20, passe: .10, vitesse: .05 }]
    ],
    DC: [
        ['Défenseur central stoppeur', { defense: .38, physique: .30, tete: .20, vitesse: .07, mental: .05 }],
        ['Défenseur relanceur', { defense: .25, passe: .30, mental: .25, physique: .12, vitesse: .08 }],
        ['Défenseur complet', { defense: .30, physique: .22, passe: .16, vitesse: .12, tete: .12, mental: .08 }]
    ],
    DD: [
        ['Latéral offensif', { vitesse: .28, dribble: .22, passe: .20, physique: .18, defense: .12 }],
        ['Latéral défensif', { defense: .34, vitesse: .22, physique: .25, passe: .10, mental: .09 }]
    ],
    DG: [
        ['Latéral offensif', { vitesse: .28, dribble: .22, passe: .20, physique: .18, defense: .12 }],
        ['Latéral défensif', { defense: .34, vitesse: .22, physique: .25, passe: .10, mental: .09 }]
    ],
    GK: [
        ['Gardien traditionnel', { defense: .35, physique: .25, mental: .25, passe: .10, vitesse: .05 }],
        ['Gardien relanceur', { passe: .35, mental: .30, defense: .20, physique: .10, vitesse: .05 }]
    ]
};

function getAttribute(player, key) {
    const a = player?.attributes || {};
    const map = { passe: 'passe', mental: 'mental' };
    return Number(a[map[key] || key] ?? 40);
}

function scoreRole(player, weights) {
    return Object.entries(weights).reduce((sum, [key, weight]) => sum + getAttribute(player, key) * weight, 0);
}

function centerStars(club) {
    const prestige = clamp(club?.prestige ?? 35, 20, 95);
    return clamp(Math.round((prestige - 20) / 15) + 1, 1, 5);
}

function careerStage(age) {
    if (age < 16) return CAREER_STAGES.ACADEMY;
    if (age < 18) return CAREER_STAGES.SEMI_PRO;
    return CAREER_STAGES.PROFESSIONAL;
}

function contractForStage(stage, clubPrestige = 40) {
    const p = clamp(clubPrestige, 20, 95);
    if (stage === CAREER_STAGES.ACADEMY) {
        return { type: 'jeune', label: 'Contrat jeune', durationYears: rand(1, 3), weeklySalary: rand(50, 180), signingBonus: rand(0, 500) };
    }
    if (stage === CAREER_STAGES.SEMI_PRO) {
        return { type: 'semi_pro', label: 'Contrat semi-professionnel', durationYears: rand(1, 3), weeklySalary: rand(180, 650), signingBonus: rand(250, 2500) };
    }
    return { type: 'professionnel', label: 'Contrat professionnel', durationYears: rand(2, 5), weeklySalary: Math.round(700 + p * 55), signingBonus: Math.round(2500 + p * 150) };
}

export const CareerSystem = {
    getStage(age) { return careerStage(Number(age) || 14); },

    getCenterProfile(club) {
        return {
            stars: centerStars(club),
            development: clamp((club?.prestige ?? 35) + rand(-5, 5), 20, 99),
            coaching: clamp((club?.prestige ?? 35) + rand(-8, 8), 20, 99),
            facilities: clamp((club?.prestige ?? 35) + rand(-10, 10), 20, 99),
            detection: clamp((club?.prestige ?? 35) + rand(-6, 8), 20, 99)
        };
    },

    initialize(player, youthClub = null) {
        const stage = careerStage(player.age);
        const center = this.getCenterProfile(youthClub);
        const contract = contractForStage(stage, youthClub?.prestige);
        player.careerProfile = {
            stage,
            youthCategory: player.age <= 15 ? 'U15' : player.age === 16 ? 'U16' : player.age === 17 ? 'U17/U19' : 'Senior',
            centerStars: center.stars,
            centerProfile: center,
            role: null,
            roleDiscoveredAge: null,
            roleHistory: [],
            positionHistory: [{ age: player.age, position: player.position }],
            preferredPosition: player.position,
            adaptation: {},
            recruitmentHistory: [],
            lastRecruitmentCheckSeason: null
        };
        player.contract = contract;
        return player.careerProfile;
    },

    refreshStage(player) {
        if (!player?.careerProfile) return null;
        const next = careerStage(player.age);
        if (next !== player.careerProfile.stage) {
            player.careerProfile.stage = next;
            player.contract = contractForStage(next, player.careerProfile.centerProfile?.development || 40);
        }
        player.careerProfile.youthCategory = player.age <= 15 ? 'U15' : player.age === 16 ? 'U16' : player.age === 17 ? 'U17/U19' : 'Senior';
        return player.careerProfile.stage;
    },

    detectRole(player, force = false) {
        if (!player || player.age < 16 || player.age > 21) return null;
        player.careerProfile ||= this.initialize(player);
        if (player.careerProfile.role && !force) return null;

        const defs = ROLE_DEFINITIONS[player.position] || ROLE_DEFINITIONS.BU;
        const scored = defs.map(([name, weights]) => ({ name, score: scoreRole(player, weights) }));
        scored.sort((a, b) => b.score - a.score);
        const best = scored[0];
        const probability = clamp(0.10 + (best.score - 45) / 250, 0.08, 0.32);
        if (!force && Math.random() > probability) return null;

        player.careerProfile.role = best.name;
        player.careerProfile.roleDiscoveredAge = player.age;
        player.careerProfile.roleHistory.push({ age: player.age, role: best.name, position: player.position });
        return best.name;
    },

    evaluatePositionChange(player) {
        if (!player || player.age < 16 || player.age > 21 || !player.careerProfile) return null;
        const candidates = POSITION_GROUPS[player.position] || [player.position];
        let best = { position: player.position, score: -Infinity };
        for (const pos of candidates) {
            if (pos === player.position || pos === 'MDEF') {
                const score = this.positionFitScore(player, pos);
                if (score > best.score) best = { position: pos, score };
            }
        }
        const currentScore = this.positionFitScore(player, player.position);
        if (best.position === player.position || best.score < currentScore + 9) return null;
        if (Math.random() > 0.12) return null;
        return {
            from: player.position,
            to: best.position,
            confidence: clamp(Math.round(55 + (best.score - currentScore) * 2), 55, 92),
            message: `Le staff pense que votre profil correspond davantage au poste de ${this.positionName(best.position)}.`
        };
    },

    positionFitScore(player, position) {
        const a = player.attributes || {};
        const n = key => Number(a[key] ?? 40);
        const fits = {
            BU: n('tir') * .42 + n('vitesse') * .18 + n('physique') * .15 + n('mental') * .15 + n('dribble') * .10,
            AD: n('vitesse') * .28 + n('dribble') * .28 + n('passe') * .20 + n('tir') * .14 + n('physique') * .10,
            AG: n('vitesse') * .28 + n('dribble') * .28 + n('passe') * .20 + n('tir') * .14 + n('physique') * .10,
            MOC: n('passe') * .34 + n('dribble') * .22 + n('mental') * .24 + n('tir') * .12 + n('vitesse') * .08,
            MC: n('passe') * .28 + n('mental') * .20 + n('physique') * .18 + n('defense') * .18 + n('vitesse') * .16,
            MDEF: n('defense') * .35 + n('physique') * .28 + n('passe') * .20 + n('mental') * .17,
            DC: n('defense') * .36 + n('physique') * .28 + n('tete') * .18 + n('passe') * .10 + n('vitesse') * .08,
            DD: n('vitesse') * .28 + n('defense') * .27 + n('physique') * .20 + n('passe') * .13 + n('dribble') * .12,
            DG: n('vitesse') * .28 + n('defense') * .27 + n('physique') * .20 + n('passe') * .13 + n('dribble') * .12,
            GK: n('defense') * .40 + n('mental') * .30 + n('physique') * .20 + n('passe') * .10
        };
        return fits[position] ?? 0;
    },

    positionName(id) { return POSITIONS.find(p => p.id === id)?.name || id; },

    applyPositionChange(player, accepted, proposal) {
        if (!proposal || !player?.careerProfile) return false;
        if (!accepted) return true;
        player.position = proposal.to;
        player.careerProfile.preferredPosition = proposal.to;
        player.careerProfile.positionHistory.push({ age: player.age, position: proposal.to, reason: 'coach_detection' });
        player.careerProfile.adaptation[proposal.to] = 20;
        return true;
    },

    recruitmentOffer(player) {
        if (!player || player.age < 15 || player.age > 21 || !player.careerProfile) return null;
        const current = player.club;
        const pool = YOUTH_CLUBS_POOL.filter(c => c?.name && c.name !== current && (c.prestige || 0) >= Math.max(30, (player.overall || 40) + 5));
        if (!pool.length) return null;
        const form = player.stats?.averageRating || 0;
        const probability = clamp(0.025 + Math.max(0, form - 6.5) * .02 + (player.fame || 10) / 1000, .015, .16);
        if (Math.random() > probability) return null;
        const club = pool[Math.floor(Math.random() * pool.length)];
        const offer = {
            club: club.name,
            prestige: club.prestige,
            centerStars: centerStars(club),
            stage: careerStage(player.age),
            type: player.age < 18 ? 'recrutement_formation' : 'recrutement_senior',
            salary: Math.round((player.salary || 100) * (1.15 + Math.random() * .9)),
            reason: form >= 7.3 ? 'Vos performances récentes ont attiré leur cellule de recrutement.' : 'Leur cellule de recrutement suit votre progression.'
        };
        player.careerProfile.recruitmentHistory.push({ age: player.age, offer });
        return offer;
    }
};
