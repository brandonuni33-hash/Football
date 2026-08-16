import { test, expect } from '@playwright/test';

test('Carrière garde les actualités carrière sans dupliquer Coach ni Réseaux', async ({ page }) => {
  await page.goto('/index.html');

  const result = await page.evaluate(async () => {
    const { CareerView } = await import('/ui/views/careerView.js');
    const opened = [];
    const ui = { openNotification: id => opened.push(id) };
    const view = new CareerView({ ui, gateway: {} });
    const state = {
      player: { age: 19, club: 'Test FC', overall: 72 },
      notifications: {
        unreadCount: 3,
        signals: [
          { id: 'career-news-1', title: 'Le prochain match approche', body: 'Le groupe se prépare.', category: 'match', read: false },
          { id: 'coach-news-1', title: 'Le coach te félicite', body: 'Ta progression est remarquée.', category: 'coach', read: false },
          { id: 'social-news-1', title: 'Une publication parle de toi', body: 'Nouveau post.', category: 'media', read: false }
        ]
      }
    };

    const root = document.createElement('div');
    root.innerHTML = view.render(state);
    document.body.appendChild(root);
    view.bind(root);
    root.querySelector('[data-career-notification-id="career-news-1"]')?.click();

    return {
      unreadBadge: root.querySelector('.career-app-unread')?.textContent?.trim(),
      titles: [...root.querySelectorAll('.career-inbox-copy strong')].map(node => node.textContent?.trim()),
      opened
    };
  });

  expect(result.unreadBadge).toBe('1');
  expect(result.titles).toEqual(['Le prochain match approche']);
  expect(result.opened).toEqual(['career-news-1']);
});

test('le Dashboard recentre le parcours sur Carrière, Vie et Joueur sans applications secondaires', async ({ page }) => {
  await page.goto('/index.html');

  const result = await page.evaluate(async () => {
    const { DashboardView } = await import('/ui/views/dashboardView.js');
    const view = new DashboardView({ ui: {}, gateway: {} });
    const html = view.render({
      player: { firstName: 'Test', lastName: 'Player', age: 18, position: 'BU', club: 'Test FC', overall: 70, potential: 85, stats: {} },
      calendar: { currentSeasonYear: 2026, currentPeriod: 'Reprise' },
      media: {},
      notifications: {
        unreadCount: 3,
        signals: [
          { id: 'n1', title: 'Coach', category: 'coach', read: false },
          { id: 'n2', title: 'Mercato', category: 'mercato', read: false },
          { id: 'n3', title: 'Réseau', category: 'media', read: false }
        ]
      }
    });
    const root = document.createElement('div');
    root.innerHTML = html;
    document.body.appendChild(root);
    return {
      hasContinue: Boolean(root.querySelector('#play-block-btn')),
      lifeLabel: root.querySelector('[data-space-link="life"] strong')?.textContent?.trim(),
      playerLabel: root.querySelector('[data-space-link="player"] strong')?.textContent?.trim(),
      hasBank: html.includes('Banque'),
      hasSocialApp: html.includes('Réseaux'),
      hasPotential: html.includes('POTENTIEL'),
      journalTitles: [...root.querySelectorAll('.career-journal-item strong')].map(node => node.textContent?.trim())
    };
  });

  expect(result.hasContinue).toBe(true);
  expect(result.lifeLabel).toBe('Vie');
  expect(result.playerLabel).toBe('Joueur');
  expect(result.hasBank).toBe(false);
  expect(result.hasSocialApp).toBe(false);
  expect(result.hasPotential).toBe(false);
  expect(result.journalTitles).not.toContain('Réseau');
});

test('les notifications sociales sont visibles dans Réseaux', async ({ page }) => {
  await page.goto('/index.html');

  const result = await page.evaluate(async () => {
    const { MediaView } = await import('/ui/views/mediaView.js');
    const view = new MediaView({ ui: {}, gateway: {} });
    const root = document.createElement('div');
    root.innerHTML = view.render({
      media: { feed: [], followers: 10, hypeLevel: 2 },
      notifications: {
        signals: [
          { id: 'social-1', title: 'Une publication parle de toi', body: 'Nouveau post.', category: 'media', read: false },
          { id: 'coach-1', title: 'Coach', body: 'Bien joué.', category: 'coach', read: false }
        ]
      }
    });
    return {
      socialExists: Boolean(root.querySelector('[data-social-notification-id="social-1"]')),
      coachExists: Boolean(root.querySelector('[data-social-notification-id="coach-1"]'))
    };
  });

  expect(result.socialExists).toBe(true);
  expect(result.coachExists).toBe(false);
});

test('le statut personnel est dans Famille et plus dans Messages', async ({ page }) => {
  await page.goto('/index.html');

  const result = await page.evaluate(async () => {
    const [{ FamilyView }, { MessagesView }] = await Promise.all([
      import('/ui/views/familyView.js'),
      import('/ui/views/messagesView.js')
    ]);
    const state = {
      player: { id: 'p1', age: 24 },
      family: { children: [], couples: [] },
      social: { romance: { unlocked: true, partnerName: 'Camille' }, relationships: [] }
    };
    const familyHtml = new FamilyView({ gateway: { state, getSuccessorOptions: () => [] } }).render(state);
    const messagesHtml = new MessagesView().render(state);
    return { familyHtml, messagesHtml };
  });

  expect(result.familyHtml).toContain('Statut personnel');
  expect(result.familyHtml).toContain('Camille');
  expect(result.messagesHtml).not.toContain('Statut personnel');
});

test('ouvrir une notification délègue la lecture au NotificationSystem canonique', async ({ page }) => {
  await page.goto('/index.html');

  const result = await page.evaluate(async () => {
    const { ViewCoordinator } = await import('/ui/viewCoordinator.js');
    const state = {
      player: { id: 'p1', age: 18 },
      notifications: {
        unreadCount: 1,
        signals: [
          { id: 'canonical-notification', title: 'Prochain match', body: 'Le groupe se prépare.', category: 'match', read: false }
        ]
      }
    };
    let markReadCalls = 0;
    let saveCalls = 0;
    const notificationSystem = {
      markRead(receivedState, signalId) {
        markReadCalls += 1;
        const signal = receivedState.notifications.signals.find(item => item.id === signalId);
        if (!signal || signal.read) return false;
        signal.read = true;
        receivedState.notifications.unreadCount -= 1;
        return true;
      }
    };
    const gateway = {
      state,
      application: { registry: { notificationSystem } },
      saveCareer() { saveCalls += 1; return true; }
    };
    const ui = {};
    const coordinator = new ViewCoordinator({ ui, gateway });
    coordinator.openNotification('canonical-notification');
    return {
      markReadCalls,
      saveCalls,
      read: state.notifications.signals[0].read,
      unreadCount: state.notifications.unreadCount,
      modalCount: document.querySelectorAll('[data-notification-modal]').length
    };
  });

  expect(result.markReadCalls).toBe(1);
  expect(result.saveCalls).toBe(1);
  expect(result.read).toBe(true);
  expect(result.unreadCount).toBe(0);
  expect(result.modalCount).toBe(1);
});
