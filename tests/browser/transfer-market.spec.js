import { test, expect } from '@playwright/test';

async function boot(page) {
  await page.goto('/index.html');
  await page.waitForFunction(() => Boolean(window.game?.gameUI && window.game?.gameSystems));
}

async function createCareer(page, age) {
  return page.evaluate(playerAge => {
    const gateway = window.game.gameUI;
    const state = gateway.startCareer({
      firstname: 'Market',
      lastname: 'Tester',
      country: 'France',
      position: 'BU',
      origin: 'CENTRE_FORMATION',
      youthClub: { name: 'Test Academy', country: 'France', prestige: 45, tier: 2 }
    });
    state.player.age = playerAge;
    state.player.overall = playerAge < 18 ? 64 : 82;
    state.player.reputation = playerAge < 18 ? 28 : 100;
    state.player.fame = playerAge < 18 ? 25 : 100;
    state.player.stats ||= {};
    state.player.stats.averageRating = playerAge < 18 ? 8.5 : 9.2;
    state.calendar.currentMonth = 3;
    state.calendar.currentSeasonYear = 2026;
    state.pendingTransferOffer = null;
    state.scouting = { observations: [], interests: [], shortlist: [], clubNeeds: {} };
    state.transferInterests = [];
    state.clubTransferNeeds = {};
    state.transferMarket = { activity: [], lastCycle: null };
    state.notifications = { signals: [], threads: [], unreadCount: 0 };
    return { id: state.player.id, age: state.player.age };
  }, age);
}

test('le registre relie un seul pipeline mercato canonique au TransferSystem', async ({ page }) => {
  await boot(page);
  const wiring = await page.evaluate(() => {
    const systems = window.game.gameSystems;
    return {
      scouting: systems.transferSystem.scoutingSystem === systems.scoutingSystem,
      interests: systems.transferSystem.interestPipeline === systems.interestPipeline,
      competition: systems.transferSystem.marketCompetitionSystem === systems.marketCompetitionSystem,
      needs: systems.transferSystem.clubNeedSystem === systems.clubNeedSystem,
      opportunity: systems.transferSystem.opportunityEngine === systems.opportunityEngine,
      sharedNeeds: systems.marketCompetitionSystem.clubNeeds === systems.clubNeedSystem
    };
  });

  expect(wiring).toEqual({
    scouting: true,
    interests: true,
    competition: true,
    needs: true,
    opportunity: true,
    sharedNeeds: true
  });
});

test('ouvrir Mercato sans offre ne fabrique jamais une fausse offre sans club', async ({ page }) => {
  await boot(page);

  const result = await page.evaluate(async () => {
    const { TransferView } = await import('/ui/views/transferView.js');
    const view = new TransferView({ ui: {}, gateway: {} });
    const state = {
      player: { age: 22, overall: 72, club: 'Test FC' },
      pendingTransferOffer: null,
      transferInterests: [],
      transferMarket: { activity: [] }
    };
    const emptyHtml = view.render(state);
    state.pendingTransferOffer = {};
    const malformedHtml = view.render(state);
    state.pendingTransferOffer = { club: 'FC Exemple', salaireHebdo: 2500, montant: 500000 };
    const realHtml = view.render(state);
    return { emptyHtml, malformedHtml, realHtml };
  });

  expect(result.emptyHtml).toContain('Rien à décider pour l’instant');
  expect(result.emptyHtml).not.toContain('Nouveau club');
  expect(result.malformedHtml).toContain('Rien à décider pour l’instant');
  expect(result.malformedHtml).not.toContain('Nouveau club');
  expect(result.realHtml).toContain('FC Exemple');
  expect(result.realHtml).toContain('Accepter');
});

