// ui/career/originGate.js
// Filtre de sécurité UI : « fils de pro » ne fait plus partie de la création initiale.
// La deuxième génération est exclusivement débloquée par ChildCareerSystem.

const LEGACY_IDS = new Set(['son_of_pro', 'fils_de_pro', 'pro_son']);
const LEGACY_LABELS = ['fils de pro', 'fils d’un pro', "fils d'un pro", 'fils de professionnel'];

const normalize = value => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function isLegacyProOrigin(element) {
    const id = normalize(element?.dataset?.originId || element?.dataset?.origin || element?.getAttribute?.('data-value'));
    if (LEGACY_IDS.has(id)) return true;
    const text = normalize(element?.textContent);
    return LEGACY_LABELS.some(label => text.includes(normalize(label)));
}

export function filterInitialOriginElements(elements = []) {
    return [...elements].filter(element => !isLegacyProOrigin(element));
}

export function installOriginGate(root = document) {
    const scan = () => {
        root.querySelectorAll('.origin-card-compact').forEach(card => {
            if (isLegacyProOrigin(card)) {
                card.remove();
            }
        });
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(root.body || root.documentElement, { childList: true, subtree: true });
    return () => observer.disconnect();
}

export default installOriginGate;
