// ui/views/transferView.js
// Présentation pure du mercato et d'une éventuelle offre officielle.

const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

function resolveOffer(input) {
    if (!input || typeof input !== 'object') return null;
    const candidate = Object.prototype.hasOwnProperty.call(input, 'pendingTransferOffer')
        ? input.pendingTransferOffer
        : input;
    if (!candidate || typeof candidate !== 'object') return null;
    const club = candidate.club || candidate.clubName || candidate.club?.name || candidate.club?.nom;
    if (!club) return null;
    return { ...candidate, club };
}

function marketContext(input) {
    if (!input || typeof input !== 'object' || !Object.prototype.hasOwnProperty.call(input, 'pendingTransferOffer')) {
        return { interests: [], activity: [] };
    }
    return {
        interests: Array.isArray(input.transferInterests) ? input.transferInterests.filter(item => item?.stage !== 'closed') : [],
        activity: Array.isArray(input.transferMarket?.activity) ? input.transferMarket.activity.slice(-4).reverse() : []
    };
}

export class TransferView {
    constructor({ ui, gateway } = {}) {
        this.ui = ui;
        this.gateway = gateway;
    }

    render(input) {
        const offer = resolveOffer(input);
        const { interests, activity } = marketContext(input);

        if (!offer) {
            return `
                <section class="app-pane transfer-market-pane" data-view="transfer">
                    <h3 class="pane-title">⇄ Mercato</h3>
                    <div style="padding:18px;border:1px solid var(--border-glass);border-radius:16px;background:rgba(255,255,255,.04);text-align:center;">
                        <div style="font-size:1.8rem;margin-bottom:8px;">⌛</div>
                        <strong>Aucune offre officielle</strong>
                        <p style="font-size:.8rem;color:var(--text-sub);margin:7px 0 0;">Les clubs doivent d'abord te suivre, se renseigner puis passer à l'action. Une offre apparaîtra ici uniquement lorsqu'un club précis aura réellement formulé une proposition.</p>
                    </div>
                    ${interests.length ? `
                        <div style="margin-top:14px;padding:12px;border:1px solid var(--border-glass);border-radius:14px;background:rgba(255,255,255,.035);">
                            <strong style="font-size:.82rem;">Intérêts en cours : ${interests.length}</strong>
                            <p style="font-size:.72rem;color:var(--text-sub);margin:5px 0 0;">Des clubs suivent ton profil, mais aucune proposition officielle n'est encore arrivée.</p>
                        </div>
                    ` : ''}
                    ${activity.length ? `
                        <div style="margin-top:14px;">
                            <h4 style="margin:0 0 8px;font-size:.8rem;">Activité récente</h4>
                            <div style="display:flex;flex-direction:column;gap:7px;">
                                ${activity.map(item => `<div style="padding:9px 10px;border-radius:11px;background:rgba(255,255,255,.035);font-size:.72rem;color:var(--text-sub);">${escapeHtml(item?.label || item?.message || item?.type || 'Mouvement sur le marché')}</div>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </section>
            `;
        }

        const salary = Number(offer.salaireHebdo || offer.salary || 0);
        const amount = Number(offer.montant || offer.amount || 0);
        return `
            <section class="app-pane transfer-market-pane" data-view="transfer">
                <h3 class="pane-title">⇄ Mercato</h3>
                <div class="event-modal-card" style="margin:0;max-width:none;">
                    <div class="event-modal-category">📨 Offre officielle</div>
                    <h3 class="event-modal-title">${escapeHtml(offer.club)}</h3>
                    <p class="event-modal-desc">${escapeHtml(offer.message || 'Une proposition officielle vient d’arriver pour poursuivre ta carrière.')}</p>
                    ${amount ? `<p><strong>Montant :</strong> ${amount.toLocaleString('fr-FR')} €</p>` : ''}
                    ${salary ? `<p><strong>Salaire :</strong> ${salary.toLocaleString('fr-FR')} € / semaine</p>` : ''}
                    ${offer.rolePropose ? `<p><strong>Rôle :</strong> ${escapeHtml(offer.rolePropose)}</p>` : ''}
                    ${offer.reputationClub ? `<p><strong>Réputation du club :</strong> ${escapeHtml(offer.reputationClub)}</p>` : ''}
                    <div class="transfer-actions">
                        <button class="btn-event-choice" data-transfer-action="accept">Accepter</button>
                        <button class="btn-event-choice" data-transfer-action="reject">Refuser</button>
                    </div>
                </div>
            </section>
        `;
    }

    bind(root) {
        root?.querySelector('[data-transfer-action="accept"]')?.addEventListener('click', () => {
            const result = this.gateway.acceptTransferOffer();
            this.ui?.handleBlockResult?.(result);
        });
        root?.querySelector('[data-transfer-action="reject"]')?.addEventListener('click', () => {
            this.gateway.rejectTransferOffer();
            this.ui?.renderDashboard?.();
        });
    }
}

export default TransferView;
