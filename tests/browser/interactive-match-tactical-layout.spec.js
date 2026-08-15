import { test, expect } from '@playwright/test';

test('le terrain affiche onze joueurs par équipe et les garde dans le cadre', async ({ page }) => {
    await page.goto('/index.html');
    const result = await page.evaluate(async () => {
        const [{ default: InteractiveMatchFlowController }, { buildDecisionStep }] = await Promise.all([
            import('/ui/interactiveMatchFlowController.js'),
            import('/domain/match/interactiveMatchNarrative.js')
        ]);
        const session = {
            id: 'full-teams', team: 'Cádiz CF U15', opponent: 'AD Alcorcón Juvenil', competition: 'Division de Honor U15', home: true,
            score: { home: 0, away: 0 }, moments: [65], modifiers: { fatigue: 0 }, decisions: [], events: [],
            playerAge: 15, playerPosition: 'BU', match: { id: 'full-teams' }
        };
        const step = buildDecisionStep(session, {
            minute: 65, title: 'L’interception te lance', description: 'Tu coupes une passe et pars immédiatement vers le but.',
            isGoalOpportunity: true, choices: [{ text: 'Accélérer', gesture: 'Percée' }]
        }, 0);
        new InteractiveMatchFlowController().show({ interactiveStep: step });
        const pitch = document.querySelector('.interactive-match-pitch');
        const pitchRect = pitch.getBoundingClientRect();
        const actors = [...document.querySelectorAll('.match-actor')];
        const inside = actors.every(actor => {
            const rect = actor.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            return cx >= pitchRect.left && cx <= pitchRect.right && cy >= pitchRect.top && cy <= pitchRect.bottom;
        });
        return {
            home: document.querySelectorAll('[data-tactical-team="home"]').length,
            away: document.querySelectorAll('[data-tactical-team="away"]').length,
            total: actors.length,
            inside,
            pitchWidth: Math.round(pitchRect.width),
            pitchHeight: Math.round(pitchRect.height)
        };
    });
    expect(result.home).toBe(11);
    expect(result.away).toBe(11);
    expect(result.total).toBe(22);
    expect(result.inside).toBe(true);
    expect(result.pitchWidth).toBeGreaterThan(250);
    expect(result.pitchHeight).toBeGreaterThan(120);
});
