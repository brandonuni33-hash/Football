// ui-creation-ux-v2.js
// Refonte UX de la création : identité, poste, origines et offres.
// Ne change pas les règles métier. Les champs taille/poids sont ajoutés à selectedData.

(() => {
    if (window.__STP_CREATION_UX_V2__) return;
    window.__STP_CREATION_UX_V2__ = true;

    const style = document.createElement('style');
    style.textContent = `
        .stp-create-identity { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; }
        .stp-create-identity .form-group { margin:0; }
        .stp-create-identity label { display:block; font-size:.72rem; font-weight:800; color:#94a3b8; margin-bottom:6px; }
        .stp-create-identity input { width:100%; box-sizing:border-box; }
        .stp-body-metrics { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; }
        .stp-metric-card { background:rgba(255,255,255,.045); border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:10px; }
        .stp-metric-card label { display:block; font-size:.68rem; font-weight:800; color:#94a3b8; margin-bottom:5px; }
        .stp-metric-card input { width:100%; box-sizing:border-box; }
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
        .stp-club-country-flag { margin-right:5px; font-size:.9rem; }
        .stp-club-card .league-tag { display:none !important; }
        .stp-club-card .club-header-info h3 { margin:0; }
        .stp-create-kicker { color:#22c55e; font-size:.68rem; font-weight:900; text-transform:uppercase; letter-spacing:.08em; margin-bottom:4px; }
        @media(max-width:380px){ .stp-position-picker{grid-template-columns:repeat(2,1fr)} }
    `;
    document.head.appendChild(style);

    const esc = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const countryFlags = { France:'🇫🇷', Espagne:'🇪🇸', Allemagne:'🇩🇪', Angleterre:'🏴', Italie:'🇮🇹', Portugal:'🇵🇹', Brésil:'🇧🇷', Argentine:'🇦🇷', Belgique:'🇧🇪', Maroc:'🇲🇦', Sénégal:'🇸🇳', Cameroun:'🇨🇲', Nigeria:'🇳🇬', Japon:'🇯🇵', Canada:'🇨🇦', 'États-Unis':'🇺🇸' };
    const flagFor = name => countryFlags[name] || '';

    function ui(){ return window.UI; }
    function data(){ return ui()?.selectedData; }

    function enhanceIdentity() {
        const u=ui(), d=data(); if(!u || u.currentStep!==1 || !d) return;
        const main=document.querySelector('.career-content'); if(!main || main.dataset.stpIdentity==='1') return;
        main.dataset.stpIdentity='1';
        main.querySelector('.proclubs-pitch-container')?.remove();
        const pitchLabel=main.querySelector('.proclubs-pitch-container')?.previousElementSibling;
        if(pitchLabel) pitchLabel.remove();
        const group=main.querySelector('.form-group:last-child'); if(!group) return;
        const positions=Array.isArray(window.__STP_POSITIONS) ? window.__STP_POSITIONS : [];
        const positionNames={GK:'Gardien',DC:'Défenseur central',DD:'Latéral droit',DG:'Latéral gauche',MDC:'Milieu défensif',MC:'Milieu central',MO:'Milieu offensif',AD:'Ailier droit',AG:'Ailier gauche',BU:'Buteur'};
        const source=positions.length?positions:Object.values(window.__STP_POSITIONS_MAP||{});
        const cards=source.map(p=>{const id=p?.id; if(!id)return ''; return `<button type="button" class="stp-position-card ${d.position===id?'selected':''}" data-stp-pos="${esc(id)}"><strong>${esc(id)}</strong><small>${esc(p?.name||positionNames[id]||id)}</small></button>`}).join('');
        const wrap=document.createElement('div'); wrap.className='stp-position-picker'; wrap.innerHTML=cards;
        group.innerHTML='<label>Choisis ton poste</label><p class="subtitle">Une décision qui influencera ton développement et tes opportunités.</p>';
        group.appendChild(wrap);
        const metrics=document.createElement('div'); metrics.className='stp-body-metrics'; metrics.innerHTML=`
          <div class="stp-metric-card"><label for="stp-height">Taille (cm)</label><input id="stp-height" type="number" min="150" max="220" placeholder="Ex. 180" value="${esc(d.height||'')}"></div>
          <div class="stp-metric-card"><label for="stp-weight">Poids (kg)</label><input id="stp-weight" type="number" min="40" max="130" placeholder="Ex. 72" value="${esc(d.weight||'')}"></div>`;
        group.appendChild(metrics);
        wrap.querySelectorAll('[data-stp-pos]').forEach(b=>b.addEventListener('click',()=>{wrap.querySelectorAll('.stp-position-card').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');d.position=b.dataset.stpPos; const n=document.getElementById('next-btn'); if(n)n.disabled=!u.isStepValid();}));
        ['height','weight'].forEach(k=>document.getElementById(`stp-${k}`)?.addEventListener('input',e=>{d[k]=Number(e.target.value)||'';const n=document.getElementById('next-btn');if(n)n.disabled=!u.isStepValid();}));
    }

    function enhanceOrigin(){
        const u=ui(),d=data();if(!u||u.currentStep!==2||!d)return;
        const main=document.querySelector('.career-content');if(!main||main.dataset.stpOrigin==='1')return;main.dataset.stpOrigin='1';
        const grid=main.querySelector('.grid-origins-compact');if(!grid)return;
        const origins=Object.values(window.__STP_ORIGINS||{}); if(!origins.length)return;
        grid.outerHTML=`<div class="stp-origin-list">${origins.map(o=>`<button type="button" class="stp-origin-card ${d.origin===o.id?'selected':''}" data-stp-origin="${esc(o.id)}"><strong>${esc(o.name||o.id)}</strong><small>${esc(o.trait||'Style de développement')}</small></button>`).join('')}</div><div class="stp-origin-detail">${esc(origins.find(o=>o.id===d.origin)?.desc||'Choisis une origine pour découvrir ce qu’elle raconte sur ton parcours.')}</div>`;
        main.querySelectorAll('[data-stp-origin]').forEach(b=>b.addEventListener('click',()=>{d.origin=b.dataset.stpOrigin;u.render();}));
    }

    function enhanceClubs(){
        const u=ui(),d=data();if(!u||u.currentStep!==5||!d)return;
        document.querySelectorAll('.club-card').forEach(card=>{
            if(card.dataset.stpClub==='1')return;card.dataset.stpClub='1';
            const clubName=card.dataset.clubName;const offer=u.randomYouthClubs?.find(c=>c?.name===clubName);const country=offer?.country||'';const h=card.querySelector('.club-header-info h3');if(h&&!h.querySelector('.stp-club-country-flag'))h.insertAdjacentHTML('afterbegin',`<span class="stp-club-country-flag">${flagFor(country)}</span>`);
            card.querySelector('.prestige-badge')?.remove();
            card.querySelector('.league-tag')?.remove();
        });
    }

    function captureRefs(){
        const u=ui(); if(!u)return;
        window.__STP_POSITIONS=window.__STP_POSITIONS||Object.values(window.__STP_CONSTANTS?.POSITIONS||{});
        window.__STP_ORIGINS=window.__STP_ORIGINS||window.__STP_CONSTANTS?.ORIGINS||{};
    }

    const observer=new MutationObserver(()=>requestAnimationFrame(()=>{captureRefs();enhanceIdentity();enhanceOrigin();enhanceClubs();}));
    function start(){const root=document.getElementById('app')||document.body;observer.observe(root,{childList:true,subtree:true});setInterval(()=>{captureRefs();enhanceIdentity();enhanceOrigin();enhanceClubs();},300);}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
