// events.js
import { StateManager } from './state.js';

const NARRATIVE_EVENTS = [
    {
        id: 'futsal_dribble_issue',
        triggerCondition: (state) => state.player.origin === 'FUTSAL' && state.career.phaseIndex === 1,
        title: 'Remontrance du Coach',
        description: `"Tu n'es plus sur un city-stade ! Lâche ton ballon plus vite !" Le coach vous reproche vos gris-gris dans votre moitié de terrain.`,
        choices: [
            {
                label: "S'excuser et jouer simple",
                impact: (state) => {
                    state.player.relations.coach += 10;
                    state.player.stats.tactique += 2;
                    state.player.relations.arrogance -= 5;
                    return "Le coach apprécie votre réactivité. Vous apprenez la rigueur tactique.";
                }
            },
            {
                label: "L'ignorer et tenter un petit pont",
                impact: (state) => {
                    const success = Math.random() > 0.5;
                    if (success) {
                        state.career.fame += 10;
                        state.player.relations.coach -= 5;
                        return "Le stade s'enflamme sur votre geste ! Le coach fulmine mais le public adore.";
                    } else {
                        state.player.relations.coach -= 20;
                        state.player.relations.arrogance += 10;
                        return "Perte de balle dangereuse... Vous finissez sur le banc.";
                    }
                }
            }
        ]
    }
    // D'autres événements peuvent être ajoutés ici (blessures, transfert, etc.)
];

export const EventEngine = {
    getAvailableEvents: () => {
        const currentState = StateManager.get();
        return NARRATIVE_EVENTS.filter(ev => ev.triggerCondition(currentState));
    },
    
    triggerRandomEvent: () => {
        const events = EventEngine.getAvailableEvents();
        if (events.length === 0) return null;
        return events[Math.floor(Math.random() * events.length)];
    }
};
