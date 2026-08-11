// application/systemRegistry.js
// Composition root : toutes les dépendances des domaines sont assemblées ici.
import { EconomyManager } from '../domain/economy/economySystem.js';
import { SocialSystem } from '../domain/relationship/socialSystem.js';
import { MediaSystem } from '../domain/media/mediaSystem.js';
import { TrainingManager } from '../domain/training/trainingManager.js';
import { PlayerLogic } from '../player.js';
import { StateManager, SCHEMA_VERSION } from '../state/stateManager.js';
import { EventEngine } from '../domain/events/eventSystem.js';
import { CoachSystem } from '../domain/coach/coachSystem.js';
import { TransferMarket } from '../domain/transfer/transferMarket.js';
import ClubNeedSystem from '../domain/transfer/clubNeedSystem.js';
import MarketCompetitionSystem from '../domain/transfer/marketCompetitionSystem.js';
import TransferInterestPipeline from '../domain/transfer/interestPipeline.js';
import ScoutingSystem from '../domain/scouting/scoutingSystem.js';
import OpportunityEngine from '../domain/scouting/opportunityEngine.js';
import { PotentialSystem } from '../domain/player/potentialSystem.js';
import { ConsequenceSystem } from '../domain/decision/consequenceSystem.js';
import { CareerSystem } from '../domain/career/careerSystem.js';
import CompetitionSystem from '../domain/competition/competitionSystem.js';
import { WorldSystem } from '../domain/world/worldSystem.js';
import CupSystem from '../domain/competition/cupSystem.js';
import { MatchChoiceManager } from '../domain/match/matchChoiceManager.js';
import MatchImportanceSystem from '../domain/match/matchImportanceSystem.js';
import { CalendarSystem } from '../domain/calendar/calendarSystem.js';
import { SeasonSystem } from '../domain/career/seasonSystem.js';
import { CareerLifecycleSystem } from '../domain/career/careerLifecycleSystem.js';
import SecondGenerationSystem from '../domain/career/secondGenerationSystem.js';
import ChildCareerSystem from '../domain/career/childCareerSystem.js';
import GenerationSimulationFacade from '../domain/career/generationSimulationFacade.js';
import { FamilyLifeSystem } from '../domain/family/familyLifeSystem.js';
import FamilySystem from '../domain/family/familySystem.js';
import RelationshipSystem from '../domain/relationship/relationshipSystem.js';
import RelationshipMemory from '../domain/relationship/relationshipMemory.js';
import NetworkEvolutionSystem from '../domain/relationship/networkEvolutionSystem.js';
import NotificationSystem from '../domain/notification/notificationSystem.js';
import AwardsSystem from '../domain/awards/awardsSystem.js';
import NarrativeEngine from '../domain/narrative/narrativeEngine.js';
import CareerApplication from './careerApplication.js';
import SimulatedMatchSystem from '../domain/match/simulatedMatchSystem.js';
import InteractiveMatchSystem from '../domain/match/interactiveMatchSystem.js';
import { TrainingSystem } from '../domain/training/trainingSystem.js';
import { BlockSystem } from '../domain/gameplay/blockSystem.js';
import { InteractionSystem } from '../domain/interactions/interactionSystem.js';
import { TransferSystem } from '../domain/transfer/transferSystem.js';

export function createSystemRegistry({ engine, worldSystem = WorldSystem, competitionSystem = CompetitionSystem, cupSystem = CupSystem } = {}) {
    const relationshipMemory = new RelationshipMemory();
    const relationshipSystem = new RelationshipSystem({ memory: relationshipMemory });
    const socialSystem = new SocialSystem({ engine, relationshipSystem });
    const mediaSystem = new MediaSystem(engine);
    const trainingSystem = new TrainingSystem(TrainingManager);
    const simulatedMatchSystem = new SimulatedMatchSystem();
    const narrativeEngine = new NarrativeEngine();
    const networkEvolutionSystem = new NetworkEvolutionSystem();
    const familySystem = new FamilySystem();
    const familyLifeSystem = new FamilyLifeSystem({ familySystem });
    const notificationSystem = new NotificationSystem({ engine });
    const secondGenerationSystem = new SecondGenerationSystem();
    const childCareerSystem = new ChildCareerSystem();
    const generationSimulationFacade = new GenerationSimulationFacade({ childCareer: childCareerSystem });
    const awardsSystem = AwardsSystem;
    const seasonSystem = new SeasonSystem({ playerLogic: PlayerLogic, potentialSystem: PotentialSystem, careerSystem: CareerSystem, cupSystem, worldSystem, awardsSystem });
    const calendarSystem = new CalendarSystem({ worldSystem, competitionSystem, cupSystem, familySystem, seasonReset: state => seasonSystem.finalize(state) });

    const clubNeedSystem = new ClubNeedSystem();
    const marketCompetitionSystem = new MarketCompetitionSystem({ clubNeeds: clubNeedSystem });
    const interestPipeline = new TransferInterestPipeline();
    const scoutingSystem = new ScoutingSystem({ worldSystem });
    const opportunityEngine = new OpportunityEngine();
    const transferSystem = new TransferSystem({
        transferMarket: TransferMarket,
        playerLogic: PlayerLogic,
        stateManager: StateManager,
        worldSystem,
        scoutingSystem,
        interestPipeline,
        marketCompetitionSystem,
        clubNeedSystem,
        opportunityEngine
    });

    const blockSystem = new BlockSystem({ trainingManager: TrainingManager, matchBlockManager: simulatedMatchSystem, worldSystem, socialSystem, mediaSystem, eventEngine: EventEngine, coachSystem: CoachSystem, careerSystem: CareerSystem, transferSystem, stateManager: StateManager, familyLifeSystem, consequenceSystem: ConsequenceSystem, narrativeEngine, advanceCalendar: state => calendarSystem.advance(state) });
    const interactionSystem = new InteractionSystem({ eventEngine: EventEngine, coachSystem: CoachSystem, mediaSystem, playerLogic: PlayerLogic, careerSystem: CareerSystem, stateManager: StateManager });
    const careerLifecycleSystem = new CareerLifecycleSystem({ stateManager: StateManager, playerLogic: PlayerLogic });
    const careerApplication = new CareerApplication({ stateManager: StateManager, playerLogic: PlayerLogic, economyManager: EconomyManager, socialSystem, mediaSystem, consequenceSystem: ConsequenceSystem, potentialSystem: PotentialSystem, careerSystem: CareerSystem, competitionSystem, worldSystem, cupSystem, schemaVersion: SCHEMA_VERSION });
    notificationSystem.start();
    return Object.freeze({
        socialSystem,
        mediaSystem,
        trainingSystem,
        simulatedMatchSystem,
        interactiveMatchSystem: InteractiveMatchSystem,
        matchChoiceManager: MatchChoiceManager,
        matchImportanceSystem: MatchImportanceSystem,
        narrativeEngine,
        competitionSystem,
        cupSystem,
        relationshipSystem,
        relationshipMemory,
        networkEvolutionSystem,
        familySystem,
        familyLifeSystem,
        notificationSystem,
        scoutingSystem,
        opportunityEngine,
        clubNeedSystem,
        marketCompetitionSystem,
        interestPipeline,
        secondGenerationSystem,
        childCareerSystem,
        generationSimulationFacade,
        awardsSystem,
        seasonSystem,
        calendarSystem,
        blockSystem,
        interactionSystem,
        transferSystem,
        careerLifecycleSystem,
        careerApplication,
        consequenceSystem: ConsequenceSystem,
        potentialSystem: PotentialSystem
    });
}
export default createSystemRegistry;