test('16 ans : un club observe puis crée un intérêt avant toute offre officielle', async ({ page }) => {
  await boot(page);
  await createCareer(page, 16);

  const result = await page.evaluate(() => {
    const systems = window.game.gameSystems;
    const state = window.game.gameUI.state;
    const originalRandom = Math.random;
    Math.random = () => 0.10;
    try {
      const first = systems.transferSystem.progressMarket(state, {
        matchResults: [{ rating: 9.4, goals: 2, assists: 1 }]
      });
      const afterFirst = {
        watching: state.scouting.observations.filter(item => item.status === 'watching').length,
        interests: state.transferInterests.length,
        offer: Boolean(state.pendingTransferOffer),
        activity: first.activity.map(item => item.type)
      };

      const second = systems.transferSystem.progressMarket(state, {
        matchResults: [{ rating: 8.8, goals: 1, assists: 0 }]
      });
      const interest = state.transferInterests[0] || null;
      return {
        afterFirst,
        completed: state.scouting.observations.filter(item => item.status === 'completed').length,
        interestSource: interest?.source || null,
        interestStage: interest?.stage || null,
        interestClubId: interest?.clubId || null,
        pendingOffer: Boolean(state.pendingTransferOffer),
        secondActivity: second.activity.map(item => item.type),
        scoutingSignals: state.notifications.signals.filter(item => item.category === 'scouting').length,
        marketSignals: state.notifications.signals.filter(item => item.category === 'mercato').length
      };
    } finally {
      Math.random = originalRandom;
    }
  });

  expect(result.afterFirst.watching).toBe(1);
  expect(result.afterFirst.interests).toBe(0);
  expect(result.afterFirst.offer).toBe(false);
  expect(result.afterFirst.activity).toContain('scouting_started');
  expect(result.completed).toBe(1);
  expect(result.interestSource).toBe('scouting');
  expect(['exploratory', 'serious']).toContain(result.interestStage);
  expect(result.interestClubId).toBeTruthy();
  expect(result.pendingOffer).toBe(false);
  expect(result.secondActivity).toContain('scouting_completed');
  expect(result.scoutingSignals).toBeGreaterThanOrEqual(2);
  expect(result.marketSignals).toBeGreaterThanOrEqual(1);
});

test('senior performant : intérêt → contact → offre officielle → transfert accepté', async ({ page }) => {
  await boot(page);
  await createCareer(page, 24);

  const flow = await page.evaluate(() => {
    const systems = window.game.gameSystems;
    const state = window.game.gameUI.state;
    const originalRandom = Math.random;
    Math.random = () => 0;
    try {
      const summary = { matchResults: [{ rating: 9.7, goals: 2, assists: 2 }] };
      systems.transferSystem.progressMarket(state, summary);
      if (!state.transferInterests.length) throw new Error('Aucun intérêt senior créé dans le scénario déterministe.');

      for (const interest of state.transferInterests) {
        const need = state.clubTransferNeeds[interest.clubId];
        if (need) need.urgency = 100;
      }

      const stages = [state.transferInterests[0].stage];
      for (let cycle = 0; cycle < 10 && !state.pendingTransferOffer; cycle += 1) {
        systems.transferSystem.progressMarket(state, summary);
        stages.push(state.transferInterests[0].stage);
      }

      const offer = state.pendingTransferOffer ? { ...state.pendingTransferOffer } : null;
      const offerSignal = state.notifications.signals.find(item => item.intent === 'offer');
      if (!offer) return { stages, offer: null, offerSignal: offerSignal || null };

      const accepted = systems.transferSystem.accept(state);
      return {
        stages,
        offer: {
          club: offer.club,
          clubId: offer.clubId,
          interestId: offer.interestId,
          type: offer.type
        },
        offerSignal: offerSignal ? { clubId: offerSignal.clubId, body: offerSignal.body } : null,
        accepted,
        playerClubId: state.player.clubId,
        pendingAfterAccept: state.pendingTransferOffer,
        openInterests: state.transferInterests.filter(item => item.stage !== 'closed').length
      };
    } finally {
      Math.random = originalRandom;
    }
  });

  expect(flow.offer).toBeTruthy();
  expect(flow.stages).toContain('contact');
  expect(flow.stages).toContain('offer');
  expect(flow.offer.clubId).toBeTruthy();
  expect(flow.offer.interestId).toBeTruthy();
  expect(flow.offer.type).toBe('transfert_senior');
  expect(flow.offerSignal).toBeTruthy();
  expect(flow.offerSignal.clubId).toBe(flow.offer.clubId);
  expect(flow.accepted?.accepted).toBe(true);
  expect(flow.playerClubId).toBe(flow.offer.clubId);
  expect(flow.pendingAfterAccept).toBeNull();
  expect(flow.openInterests).toBe(0);
});
