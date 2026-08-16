import { createIdentityStepState } from './verticalSlice/playerCreationIdentityStep.js';
import { createAppearanceStepState } from './verticalSlice/playerCreationAppearanceStep.js';
import { createPositionAndFootStepState } from './verticalSlice/playerCreationPositionAndFootStep.js';
import { createNationalitiesStepState } from './verticalSlice/playerCreationNationalitiesStep.js';
import { createChildhoodCountryStepState } from './verticalSlice/playerCreationChildhoodCountryStep.js';
import { toCareerCreationIdentity } from './verticalSlice/playerCreationDraft.js';
import { mountPlayerCreationIdentity, PLAYER_CREATION_IDENTITY_CSS } from './verticalSlice/playerCreationIdentityView.js';
import { mountPlayerCreationAppearance, PLAYER_CREATION_APPEARANCE_CSS } from './verticalSlice/playerCreationAppearanceView.js';
import { mountPlayerCreationPositionAndFoot, PLAYER_CREATION_POSITION_AND_FOOT_CSS } from './verticalSlice/playerCreationPositionAndFootView.js';
import { mountPlayerCreationNationalities, PLAYER_CREATION_NATIONALITIES_CSS } from './verticalSlice/playerCreationNationalitiesView.js';
import { mountPlayerCreationChildhoodCountry, PLAYER_CREATION_CHILDHOOD_COUNTRY_CSS } from './verticalSlice/playerCreationChildhoodCountryView.js';
import { mountPastFragments, PAST_FRAGMENTS_CSS } from './verticalSlice/pastFragmentsView.js';
import { PAST_FRAGMENTS } from '../content/verticalSlice/pastFragments.js';

const STEPS = ['identity', 'appearance', 'positionAndFoot', 'nationalities', 'childhoodCountry'];
const MOUNTS = {
    identity: mountPlayerCreationIdentity,
    appearance: mountPlayerCreationAppearance,
    positionAndFoot: mountPlayerCreationPositionAndFoot,
    nationalities: mountPlayerCreationNationalities,
    childhoodCountry: mountPlayerCreationChildhoodCountry
};
const STATE_FACTORIES = {
    identity: createIdentityStepState,
    appearance: createAppearanceStepState,
    positionAndFoot: createPositionAndFootStepState,
    nationalities: createNationalitiesStepState,
    childhoodCountry: createChildhoodCountryStepState
};

let stylesInstalled = false;
function installStyles() {
    if (stylesInstalled || typeof document === 'undefined') return;
    stylesInstalled = true;
    const style = document.createElement('style');
    style.id = 'stp-player-creation-flow-styles';
    style.textContent = `${PLAYER_CREATION_IDENTITY_CSS}\n${PLAYER_CREATION_APPEARANCE_CSS}\n${PLAYER_CREATION_POSITION_AND_FOOT_CSS}\n${PLAYER_CREATION_NATIONALITIES_CSS}\n${PLAYER_CREATION_CHILDHOOD_COUNTRY_CSS}\n${PAST_FRAGMENTS_CSS}
      html:has(.stp-player-creation-flow),body:has(.stp-player-creation-flow){background:#050505;overflow:hidden}
      .stp-player-creation-flow{box-sizing:border-box;width:100%;max-width:430px;height:100vh;height:100dvh;margin:0 auto;overflow:hidden;background:#050505;position:relative;padding-top:env(safe-area-inset-top,0)}
      .stp-player-creation-screen{height:100%;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none;scroll-behavior:smooth}
      .stp-player-creation-screen::-webkit-scrollbar{display:none}
      .stp-player-creation-screen>section:not(.stp-memory-stage){animation:stp-creation-enter .22s cubic-bezier(.2,.72,.25,1) both;padding-bottom:calc(82px + env(safe-area-inset-bottom,0px))}
      .stp-player-creation-back{position:absolute;z-index:20;left:14px;top:calc(12px + env(safe-area-inset-top,0px));width:40px;height:40px;border-radius:13px;border:1px solid rgba(255,255,255,.11);background:rgba(8,8,8,.82);backdrop-filter:blur(12px);color:#f4f1e9;font:700 21px/1 system-ui;display:grid;place-items:center;box-shadow:0 8px 20px rgba(0,0,0,.28)}
      .stp-player-creation-flow.has-back .stp-creation-brand{padding-left:44px}
      .stp-player-creation-flow .stp-creation-footer{position:sticky;bottom:0;z-index:12;margin-top:auto;padding:12px 22px calc(14px + env(safe-area-inset-bottom,0px));background:linear-gradient(180deg,transparent 0,#070707 24%,#070707 100%);backdrop-filter:blur(8px)}
      .stp-player-creation-flow .stp-continue{transition:transform .14s ease,background .18s ease,color .18s ease}.stp-player-creation-flow .stp-continue:active:not(:disabled){transform:scale(.985)}
      .stp-player-creation-flow.is-submitting{pointer-events:none;opacity:.82}
      @keyframes stp-creation-enter{from{opacity:.55;transform:translateX(14px)}to{opacity:1;transform:none}}
      @media (prefers-reduced-motion:reduce){.stp-player-creation-screen>section{animation:none}.stp-player-creation-flow .stp-continue{transition:none}}
      @media (max-height:760px){.stp-creation-hero{padding-top:24px}.stp-body-stage{min-height:260px}.stp-position-pitch{height:350px}}
    `;
    document.head.appendChild(style);
}

