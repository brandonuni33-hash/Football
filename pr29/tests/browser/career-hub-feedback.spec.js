import { test, expect } from '@playwright/test';

test('le hub place Continuer sous Situation puis Vie/Joueur puis le prochain match', async ({ page }) => {
  await page.goto('/index.html');

  const result = await page.evaluate(async () => {
    const { DashboardView } = await import('/ui/views/dashboardView.js');
    const view = new DashboardView({ ui: {}, gateway: {} });
    const root = document.createElement('div');
    root.innerHTML = view.render({
      player: { firstName: 'Test', lastName: 'Player', age: 18, position: 'BU', club: 'Test FC', stats: {} },
      calendar: {
        currentMonth: 1,
        currentPeriod: 'Reprise',
        seasonSchedule: {
          category: 'U19',
          matches: [{ id: 'm1', opponent: 'Rival FC', month: 1, played: false, playable: true }]
        }
      },
      notifications: { signals: [] }
    });
    document.body.appendChild(root);

    const main = root.querySelector('.immersive-home');
    const children = [...main.children];
    const indexOf = selector => children.findIndex(node => node.matches(selector));

    return {
      situation: indexOf('[data-career-situation]'),
      continueButton: indexOf('#play-block-btn'),
      spaces: indexOf('[data-career-spaces]'),
      nextChallenge: indexOf('[data-next-challenge]'),
      nextEyebrow: root.querySelector('[data-next-challenge] span')?.textContent?.trim()
    };
  });

  expect(result.situation).toBeLessThan(result.continueButton);
  expect(result.continueButton).toBeLessThan(result.spaces);
  expect(result.spaces).toBeLessThan(result.nextChallenge);
  expect(result.nextEyebrow).toBe('⚽');
});

test('Historique s ouvre réellement au toucher', async ({ page }) => {
  await page.goto('/index.html');

  const result = await page.evaluate(async () => {
    const { DashboardView } = await import('/ui/views/dashboardView.js');
    const ui = {};
    const gateway = { state: { player: { firstName: 'Test', age: 18, club: 'Test FC', stats: {} } } };
    const view = new DashboardView({ ui, gateway });
    const root = document.createElement('div');
    root.innerHTML = view.render({
      player: { firstName: 'Test', age: 18, club: 'Test FC', stats: {} },
      calendar: { currentPeriod: 'Reprise' },
      notifications: {
        signals: [{ id: 'n1', title: 'Le coach te parle', body: 'Un moment important.', category: 'coach', read: false }]
      }
    });
    document.body.appendChild(root);
    view.bind(root);

    const zone = root.querySelector('.dashboard-notification-zone');
    const drawer = root.querySelector('.career-journal-drawer');
    const toggle = root.querySelector('[data-journal-toggle]');
    toggle.click();

    return {
      expanded: toggle.getAttribute('aria-expanded'),
      hidden: drawer.hidden,
      openClass: zone.classList.contains('is-open'),
      overflow: zone.style.overflow
    };
  });

  expect(result.expanded).toBe('true');
  expect(result.hidden).toBe(false);
  expect(result.openClass).toBe(true);
  expect(result.overflow).toBe('visible');
});
