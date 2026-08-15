// domain/notification/notificationConstants.js

export const NOTIFICATION_PRIORITY = Object.freeze({
    FEED: 'feed',
    TOAST: 'toast',
    IMPORTANT: 'important',
    DECISION: 'decision',
    SCENE: 'scene'
});

export const NOTIFICATION_VISIBILITY = Object.freeze({
    HIDDEN: 'hidden',
    INDIRECT: 'indirect',
    VISIBLE: 'visible',
    CONFIRMED: 'confirmed'
});

export const NOTIFICATION_CATEGORIES = Object.freeze([
    'career',
    'scouting',
    'mercato',
    'contract',
    'agent',
    'relation',
    'media',
    'match',
    'health'
]);
