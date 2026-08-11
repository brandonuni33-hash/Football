import { test, expect } from '@playwright/test';

const report = {
  summary: {
    matchResults: [{
      matchIndex: 0,
      opponent: 'Rival FC',
      competitionName: 'Championnat',
      result: 'win',
      teamGoals: 2,
      opponentGoals: 0,
      rating: 8.4,
      goals: 1,
      assists: 1,
      playerPlayed: true,
      started: true,
      fixture: { id: 'world-facts-match' }
    }]
  }
};

const state = () => ({
  player: { id: 'world-player', firstname: 'Alex', age: 22, overall: 72, stats: { matchesPlayed: 1 } },
  calendar: { currentSeasonYear: 2026, currentMonth: 8 },
  career: { seasonHistory: [] },
  careerMemory: [],
  notifications: { signals: [], threads: [], unreadCount: 0 }
});

test('les réactions visibles du monde rejoignent la scène et le journal persistant', async ({ page }) => {
  await page.goto('/index.html');
  const result = await page.evaluate(async ({ report, state }) => {
    const [{ default: NarrativeEngine }, { default: NarrativeOrchestrator }, { default: NarrativePresenter }] = await Promise.all([
      import('/domain/narrative/narrativeEngine.js'),
      import('/application/narrativeOrchestrator.js'),
      import('/application/narrativePresenter.js')
    ]);
    const orchestrator = new NarrativeOrchestrator({ engine: new NarrativeEngine(), presenter: new NarrativePresenter() });
    const presented = orchestrator.processBlock({
      state,
      report,
      resolved: {
        mediaCycle: { post: { id: 'post-world', source: 'Actu Foot', type: 'media', content: 'La ville parle encore de ce match.' } },
        transferCycle: {
          activity: [
            { type: 'scouting_started', clubId: 'secret-club', observationId: 'secret-observation' },
            { type: 'official_offer', clubId: 'club-a', interestId: 'interest-a' }
          ],
          offer: { club: 'Club A', clubId: 'club-a', interestId: 'interest-a', message: 'Club A souhaite te recruter.' }
        },
        familyBirths: [{ child: { id: 'child-world', firstName: 'Lina', birthDate: '2026-08-01' } }]
      }
    });
    return {
      sceneType: presented.primaryScene?.type,
      worldBeatsInScene: presented.primaryScene?.beats?.filter(beat => beat.kind === 'world-observation').length,
      passiveCount: presented.passiveBeats.length,
      journalCount: state.narrativeState?.journalEntries?.length,
      journalText: state.narrativeState?.journalEntries?.map(entry => entry.text).join(' '),
      threadIds: Object.keys(state.narrativeState?.storyThreads || {})
    };
  }, { report, state: state() });

  expect(result.sceneType).toBe('match.end');
  expect(result.worldBeatsInScene).toBe(2);
  expect(result.passiveCount).toBe(3);
  expect(result.journalCount).toBe(3);
  expect(result.journalText).not.toContain('secret-club');
  expect(result.threadIds).toContain('family-legacy');
  expect(result.threadIds).toContain('transfer:interest-a');
});

test('un fait de carrière sans match produit une scène monde unique', async ({ page }) => {
  await page.goto('/index.html');
  const scene = await page.evaluate(async state => {
    const { default: NarrativeEngine } = await import('/domain/narrative/narrativeEngine.js');
    return new NarrativeEngine().processBlock({
      state,
      report: { summary: { matchResults: [] } },
      resolved: { coachEvent: { id: 'coach-world', title: 'Le coach veut te parler', description: 'Il attend une réponse.' } }
    }).primaryScene;
  }, state());

  expect(scene.type).toBe('world.update');
  expect(scene.beats).toHaveLength(1);
  expect(scene.beats[0].category).toBe('coach');
});

test('la vue Carrière présente les entrées du Narrative Engine sans les transformer en notifications', async ({ page }) => {
  await page.goto('/index.html');
  const html = await page.evaluate(async state => {
    const [{ default: CareerView }, { default: DashboardView }, { default: NarrativePresenter }] = await Promise.all([
      import('/ui/views/careerView.js'),
      import('/ui/views/dashboardView.js'),
      import('/application/narrativePresenter.js')
    ]);
    state.narrativeState = {
      journalEntries: [{
        id: 'journal-world', category: 'family', title: 'La famille s’agrandit',
        text: '<Lina> vient de naître.', importance: 'exceptional', occurredAt: '2026-08-01'
      }]
    };
    const presenter = new NarrativePresenter();
    return {
      career: new CareerView({ narrativePresenter: presenter }).render(state),
      dashboard: new DashboardView({ narrativePresenter: presenter }).render(state)
    };
  }, state());

  expect(html.career).toContain('data-narrative-journal-entry="journal-world"');
  expect(html.career).toContain('La famille s’agrandit');
  expect(html.career).toContain('&lt;Lina&gt; vient de naître.');
  expect(html.career).not.toContain('data-career-notification-id="journal-world"');
  expect(html.dashboard).toContain('data-narrative-entry-id="journal-world"');
  expect(html.dashboard).toContain('La famille s’agrandit');
});
