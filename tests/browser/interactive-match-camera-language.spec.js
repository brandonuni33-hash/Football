import { test, expect } from '@playwright/test';

test('le match jouable expose l état caméra décidé par le domaine', async ({ page }) => {
    await page.goto('/index.html');
    const result = await page.evaluate(async () => {
        const [{ default: InteractiveMatchFlowController }, { buildDecisionStep }] = await Promise.all([
            import('/ui/interactiveMatchFlowController.js'),
            import('/domain/match/interactiveMatchNarrative.js')
        ]);
        const session = {
            id: 'camera-language', team: 'FC Test', opponent: 'Rival', competition: 'U15', home: true,
            score: { home: 0, away: 0 }, moments: [34], modifiers: { fatigue: 0 }, decisions: [], events: [],
            playerAge: 15, playerPosition: 'BU', match: { id: 'camera-language' }
        };
        const step = buildDecisionStep(session, {
            minute: 34, title: 'Face au but', description: 'La défense recule.', isGoalOpportunity: true,
            choices: [{ text: 'Frapper', gesture: 'Frappe première intention' }]
        }, 0);
        new InteractiveMatchFlowController().show({ interactiveStep: step });
        const overlay = document.querySelector('[data-interactive-match-flow]');
        const viewport = document.querySelector('[data-match-camera-state]');
        return {
            domainState: step.cameraState,
            overlayState: overlay?.dataset.cameraState,
            viewportState: viewport?.dataset.matchCameraState,
            intensity: overlay?.dataset.emotionalIntensity
        };
    });
    expect(result).toEqual({ domainState: 'DANGER', overlayState: 'DANGER', viewportState: 'DANGER', intensity: '2' });
    await expect(page.locator('.interactive-match-viewport')).toBeVisible();
});
