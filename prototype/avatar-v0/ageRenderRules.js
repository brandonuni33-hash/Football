export const AGE_RENDER_RULES = Object.freeze({
  academy: Object.freeze({ faceMaturity: 0.2, jawDefinition: 0.15, bodyMaturity: 0.75, expressionLines: 0, spriteScale: 0.94 }),
  young: Object.freeze({ faceMaturity: 0.45, jawDefinition: 0.4, bodyMaturity: 0.9, expressionLines: 0, spriteScale: 0.98 }),
  prime: Object.freeze({ faceMaturity: 0.7, jawDefinition: 0.7, bodyMaturity: 1, expressionLines: 0.05, spriteScale: 1 }),
  experienced: Object.freeze({ faceMaturity: 0.85, jawDefinition: 0.82, bodyMaturity: 1, expressionLines: 0.18, spriteScale: 1 }),
  veteran: Object.freeze({ faceMaturity: 1, jawDefinition: 0.88, bodyMaturity: 0.98, expressionLines: 0.35, spriteScale: 0.99 }),
});

export function getAgeRenderRules(stage) {
  return AGE_RENDER_RULES[stage] ?? AGE_RENDER_RULES.academy;
}
