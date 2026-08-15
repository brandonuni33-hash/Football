// core/commands.js
// Catalogue central des intentions utilisateur/application.
// Une commande demande qu'une action soit exécutée ; elle ne décrit pas un fait passé.

export const COMMANDS = Object.freeze({
    START_GAME: 'game.start',
    START_BLOCK: 'game.block.start',
    ADVANCE_CALENDAR: 'calendar.advance',
    SET_TRAINING_FOCUS: 'training.focus.set',

    CAREER_CREATE: 'career.create',
    CAREER_RESTORE: 'career.restore',

    RESOLVE_EVENT_CHOICE: 'event.choice.resolve',
    RESOLVE_COACH_CHOICE: 'coach.choice.resolve',
    RESOLVE_MEDIA_CHOICE: 'media.choice.resolve',
    RESOLVE_POSITION_PROPOSAL: 'career.position.resolve',

    ACCEPT_TRANSFER: 'transfer.offer.accept',
    REJECT_TRANSFER: 'transfer.offer.reject',

    RETIRE: 'career.retire',
    RESET_CAREER: 'career.reset'
});

export default COMMANDS;
