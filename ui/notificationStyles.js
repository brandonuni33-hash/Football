// ui/notificationStyles.js
// Styles isolés de la zone Journal de carrière.

let installed = false;

export function installNotificationStyles() {
    if (installed || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.id = 'street-to-pro-notification-styles';
    style.textContent = `
        .dashboard-notification-zone {
            position: relative;
            z-index: 3;
            margin: 10px 14px 4px;
            border: 1px solid rgba(255,255,255,.12);
            border-radius: 16px;
            background: rgba(15,23,42,.78);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0,0,0,.22);
        }
        .career-journal-bar {
            width: 100%;
            display: grid;
            grid-template-columns: auto auto minmax(20px,auto) 1fr auto;
            align-items: center;
            gap: 8px;
            padding: 11px 13px;
            border: 0;
            background: transparent;
            color: #fff;
            text-align: left;
            cursor: pointer;
        }
        .journal-icon { font-size: 1.05rem; }
        .journal-title { font-weight: 800; font-size: .82rem; }
        .journal-count {
            min-width: 20px;
            height: 20px;
            padding: 0 6px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            background: rgba(59,130,246,.85);
            font-size: .7rem;
            font-weight: 800;
        }
        .is-empty .journal-count { opacity: .45; }
        .journal-preview {
            min-width: 0;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            color: #cbd5e1;
            font-size: .72rem;
        }
        .journal-chevron { font-size: 1.25rem; color: #94a3b8; }
        .career-journal-drawer { border-top: 1px solid rgba(255,255,255,.08); }
        .career-journal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 13px;
            color: #e2e8f0;
            font-size: .8rem;
        }
        .journal-close {
            border: 0;
            background: transparent;
            color: #94a3b8;
            font-size: 1.2rem;
            cursor: pointer;
        }
        .career-journal-list { padding: 0 10px 10px; max-height: 220px; overflow-y: auto; }
        .career-journal-item {
            display: grid;
            grid-template-columns: 30px 1fr;
            gap: 9px;
            padding: 10px;
            margin-top: 7px;
            border-radius: 11px;
            background: rgba(255,255,255,.045);
            border: 1px solid rgba(255,255,255,.07);
            cursor: pointer;
        }
        .career-journal-item.priority-important { border-color: rgba(251,191,36,.25); }
        .journal-item-icon { font-size: 1rem; }
        .journal-item-copy strong { display: block; font-size: .76rem; color: #f8fafc; }
        .journal-item-copy p { margin: 3px 0 0; color: #94a3b8; font-size: .7rem; line-height: 1.35; }
        .journal-empty { margin: 10px 3px; color: #64748b; font-size: .75rem; text-align: center; }
    `;
    document.head.appendChild(style);
    installed = true;
}

export default installNotificationStyles;
