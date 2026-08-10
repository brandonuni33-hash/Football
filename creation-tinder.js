// creation-tinder.js
// Expérience de création de joueur façon Tinder : cartes empilées,
// swipe gauche = passer, swipe droite = choisir.
// La logique existante de ui.js reste la source de vérité.

(() => {
    const STYLE_ID = 'creation-tinder-styles';
    const DECK_CLASS = 'tinder-creation-deck';
    let observerStarted = false;
    let busy = false;

    const escapeHtml = (value = '') => String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const injectStyles = () => {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            .tinder-creation-shell {
                width: 100%;
                max-width: 520px;
                margin: 8px auto 0;
            }

            .tinder-creation-hint {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
                margin: 0 2px 12px;
                color: #94a3b8;
                font-size: .78rem;
                font-weight: 700;
            }

            .tinder-creation-hint .hint-left { color: #fb7185; }
            .tinder-creation-hint .hint-right { color: #34d399; }

            .tinder-creation-deck {
                position: relative;
                width: 100%;
                height: clamp(390px, 56vh, 540px);
                min-height: 360px;
                touch-action: pan-y;
                user-select: none;
            }

            .tinder-card {
                position: absolute;
                inset: 0;
                overflow: hidden;
                border-radius: 28px;
                padding: 26px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                background:
                    radial-gradient(circle at 80% 10%, rgba(59,130,246,.18), transparent 34%),
                    linear-gradient(145deg, rgba(22,32,55,.98), rgba(10,16,29,.98));
                border: 1px solid rgba(255,255,255,.14);
                box-shadow: 0 24px 55px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.08);
                cursor: grab;
                will-change: transform, opacity;
                transition: transform .22s ease, opacity .22s ease;
            }

            .tinder-card:active { cursor: grabbing; }

            .tinder-card.is-next { transform: scale(.94) translateY(12px); opacity: .72; }
            .tinder-card.is-next-2 { transform: scale(.89) translateY(24px); opacity: .4; }

            .tinder-card-title {
                font-size: clamp(1.45rem, 5vw, 2.15rem);
                line-height: 1.05;
                font-weight: 900;
                color: #fff;
                margin: 0 0 10px;
            }

            .tinder-card-subtitle {
                color: #a8b4c7;
                font-size: .98rem;
                line-height: 1.45;
                margin-bottom: 18px;
            }

            .tinder-card-icon {
                width: 72px;
                height: 72px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 22px;
                margin-bottom: 18px;
                font-size: 2rem;
                background: rgba(255,255,255,.08);
                border: 1px solid rgba(255,255,255,.12);
                box-shadow: 0 12px 25px rgba(0,0,0,.25);
            }

            .tinder-card-meta {
                display: grid;
                grid-template-columns: repeat(2, minmax(0,1fr));
                gap: 8px;
                margin-top: 8px;
            }

            .tinder-meta-pill {
                padding: 10px 12px;
                border-radius: 13px;
                background: rgba(255,255,255,.055);
                border: 1px solid rgba(255,255,255,.09);
                color: #dbe4f0;
                font-size: .8rem;
                font-weight: 700;
            }

            .tinder-card .offer-price {
                color: #fbbf24;
                font-size: 1.05rem;
                font-weight: 900;
                margin-top: 12px;
            }

            .tinder-stamp {
                position: absolute;
                top: 24px;
                padding: 7px 13px;
                border: 3px solid currentColor;
                border-radius: 10px;
                font-size: .82rem;
                font-weight: 1000;
                letter-spacing: 1px;
                text-transform: uppercase;
                opacity: 0;
                pointer-events: none;
            }

            .tinder-stamp.like { right: 20px; color: #34d399; transform: rotate(8deg); }
            .tinder-stamp.nope { left: 20px; color: #fb7185; transform: rotate(-8deg); }
            .tinder-card.dragging .tinder-stamp { opacity: 1; }

            .tinder-actions {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 18px;
                margin-top: 16px;
            }

            .tinder-action {
                width: 56px;
                height: 56px;
                border-radius: 50%;
                border: 1px solid rgba(255,255,255,.14);
                background: rgba(15,23,42,.9);
                color: #fff;
                font-size: 1.25rem;
                font-weight: 900;
                box-shadow: 0 12px 25px rgba(0,0,0,.3);
                cursor: pointer;
            }

            .tinder-action.pass { color: #fb7185; }
            .tinder-action.choose {
                width: 64px;
                height: 64px;
                color: #34d399;
                border-color: rgba(52,211,153,.35);
                box-shadow: 0 10px 28px rgba(16,185,129,.18);
            }

            .tinder-counter {
                text-align: center;
                margin-top: 9px;
                color: #64748b;
                font-size: .72rem;
                font-weight: 700;
            }

            .tinder-empty {
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 30px;
                border: 1px dashed rgba(255,255,255,.18);
                border-radius: 28px;
                background: rgba(15,23,42,.65);
            }

            .tinder-empty strong { color: #fff; font-size: 1.1rem; }
            .tinder-empty span { color: #94a3b8; margin-top: 8px; font-size: .86rem; }

            .tinder-input-card {
                justify-content: flex-start;
                padding-top: 28px;
                overflow-y: auto;
            }

            .tinder-input-card .form-group { margin-bottom: 14px; }
            .tinder-input-card .form-group:last-child { margin-bottom: 0; }

            .tinder-input-card input {
                width: 100%;
                box-sizing: border-box;
                margin-top: 7px;
                padding: 13px 14px;
                border-radius: 14px;
                border: 1px solid rgba(255,255,255,.14);
                background: rgba(255,255,255,.06);
                color: #fff;
                outline: none;
            }

            .tinder-input-card input:focus {
                border-color: rgba(59,130,246,.7);
                box-shadow: 0 0 0 3px rgba(59,130,246,.12);
            }

            .tinder-position-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 7px;
                margin-top: 10px;
            }

            .tinder-position-button {
                border: 1px solid rgba(255,255,255,.1);
                background: rgba(255,255,255,.055);
                color: #cbd5e1;
                border-radius: 11px;
                padding: 9px 4px;
                font-size: .72rem;
                font-weight: 800;
            }

            .tinder-position-button.selected {
                background: rgba(16,185,129,.16);
                border-color: rgba(52,211,153,.5);
                color: #6ee7b7;
            }

            @media (max-width: 430px) {
                .tinder-creation-shell { margin-top: 4px; }
                .tinder-card { padding: 22px; border-radius: 24px; }
                .tinder-creation-deck { height: min(59vh, 500px); }
            }
        `;
        document.head.appendChild(style);
    };

    const getStep = () => window.UI?.currentStep || 0;

    const getSourceItems = (step) => {
        if (step === 2) {
            return [...document.querySelectorAll('.origin-card-compact')].map(el => ({
                source: el,
                title: el.querySelector('h3')?.textContent?.trim() || 'Origine',
                subtitle: el.querySelector('.trait-tag')?.textContent?.trim() || '',
                icon: el.querySelector('.origin-icon-small')?.textContent?.trim() || '⚡',
                action: () => el.click()
            }));
        }
        if (step === 3) {
            return [...document.querySelectorAll('.chip-country')].map(el => ({
                source: el,
                title: el.textContent?.trim() || 'Pays',
                subtitle: 'Pays de départ',
                icon: '🌍',
                action: () => el.click()
            }));
        }
        if (step === 4) {
            const select = document.getElementById('heart-club-select');
            if (!select) return [];
            return [...select.options].filter(o => o.value).map(option => ({
                source: option,
                title: option.textContent?.trim() || 'Club',
                subtitle: option.parentElement?.label || 'Club de cœur',
                icon: '⚽',
                action: () => {
                    select.value = option.value;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }));
        }
        if (step === 5) {
            const cards = [...document.querySelectorAll('.grid-youth-clubs .club-card')];
            return cards.map(el => ({
                source: el,
                title: el.querySelector('.club-header-info h3')?.textContent?.trim() || 'Club',
                subtitle: el.querySelector('.league-tag')?.textContent?.trim() || '',
                icon: '⚽',
                extra: el.querySelector('.contract-details')?.textContent?.replace(/\s+/g, ' ').trim() || '',
                action: () => el.click()
            }));
        }
        return [];
    };

    const advanceAfterChoice = (step) => {
        setTimeout(() => {
            if (!window.UI) return;
            if (step < 5) {
                const next = document.getElementById('next-btn');
                if (next && !next.disabled) next.click();
            } else {
                const start = document.getElementById('start-btn');
                if (start && !start.disabled) start.click();
            }
        }, 260);
    };

    const buildDeck = (items, step) => {
        const old = document.querySelector(`.${DECK_CLASS}`)?.closest('.tinder-creation-shell');
        if (old) old.remove();

        const shell = document.createElement('section');
        shell.className = 'tinder-creation-shell';
        shell.dataset.step = String(step);

        const hint = document.createElement('div');
        hint.className = 'tinder-creation-hint';
        hint.innerHTML = '<span class="hint-left">← Passer</span><span>Glisse la carte</span><span class="hint-right">Choisir →</span>';

        const deck = document.createElement('div');
        deck.className = DECK_CLASS;

        const state = { index: 0, items };

        const render = () => {
            deck.innerHTML = '';
            const remaining = state.items.slice(state.index);
            if (!remaining.length) {
                deck.innerHTML = '<div class="tinder-empty"><strong>Plus de choix à afficher</strong><span>Utilise le bouton ↻ pour revoir les propositions.</span></div>';
                const reset = document.createElement('button');
                reset.className = 'tinder-action choose';
                reset.textContent = '↻';
                reset.style.margin = '16px auto 0';
                reset.addEventListener('click', () => { state.index = 0; render(); });
                deck.parentElement?.appendChild(reset);
                return;
            }

            remaining.slice(0, 3).reverse().forEach((item, reversedIndex) => {
                const realIndex = state.index + (Math.min(remaining.length, 3) - 1 - reversedIndex);
                const card = document.createElement('article');
                card.className = 'tinder-card';
                if (realIndex === state.index + 1) card.classList.add('is-next');
                if (realIndex === state.index + 2) card.classList.add('is-next-2');
                card.dataset.index = String(realIndex);

                const extra = item.extra ? `<div class="tinder-card-meta"><div class="tinder-meta-pill">${escapeHtml(item.extra.slice(0, 105))}</div></div>` : '';
                card.innerHTML = `
                    <span class="tinder-stamp like">CHOISIR</span>
                    <span class="tinder-stamp nope">PASSER</span>
                    <div class="tinder-card-icon">${escapeHtml(item.icon || '⚽')}</div>
                    <h3 class="tinder-card-title">${escapeHtml(item.title)}</h3>
                    <div class="tinder-card-subtitle">${escapeHtml(item.subtitle)}</div>
                    ${extra}
                `;

                if (realIndex === state.index) attachDrag(card, item, state, render, step);
                deck.appendChild(card);
            });
        };

        const actions = document.createElement('div');
        actions.className = 'tinder-actions';
        const pass = document.createElement('button');
        pass.className = 'tinder-action pass';
        pass.type = 'button';
        pass.textContent = '✕';
        const choose = document.createElement('button');
        choose.className = 'tinder-action choose';
        choose.type = 'button';
        choose.textContent = '♥';
        actions.append(pass, choose);

        const counter = document.createElement('div');
        counter.className = 'tinder-counter';

        const refreshCounter = () => {
            counter.textContent = `${Math.min(state.index + 1, items.length)} / ${items.length}`;
        };

        const act = (direction) => {
            if (busy || !state.items[state.index]) return;
            busy = true;
            const item = state.items[state.index];
            const top = deck.querySelector('.tinder-card[data-index="' + state.index + '"]');
            if (top) {
                top.style.transform = `translateX(${direction * 120}%) rotate(${direction * 18}deg)`;
                top.style.opacity = '0';
            }
            if (direction > 0) item.action();
            state.index += 1;
            refreshCounter();
            setTimeout(() => {
                busy = false;
                if (direction > 0) advanceAfterChoice(step);
                else render();
            }, 220);
        };

        pass.addEventListener('click', () => act(-1));
        choose.addEventListener('click', () => act(1));

        deck.addEventListener('pointerdown', e => {
            const top = deck.querySelector('.tinder-card[data-index="' + state.index + '"]');
            if (!top) return;
            top.setPointerCapture?.(e.pointerId);
        });

        shell.append(hint, deck, actions, counter);
        const target = document.querySelector('.career-content');
        if (!target) return;

        // On masque seulement le sélecteur visuel original ; les contrôles restent
        // dans le DOM pour conserver les événements déjà gérés par ui.js.
        target.querySelectorAll('.grid-origins-compact, .grid-countries, .form-group:has(#heart-club-select), .grid-youth-clubs').forEach(el => {
            el.style.display = 'none';
        });

        target.appendChild(shell);
        render();
        refreshCounter();
    };

    const attachDrag = (card, item, state, render, step) => {
        let startX = 0;
        let startY = 0;
        let dx = 0;
        let dragging = false;

        const finish = direction => {
            if (!dragging) return;
            dragging = false;
            card.releasePointerCapture?.(window.event?.pointerId);
            if (Math.abs(dx) < 90) {
                card.style.transform = '';
                card.classList.remove('dragging');
                dx = 0;
                return;
            }
            if (busy) return;
            busy = true;
            card.style.transform = `translateX(${direction * 125}%) rotate(${direction * 20}deg)`;
            card.style.opacity = '0';
            if (direction > 0) item.action();
            state.index += 1;
            setTimeout(() => {
                busy = false;
                if (direction > 0) advanceAfterChoice(step);
                else render();
            }, 220);
        };

        card.addEventListener('pointerdown', e => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            dx = 0;
            card.classList.add('dragging');
            card.setPointerCapture?.(e.pointerId);
        });

        card.addEventListener('pointermove', e => {
            if (!dragging) return;
            dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dy) > Math.abs(dx) && Math.abs(dx) < 35) return;
            card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
        });

        card.addEventListener('pointerup', () => finish(dx >= 0 ? 1 : -1));
        card.addEventListener('pointercancel', () => finish(dx >= 0 ? 1 : -1));
    };

    const enhanceStep = () => {
        const ui = window.UI;
        if (!ui || !document.querySelector('.career-container')) return;
        const step = getStep();
        injectStyles();

        // Ne pas transformer le Dashboard.
        if (step < 2 || step > 5) {
            document.querySelector('.tinder-creation-shell')?.remove();
            return;
        }

        if (document.querySelector(`.tinder-creation-shell[data-step="${step}"]`)) return;
        const items = getSourceItems(step);
        if (items.length) buildDeck(items, step);
    };

    const start = () => {
        if (observerStarted) return;
        observerStarted = true;
        injectStyles();
        const observer = new MutationObserver(() => enhanceStep());
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(enhanceStep, 200);
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
})();
