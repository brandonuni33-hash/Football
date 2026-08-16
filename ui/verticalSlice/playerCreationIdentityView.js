import {
    identityViewModel,
    updateIdentityField,
    continueFromIdentity
} from './playerCreationIdentityStep.js';

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export function playerCreationIdentityTemplate(state) {
    const vm = identityViewModel(state);
    const readyClass = vm.canContinue ? ' ready' : '';
    const disabled = vm.canContinue ? '' : ' disabled';

    return `
<section class="stp-creation-identity" data-stp-step="identity">
  <header class="stp-creation-top">
    <div class="stp-creation-brand"><span><strong>STP</strong> / Création</span><span>01 / 05</span></div>
    <div class="stp-creation-progress"><i style="width:${vm.progress.ratio * 100}%"></i></div>
  </header>

  <section class="stp-creation-hero">
    <div class="stp-creation-eyebrow">${escapeHtml(vm.copy.eyebrow)}</div>
    <h1>Comment<br>tu t’appelles&nbsp;?</h1>
    <p>${escapeHtml(vm.copy.description)}</p>
  </section>

  <section class="stp-identity-card">
    <div class="stp-field">
      <div class="stp-label-row"><label for="stp-firstname">Prénom</label><span data-count="firstname">${vm.firstname.count} / ${vm.firstname.maxLength}</span></div>
      <input id="stp-firstname" name="firstname" maxlength="${vm.firstname.maxLength}" autocomplete="given-name" value="${escapeHtml(vm.firstname.value)}" placeholder="Ex. Elias" />
    </div>
    <div class="stp-field">
      <div class="stp-label-row"><label for="stp-lastname">Nom</label><span data-count="lastname">${vm.lastname.count} / ${vm.lastname.maxLength}</span></div>
      <input id="stp-lastname" name="lastname" maxlength="${vm.lastname.maxLength}" autocomplete="family-name" value="${escapeHtml(vm.lastname.value)}" placeholder="Ex. Morel" />
    </div>
  </section>

  <section class="stp-identity-preview">
    <div class="stp-identity-avatar" aria-hidden="true"></div>
    <div><small>Identité joueur</small><div class="stp-identity-name">${escapeHtml(vm.previewName)}</div></div>
  </section>

  <footer class="stp-creation-footer">
    <button type="button" class="stp-continue${readyClass}"${disabled}>${escapeHtml(vm.copy.continueLabel)}</button>
    <div class="stp-age-note">${escapeHtml(vm.copy.ageLabel)}</div>
  </footer>
</section>`;
}

