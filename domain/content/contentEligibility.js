const hasAll = (values, actual) => values.every((value) => actual.has(value));
const hasAny = (values, actual) => values.length === 0 || values.some((value) => actual.has(value));

export function isContentEntryEligible(entry, context = {}) {
  const age = Number.isFinite(context.age) ? context.age : null;
  if (age !== null && (age < entry.minAge || age > entry.maxAge)) return false;

  if (entry.careerStages?.length && context.careerStage && !entry.careerStages.includes(context.careerStage)) {
    return false;
  }

  const contexts = new Set(context.contexts ?? []);
  if (entry.contexts?.length && contexts.size > 0 && !hasAny(entry.contexts, contexts)) return false;

  const emotionalStates = new Set(context.emotionalStates ?? []);
  if (entry.emotionalStates?.length && emotionalStates.size > 0 && !hasAny(entry.emotionalStates, emotionalStates)) {
    return false;
  }

  const facts = new Set(context.facts ?? []);
  if (!hasAll(entry.requiredFacts ?? [], facts)) return false;
  if ((entry.excludedFacts ?? []).some((fact) => facts.has(fact))) return false;

  if (entry.relationBands?.length && context.relationBand && !entry.relationBands.includes(context.relationBand)) {
    return false;
  }

  return true;
}

export function getEligibleContent(catalog, context = {}) {
  return catalog.filter((entry) => isContentEntryEligible(entry, context));
}
