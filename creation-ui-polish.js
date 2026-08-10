// creation-ui-polish.js
// Refonte UI/UX de la création de carrière. Aucun changement de règle métier.

(() => {
    if (window.__STP_CREATION_UX_V1__) return;
    window.__STP_CREATION_UX_V1__ = true;

    const style = document.createElement('style');
    style.id = 'stp-creation-ux-v1';
    style.textContent = `
        .career-container{
            width:min(100%,430px)!important;
            min-height:100dvh!important;
            margin:0 auto!important;
            padding:18px 16px calc(96px + env(safe-area-inset-bottom,0px))!important;
            display:flex!important;
            flex-direction:column!important;
            background:linear-gradient(180deg,#08111f 0%,#070b14 100%)!important;
            color:#f8fafc!important;
        }
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

        /* Poste : terrain comme élément héro, sélection très lisible */
        .proclubs-pitch-container{padding:10px!important;border-radius:22px!important;background:linear-gradient(180deg,rgba(34,197,94,.10),rgba(255,255,255,.025))!important;border:1px solid rgba(255,255,255,.08)!important}
        .proclubs-soccer-pitch{border-radius:18px!important;min-height:310px!important;overflow:hidden!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.10)!important}
        .proclubs-node{width:58px!important;height:58px!important;border-radius:18px!important;background:rgba(7,11,20,.82)!important;border:1px solid rgba(255,255,255,.13)!important;box-shadow:0 7px 16px rgba(0,0,0,.25)!important;transition:.16s ease!important}
        .proclubs-node .proclubs-jersey{font-size:1.25rem!important;line-height:1!important}
        .proclubs-pos-name{display:block!important;margin-top:2px!important;font-size:.62rem!important;font-weight:900!important;color:#cbd5e1!important}
        .proclubs-node.selected{background:rgba(34,197,94,.20)!important;border-color:#34d399!important;box-shadow:0 0 0 3px rgba(34,197,94,.12),0 8px 18px rgba(0,0,0,.28)!important;transform:translate(-50%,-50%) scale(1.06)!important}

        /* Origines : cartes qui donnent envie de cliquer */
        .grid-origins-compact{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}
        .origin-card-compact{min-height:78px!important;border-radius:16px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.08)!important;padding:11px!important;display:flex!important;align-items:center!important;gap:10px!important;transition:.16s ease!important}
        .origin-card-compact.selected{background:rgba(34,197,94,.12)!important;border-color:rgba(52,211,153,.65)!important;box-shadow:0 0 0 2px rgba(34,197,94,.08)!important}
        .origin-icon-small{font-size:1.25rem!important;width:34px!important;height:34px!important;display:grid!important;place-items:center!important;border-radius:11px!important;background:rgba(255,255,255,.06)!important}
        .origin-info-small h3{margin:0 0 4px!important;font-size:.78rem!important;color:#fff!important}
        .trait-tag{font-size:.62rem!important;color:#94a3b8!important}
        .origin-description-box{margin-top:10px!important;border-radius:14px!important;padding:12px!important;background:rgba(255,255,255,.035)!important;border:1px solid rgba(255,255,255,.07)!important;color:#aebbd0!important;font-size:.76rem!important;line-height:1.45!important}

        /* Pays : découverte progressive */
        .grid-continents{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
        .chip-continent,.chip-country{min-height:46px!important;border-radius:13px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.08)!important;color:#e2e8f0!important;font-weight:700!important}
        .chip-continent.selected,.chip-country.selected{background:rgba(34,197,94,.13)!important;border-color:#34d399!important;color:#fff!important}
        .grid-countries{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}

        /* Offres jeunes : décision importante, donc carte premium */
        .grid-youth-clubs{display:flex!important;flex-direction:column!important;gap:10px!important}
        .club-card{padding:14px!important;border-radius:17px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.09)!important;transition:.16s ease!important}
        .club-card.selected{background:rgba(34,197,94,.11)!important;border-color:#34d399!important;box-shadow:0 0 0 2px rgba(34,197,94,.08)!important}
        .club-header-info h3{margin:0 0 5px!important;font-size:.92rem!important;color:#fff!important}
        .league-tag{font-size:.67rem!important;color:#94a3b8!important}
        .contract-details{margin-top:10px!important;display:grid!important;gap:5px!important}
        .contract-details p{margin:0!important;font-size:.69rem!important;color:#aebbd0!important;line-height:1.35!important}
        .prestige-badge{margin-top:10px!important;display:inline-block!important;padding:4px 8px!important;border-radius:999px!important;background:rgba(245,158,11,.10)!important;color:#fbbf24!important;font-size:.62rem!important;font-weight:800!important}

        /* Footer : action claire, toujours accessible */
        .career-footer{position:fixed!important;left:50%!important;bottom:0!important;transform:translateX(-50%)!important;width:min(100%,430px)!important;z-index:30!important;display:flex!important;gap:9px!important;padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px))!important;background:linear-gradient(transparent,#070b14 24%)!important}
        .career-footer button{min-height:48px!important;border-radius:15px!important;font-weight:850!important}
        .career-footer #prev-btn{flex:0 0 34%!important}
        .career-footer #next-btn,.career-footer #start-btn{flex:1!important}
        .career-footer button:disabled{opacity:.42!important;filter:saturate(.5)!important}
        .career-footer #start-btn{background:linear-gradient(135deg,#22c55e,#16a34a)!important;box-shadow:0 9px 22px rgba(34,197,94,.18)!important}

        @media(max-width:360px){.proclubs-soccer-pitch{min-height:280px!important}.proclubs-node{width:52px!important;height:52px!important}.career-content h2{font-size:1.22rem!important}}
    `;
    document.head.appendChild(style);

    const steps = ['Identité & poste','Origine','Nationalité','Club de cœur','Premier contrat'];

    function enhanceCreation() {
        const container = document.querySelector('.career-container');
        if (!container) return;
        const header = container.querySelector('.career-header');
        const progress = header?.querySelector('.progress');
        if (header && !header.querySelector('.stp-creation-eyebrow')) {
            const h1 = header.querySelector('h1');
            if (h1) h1.textContent = 'Construis ton histoire';
            const eyebrow = document.createElement('span');
            eyebrow.className = 'stp-creation-eyebrow';
            eyebrow.textContent = 'STREET TO PRO · NOUVELLE CARRIÈRE';
            header.insertBefore(eyebrow, h1);
        }
        if (header && !header.querySelector('.stp-creation-step')) {
            const step = document.createElement('div');
            step.className = 'stp-creation-step';
            const current = Number(progress?.style.width?.replace('%','')) || 20;
            const index = Math.min(5, Math.max(1, Math.round(current / 20)));
            step.innerHTML = `<span>Étape ${index} sur 5</span><strong>${steps[index-1]}</strong>`;
            header.insertBefore(step, header.querySelector('.progress-bar'));
        } else if (header) {
            const step = header.querySelector('.stp-creation-step');
            const current = Number(progress?.style.width?.replace('%','')) || 20;
            const index = Math.min(5, Math.max(1, Math.round(current / 20)));
            if (step) step.innerHTML = `<span>Étape ${index} sur 5</span><strong>${steps[index-1]}</strong>`;
        }

        const footer = container.querySelector('.career-footer');
        const start = footer?.querySelector('#start-btn');
        if (start) start.textContent = '🚀 Commencer ma carrière';
        const next = footer?.querySelector('#next-btn');
        if (next) next.textContent = 'Continuer →';
        const prev = footer?.querySelector('#prev-btn');
        if (prev) prev.textContent = '← Retour';

        const h2 = container.querySelector('.career-content h2');
        if (h2) {
            h2.textContent = h2.textContent.replace(/^Étape \d+\s*:\s*/,'');
        }
    }

    const observer = new MutationObserver(() => requestAnimationFrame(enhanceCreation));
    const start = () => {
        observer.observe(document.body, {childList:true, subtree:true});
        enhanceCreation();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
    else start();
})();
