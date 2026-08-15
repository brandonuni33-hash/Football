// ui/views/bankView.js
// Vue présentation des finances personnelles.

export class BankView {
    render(state) {
        const career = state?.career || {};
        const player = state?.player || {};
        const balance = Number(career.balance || 0).toLocaleString('fr-FR');
        const salary = Number(player.salary || 0).toLocaleString('fr-FR');
        return `
            <div class="app-pane" data-view="bank">
                <h3 class="pane-title">🏦 Banque & Finances</h3>
                <div style="background:linear-gradient(135deg,#10b981,#047857);padding:20px;border-radius:20px;text-align:center;margin-bottom:14px;box-shadow:0 8px 20px rgba(16,185,129,.3);">
                    <span style="font-size:.8rem;text-transform:uppercase;letter-spacing:1px;opacity:.9;">Solde disponible</span>
                    <div style="font-size:2rem;font-weight:900;margin-top:4px;">${balance} €</div>
                </div>
                <p style="font-size:.88rem;"><strong>Salaire hebdomadaire :</strong> ${salary} € / sem.</p>
            </div>
        `;
    }

    bind() {}
}

export default BankView;
