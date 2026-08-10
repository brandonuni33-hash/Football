// main.js
import { GameEngine } from './gameEngine.js';
import { AwardsSystem } from './awardsSystem.js';
import GameApplication from './application/gameApplication.js';
import LegacyGameBridge from './application/legacyGameBridge.js';

// L'intégration des récompenses monkey-patche GameEngine et importe lui-même
// GameEngine. Elle doit donc être chargée APRÈS l'initialisation du module
// GameEngine pour éviter une dépendance circulaire au démarrage.

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
        // 1. Le moteur historique reste l'implémentation métier pendant la migration.
        window.game = new GameEngine();

        // 2. Nouvelle couche applicative : elle ne remplace pas encore le moteur,
        // elle fournit la future porte d'entrée stable pour l'UI.
        window.gameApp = new GameApplication({ engine: window.game });
        window.gameBridge = new LegacyGameBridge(window.game);
        window.gameBridge.start();

        // 3. Initialise/migre le palmarès même pour une ancienne sauvegarde.
        AwardsSystem.ensure(window.game.state);

        // 4. L'interface historique reste disponible pendant la migration.
        if (window.game.ui && typeof window.game.ui.init === 'function') {
            window.game.ui.init();
        } else {
            throw new Error("L'interface utilisateur n'a pas pu être initialisée.");
        }

        // 5. Après l'initialisation complète, on applique le patch des récompenses.
        // Le module importe GameEngine : le chargement différé évite la boucle
        // GameEngine -> awardsIntegration -> GameEngine au démarrage.
        await import('./awardsIntegration.js?v=3');

        console.log("✅ Street to Pro prêt.");
    } catch (error) {
        showFatalError(error);
    }
});
