// ui-creation-ux-v2.js
// Refonte UX de la création : identité, poste, origines et offres.
// Ne change pas les règles métier. Les champs taille/poids sont ajoutés à selectedData.

import { POSITIONS, ORIGINS, HEART_CLUBS } from './constants.js';

(() => {
    if (window.__STP_CREATION_UX_V2__) return;
    window.__STP_CREATION_UX_V2__ = true;
    window.__STP_POSITIONS = Array.isArray(POSITIONS) ? POSITIONS : Object.values(POSITIONS || {});
    window.__STP_ORIGINS = ORIGINS || {};

    const style = document.createElement('style');
    style.textContent = `
        .stp-body-metrics { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:12px 0 4px; }
        .stp-metric-card { background:rgba(255,255,255,.045); border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:10px 12px; }
        .stp-metric-card label { display:flex; justify-content:space-between; align-items:center; font-size:.68rem; font-weight:800; color:#94a3b8; margin-bottom:7px; }
        .stp-metric-value { color:#f8fafc; font-size:.9rem; font-weight:900; }
        .stp-range { width:100%; margin:2px 0 0; accent-color:#22c55e; cursor:pointer; }
        .stp-range-scale { display:flex; justify-content:space-between; color:#64748b; font-size:.58rem; margin-top:3px; }
        .stp-position-picker { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:10px; }
        .stp-position-card { border:1px solid rgba(255,255,255,.09); background:rgba(255,255,255,.045); border-radius:14px; padding:11px 6px; color:#e2e8f0; cursor:pointer; }
        .stp-position-card strong { display:block; font-size:.85rem; }
        .stp-position-card small { display:block; color:#94a3b8; font-size:.62rem; margin-top:3px; }
        .stp-position-card.selected { border-color:#22c55e; background:rgba(34,197,94,.13); box-shadow:0 0 0 1px rgba(34,197,94,.18); }
        .stp-position-card:active { transform:scale(.98); }
        .stp-origin-list { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px; }
        .stp-origin-card { text-align:left; border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.04); border-radius:14px; padding:11px; color:#f8fafc; cursor:pointer; }
        .stp-origin-card.selected { border-color:#22c55e; background:rgba(34,197,94,.12); }
        .stp-origin-card strong { font-size:.82rem; }
        .stp-origin-card small { display:block; color:#94a3b8; font-size:.65rem; margin-top:4px; line-height:1.25; }
        .stp-origin-detail { margin-top:9px; padding:10px 11px; border-left:2px solid #22c55e; background:rgba(255,255,255,.035); border-radius:0 10px 10px 0; color:#cbd5e1; font-size:.73rem; line-height:1.4; }
        .stp-league-flag { margin-right:7px; font-size:.95rem; }
        .stp-club-country-flag { margin-right:5px; font-size:.9rem; }
        .stp-club-card .league-tag, .stp-club-card .prestige-badge { display:none !important; }
        .stp-club-card .club-header-info h3 { margin:0; }
        @media(max-width:380px){ .stp-position-picker{grid-template-columns:repeat(2,1fr)} }
    `;
    document.head.appendChild(style);

    const esc = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const countryFlags = { France:'🇫🇷', Espagne:'🇪🇸', Allemagne:'🇩🇪', Angleterre:'🏴', Italie:'🇮🇹', Portugal:'🇵🇹', Brésil:'🇧🇷', Argentine:'🇦🇷', Belgique:'🇧🇪', Maroc:'🇲🇦', Sénégal:'🇸🇳', Cameroun:'🇨🇲', Nigeria:'🇳🇬', Japon:'🇯🇵', Canada:'🇨🇦', 'États-Unis':'🇺🇸', PaysBas:'🇳🇱', PaysBas:'🇳🇱', Suisse:'🇨🇭', Autriche:'🇦🇹', Turquie:'🇹🇷', Mexique:'🇲🇽' };
    const flagFor = name => countryFlags[name] || '';

    function ui(){ return window.UI; }
    function data(){ return ui()?.selectedData; }

    function enhanceIdentity() {
        const u=ui(), d=data(); if(!u || u.currentStep!==1 || !d) return;
        const main=document.querySelector('.career-content'); if(!main || main.dataset.stpIdentity==='1') return;
        main.dataset.stpIdentity='1';
        main.querySelector('.proclubs-pitch-container')?.remove();
        const group=main.querySelector('.form-group:last-child'); if(!group) return;
        const positions=window.__STP_POSITIONS || [];
        const positionNames={GK:'Gardien',DC:'Défenseur central',DD:'Latéral droit',DG:'Latéral gauche',MDC:'Milieu défensif',MC:'Milieu central',MO:'Milieu offensif',AD:'Ailier droit',AG:'Ailier gauche',BU:'Buteur'};
        const cards=positions.map(p=>{const id=p?.id;if(!id)return '';return `<button type="button" class="stp-position-card ${d.position===id?'selected':''}" data-stp-pos="${esc(id)}"><strong>${esc(id)}</strong><small>${esc(p?.name||positionNames[id]||id)}</small></button>`}).join('');

        const metrics=document.createElement('div');
        metrics.className='stp-body-metrics';
        const height=Number(d.height)||180;
        const weight=Number(d.weight)||72;
        metrics.innerHTML=`
          <div class="stp-metric-card">
            <label for="stp-height">Taille <span class="stp-metric-value" id="stp-height-value">${height} cm</span></label>
            <input id="stp-height" class="stp-range" type="range" min="150" max="220" step="1" value="${height}">
            <div class="stp-range-scale"><span>150 cm</span><span>220 cm</span></div>
          </div>
          <div class="stp-metric-card">
            <label for="stp-weight">Poids <span class="stp-metric-value" id="stp-weight-value">${weight} kg</span></label>
            <input id="stp-weight" class="stp-range" type="range" min="40" max="130" step="1" value="${weight}">
            <div class="stp-range-scale"><span>40 kg</span><span>130 kg</span></div>
          </div>`;

        // Les mensurations sont sous le nom/prénom, avant le choix du poste.
        const firstname=main.querySelector('#firstname')?.closest('.form-group');
        const lastname=main.querySelector('#lastname')?.closest('.form-group');
        if(lastname) lastname.insertAdjacentElement('afterend',metrics);
        else if(firstname) firstname.insertAdjacentElement('afterend',metrics);

        group.innerHTML='<label>Choisis ton poste</label><p class="subtitle">Une décision qui influencera ton développement et tes opportunités.</p>';
        const wrap=document.createElement('div'); wrap.className='stp-position-picker'; wrap.innerHTML=cards; group.appendChild(wrap);
        wrap.querySelectorAll('[data-stp-pos]').forEach(b=>b.addEventListener('click',()=>{wrap.querySelectorAll('.stp-position-card').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');d.position=b.dataset.stpPos;const n=document.getElementById('next-btn');if(n)n.disabled=!u.isStepValid();}));
        [['height','cm'],['weight','kg']].forEach(([k,unit])=>document.getElementById(`stp-${k}`)?.addEventListener('input',e=>{d[k]=Number(e.target.value);const value=document.getElementById(`stp-${k}-value`);if(value)value.textContent=`${d[k]} ${unit}`;const n=document.getElementById('next-btn');if(n)n.disabled=!u.isStepValid();}));
    }

    function enhanceOrigin(){
        const u=ui(),d=data();if(!u||u.currentStep!==2||!d)return;
        const main=document.querySelector('.career-content');if(!main||main.dataset.stpOrigin==='1')return;main.dataset.stpOrigin='1';
        const grid=main.querySelector('.grid-origins-compact');if(!grid)return;
        // L'ancien bloc de description restait affiché en plus du nouveau : on le supprime.
        main.querySelector('.origin-description-box')?.remove();
        const origins=Object.values(window.__STP_ORIGINS||{});if(!origins.length)return;
        const detail=esc(origins.find(o=>o.id===d.origin)?.desc||'Choisis une origine pour découvrir ce qu’elle raconte sur ton parcours.');
        grid.outerHTML=`<div class="stp-origin-list">${origins.map(o=>`<button type="button" class="stp-origin-card ${d.origin===o.id?'selected':''}" data-stp-origin="${esc(o.id)}"><strong>${esc(o.name||o.id)}</strong><small>${esc(o.trait||'Style de développement')}</small></button>`).join('')}</div><div class="stp-origin-detail">${detail}</div>`;
        main.querySelectorAll('[data-stp-origin]').forEach(b=>b.addEventListener('click',()=>{d.origin=b.dataset.stpOrigin;u.render();}));
    }

    function enhanceHeartClub(){
        const u=ui();if(!u||u.currentStep!==4)return;
        const select=document.querySelector('#heart-club-select');if(!select||select.dataset.stpLeagueFlags==='1')return;select.dataset.stpLeagueFlags='1';
        const leagueFlags={
            'Ligue 1':'🇫🇷','Ligue 2':'🇫🇷','Premier League':'🏴','La Liga':'🇪🇸','Liga':'🇪🇸','Serie A':'🇮🇹','Bundesliga':'🇩🇪','Primeira Liga':'🇵🇹','Eredivisie':'🇳🇱','Jupiler Pro League':'🇧🇪','Liga Portugal':'🇵🇹'
        };
        Array.from(select.querySelectorAll('optgroup')).forEach(group=>{
            const label=group.getAttribute('label')||'';
            const flag=Object.entries(leagueFlags).find(([name])=>label.toLowerCase().includes(name.toLowerCase()))?.[1] || '';
            if(flag) group.setAttribute('label',`${flag} ${label}`);
        });
    }

    function enhanceClubs(){
        const u=ui();if(!u||u.currentStep!==5)return;
        document.querySelectorAll('.club-card').forEach(card=>{
            if(card.dataset.stpClub==='1')return;card.dataset.stpClub='1';
            const clubName=card.dataset.clubName;const offer=u.randomYouthClubs?.find(c=>c?.name===clubName);const h=card.querySelector('.club-header-info h3');if(h&&!h.querySelector('.stp-club-country-flag'))h.insertAdjacentHTML('afterbegin',`<span class="stp-club-country-flag">${flagFor(offer?.country||'')}</span>`);
            card.querySelector('.prestige-badge')?.remove();card.querySelector('.league-tag')?.remove();
        });
    }

    const observer=new MutationObserver(()=>requestAnimationFrame(()=>{enhanceIdentity();enhanceOrigin();enhanceHeartClub();enhanceClubs();}));
    function start(){const root=document.getElementById('app')||document.body;observer.observe(root,{childList:true,subtree:true});setInterval(()=>{enhanceIdentity();enhanceOrigin();enhanceHeartClub();enhanceClubs();},300);}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
