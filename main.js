// main.js
import { GameEngine } from './gameEngine.js';
import { UserInterface } from './ui.js';
import './ui-hotfix.js?v=5';
import './ui-gameplay-hotfix.js?v=2';
import { AwardsSystem } from './awardsSystem.js';

function showFatalError(error) {
    console.error("Erreur critique lors du chargement du jeu :", error);
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = `
            <div style="min-height:100vh;padding:40px 24px;background:#070b14;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;">
                <div>
                    <h1 style="font-size:28px;margin-bottom:12px;">Street to Pro</h1>
                    <p style="color:#94a3b8;">Le jeu rencontre un problème au démarrage.</p>
                    <p style="color:#64748b;font-size:13px;margin-top:16px;">Recharge la page. Si le problème persiste, la console contient le détail technique.</p>
                </div>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log("⚡ Démarrage de Street to Pro...");

    try {
        window.game = new GameEngine();
        AwardsSystem.ensure(window.game.state);

        if (window.game.ui && typeof window.game.ui.init === 'function') {
            window.game.ui.init();
        } else {
            throw new Error("L'interface utilisateur n'a pas pu être initialisée.");
        }

        await import('./awardsIntegration.js?v=4');

        console.log("✅ Street to Pro prêt.");
    } catch (error) {
        showFatalError(error);
    }
});
