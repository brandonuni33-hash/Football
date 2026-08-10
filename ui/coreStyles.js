// ui/coreStyles.js
// Styles minimaux partagés par le shell UI et les modales.

let installed = false;

export function installCoreStyles() {
    if (installed || typeof document === 'undefined') return;
    installed = true;
    if (document.getElementById('stp-core-ui-styles')) return;

    const style = document.createElement('style');
    style.id = 'stp-core-ui-styles';
    style.textContent = `
        :root{--bg-glass:rgba(15,23,42,.85);--bg-card:rgba(30,41,59,.9);--border-glass:rgba(255,255,255,.25);--accent-green:#10b981;--accent-blue:#3b82f6;--accent-purple:#8b5cf6;--accent-gold:#f59e0b;--text-main:#fff;--text-sub:#e2e8f0}
        .phone-frame{width:100%;max-width:430px;height:100dvh;max-height:900px;margin:0 auto;border-radius:36px;background:rgba(10,15,30,.5);border:1.5px solid var(--border-glass);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,.8);position:relative;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:var(--text-main);backdrop-filter:blur(12px)}
        .phone-status-bar{display:flex;justify-content:space-between;align-items:center;padding:calc(env(safe-area-inset-top,12px) + 6px) 20px 8px;font-size:.8rem;font-weight:700;color:#fff;background:rgba(15,23,42,.75);backdrop-filter:blur(16px);z-index:10}
        .phone-home-screen,.app-content-body{flex:1;overflow-y:auto;padding:16px;padding-bottom:calc(20px + env(safe-area-inset-bottom,10px));display:flex;flex-direction:column;gap:16px;scrollbar-width:thin}
        .player-widget-enhanced{background:rgba(15,23,42,.88);border:1px solid var(--border-glass);border-radius:24px;padding:18px;backdrop-filter:blur(20px);box-shadow:0 10px 30px rgba(0,0,0,.5)}
        .widget-header-line{display:flex;justify-content:space-between;align-items:center;font-size:.8rem;color:var(--accent-blue);font-weight:800;margin-bottom:12px}
        .player-card-banner{display:flex;align-items:center;gap:14px;margin-bottom:14px}.player-image-badge{width:56px;height:56px;border-radius:18px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:flex;align-items:center;justify-content:center}.jersey-number{font-size:1.4rem;font-weight:900;color:#fff}.player-main-info .widget-title{font-weight:800;font-size:1.25rem;display:flex;align-items:center;gap:8px}.player-club-sub{font-size:.88rem;color:var(--text-sub);margin-top:2px}
        .widget-stats-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.stat-pill{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:8px 12px;font-size:.85rem;display:flex;align-items:center;justify-content:space-between}.stat-pill strong{font-size:.95rem;color:#fff}
        .widget-secret-tag{margin-top:12px;padding-top:10px;border-top:1px dashed rgba(255,255,255,.2);font-size:.8rem;color:#fbbf24;font-weight:600;display:flex;align-items:center;gap:6px}
        .apps-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:6px}.app-icon{display:flex;flex-direction:column;align-items:center;background:transparent;border:none;cursor:pointer;position:relative}.app-icon:active{transform:scale(.92)}.app-logo{width:62px;height:62px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:1.7rem;background:#1e293b;border:1.5px solid rgba(255,255,255,.3);box-shadow:0 8px 20px rgba(0,0,0,.6);margin-bottom:6px}.app-label{font-size:.75rem;font-weight:700;color:#fff;text-align:center;text-shadow:0 2px 4px rgba(0,0,0,.9)}
        .notification-badge{position:absolute;top:-2px;right:4px;background:#ef4444;color:#fff;font-size:.7rem;font-weight:900;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #0f172a}
        .btn-settings-floating{position:absolute;right:20px;bottom:calc(90px + env(safe-area-inset-bottom,0px));width:46px;height:46px;border-radius:50%;background:#1e293b;border:1.5px solid var(--border-glass);color:#fff;font-size:1.3rem;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:5}
        .btn-play-block{width:100%;padding:16px;border-radius:20px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-weight:800;font-size:1rem;border:none;cursor:pointer}.btn-play-block:active{transform:scale(.98)}
        .app-pane{background:rgba(15,23,42,.9);border:1px solid var(--border-glass);border-radius:20px;padding:16px;backdrop-filter:blur(16px)}.pane-title{font-size:1.15rem;font-weight:800;margin:0 0 12px;color:#fff}
        .event-modal-overlay{position:absolute;inset:0;background:rgba(2,6,23,.88);backdrop-filter:blur(20px);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px}.event-modal-card{background:#1e293b;border:1.5px solid var(--border-glass);border-radius:26px;padding:22px;width:100%;max-width:360px;box-shadow:0 20px 40px rgba(0,0,0,.8)}.event-modal-category{font-size:.72rem;font-weight:800;letter-spacing:1px;color:var(--accent-gold);text-transform:uppercase}.event-modal-title{font-size:1.25rem;font-weight:800;margin:6px 0 10px;color:#fff}.event-modal-desc{font-size:.9rem;color:var(--text-sub);line-height:1.4;margin-bottom:18px}.btn-event-choice{width:100%;padding:14px;border-radius:14px;background:rgba(255,255,255,.1);border:1px solid var(--border-glass);color:var(--text-main);font-weight:700;font-size:.9rem;margin-bottom:10px;cursor:pointer;text-align:left}
    `;
    document.head.appendChild(style);
}
