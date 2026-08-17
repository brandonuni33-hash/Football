// ui/verticalSlice/playerCreationFlowController.js
// Parcours officiel de création joueur. Cette orchestration remplace l'ancienne
// création 5 étapes et transmet uniquement les données validées au domaine.

import { createIdentityStepState } from './playerCreationIdentityStep.js';
import { toCareerCreationIdentity } from './playerCreationDraft.js';
import {
    mountPlayerCreationIdentity,
    PLAYER_CREATION_IDENTITY_CSS
} from './playerCreationIdentityView.js';
import {
    mountPlayerCreationAppearance,
    PLAYER_CREATION_APPEARANCE_CSS
} from './playerCreationAppearanceView.js';
import {
    mountPlayerCreationBody,
    PLAYER_CREATION_BODY_CSS
} from './playerCreationBodyView.js';
import {
    mountPlayerCreationPositionAndFoot,
    PLAYER_CREATION_POSITION_AND_FOOT_CSS
} from './playerCreationPositionAndFootView.js';
import {
    mountPlayerCreationNationalities,
    PLAYER_CREATION_NATIONALITIES_CSS
} from './playerCreationNationalitiesView.js';
import {
    mountPlayerCreationChildhoodCountry,
    PLAYER_CREATION_CHILDHOOD_COUNTRY_CSS
} from './playerCreationChildhoodCountryView.js';

export const PLAYER_CREATION_STEPS = Object.freeze([
    Object.freeze({ id: 'identity', mount: mountPlayerCreationIdentity }),
    Object.freeze({ id: 'appearance', mount: mountPlayerCreationAppearance }),
    Object.freeze({ id: 'body', mount: mountPlayerCreationBody }),
    Object.freeze({ id: 'positionAndFoot', mount: mountPlayerCreationPositionAndFoot }),
    Object.freeze({ id: 'nationalities', mount: mountPlayerCreationNationalities }),
    Object.freeze({ id: 'childhoodCountry', mount: mountPlayerCreationChildhoodCountry })
]);

const INTEGRATION_CSS = `
html.stp-player-creation-mode,html.stp-player-creation-mode body{margin:0;min-height:100%;background:#050505;color:#f7f7f4}
html.stp-player-creation-mode body{min-height:100dvh;overflow:hidden;overscroll-behavior:none}
#app.stp-player-creation-app{width:100%;height:100vh;height:100dvh;max-width:520px;margin:0 auto;background:#050505;overflow:hidden}
.stp-player-creation-flow{position:relative;width:100%;height:100%;overflow:hidden;background:#050505}
.stp-player-creation-view{width:100%;height:100%;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;padding-bottom:env(safe-area-inset-bottom,0px)}
.stp-player-creation-view>[data-stp-step]{box-sizing:border-box;min-height:100%;padding-bottom:max(8px,env(safe-area-inset-bottom,0px))}
.stp-player-creation-back{position:absolute;z-index:50;top:max(62px,calc(env(safe-area-inset-top,0px) + 48px));left:14px;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.10);background:rgba(5,5,5,.76);color:#ddd8ce;font:700 19px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:grid;place-items:center;box-shadow:0 7px 22px rgba(0,0,0,.22);touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.stp-player-creation-back:active{transform:scale(.96)}
.stp-player-creation-error{position:absolute;z-index:60;left:18px;right:18px;bottom:max(18px,env(safe-area-inset-bottom,0px));padding:12px 14px;border:1px solid rgba(239,68,68,.34);border-radius:14px;background:rgba(25,8,8,.92);color:#fecaca;font:600 12px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
@media(min-width:600px){#app.stp-player-creation-app{box-shadow:0 0 70px rgba(0,0,0,.5)}}
`;

