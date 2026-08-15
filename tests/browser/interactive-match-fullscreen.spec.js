import { test, expect } from '@playwright/test';

test('le match jouable utilise réellement tout l écran mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/index.html');

    const result = await page.evaluate(async () => {
        const [{ default: InteractiveMatchFlowController }, { buildDecisionStep }] = await Promise.all([
            import('/ui/interactiveMatchFlowController.js'),
            import('/domain/match/interactiveMatchNarrative.js')
        ]);
        const session = {
            id: 'fullscreen-match', team: 'Cádiz CF U15', opponent: 'AD Alcorcón Juvenil', competition: 'Division de Honor U15', home: true,
            score: { home: 0, away: 0 }, moments: [65], modifiers: { fatigue: 0 }, decisions: [], events: [],
            playerAge: 15, playerPosition: 'BU', match: { id: 'fullscreen-match' }
        };
        const step = buildDecisionStep(session, {
            minute: 65,
            title: 'L’interception te lance',
            description: 'Tu coupes une passe et pars immédiatement vers le but.',
            isGoalOpportunity: true,
            choices: [
                { text: 'Accélérer au maximum', gesture: 'Percée' },
                { text: 'Contrôler le rythme de ta course', gesture: 'Conduite maîtrisée' },
                { text: 'Chercher un soutien', gesture: 'Relais' }
            ]
        }, 0);

        const ui = { gateway: { state: { player: { age: 15 } } } };
        new InteractiveMatchFlowController({ ui }).show({ interactiveStep: step });
        const overlay = document.querySelector('.interactive-match-overlay');
        const card = document.querySelector('.interactive-match-card');
        const viewport = document.querySelector('.interactive-match-viewport');
        const overlayRect = overlay.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const viewportRect = viewport.getBoundingClientRect();

        return {
            windowWidth: innerWidth,
            windowHeight: innerHeight,
            overlayWidth: overlayRect.width,
            overlayHeight: overlayRect.height,
            cardWidth: cardRect.width,
            cardHeight: cardRect.height,
            pitchViewportWidth: viewportRect.width,
            pitchViewportHeight: viewportRect.height,
            actors: document.querySelectorAll('.match-actor').length,
            tacticalLevel: viewport.dataset.tacticalLevel
        };
    });

    expect(result.overlayWidth).toBeGreaterThanOrEqual(result.windowWidth - 1);
    expect(result.overlayHeight).toBeGreaterThanOrEqual(result.windowHeight - 1);
    expect(result.cardWidth).toBeGreaterThanOrEqual(result.windowWidth - 1);
    expect(result.cardHeight).toBeGreaterThanOrEqual(result.windowHeight - 1);
    expect(result.pitchViewportWidth).toBeGreaterThanOrEqual(result.windowWidth - 1);
    expect(result.pitchViewportHeight).toBeGreaterThan(330);
    expect(result.actors).toBe(22);
    expect(result.tacticalLevel).toBe('U15');
});
