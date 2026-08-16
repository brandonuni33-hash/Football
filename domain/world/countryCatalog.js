const COUNTRIES = [
    ['France', '🇫🇷', 'Europe'], ['Algérie', '🇩🇿', 'Afrique'], ['Maroc', '🇲🇦', 'Afrique'],
    ['Mali', '🇲🇱', 'Afrique'], ['Sénégal', '🇸🇳', 'Afrique'], ['Côte d’Ivoire', '🇨🇮', 'Afrique'],
    ['Cameroun', '🇨🇲', 'Afrique'], ['Portugal', '🇵🇹', 'Europe'], ['Espagne', '🇪🇸', 'Europe'],
    ['Italie', '🇮🇹', 'Europe'], ['Belgique', '🇧🇪', 'Europe'], ['Angleterre', '🏴', 'Europe'],
    ['Pays-Bas', '🇳🇱', 'Europe'], ['Allemagne', '🇩🇪', 'Europe'],
    ['Brésil', '🇧🇷', 'Amérique du Sud'], ['Argentine', '🇦🇷', 'Amérique du Sud'],
    ['Uruguay', '🇺🇾', 'Amérique du Sud'], ['Japon', '🇯🇵', 'Asie']
];

export const COUNTRY_CATALOG = Object.freeze(COUNTRIES.map(([id, flag, continent]) =>
    Object.freeze({ id, label: id, flag, continent })
));

export const COUNTRY_NAMES = Object.freeze(COUNTRY_CATALOG.map(country => country.id));

export function countryMetadata(countryId) {
    return COUNTRY_CATALOG.find(country => country.id === countryId) || null;
}

export function flagForCountry(countryId) {
    return countryMetadata(countryId)?.flag || '🌍';
}

export function continentForCountry(countryId) {
    return countryMetadata(countryId)?.continent || null;
}
