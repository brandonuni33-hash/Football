// ui/narrativePanelsStyles.js
// Langage visuel vertical : une case active en couleur, les autres désaturées/assombries.

let installed = false;

export function installNarrativePanelsStyles() {
    if (installed || typeof document === 'undefined') return;
    installed = true;
    if (document.getElementById('stp-narrative-panels-styles')) return;

    const style = document.createElement('style');
    style.id = 'stp-narrative-panels-styles';
    style.textContent = `
        .stp-narrative-panels{
            position:relative;
            display:grid;
            grid-template-rows:repeat(var(--stp-panel-count,3),minmax(0,1fr));
            width:100%;
            height:100dvh;
            min-height:560px;
            overflow:hidden;
            background:#050505;
            color:#fff;
            font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
        }
        .stp-narrative-panel{
            position:relative;
            min-height:0;
            overflow:hidden;
            background:#080808;
            border-bottom:3px solid #050505;
            transition:filter 260ms ease,opacity 260ms ease,transform 260ms ease;
        }
        .stp-narrative-panel:last-child{border-bottom:0}
        .stp-narrative-panel__media{
            width:100%;
            height:100%;
            display:block;
            object-fit:cover;
            transform:scale(1.005);
            transition:filter 260ms ease,opacity 260ms ease,transform 1.2s ease;
        }
        .stp-narrative-panel__shade{
            position:absolute;
            inset:0;
            pointer-events:none;
            background:linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.32));
            transition:background 260ms ease;
        }
        .stp-narrative-panel.is-inactive .stp-narrative-panel__media{
            filter:grayscale(1) saturate(.35) brightness(.48) contrast(1.05);
        }
        .stp-narrative-panel.is-inactive .stp-narrative-panel__shade{
            background:rgba(0,0,0,.28);
        }
        .stp-narrative-panel.is-active .stp-narrative-panel__media{
            filter:grayscale(0) saturate(.92) brightness(.94) contrast(1.04);
            transform:scale(1.02);
        }
        .stp-narrative-panel__copy{
            position:absolute;
            left:18px;
            bottom:16px;
            z-index:2;
            width:min(66%,360px);
            padding:10px 12px 11px;
            border-left:2px solid #f59e0b;
            background:linear-gradient(90deg,rgba(5,5,5,.82),rgba(5,5,5,.48));
            backdrop-filter:blur(6px);
            opacity:0;
            transform:translateY(5px);
            transition:opacity 180ms ease,transform 180ms ease;
        }
        .stp-narrative-panel.is-active .stp-narrative-panel__copy{
            opacity:1;
            transform:translateY(0);
        }
        .stp-narrative-panel__speaker{
            margin-bottom:4px;
            color:#f59e0b;
            font-size:.66rem;
            font-weight:800;
            letter-spacing:.11em;
            text-transform:uppercase;
        }
        .stp-narrative-panel__dialogue{
            color:#fff;
            font-size:clamp(.88rem,2.7vw,1.02rem);
            font-weight:650;
            line-height:1.26;
            text-wrap:balance;
            text-shadow:0 1px 4px rgba(0,0,0,.5);
        }
        .stp-narrative-panel.is-expanded{
            position:absolute;
            inset:0;
            z-index:10;
            border:0;
        }
        .stp-narrative-panel.is-expanded .stp-narrative-panel__copy{
            bottom:max(22px,env(safe-area-inset-bottom));
        }
        @media (min-width:700px){
            .stp-narrative-panels{max-width:480px;margin:0 auto;box-shadow:0 0 70px rgba(0,0,0,.55)}
        }
        @media (prefers-reduced-motion:reduce){
            .stp-narrative-panel,.stp-narrative-panel__media,.stp-narrative-panel__shade,.stp-narrative-panel__copy{transition:none!important}
        }
    `;
    document.head.appendChild(style);
}

export default installNarrativePanelsStyles;
