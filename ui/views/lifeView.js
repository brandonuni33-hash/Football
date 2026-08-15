// ui/views/lifeView.js
// Espace Vie : coach, proches, vestiaire et médias uniquement lorsqu'ils comptent.

const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const category = note => String(note?.category || note?.type || '').toLowerCase();
const signals = state => (Array.isArray(state?.notifications) ? state.notifications : (state?.notifications?.signals || []))
    .filter(note => note && !note.archived);

function latest(state, test) { return [...signals(state)].reverse().find(test) || null; }
function relationRows(state = {}) {
    const source = Array.isArray(state.relationshipNetwork) && state.relationshipNetwork.length
        ? state.relationshipNetwork
        : (Array.isArray(state.social?.relationships) ? state.social.relationships : []);
    return source.slice(0, 6);
}
function mediaUnlocked(state = {}) {
    const player = state.player || {}, media = state.media || {}, stats = player.stats || {};
    if (media.proCoverageUnlocked === true) return true;
    const explicit = Number(stats.professionalMatches ?? stats.proMatches);
    if (Number.isFinite(explicit)) return explicit > 0;
    return Number(player.age || 0) >= 19 && Number(stats.matchesPlayed || 0) > 0;
}

export class LifeView {
    constructor({ ui, gateway } = {}) { this.ui = ui; this.gateway = gateway; }

    render(state = this.gateway?.state) {
        const coach = latest(state, note => category(note).includes('coach'));
        const family = latest(state, note => /family|famille|birth/.test(category(note)));
        const rows = relationRows(state);
        const dilemma = mediaUnlocked(state) ? state?.media?.recentDilemma : null;
        const sections = [];

        if (state?.pendingCoachEvent || coach) {
            const item = state.pendingCoachEvent || coach;
            sections.push(`<article class="app-pane" style="margin:0;"><small style="color:#7ccfd0;font-weight:900;letter-spacing:.08em;">COACH</small><strong style="display:block;margin-top:6px;">${escapeHtml(item.title || 'Le coach')}</strong>${item.description || item.message || item.body ? `<p style="margin:6px 0 0;color:var(--text-sub);font-size:.8rem;line-height:1.45;">${escapeHtml(item.description || item.message || item.body)}</p>` : ''}</article>`);
        }

        if (rows.length) {
            sections.push(`<section class="app-pane" style="margin:0;"><small style="color:#7ccfd0;font-weight:900;letter-spacing:.08em;">VESTIAIRE</small><div style="display:grid;gap:8px;margin-top:10px;">${rows.map(rel => `<div style="display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.07);"><span><strong style="display:block;font-size:.82rem;">${escapeHtml(rel.name || rel.displayName || rel.role || 'Coéquipier')}</strong><small style="color:var(--text-sub);">${escapeHtml(rel.role || rel.type || 'Relation')}</small></span>${rel.score !== undefined || rel.value !== undefined ? `<strong style="font-size:.76rem;">${escapeHtml(rel.score ?? rel.value)}/100</strong>` : ''}</div>`).join('')}</div></section>`);
        }

        if (family) {
            sections.push(`<article class="app-pane" style="margin:0;"><small style="color:#bba5d5;font-weight:900;letter-spacing:.08em;">PROCHES</small><strong style="display:block;margin-top:6px;">${escapeHtml(family.title || 'Ta famille')}</strong><p style="margin:6px 0 0;color:var(--text-sub);font-size:.8rem;line-height:1.45;">${escapeHtml(family.body || family.message || family.description || '')}</p></article>`);
        }

        if (dilemma) {
            sections.push(`<section class="app-pane" style="margin:0;border-color:rgba(236,72,153,.25);"><small style="color:#f08ab8;font-weight:900;letter-spacing:.08em;">MÉDIAS</small><strong style="display:block;margin-top:6px;">${escapeHtml(dilemma.title || 'Une prise de parole compte')}</strong><p style="color:var(--text-sub);font-size:.8rem;line-height:1.45;">${escapeHtml(dilemma.description || '')}</p><div style="display:grid;gap:7px;">${(dilemma.choices || []).map((choice, index) => `<button class="btn-event-choice" type="button" data-life-media-choice="${index}" style="margin:0;">${escapeHtml(choice.text || choice.texte || '')}</button>`).join('')}</div></section>`);
        }

        return `<div style="display:grid;gap:11px;">
            <header><span style="color:#7ccfd0;font-size:.56rem;font-weight:900;letter-spacing:.1em;">VIE</span><h2 style="margin:5px 0 2px;font-size:1.3rem;">Les personnes qui comptent</h2><p style="margin:0;color:var(--text-sub);font-size:.75rem;">Coach, proches, coéquipiers et rivalités n'apparaissent ici que lorsqu'ils ont une place dans ta carrière.</p></header>
            ${sections.join('') || '<div class="app-pane" style="margin:0;color:var(--text-sub);font-size:.82rem;">Aucune relation ne demande ton attention pour le moment.</div>'}
        </div>`;
    }

    bind(root) {
        root?.querySelectorAll('[data-life-media-choice]').forEach(button => button.addEventListener('click', () => {
            const result = this.gateway.resolveMediaDilemma(Number(button.dataset.lifeMediaChoice));
            if (result?.responseText || result?.immediateReaction || result?.changes?.length || result?.temporary?.length) {
                this.ui?.afficherModaleConsequences?.(result, () => this.ui?.renderActiveApp?.());
            } else this.ui?.renderActiveApp?.();
        }));
    }
}

export default LifeView;
