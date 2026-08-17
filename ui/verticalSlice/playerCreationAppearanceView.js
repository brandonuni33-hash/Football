import {
    appearanceViewModel,
    selectAppearanceFace,
    updateAppearanceBodyField,
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
    const silhouetteStyle = [
        `--height-scale:${vm.silhouette.heightScale}`,
        `--torso-width:${vm.silhouette.torsoWidth}px`,
        `--arm-width:${vm.silhouette.armWidth}px`,
        `--leg-width:${vm.silhouette.legWidth}px`
    ].join(';');

    const faces = vm.faces.map((face, index) => `
      <button type="button" class="stp-face-option${face.selected ? ' selected' : ''}" data-face-id="${escapeHtml(face.id)}" aria-pressed="${face.selected ? 'true' : 'false'}">
        <span class="stp-face-art face-${index + 1}" aria-hidden="true"><i></i></span>
        <span>${escapeHtml(face.label)}</span>
      </button>`).join('');

    return `
<section class="stp-creation-appearance" data-stp-step="appearance">
  <div class="stp-creation-material" aria-hidden="true"><i></i><b></b><em></em></div>

  <header class="stp-creation-top">
    <div class="stp-creation-brand"><span><strong>STP</strong> / Création</span><span>02 / 05</span></div>
    <div class="stp-creation-progress"><i style="width:${vm.progress.ratio * 100}%"></i></div>
  </header>

  <section class="stp-creation-hero">
    <div class="stp-creation-eyebrow">${escapeHtml(vm.copy.eyebrow)}</div>
    <h1>${escapeHtml(vm.copy.title)}</h1>
    <p>${escapeHtml(vm.copy.description)}</p>
  </section>

  <section class="stp-customization-panel">
    <div class="stp-customization-title"><span>Tête</span><small>Visage aujourd’hui · coiffure, peau et détails ici ensuite</small></div>
    <div class="stp-face-grid" aria-label="Choix du visage">
      ${faces}
    </div>

    <div class="stp-customization-separator"></div>

    <div class="stp-customization-title"><span>Corps</span><small>Point de départ à 14 ans</small></div>
    <div class="stp-body-stage">
      <div class="stp-body-age">14 ans</div>
      <div class="stp-body-silhouette" style="${silhouetteStyle}" aria-hidden="true">
        <i class="head"></i><i class="neck"></i><i class="torso"></i>
        <i class="arm left"></i><i class="arm right"></i>
        <i class="leg left"></i><i class="leg right"></i>
      </div>
    </div>

    <div class="stp-body-controls">
      <div class="stp-body-row">
        <div class="stp-body-rowhead"><label for="stp-height">Taille</label><strong data-body-value="height">${vm.height.value}<span> ${vm.height.unit}</span></strong></div>
        <input id="stp-height" name="height" type="range" min="${vm.height.min}" max="${vm.height.max}" value="${vm.height.value}" />
        <div class="stp-body-scale"><span>${vm.height.min}</span><span>${vm.height.max}</span></div>
      </div>
      <div class="stp-body-row">
        <div class="stp-body-rowhead"><label for="stp-weight">Poids</label><strong data-body-value="weight">${vm.weight.value}<span> ${vm.weight.unit}</span></strong></div>
        <input id="stp-weight" name="weight" type="range" min="${vm.weight.min}" max="${vm.weight.max}" value="${vm.weight.value}" />
        <div class="stp-body-scale"><span>${vm.weight.min}</span><span>${vm.weight.max}</span></div>
      </div>
    </div>
    <div class="stp-body-note">${escapeHtml(vm.copy.bodyNote)}</div>
  </section>

  <footer class="stp-creation-footer">
    <button type="button" class="stp-continue${readyClass}"${disabled}>${escapeHtml(vm.copy.continueLabel)}</button>
  </footer>
</section>`;
}

