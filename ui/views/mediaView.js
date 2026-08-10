// ui/views/mediaView.js
// Présentation pure du fil média et des dilemmes sociaux.

export class MediaView {
    constructor({ ui, gateway } = {}) {
        this.ui = ui;
        this.gateway = gateway;
    }

    render(state) {
        const media = state?.media || {};
        const dilemma = media.recentDilemma;
        return `
            <div class="app-pane">
                <h3 class="pane-title">📱 Instafoot & Réseaux</h3>
                <div style="display:flex;justify-content:space-between;background:rgba(255,255,255,0.05);padding:10px;border-radius:12px;margin-bottom:12px;">
                    <span>👥 Abonnés : <strong>${(media.followers || 0).toLocaleString()}</strong></span>
                    <span>🔥 Hype : <strong>${media.hypeLevel || 0}/100</strong></span>
                </div>
                ${dilemma ? `
                    <div class="media-dilemma" data-view="media-dilemma">
                        <h4>⚠️ ${dilemma.title || 'Dilemme Média'}</h4>
                        <p>${dilemma.description || ''}</p>
                        ${(dilemma.choices || []).map((choice, index) => `
                            <button class="btn-dilemma" data-media-choice="${index}">
                                👉 ${choice.text || choice.texte || ''}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
                <div class="feed-list">
                    ${(media.feed || []).map(post => `
                        <article class="media-post">
                            <div><strong>📢 ${post.source || 'Instafoot'}</strong> <small>${post.date || ''}</small></div>
                            <p>${post.content || ''}</p>
                            <small>❤️ ${post.likes || 0} · 💬 ${post.commentsCount || 0}</small>
                        </article>
                    `).join('') || '<p>Aucun post récent.</p>'}
                </div>
            </div>
        `;
    }

    bind(root) {
        root?.querySelectorAll('[data-media-choice]').forEach((button) => {
            button.addEventListener('click', () => {
                const result = this.gateway.resolveMediaDilemma(Number(button.dataset.mediaChoice));

                if (result && (result.changes?.length || result.temporary?.length || result.xp)) {
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
