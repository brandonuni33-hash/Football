import { simulateShortCareers } from './shortCareerSimulator.js';

const report = simulateShortCareers();
const fullReport = process.argv.includes('--json');
const output = fullReport ? report : {
    deterministic: report.deterministic,
    combinations: report.combinations,
    careers: report.careerCount,
    matches: report.matchCount,
    failures: report.failures,
    valid: report.valid
};

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
if (!report.valid) process.exitCode = 1;