export const PLAYER_CREATION_APPEARANCE_CSS = `
.stp-creation-appearance{position:relative;overflow:hidden;min-height:100%;background:linear-gradient(180deg,#0b0b0b 0%,#070707 52%,#050505 100%);color:#f7f7f4;display:flex;flex-direction:column;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.stp-creation-material{position:absolute;inset:0;pointer-events:none;overflow:hidden}.stp-creation-material:before,.stp-creation-material:after,.stp-creation-material i{content:"";position:absolute;height:1px;width:145%;left:-20%;transform:rotate(-28deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.024),transparent)}.stp-creation-material:before{top:20%}.stp-creation-material i{top:52%;background:linear-gradient(90deg,transparent,rgba(245,166,35,.035),transparent)}.stp-creation-material:after{top:78%}.stp-creation-material b{position:absolute;width:520px;height:520px;border-radius:50%;border:1px solid rgba(255,255,255,.018);left:-330px;top:190px}.stp-creation-material em{position:absolute;width:360px;height:360px;border-radius:50%;border:1px solid rgba(245,166,35,.022);right:-255px;bottom:20px}.stp-creation-top,.stp-creation-hero,.stp-customization-panel,.stp-creation-footer{position:relative;z-index:1}.stp-creation-top{padding:18px 22px 0}.stp-creation-brand{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:rgba(218,218,211,.58);font-weight:800}.stp-creation-brand strong{color:#f5a623}.stp-creation-progress{height:3px;background:rgba(255,255,255,.06);margin:18px -22px 0;position:relative}.stp-creation-progress i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#ff7a00,#f5a623)}.stp-creation-hero{padding:30px 22px 12px}.stp-creation-eyebrow{color:#f5a623;font-size:12px;font-weight:850;letter-spacing:.12em;text-transform:uppercase;margin-bottom:9px}.stp-creation-hero h1{margin:0;font-size:38px;line-height:1;letter-spacing:-.045em}.stp-creation-hero p{margin:12px 0 0;color:rgba(154,154,149,.78);font-size:13px;line-height:1.5}.stp-customization-panel{margin:10px 22px 0;border:1px solid rgba(255,255,255,.08);border-radius:26px;overflow:hidden;background:rgba(9,9,9,.42)}.stp-customization-title{padding:16px 16px 8px;display:flex;align-items:baseline;justify-content:space-between;gap:12px}.stp-customization-title>span{font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#f5a623;font-weight:900}.stp-customization-title small{font-size:9px;color:#686862;text-align:right;line-height:1.35}.stp-face-grid{padding:8px 14px 16px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.stp-face-option{appearance:none;border:1px solid rgba(255,255,255,.08);background:rgba(12,12,12,.46);color:rgba(235,235,229,.66);border-radius:16px;padding:7px 6px 8px;font:inherit;font-size:10px;font-weight:800;cursor:pointer}.stp-face-option.selected{border-color:rgba(245,166,35,.74);background:rgba(36,25,10,.54);color:#f7f7f3;box-shadow:0 0 0 2px rgba(245,166,35,.08) inset}.stp-face-art{display:block;position:relative;height:78px;border-radius:11px;overflow:hidden;margin-bottom:6px;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.015))}.stp-face-art:before{content:"";position:absolute;width:46px;height:57px;border-radius:48% 48% 44% 44%;left:50%;top:12px;transform:translateX(-50%);background:rgba(205,205,199,.34);box-shadow:0 -8px 0 rgba(17,17,17,.82) inset}.stp-face-art:after{content:"";position:absolute;width:61px;height:32px;border-radius:50% 50% 0 0;left:50%;bottom:-13px;transform:translateX(-50%);background:rgba(205,205,199,.21)}.stp-face-art i:before,.stp-face-art i:after{content:"";position:absolute;z-index:2;width:5px;height:3px;border-radius:50%;top:38px;background:rgba(10,10,10,.72)}.stp-face-art i:before{left:calc(50% - 14px)}.stp-face-art i:after{right:calc(50% - 14px)}.face-2:before{width:49px;border-radius:42% 42% 48% 48%}.face-3:before{width:44px;height:60px}.face-4:before{width:50px;height:55px;border-radius:46% 46% 38% 38%}.face-5:before{width:46px;height:58px;border-radius:40% 40% 50% 50%}.face-6:before{width:48px;height:57px}.stp-customization-separator{height:1px;background:rgba(255,255,255,.07);margin:0 14px}.stp-body-stage{position:relative;min-height:300px;display:flex;align-items:flex-end;justify-content:center;padding:8px 20px 14px;overflow:hidden}.stp-body-stage:before{content:"";position:absolute;left:38px;right:38px;bottom:12px;height:1px;background:rgba(255,255,255,.08)}.stp-body-age{position:absolute;top:8px;right:16px;font-size:10px;color:#f5a623;font-weight:850;letter-spacing:.08em;text-transform:uppercase}.stp-body-silhouette{position:relative;width:150px;height:280px;transform-origin:50% 100%;transform:scaleY(var(--height-scale));transition:transform .12s ease}.stp-body-silhouette .head{position:absolute;left:50%;top:0;transform:translateX(-50%);width:47px;height:53px;background:#373737;border-radius:48% 48% 44% 44%}.stp-body-silhouette .neck{position:absolute;left:50%;top:47px;transform:translateX(-50%);width:19px;height:21px;background:#323232;border-radius:5px}.stp-body-silhouette .torso{position:absolute;left:50%;top:64px;transform:translateX(-50%);width:var(--torso-width);height:111px;background:linear-gradient(180deg,#2d2d2d,#242424);clip-path:polygon(14% 0,86% 0,100% 100%,0 100%);transition:width .12s ease}.stp-body-silhouette .arm{position:absolute;top:69px;width:var(--arm-width);height:119px;background:#2b2b2b;border-radius:12px;transform-origin:50% 0;transition:width .12s ease}.stp-body-silhouette .arm.left{left:28px;transform:rotate(5deg)}.stp-body-silhouette .arm.right{right:28px;transform:rotate(-5deg)}.stp-body-silhouette .leg{position:absolute;top:170px;width:var(--leg-width);height:110px;background:#282828;border-radius:10px 10px 12px 12px;transition:width .12s ease}.stp-body-silhouette .leg.left{left:43px}.stp-body-silhouette .leg.right{right:43px}.stp-body-controls{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:12px 16px 10px;border-top:1px solid rgba(255,255,255,.07);background:rgba(5,5,5,.32)}.stp-body-row{min-width:0}.stp-body-rowhead{display:flex;justify-content:space-between;align-items:end;gap:6px;margin-bottom:4px}.stp-body-rowhead label{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#cfcfc7;font-weight:850}.stp-body-rowhead strong{font-size:17px;font-weight:900;letter-spacing:-.03em;white-space:nowrap}.stp-body-rowhead strong span{font-size:9px;color:#85857f;font-weight:700}.stp-body-row input[type=range]{width:100%;accent-color:#f5a623;height:22px;margin:0}.stp-body-scale{display:flex;justify-content:space-between;color:#555550;font-size:9px;margin-top:-2px}.stp-body-note{padding:3px 18px 14px;color:#62625d;font-size:9px;line-height:1.4;text-align:center}.stp-creation-footer{margin-top:auto;padding:14px 22px 22px}.stp-continue{width:100%;height:56px;border:0;border-radius:17px;font:inherit;font-size:15px;font-weight:900;background:#242424;color:#666}.stp-continue.ready{color:#0b0b0b;background:linear-gradient(90deg,#ff7a00,#f5a623);cursor:pointer}`;

