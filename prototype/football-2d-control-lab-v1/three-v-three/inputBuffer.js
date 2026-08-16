const ONE_SHOT_ACTIONS = Object.freeze(["primaryPressed", "secondaryPressed", "tertiaryPressed"]);

export function mergeInputFrames(previous = {}, current = {}) {
  const merged = { ...previous, ...current };
  for (const action of ONE_SHOT_ACTIONS) merged[action] = !!previous[action] || !!current[action];
  return merged;
}

export function consumeInputActions(input = {}) {
  const next = { ...input };
  for (const action of ONE_SHOT_ACTIONS) next[action] = false;
  return next;
}