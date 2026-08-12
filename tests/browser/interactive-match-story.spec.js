import { test, expect } from '@playwright/test';

test('le match jouable présente les deux décisions et les réactions dans une séquence continue', async ({ page }) => {
  await page.goto('/index.html');

  const flow = await page.evaluate(async () => {
    const [{ startInteractiveMatch, advanceInteractiveMatch }, { default: InteractiveMatchFlowController }] = await Promise.all([
      import('/domain/match/interactiveMatchController.js'),
      import('/ui/interactiveMatchFlowController.js')
    ]);
    const originalRandom = Math.random;
    Math.random = () => .31;
    try {
      const state = {
        player: {
          id: 'browser-player', firstname: 'Alex', lastname: 'Flow', club: 'Street FC',
          position: 'BU', overall: 74, potential: 84, morale: 72, fitness: 91,
          attributes: { tir: 76, passe: 69, controle: 72, puissance: 68, vitesse: 75 },
          stats: {}, hidden: {}, temporaryEffects: []
        },
        social: { coachData: { name: 'Coach Browser' } },
        career: { balance: 0 }, consequences: [], careerMemory: []
      };
      const session = startInteractiveMatch(state, {
        id: 'browser-final', phase: 'Finale', competitionName: 'Coupe de la Ville',
        opponent: 'Rival City', opponentStrength: 66, home: true,
        playerSelection: { selected: true, started: true, appearance: 'starter', minutes: 90 }
      }, 0);
      let finalResult = null;
      const gateway = {
        playNextBlock(choiceIndex) {
          const output = advanceInteractiveMatch(state, session, { choiceIndex });
          if (output.finished) {
            finalResult = output.result;
            return { complete: true };
          }
          return {
            interactive: true,
            interactiveStep: output.step,
            interactiveDecision: output.step?.kind === 'decision' ? session.decision : null
          };
        }
      };
      const ui = { gateway };
      let completed = false;
      const controller = new InteractiveMatchFlowController({
        ui,
        onResult(next) {
          if (next?.interactive) controller.show(next);
          else completed = Boolean(next?.complete);
        }
      });
      controller.show({ interactive: true, interactiveStep: session.step });

      const phases = [];
      const decisionCounts = [];
      let reactionLabels = [];
      for (let index = 0; index < 10; index += 1) {
        const overlay = document.querySelector('[data-interactive-match-flow]');
        phases.push(overlay?.dataset.interactivePhase || null);
        const choices = overlay?.querySelectorAll('[data-interactive-choice]') || [];
        if (choices.length) decisionCounts.push(choices.length);
        if (overlay?.dataset.interactivePhase === 'reactions') {
          reactionLabels = [...overlay.querySelectorAll('.interactive-match-reactions strong')].map(node => node.textContent);
        }
        controller.advance(choices.length ? 0 : null);
      }

      return {
        phases,
        decisionCounts,
        reactionLabels,
        completed,
        overlayRemaining: Boolean(document.querySelector('[data-interactive-match-flow]')),
        result: finalResult && {
          teamGoals: finalResult.teamGoals,
          goals: finalResult.goals,
          assists: finalResult.assists,
          decisions: finalResult.decisions.length,
          reactionCount: finalResult.postMatchReactions.length
        }
      };
    } finally {
      Math.random = originalRandom;
    }
  });

  expect(flow.phases).toEqual([
    'pre_match', 'kickoff', 'moment_1', 'consequence_1', 'match_continues',
    'unexpected_event', 'moment_2', 'full_time_sequence', 'final_whistle', 'reactions'
  ]);
  expect(flow.decisionCounts).toEqual([4, 4]);
  expect(flow.reactionLabels).toEqual(['VESTIAIRE', 'COACH', 'MÉDIAS']);
  expect(flow.completed).toBe(true);
  expect(flow.overlayRemaining).toBe(false);
  expect(flow.result.decisions).toBe(2);
  expect(flow.result.reactionCount).toBe(3);
  expect(flow.result.teamGoals).toBeGreaterThanOrEqual(flow.result.goals + flow.result.assists);
});

test('la présentation du match échappe les textes narratifs', async ({ page }) => {
  await page.goto('/index.html');
  const rendered = await page.evaluate(async () => {
    const { default: InteractiveMatchFlowController } = await import('/ui/interactiveMatchFlowController.js');
    const controller = new InteractiveMatchFlowController({ ui: { gateway: {} } });
    controller.show({
      interactive: true,
      interactiveStep: {
        phase: 'pre_match', kind: 'narration', label: 'AVANT-MATCH', progress: 5,
        title: '<img src=x onerror=window.__matchInjected=true>', text: '<script>window.__matchInjected=true</script>',
        team: '<Street>', opponent: 'Rival & City', home: true, score: { home: 0, away: 0 },
        choices: [], items: [], autoAdvanceMs: 0, actionLabel: 'Continuer'
      }
    });
    return {
      injected: Boolean(window.__matchInjected),
      text: document.querySelector('[data-interactive-match-flow]')?.textContent || '',
      rogueImage: Boolean(document.querySelector('[data-interactive-match-flow] img')),
      rogueScript: Boolean(document.querySelector('[data-interactive-match-flow] script'))
    };
  });

  expect(rendered.injected).toBe(false);
  expect(rendered.text).toContain('<img src=x');
  expect(rendered.text).toContain('<script>');
  expect(rendered.rogueImage).toBe(false);
  expect(rendered.rogueScript).toBe(false);
});
