// worldSystem.js
// Phase 2B — monde des clubs : clubs, divisions, réputations, centres,
// classements persistants et premières montées/relégations.

const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));

const makeClub = (id, name, country, leagueId, tier, strength, prestige, centerStars, finances = 3) => ({
    id, name, country, leagueId, tier, strength, prestige, centerStars, finances,
    academyType: centerStars >= 5 ? 'élite' : centerStars >= 4 ? 'excellente' : centerStars >= 3 ? 'structurée' : 'locale'
});

// Base jouable. Les listes sont volontairement compactes à cette étape :
// la structure accepte autant de clubs que nécessaire et sera étendue sans
// changer les interfaces du moteur.
export const LEAGUES = {
    FR_L1: { id: 'FR_L1', name: 'Ligue 1', country: 'France', tier: 1, size: 18, promotion: false, relegation: 3 },
    FR_L2: { id: 'FR_L2', name: 'Ligue 2', country: 'France', tier: 2, size: 18, promotion: 2, relegation: 3 },
    EN_PL: { id: 'EN_PL', name: 'Premier League', country: 'Angleterre', tier: 1, size: 20, promotion: false, relegation: 3 },
    EN_CH: { id: 'EN_CH', name: 'Championship', country: 'Angleterre', tier: 2, size: 24, promotion: 3, relegation: 3 },
    ES_LA: { id: 'ES_LA', name: 'La Liga', country: 'Espagne', tier: 1, size: 20, promotion: false, relegation: 3 },
    ES_SD: { id: 'ES_SD', name: 'Segunda División', country: 'Espagne', tier: 2, size: 22, promotion: 3, relegation: 4 },
    IT_A: { id: 'IT_A', name: 'Serie A', country: 'Italie', tier: 1, size: 20, promotion: false, relegation: 3 },
    IT_B: { id: 'IT_B', name: 'Serie B', country: 'Italie', tier: 2, size: 20, promotion: 3, relegation: 3 },
    DE_B1: { id: 'DE_B1', name: 'Bundesliga', country: 'Allemagne', tier: 1, size: 18, promotion: false, relegation: 3 },
    DE_B2: { id: 'DE_B2', name: '2. Bundesliga', country: 'Allemagne', tier: 2, size: 18, promotion: 3, relegation: 3 }
};

