/* =========================================================
   CAREER SIMULATOR — LABORATOIRE DU VRAI JEU
   ---------------------------------------------------------
   Ce fichier n'est PAS chargé par le jeu.
   Il rejoue une carrière avec les mêmes moteurs métier que le jeu :
   - création / progression joueur
   - calendrier / compétitions
   - entraînement
   - MatchBlockManager / MatchSystem
   - potentiel vivant
   - forme / moral / statistiques

   Objectif : mesurer l'équilibrage sans créer un deuxième moteur de jeu.
   ========================================================= */

import { PlayerLogic } from './player.js';
import { CareerSystem } from './careerSystem.js';
import { PotentialSystem } from './potentialSystem.js';
import { TrainingManager } from './entrainement.js';
import { MatchBlockManager } from './matchBlock.js';
import { CompetitionSystem } from './competitionSystem.js';
import { WorldSystem } from './worldSystem.js';
import { CupSystem } from './cupSystemV2.js';

const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));
const number = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const pick = list => list[Math.floor(Math.random() * list.length)];

const POSITIONS = ['BU', 'MOC', 'MC', 'AD', 'AG', 'DC', 'DD', 'DG', 'GK'];
const ORIGINS = ['CENTRE_FORMATION', 'CLUB_AMATEUR', 'FUTSAL', 'STREET', 'ATHLETE', 'DEBUTANT_TARDIF', 'FILS_DE_PRO'];
const TRAINING_FOCUSES = ['TECHNIQUE', 'FINITION', 'DEPLACEMENT', 'DEFENSE', 'COACH', 'RECUPERATION', 'REPOS'];
const SEASON_MONTHS = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5];

function resetSeasonStats(player) {
    player.stats.matchesPlayed = 0;
    player.stats.goals = 0;
    player.stats.assists = 0;
    player.stats.successfulPasses = 0;
    player.stats.tackles = 0;
    player.stats.yellowCards = 0;
    player.stats.cleanSheets = 0;
    player.stats.averageRating = 0;
}

function createState(player, seasonYear) {
    return {
        schemaVersion: 1,
        player,
        trainingFocus: 'TECHNIQUE',
        social: { coachData: { name: 'Sim Coach', relation: 50, opinion: 'Neutre' } },
        media: {},
        career: { balance: 0, seasonHistory: [], totalCareerIncome: 0 },
        calendar: {
            currentMonth: 8,
            currentSeasonYear: seasonYear,
            currentPeriod: 'Pré-saison & reprise',
            totalMonths: 12,
            seasonSchedule: null,
            seasonMatchCursor: 0
        },
        seasonPhase: 'pre_season',
        pendingEvent: null,
        pendingCoachEvent: null,
        pendingMediaDilemma: null,
        pendingTransferOffer: null,
        pendingPositionProposal: null,
        world: { version: 1, leagues: {}, lastSeasonFinalized: null },
        cups: {},
        cupHistory: [],
        careerStructure: player.careerProfile || null,
        relationships: {},
        careerMemory: []
    };
}

function attachStartingClub(player) {
    // On utilise le monde réel du jeu pour donner au simulateur un club existant.
    WorldSystem.ensureWorld({ player, world: { version: 1, leagues: {} } });
    const clubs = WorldSystem.getClubs('FR_L1');
    const club = clubs[Math.floor(Math.random() * clubs.length)] || clubs[0];
    if (!club) throw new Error('Aucun club disponible dans WorldSystem.');

    player.club = club.name;
    player.clubId = club.id;
    player.clubCountry = club.country || 'France';
    player.clubLevel = Number(club.tier) || 1;
    player.isYouthPlayer = true;
    player.youthClubName = club.name;
    CareerSystem.initialize(player, club);
    return club;
}

function createCareer(index, seasonYear) {
    const position = pick(POSITIONS);
    const origin = pick(ORIGINS);
    const player = PlayerLogic.createPlayerProfile({
        firstname: `SIM${index}`,
        lastname: 'TEST',
        nationality: 'France',
        country: 'France',
        position,
        origin,
        age: 14
    });
    attachStartingClub(player);
    PotentialSystem.ensure(player);
    player.morale = 80;
    player.fitness = 90;
    player.isInjured = false;
    player.injuryDuration = 0;

    const state = createState(player, seasonYear);
    WorldSystem.ensureWorld(state);
    CupSystem.ensure?.(state);
    CompetitionSystem.ensureSeasonSchedule(state);
    return { player, state, position, origin };
}

function ensureSeasonInfrastructure(state) {
    state.calendar.seasonSchedule = null;
    state.calendar.seasonMatchCursor = 0;
    state.calendar.currentMonth = 8;
    state.seasonPhase = 'pre_season';
    WorldSystem.ensureWorld(state);
    CupSystem.ensure?.(state);
    CompetitionSystem.ensureSeasonSchedule(state);
}

