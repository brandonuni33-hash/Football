import {
    appearanceViewModel,
    selectAppearanceFace,
    continueFromAppearance
} from './playerCreationAppearanceStep.js';

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export function playerCreationAppearanceTemplate(state) {
    const vm = appearanceViewModel(state);
    const readyClass = vm.canContinue ? ' ready' : '';
    const disabled = vm.canContinue ? '' : ' disabled';

    const faces = vm.faces.map((face, index) => `
      <button type="button" class="stp-face-option${face.selected ? ' selected' : ''}" data-face-id="${escapeHtml(face.id)}" aria-pressed="${face.selected ? 'true' : 'false'}">
        <span class="stp-face-art face-${index + 1}" aria-hidden="true"><i></i></span>
        <span>${escapeHtml(face.label)}</span>
      </button>`).join('');

    return `
<section class="stp-creation-appearance" data-stp-step="appearance">
  <div class="stp-creation-material" aria-hidden="true"><i></i><b></b><em></em></div>

  <header class="stp-creation-top">
    <div class="stp-creation-brand"><span><strong>STP</strong> / Création</span><span>02 / 06</span></div>
    <div class="stp-creation-progress"><i style="width:${vm.progress.ratio * 100}%"></i></div>
  </header>

  <section class="stp-creation-hero">
    <div class="stp-creation-eyebrow">${escapeHtml(vm.copy.eyebrow)}</div>
    <h1>${escapeHtml(vm.copy.title)}</h1>
  </section>

  <section class="stp-face-grid" aria-label="Choix du visage">
    ${faces}
  </section>

  <footer class="stp-creation-footer">
    <button type="button" class="stp-continue${readyClass}"${disabled}>${escapeHtml(vm.copy.continueLabel)}</button>
  </footer>
</section>`;
}

export const PLAYER_CREATION_APPEARANCE_CSS = `
.stp-creation-appearance{position:relative;overflow:hidden;min-height:100%;background:linear-gradient(180deg,#0b0b0b 0%,#070707 52%,#050505 100%);color:#f7f7f4;display:flex;flex-direction:column;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.stp-creation-material{position:absolute;inset:0;pointer-events:none;overflow:hidden}.stp-creation-material:before,.stp-creation-material:after,.stp-creation-material i{content:"";position:absolute;height:1px;width:145%;left:-20%;transform:rotate(-28deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.024),transparent)}.stp-creation-material:before{top:20%}.stp-creation-material i{top:52%;background:linear-gradient(90deg,transparent,rgba(245,166,35,.035),transparent)}.stp-creation-material:after{top:78%}.stp-creation-material b{position:absolute;width:520px;height:520px;border-radius:50%;border:1px solid rgba(255,255,255,.018);left:-330px;top:190px}.stp-creation-material em{position:absolute;width:360px;height:360px;border-radius:50%;border:1px solid rgba(245,166,35,.022);right:-255px;bottom:20px}.stp-creation-top,.stp-creation-hero,.stp-face-grid,.stp-creation-footer{position:relative;z-index:1}.stp-creation-top{padding:18px 22px 0}.stp-creation-brand{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:rgba(218,218,211,.58);font-weight:800}.stp-creation-brand strong{color:#f5a623}.stp-creation-progress{height:3px;background:rgba(255,255,255,.06);margin:18px -22px 0;position:relative}.stp-creation-progress i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#ff7a00,#f5a623)}.stp-creation-hero{padding:34px 22px 12px}.stp-creation-eyebrow{color:#f5a623;font-size:12px;font-weight:850;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px}.stp-creation-hero h1{margin:0;font-size:38px;line-height:1;letter-spacing:-.045em}.stp-face-grid{padding:18px 22px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.stp-face-option{appearance:none;border:1px solid rgba(255,255,255,.08);background:rgba(12,12,12,.46);color:rgba(235,235,229,.66);border-radius:18px;padding:9px 8px 10px;font:inherit;font-size:11px;font-weight:800;cursor:pointer}.stp-face-option.selected{border-color:rgba(245,166,35,.74);background:rgba(36,25,10,.54);color:#f7f7f3;box-shadow:0 0 0 2px rgba(245,166,35,.08) inset}.stp-face-art{display:block;position:relative;height:110px;border-radius:13px;overflow:hidden;margin-bottom:8px;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.015))}.stp-face-art:before{content:"";position:absolute;width:58px;height:72px;border-radius:48% 48% 44% 44%;left:50%;top:19px;transform:translateX(-50%);background:rgba(205,205,199,.34);box-shadow:0 -10px 0 rgba(17,17,17,.82) inset}.stp-face-art:after{content:"";position:absolute;width:77px;height:40px;border-radius:50% 50% 0 0;left:50%;bottom:-15px;transform:translateX(-50%);background:rgba(205,205,199,.21)}.stp-face-art i:before,.stp-face-art i:after{content:"";position:absolute;z-index:2;width:6px;height:3px;border-radius:50%;top:51px;background:rgba(10,10,10,.72)}.stp-face-art i:before{left:calc(50% - 18px)}.stp-face-art i:after{right:calc(50% - 18px)}.face-2:before{width:61px;border-radius:42% 42% 48% 48%}.face-3:before{width:55px;height:75px}.face-4:before{width:63px;height:69px;border-radius:46% 46% 38% 38%}.face-5:before{width:57px;height:73px;border-radius:40% 40% 50% 50%}.face-6:before{width:60px;height:71px}.stp-creation-footer{margin-top:auto;padding:16px 22px 22px}.stp-continue{width:100%;height:58px;border:0;border-radius:17px;font:inherit;font-size:15px;font-weight:900;background:#242424;color:#666}.stp-continue.ready{color:#0b0b0b;background:linear-gradient(90deg,#ff7a00,#f5a623);cursor:pointer}`;

export function mountPlayerCreationAppearance(container, initialState, { onChange, onContinue } = {}) {
    if (!container) throw new Error('Conteneur visage requis.');
    let state = initialState;

    const render = () => {
        container.innerHTML = playerCreationAppearanceTemplate(state);
        const faceButtons = container.querySelectorAll('[data-face-id]');
        const continueButton = container.querySelector('.stp-continue');

        faceButtons.forEach(button => button.addEventListener('click', () => {
            state = selectAppearanceFace(state, button.dataset.faceId);
            onChange?.(state);
            render();
        }));

        continueButton?.addEventListener('click', () => {
            const result = continueFromAppearance(state);
            if (result.ok) {
                state = result.state;
                onContinue?.(result);
            }
        });
    };

    render();
    return Object.freeze({ getState: () => state, rerender: render });
}