export const PLAYER_CREATION_IDENTITY_CSS = `
.stp-creation-identity{position:relative;overflow:hidden;min-height:100%;background:linear-gradient(180deg,#0b0b0b 0%,#070707 52%,#050505 100%);color:#f7f7f4;display:flex;flex-direction:column;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.stp-creation-identity:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(118deg,transparent 0 24%,rgba(255,255,255,.018) 24.2% 24.5%,transparent 24.7% 100%),linear-gradient(118deg,transparent 0 53%,rgba(245,166,35,.026) 53.2% 53.5%,transparent 53.7% 100%),linear-gradient(118deg,transparent 0 79%,rgba(255,255,255,.012) 79.2% 79.45%,transparent 79.7% 100%)}.stp-creation-identity:after{content:"";position:absolute;width:520px;height:520px;border:1px solid rgba(255,255,255,.022);border-radius:50%;left:-310px;top:190px;pointer-events:none}.stp-creation-top,.stp-creation-hero,.stp-identity-card,.stp-identity-preview,.stp-creation-footer{position:relative;z-index:1}.stp-creation-top{padding:18px 22px 0}.stp-creation-brand{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:rgba(196,196,189,.62);font-weight:800}.stp-creation-brand strong{color:#f5a623}.stp-creation-progress{height:3px;background:rgba(255,255,255,.06);margin:18px -22px 0;position:relative}.stp-creation-progress i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#ff7a00,#f5a623)}.stp-creation-hero{padding:38px 22px 18px}.stp-creation-eyebrow{color:#f5a623;font-size:12px;font-weight:850;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px}.stp-creation-hero h1{margin:0;font-size:45px;line-height:.98;letter-spacing:-.055em}.stp-creation-hero p{margin:18px 0 0;color:rgba(154,154,149,.78);font-size:15px;line-height:1.55}.stp-identity-card{margin:20px 22px 0;border:1px solid rgba(255,255,255,.08);background:rgba(12,12,12,.46);border-radius:24px;padding:20px}.stp-field{margin-bottom:18px}.stp-field:last-child{margin-bottom:0}.stp-label-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}.stp-label-row label{font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:rgba(207,207,199,.86);font-weight:800}.stp-label-row span{font-size:11px;color:rgba(150,150,145,.58)}.stp-field input{box-sizing:border-box;width:100%;height:58px;border-radius:15px;border:1px solid rgba(255,255,255,.09);background:rgba(7,7,7,.42);color:white;font:inherit;font-size:17px;padding:0 16px;outline:none}.stp-field input:focus{border-color:#835818;background:rgba(14,13,11,.68);box-shadow:0 0 0 3px rgba(245,166,35,.08)}.stp-identity-preview{margin:18px 22px 0;display:flex;align-items:center;gap:14px;padding:15px 16px;border-top:1px solid rgba(255,255,255,.07);border-bottom:1px solid rgba(255,255,255,.07);background:rgba(5,5,5,.14)}.stp-identity-avatar{width:50px;height:50px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:rgba(17,17,17,.56)}.stp-identity-preview small{font-size:11px;color:rgba(150,150,144,.58);text-transform:uppercase;letter-spacing:.1em;font-weight:800}.stp-identity-name{margin-top:4px;font-size:17px;font-weight:780}.stp-creation-footer{margin-top:auto;padding:18px 22px 22px}.stp-continue{width:100%;height:58px;border:0;border-radius:17px;font:inherit;font-size:15px;font-weight:900;background:#242424;color:#666}.stp-continue.ready{color:#0b0b0b;background:linear-gradient(90deg,#ff7a00,#f5a623);cursor:pointer}.stp-age-note{margin-top:12px;text-align:center;font-size:11px;color:#5e5e58}`;

export function mountPlayerCreationIdentity(container, initialState, { onChange, onContinue } = {}) {
    if (!container) throw new Error('Conteneur identité requis.');
    let state = initialState;

    container.innerHTML = playerCreationIdentityTemplate(state);
    const firstname = container.querySelector('[name="firstname"]');
    const lastname = container.querySelector('[name="lastname"]');
    const firstnameCount = container.querySelector('[data-count="firstname"]');
    const lastnameCount = container.querySelector('[data-count="lastname"]');
    const previewName = container.querySelector('.stp-identity-name');
    const continueButton = container.querySelector('.stp-continue');

    const syncLiveUi = () => {
        const vm = identityViewModel(state);
        if (firstnameCount) firstnameCount.textContent = `${vm.firstname.count} / ${vm.firstname.maxLength}`;
        if (lastnameCount) lastnameCount.textContent = `${vm.lastname.count} / ${vm.lastname.maxLength}`;
        if (previewName) previewName.textContent = vm.previewName;
        if (continueButton) {
            continueButton.disabled = !vm.canContinue;
            continueButton.classList.toggle('ready', vm.canContinue);
        }
    };

    const update = (field, value) => {
        state = updateIdentityField(state, field, value);
        onChange?.(state);
        syncLiveUi();
    };

    firstname?.addEventListener('input', event => update('firstname', event.target.value));
    lastname?.addEventListener('input', event => update('lastname', event.target.value));
    continueButton?.addEventListener('click', () => {
        const result = continueFromIdentity(state);
        if (result.ok) {
            state = result.state;
            onContinue?.(result);
        }
    });

    return Object.freeze({ getState: () => state, rerender: syncLiveUi });
}
