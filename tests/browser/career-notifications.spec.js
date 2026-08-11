import { test, expect } from '@playwright/test';

test('l’application Carrière affiche les notifications et ouvre celle sélectionnée', async ({ page }) => {
  await page.goto('/index.html');

  const result = await page.evaluate(async () => {
    const { CareerView } = await import('/ui/views/careerView.js');
    const opened = [];
    const ui = { openNotification: id => opened.push(id) };
    const view = new CareerView({ ui, gateway: {} });
    const state = {
      player: { age: 19, club: 'Test FC', overall: 72 },
      notifications: {
        unreadCount: 1,
        signals: [
          { id: 'career-news-1', title: 'Le coach te félicite', body: 'Ta progression est remarquée.', category: 'coach', read: false }
        ]
      }
    };

    const root = document.createElement('div');
    root.innerHTML = view.render(state);
    document.body.appendChild(root);
    view.bind(root);
    root.querySelector('[data-career-notification-id="career-news-1"]')?.click();

    return {
      hasInbox: Boolean(root.querySelector('.career-notification-inbox')),
      unreadBadge: root.querySelector('.career-app-unread')?.textContent?.trim(),
      title: root.querySelector('.career-inbox-copy strong')?.textContent?.trim(),
      opened
    };
  });

  expect(result.hasInbox).toBe(true);
  expect(result.unreadBadge).toBe('1');
  expect(result.title).toBe('Le coach te félicite');
  expect(result.opened).toEqual(['career-news-1']);
});

test('le raccourci Carrière du Dashboard conserve le badge des notifications non lues', async ({ page }) => {
  await page.goto('/index.html');

  const result = await page.evaluate(async () => {
    const { DashboardView } = await import('/ui/views/dashboardView.js');
    const view = new DashboardView({ ui: {}, gateway: {} });
    const html = view.render({
      player: { firstName: 'Test', lastName: 'Player', age: 18, position: 'BU', overall: 70, potential: 85, stats: {} },
      calendar: { currentSeasonYear: 2026 },
      notifications: {
        unreadCount: 3,
        signals: [
          { id: 'n1', title: 'A', read: false },
          { id: 'n2', title: 'B', read: false },
          { id: 'n3', title: 'C', read: false }
        ]
      }
    });
    const root = document.createElement('div');
    root.innerHTML = html;
    document.body.appendChild(root);
    const careerButton = root.querySelector('[data-app="career"]');
    const label = careerButton?.querySelector('.app-label');
    return {
      exists: Boolean(careerButton),
      badge: careerButton?.querySelector('.notification-badge')?.textContent?.trim(),
      visualLabel: label ? getComputedStyle(label, '::after').content : ''
    };
  });

  expect(result.exists).toBe(true);
  expect(result.badge).toBe('3');
  expect(result.visualLabel).toContain('Carrière');
});
