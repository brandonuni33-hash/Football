// application/systemRegistry.js
// Composition root de transition. Les systèmes historiques sont construits ici
// afin que GameEngine cesse progressivement de connaître toutes leurs implémentations.

import { SocialSystem } from '../social.js';
import { MediaSystem } from '../media.js';
import { TrainingManager } from '../entrainement.js';
import { MatchBlockManager } from '../matchBlock.js';
import { PlayerLogic } from '../player.js';
import { StateManager } from '../state.js';
import { EventEngine } from '../events.js';
import { CoachSystem } from '../coachSystem.js';
import { TransferMarket } from '../transferMarket.js';
import { PotentialSystem } from '../potentialSystem.js';
import { CareerSystem } from '../careerSystem.js';
import { CupSystem } from '../cupSystem.js';
import { CalendarSystem } from '../domain/calendar/calendarSystem.js';
import { SeasonSystem } from '../domain/career/seasonSystem.js';
import { CareerLifecycleSystem } from '../domain/career/careerLifecycleSystem.js';
import { MatchSystem } from '../domain/match/matchSystem.js';
import { TrainingSystem } from '../domain/training/trainingSystem.js';
import { BlockSystem } from '../domain/gameplay/blockSystem.js';
import { InteractionSystem } from '../domain/interactions/interactionSystem.js';
import { TransferSystem } from '../domain/transfer/transferSystem.js';

export function createSystemRegistry({ engine, worldSystem, competitionSystem, cupSystem = CupSystem } = {}) {
    const socialSystem = new SocialSystem(engine);
    const mediaSystem = new MediaSystem(engine);
    const trainingSystem = new TrainingSystem(TrainingManager);
    const matchSystem = new MatchSystem(MatchBlockManager);

    const seasonSystem = new SeasonSystem({
        playerLogic: PlayerLogic,
        potentialSystem: PotentialSystem,
        careerSystem: CareerSystem,
        cupSystem,
        worldSystem
    });

    const calendarSystem = new CalendarSystem({
        worldSystem,
        competitionSystem,
        cupSystem,
        seasonReset: (state) => seasonSystem.finalize(state)
    });

    const blockSystem = new BlockSystem({
        trainingManager: TrainingManager,
        matchBlockManager: MatchBlockManager,
        worldSystem,
        socialSystem,
        mediaSystem,
        eventEngine: EventEngine,
        coachSystem: CoachSystem,
        careerSystem: CareerSystem,
        transferMarket: TransferMarket,
        stateManager: StateManager,
        advanceCalendar: (state) => calendarSystem.advance(state)
    });

    const interactionSystem = new InteractionSystem({
        eventEngine: EventEngine,
        coachSystem: CoachSystem,
        mediaSystem,
        playerLogic: PlayerLogic,
        careerSystem: CareerSystem,
        stateManager: StateManager
    });

    const transferSystem = new TransferSystem({
        transferMarket: TransferMarket,
        careerSystem: CareerSystem,
        playerLogic: PlayerLogic,
        stateManager: StateManager
    });

    const careerLifecycleSystem = new CareerLifecycleSystem({
        stateManager: StateManager,
        playerLogic: PlayerLogic
    });

    return Object.freeze({
        socialSystem,
        mediaSystem,
        trainingSystem,
        matchSystem,
        seasonSystem,
        calendarSystem,
        blockSystem,
        interactionSystem,
        transferSystem,
        careerLifecycleSystem
    });
}

export default createSystemRegistry;
