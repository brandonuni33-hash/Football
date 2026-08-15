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

test('hors contrôle joueur le terrain passe en vue tactique du dessus', async ({ page }) => {
    await page.goto('/index.html');
    const result = await page.evaluate(async () => {
        const [{ default: InteractiveMatchFlowController }, { buildContinuationStep }] = await Promise.all([
            import('/ui/interactiveMatchFlowController.js'),
            import('/domain/match/interactiveMatchNarrative.js')
        ]);
        const step = buildContinuationStep({ id:'passive',team:'FC',opponent:'Rival',competition:'U15',home:true,score:{home:0,away:0},moments:[22,48],currentMoment:1,modifiers:{fatigue:0},match:{id:'passive'} });
        new InteractiveMatchFlowController().show({ interactiveStep: step });
        const viewport=document.querySelector('.interactive-match-viewport');
        const pitch=document.querySelector('.interactive-match-pitch');
        return { controlled:viewport?.dataset.playerControlled,label:viewport?.textContent.trim(),transform:getComputedStyle(pitch).transform };
    });
    expect(result.controlled).toBe('false');
    expect(result.label).toContain('VUE TACTIQUE');
    expect(result.transform).toBe('none');
});