function simulateSeason(career, seasonYear) {
    const { player, state } = career;
    ensureSeasonInfrastructure(state);
    resetSeasonStats(player);

    const seasonStartOverall = number(player.overall);
    const seasonStartPotential = number(player.potential);
    const seasonStartAge = number(player.age);
    const blockReports = [];
    let trainingCount = 0;
    let matchesFromReports = 0;

    for (const month of SEASON_MONTHS) {
        state.calendar.currentMonth = month;
        state.calendar.currentPeriod = CompetitionSystem.getPeriodName?.(month) || state.calendar.currentPeriod;

        // L'entraînement réel : forme + gestes + consignes, jamais XP/OVR.
        const focus = pick(TRAINING_FOCUSES);
        state.trainingFocus = focus;
        const training = TrainingManager.applyTraining(player, focus);
        trainingCount += training ? 1 : 0;

        // Le vrai moteur de bloc de matchs du jeu.
        const report = MatchBlockManager.simulateBlock(state, focus, null);
        if (report) {
            blockReports.push(report);
            const summary = report.summary || report;
            matchesFromReports += number(summary.matchesPlayed ?? summary.matches);
        }
    }

    const matches = number(player.stats?.matchesPlayed, matchesFromReports);
    const averageRating = number(player.stats?.averageRating);
    const goals = number(player.stats?.goals);
    const assists = number(player.stats?.assists);
    const tackles = number(player.stats?.tackles);
    const cleanSheets = number(player.stats?.cleanSheets);

    // Le potentiel vivant est finalisé exclusivement sur les prestations.
    const potentialResult = PotentialSystem.finalizeSeason(player, {
        seasonLabel: `${seasonYear}/${seasonYear + 1}`,
        age: seasonStartAge,
        overall: player.overall,
        matches,
        averageRating,
        goals,
        assists
    });

    // Progression générale de fin de saison / déclin d'âge : XP = 0.
    // L'entraînement ne peut donc pas servir de raccourci vers le général.
    PlayerLogic.applyProgression(player, {
        xp: 0,
        type: 'finSaison',
        vieillirDUnAn: false
    });
    PotentialSystem.advanceAge(player);

    return {
        season: `${seasonYear}/${seasonYear + 1}`,
        age: seasonStartAge,
        endAge: number(player.age),
        startOverall: seasonStartOverall,
        endOverall: number(player.overall),
        startPotential: seasonStartPotential,
        endPotential: number(player.potential),
        potentialChange: number(potentialResult?.change),
        matches,
        averageRating,
        goals,
        assists,
        tackles,
        cleanSheets,
        morale: number(player.morale),
        fitness: number(player.fitness),
        trainingCount,
        blockCount: blockReports.length
    };
}

