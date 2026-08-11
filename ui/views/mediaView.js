// ui/views/mediaView.js
// Présentation pure du fil média, des notifications sociales et des dilemmes sociaux.

const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

function isSocialNotification(note) {
    const category = String(note?.category || note?.type || '').toLowerCase();
    return category.includes('media') || category.includes('média') || category.includes('social') || category.includes('réseau');
}

export class MediaView {
    constructor({ ui, gateway } = {}) {
        this.ui = ui;
        this.gateway = gateway;
    }

    render(state) {
        const media = state?.media || {};
        const dilemma = media.recentDilemma;
        const notificationState = state?.notifications;
        const socialSignals = (Array.isArray(notificationState) ? notificationState : (notificationState?.signals || []))
            .filter(note => !note?.archived && isSocialNotification(note))
            .slice(-20)
            .reverse();
        const unreadSocial = socialSignals.filter(note => !note?.read).length;

        return `
            <div class="app-pane" data-view="media">
                <h3 class="pane-title">📱 Instafoot & Réseaux</h3>
                <div style="display:flex;justify-content:space-between;background:rgba(255,255,255,0.05);padding:10px;border-radius:12px;margin-bottom:12px;">
                    <span>👥 Abonnés : <strong>${(media.followers || 0).toLocaleString()}</strong></span>
                    <span>🔥 Hype : <strong>${media.hypeLevel || 0}/100</strong></span>
                </div>

                ${socialSignals.length ? `
                    <section style="margin-bottom:14px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <strong style="font-size:.82rem;">Notifications réseaux</strong>
                            <small style="color:var(--text-sub);">${unreadSocial ? `${unreadSocial} nouvelle${unreadSocial > 1 ? 's' : ''}` : 'À jour'}</small>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:7px;">
                            ${socialSignals.map(note => `
                                <button type="button" data-social-notification-id="${escapeHtml(note?.id)}" style="display:flex;align-items:center;gap:9px;text-align:left;padding:10px 11px;border-radius:12px;border:1px solid ${note?.read ? 'var(--border-glass)' : 'rgba(236,72,153,.35)'};background:${note?.read ? 'rgba(255,255,255,.035)' : 'rgba(236,72,153,.08)'};color:inherit;">
                                    <span style="font-size:1rem;">♡</span>
                                    <span style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;">
                                        <strong style="font-size:.78rem;">${escapeHtml(note?.title || 'Nouvelle activité')}</strong>
                                        <span style="font-size:.7rem;color:var(--text-sub);">${escapeHtml(note?.body || note?.message || '')}</span>
                                    </span>
                                    ${note?.read ? '<span>›</span>' : '<small style="color:#f472b6;font-weight:800;">NOUVEAU</small>'}
                                </button>
                            `).join('')}
                        </div>
                    </section>
                ` : ''}

                ${dilemma ? `
                    <div class="media-dilemma" data-view="media-dilemma">
                        <h4>⚠️ ${escapeHtml(dilemma.title || 'Dilemme Média')}</h4>
                        <p>${escapeHtml(dilemma.description || '')}</p>
                        ${(dilemma.choices || []).map((choice, index) => `
                            <button class="btn-dilemma" data-media-choice="${index}">
                                👉 ${escapeHtml(choice.text || choice.texte || '')}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
                <div class="feed-list">
                    ${(media.feed || []).map(post => `
                        <article class="media-post">
                            <div><strong>📢 ${escapeHtml(post.source || 'Instafoot')}</strong> <small>${escapeHtml(post.date || '')}</small></div>
                            <p>${escapeHtml(post.content || '')}</p>
                            <small>❤️ ${post.likes || 0} · 💬 ${post.commentsCount || 0}</small>
                        </article>
                    `).join('') || '<p>Aucun post récent.</p>'}
                </div>
            </div>
        `;
    }

    bind(root) {
        root?.querySelectorAll('[data-social-notification-id]').forEach(button => {
            button.addEventListener('click', () => this.ui?.openNotification?.(button.dataset.socialNotificationId));
        });

        root?.querySelectorAll('[data-media-choice]').forEach((button) => {
            button.addEventListener('click', () => {
                const result = this.gateway.resolveMediaDilemma(Number(button.dataset.mediaChoice));

                if (result?.responseText || result?.immediateReaction || result?.changes?.length || result?.temporary?.length || result?.xp) {
                    this.ui?.afficherModaleConsequences?.(result, () => {
                        this.ui?.renderDashboard?.();
                        this.ui?.handlePostInteraction?.();
                    });
                } else {
                    this.ui?.renderDashboard?.();
                    this.ui?.handlePostInteraction?.();
                }
            });
        });
    }
}

export default MediaView;
