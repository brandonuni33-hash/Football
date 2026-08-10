/* =========================================================
   CAREER SIMULATION — 1000 CARRIÈRES
   Outil indépendant de calibration.
   Ne modifie jamais une sauvegarde joueur.
   ========================================================= */

import { PlayerLogic } from './player.js';
import { PotentialSystem } from './potentialSystem.js';

const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));

function randomChoice(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function createSimulationPlayer(index) {
    const player = PlayerLogic.createPlayerProfile({
        firstname: `SIM${index}`,
        lastname: 'TEST',
        nationality: 'France',
        country: 'France',
        position: randomChoice(['BU', 'MOC', 'MC', 'AIL', 'DC', 'DD', 'DG', 'G']),
        origin: randomChoice(['CENTRE_FORMATION', 'RUE', 'FAMILLE_FOOT', 'ACADEMIE'] )
    });

    PotentialSystem.ensure(player);
    return player;
}

function simulateSeason(player) {
    const age = Number(player.age) || 14;
    const matches = age < 18
        ? 22 + Math.floor(Math.random() * 9)
        : 34 + Math.floor(Math.random() * 7);

    const performance = clamp(45 + Math.random() * 35, 40, 85);
    const goals = Math.max(0, Math.round((Math.random() * matches * 0.28) * (performance / 75)));
    const assists = Math.max(0, Math.round((Math.random() * matches * 0.32) * (performance / 75)));
    const rating = clamp(5.8 + Math.random() * 1.6, 5.5, 8.0);

    player.stats.matchesPlayed = matches;
    player.stats.goals = goals;
    player.stats.assists = assists;
    player.stats.averageRating = rating;

    const baseXp = matches * (0.7 + performance / 100 * 0.55);
    const performanceXp = (rating - 6) * 5 + goals * 0.35 + assists * 0.2;
    const xp = clamp(baseXp + performanceXp, 8, 70);

    PlayerLogic.applyProgression(player, {
        xp,
        type: 'finSaison',
        vieillirDUnAn: false
    });

    PotentialSystem.finalizeSeason(player, {
        seasonLabel: `${age}/${age + 1}`,
        overall: player.overall,
        matches,
        goals,
        assists,
        averageRating: rating
    });

    PotentialSystem.advanceAge(player);

    return { matches, goals, assists, rating, xp };
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

export function simulateCareers(count = 1000, options = {}) {
    const total = Math.max(1, Math.floor(Number(count) || 1000));
    const maxAge = Math.min(42, Math.max(18, Number(options.maxAge) || 34));
    const checkpoints = options.checkpoints || [18, 20, 22, 25, 28, 30, 34];

    const careers = [];
    const checkpointValues = Object.fromEntries(
        checkpoints.map(age => [age, { overall: [], potential: [] }])
    );

    for (let i = 0; i < total; i += 1) {
        const player = createSimulationPlayer(i + 1);
        const initialPotential = Number(player.potential) || 0;
        const career = {
            id: i + 1,
            initialOverall: Number(player.overall) || 0,
            initialPotential,
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
            career.peakOverall = Math.max(career.peakOverall, Number(player.overall) || 0);
            if (career.peakOverall === Number(player.overall)) career.peakAge = Number(player.age);

            const age = Number(player.age);
            if (checkpointValues[age]) {
                career.checkpoints[age] = {
                    overall: Number(player.overall) || 0,
                    potential: Number(player.potential) || 0
                };
                checkpointValues[age].overall.push(Number(player.overall) || 0);
                checkpointValues[age].potential.push(Number(player.potential) || 0);
            }
        }

        career.finalOverall = Number(player.overall) || 0;
        career.finalPotential = Number(player.potential) || 0;
        career.initialPotential = initialPotential;
        careers.push(career);
    }

    const finalOveralls = careers.map(c => c.finalOverall);
    const finalPotentials = careers.map(c => c.finalPotential);
    const peakOveralls = careers.map(c => c.peakOverall);

    const distribution = values => ({
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        median: percentile(values, 0.5),
        p10: percentile(values, 0.1),
        p90: percentile(values, 0.9),
        min: Math.min(...values),
        max: Math.max(...values)
    });

    return {
        version: 1,
        count: total,
        maxAge,
        generatedAt: new Date().toISOString(),
        finalOverall: distribution(finalOveralls),
        finalPotential: distribution(finalPotentials),
        peakOverall: distribution(peakOveralls),
        thresholds: {
            overall85Plus: careers.filter(c => c.peakOverall >= 85).length,
            overall90Plus: careers.filter(c => c.peakOverall >= 90).length,
            overall95Plus: careers.filter(c => c.peakOverall >= 95).length,
            potential85Plus: careers.filter(c => c.finalPotential >= 85).length,
            potential90Plus: careers.filter(c => c.finalPotential >= 90).length,
            potential95Plus: careers.filter(c => c.finalPotential >= 95).length
        },
        checkpoints: Object.fromEntries(
            Object.entries(checkpointValues).map(([age, data]) => [age, {
                overall: data.overall.length ? distribution(data.overall) : null,
                potential: data.potential.length ? distribution(data.potential) : null
            }])
        ),
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
        'Pic général >=85': result.thresholds.overall85Plus,
        'Pic général >=90': result.thresholds.overall90Plus,
        'Pic général >=95': result.thresholds.overall95Plus,
        'Potentiel >=85': result.thresholds.potential85Plus,
        'Potentiel >=90': result.thresholds.potential90Plus,
        'Potentiel >=95': result.thresholds.potential95Plus
    });

    console.table(
        Object.entries(result.checkpoints).map(([age, data]) => ({
            age,
            overallMean: data?.overall?.mean?.toFixed(2) ?? '-',
            overallMedian: data?.overall?.median?.toFixed(2) ?? '-',
            potentialMean: data?.potential?.mean?.toFixed(2) ?? '-',
            potentialMedian: data?.potential?.median?.toFixed(2) ?? '-'
        }))
    );

    return result;
}

export default simulateCareers;