function percentile(values, p) {
    const sorted = [...values].sort((a, b) => a - b);
    if (!sorted.length) return 0;
    const index = (sorted.length - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function distribution(values) {
    if (!values.length) return null;
    return {
        mean: values.reduce((sum, value) => sum + value, 0) / values.length,
        median: percentile(values, 0.5),
        p10: percentile(values, 0.1),
        p90: percentile(values, 0.9),
        min: Math.min(...values),
        max: Math.max(...values)
    };
}

function summarizeCheckpoints(careers, checkpoints) {
    return Object.fromEntries(checkpoints.map(age => {
        const rows = careers.map(c => c.seasons.find(s => s.endAge === age)).filter(Boolean);
        return [age, {
            count: rows.length,
            overall: distribution(rows.map(r => r.endOverall)),
            potential: distribution(rows.map(r => r.endPotential)),
            rating: distribution(rows.map(r => r.averageRating)),
            matches: distribution(rows.map(r => r.matches))
        }];
    }));
}

export function simulateCareer(count = 1, options = {}) {
    const total = Math.max(1, Math.floor(Number(count) || 1));
    const maxAge = Math.min(42, Math.max(18, Number(options.maxAge) || 34));
    const startSeasonYear = Number(options.startSeasonYear) || new Date().getFullYear();
    const checkpoints = options.checkpoints || [18, 20, 22, 25, 28, 30, 34];
    const careers = [];
    const errors = [];

    for (let index = 1; index <= total; index += 1) {
        try {
            const career = createCareer(index, startSeasonYear);
            const result = {
                id: index,
                position: career.position,
                origin: career.origin,
                initialOverall: number(career.player.overall),
                initialPotential: number(career.player.potential),
                peakOverall: number(career.player.overall),
                peakAge: number(career.player.age),
                finalOverall: 0,
                finalPotential: 0,
                seasons: []
            };

            while (number(career.player.age) < maxAge && !career.player.careerEnded) {
                const season = simulateSeason(career, startSeasonYear + result.seasons.length);
                result.seasons.push(season);
                if (season.endOverall > result.peakOverall) {
                    result.peakOverall = season.endOverall;
                    result.peakAge = season.endAge;
                }
            }

            result.finalOverall = number(career.player.overall);
            result.finalPotential = number(career.player.potential);
            result.finalAge = number(career.player.age);
            result.totalMatches = result.seasons.reduce((sum, s) => sum + s.matches, 0);
            result.averageCareerRating = result.totalMatches > 0
                ? result.seasons.reduce((sum, s) => sum + s.averageRating * s.matches, 0) / result.totalMatches
                : 0;
            careers.push(result);
        } catch (error) {
            errors.push({ id: index, message: error?.message || String(error) });
        }
    }

    const finalOveralls = careers.map(c => c.finalOverall);
    const finalPotentials = careers.map(c => c.finalPotential);
    const peakOveralls = careers.map(c => c.peakOverall);
    const thresholds = {
        overall85Plus: careers.filter(c => c.peakOverall >= 85).length,
        overall90Plus: careers.filter(c => c.peakOverall >= 90).length,
        overall95Plus: careers.filter(c => c.peakOverall >= 95).length,
        potential85Plus: careers.filter(c => c.finalPotential >= 85).length,
        potential90Plus: careers.filter(c => c.finalPotential >= 90).length,
        potential95Plus: careers.filter(c => c.finalPotential >= 95).length
    };

    return {
        version: 3,
        simulatorType: 'real-game-engines',
        countRequested: total,
        countCompleted: careers.length,
        countErrors: errors.length,
        maxAge,
        generatedAt: new Date().toISOString(),
        engines: {
            player: 'PlayerLogic',
            training: 'TrainingManager',
            matches: 'MatchBlockManager / MatchSystem legacy façade',
            competitions: 'CompetitionSystem',
            world: 'WorldSystem',
            potential: 'PotentialSystem',
            progression: 'PlayerLogic.applyProgression'
        },
        finalOverall: distribution(finalOveralls),
        finalPotential: distribution(finalPotentials),
        peakOverall: distribution(peakOveralls),
        thresholds,
        rates: Object.fromEntries(Object.entries(thresholds).map(([key, value]) => [key, careers.length ? value / careers.length * 100 : 0])),
        checkpoints: summarizeCheckpoints(careers, checkpoints),
        errors,
        careers
    };
}

// Alias conservé pour les workflows existants.
export const simulateCareers = simulateCareer;

export function printSimulationReport(result) {
    console.table({
        'Carrières demandées': result.countRequested,
        'Carrières terminées': result.countCompleted,
        'Erreurs': result.countErrors,
        'Général final moyen': result.finalOverall?.mean?.toFixed(2) ?? '-',
        'Général final médian': result.finalOverall?.median?.toFixed(2) ?? '-',
        'Pic général moyen': result.peakOverall?.mean?.toFixed(2) ?? '-',
        'Potentiel final moyen': result.finalPotential?.mean?.toFixed(2) ?? '-',
        'Potentiel final médian': result.finalPotential?.median?.toFixed(2) ?? '-',
        'Pic général >=85': `${result.thresholds.overall85Plus} (${result.rates.overall85Plus.toFixed(1)}%)`,
        'Pic général >=90': `${result.thresholds.overall90Plus} (${result.rates.overall90Plus.toFixed(1)}%)`,
        'Pic général >=95': `${result.thresholds.overall95Plus} (${result.rates.overall95Plus.toFixed(1)}%)`,
        'Potentiel >=85': `${result.thresholds.potential85Plus} (${result.rates.potential85Plus.toFixed(1)}%)`,
        'Potentiel >=90': `${result.thresholds.potential90Plus} (${result.rates.potential90Plus.toFixed(1)}%)`,
        'Potentiel >=95': `${result.thresholds.potential95Plus} (${result.rates.potential95Plus.toFixed(1)}%)`
    });
    console.table(Object.entries(result.checkpoints).map(([age, data]) => ({
        age,
        count: data.count,
        overallMean: data.overall?.mean?.toFixed(2) ?? '-',
        overallMedian: data.overall?.median?.toFixed(2) ?? '-',
        potentialMean: data.potential?.mean?.toFixed(2) ?? '-',
        potentialMedian: data.potential?.median?.toFixed(2) ?? '-',
        ratingMean: data.rating?.mean?.toFixed(2) ?? '-',
        matchesMean: data.matches?.mean?.toFixed(1) ?? '-'
    })));
    if (result.errors?.length) console.error('Erreurs de simulation:', result.errors.slice(0, 20));
    return result;
}

export default simulateCareer;
