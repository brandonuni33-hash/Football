// main.js
// Point d'entrée web minimal : le bootstrap applicatif vit dans application/.
import { GameEngine } from './application/gameEngine.js';

function showFatalError(error) {
    console.error('Erreur critique lors du chargement du jeu :', error);
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

async function tryMountSouvenirTest() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('souvenir') !== '1') return false;

    const { mountSouvenirExperience } = await import('./ui/souvenirExperience.js?v=1');
    mountSouvenirExperience();
    console.log('🧠 Test Souvenir 1 monté depuis le vrai jeu.');
    return true;
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('⚡ Démarrage de Street to Pro...');
    try {
        if (await tryMountSouvenirTest()) return;

        window.game = new GameEngine();
        if (window.game.ui && typeof window.game.ui.init === 'function') window.game.ui.init();
        else throw new Error("L'interface utilisateur n'a pas pu être initialisée.");
        console.log('✅ Street to Pro prêt.');
    } catch (error) {
        showFatalError(error);
    }
});
