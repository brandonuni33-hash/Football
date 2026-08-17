import {
    positionAndFootViewModel,
    selectPosition,
    selectPreferredFoot,
    continueFromPositionAndFoot
} from './playerCreationPositionAndFootStep.js';

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

const POSITION_LAYOUT = Object.freeze([
    Object.freeze({ id: 'GB', left: 50, top: 89 }),
    Object.freeze({ id: 'DD', left: 17, top: 72 }),
    Object.freeze({ id: 'DC', left: 39, top: 76 }),
    Object.freeze({ id: 'DC', left: 61, top: 76 }),
    Object.freeze({ id: 'DG', left: 83, top: 72 }),
    Object.freeze({ id: 'MDC', left: 50, top: 59 }),
    Object.freeze({ id: 'MC', left: 50, top: 47 }),
    Object.freeze({ id: 'MOC', left: 50, top: 35 }),
    Object.freeze({ id: 'AD', left: 19, top: 19 }),
    Object.freeze({ id: 'BU', left: 50, top: 14 }),
    Object.freeze({ id: 'AG', left: 81, top: 19 })
]);

export function playerCreationPositionAndFootTemplate(state) {
    const vm = positionAndFootViewModel(state);
    const readyClass = vm.canContinue ? ' ready' : '';
    const disabled = vm.canContinue ? '' : ' disabled';
    const positionsById = new Map(vm.positions.map(position => [position.id, position]));

    const markers = POSITION_LAYOUT.map(slot => {
        const position = positionsById.get(slot.id);
        return `<button type="button" class="stp-position-marker${position.selected ? ' selected' : ''}" data-position="${escapeHtml(position.id)}" aria-pressed="${position.selected ? 'true' : 'false'}" style="left:${slot.left}%;top:${slot.top}%"><strong>${escapeHtml(position.id)}</strong><span>${escapeHtml(position.label)}</span></button>`;
    }).join('');

    const footOrder = ['LEFT', 'RIGHT'];
    const feet = footOrder.map(id => vm.feet.find(foot => foot.id === id)).map(foot => `<button type="button" class="stp-foot-option${foot.selected ? ' selected' : ''}" data-foot="${escapeHtml(foot.id)}" aria-pressed="${foot.selected ? 'true' : 'false'}"><span class="stp-foot-icon" aria-hidden="true">${foot.id === 'RIGHT' ? 'R' : 'L'}</span><strong>${escapeHtml(foot.label)}</strong></button>`).join('');

    return `
<section class="stp-creation-position" data-stp-step="positionAndFoot">
  <div class="stp-creation-material" aria-hidden="true"><i></i><b></b><em></em></div>

  <header class="stp-creation-top">
    <div class="stp-creation-brand"><span><strong>STP</strong> / Création</span><span>${String(vm.progress.current).padStart(2, '0')} / ${String(vm.progress.total).padStart(2, '0')}</span></div>
    <div class="stp-creation-progress"><i style="width:${vm.progress.ratio * 100}%"></i></div>
  </header>

  <section class="stp-position-heading">
    <div class="stp-creation-eyebrow">${escapeHtml(vm.copy.eyebrow)}</div>
    <h1>${escapeHtml(vm.copy.title)}</h1>
  </section>

  <section class="stp-position-pitch" aria-label="Choix du poste">
    <div class="stp-pitch-lines" aria-hidden="true"><i class="half"></i><i class="circle"></i><i class="box top"></i><i class="box bottom"></i></div>
    ${markers}
  </section>

  <section class="stp-foot-block">
    <div class="stp-foot-label">${escapeHtml(vm.copy.footLabel)}</div>
    <div class="stp-foot-options">${feet}</div>
  </section>

  <footer class="stp-creation-footer">
    <button type="button" class="stp-continue${readyClass}"${disabled}>${escapeHtml(vm.copy.continueLabel)}</button>
  </footer>
</section>`;
}