export function mountPlayerCreationAppearance(container, initialState, { onChange, onContinue } = {}) {
    if (!container) throw new Error('Conteneur apparence requis.');
    let state = initialState;

    container.innerHTML = playerCreationAppearanceTemplate(state);
    const faceButtons = [...container.querySelectorAll('[data-face-id]')];
    const height = container.querySelector('[name="height"]');
    const weight = container.querySelector('[name="weight"]');
    const heightValue = container.querySelector('[data-body-value="height"]');
    const weightValue = container.querySelector('[data-body-value="weight"]');
    const silhouette = container.querySelector('.stp-body-silhouette');
    const continueButton = container.querySelector('.stp-continue');

    const sync = () => {
        const vm = appearanceViewModel(state);
        faceButtons.forEach(button => {
            const selected = button.dataset.faceId === vm.selectedFaceId;
            button.classList.toggle('selected', selected);
            button.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });
        if (heightValue) heightValue.innerHTML = `${vm.height.value}<span> ${vm.height.unit}</span>`;
        if (weightValue) weightValue.innerHTML = `${vm.weight.value}<span> ${vm.weight.unit}</span>`;
        if (silhouette) {
            silhouette.style.setProperty('--height-scale', vm.silhouette.heightScale);
            silhouette.style.setProperty('--torso-width', `${vm.silhouette.torsoWidth}px`);
            silhouette.style.setProperty('--arm-width', `${vm.silhouette.armWidth}px`);
            silhouette.style.setProperty('--leg-width', `${vm.silhouette.legWidth}px`);
        }
        if (continueButton) {
            continueButton.disabled = !vm.canContinue;
            continueButton.classList.toggle('ready', vm.canContinue);
        }
    };

    faceButtons.forEach(button => button.addEventListener('click', () => {
        state = selectAppearanceFace(state, button.dataset.faceId);
        onChange?.(state);
        sync();
    }));

    height?.addEventListener('input', event => {
        state = updateAppearanceBodyField(state, 'height', event.target.value);
        onChange?.(state);
        sync();
    });
    weight?.addEventListener('input', event => {
        state = updateAppearanceBodyField(state, 'weight', event.target.value);
        onChange?.(state);
        sync();
    });

    continueButton?.addEventListener('click', () => {
        const result = continueFromAppearance(state);
        if (result.ok) {
            state = result.state;
            onContinue?.(result);
        }
    });

    return Object.freeze({ getState: () => state, rerender: sync });
}
