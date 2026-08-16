import {
    childhoodCountryViewModel,
    setChildhoodCountry,
    finishPlayerCreation
} from './playerCreationChildhoodCountryStep.js';

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export function playerCreationChildhoodCountryTemplate(state) {
    const vm = childhoodCountryViewModel(state);
    const readyClass = vm.canContinue ? ' ready' : '';
    const disabled = vm.canContinue ? '' : ' disabled';

    const countries = vm.countries.map(country => `
      <button type="button" class="stp-childhood-country${country.selected ? ' selected' : ''}${country.available ? '' : ' locked'}" data-country="${escapeHtml(country.id)}"${country.available ? '' : ' disabled'} aria-pressed="${country.selected ? 'true' : 'false'}">
        <span class="stp-childhood-flag">${country.flag}</span>
        <span class="stp-childhood-name">${escapeHtml(country.label)}</span>
        <span class="stp-childhood-note">${escapeHtml(country.note)}</span>
      </button>`).join('');

    return `
<section class="stp-creation-childhood" data-stp-step="childhoodCountry">
  <div class="stp-creation-material" aria-hidden="true"><i></i><b></b><em></em></div>

  <header class="stp-creation-top">
    <div class="stp-creation-brand"><span><strong>STP</strong> / Création</span><span>${String(vm.progress.current).padStart(2, '0')} / ${String(vm.progress.total).padStart(2, '0')}</span></div>
    <div class="stp-creation-progress"><i style="width:${vm.progress.ratio * 100}%"></i></div>
  </header>

  <section class="stp-childhood-heading">
    <div class="stp-creation-eyebrow">${escapeHtml(vm.copy.eyebrow)}</div>
    <h1>${escapeHtml(vm.copy.title)}</h1>
    <p>${escapeHtml(vm.copy.description)}</p>
  </section>

  <section class="stp-childhood-grid" aria-label="Pays où le joueur a grandi">
    ${countries}
  </section>

  <div class="stp-childhood-info">${escapeHtml(vm.copy.info)}</div>

  <footer class="stp-creation-footer">
    <button type="button" class="stp-continue${readyClass}"${disabled}>${escapeHtml(vm.copy.continueLabel)}</button>
  </footer>
</section>`;
}

export const PLAYER_CREATION_CHILDHOOD_COUNTRY_CSS = `
.stp-creation-childhood{position:relative;overflow:hidden;min-height:100%;background:linear-gradient(180deg,#0b0b0b 0%,#070707 52%,#050505 100%);color:#f7f7f4;display:flex;flex-direction:column;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.stp-creation-material{position:absolute;inset:0;pointer-events:none;overflow:hidden}.stp-creation-material:before,.stp-creation-material:after,.stp-creation-material i{content:"";position:absolute;height:1px;width:145%;left:-20%;transform:rotate(-28deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.024),transparent)}.stp-creation-material:before{top:20%}.stp-creation-material i{top:52%;background:linear-gradient(90deg,transparent,rgba(245,166,35,.035),transparent)}.stp-creation-material:after{top:78%}.stp-creation-material b{position:absolute;width:520px;height:520px;border-radius:50%;border:1px solid rgba(255,255,255,.018);left:-330px;top:190px}.stp-creation-material em{position:absolute;width:360px;height:360px;border-radius:50%;border:1px solid rgba(245,166,35,.022);right:-255px;bottom:20px}.stp-creation-top,.stp-childhood-heading,.stp-childhood-grid,.stp-childhood-info,.stp-creation-footer{position:relative;z-index:1}.stp-creation-top{padding:18px 22px 0}.stp-creation-brand{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:rgba(218,218,211,.58);font-weight:800}.stp-creation-brand strong{color:#f5a623}.stp-creation-progress{height:3px;background:rgba(255,255,255,.06);margin:18px -22px 0;position:relative}.stp-creation-progress i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#ff7a00,#f5a623)}.stp-childhood-heading{padding:30px 22px 14px}.stp-creation-eyebrow{color:#f5a623;font-size:12px;font-weight:850;letter-spacing:.12em;text-transform:uppercase;margin-bottom:9px}.stp-childhood-heading h1{margin:0;font-size:42px;line-height:.98;letter-spacing:-.055em}.stp-childhood-heading p{margin:14px 0 0;color:rgba(210,210,203,.66);font-size:14px;line-height:1.5;max-width:355px}.stp-childhood-grid{padding:12px 22px 0;display:grid;grid-template-columns:1fr 1fr;gap:10px}.stp-childhood-country{position:relative;min-height:104px;border:1px solid rgba(255,255,255,.08);border-radius:19px;background:rgba(10,10,10,.45);color:#d9d9d3;text-align:left;padding:14px;font:inherit}.stp-childhood-country.selected{border-color:#a66b15;background:linear-gradient(180deg,rgba(44,31,12,.65),rgba(15,13,10,.7));box-shadow:inset 0 0 0 1px rgba(245,166,35,.10)}.stp-childhood-country.selected:after{content:"✓";position:absolute;right:11px;top:10px;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#ff7a00,#f5a623);color:#0b0b0b;font-size:12px;font-weight:950}.stp-childhood-country.locked{opacity:.34}.stp-childhood-flag{display:block;font-size:24px;margin-bottom:7px}.stp-childhood-name{display:block;font-size:14px;font-weight:850}.stp-childhood-note{display:block;margin-top:5px;color:#666660;font-size:9px;line-height:1.3}.stp-childhood-country.selected .stp-childhood-note{color:#92713a}.stp-childhood-info{margin:16px 22px 0;border-left:2px solid #f5a623;padding:10px 12px;background:rgba(245,166,35,.045);color:#777771;font-size:11px;line-height:1.45}.stp-creation-footer{margin-top:auto;padding:18px 22px 22px}.stp-continue{width:100%;height:58px;border:0;border-radius:17px;font:inherit;font-size:15px;font-weight:900;background:#242424;color:#666}.stp-continue.ready{color:#0b0b0b;background:linear-gradient(90deg,#ff7a00,#f5a623);cursor:pointer}`;

export function mountPlayerCreationChildhoodCountry(container, initialState, { onChange, onContinue } = {}) {
    if (!container) throw new Error('Conteneur pays d’enfance requis.');
    let state = initialState;

    const render = () => {
        container.innerHTML = playerCreationChildhoodCountryTemplate(state);
        container.querySelectorAll('[data-country]:not([disabled])').forEach(button => button.addEventListener('click', () => {
            state = setChildhoodCountry(state, button.dataset.country);
            onChange?.(state);
            render();
        }));
        container.querySelector('.stp-continue')?.addEventListener('click', () => {
            const result = finishPlayerCreation(state);
            if (result.ok) {
                state = result.state;
                onContinue?.(result);
            }
        });
    };

    render();
    return Object.freeze({ getState: () => state, rerender: render });
}
