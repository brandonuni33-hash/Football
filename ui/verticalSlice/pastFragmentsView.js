import salonVisual from './memoryVisuals/salon.js';
import courVisual from './memoryVisuals/cour.js';
import cityVisual from './memoryVisuals/city.js';
import chambreVisual from './memoryVisuals/chambre.js';
import porteVisual from './memoryVisuals/porte.js';

const MEMORY_VISUALS = Object.freeze({ salon: salonVisual, cour: courVisual, city: cityVisual, chambre: chambreVisual, porte: porteVisual });

function escapeHtml(value = '') {
    return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function answersTemplate(fragment) {
    return fragment.answers.map(answer => `<button type="button" class="stp-memory-answer" data-memory-answer="${escapeHtml(answer.id)}"><span>${escapeHtml(answer.text)}</span></button>`).join('');
}

export function pastFragmentTemplate(fragment, index, total) {
    return `<section class="stp-memory-screen visual-${escapeHtml(fragment.visualKey)}" data-stp-step="pastFragments" data-memory-id="${escapeHtml(fragment.id)}">
      <div class="stp-memory-layer is-active"><img class="stp-memory-photo" src="${MEMORY_VISUALS[fragment.visualKey] || salonVisual}" alt="" draggable="false"></div>
      <div class="stp-memory-warmth"></div><div class="stp-memory-haze haze-a"></div><div class="stp-memory-haze haze-b"></div><div class="stp-memory-dust dust-a"></div><div class="stp-memory-dust dust-b"></div><div class="stp-memory-vignette"></div><div class="stp-memory-grain"></div>
      <div class="stp-memory-content is-visible"><div class="stp-memory-meta">${escapeHtml(fragment.memoryLabel)} <span>${index + 1} / ${total}</span></div><h1>${escapeHtml(fragment.question)}</h1><div class="stp-memory-answers is-visible">${answersTemplate(fragment)}</div></div>
    </section>`;
}

export const PAST_FRAGMENTS_CSS = `
html:has(.stp-memory-stage),body:has(.stp-memory-stage){background:#050403;overflow:hidden}.stp-memory-stage{position:relative;width:100%;height:100dvh;overflow:hidden;background:#050403;color:#f5f0e7;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;isolation:isolate}.stp-memory-screen{position:absolute;inset:0;overflow:hidden;background:#090704}.stp-memory-layer{position:absolute;inset:-1.5%;opacity:0;transform:scale(1.016);transition:opacity 1.08s cubic-bezier(.22,.61,.36,1),transform 9s ease-out;will-change:opacity,transform}.stp-memory-layer.is-active{opacity:1;transform:scale(1.038)}.stp-memory-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;display:block;filter:saturate(.72) contrast(1.03) brightness(.82) sepia(.08);-webkit-user-select:none;user-select:none;pointer-events:none}.stp-memory-warmth{position:absolute;inset:0;background:linear-gradient(180deg,rgba(181,125,69,.08),rgba(69,42,24,.12) 50%,rgba(5,4,3,.28));pointer-events:none}.stp-memory-vignette{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.1),transparent 42%,rgba(0,0,0,.42) 72%,rgba(0,0,0,.9)),radial-gradient(circle at 50% 40%,transparent 25%,rgba(0,0,0,.08) 60%,rgba(0,0,0,.48));pointer-events:none}.stp-memory-haze{position:absolute;inset:-18%;pointer-events:none;filter:blur(24px);opacity:.34;mix-blend-mode:screen}.haze-a{background:radial-gradient(ellipse at 18% 42%,rgba(240,214,170,.23),transparent 34%);animation:stp-haze-a 12s ease-in-out infinite alternate}.haze-b{background:radial-gradient(ellipse at 82% 32%,rgba(225,208,182,.13),transparent 30%);animation:stp-haze-b 15s ease-in-out infinite alternate}.stp-memory-dust{position:absolute;inset:-8%;pointer-events:none;opacity:.17;background-image:radial-gradient(circle,rgba(255,241,215,.8) 0 1px,transparent 1.2px);background-size:73px 89px;filter:blur(.25px)}.dust-a{animation:stp-dust 18s linear infinite}.dust-b{background-size:101px 117px;opacity:.1;animation:stp-dust 25s linear infinite reverse}.stp-memory-grain{position:absolute;inset:0;pointer-events:none;opacity:.07;mix-blend-mode:soft-light;background-image:radial-gradient(circle at 20% 30%,#fff 0 .55px,transparent .7px),radial-gradient(circle at 70% 60%,#fff 0 .5px,transparent .65px);background-size:5px 6px,7px 5px}.stp-memory-content{position:absolute;z-index:5;left:0;right:0;bottom:0;padding:0 20px calc(24px + env(safe-area-inset-bottom,0px));opacity:0;transform:translateY(8px);transition:opacity .55s ease,transform .55s ease;pointer-events:none}.stp-memory-content.is-visible{opacity:1;transform:none}.stp-memory-meta{display:flex;justify-content:space-between;margin-bottom:11px;color:rgba(229,199,158,.68);font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.stp-memory-content h1{margin:0;max-width:365px;font-size:clamp(21px,5.6vw,26px);line-height:1.1;letter-spacing:-.03em;text-shadow:0 2px 15px rgba(0,0,0,.92)}.stp-memory-answers{display:grid;gap:7px;margin-top:16px;opacity:0;transform:translateY(7px);transition:opacity .5s ease,transform .5s ease;pointer-events:none}.stp-memory-answers.is-visible{opacity:1;transform:none;pointer-events:auto}.stp-memory-answer{appearance:none;width:100%;min-height:45px;padding:10px 12px;border:.5px solid rgba(255,255,255,.17);border-radius:11px;background:rgba(5,5,5,.58);backdrop-filter:blur(8px);color:#eee8df;text-align:left;font:inherit;font-size:13px;line-height:1.28;touch-action:manipulation;transition:transform .12s ease,background .16s ease,border-color .16s ease}.stp-memory-answer:active{transform:scale(.988)}.stp-memory-answer.selected{border-color:rgba(232,205,166,.5);background:rgba(43,32,23,.8)}@keyframes stp-haze-a{to{transform:translate3d(5%,2%,0) scale(1.08)}}@keyframes stp-haze-b{to{transform:translate3d(-4%,4%,0) scale(1.1)}}@keyframes stp-dust{to{transform:translate3d(18px,-42px,0)}}@media(prefers-reduced-motion:reduce){.stp-memory-layer,.stp-memory-content,.stp-memory-answers{transition:none;transform:none}.stp-memory-layer.is-active{transform:none}.stp-memory-haze,.stp-memory-dust{animation:none}}
`;

function preloadVisuals() {
    if (typeof Image === 'undefined') return;
    Object.values(MEMORY_VISUALS).forEach(src => { const image = new Image(); image.decoding = 'async'; image.src = src; });
}

function layerMarkup(name) { return `<div class="stp-memory-layer" data-memory-layer="${name}"><img class="stp-memory-photo" alt="" draggable="false"></div>`; }

function assignVisual(layer, fragment) {
    const photo = layer.querySelector('.stp-memory-photo');
    const src = MEMORY_VISUALS[fragment.visualKey] || salonVisual;
    return new Promise(resolve => {
        if (!photo) return resolve();
        const done = () => resolve();
        photo.onload = done;
        photo.onerror = done;
        photo.src = src;
        if (photo.complete && photo.naturalWidth > 0) resolve();
    });
}

export function mountPastFragments(container, fragments, { onAnswer, onComplete } = {}) {
    if (!container) throw new Error('Conteneur souvenirs requis.');
    if (!Array.isArray(fragments) || fragments.length === 0) throw new Error('Souvenirs requis.');
    preloadVisuals();
    let index = 0, activeLayer = 'a', locked = false;
    const answers = [];
    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

    container.innerHTML = `<section class="stp-memory-stage" data-stp-step="pastFragments"><div class="stp-memory-screen" data-memory-id=""></div></section>`;
    const screen = container.querySelector('.stp-memory-screen');
    screen.innerHTML = `${layerMarkup('a')}${layerMarkup('b')}<div class="stp-memory-warmth"></div><div class="stp-memory-haze haze-a"></div><div class="stp-memory-haze haze-b"></div><div class="stp-memory-dust dust-a"></div><div class="stp-memory-dust dust-b"></div><div class="stp-memory-vignette"></div><div class="stp-memory-grain"></div><div class="stp-memory-content"><div class="stp-memory-meta"></div><h1></h1><div class="stp-memory-answers"></div></div>`;
    const layers = { a: screen.querySelector('[data-memory-layer="a"]'), b: screen.querySelector('[data-memory-layer="b"]') };
    const content = screen.querySelector('.stp-memory-content');
    const meta = screen.querySelector('.stp-memory-meta');
    const title = screen.querySelector('h1');
    const answerRoot = screen.querySelector('.stp-memory-answers');

    const bindAnswers = fragment => answerRoot.querySelectorAll('[data-memory-answer]').forEach(button => button.addEventListener('click', () => choose(fragment, button)));
    const fillCopy = fragment => {
        screen.dataset.memoryId = fragment.id;
        screen.className = `stp-memory-screen visual-${fragment.visualKey}`;
        meta.innerHTML = `${escapeHtml(fragment.memoryLabel)} <span>${index + 1} / ${fragments.length}</span>`;
        title.textContent = fragment.question;
        answerRoot.innerHTML = answersTemplate(fragment);
        bindAnswers(fragment);
    };
    const reveal = () => {
        content.classList.remove('is-visible'); answerRoot.classList.remove('is-visible');
        if (reduced) { content.classList.add('is-visible'); answerRoot.classList.add('is-visible'); return; }
        setTimeout(() => content.classList.add('is-visible'), 620);
        setTimeout(() => answerRoot.classList.add('is-visible'), 1380);
    };
    const showFirst = async () => {
        const fragment = fragments[0];
        await assignVisual(layers.a, fragment);
        fillCopy(fragment);
        requestAnimationFrame(() => layers.a.classList.add('is-active'));
        if (reduced) { content.classList.add('is-visible'); answerRoot.classList.add('is-visible'); }
        else { setTimeout(() => content.classList.add('is-visible'), 900); setTimeout(() => answerRoot.classList.add('is-visible'), 1700); }
    };
    async function choose(fragment, button) {
        if (locked) return; locked = true; button.classList.add('selected');
        const answerId = button.dataset.memoryAnswer;
        answers.push(Object.freeze({ fragmentId: fragment.id, answerId })); onAnswer?.({ fragment, answerId, index });
        content.classList.remove('is-visible'); answerRoot.classList.remove('is-visible');
        if (index >= fragments.length - 1) {
            setTimeout(() => onComplete?.(Object.freeze([...answers])), reduced ? 0 : 520); return;
        }
        const nextIndex = index + 1, nextFragment = fragments[nextIndex], nextLayer = activeLayer === 'a' ? 'b' : 'a';
        await assignVisual(layers[nextLayer], nextFragment);
        const advance = () => {
            layers[nextLayer].classList.add('is-active'); layers[activeLayer].classList.remove('is-active');
            index = nextIndex; activeLayer = nextLayer; fillCopy(nextFragment); reveal(); locked = false;
        };
        if (reduced) advance(); else setTimeout(advance, 180);
    }
    showFirst();
    return Object.freeze({ getIndex: () => index, getAnswers: () => Object.freeze([...answers]) });
}
