// application/systemRegistry.js
// Composition root : toutes les dépendances des domaines sont assemblées ici.
import { EconomyManager } from '../economy.js';
import { SocialSystem } from '../social.js';
import { MediaSystem } from '../media.js';
import { TrainingManager } from '../entrainement.js';
import { PlayerLogic } from '../player.js';
import { StateManager, SCHEMA_VERSION } from '../state/stateManager.js';
import { EventEngine } from '../events.js';
import { CoachSystem } from '../coachSystem.js';
import { TransferMarket } from '../transferMarket.js';
import { PotentialSystem } from '../domain/player/potentialSystem.js';
import { ConsequenceSystem } from '../consequenceSystem.js';
import { CareerSystem } from '../domain/career/careerSystem.js';
import { CompetitionSystem } from '../competitionSystem.js';
import { WorldSystem } from '../worldSystem.js';
import { CupSystem } from '../cupSystem.js';
import { MatchChoiceManager } from '../matchChoices.js';
import { CalendarSystem } from '../domain/calendar/calendarSystem.js';
import { SeasonSystem } from '../domain/career/seasonSystem.js';
import { CareerLifecycleSystem } from '../domain/career/careerLifecycleSystem.js';
import SecondGenerationSystem from '../domain/career/secondGenerationSystem.js';
import ChildCareerSystem from '../domain/career/childCareerSystem.js';
import GenerationSimulationFacade from '../domain/career/generationSimulationFacade.js';
import { FamilyLifeSystem } from '../domain/family/familyLifeSystem.js';
import FamilySystem from '../domain/family/familySystem.js';
import RelationshipSystem from '../domain/relationship/relationshipSystem.js';
import NetworkEvolutionSystem from '../domain/relationship/networkEvolutionSystem.js';
import NotificationSystem from '../domain/notification/notificationSystem.js';
import AwardsSystem from '../domain/awards/awardsSystem.js';
import CareerApplication from './careerApplication.js';
import SimulatedMatchSystem from '../domain/match/simulatedMatchSystem.js';
import InteractiveMatchSystem from '../domain/match/interactiveMatchSystem.js';
import { TrainingSystem } from '../domain/training/trainingSystem.js';
import { BlockSystem } from '../domain/gameplay/blockSystem.js';
import { InteractionSystem } from '../domain/interactions/interactionSystem.js';
import { TransferSystem } from '../domain/transfer/transferSystem.js';

export function createSystemRegistry({ engine, worldSystem = WorldSystem, competitionSystem = CompetitionSystem, cupSystem = CupSystem } = {}) {
    const socialSystem = new SocialSystem(engine);
    const mediaSystem = new MediaSystem(engine);
    const trainingSystem = new TrainingSystem(TrainingManager);
    const simulatedMatchSystem = new SimulatedMatchSystem();
    const relationshipSystem = new RelationshipSystem();
    const networkEvolutionSystem = new NetworkEvolutionSystem();
    const familySystem = new FamilySystem();
    const familyLifeSystem = new FamilyLifeSystem({ familySystem });
    const notificationSystem = new NotificationSystem();
    const secondGenerationSystem = new SecondGenerationSystem();
    const childCareerSystem = new ChildCareerSystem();
    const generationSimulationFacade = new GenerationSimulationFacade({ childCareer: childCareerSystem });
    const awardsSystem = AwardsSystem;
    const seasonSystem = new SeasonSystem({ playerLogic: PlayerLogic, potentialSystem: PotentialSystem, careerSystem: CareerSystem, cupSystem, worldSystem, awardsSystem });
    const calendarSystem = new CalendarSystem({ worldSystem, competitionSystem, cupSystem, familySystem, seasonReset: (state) => seasonSystem.finalize(state) });
    const blockSystem = new BlockSystem({ trainingManager: TrainingManager, matchBlockManager: simulatedMatchSystem, worldSystem, socialSystem, mediaSystem, eventEngine: EventEngine, coachSystem: CoachSystem, careerSystem: CareerSystem, transferMarket: TransferMarket, stateManager: StateManager, familyLifeSystem, consequenceSystem: ConsequenceSystem, advanceCalendar: (state) => calendarSystem.advance(state) });
    const interactionSystem = new InteractionSystem({ eventEngine: EventEngine, coachSystem: CoachSystem, mediaSystem, playerLogic: PlayerLogic, careerSystem: CareerSystem, stateManager: StateManager });
    const transferSystem = new TransferSystem({ transferMarket: TransferMarket, careerSystem: CareerSystem, playerLogic: PlayerLogic, stateManager: StateManager, worldSystem });
    const careerLifecycleSystem = new CareerLifecycleSystem({ stateManager: StateManager, playerLogic: PlayerLogic });
    const careerApplication = new CareerApplication({ stateManager: StateManager, playerLogic: PlayerLogic, economyManager: EconomyManager, socialSystem, mediaSystem, consequenceSystem: ConsequenceSystem, potentialSystem: PotentialSystem, careerSystem: CareerSystem, competitionSystem, worldSystem, cupSystem, schemaVersion: SCHEMA_VERSION });
    notificationSystem.start();
    return Object.freeze({ socialSystem, mediaSystem, trainingSystem, simulatedMatchSystem, interactiveMatchSystem: InteractiveMatchSystem, matchChoiceManager: MatchChoiceManager, competitionSystem, cupSystem, relationshipSystem, networkEvolutionSystem, familySystem, familyLifeSystem, notificationSystem, secondGenerationSystem, childCareerSystem, generationSimulationFacade, awardsSystem, seasonSystem, calendarSystem, blockSystem, interactionSystem, transferSystem, careerLifecycleSystem, careerApplication, consequenceSystem: ConsequenceSystem, potentialSystem: PotentialSystem });
}

export default createSystemRegistry;
