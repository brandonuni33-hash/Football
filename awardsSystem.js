// awardsSystem.js
// Récompenses individuelles de fin de saison.
// Le joueur est comparé à une génération de concurrents simulés de façon
// déterministe : les récompenses restent donc rares et crédibles.

const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));

function hashSeed(input) {
    let h = 2166136261;
    for (const char of String(input)) {
        h ^= char.charCodeAt(0);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function rng(seed) {
    let value = seed >>> 0;
    return () => {
        value += 0x6D2B79F5;
        let t = value;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function round(value, digits = 1) {
    const factor = 10 ** digits;
    return Math.round(Number(value || 0) * factor) / factor;
}

function playerSeasonScore(player, season, trophies = {}) {
    const matches = Number(season?.matches || 0);
    const goals = Number(season?.goals || 0);
    const assists = Number(season?.assists || 0);
    const rating = Number(season?.averageRating || 0);
    const overall = Number(season?.overall || player?.overall || 0);
    const prestige = Number(player?.clubPrestige || player?.youthClubData?.prestige || 40);

    const participation = clamp(matches / 35, 0, 1);
    const performance = clamp((rating - 5.5) / 3.0, 0, 1.2);
    const production = clamp((goals + assists * 0.7) / 35, 0, 1.2);
    const quality = clamp(overall / 95, 0, 1.1);
    const club = clamp(prestige / 100, 0, 1);
    const trophyBonus = clamp(Number(trophies.count || 0) * 0.045, 0, 0.18);

    return clamp(
        quality * 30 + performance * 28 + production * 22 + participation * 10 + club * 5 + trophyBonus * 100,
        0,
        100
    );
}

function generateRival(player, season, index, random) {
    const archetypes = [
        { name: 'L’attaquant vedette', position: 'BU', base: 88 },
        { name: 'Le meneur international', position: 'MOC', base: 87 },
        { name: 'L’ailier superstar', position: 'AD', base: 86 },
        { name: 'Le milieu dominant', position: 'MC', base: 85 },
        { name: 'Le défenseur référence', position: 'DC', base: 84 },
        { name: 'Le gardien de classe mondiale', position: 'GK', base: 84 }
    ];
    const archetype = archetypes[index % archetypes.length];
    const quality = clamp(archetype.base + Math.round((random() - 0.5) * 12), 76, 96);
    const rating = round(clamp(6.9 + (quality - 80) * 0.045 + (random() - 0.5) * 0.5, 6.7, 8.3), 2);
    const matches = Math.round(27 + random() * 11);
    const attacking = ['BU', 'AD', 'MOC'].includes(archetype.position);
    const goals = attacking ? Math.round(matches * (0.18 + random() * 0.35)) : Math.round(matches * (0.015 + random() * 0.08));
    const assists = Math.round(matches * (attacking ? 0.12 + random() * 0.22 : 0.03 + random() * 0.10));

    return {
        name: `${archetype.name} ${index + 1}`,
        position: archetype.position,
        overall: quality,
        matches,
        goals,
        assists,
        averageRating: rating,
        score: clamp(rating * 7 + goals * 0.7 + assists * 0.35 + quality * 0.22, 0, 100)
    };
}

function trophySummary(cupHistory = [], playerClub) {
    const trophies = [];
    for (const cup of cupHistory || []) {
        if (cup?.champion && cup.champion === playerClub) trophies.push(cup.name);
    }
    return trophies;
}

export const AwardsSystem = {
    ensure(state) {
        if (!state?.career) return null;
        state.career.awards ||= [];
        state.career.palmares ||= {
            leagueTitles: 0,
            nationalCups: 0,
            europeanTitles: 0,
            internationalTitles: 0,
            individualAwards: 0
        };
        return state.career.awards;
    },

    finalizeSeason(state, season, cupHistory = []) {
        const player = state?.player;
        if (!player || !state?.career) return null;

        this.ensure(state);

        const seasonLabel = season?.seasonLabel || `${state.calendar?.currentSeasonYear}/${Number(state.calendar?.currentSeasonYear || 0) + 1}`;
        const trophies = trophySummary(cupHistory, player.club);
        const seed = hashSeed(`${seasonLabel}|${player.id || ''}|${player.club || ''}|${player.overall || 0}`);
        const random = rng(seed);

        const seasonScore = playerSeasonScore(player, season, { count: trophies.length });
        const rivals = Array.from({ length: 9 }, (_, index) => generateRival(player, season, index, random));
        const playerCandidate = {
            name: `${player.firstname || 'Joueur'} ${player.lastname || ''}`.trim(),
            position: player.position,
            overall: Number(season?.overall || player.overall || 0),
            matches: Number(season?.matches || 0),
            goals: Number(season?.goals || 0),
            assists: Number(season?.assists || 0),
            averageRating: round(season?.averageRating || 0, 2),
            score: seasonScore
        };

        const ranking = [...rivals, playerCandidate].sort((a, b) => b.score - a.score);
        const rank = ranking.findIndex(candidate => candidate === playerCandidate) + 1;
        const awards = [];

        // Récompense nationale : exige une vraie saison et un niveau de performance.
        if (seasonScore >= 70 && Number(season?.matches || 0) >= 15) {
            awards.push({
                id: 'PLAYER_OF_SEASON',
                name: 'Joueur de la saison',
                prestige: 'national',
                season: seasonLabel,
                reason: `Saison notée ${round(season?.averageRating || 0, 2)} avec ${season?.goals || 0} but(s) et ${season?.assists || 0} passe(s) décisive(s).`
            });
        }

        // Équipe de l'année : plus accessible que le Ballon d'Or mais toujours rare.
        if (seasonScore >= 66 && Number(season?.matches || 0) >= 20) {
            awards.push({
                id: 'TEAM_OF_YEAR',
                name: 'Équipe de l’année',
                prestige: 'national',
                season: seasonLabel,
                position: player.position,
                reason: `Présence régulière avec ${season?.matches || 0} match(s) disputé(s).`
            });
        }

        // Ballon d'Or : podium + seuil élevé. Le joueur ne gagne pas uniquement
        // grâce à son potentiel : la saison jouée reste déterminante.
        if (rank <= 3 && seasonScore >= 82 && Number(season?.matches || 0) >= 25) {
            awards.push({
                id: rank === 1 ? 'BALLON_D_OR' : 'BALLON_D_OR_PODIUM',
                name: rank === 1 ? 'Ballon d’Or' : 'Podium du Ballon d’Or',
                prestige: 'mondial',
                season: seasonLabel,
                rank,
                reason: `Classement mondial : ${rank}e avec un score de saison de ${round(seasonScore)}.`
            });
        }

        // Meilleur jeune : récompense possible uniquement avant 21 ans.
        if (Number(player.age) <= 21 && seasonScore >= 62 && Number(season?.matches || 0) >= 15) {
            awards.push({
                id: 'YOUNG_PLAYER_OF_YEAR',
                name: 'Meilleur jeune',
                prestige: 'jeune',
                season: seasonLabel,
                reason: `Progression remarquable à ${player.age} ans.`
            });
        }

        for (const award of awards) {
            state.career.awards.push(award);
            state.career.palmares.individualAwards += 1;
        }

        const report = {
            season: seasonLabel,
            score: round(seasonScore),
            worldRank: rank,
            trophies,
            awards,
            ranking: ranking.slice(0, 5).map(candidate => ({
                name: candidate.name,
                position: candidate.position,
                score: round(candidate.score),
                player: candidate === playerCandidate
            }))
        };

        state.career.lastAwardsReport = report;
        return report;
    },

    getCareerSummary(state) {
        this.ensure(state);
        const awards = state?.career?.awards || [];
        return {
            awards: [...awards],
            palmares: { ...(state?.career?.palmares || {}) },
            ballonDor: awards.filter(a => a.id === 'BALLON_D_OR').length,
            playerOfSeason: awards.filter(a => a.id === 'PLAYER_OF_SEASON').length,
            teamOfYear: awards.filter(a => a.id === 'TEAM_OF_YEAR').length,
            youngPlayer: awards.filter(a => a.id === 'YOUNG_PLAYER_OF_YEAR').length
        };
    }
};

export default AwardsSystem;
