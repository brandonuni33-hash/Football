// ui/views/familyView.js
// Présentation de la vie familiale et de la seconde génération.
const escapeHtml=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const isFamilyNote=note=>{const c=String(note?.category||note?.type||'').toLowerCase();return c.includes('famille')||c.includes('family')||c.includes('birth');};
export class FamilyView {
    constructor({ui,gateway}={}){this.ui=ui;this.gateway=gateway;}
    render(state=this.gateway?.state){
        const playerId=state?.player?.id,family=state?.family||{},social=state?.social||{};
        const children=(family.children||[]).filter(child=>child.parentPlayerId===playerId);
        const currentAge=Number(state?.player?.age||0);
        const partner=social.romance?.unlocked?(social.romance.partnerName||'En couple'):'Célibataire';
        const options=currentAge>=34?(this.gateway.getSuccessorOptions?.(playerId,currentAge)||[]):[];
        const familyNotes=(state?.notifications?.signals||[]).filter(note=>!note?.archived&&isFamilyNote(note)).slice(-8);
        return `<section class="app-pane family-view" data-view="family">
            <h3 class="pane-title">👨‍👩‍👦 Famille & Héritage</h3>
            <p style="font-size:.85rem;color:var(--text-sub);">Votre vie privée évolue avec votre carrière. Les nouvelles liées à vos proches restent ici, séparées du journal sportif.</p>
            <div style="padding:12px 14px;border:1px solid var(--border-glass);border-radius:14px;background:rgba(255,255,255,.04);margin:12px 0;"><small style="display:block;color:var(--text-sub);margin-bottom:4px;">Statut personnel</small><strong>${escapeHtml(partner)}</strong></div>
            ${familyNotes.length?`<section style="display:grid;gap:8px;margin:12px 0 16px;"><small style="color:var(--text-sub);font-weight:800;letter-spacing:.06em;">NOUVELLES DE LA FAMILLE</small>${familyNotes.map(note=>`<article style="padding:11px 12px;border:1px solid var(--border-glass);border-radius:13px;background:rgba(255,255,255,.035);"><strong style="display:block;font-size:.84rem;">${escapeHtml(note.title||'Votre famille')}</strong><span style="display:block;margin-top:4px;font-size:.78rem;color:var(--text-sub);line-height:1.45;">${escapeHtml(note.body||note.message||'')}</span></article>`).join('')}</section>`:''}
            <div class="family-summary" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0;"><div class="stat-pill">❤️ Couples <strong>${(family.couples||[]).filter(c=>c.status==='together').length}</strong></div><div class="stat-pill">👶 Enfants <strong>${children.length}</strong></div></div>
            ${children.length===0?`<div style="padding:18px;border:1px solid var(--border-glass);border-radius:16px;background:rgba(255,255,255,.04);text-align:center;"><div style="font-size:2rem;">🌱</div><strong>Aucun enfant pour le moment</strong><p style="font-size:.8rem;color:var(--text-sub);margin-bottom:0;">Votre histoire familiale pourra évoluer au fil de la carrière.</p></div>`:children.map(child=>{const gender=String(child.gender||'').toLowerCase(),isSon=gender==='male'||gender==='garçon'||gender==='garcon',option=options.find(item=>item.childId===child.id),age=option?.age??Number(child.age||0);return `<article style="padding:14px;border:1px solid var(--border-glass);border-radius:16px;background:rgba(255,255,255,.04);margin-bottom:10px;"><div style="display:flex;justify-content:space-between;gap:10px;"><div><strong style="font-size:1rem;">${isSon?'👦':'👧'} ${escapeHtml(child.firstName||'Votre enfant')}</strong><div style="font-size:.8rem;color:var(--text-sub);">${age} ans</div></div>${isSon&&currentAge>=34?'<span style="font-size:.75rem;color:var(--accent-gold);">2e génération</span>':''}</div>${isSon&&currentAge>=34?`<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border-glass);">${option?.availableNow?`<p style="font-size:.82rem;margin:0 0 9px;">Votre fils peut maintenant commencer sa carrière à 14 ans.</p><button type="button" class="btn-event-choice" data-family-action="start" data-child-id="${escapeHtml(child.id)}">⚽ Prendre le contrôle</button>`:`<p style="font-size:.82rem;margin:0 0 9px;">Il pourra commencer à 14 ans. Encore ${option?.pendingUntil??Math.max(0,14-age)} an(s).</p><button type="button" class="btn-event-choice" data-family-action="simulate" data-child-id="${escapeHtml(child.id)}">▶️ Simuler jusqu'à 14 ans</button>`}</div>`:''}</article>`;}).join('')}
            ${children.some(child=>['male','garçon','garcon'].includes(String(child.gender||'').toLowerCase()))&&currentAge<34?`<div style="margin-top:12px;padding:12px;border-radius:14px;background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.2);font-size:.8rem;">🔒 La seconde génération sera proposée à la fin de votre carrière, à partir de 34 ans.</div>`:''}
        </section>`;
    }
}
export default FamilyView;
