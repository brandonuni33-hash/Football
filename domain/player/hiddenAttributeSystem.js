const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const clamp = (value, min, max) => Math.min(max, Math.max(min, number(value)));

export function updateHiddenAttributes(player, summary = {}) {
    player.hidden ||= { consistency: 12, bigMatchPlayer: 12, injuryProneness: 10 };
    if (summary.rating >= 7 && Math.random() < .35) player.hidden.consistency = clamp(number(player.hidden.consistency) + 1, 1, 20);
    else if (summary.rating < 5.5 && Math.random() < .25) player.hidden.consistency = clamp(number(player.hidden.consistency) - 1, 1, 20);
    if ((summary.goals > 0 || summary.rating >= 8) && Math.random() < .25) player.hidden.bigMatchPlayer = clamp(number(player.hidden.bigMatchPlayer) + 1, 1, 20);
    if (player.isInjured) player.hidden.injuryProneness = clamp(number(player.hidden.injuryProneness) + 1, 1, 20);
}

export default Object.freeze({ updateHiddenAttributes });
