import {
    bodyViewModel,
    updateBodyField,
    continueFromBody
} from './playerCreationBodyStep.js';

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export function playerCreationBodyTemplate(state) {
    const vm = bodyViewModel(state);
    const readyClass = vm.canContinue ? ' ready' : '';
    const disabled = vm.canContinue ? '' : ' disabled';

    return `
<section class="stp-creation-body" data-stp-step="body">
  <div class="stp-creation-material" aria-hidden="true"><i></i><b></b><em></em></div>

  <header class="stp-creation-top">
    <div class="stp-creation-brand"><span><strong>STP</strong> / Création</span><span>03 / 06</span></div>
    <div class="stp-creation-progress"><i style="width:${vm.progress.ratio * 100}%"></i></div>
  </header>

  <section class="stp-creation-hero">
    <div class="stp-creation-eyebrow">${escapeHtml(vm.copy.eyebrow)}</div>
    <h1>Ton corps<br>à 14 ans.</h1>
    <p>${escapeHtml(vm.copy.description)}</p>
  </section>

  <section class="stp-body-stage">
    <div class="stp-body-age">14 ans</div>
    <div class="stp-body-silhouette" aria-hidden="true"><i class="head"></i><i class="neck"></i><i class="torso"></i><i class="arm left"></i><i class="arm right"></i><i class="leg left"></i><i class="leg right"></i></div>
  </section>

  <section class="stp-body-controls">
    <div class="stp-body-row">
      <div class="stp-body-rowhead"><label for="stp-height">Taille</label><strong>${vm.height.value}<span> ${vm.height.unit}</span></strong></div>
      <input id="stp-height" name="height" type="range" min="${vm.height.min}" max="${vm.height.max}" value="${vm.height.value}" />
      <div class="stp-body-scale"><span>${vm.height.min}</span><span>${vm.height.max} ${vm.height.unit}</span></div>
    </div>
    <div class="stp-body-row">
      <div class="stp-body-rowhead"><label for="stp-weight">Poids</label><strong>${vm.weight.value}<span> ${vm.weight.unit}</span></strong></div>
      <input id="stp-weight" name="weight" type="range" min="${vm.weight.min}" max="${vm.weight.max}" value="${vm.weight.value}" />
      <div class="stp-body-scale"><span>${vm.weight.min}</span><span>${vm.weight.max} ${vm.weight.unit}</span></div>
    </div>
  </section>

  <div class="stp-body-note">${escapeHtml(vm.copy.note)}</div>

  <footer class="stp-creation-footer">
    <button type="button" class="stp-continue${readyClass}"${disabled}>${escapeHtml(vm.copy.continueLabel)}</button>
  </footer>
</section>`;
}