function installStyles() {
    if (document.getElementById('stp-player-creation-styles')) return;
    const style = document.createElement('style');
    style.id = 'stp-player-creation-styles';
    style.textContent = [
        INTEGRATION_CSS,
        PLAYER_CREATION_IDENTITY_CSS,
        PLAYER_CREATION_APPEARANCE_CSS,
        PLAYER_CREATION_BODY_CSS,
        PLAYER_CREATION_POSITION_AND_FOOT_CSS,
        PLAYER_CREATION_NATIONALITIES_CSS,
        PLAYER_CREATION_CHILDHOOD_COUNTRY_CSS
    ].join('\n');
    document.head.appendChild(style);
}

function careerPayloadFromDraft(draft) {
    const identity = toCareerCreationIdentity(draft);
    return Object.freeze({
        ...identity,
        // L'environnement d'enfance et la nationalité sont deux faits distincts.
        country: identity.raisedInCountry,
        nationality: identity.primaryNationality,
        primaryNationality: identity.primaryNationality,
        secondaryNationality: identity.secondaryNationality || null,
        raisedInCountry: identity.raisedInCountry,
        age: 14,
        origin: null,
        youthClub: null,
        heartClub: null
    });
}

export class PlayerCreationFlowController {
    constructor(ui) {
        if (!ui) throw new Error('PlayerCreationFlowController requires a UserInterface.');
        this.ui = ui;
        this.stepIndex = 0;
        this.state = createIdentityStepState();
        this.root = null;
        this.view = null;
        installStyles();
    }

    mount() {
        const app = this.ui.initDOM();
        document.documentElement.classList.add('stp-player-creation-mode');
        app.className = 'stp-player-creation-app';
        app.innerHTML = `
            <main class="stp-player-creation-flow" aria-label="Création du joueur">
                <button class="stp-player-creation-back" type="button" aria-label="Étape précédente">‹</button>
                <div class="stp-player-creation-view"></div>
            </main>`;
        this.root = app.querySelector('.stp-player-creation-flow');
        this.view = app.querySelector('.stp-player-creation-view');
        app.querySelector('.stp-player-creation-back')?.addEventListener('click', () => this.back());
        this.renderStep();
        return app.innerHTML;
    }

    renderStep() {
        const step = PLAYER_CREATION_STEPS[this.stepIndex];
        if (!step || !this.view) return;
        const back = this.root?.querySelector('.stp-player-creation-back');
        if (back) back.hidden = this.stepIndex === 0;
        this.clearError();
        this.view.scrollTop = 0;

        step.mount(this.view, this.state, {
            onChange: nextState => { this.state = nextState; },
            onContinue: result => {
                this.state = result.state;
                if (this.stepIndex === PLAYER_CREATION_STEPS.length - 1) {
                    this.finish();
                    return;
                }
                this.stepIndex += 1;
                this.renderStep();
            }
        });
    }

    back() {
        if (this.stepIndex <= 0) return;
        this.stepIndex -= 1;
        const step = PLAYER_CREATION_STEPS[this.stepIndex];
        this.state = Object.freeze({
            ...this.state,
            step: step.id,
            screenIndex: this.stepIndex + 1,
            screenCount: PLAYER_CREATION_STEPS.length
        });
        this.renderStep();
    }

    finish() {
        try {
            const payload = careerPayloadFromDraft(this.state.draft);
            const careerState = this.ui.gateway?.startCareer(payload);
            if (!careerState?.player) throw new Error('La carrière n’a pas pu être créée.');
            document.documentElement.classList.remove('stp-player-creation-mode');
            const app = this.ui.initDOM();
            app.className = '';
            this.ui.activeApp = 'home';
            this.ui.render();
        } catch (error) {
            console.error('[STP] échec de finalisation de la création joueur', error);
            this.showError('Impossible de terminer la création. Vérifie les informations puis réessaie.');
        }
    }

    showError(message) {
        this.clearError();
        const node = document.createElement('div');
        node.className = 'stp-player-creation-error';
        node.setAttribute('role', 'alert');
        node.textContent = message;
        this.root?.appendChild(node);
    }

    clearError() {
        this.root?.querySelector('.stp-player-creation-error')?.remove();
    }
}

export { careerPayloadFromDraft };
export default PlayerCreationFlowController;
