// main.js
import { GameEngine } from './gameEngine.js';
import { AwardsSystem } from './awardsSystem.js';
import GameApplication from './application/gameApplication.js';
import { createSystemRegistry } from './application/systemRegistry.js';
import { bindEngineToRegistry } from './application/engineFacade.js';
import './ui-hotfix.js?v=5';
import './ui-gameplay-hotfix.js?v=2';

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
        // Composition root unique : les systèmes sont assemblés une seule fois.
        window.game = new GameEngine();
        window.gameSystems = createSystemRegistry({
            engine: window.game,
            worldSystem: window.game.worldSystem,
            competitionSystem: window.game.competitionSystem,
            cupSystem: window.game.cupSystem
        });

        // Compatibilité transitoire : l'UI garde son API historique alors que
        // les workflows principaux sont désormais exécutés par le domaine.
        bindEngineToRegistry(window.game, window.gameSystems);

        window.gameApp = new GameApplication({
            engine: window.game,
            registry: window.gameSystems
        });
        window.gameApp.start();

        AwardsSystem.ensure(window.game.state);

        if (window.game.ui && typeof window.game.ui.init === 'function') {
            window.game.ui.init();
        } else {
            throw new Error("L'interface utilisateur n'a pas pu être initialisée.");
        }

        await import('./awardsIntegration.js?v=4');
        console.log("✅ Street to Pro prêt — architecture phase 2.");
    } catch (error) {
        showFatalError(error);
    }
});
