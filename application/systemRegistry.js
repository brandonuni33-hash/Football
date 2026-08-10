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
import { MatchSystem } from '../domain/match/matchSystem.js';
import { TrainingSystem } from '../domain/training/trainingSystem.js';
import { BlockSystem } from '../domain/gameplay/blockSystem.js';

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

    return Object.freeze({
        socialSystem,
        mediaSystem,
        trainingSystem,
        matchSystem,
        seasonSystem,
        calendarSystem,
        blockSystem
    });
}

export default createSystemRegistry;
