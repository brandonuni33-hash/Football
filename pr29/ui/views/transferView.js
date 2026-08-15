// ui/views/transferView.js
// Présentation pure du mercato et d'une éventuelle offre officielle.

const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function resolveOffer(input) {
    if (!input || typeof input !== 'object') return null;
    const candidate = Object.prototype.hasOwnProperty.call(input, 'pendingTransferOffer') ? input.pendingTransferOffer : input;
    if (!candidate || typeof candidate !== 'object') return null;
    const club = candidate.club || candidate.clubName || candidate.club?.name || candidate.club?.nom;
    return club ? { ...candidate, club } : null;
}
function marketContext(input) {
    if (!input || typeof input !== 'object' || !Object.prototype.hasOwnProperty.call(input, 'pendingTransferOffer')) return { interests: [], activity: [], player: null };
    return { interests: Array.isArray(input.transferInterests) ? input.transferInterests.filter(item => item?.stage !== 'closed') : [], activity: Array.isArray(input.transferMarket?.activity) ? input.transferMarket.activity.slice(-4).reverse() : [], player: input.player || null };
}
function activityText(item = {}) {
    if (item.type === 'scouting_started') return 'Un observateur a commencé à suivre tes matchs.';
    if (item.type === 'scouting_completed') return 'Un suivi vient de se terminer. Le club dispose maintenant d’un vrai rapport sur toi.';
    if (item.type === 'interest_created') return 'Un club a commencé à se renseigner concrètement sur ta situation.';
    if (item.type === 'interest_stage_changed' && item.to === 'contact') return 'Le suivi a franchi une étape : le club cherche maintenant un contact direct.';
    if (item.type === 'official_offer') return 'Les discussions ont abouti à une proposition officielle.';
    return item.label || item.message || 'Quelque chose bouge autour de ton avenir.';
}
function offerStory(offer = {}, player = null) {
    if (offer.message) return offer.message;
    if (Number(player?.age || 99) < 18) return `${offer.club} ne se contente plus de t’observer. Le club veut désormais t’intégrer à sa structure et te demande de choisir si ton prochain chapitre doit commencer ailleurs.`;
    const role = offer.rolePropose ? ` Le rôle annoncé — ${offer.rolePropose} — donne une première idée de la place qu’on t’imagine.` : '';
    return `${offer.club} a transformé son intérêt en offre officielle.${role} Pour la première fois, la question n’est plus de savoir qui te suit, mais où tu veux réellement jouer.`;
}

export class TransferView {
    constructor({ ui, gateway } = {}) { this.ui = ui; this.gateway = gateway; }
    render(input) {
        const offer = resolveOffer(input);
        const { interests, activity, player } = marketContext(input);
        if (!offer) return `
            <section class="app-pane transfer-market-pane" data-view="transfer">
                <h3 class="pane-title">⇄ Mercato</h3>
                <div style="padding:18px;border:1px solid var(--border-glass);border-radius:16px;background:rgba(255,255,255,.04);text-align:center;">
                    <div style="font-size:1.8rem;margin-bottom:8px;">⌛</div>
                    <strong>Rien à décider pour l’instant</strong>
                    <p style="font-size:.8rem;color:var(--text-sub);margin:7px 0 0;">Un transfert ne commence pas avec une offre. Il commence souvent par un observateur, quelques renseignements, puis un contact. Tant qu’aucun club n’est allé au bout de ce chemin, il n’y a rien à signer.</p>
                </div>
                ${interests.length ? `<div style="margin-top:14px;padding:12px;border:1px solid var(--border-glass);border-radius:14px;background:rgba(255,255,255,.035);"><strong style="font-size:.82rem;">${interests.length} piste${interests.length > 1 ? 's' : ''} en cours</strong><p style="font-size:.72rem;color:var(--text-sub);margin:5px 0 0;">Des clubs regardent ta situation. Aucun n’a encore posé de contrat devant toi.</p></div>` : ''}
                ${activity.length ? `<div style="margin-top:14px;"><h4 style="margin:0 0 8px;font-size:.8rem;">Ce qui bouge autour de toi</h4><div style="display:flex;flex-direction:column;gap:7px;">${activity.map(item => `<div style="padding:9px 10px;border-radius:11px;background:rgba(255,255,255,.035);font-size:.72rem;color:var(--text-sub);">${escapeHtml(activityText(item))}</div>`).join('')}</div></div>` : ''}
            </section>`;

        const salary = Number(offer.salaireHebdo || offer.salary || 0), amount = Number(offer.montant || offer.amount || 0);
        return `
            <section class="app-pane transfer-market-pane" data-view="transfer">
                <h3 class="pane-title">⇄ Mercato</h3>
                <div class="event-modal-card" style="margin:0;max-width:none;">
                    <div class="event-modal-category">📨 Une décision de carrière</div>
                    <h3 class="event-modal-title">${escapeHtml(offer.club)}</h3>
                    <p class="event-modal-desc">${escapeHtml(offerStory(offer, player))}</p>
                    ${amount ? `<p><strong>Montant :</strong> ${amount.toLocaleString('fr-FR')} €</p>` : ''}
                    ${salary ? `<p><strong>Salaire :</strong> ${salary.toLocaleString('fr-FR')} € / semaine</p>` : ''}
                    ${offer.rolePropose ? `<p><strong>Rôle annoncé :</strong> ${escapeHtml(offer.rolePropose)}</p>` : ''}
                    ${offer.reputationClub ? `<p><strong>Dimension du club :</strong> ${escapeHtml(offer.reputationClub)}</p>` : ''}
                    <div class="transfer-actions">
                        <button class="btn-event-choice" data-transfer-action="accept">Choisir ${escapeHtml(offer.club)}</button>
                        <button class="btn-event-choice" data-transfer-action="reject">Rester sur ta route actuelle</button>
                    </div>
                </div>
            </section>`;
    }
    bind(root) {
        root?.querySelector('[data-transfer-action="accept"]')?.addEventListener('click', () => { const result = this.gateway.acceptTransferOffer(); this.ui?.handleBlockResult?.(result); });
        root?.querySelector('[data-transfer-action="reject"]')?.addEventListener('click', () => { this.gateway.rejectTransferOffer(); this.ui?.renderDashboard?.(); });
    }
}
export default TransferView;
