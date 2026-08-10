// ui-successor-transition.js
// Contrôleur UI unique de transition père → fils.
// Aucun rendu de Dashboard concurrent : utilise les classes de ui-live-polish.css.
import { EventBus } from './core/eventBus.js';

let payload = null;
let mounted = false;

function engine() {
    return window.UI?.engine || window.gameEngine || null;
}

function render() {
    const app = document.getElementById('app');
    const screen = app?.querySelector('.phone-home-screen');
    if (!screen) return;

    let card = screen.querySelector('.successor-transition-card');
    if (!payload?.successorOptions?.length) {
        card?.remove();
        return;
    }

    if (!card) {
        card = document.createElement('section');
        card.className = 'successor-transition-card';
        const notificationZone = screen.querySelector('.dashboard-notification-zone');
        const apps = screen.querySelector('.apps-grid');
        if (notificationZone) notificationZone.insertAdjacentElement('afterend', card);
        else if (apps) apps.insertAdjacentElement('beforebegin', card);
        else screen.appendChild(card);
    }

    card.innerHTML = `
        <div class="successor-transition-heading">Nouvelle génération</div>
        <div class="successor-transition-title">Votre carrière continue avec votre fils</div>
        <div class="successor-list"></div>
    `;

    const list = card.querySelector('.successor-list');
    payload.successorOptions.forEach(option => {
        const row = document.createElement('div');
        row.className = 'successor-option';
        const age = Number(option.age || 0);
        row.innerHTML = `
            <div class="successor-option-info">
                <strong>${option.name || 'Votre fils'}</strong>
                <span>${age} ans</span>
            </div>
            <div class="successor-option-actions"></div>
        `;
        const actions = row.querySelector('.successor-option-actions');

        if (option.availableNow) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'successor-action successor-action-primary';
            button.textContent = 'Commencer sa carrière';
            button.addEventListener('click', () => {
                const result = engine()?.startSuccessorCareer?.(option.childId);
                if (result) {
                    payload = null;
                    card.remove();
                    engine()?.ui?.render?.();
                }
            });
            actions.appendChild(button);
        } else if (option.canSimulate) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'successor-action successor-action-secondary';
            button.textContent = 'Simuler jusqu’à 14 ans';
            button.addEventListener('click', () => {
                button.disabled = true;
                button.textContent = 'Simulation…';
                const result = engine()?.simulateSuccessorTo14?.(option.childId);
                if (result) {
                    payload = { ...payload, successorOptions: payload.successorOptions.map(item => item.childId === option.childId ? { ...item, age: 14, availableNow: true, canSimulate: false } : item) };
                    render();
                } else {
                    button.disabled = false;
                    button.textContent = 'Simuler jusqu’à 14 ans';
                }
            });
            actions.appendChild(button);
        }

        list.appendChild(row);
    });
}

function mount() {
    if (mounted) return;
    mounted = true;
    EventBus.on('career.successor_ready', next => {
        payload = next || null;
        requestAnimationFrame(render);
    });
    const observer = new MutationObserver(() => requestAnimationFrame(render));
    observer.observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
    requestAnimationFrame(render);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
else mount();