export const PLAYER_CREATION_POSITION_AND_FOOT_CSS = `
.stp-creation-position{position:relative;overflow:hidden;min-height:100%;background:linear-gradient(180deg,#0b0b0b 0%,#070707 52%,#050505 100%);color:#f7f7f4;display:flex;flex-direction:column;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.stp-creation-material{position:absolute;inset:0;pointer-events:none;overflow:hidden}.stp-creation-material:before,.stp-creation-material:after,.stp-creation-material i{content:"";position:absolute;height:1px;width:145%;left:-20%;transform:rotate(-28deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.024),transparent)}.stp-creation-material:before{top:20%}.stp-creation-material i{top:52%;background:linear-gradient(90deg,transparent,rgba(245,166,35,.035),transparent)}.stp-creation-material:after{top:78%}.stp-creation-material b{position:absolute;width:520px;height:520px;border-radius:50%;border:1px solid rgba(255,255,255,.018);left:-330px;top:190px}.stp-creation-material em{position:absolute;width:360px;height:360px;border-radius:50%;border:1px solid rgba(245,166,35,.022);right:-255px;bottom:20px}.stp-creation-top,.stp-position-heading,.stp-position-pitch,.stp-foot-block,.stp-creation-footer{position:relative;z-index:1}.stp-creation-top{padding:18px 22px 0}.stp-creation-brand{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:rgba(218,218,211,.58);font-weight:800}.stp-creation-brand strong{color:#f5a623}.stp-creation-progress{height:3px;background:rgba(255,255,255,.06);margin:18px -22px 0;position:relative}.stp-creation-progress i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#ff7a00,#f5a623)}.stp-position-heading{padding:22px 22px 12px}.stp-creation-eyebrow{color:#f5a623;font-size:12px;font-weight:850;letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px}.stp-position-heading h1{margin:0;font-size:32px;line-height:1.02;letter-spacing:-.045em}.stp-position-pitch{margin:8px 22px 0;height:430px;border:1px solid rgba(255,255,255,.11);border-radius:27px;background:linear-gradient(180deg,rgba(25,31,22,.44),rgba(10,13,9,.56));overflow:hidden}.stp-pitch-lines{position:absolute;inset:18px;border:1px solid rgba(255,255,255,.12);border-radius:2px}.stp-pitch-lines:before,.stp-pitch-lines:after{content:"";position:absolute;left:50%;width:30%;height:11%;transform:translateX(-50%);border:1px solid rgba(255,255,255,.11)}.stp-pitch-lines:before{top:0;border-top:0}.stp-pitch-lines:after{bottom:0;border-bottom:0}.stp-pitch-lines .half{position:absolute;left:0;right:0;top:50%;height:1px;background:rgba(255,255,255,.11)}.stp-pitch-lines .circle{position:absolute;left:50%;top:50%;width:62px;height:62px;border:1px solid rgba(255,255,255,.11);border-radius:50%;transform:translate(-50%,-50%)}.stp-position-marker{position:absolute;transform:translate(-50%,-50%);appearance:none;border:1px solid rgba(255,255,255,.13);background:rgba(6,7,6,.82);color:#bdbdb7;border-radius:14px;min-width:52px;height:43px;padding:5px 8px;font:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 5px 14px rgba(0,0,0,.2)}.stp-position-marker strong{font-size:12px;line-height:1}.stp-position-marker span{display:none}.stp-position-marker.selected{border-color:#f5a623;background:linear-gradient(180deg,rgba(245,166,35,.98),rgba(255,122,0,.94));color:#090909;min-width:68px;height:52px;box-shadow:0 7px 22px rgba(245,166,35,.18)}.stp-position-marker.selected strong{font-size:14px}.stp-position-marker.selected span{display:block;max-width:86px;margin-top:3px;font-size:8px;font-weight:800;white-space:nowrap}.stp-foot-block{margin:14px 22px 0}.stp-foot-label{font-size:11px;color:#bdbdb7;text-transform:uppercase;letter-spacing:.12em;font-weight:850;margin-bottom:8px}.stp-foot-options{display:grid;grid-template-columns:1fr 1fr;gap:10px}.stp-foot-option{height:58px;border-radius:17px;border:1px solid rgba(255,255,255,.08);background:rgba(10,10,10,.45);color:#999994;font:inherit;display:flex;align-items:center;justify-content:center;gap:9px;font-weight:850;cursor:pointer}.stp-foot-icon{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(255,255,255,.12);font-size:10px}.stp-foot-option.selected{border-color:rgba(245,166,35,.65);background:rgba(40,28,10,.55);color:#fff}.stp-foot-option.selected .stp-foot-icon{border-color:#f5a623;color:#f5a623}.stp-creation-footer{margin-top:auto;padding:14px 22px 22px}.stp-continue{width:100%;height:56px;border:0;border-radius:17px;font:inherit;font-size:15px;font-weight:900;background:#242424;color:#666}.stp-continue.ready{color:#0b0b0b;background:linear-gradient(90deg,#ff7a00,#f5a623);cursor:pointer}`;

export function mountPlayerCreationPositionAndFoot(container, initialState, { onChange, onContinue } = {}) {
    if (!container) throw new Error('Conteneur poste + pied fort requis.');
    let state = initialState;

    const render = () => {
        container.innerHTML = playerCreationPositionAndFootTemplate(state);
        container.querySelectorAll('[data-position]').forEach(button => button.addEventListener('click', () => {
            state = selectPosition(state, button.dataset.position);
            onChange?.(state);
            render();
        }));
        container.querySelectorAll('[data-foot]').forEach(button => button.addEventListener('click', () => {
            state = selectPreferredFoot(state, button.dataset.foot);
            onChange?.(state);
            render();
        }));
        container.querySelector('.stp-continue')?.addEventListener('click', () => {
            const result = continueFromPositionAndFoot(state);
            if (result.ok) {
                state = result.state;
                onContinue?.(result);
            }
        });
    };

    render();
    return Object.freeze({ getState: () => state, rerender: render });
}
