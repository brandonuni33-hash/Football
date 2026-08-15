// ui/views/statsView.js
// Vue présentation des statistiques publiques du joueur.

export class StatsView {
    render(state) {
        const player = state?.player || {};
        const stats = player.stats || {};
        const attr = player.attributes || {};
        return `
            <div class="app-pane" data-view="stats">
                <h3 class="pane-title">📊 Statistiques & Attributs</h3>
                <div style="display:flex;justify-content:space-around;background:rgba(255,255,255,.05);padding:10px;border-radius:12px;text-align:center;font-size:.85rem;margin-bottom:12px;">
                    <div>🎮 Matchs<br><strong>${stats.matchesPlayed || 0}</strong></div>
                    <div>⚽ Buts<br><strong>${stats.goals || 0}</strong></div>
                    <div>🎯 Passes<br><strong>${stats.assists || 0}</strong></div>
                </div>
                <hr style="border-color:var(--border-glass);margin:12px 0;">
                <h4 style="margin:0 0 10px;">⚡ Général (${player.overall ?? '—'}) | Potentiel (${player.potential ?? '—'})</h4>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    ${[
                        ['🏃‍♂️ Vitesse','vitesse'],['🎯 Tir','tir'],['🎯 Passe','passe'],
                        ['✨ Dribble','dribble'],['🛡️ Défense','defense'],['💪 Physique','physique']
                    ].map(([label,key]) => `<div class="stat-pill">${label} <strong>${attr[key] ?? 50}</strong></div>`).join('')}
                </div>
            </div>
        `;
    }

    bind() {}
}

export default StatsView;