const CLUBS = [
    // France
    ...[
        ['PSG','Paris Saint-Germain',92,5,5,5],['OM','Olympique de Marseille',82,4,4,4],['ASM','AS Monaco',84,4,4,4],['OL','Olympique Lyonnais',79,4,5,3],['LOSC','Lille OSC',80,4,4,3],['SRFC','Stade Rennais',76,3,4,3],['OGCN','OGC Nice',75,3,4,3],['RCM','RC Strasbourg',70,3,3,3],['FCN','FC Nantes',67,3,3,2],['TFC','Toulouse FC',66,3,3,2],['RCL','RC Lens',77,3,4,3],['Brest','Stade Brestois',72,3,3,2],['Montpellier','Montpellier HSC',64,2,3,2],['Auxerre','AJ Auxerre',63,2,3,2],['LeHavre','Le Havre AC',61,2,3,2],['Reims','Stade de Reims',68,3,3,2],['Metz','FC Metz',60,2,2,2],['ASSE','AS Saint-Étienne',69,3,4,2]
    ].map(c=>makeClub(c[0],c[1],'France','FR_L1',1,c[2],c[3],c[4],c[5])),
    ...[
        ['L2_ParisFC','Paris FC',69,3,3,3],['L2_Lorient','FC Lorient',72,3,4,3],['L2_Grenoble','Grenoble Foot 38',62,2,3,2],['L2_Caen','SM Caen',61,2,3,2],['L2_Bastia','SC Bastia',63,2,3,2],['L2_Guincamp','EA Guingamp',64,2,3,2],['L2_Amiens','Amiens SC',60,2,3,2],['L2_Laval','Stade Lavallois',57,2,2,2],['L2_Pau','Pau FC',55,2,2,1],['L2_Clermont','Clermont Foot',62,2,3,2],['L2_RedStar','Red Star FC',56,2,3,2],['L2_Annecy','FC Annecy',55,2,2,2],['L2_Rodez','Rodez AF',54,1,2,1],['L2_Dunkerque','USL Dunkerque',55,2,2,1],['L2_Troyes','ESTAC Troyes',60,2,3,2],['L2_Ajaccio','AC Ajaccio',59,2,3,2],['L2_Martigues','FC Martigues',52,1,2,1],['L2_Boulogne','US Boulogne',51,1,2,1]
    ].map(c=>makeClub(c[0],c[1],'France','FR_L2',2,c[2],c[3],c[4],c[5])),
    // England
    ...[
        ['ARS','Arsenal',92,5,5,5],['MCI','Manchester City',91,5,5,5],['LIV','Liverpool',90,5,5,5],['MUN','Manchester United',84,5,5,5],['CHE','Chelsea',83,5,5,5],['TOT','Tottenham',80,4,5,4],['AVL','Aston Villa',81,4,4,4],['NEW','Newcastle United',82,4,4,4],['WHU','West Ham United',74,4,4,3],['CRY','Crystal Palace',73,3,3,3],['BRI','Brighton',77,4,4,3],['EVE','Everton',72,4,4,3],['BRE','Brentford',72,3,3,3],['FUL','Fulham',71,3,3,3],['BOU','Bournemouth',70,3,3,3],['NFO','Nottingham Forest',70,3,3,3],['WOL','Wolverhampton',68,3,3,2],['LEI','Leicester City',68,3,4,2],['LEE','Leeds United',71,3,4,3],['SUN','Sunderland',66,3,3,2]
    ].map(c=>makeClub(c[0],c[1],'Angleterre','EN_PL',1,c[2],c[3],c[4],c[5])),
    ...[
        ['CH_LDS','Leicester City',70,3,4,3],['CH_BUR','Burnley',70,3,4,3],['CH_SHEF','Sheffield United',69,3,4,3],['CH_SWA','Swansea City',67,3,3,3],['CH_WBA','West Bromwich Albion',67,3,4,3],['CH_NOR','Norwich City',66,3,4,3],['CH_MID','Middlesbrough',66,3,4,3],['CH_COV','Coventry City',65,3,3,2],['CH_WAT','Watford',64,3,3,3],['CH_QPR','Queens Park Rangers',61,2,3,2],['CH_STOKE','Stoke City',62,2,3,2],['CH_CARD','Cardiff City',61,2,3,2],['CH_HULL','Hull City',60,2,3,2],['CH_BLACK','Blackburn Rovers',61,3,3,2],['CH_BRISTOL','Bristol City',62,3,3,2],['CH_PRESTON','Preston North End',59,2,3,2],['CH_MILL','Millwall',58,2,3,2],['CH_SHEFFW','Sheffield Wednesday',58,2,3,2],['CH_PORT','Portsmouth',57,2,3,2],['CH_DERBY','Derby County',59,2,3,2],['CH_PLY','Plymouth Argyle',55,2,2,2],['CH_OXF','Oxford United',55,2,2,2],['CH_RHOV','Rotherham United',53,2,2,1],['CH_WATF','Watford B',52,1,2,1]
    ].map(c=>makeClub(c[0],c[1],'Angleterre','EN_CH',2,c[2],c[3],c[4],c[5])),
    // Spain
    ...[
        ['RMA','Real Madrid',94,5,5,5],['FCB','FC Barcelona',91,5,5,5],['ATM','Atlético de Madrid',87,5,5,5],['ATH','Athletic Club',78,4,4,4],['VIL','Villarreal CF',79,4,4,3],['RSO','Real Sociedad',78,4,4,3],['BET','Real Betis',76,4,4,3],['SEV','Sevilla FC',75,4,4,3],['VAL','Valencia CF',72,4,4,3],['GIR','Girona FC',73,3,3,3],['CEL','Celta Vigo',68,3,3,2],['GET','Getafe CF',67,3,3,2],['OSA','Osasuna',68,3,3,2],['MAL','RCD Mallorca',68,3,3,2],['ALA','Deportivo Alavés',65,3,3,2],['RAY','Rayo Vallecano',66,3,3,2],['ESP','Espanyol',67,3,4,2],['LEG','Leganés',61,2,2,2],['OVI','Real Oviedo',60,2,2,2],['ELC','Elche CF',61,2,3,2]
    ].map(c=>makeClub(c[0],c[1],'Espagne','ES_LA',1,c[2],c[3],c[4],c[5])),
    ...[
        ['SD_EIB','Eibar',68,3,3,2],['SD_LEV','Levante',67,3,3,2],['SD_ALM','Almería',69,3,4,3],['SD_GRN','Granada',67,3,3,2],['SD_ZAR','Real Zaragoza',65,3,4,2],['SD_HUE','Huesca',61,2,3,2],['SD_RAC','Racing Santander',60,2,3,2],['SD_SPO','Sporting Gijón',63,3,3,2],['SD_MIR','Mirandés',56,2,2,1],['SD_BUR','Burgos CF',57,2,2,1],['SD_ALB','Albacete',56,2,2,1],['SD_CAD','Cádiz CF',64,3,3,2],['SD_TEN','Tenerife',58,2,3,2],['SD_ELD','Eldense',54,2,2,1],['SD_CUL','Cultural Leonesa',52,1,2,1],['SD_CEU','Ceuta',51,1,2,1],['SD_MAL2','Málaga CF',62,3,3,2],['SD_COR','Córdoba CF',58,2,3,2],['SD_DEP','Deportivo La Coruña',63,3,4,2],['SD_ALC','Albacete B',51,1,2,1],['SD_CAR','Cartagena',52,2,2,1],['SD_CAST','Castellón',55,2,2,1]
    ].map(c=>makeClub(c[0],c[1],'Espagne','ES_SD',2,c[2],c[3],c[4],c[5])),
    // Italy
    ...[
        ['INT','Inter',90,5,5,5],['MIL','AC Milan',85,5,5,4],['JUV','Juventus',86,5,5,5],['NAP','Napoli',86,5,4,4],['ROM','AS Roma',82,4,4,4],['LAZ','Lazio',78,4,4,3],['ATA','Atalanta',82,4,4,4],['FIO','Fiorentina',76,4,4,3],['BOL','Bologna',75,4,4,3],['TOR','Torino',70,3,3,3],['GEN','Genoa',68,3,3,2],['UDI','Udinese',65,3,3,2],['SAS','Sassuolo',66,3,3,2],['CAG','Cagliari',62,2,3,2],['PAR','Parma',65,3,3,2],['COM','Como',68,3,3,3],['VER','Hellas Verona',63,3,3,2],['LEC','Lecce',61,2,2,2],['PIS','Pisa',58,2,2,1],['CRE','Cremonese',59,2,3,2]
    ].map(c=>makeClub(c[0],c[1],'Italie','IT_A',1,c[2],c[3],c[4],c[5])),
    ...[
        ['SB_MON','Monza',67,3,3,3],['SB_EMP','Empoli',66,3,3,2],['SB_SAM','Sampdoria',69,4,4,3],['SB_PAL','Palermo',68,3,4,3],['SB_BARI','Bari',63,3,3,2],['SB_SPE','Spezia',64,3,3,2],['SB_CATA','Catanzaro',59,2,2,2],['SB_CES','Cesena',58,2,3,2],['SB_MOD','Modena',58,2,2,2],['SB_MANT','Mantova',54,1,2,1],['SB_REG','Reggiana',55,2,2,1],['SB_SUD','Südtirol',54,2,2,1],['SB_JUV','Juve Stabia',53,1,2,1],['SB_AVE','Avellino',53,2,2,1],['SB_VIR','Virtus Entella',52,1,2,1],['SB_PAD','Padova',57,2,3,2],['SB_PES','Pescara',56,2,3,2],['SB_ARE','Arezzo',51,1,2,1],['SB_BEN','Benevento',55,2,2,1],['SB_CAR','Carrarese',50,1,2,1]
    ].map(c=>makeClub(c[0],c[1],'Italie','IT_B',2,c[2],c[3],c[4],c[5])),
    // Germany — current 2026/27 Bundesliga 2 club set is aligned with the official Bundesliga club list.
    ...[
        ['BAY','Bayern Munich',94,5,5,5],['BVB','Borussia Dortmund',86,5,5,5],['LEV','Bayer Leverkusen',88,5,5,5],['RBL','RB Leipzig',83,4,5,4],['SGE','Eintracht Frankfurt',79,4,4,4],['SCF','SC Freiburg',73,3,4,3],['M05','Mainz 05',72,3,3,3],['BMG','Borussia Mönchengladbach',71,4,4,3],['SVW','Werder Bremen',70,4,4,3],['VFB','VfB Stuttgart',78,4,4,4],['WOB','VfL Wolfsburg',72,4,4,3],['FCU','Union Berlin',69,3,3,3],['FCA','Augsburg',65,3,3,2],['TSG','Hoffenheim',68,3,3,2],['KOE','1. FC Köln',65,3,3,2],['HSV','Hamburger SV',70,4,4,3],['STP','FC St. Pauli',68,3,3,3],['HEI','1. FC Heidenheim',64,3,3,2]
    ].map(c=>makeClub(c[0],c[1],'Allemagne','DE_B1',1,c[2],c[3],c[4],c[5])),
    ...[
        ['DB_WOL','VfL Wolfsburg',67,3,3,3],['DB_HEI','1. FC Heidenheim',63,3,3,2],['DB_STP','FC St. Pauli',65,3,3,3],['DB_HAN','Hannover 96',66,3,4,3],['DB_DAR','SV Darmstadt 98',60,2,3,2],['DB_KAI','1. FC Kaiserslautern',62,3,3,2],['DB_HER','Hertha BSC',68,4,4,3],['DB_NUE','1. FC Nürnberg',63,3,3,2],['DB_BOC','VfL Bochum',65,3,3,3],['DB_KAR','Karlsruher SC',59,2,3,2],['DB_DRE','Dynamo Dresden',60,3,3,2],['DB_HOL','Holstein Kiel',61,3,3,2],['DB_ARM','Arminia Bielefeld',58,2,3,2],['DB_MAG','1. FC Magdeburg',60,2,3,2],['DB_BRA','Eintracht Braunschweig',55,2,2,1],['DB_FUR','Greuther Fürth',56,2,3,2],['DB_COT','Energie Cottbus',53,1,2,1],['DB_OSN','VfL Osnabrück',52,1,2,1]
    ].map(c=>makeClub(c[0],c[1],'Allemagne','DE_B2',2,c[2],c[3],c[4],c[5]))
];

