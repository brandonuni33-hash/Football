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
    <div class="stp-creation-brand"><span><strong>STP</strong> / Création</span><span>01 / 06</span></div>
    <div class="stp-creation-progress"><i style="width:${vm.progress.ratio * 100}%"></i></div>
  </header>

  <section class="stp-creation-hero">
    <div class="stp-creation-eyebrow">${escapeHtml(vm.copy.eyebrow)}</div>
    <h1>Comment<br>tu t’appelles&nbsp;?</h1>
    <p>${escapeHtml(vm.copy.description)}</p>
  </section>

  <section class="stp-identity-card">
    <div class="stp-field">
      <div class="stp-label-row"><label for="stp-firstname">Prénom</label><span>${vm.firstname.count} / ${vm.firstname.maxLength}</span></div>
      <input id="stp-firstname" name="firstname" maxlength="${vm.firstname.maxLength}" autocomplete="given-name" value="${escapeHtml(vm.firstname.value)}" placeholder="Ex. Elias" />
    </div>
    <div class="stp-field">
      <div class="stp-label-row"><label for="stp-lastname">Nom</label><span>${vm.lastname.count} / ${vm.lastname.maxLength}</span></div>
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
.stp-creation-identity{min-height:100%;background:radial-gradient(circle at 85% 4%,rgba(245,166,35,.13),transparent 28%),linear-gradient(180deg,#0b0b0b 0%,#070707 100%);color:#f7f7f4;display:flex;flex-direction:column;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.stp-creation-top{padding:18px 22px 0}.stp-creation-brand{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#c4c4bd;font-weight:800}.stp-creation-brand strong{color:#f5a623}.stp-creation-progress{height:3px;background:#222;margin:18px -22px 0;position:relative}.stp-creation-progress i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#ff7a00,#f5a623)}.stp-creation-hero{padding:38px 22px 18px}.stp-creation-eyebrow{color:#f5a623;font-size:12px;font-weight:850;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px}.stp-creation-hero h1{margin:0;font-size:45px;line-height:.98;letter-spacing:-.055em}.stp-creation-hero p{margin:18px 0 0;color:#9a9a95;font-size:15px;line-height:1.55}.stp-identity-card{margin:20px 22px 0;border:1px solid #272727;background:linear-gradient(180deg,rgba(21,21,21,.96),rgba(12,12,12,.98));border-radius:24px;padding:20px}.stp-field{margin-bottom:18px}.stp-field:last-child{margin-bottom:0}.stp-label-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}.stp-label-row label{font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#cfcfc7;font-weight:800}.stp-label-row span{font-size:11px;color:#666}.stp-field input{box-sizing:border-box;width:100%;height:58px;border-radius:15px;border:1px solid #303030;background:#0b0b0b;color:white;font:inherit;font-size:17px;padding:0 16px;outline:none}.stp-field input:focus{border-color:#835818;background:#0e0d0b;box-shadow:0 0 0 3px rgba(245,166,35,.08)}.stp-identity-preview{margin:18px 22px 0;display:flex;align-items:center;gap:14px;padding:15px 16px;border-top:1px solid #1d1d1d;border-bottom:1px solid #1d1d1d}.stp-identity-avatar{width:50px;height:50px;border-radius:50%;border:1px solid #3a3a3a;background:#111}.stp-identity-preview small{font-size:11px;color:#6e6e69;text-transform:uppercase;letter-spacing:.1em;font-weight:800}.stp-identity-name{margin-top:4px;font-size:17px;font-weight:780}.stp-creation-footer{margin-top:auto;padding:18px 22px 22px}.stp-continue{width:100%;height:58px;border:0;border-radius:17px;font:inherit;font-size:15px;font-weight:900;background:#242424;color:#666}.stp-continue.ready{color:#0b0b0b;background:linear-gradient(90deg,#ff7a00,#f5a623);cursor:pointer}.stp-age-note{margin-top:12px;text-align:center;font-size:11px;color:#5e5e58}`;

export function mountPlayerCreationIdentity(container, initialState, { onChange, onContinue } = {}) {
    if (!container) throw new Error('Conteneur identité requis.');
    let state = initialState;

    const render = () => {
        container.innerHTML = playerCreationIdentityTemplate(state);
        const firstname = container.querySelector('[name="firstname"]');
        const lastname = container.querySelector('[name="lastname"]');
        const continueButton = container.querySelector('.stp-continue');

        const update = (field, value) => {
            state = updateIdentityField(state, field, value);
            onChange?.(state);
            render();
            const nextInput = container.querySelector(`[name="${field}"]`);
            nextInput?.focus();
            if (nextInput) nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
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
    };

    render();
    return Object.freeze({ getState: () => state, rerender: render });
}