export const PLAYER_CREATION_BODY_CSS = `
.stp-creation-body{position:relative;overflow:hidden;min-height:100%;background:linear-gradient(180deg,#0b0b0b 0%,#070707 52%,#050505 100%);color:#f7f7f4;display:flex;flex-direction:column;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.stp-creation-material{position:absolute;inset:0;pointer-events:none;overflow:hidden}.stp-creation-material:before,.stp-creation-material:after,.stp-creation-material i{content:"";position:absolute;height:1px;width:145%;left:-20%;transform:rotate(-28deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.024),transparent)}.stp-creation-material:before{top:20%}.stp-creation-material i{top:52%;background:linear-gradient(90deg,transparent,rgba(245,166,35,.035),transparent)}.stp-creation-material:after{top:78%}.stp-creation-material b{position:absolute;width:520px;height:520px;border-radius:50%;border:1px solid rgba(255,255,255,.018);left:-330px;top:190px}.stp-creation-material em{position:absolute;width:360px;height:360px;border-radius:50%;border:1px solid rgba(245,166,35,.022);right:-255px;bottom:20px}.stp-creation-top,.stp-creation-hero,.stp-body-stage,.stp-body-controls,.stp-body-note,.stp-creation-footer{position:relative;z-index:1}.stp-creation-top{padding:18px 22px 0}.stp-creation-brand{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:rgba(218,218,211,.58);font-weight:800}.stp-creation-brand strong{color:#f5a623}.stp-creation-progress{height:3px;background:rgba(255,255,255,.06);margin:18px -22px 0;position:relative}.stp-creation-progress i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#ff7a00,#f5a623)}.stp-creation-hero{padding:30px 22px 12px}.stp-creation-eyebrow{color:#f5a623;font-size:12px;font-weight:850;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px}.stp-creation-hero h1{margin:0;font-size:42px;line-height:.98;letter-spacing:-.055em}.stp-creation-hero p{margin:14px 0 0;color:rgba(210,210,203,.66);font-size:14px;line-height:1.55;max-width:350px}.stp-body-stage{margin:16px 22px;border:1px solid rgba(255,255,255,.08);border-radius:24px;min-height:235px;background:rgba(11,11,11,.42);display:flex;align-items:flex-end;justify-content:center;overflow:hidden;padding-bottom:20px}.stp-body-stage:before{content:"";position:absolute;left:24px;right:24px;bottom:19px;height:1px;background:rgba(255,255,255,.08)}.stp-body-age{position:absolute;top:14px;right:14px;font-size:11px;color:#f5a623;font-weight:850;letter-spacing:.08em;text-transform:uppercase}.stp-body-silhouette{position:relative;width:90px;height:190px;transform-origin:50% 100%}.stp-body-silhouette .head{position:absolute;left:50%;top:0;transform:translateX(-50%);width:42px;height:50px;background:#333;border-radius:48% 48% 44% 44%}.stp-body-silhouette .neck{position:absolute;left:50%;top:44px;transform:translateX(-50%);width:18px;height:18px;background:#303030;border-radius:4px}.stp-body-silhouette .torso{position:absolute;left:50%;top:57px;transform:translateX(-50%);width:58px;height:76px;background:linear-gradient(180deg,#292929,#222);clip-path:polygon(18% 0,82% 0,100% 100%,0 100%)}.stp-body-silhouette .arm{position:absolute;top:62px;width:17px;height:82px;background:#292929;border-radius:10px;transform-origin:50% 0}.stp-body-silhouette .arm.left{left:10px;transform:rotate(6deg)}.stp-body-silhouette .arm.right{right:10px;transform:rotate(-6deg)}.stp-body-silhouette .leg{position:absolute;top:126px;width:24px;height:64px;background:#272727;border-radius:8px 8px 10px 10px}.stp-body-silhouette .leg.left{left:21px}.stp-body-silhouette .leg.right{right:21px}.stp-body-controls{margin:0 22px;border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:18px;background:rgba(10,10,10,.40)}.stp-body-row{margin-bottom:20px}.stp-body-row:last-child{margin-bottom:0}.stp-body-rowhead{display:flex;justify-content:space-between;align-items:end;margin-bottom:10px}.stp-body-rowhead label{font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#cfcfc7;font-weight:850}.stp-body-rowhead strong{font-size:22px;font-weight:900;letter-spacing:-.03em}.stp-body-rowhead strong span{font-size:12px;color:#85857f;font-weight:700}.stp-body-row input[type=range]{width:100%;accent-color:#f5a623;height:28px}.stp-body-scale{display:flex;justify-content:space-between;color:#5e5e59;font-size:10px;margin-top:-4px}.stp-body-note{padding:13px 22px 0;color:#62625d;font-size:11px;line-height:1.45}.stp-creation-footer{margin-top:auto;padding:18px 22px 22px}.stp-continue{width:100%;height:58px;border:0;border-radius:17px;font:inherit;font-size:15px;font-weight:900;background:#242424;color:#666}.stp-continue.ready{color:#0b0b0b;background:linear-gradient(90deg,#ff7a00,#f5a623);cursor:pointer}`;

export function mountPlayerCreationBody(container, initialState, { onChange, onContinue } = {}) {
    if (!container) throw new Error('Conteneur gabarit requis.');
    let state = initialState;

    const render = () => {
        container.innerHTML = playerCreationBodyTemplate(state);
        const height = container.querySelector('[name="height"]');
        const weight = container.querySelector('[name="weight"]');
        const continueButton = container.querySelector('.stp-continue');

        const update = (field, value) => {
            state = updateBodyField(state, field, value);
            onChange?.(state);
            render();
        };

        height?.addEventListener('input', event => update('height', event.target.value));
        weight?.addEventListener('input', event => update('weight', event.target.value));
        continueButton?.addEventListener('click', () => {
            const result = continueFromBody(state);
            if (result.ok) {
                state = result.state;
                onContinue?.(result);
            }
        });
    };

    render();
    return Object.freeze({ getState: () => state, rerender: render });
}
