// ui/views/careerView.js
// Présentation de la progression de carrière et du journal de notifications.

const escapeHtml = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
function categoryOf(item) { return String(item?.category || item?.type || '').toLowerCase(); }
function isSocialNotification(note) { const c=categoryOf(note); return c.includes('media')||c.includes('média')||c.includes('social')||c.includes('réseau'); }
function isDedicatedSection(item) { const c=categoryOf(item); return c.includes('coach')||c.includes('family')||c.includes('famille')||c.includes('birth'); }
function notificationIcon(note) {
    const category = categoryOf(note);
    if (category.includes('transfer') || category.includes('mercato') || category.includes('scout')) return '⇄';
    if (category.includes('match')) return '⚽';
    if (category.includes('medical')) return '+';
    return '•';
}

export class CareerView {
    constructor({ ui, gateway, narrativePresenter = null } = {}) { this.ui=ui; this.gateway=gateway; this.narrativePresenter=narrativePresenter; }
    render(state) {
        const player=state?.player; if(!player)return '';
        const age=Number(player.age||0), canRetire=Boolean(player.canRetire)||age>=34;
        const squadStatus=player.squadStatus||(age<18?'En formation':'À déterminer');
        const notificationState=state?.notifications;
        // Les notifications temporaires Coach/Famille ont leur section dédiée.
        // Les entrées du Narrative Engine, elles, restent dans le journal : ce sont des faits persistants de la carrière.
        const signals=(Array.isArray(notificationState)?notificationState:(notificationState?.signals||[]))
            .filter(note=>!note?.archived&&!isSocialNotification(note)&&!isDedicatedSection(note)).slice(-30);
        const unreadCount=signals.filter(note=>!note?.read).length;
        const narrativeEntries=(this.narrativePresenter?.getJournal?.(state)||[]).slice(-20);
        return `
            <div class="app-pane career-app-pane" data-view="career">
                <div class="career-app-heading"><div><span class="career-app-kicker">TON PARCOURS</span><h3 class="pane-title">Carrière</h3></div>${unreadCount?`<span class="career-app-unread">${Math.min(99,unreadCount)}</span>`:''}</div>
                <div class="career-summary"><div><small>Âge</small><strong>${age} ans</strong></div><div><small>Club</small><strong>${escapeHtml(player.club||'Sans club')}</strong></div><div><small>Général</small><strong>${Number(player.overall||0).toFixed(0)}</strong></div></div>
                <div class="career-squad-status" style="margin:-4px 0 15px;padding:10px 12px;border:1px solid rgba(112,198,214,.12);border-radius:13px;background:rgba(255,255,255,.035);display:flex;justify-content:space-between;gap:12px;align-items:center;"><span style="font-size:.56rem;color:#74869a;font-weight:850;letter-spacing:.07em;text-transform:uppercase;">Statut dans l'effectif</span><strong style="font-size:.7rem;color:#eaf6ff;">${escapeHtml(squadStatus)}</strong></div>
                <section class="career-notification-inbox" aria-label="Actualités de carrière">
                    <div class="career-inbox-title"><div><span>JOURNAL</span><strong>Actualités de carrière</strong></div><small>${unreadCount?`${unreadCount} non lue${unreadCount>1?'s':''}`:'À jour'}</small></div>
                    <div class="career-inbox-list">
                        ${narrativeEntries.map(entry=>`<article class="career-inbox-item is-read is-narrative" data-narrative-journal-entry="${escapeHtml(entry.id)}"><span class="career-inbox-icon">${notificationIcon(entry)}</span><span class="career-inbox-copy"><strong>${escapeHtml(entry.title)}</strong><span>${escapeHtml(entry.text)}</span></span><span class="career-inbox-state">RÉCIT</span></article>`).join('')}
                        ${signals.map(note=>`<button class="career-inbox-item ${note?.read?'is-read':'is-unread'}" type="button" data-career-notification-id="${escapeHtml(note?.id)}"><span class="career-inbox-icon">${notificationIcon(note)}</span><span class="career-inbox-copy"><strong>${escapeHtml(note?.title||'Actualité')}</strong><span>${escapeHtml(note?.body||note?.message||note?.description||'')}</span></span>${note?.read?'<span class="career-inbox-state">›</span>':'<span class="career-inbox-new">NOUVEAU</span>'}</button>`).join('')||(!narrativeEntries.length?`<div class="career-inbox-empty"><span>◌</span><strong>Aucune actualité pour le moment</strong><small>Les événements importants de votre carrière apparaîtront ici au fil de votre histoire.</small></div>`:'')}
                    </div>
                </section>
                ${canRetire?`<button class="btn-event-choice career-retire-action" data-career-action="retire">Fin de carrière</button>`:''}
            </div>`;
    }
    bind(root) {
        root?.querySelectorAll('[data-career-notification-id]').forEach(button=>button.addEventListener('click',()=>this.ui?.openNotification?.(button.dataset.careerNotificationId)));
        root?.querySelector('[data-career-action="retire"]')?.addEventListener('click',()=>{const result=this.gateway.retireCareer();this.ui?.handleBlockResult?.(result);});
    }
}
export default CareerView;
