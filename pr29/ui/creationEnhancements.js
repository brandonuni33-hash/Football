// ui/creationEnhancements.js
// Unique presentation module for the career-creation screen.
// No business rules: it only enhances the existing UserInterface DOM.

import { POSITIONS, ORIGINS } from '../constants.js';

(() => {
    if (window.__STP_CREATION_ENHANCEMENTS__) return;
    window.__STP_CREATION_ENHANCEMENTS__ = true;

    window.__STP_POSITIONS = Array.isArray(POSITIONS) ? POSITIONS : Object.values(POSITIONS || {});
    window.__STP_ORIGINS = ORIGINS || {};

    const style = document.createElement('style');
    style.id = 'stp-creation-enhancements';
    style.textContent = `
        .career-container{width:min(100%,430px)!important;min-height:100dvh!important;margin:0 auto!important;padding:18px 16px calc(96px + env(safe-area-inset-bottom,0px))!important;display:flex!important;flex-direction:column!important;background:linear-gradient(180deg,#08111f 0%,#070b14 100%)!important;color:#f8fafc!important}
        .career-header{position:sticky!important;top:0!important;z-index:20!important;padding:4px 0 14px!important;background:linear-gradient(#08111f 72%,transparent)!important}
        .career-header h1{margin:0!important;font-size:1.45rem!important;letter-spacing:-.03em!important}
        .career-header .stp-creation-eyebrow{display:block;color:#94a3b8;font-size:.68rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px}
        .career-header .stp-creation-step{display:flex;justify-content:space-between;align-items:center;margin:9px 0 7px;color:#cbd5e1;font-size:.75rem;font-weight:700}
        .career-header .stp-creation-step strong{color:#fff}
        .progress-bar{height:6px!important;border-radius:99px!important;background:rgba(255,255,255,.08)!important;overflow:hidden!important}
        .progress-bar .progress{height:100%!important;border-radius:99px!important;background:linear-gradient(90deg,#22c55e,#34d399)!important;transition:width .25s ease!important}
        .career-content{flex:1!important;padding:5px 0 18px!important}
        .career-content h2{margin:7px 0 5px!important;font-size:1.35rem!important;letter-spacing:-.025em!important}
        .career-content>.subtitle,.career-content>h2+.subtitle{margin:0 0 18px!important;color:#94a3b8!important;line-height:1.45!important;font-size:.84rem!important}
        .career-content h3{font-size:.82rem!important;margin:18px 0 9px!important;color:#cbd5e1!important}
        .form-group{margin:0 0 16px!important}
        .form-group label{display:block!important;margin:0 0 7px!important;color:#cbd5e1!important;font-size:.76rem!important;font-weight:800!important}
        .form-group input,.form-group select{width:100%!important;min-height:50px!important;border-radius:14px!important;background:rgba(15,23,42,.9)!important;border:1px solid rgba(255,255,255,.1)!important;color:#fff!important;padding:12px 14px!important;outline:none!important}
        .form-group input:focus,.form-group select:focus{border-color:rgba(34,197,94,.65)!important;box-shadow:0 0 0 3px rgba(34,197,94,.10)!important}
        .proclubs-pitch-container{padding:10px!important;border-radius:22px!important;background:linear-gradient(180deg,rgba(34,197,94,.10),rgba(255,255,255,.025))!important;border:1px solid rgba(255,255,255,.08)!important}
        .proclubs-soccer-pitch{border-radius:18px!important;min-height:310px!important;overflow:hidden!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.10)!important}
        .proclubs-node{width:58px!important;height:58px!important;border-radius:18px!important;background:rgba(7,11,20,.82)!important;border:1px solid rgba(255,255,255,.13)!important;box-shadow:0 7px 16px rgba(0,0,0,.25)!important;transition:.16s ease!important}
        .proclubs-node .proclubs-jersey{font-size:1.25rem!important;line-height:1!important}
        .proclubs-pos-name{display:block!important;margin-top:2px!important;font-size:.62rem!important;font-weight:900!important;color:#cbd5e1!important}
        .proclubs-node.selected{background:rgba(34,197,94,.20)!important;border-color:#34d399!important;box-shadow:0 0 0 3px rgba(34,197,94,.12),0 8px 18px rgba(0,0,0,.28)!important;transform:translate(-50%,-50%) scale(1.06)!important}
        .grid-origins-compact{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}
        .origin-card-compact{min-height:78px!important;border-radius:16px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.08)!important;padding:11px!important;display:flex!important;align-items:center!important;gap:10px!important;transition:.16s ease!important}
        .origin-card-compact.selected{background:rgba(34,197,94,.12)!important;border-color:rgba(52,211,153,.65)!important;box-shadow:0 0 0 2px rgba(34,197,94,.08)!important}
        .origin-icon-small{font-size:1.25rem!important;width:34px!important;height:34px!important;display:grid!important;place-items:center!important;border-radius:11px!important;background:rgba(255,255,255,.06)!important}
        .origin-info-small h3{margin:0 0 4px!important;font-size:.78rem!important;color:#fff!important}
        .trait-tag{font-size:.62rem!important;color:#94a3b8!important}
        .origin-description-box{margin-top:10px!important;border-radius:14px!important;padding:12px!important;background:rgba(255,255,255,.035)!important;border:1px solid rgba(255,255,255,.07)!important;color:#aebbd0!important;font-size:.76rem!important;line-height:1.45!important}
        .grid-continents{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
        .chip-continent,.chip-country{min-height:46px!important;border-radius:13px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.08)!important;color:#e2e8f0!important;font-weight:700!important}
        .chip-continent.selected,.chip-country.selected{background:rgba(34,197,94,.13)!important;border-color:#34d399!important;color:#fff!important}
        .grid-countries{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
        .grid-youth-clubs{display:flex!important;flex-direction:column!important;gap:10px!important}
        .club-card{padding:14px!important;border-radius:17px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.09)!important;transition:.16s ease!important}
        .club-card.selected{background:rgba(34,197,94,.11)!important;border-color:#34d399!important;box-shadow:0 0 0 2px rgba(34,197,94,.08)!important}
        .club-header-info h3{margin:0 0 5px!important;font-size:.92rem!important;color:#fff!important}
        .league-tag{font-size:.67rem!important;color:#94a3b8!important}
        .contract-details{margin-top:10px!important;display:grid!important;gap:5px!important}
        .contract-details p{margin:0!important;font-size:.69rem!important;color:#aebbd0!important;line-height:1.35!important}
        .prestige-badge{margin-top:10px!important;display:inline-block!important;padding:4px 8px!important;border-radius:999px!important;background:rgba(245,158,11,.10)!important;color:#fbbf24!important;font-size:.62rem!important;font-weight:800!important}
        .stp-body-metrics{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0 4px}
        .stp-metric-card{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:10px 12px}
        .stp-metric-card label{display:flex;justify-content:space-between;align-items:center;font-size:.68rem;font-weight:800;color:#94a3b8;margin-bottom:7px}
        .stp-metric-value{color:#f8fafc;font-size:.9rem;font-weight:900}
        .stp-range{width:100%;margin:2px 0 0;accent-color:#22c55e;cursor:pointer}
        .stp-range-scale{display:flex;justify-content:space-between;color:#64748b;font-size:.58rem;margin-top:3px}
        .stp-position-picker{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}
        .stp-position-card{border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.045);border-radius:14px;padding:11px 6px;color:#e2e8f0;cursor:pointer}
        .stp-position-card strong{display:block;font-size:.85rem}
        .stp-position-card small{display:block;color:#94a3b8;font-size:.62rem;margin-top:3px}
        .stp-position-card.selected{border-color:#22c55e;background:rgba(34,197,94,.13);box-shadow:0 0 0 1px rgba(34,197,94,.18)}
        .stp-position-card:active{transform:scale(.98)}
        .stp-origin-list{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
        .stp-origin-card{text-align:left;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);border-radius:14px;padding:11px;color:#f8fafc;cursor:pointer}
        .stp-origin-card.selected{border-color:#22c55e;background:rgba(34,197,94,.12)}
        .stp-origin-card strong{font-size:.82rem}
        .stp-origin-card small{display:block;color:#94a3b8;font-size:.65rem;margin-top:4px;line-height:1.25}
        .stp-origin-detail{margin-top:9px;padding:10px 11px;border-left:2px solid #22c55e;background:rgba(255,255,255,.035);border-radius:0 10px 10px 0;color:#cbd5e1;font-size:.73rem;line-height:1.4}
        .stp-league-flag,.stp-club-country-flag{margin-right:5px;font-size:.9rem}
        .stp-club-card .league-tag,.stp-club-card .prestige-badge{display:none!important}
        .stp-club-card .club-header-info h3{margin:0}
        .career-footer{position:fixed!important;left:50%!important;bottom:0!important;transform:translateX(-50%)!important;width:min(100%,430px)!important;z-index:30!important;display:flex!important;gap:9px!important;padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px))!important;background:linear-gradient(transparent,#070b14 24%)!important}
        .career-footer button{min-height:48px!important;border-radius:15px!important;font-weight:850!important}
        .career-footer #prev-btn{flex:0 0 34%!important}.career-footer #next-btn,.career-footer #start-btn{flex:1!important}
        .career-footer button:disabled{opacity:.42!important;filter:saturate(.5)!important}
        .career-footer #start-btn{background:linear-gradient(135deg,#22c55e,#16a34a)!important;box-shadow:0 9px 22px rgba(34,197,94,.18)!important}
        @media(max-width:380px){.stp-position-picker{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:360px){.proclubs-soccer-pitch{min-height:280px!important}.proclubs-node{width:52px!important;height:52px!important}.career-content h2{font-size:1.22rem!important}}
    `;
    document.head.appendChild(style);

    const steps = ['Identité & poste','Origine','Nationalité','Club de cœur','Premier contrat'];
    const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
    const countryFlags = { France:'🇫🇷', Espagne:'🇪🇸', Allemagne:'🇩🇪', Angleterre:'🏴', Italie:'🇮🇹', Portugal:'🇵🇹', Brésil:'🇧🇷', Argentine:'🇦🇷', Belgique:'🇧🇪', Maroc:'🇲🇦', Sénégal:'🇸🇳', Cameroun:'🇨🇲', Nigeria:'🇳🇬', Japon:'🇯🇵', Canada:'🇨🇦', 'États-Unis':'🇺🇸', PaysBas:'🇳🇱', Suisse:'🇨🇭', Autriche:'🇦🇹', Turquie:'🇹🇷', Mexique:'🇲🇽' };
    const flagFor = name => countryFlags[name] || '';
    const ui = () => window.UI;
    const data = () => ui()?.selectedData;

    function enhanceCreationShell() {
        const container = document.querySelector('.career-container');
        if (!container) return;
        const header = container.querySelector('.career-header');
        const progress = header?.querySelector('.progress');
        if (header && !header.querySelector('.stp-creation-eyebrow')) {
            const h1 = header.querySelector('h1');
            if (h1) h1.textContent = 'Construis ton histoire';
            const eyebrow = document.createElement('span'); eyebrow.className = 'stp-creation-eyebrow'; eyebrow.textContent = 'STREET TO PRO · NOUVELLE CARRIÈRE';
            header.insertBefore(eyebrow, h1);
        }
        const current = Number(progress?.style.width?.replace('%','')) || 20;
        const index = Math.min(5, Math.max(1, Math.round(current / 20)));
        if (header && !header.querySelector('.stp-creation-step')) {
            const step = document.createElement('div'); step.className = 'stp-creation-step'; step.innerHTML = `<span>Étape ${index} sur 5</span><strong>${steps[index-1]}</strong>`;
            header.insertBefore(step, header.querySelector('.progress-bar'));
        } else if (header) {
            const step = header.querySelector('.stp-creation-step'); if (step) step.innerHTML = `<span>Étape ${index} sur 5</span><strong>${steps[index-1]}</strong>`;
        }
        const footer = container.querySelector('.career-footer');
        const startButton = footer?.querySelector('#start-btn'); if (startButton) startButton.textContent = '🚀 Commencer ma carrière';
        const nextButton = footer?.querySelector('#next-btn'); if (nextButton) nextButton.textContent = 'Continuer →';
        const prevButton = footer?.querySelector('#prev-btn'); if (prevButton) prevButton.textContent = '← Retour';
        const h2 = container.querySelector('.career-content h2'); if (h2) h2.textContent = h2.textContent.replace(/^Étape \d+\s*:\s*/,'');
    }

    function enhanceIdentity() {
        const u=ui(), d=data(); if(!u || u.currentStep!==1 || !d) return;
        const main=document.querySelector('.career-content'); if(!main || main.dataset.stpIdentity==='1') return;
        main.dataset.stpIdentity='1';
        main.querySelector('.proclubs-pitch-container')?.remove();
        const group=main.querySelector('.form-group:last-child'); if(!group) return;
        const positions=window.__STP_POSITIONS || [];
        const names={GK:'Gardien',DC:'Défenseur central',DD:'Latéral droit',DG:'Latéral gauche',MDC:'Milieu défensif',MC:'Milieu central',MO:'Milieu offensif',AD:'Ailier droit',AG:'Ailier gauche',BU:'Buteur'};
        const cards=positions.map(p=>{const id=p?.id;if(!id)return '';return `<button type="button" class="stp-position-card ${d.position===id?'selected':''}" data-stp-pos="${esc(id)}"><strong>${esc(id)}</strong><small>${esc(p?.name||names[id]||id)}</small></button>`}).join('');
        const metrics=document.createElement('div'); metrics.className='stp-body-metrics';
        const height=Number(d.height)||180, weight=Number(d.weight)||72;
        metrics.innerHTML=`<div class="stp-metric-card"><label for="stp-height">Taille <span class="stp-metric-value" id="stp-height-value">${height} cm</span></label><input id="stp-height" class="stp-range" type="range" min="150" max="220" step="1" value="${height}"><div class="stp-range-scale"><span>150 cm</span><span>220 cm</span></div></div><div class="stp-metric-card"><label for="stp-weight">Poids <span class="stp-metric-value" id="stp-weight-value">${weight} kg</span></label><input id="stp-weight" class="stp-range" type="range" min="40" max="130" step="1" value="${weight}"><div class="stp-range-scale"><span>40 kg</span><span>130 kg</span></div></div>`;
        const firstname=main.querySelector('#firstname')?.closest('.form-group'), lastname=main.querySelector('#lastname')?.closest('.form-group');
        if(lastname) lastname.insertAdjacentElement('afterend',metrics); else if(firstname) firstname.insertAdjacentElement('afterend',metrics);
        group.innerHTML='<label>Choisis ton poste</label><p class="subtitle">Une décision qui influencera ton développement et tes opportunités.</p>';
        const wrap=document.createElement('div'); wrap.className='stp-position-picker'; wrap.innerHTML=cards; group.appendChild(wrap);
        wrap.querySelectorAll('[data-stp-pos]').forEach(button=>button.addEventListener('click',()=>{wrap.querySelectorAll('.stp-position-card').forEach(x=>x.classList.remove('selected'));button.classList.add('selected');d.position=button.dataset.stpPos;const next=document.getElementById('next-btn');if(next)next.disabled=!u.isStepValid();}));
        [['height','cm'],['weight','kg']].forEach(([key,unit])=>document.getElementById(`stp-${key}`)?.addEventListener('input',event=>{d[key]=Number(event.target.value);const value=document.getElementById(`stp-${key}-value`);if(value)value.textContent=`${d[key]} ${unit}`;const next=document.getElementById('next-btn');if(next)next.disabled=!u.isStepValid();}));
    }

    function enhanceOrigin() {
        const u=ui(),d=data(); if(!u||u.currentStep!==2||!d)return;
        const main=document.querySelector('.career-content');if(!main||main.dataset.stpOrigin==='1')return;main.dataset.stpOrigin='1';
        const grid=main.querySelector('.grid-origins-compact');if(!grid)return;
        main.querySelector('.origin-description-box')?.remove();
        const origins=Object.values(window.__STP_ORIGINS||{});if(!origins.length)return;
        const detail=esc(origins.find(o=>o.id===d.origin)?.desc||'Choisis une origine pour découvrir ce qu’elle raconte sur ton parcours.');
        grid.outerHTML=`<div class="stp-origin-list">${origins.map(o=>`<button type="button" class="stp-origin-card ${d.origin===o.id?'selected':''}" data-stp-origin="${esc(o.id)}"><strong>${esc(o.name||o.id)}</strong><small>${esc(o.trait||'Style de développement')}</small></button>`).join('')}</div><div class="stp-origin-detail">${detail}</div>`;
        main.querySelectorAll('[data-stp-origin]').forEach(button=>button.addEventListener('click',()=>{d.origin=button.dataset.stpOrigin;u.render();}));
    }

    function enhanceHeartClub() {
        const u=ui();if(!u||u.currentStep!==4)return;const select=document.querySelector('#heart-club-select');if(!select||select.dataset.stpLeagueFlags==='1')return;select.dataset.stpLeagueFlags='1';
        const leagueFlags={'Ligue 1':'🇫🇷','Ligue 2':'🇫🇷','Premier League':'🏴','La Liga':'🇪🇸','Liga':'🇪🇸','Serie A':'🇮🇹','Bundesliga':'🇩🇪','Primeira Liga':'🇵🇹','Eredivisie':'🇳🇱','Jupiler Pro League':'🇧🇪','Liga Portugal':'🇵🇹'};
        Array.from(select.querySelectorAll('optgroup')).forEach(group=>{const label=group.getAttribute('label')||'';const flag=Object.entries(leagueFlags).find(([name])=>label.toLowerCase().includes(name.toLowerCase()))?.[1]||'';if(flag)group.setAttribute('label',`${flag} ${label}`);});
    }

    function enhanceClubs() {
        const u=ui();if(!u||u.currentStep!==5)return;document.querySelectorAll('.club-card').forEach(card=>{if(card.dataset.stpClub==='1')return;card.dataset.stpClub='1';const clubName=card.dataset.clubName;const offer=u.randomYouthClubs?.find(c=>c?.name===clubName);const h=card.querySelector('.club-header-info h3');if(h&&!h.querySelector('.stp-club-country-flag'))h.insertAdjacentHTML('afterbegin',`<span class="stp-club-country-flag">${flagFor(offer?.country||'')}</span>`);card.querySelector('.prestige-badge')?.remove();card.querySelector('.league-tag')?.remove();});
    }

    const observer=new MutationObserver(()=>requestAnimationFrame(()=>{enhanceCreationShell();enhanceIdentity();enhanceOrigin();enhanceHeartClub();enhanceClubs();}));
    const start=()=>{const root=document.getElementById('app')||document.body;observer.observe(root,{childList:true,subtree:true});enhanceCreationShell();enhanceIdentity();enhanceOrigin();enhanceHeartClub();enhanceClubs();};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
