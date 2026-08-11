// domain/world/worldSystem.js
// Logique du monde : clubs, classements, simulation et mouvements de divisions.

import { LEAGUES, CLUB_DATABASE, COUNTRY_TOP, LOWER_OF } from './worldCatalog.js';

const CLUBS = CLUB_DATABASE;
const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));

function blankRow(club) { return { clubId: club.id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }; }
function applyClubAssignments(assignments = {}) { for (const club of CLUBS) { const leagueId = assignments[club.id]; if (!leagueId || !LEAGUES[leagueId]) continue; club.leagueId = leagueId; club.tier = LEAGUES[leagueId].tier; } }
function captureClubAssignments() { return Object.fromEntries(CLUBS.map(club => [club.id, club.leagueId])); }
function syncPlayerClubFields(state) { const player = state?.player; if (!player || Number(player.age) < 18 || player.isYouthPlayer) return null; const club = CLUBS.find(c => c.id === player.clubId) || CLUBS.find(c => c.name === player.club); if (!club) return null; player.clubId = club.id; player.club = club.name; player.clubCountry = club.country; player.clubLevel = club.tier; player.leagueId = club.leagueId; player.clubPrestige = club.prestige; player.centerStars = club.centerStars; return club; }
function sortRows(rows) { return [...rows].sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.clubId.localeCompare(b.clubId)); }
function seededNoise(seed) { let x = (seed >>> 0) || 1; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 10000) / 10000; }; }

