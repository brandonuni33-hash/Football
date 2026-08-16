import {
    nationalitiesViewModel,
    setPrimaryNationality,
    setSecondaryNationality,
    continueFromNationalities
} from './playerCreationNationalitiesStep.js';
import { flagForCountry } from '../../domain/world/countryCatalog.js';

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function optionsHtml(options, selected, { includeEmpty = false } = {}) {
    const empty = includeEmpty ? '<option value="">Aucune</option>' : '<option value="">Choisir</option>';
    return empty + options.map(country => `<option value="${escapeHtml(country)}"${country === selected ? ' selected' : ''}>${flagForCountry(country)} ${escapeHtml(country)}</option>`).join('');
}

export function playerCreationNationalitiesTemplate(state) {
    const vm = nationalitiesViewModel(state);
    const readyClass = vm.canContinue ? ' ready' : '';
    const disabled = vm.canContinue ? '' : ' disabled';

    return `
<section class="stp-creation-nationalities" data-stp-step="nationalities">
  <div class="stp-creation-material" aria-hidden="true"><i></i><b></b><em></em></div>

  <header class="stp-creation-top">
    <div class="stp-creation-brand"><span><strong>STP</strong> / Création</span><span>05 / 06</span></div>
    <div class="stp-creation-progress"><i style="width:${vm.progress.ratio * 100}%"></i></div>
  </header>

  <section class="stp-nationality-heading">
    <div class="stp-creation-eyebrow">${escapeHtml(vm.copy.eyebrow)}</div>
    <h1>${escapeHtml(vm.copy.title)}</h1>
  </section>

  <section class="stp-nationality-stack">
    <label class="stp-nationality-card primary">
      <span class="stp-nationality-card-top"><strong>${escapeHtml(vm.copy.primaryLabel)}</strong><small>Obligatoire</small></span>
      <span class="stp-nationality-select-wrap">
        <select name="primaryNationality" aria-label="${escapeHtml(vm.copy.primaryLabel)}">${optionsHtml(vm.options, vm.primaryNationality)}</select>
        <i aria-hidden="true">⌄</i>
      </span>
    </label>

    <label class="stp-nationality-card secondary">
      <span class="stp-nationality-card-top"><strong>${escapeHtml(vm.copy.secondaryLabel)}</strong><small>${escapeHtml(vm.copy.optionalLabel)}</small></span>
      <span class="stp-nationality-select-wrap">
        <select name="secondaryNationality" aria-label="${escapeHtml(vm.copy.secondaryLabel)}">${optionsHtml(vm.options.filter(country => country !== vm.primaryNationality), vm.secondaryNationality, { includeEmpty: true })}</select>
        <i aria-hidden="true">⌄</i>
      </span>
    </label>
  </section>

  <footer class="stp-creation-footer">
    <button type="button" class="stp-continue${readyClass}"${disabled}>${escapeHtml(vm.copy.continueLabel)}</button>
  </footer>
</section>`;
}

export const PLAYER_CREATION_NATIONALITIES_CSS = `
.stp-creation-nationalities{position:relative;overflow:hidden;min-height:100%;background:linear-gradient(180deg,#0b0b0b 0%,#070707 52%,#050505 100%);color:#f7f7f4;display:flex;flex-direction:column;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.stp-creation-material{position:absolute;inset:0;pointer-events:none;overflow:hidden}.stp-creation-material:before,.stp-creation-material:after,.stp-creation-material i{content:"";position:absolute;height:1px;width:145%;left:-20%;transform:rotate(-28deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.024),transparent)}.stp-creation-material:before{top:20%}.stp-creation-material i{top:52%;background:linear-gradient(90deg,transparent,rgba(245,166,35,.035),transparent)}.stp-creation-material:after{top:78%}.stp-creation-material b{position:absolute;width:520px;height:520px;border-radius:50%;border:1px solid rgba(255,255,255,.018);left:-330px;top:190px}.stp-creation-material em{position:absolute;width:360px;height:360px;border-radius:50%;border:1px solid rgba(245,166,35,.022);right:-255px;bottom:20px}.stp-creation-top,.stp-nationality-heading,.stp-nationality-stack,.stp-creation-footer{position:relative;z-index:1}.stp-creation-top{padding:18px 22px 0}.stp-creation-brand{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:rgba(218,218,211,.58);font-weight:800}.stp-creation-brand strong{color:#f5a623}.stp-creation-progress{height:3px;background:rgba(255,255,255,.06);margin:18px -22px 0;position:relative}.stp-creation-progress i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#ff7a00,#f5a623)}.stp-nationality-heading{padding:30px 22px 18px}.stp-creation-eyebrow{color:#f5a623;font-size:12px;font-weight:850;letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px}.stp-nationality-heading h1{margin:0;font-size:42px;line-height:.98;letter-spacing:-.055em}.stp-nationality-stack{padding:10px 22px 0;display:grid;gap:14px}.stp-nationality-card{display:block;border:1px solid rgba(255,255,255,.08);border-radius:24px;background:rgba(10,10,10,.42);padding:18px}.stp-nationality-card.primary{border-color:rgba(245,166,35,.18)}.stp-nationality-card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.stp-nationality-card-top strong{font-size:12px;text-transform:uppercase;letter-spacing:.09em;color:#d0d0ca}.stp-nationality-card-top small{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#63635f;font-weight:800}.stp-nationality-card.primary .stp-nationality-card-top small{color:#916e33}.stp-nationality-select-wrap{position:relative;display:block}.stp-nationality-select-wrap select{appearance:none;width:100%;height:68px;border-radius:17px;border:1px solid rgba(255,255,255,.08);background:rgba(4,4,4,.72);color:#f7f7f4;padding:0 48px 0 16px;font:inherit;font-size:18px;font-weight:850;outline:none}.stp-nationality-select-wrap select:focus{border-color:#8a6228;box-shadow:0 0 0 3px rgba(245,166,35,.07)}.stp-nationality-select-wrap i{position:absolute;right:18px;top:50%;transform:translateY(-52%);font-style:normal;color:#f5a623;font-size:21px;pointer-events:none}.stp-creation-footer{margin-top:auto;padding:18px 22px 22px}.stp-continue{width:100%;height:58px;border:0;border-radius:17px;font:inherit;font-size:15px;font-weight:900;background:#242424;color:#666}.stp-continue.ready{color:#0b0b0b;background:linear-gradient(90deg,#ff7a00,#f5a623);cursor:pointer}`;

export function mountPlayerCreationNationalities(container, initialState, { onChange, onContinue } = {}) {
    if (!container) throw new Error('Conteneur nationalités requis.');
    let state = initialState;

    const render = () => {
        container.innerHTML = playerCreationNationalitiesTemplate(state);
        const primary = container.querySelector('[name="primaryNationality"]');
        const secondary = container.querySelector('[name="secondaryNationality"]');

        primary?.addEventListener('change', event => {
            if (!event.target.value) return;
            state = setPrimaryNationality(state, event.target.value);
            onChange?.(state);
            render();
        });
        secondary?.addEventListener('change', event => {
            state = setSecondaryNationality(state, event.target.value);
            onChange?.(state);
            render();
        });
        container.querySelector('.stp-continue')?.addEventListener('click', () => {
            const result = continueFromNationalities(state);
            if (result.ok) {
                state = result.state;
                onContinue?.(result);
            }
        });
    };

    render();
    return Object.freeze({ getState: () => state, rerender: render });
}