function stateFor(step, draft) {
    return step === 'identity'
        ? createIdentityStepState(draft)
        : STATE_FACTORIES[step]({ draft });
}

export class PlayerCreationFlowController {
    constructor(ui) {
        this.ui = ui;
        this.state = createIdentityStepState(ui.selectedData || {});
        this.submitting = false;
        this.pendingCareerIdentity = null;
        this.memoryAnswers = [];
        installStyles();
    }

    reset(seed = {}) {
        this.state = createIdentityStepState(seed);
        this.submitting = false;
        this.pendingCareerIdentity = null;
        this.memoryAnswers = [];
    }

    render() {
        const app = this.ui.initDOM();
        const index = STEPS.indexOf(this.state.step);
        app.innerHTML = `<main class="stp-player-creation-flow${index > 0 ? ' has-back' : ''}" data-creation-flow="modern"><div class="stp-player-creation-screen"></div>${index > 0 ? '<button class="stp-player-creation-back" type="button" aria-label="Revenir à l’étape précédente">‹</button>' : ''}</main>`;
        const flow = app.querySelector('.stp-player-creation-flow');
        const screen = app.querySelector('.stp-player-creation-screen');
        const mount = MOUNTS[this.state.step];
        mount(screen, this.state, {
            onChange: next => {
                this.state = next;
                this.ui.selectedData = { ...next.draft };
            },
            onContinue: result => {
                if (this.state.step === 'childhoodCountry') return this.finishCreation(flow, result.state);
                this.state = stateFor(result.nextStep, result.state.draft);
                this.ui.selectedData = { ...this.state.draft };
                this.render();
            }
        });
        app.querySelector('.stp-player-creation-back')?.addEventListener('click', () => this.back());
        return app.innerHTML;
    }

    back() {
        const index = STEPS.indexOf(this.state.step);
        if (index <= 0) return;
        this.state = stateFor(STEPS[index - 1], this.state.draft);
        this.ui.selectedData = { ...this.state.draft };
        this.render();
    }

    finishCreation(flow, completedState) {
        if (this.submitting) return;
        this.submitting = true;
        flow?.classList.add('is-submitting');
        try {
            this.pendingCareerIdentity = toCareerCreationIdentity(completedState.draft);
            this.ui.selectedData = { ...this.pendingCareerIdentity };
            this.submitting = false;
            this.renderMemories();
        } catch (error) {
            this.submitting = false;
            flow?.classList.remove('is-submitting');
            throw error;
        }
    }

    renderMemories() {
        const app = this.ui.initDOM();
        app.innerHTML = '<main class="stp-player-creation-flow stp-memory-flow" data-memory-flow="past"><div class="stp-player-creation-screen"></div></main>';
        const screen = app.querySelector('.stp-player-creation-screen');
        this.memoryAnswers = [];
        mountPastFragments(screen, PAST_FRAGMENTS, {
            onAnswer: ({ fragment, answerId }) => {
                this.memoryAnswers.push({ fragmentId: fragment.id, answerId });
            },
            onComplete: answers => this.completeMemories(answers)
        });
    }

    completeMemories(answers = this.memoryAnswers) {
        if (this.submitting || !this.pendingCareerIdentity) return;
        this.submitting = true;
        try {
            const selectedData = Object.freeze({
                ...this.pendingCareerIdentity,
                pastFragmentAnswers: [...answers]
            });
            this.ui.selectedData = { ...selectedData };
            const state = this.ui.gateway?.startCareer?.(selectedData) || this.ui.engine?.startCareer?.(selectedData);
            if (!state?.player) throw new Error('La carrière n’a pas pu être créée.');
            this.ui.currentStep = 1;
            this.ui.activeApp = 'career';
            this.ui.renderDashboard(state);
        } catch (error) {
            this.submitting = false;
            throw error;
        }
    }
}

export default PlayerCreationFlowController;
