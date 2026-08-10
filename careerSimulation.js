/* =========================================================
   CAREER SIMULATION — 1000 CARRIÈRES
   Calibration tool. Never mutates a saved career.
   ========================================================= */

import { PlayerLogic } from './player.js';
import { PotentialSystem } from './potentialSystem.js';

const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));
const randomChoice = items => items[Math.floor(Math.random() * items.length)];

function createSimulationPlayer(index) {
    const player = PlayerLogic.createPlayerProfile({
        firstname: `SIM${index}`,
        lastname: 'TEST',
        nationality: 'France',
        country: 'France',
        position: randomChoice(['BU', 'MOC', 'MC', 'AIL', 'DC', 'DD', 'DG', 'G']),
        origin: randomChoice(['CENTRE_FORMATION', 'RUE', 'FAMILLE_FOOT', 'ACADEMIE'])
    });
    PotentialSystem.ensure(player);
    return player;
}

function simulateSeason(player) {
    const age = Number(player.age) || 14;
    const matches = age < 18 ? 22 + Math.floor(Math.random() * 9) : 34 + Math.floor(Math.random() * 7);
    const performance = clamp(45 + Math.random() * 35, 40, 85);
    const goals = Math.max(0, Math.round((Math.random() * matches * 0.28) * (performance / 75)));
    const assists = Math.max(0, Math.round((Math.random() * matches * 0.32) * (performance / 75)));
    const rating = clamp(5.8 + Math.random() * 1.6, 5.5, 8.0);

    player.stats.matchesPlayed = matches;
    player.stats.goals = goals;
    player.stats.assists = assists;
    player.stats.averageRating = rating;

    // La simulation ne donne pas de raccourci artificiel par entraînement :
    // la progression générale éventuelle vient du moteur normal, tandis que
    // le potentiel vivant est finalisé uniquement depuis les prestations.
    PlayerLogic.applyProgression(player, { xp: 0, type: 'finSaison', vieillirDUnAn: false });
    PotentialSystem.finalizeSeason(player, {
        seasonLabel: `${age}/${age + 1}`,
        overall: player.overall,
        matches,
        goals,
        assists,
        averageRating: rating
    });
    PotentialSystem.advanceAge(player);
    return { matches, goals, assists, rating };
}

function percentile(values, p) {
    const sorted = [...values].sort((a, b) => a - b);
    if (!sorted.length) return 0;
    const index = (sorted.length - 1) * p;
    const lower = Math.floor(index), upper = Math.ceil(index);
    return lower === upper ? sorted[lower] : sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function distribution(values) {
    if (!values.length) return null;
    return {
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        median: percentile(values, 0.5),
        p10: percentile(values, 0.1),
        p90: percentile(values, 0.9),
        min: Math.min(...values),
        max: Math.max(...values)
    };
}

export function simulateCareers(count = 1000, options = {}) {
    const total = Math.max(1, Math.floor(Number(count) || 1000));
    const maxAge = Math.min(42, Math.max(18, Number(options.maxAge) || 34));
    const checkpoints = options.checkpoints || [18, 20, 22, 25, 28, 30, 34];
    const careers = [];
    const checkpointValues = Object.fromEntries(checkpoints.map(age => [age, { overall: [], potential: [] }]));

    for (let i = 0; i < total; i += 1) {
        const player = createSimulationPlayer(i + 1);
        const career = {
            id: i + 1,
            initialOverall: Number(player.overall) || 0,
            initialPotential: Number(player.potential) || 0,
            checkpoints: {},
            finalOverall: 0,
            finalPotential: 0,
            peakOverall: Number(player.overall) || 0,
            peakAge: Number(player.age) || 14,
            seasons: 0
        };

        while (Number(player.age) < maxAge && !player.careerEnded) {
            simulateSeason(player);
            career.seasons += 1;
            const currentOverall = Number(player.overall) || 0;
            if (currentOverall > career.peakOverall) {
                career.peakOverall = currentOverall;
                career.peakAge = Number(player.age);
            }
            const age = Number(player.age);
            if (checkpointValues[age]) {
                career.checkpoints[age] = { overall: currentOverall, potential: Number(player.potential) || 0 };
                checkpointValues[age].overall.push(currentOverall);
                checkpointValues[age].potential.push(Number(player.potential) || 0);
            }
        }
        career.finalOverall = Number(player.overall) || 0;
        career.finalPotential = Number(player.potential) || 0;
        careers.push(career);
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
        version: 2,
        count: total,
        maxAge,
        generatedAt: new Date().toISOString(),
        finalOverall: distribution(finalOveralls),
        finalPotential: distribution(finalPotentials),
        peakOverall: distribution(peakOveralls),
        thresholds,
        rates: Object.fromEntries(Object.entries(thresholds).map(([key, value]) => [key, value / total * 100])),
        checkpoints: Object.fromEntries(Object.entries(checkpointValues).map(([age, data]) => [age, {
            overall: distribution(data.overall),
            potential: distribution(data.potential)
        }])),
        careers
    };
}

export function printSimulationReport(result) {
    console.table({
        'Carrières': result.count,
        'Général final moyen': result.finalOverall.mean.toFixed(2),
        'Général final médian': result.finalOverall.median.toFixed(2),
        'Pic général moyen': result.peakOverall.mean.toFixed(2),
        'Potentiel final moyen': result.finalPotential.mean.toFixed(2),
        'Potentiel final médian': result.finalPotential.median.toFixed(2),
        'Pic général >=85': `${result.thresholds.overall85Plus} (${result.rates.overall85Plus.toFixed(1)}%)`,
        'Pic général >=90': `${result.thresholds.overall90Plus} (${result.rates.overall90Plus.toFixed(1)}%)`,
        'Pic général >=95': `${result.thresholds.overall95Plus} (${result.rates.overall95Plus.toFixed(1)}%)`,
        'Potentiel >=85': `${result.thresholds.potential85Plus} (${result.rates.potential85Plus.toFixed(1)}%)`,
        'Potentiel >=90': `${result.thresholds.potential90Plus} (${result.rates.potential90Plus.toFixed(1)}%)`,
        'Potentiel >=95': `${result.thresholds.potential95Plus} (${result.rates.potential95Plus.toFixed(1)}%)`
    });
    console.table(Object.entries(result.checkpoints).map(([age, data]) => ({
        age,
        overallMean: data?.overall?.mean?.toFixed(2) ?? '-',
        overallMedian: data?.overall?.median?.toFixed(2) ?? '-',
        potentialMean: data?.potential?.mean?.toFixed(2) ?? '-',
        potentialMedian: data?.potential?.median?.toFixed(2) ?? '-'
    })));
    return result;
}

export function writeSimulationReport(result, outputDir = 'simulation-results') {
    return {
        json: `${outputDir}/career-simulation-1000.json`,
        csv: `${outputDir}/career-simulation-1000.csv`
    };
}

export default simulateCareers;