export const WorldSystem = {
    LEAGUES,
    CLUB_DATABASE: CLUBS,
    getClub(idOrName) { if (!idOrName) return null; const needle = String(idOrName).toLowerCase(); return CLUBS.find(c => c.id.toLowerCase() === needle || c.name.toLowerCase() === needle) || null; },
    getLeague(leagueId) { return LEAGUES[leagueId] || null; },
    getClubs(leagueId) { return CLUBS.filter(c => c.leagueId === leagueId); },
    getLeagueForClub(clubIdOrName) { const club = this.getClub(clubIdOrName); return club ? LEAGUES[club.leagueId] : null; },
    findYouthDestination(youthClub) { const name = String(youthClub?.name || youthClub || '').toLowerCase(), country = youthClub?.country || 'France'; const candidates = CLUBS.filter(c => c.country === country && c.tier <= 2); const exact = candidates.find(c => name.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(name.replace(/\s+u\d+.*$/i, ''))); if (exact) return exact; const byPrestige = candidates.sort((a, b) => b.centerStars - a.centerStars || b.prestige - a.prestige); return byPrestige[0] || CLUBS[0]; },
    normalizeCareerClub(player) { if (!player) return null; if (Number(player.age) < 18 || player.isYouthPlayer === true) { player.isYouthPlayer = true; return null; } let club = this.getClub(player.clubId || player.club); if (!club && player.club) club = this.findYouthDestination({ name: player.club, country: player.clubCountry || player.country, prestige: player.careerProfile?.centerStars ? player.careerProfile.centerStars * 20 : 50 }); if (!club) club = this.getClubs(COUNTRY_TOP[player.country] || 'FR_L1')[0] || CLUBS[0]; player.clubId = club.id; player.club = club.name; player.clubCountry = club.country; player.clubLevel = club.tier; player.leagueId = club.leagueId; player.clubPrestige = club.prestige; player.centerStars = club.centerStars; player.isYouthPlayer = false; return club; },
    ensureWorld(state) { state.world ||= { version: 2, leagues: {}, lastSeasonFinalized: null, clubAssignments: {} }; state.world.version = Math.max(2, Number(state.world.version) || 2); state.world.leagues ||= {}; state.world.clubAssignments ||= captureClubAssignments(); applyClubAssignments(state.world.clubAssignments); for (const league of Object.values(LEAGUES)) { const clubs = this.getClubs(league.id); if (!state.world.leagues[league.id]) state.world.leagues[league.id] = { id: league.id, name: league.name, seasonYear: Number(state.calendar?.currentSeasonYear) || 2026, table: clubs.map(blankRow), matchday: 0, lastResults: [] }; else { state.world.leagues[league.id].table ||= clubs.map(blankRow); state.world.leagues[league.id].seasonYear = Number(state.calendar?.currentSeasonYear) || state.world.leagues[league.id].seasonYear; } } if (state.player && Number(state.player.age) >= 18) this.normalizeCareerClub(state.player); state.world.clubAssignments = captureClubAssignments(); syncPlayerClubFields(state); return state.world; },
    getTable(state, leagueId) { this.ensureWorld(state); const league = LEAGUES[leagueId]; if (!league) return []; const worldLeague = state.world.leagues[leagueId]; const clubMap = new Map(this.getClubs(leagueId).map(c => [c.id, c])); return sortRows(worldLeague.table).map((row, index) => ({ ...row, rank: index + 1, club: clubMap.get(row.clubId) || null })); },
    getPlayerLeagueTable(state) { const club = this.normalizeCareerClub(state.player); return club ? this.getTable(state, club.leagueId) : []; },
    recordMatch(state, fixture, homeGoals, awayGoals) { const leagueId = fixture?.leagueId || fixture?.competitionId; if (!LEAGUES[leagueId]) return null; const worldLeague = state.world.leagues[leagueId], home = worldLeague.table.find(r => r.clubId === fixture.homeClubId), away = worldLeague.table.find(r => r.clubId === fixture.awayClubId); if (!home || !away) return null; home.played += 1; away.played += 1; home.gf += homeGoals; home.ga += awayGoals; away.gf += awayGoals; away.ga += homeGoals; home.gd = home.gf - home.ga; away.gd = away.gf - away.ga; if (homeGoals > awayGoals) { home.won += 1; home.points += 3; away.lost += 1; } else if (homeGoals < awayGoals) { away.won += 1; away.points += 3; home.lost += 1; } else { home.drawn += 1; away.drawn += 1; home.points += 1; away.points += 1; } worldLeague.matchday += 1; worldLeague.lastResults.unshift({ ...fixture, homeGoals, awayGoals }); worldLeague.lastResults = worldLeague.lastResults.slice(0, 10); return { home, away }; },
    simulateLeagueMonth(state, leagueId, seed = 1) { this.ensureWorld(state); const clubs = this.getClubs(leagueId); if (!clubs.length) return []; const random = seededNoise(seed + leagueId.length * 97 + (state.calendar?.currentMonth || 8)), worldLeague = state.world.leagues[leagueId], results = []; const shuffled = [...clubs].sort(() => random() - 0.5), playerClubId = state.player?.clubId || this.getClub(state.player?.club)?.id || null; for (let i = 0; i + 1 < shuffled.length; i += 2) { const homeClub = shuffled[i], awayClub = shuffled[i + 1]; if (homeClub.id === playerClubId || awayClub.id === playerClubId) continue; const homeGoals = clamp(Math.floor(random() * (1.3 + homeClub.strength / 70)), 0, 5), awayGoals = clamp(Math.floor(random() * (1.0 + awayClub.strength / 75)), 0, 5); const fixture = { leagueId, competitionId: leagueId, homeClubId: homeClub.id, awayClubId: awayClub.id, month: state.calendar.currentMonth }; this.recordMatch(state, fixture, homeGoals, awayGoals); results.push({ fixture, homeGoals, awayGoals }); } worldLeague.lastSimulationMonth = state.calendar.currentMonth; return results; },
    simulateAllLeaguesMonth(state, seed = 1) { this.ensureWorld(state); const results = [], month = Number(state?.calendar?.currentMonth) || 8; if ([6, 7].includes(month)) return results; let index = 0; for (const league of Object.values(LEAGUES)) { results.push(...this.simulateLeagueMonth(state, league.id, Number(seed) + index * 9973 + month * 131)); index += 1; } return results; },

    recordPlayerMatches(state, scheduledMatches = [], summary = {}) {
        this.ensureWorld(state);
        const playerClubId = state.player?.clubId || this.getClub(state.player?.club)?.id;
        if (!playerClubId) return [];
        const leagueMatches = scheduledMatches.filter(match => match.type === 'league' && match.leagueId);
        if (!leagueMatches.length) return [];
        const matchResults = Array.isArray(summary.matchResults) ? summary.matchResults : [];
        const results = [];

        for (let scheduleIndex = 0; scheduleIndex < leagueMatches.length; scheduleIndex += 1) {
            const match = leagueMatches[scheduleIndex];
            if (!match.opponentClubId) continue;

            // Interactive results carry their original fixture. Prefer that identity
            // over matchIndex because the index may belong to the complete season plan.
            const individual = matchResults.find(result => {
                const fixture = result?.fixture;
                if (fixture) {
                    return fixture.homeClubId === match.homeClubId && fixture.awayClubId === match.awayClubId && fixture.competitionId === match.competitionId;
                }
                return Number(result?.matchIndex) === Number(match.matchIndex ?? scheduleIndex);
            });

            let homeGoals;
            let awayGoals;
            if (individual?.score && Number.isFinite(Number(individual.score.home)) && Number.isFinite(Number(individual.score.away))) {
                // The world uses the exact score already produced by the player's match.
                homeGoals = clamp(Number(individual.score.home), 0, 5);
                awayGoals = clamp(Number(individual.score.away), 0, 5);
            } else {
                const playerGoals = Math.max(0, Number(individual?.goals || 0));
                const teamSupportGoals = Math.floor(Math.random() * 2);
                homeGoals = match.homeClubId === playerClubId ? Math.min(5, playerGoals + teamSupportGoals) : Math.floor(Math.random() * 3);
                awayGoals = match.awayClubId === playerClubId ? Math.min(5, playerGoals + teamSupportGoals) : Math.floor(Math.random() * 3);
            }

            const fixture = { ...match, leagueId: match.leagueId, homeClubId: match.homeClubId, awayClubId: match.awayClubId };
            this.recordMatch(state, fixture, homeGoals, awayGoals);
            results.push({ fixture, homeGoals, awayGoals, playerGoals: Math.max(0, Number(individual?.goals || 0)) });
        }
        return results;
    },

    finalizeSeason(state) { this.ensureWorld(state); const movements = []; for (const topLeague of Object.values(LEAGUES).filter(league => league.tier === 1)) { const lowerId = LOWER_OF[topLeague.id]; if (!lowerId) continue; const lowerLeague = LEAGUES[lowerId]; if (!lowerLeague) continue; const topTable = sortRows(state.world.leagues[topLeague.id].table).map((row, index) => ({ ...row, rank: index + 1 })), lowerTable = sortRows(state.world.leagues[lowerId].table).map((row, index) => ({ ...row, rank: index + 1 })); const count = Math.min(Number(topLeague.relegation) || 0, Number(lowerLeague.promotion) || 0); if (count <= 0) continue; const relegated = topTable.slice(-count).map(row => row.clubId), promoted = lowerTable.slice(0, count).map(row => row.clubId), pairs = []; for (let i = 0; i < count; i += 1) { const downId = relegated[i], upId = promoted[i], downClub = CLUBS.find(club => club.id === downId), upClub = CLUBS.find(club => club.id === upId); if (!downClub || !upClub) continue; downClub.leagueId = lowerId; downClub.tier = lowerLeague.tier; upClub.leagueId = topLeague.id; upClub.tier = topLeague.tier; pairs.push({ promoted: { id: upClub.id, name: upClub.name, from: lowerId, to: topLeague.id }, relegated: { id: downClub.id, name: downClub.name, from: topLeague.id, to: lowerId } }); } if (pairs.length) movements.push({ type: 'division_exchange', higherLeague: topLeague.id, lowerLeague: lowerId, promoted: pairs.map(pair => pair.promoted), relegated: pairs.map(pair => pair.relegated), pairs }); } state.world.clubAssignments = captureClubAssignments(); state.world.lastSeasonFinalized = { year: state.calendar.currentSeasonYear, movements, finalizedAt: Date.now() }; syncPlayerClubFields(state); return movements; },
    resetSeasonTables(state, newYear) { this.ensureWorld(state); applyClubAssignments(state.world.clubAssignments || {}); for (const league of Object.values(LEAGUES)) { const worldLeague = state.world.leagues[league.id]; worldLeague.seasonYear = newYear; worldLeague.matchday = 0; worldLeague.table = this.getClubs(league.id).map(blankRow); worldLeague.lastResults = []; } },
    isOffSeason(month) { return [6, 7].includes(Number(month)); },
    getClubSummary(player) { const club = this.getClub(player?.clubId || player?.club); if (!club) return null; const league = LEAGUES[club.leagueId]; return { ...club, leagueName: league?.name || null, clubStars: Math.max(1, Math.min(5, Math.round(club.prestige / 20))), centerStars: club.centerStars }; }
};
export { CLUBS };
export default WorldSystem;