export const CLUB_DATABASE = Object.freeze(CLUBS);

const countryTop = { France: 'FR_L1', Angleterre: 'EN_PL', Espagne: 'ES_LA', Italie: 'IT_A', Allemagne: 'DE_B1' };
const countrySecond = { France: 'FR_L2', Angleterre: 'EN_CH', Espagne: 'ES_SD', Italie: 'IT_B', Allemagne: 'DE_B2' };
const lowerOf = { FR_L1:'FR_L2', EN_PL:'EN_CH', ES_LA:'ES_SD', IT_A:'IT_B', DE_B1:'DE_B2' };
const higherOf = { FR_L2:'FR_L1', EN_CH:'EN_PL', ES_SD:'ES_LA', IT_B:'IT_A', DE_B2:'DE_B1' };

function blankRow(club) {
    return { clubId: club.id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
}

function sortRows(rows) {
    return [...rows].sort((a,b) => b.points-a.points || b.gd-a.gd || b.gf-a.gf || a.clubId.localeCompare(b.clubId));
}

function seededNoise(seed) {
    let x = (seed >>> 0) || 1;
    return () => {
        x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
        return ((x >>> 0) % 10000) / 10000;
    };
}

export const WorldSystem = {
    LEAGUES,
    CLUB_DATABASE,

    getClub(idOrName) {
        if (!idOrName) return null;
        const needle = String(idOrName).toLowerCase();
        return CLUBS.find(c => c.id.toLowerCase() === needle || c.name.toLowerCase() === needle) || null;
    },

    getLeague(leagueId) {
        return LEAGUES[leagueId] || null;
    },

    getClubs(leagueId) {
        return CLUBS.filter(c => c.leagueId === leagueId);
    },

    getLeagueForClub(clubIdOrName) {
        const club = this.getClub(clubIdOrName);
        return club ? LEAGUES[club.leagueId] : null;
    },

    findYouthDestination(youthClub) {
        const name = String(youthClub?.name || youthClub || '').toLowerCase();
        const country = youthClub?.country || 'France';
        const candidates = CLUBS.filter(c => c.country === country && c.tier <= 2);
        const exact = candidates.find(c => name.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(name.replace(/\s+u\d+.*$/i,'')));
        if (exact) return exact;
        const byPrestige = candidates.sort((a,b) => b.centerStars-a.centerStars || b.prestige-a.prestige);
        return byPrestige[0] || CLUBS[0];
    },

    normalizeCareerClub(player) {
        if (!player) return null;
        let club = this.getClub(player.clubId || player.club);
        if (!club && player.club) club = this.findYouthDestination({ name: player.club, country: player.clubCountry || player.country });
        if (!club) club = this.getClubs(countryTop[player.country] || 'FR_L1')[0] || CLUBS[0];
        player.clubId = club.id;
        player.club = club.name;
        player.clubCountry = club.country;
        player.clubLevel = club.tier;
        player.leagueId = club.leagueId;
        player.clubPrestige = club.prestige;
        player.centerStars = club.centerStars;
        return club;
    },

    ensureWorld(state) {
        state.world ||= { version: 1, leagues: {}, lastSeasonFinalized: null };
        for (const league of Object.values(LEAGUES)) {
            const clubs = this.getClubs(league.id);
            if (!state.world.leagues[league.id]) {
                state.world.leagues[league.id] = {
                    id: league.id,
                    name: league.name,
                    seasonYear: Number(state.calendar?.currentSeasonYear) || 2026,
                    table: clubs.map(blankRow),
                    matchday: 0,
                    lastResults: []
                };
            } else {
                state.world.leagues[league.id].table ||= clubs.map(blankRow);
                state.world.leagues[league.id].seasonYear = Number(state.calendar?.currentSeasonYear) || state.world.leagues[league.id].seasonYear;
            }
        }
        if (state.player) this.normalizeCareerClub(state.player);
        return state.world;
    },

    getTable(state, leagueId) {
        this.ensureWorld(state);
        const league = LEAGUES[leagueId];
        if (!league) return [];
        const worldLeague = state.world.leagues[leagueId];
        const clubMap = new Map(this.getClubs(leagueId).map(c => [c.id, c]));
        return sortRows(worldLeague.table).map((row, index) => ({ ...row, rank: index + 1, club: clubMap.get(row.clubId) || null }));
    },

    getPlayerLeagueTable(state) {
        const club = this.normalizeCareerClub(state.player);
        return club ? this.getTable(state, club.leagueId) : [];
    },

    recordMatch(state, fixture, homeGoals, awayGoals) {
        const leagueId = fixture?.leagueId || fixture?.competitionId;
        if (!LEAGUES[leagueId]) return null;
        const worldLeague = state.world.leagues[leagueId];
        const home = worldLeague.table.find(r => r.clubId === fixture.homeClubId);
        const away = worldLeague.table.find(r => r.clubId === fixture.awayClubId);
        if (!home || !away) return null;
        home.played += 1; away.played += 1;
        home.gf += homeGoals; home.ga += awayGoals;
        away.gf += awayGoals; away.ga += homeGoals;
        home.gd = home.gf - home.ga; away.gd = away.gf - away.ga;
        if (homeGoals > awayGoals) { home.won += 1; home.points += 3; away.lost += 1; }
        else if (homeGoals < awayGoals) { away.won += 1; away.points += 3; home.lost += 1; }
        else { home.drawn += 1; away.drawn += 1; home.points += 1; away.points += 1; }
        worldLeague.matchday += 1;
        worldLeague.lastResults.unshift({ ...fixture, homeGoals, awayGoals });
        worldLeague.lastResults = worldLeague.lastResults.slice(0, 10);
        return { home, away };
    },

    simulateLeagueMonth(state, leagueId, seed = 1) {
        this.ensureWorld(state);
        const clubs = this.getClubs(leagueId);
        if (!clubs.length) return [];
        const random = seededNoise(seed + leagueId.length * 97 + (state.calendar?.currentMonth || 8));
        const worldLeague = state.world.leagues[leagueId];
        const results = [];
        // Simulation légère : chaque club joue au plus une fois dans le bloc.
        const shuffled = [...clubs].sort(() => random() - 0.5);
        const playerClubId = state.player?.clubId || this.getClub(state.player?.club)?.id || null;
        for (let i = 0; i + 1 < shuffled.length; i += 2) {
            const homeClub = shuffled[i], awayClub = shuffled[i + 1];
            if (homeClub.id === playerClubId || awayClub.id === playerClubId) continue;
            const homeGoals = clamp(Math.floor(random() * (1.3 + homeClub.strength / 70)), 0, 5);
            const awayGoals = clamp(Math.floor(random() * (1.0 + awayClub.strength / 75)), 0, 5);
            const fixture = { leagueId, competitionId: leagueId, homeClubId: homeClub.id, awayClubId: awayClub.id, month: state.calendar.currentMonth };
            this.recordMatch(state, fixture, homeGoals, awayGoals);
            results.push({ fixture, homeGoals, awayGoals });
        }
        worldLeague.lastSimulationMonth = state.calendar.currentMonth;
        return results;
    },

    recordPlayerMatches(state, scheduledMatches = [], summary = {}) {
        this.ensureWorld(state);
        const playerClubId = state.player?.clubId || this.getClub(state.player?.club)?.id;
        if (!playerClubId) return [];
        const leagueMatches = scheduledMatches.filter(m => m.type === 'league' && m.leagueId);
        if (!leagueMatches.length) return [];

        const totalPlayerGoals = Number(summary.goals || 0);
        const results = [];
        for (const match of leagueMatches) {
            if (!match.opponentClubId) continue;
            const playerGoals = Math.random() < 0.35 ? 1 : 0;
            const homeGoals = match.homeClubId === playerClubId
                ? Math.min(5, playerGoals + Math.floor(Math.random() * 2))
                : Math.floor(Math.random() * 2);
            const awayGoals = match.awayClubId === playerClubId
                ? Math.min(5, playerGoals + Math.floor(Math.random() * 2))
                : Math.floor(Math.random() * 2);
            const fixture = { ...match, leagueId: match.leagueId, homeClubId: match.homeClubId, awayClubId: match.awayClubId };
            this.recordMatch(state, fixture, homeGoals, awayGoals);
            results.push({ fixture, homeGoals, awayGoals });
        }
        return results;
    },

    finalizeSeason(state) {
        this.ensureWorld(state);
        const movements = [];
        for (const [leagueId, league] of Object.entries(LEAGUES)) {
            if (!higherOf[leagueId] && !lowerOf[leagueId]) continue;
            const table = this.getTable(state, leagueId);
            const higher = higherOf[leagueId];
            const lower = lowerOf[leagueId];
            if (higher) {
                const promoted = table.slice(0, league.promotion || 0);
                movements.push({ type: 'promotion', from: leagueId, to: higher, clubs: promoted.map(r => r.clubId) });
            }
            if (lower) {
                const relegated = table.slice(-league.relegation);
                movements.push({ type: 'relegation', from: leagueId, to: lower, clubs: relegated.map(r => r.clubId) });
            }
        }
        // À cette phase, on enregistre les mouvements sans réécrire encore les
        // calendriers historiques. La migration de divisions sera activée avec
        // le moteur complet de montée/relégation de Phase 2C.
        state.world.lastSeasonFinalized = { year: state.calendar.currentSeasonYear, movements };
        return movements;
    },

    resetSeasonTables(state, newYear) {
        this.ensureWorld(state);
        for (const league of Object.values(LEAGUES)) {
            const worldLeague = state.world.leagues[league.id];
            worldLeague.seasonYear = newYear;
            worldLeague.matchday = 0;
            worldLeague.table = this.getClubs(league.id).map(blankRow);
            worldLeague.lastResults = [];
        }
    },

    isOffSeason(month) {
        return [6, 7].includes(Number(month));
    },

    getClubSummary(player) {
        const club = this.getClub(player?.clubId || player?.club);
        if (!club) return null;
        const league = LEAGUES[club.leagueId];
        return { ...club, leagueName: league?.name || null, clubStars: Math.max(1, Math.min(5, Math.round(club.prestige / 20))), centerStars: club.centerStars };
    }
};

export default WorldSystem;
