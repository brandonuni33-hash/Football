import { test, expect } from '@playwright/test';

test('Carrière exclut les notifications réseaux sociaux', async ({ page }) => {
  await page.goto('/index.html');

  const result = await page.evaluate(async () => {
    const { CareerView } = await import('/ui/views/careerView.js');
    const opened = [];
    const ui = { openNotification: id => opened.push(id) };
    const view = new CareerView({ ui, gateway: {} });
    const state = {
      player: { age: 19, club: 'Test FC', overall: 72 },
      notifications: {
        unreadCount: 2,
        signals: [
          { id: 'career-news-1', title: 'Le coach te félicite', body: 'Ta progression est remarquée.', category: 'coach', read: false },
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
  expect(result.titles).toEqual(['Le coach te félicite']);
  expect(result.opened).toEqual(['career-news-1']);
});

test('le Dashboard affiche Carrière et sépare les badges Carrière et Réseaux', async ({ page }) => {
  await page.goto('/index.html');

  const result = await page.evaluate(async () => {
    const { DashboardView } = await import('/ui/views/dashboardView.js');
    const view = new DashboardView({ ui: {}, gateway: {} });
    const html = view.render({
      player: { firstName: 'Test', lastName: 'Player', age: 18, position: 'BU', overall: 70, potential: 85, stats: {} },
      calendar: { currentSeasonYear: 2026 },
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
    const careerButton = root.querySelector('[data-app="career"]');
    const socialButton = root.querySelector('[data-app="social"]');
    return {
      careerLabel: careerButton?.querySelector('.app-label')?.textContent?.trim(),
      careerBadge: careerButton?.querySelector('.notification-badge')?.textContent?.trim(),
      socialBadge: socialButton?.querySelector('.notification-badge')?.textContent?.trim(),
      journalTitles: [...root.querySelectorAll('.career-journal-item strong')].map(node => node.textContent?.trim())
    };
  });

  expect(result.careerLabel).toBe('Carrière');
  expect(result.careerBadge).toBe('2');
  expect(result.socialBadge).toBe('1');
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
