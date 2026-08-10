// ui/views/messagesView.js
// Vue présentation des messages, relations et vestiaire.

export class MessagesView {
    render(state) {
        const social = state?.social || { romance: { unlocked: false }, relationships: [] };
        const relationships = Array.isArray(social.relationships) ? social.relationships : [];
        const partner = social.romance?.unlocked ? (social.romance.partnerName || 'En couple') : 'Célibataire';
        return `
            <div class="app-pane" data-view="messages">
                <h3 class="pane-title">💬 Messages & Vestiaire</h3>
                <p><strong>Statut personnel :</strong> ${partner}</p>
                <hr style="border-color:var(--border-glass);margin:12px 0;">
                <h4 style="margin:0 0 8px;">Relations d'équipe :</h4>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    ${relationships.length
                        ? relationships.map(rel => `
                            <div style="display:flex;justify-content:space-between;background:rgba(255,255,255,.05);padding:8px 12px;border-radius:10px;font-size:.85rem;">
                                <span>${rel?.role || 'Coéquipier'} (${rel?.name || 'Inconnu'})</span>
                                <strong>${rel?.score || 50}/100</strong>
                            </div>
                        `).join('')
                        : '<p style="font-size:.85rem;color:var(--text-sub);">Aucune interaction récente dans le vestiaire.</p>'}
                </div>
            </div>
        `;
    }

    bind() {}
}

export default MessagesView;
