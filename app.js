// --- FONCTION DE GÉREZ LA CLÉ API EN LOCAL ---

function getApiKey() {
  let key = localStorage.getItem('gemini_api_key');
  if (!key) {
    key = prompt("Entre ta clé API Google AI Studio pour activer le moteur narratif :");
    if (key) {
      localStorage.setItem('gemini_api_key', key.trim());
    }
  }
  return key;
}

// --- 1. DONNÉES & STRUCTURE DE BASE ---

const POSITIONS = [
  { id: 'bu', label: 'BU' },
  { id: 'ad', label: 'AD' },
  { id: 'ag', label: 'AG' },
  { id: 'moc', label: 'MOC' },
  { id: 'mc', label: 'MC' },
  { id: 'mdc', label: 'MDC' },
  { id: 'dd', label: 'DD' },
  { id: 'dg', label: 'DG' },
  { id: 'dc', label: 'DC' },
  { id: 'gk', label: 'GK' }
];

const NATIONALITIES = [
  { name: 'France', flag: '🇫🇷', continent: 'Europe' },
  { name: 'Angleterre', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', continent: 'Europe' },
  { name: 'Espagne', flag: '🇪🇸', continent: 'Europe' },
  { name: 'Allemagne', flag: '🇩🇪', continent: 'Europe' },
  { name: 'Italie', flag: '🇮🇹', continent: 'Europe' },
  { name: 'Brésil', flag: '🇧🇷', continent: 'Amérique du Sud' },
  { name: 'Argentine', flag: '🇦🇷', continent: 'Amérique du Sud' },
  { name: 'Maroc', flag: '🇲🇦', continent: 'Afrique' },
  { name: 'Sénégal', flag: '🇸🇳', continent: 'Afrique' },
  { name: 'Japon', flag: '🇯🇵', continent: 'Asie' }
];

// Listes de prénoms et noms aléatoires pour la génération automatique
const RANDOM_FIRST_NAMES = ['Lucas', 'Enzo', 'Noah', 'Louis', 'Gabriel', 'Raphaël', 'Leo', 'Arthur', 'Jules', 'Maël', 'Ethan', 'Hugo', 'Nathan', 'Sacha', 'Adam', 'Tom', 'Mohamed', 'Mehdi', 'Ilyes', 'Amine'];
const RANDOM_LAST_NAMES = ['Bernard', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard', 'Bonnet', 'Dupont', 'Le Moan'];

function getRandomPlayerName() {
  const fn = RANDOM_FIRST_NAMES[Math.floor(Math.random() * RANDOM_FIRST_NAMES.length)];
  const ln = RANDOM_LAST_NAMES[Math.floor(Math.random() * RANDOM_LAST_NAMES.length)];
  return { firstName: fn, lastName: ln };
}

const ORIGINS = [
  { 
    id: 'centre', 
    name: 'Centre de Formation', 
    desc: '+10% Mental/Tactique | Trait: Classique', 
    trait: 'Classique',
    longDesc: "Issu des structures professionnelles pré-formatées, tu as bénéficié dès ton plus jeune âge d'un encadrement rigoureux, de terrains parfaits et de conseils tactiques poussés. Ton jeu est propre, académique et respectueux des consignes, mais il manque parfois de folie spontanée."
  },
  { 
    id: 'amateur', 
    name: 'Club Amateur', 
    desc: '+10% Physique, -10% Tactique | Trait: Acharné', 
    trait: 'Acharné',
    longDesc: "Formé sur des terrains difficiles sous la pluie, les mottes de terre et les tacles appuyés. Tu possèdes une caisse physique hors norme et un mental d'acier forgé dans la difficulté, même si tes premiers pas tactiques au haut niveau demanderont un temps d'adaptation."
  },
  { 
    id: 'futsal', 
    name: 'Futsal', 
    desc: '+10% Dribble/Technique | Trait: Dribbleur Fin', 
    trait: 'Dribbleur Fin',
    longDesc: "Le rectangle de parquet et le ballon lourd ont sculpté ton toucher de balle. Tu es un maître des espaces réduits, capable de sortir de situations impossibles par des feintes de corps, des contrôles orientés et une vista technique déconcertante."
  },
  { 
    id: 'tardif', 
    name: 'Débutant Tardif', 
    desc: '-5 OVR base | Trait: Poulain Brut', 
    trait: 'Poulain Brut',
    longDesc: "Repéré tardivement dans les championnats loisirs ou de quartier, tu arrives dans le monde pro avec du retard sur les fondamentaux et un bagage technique brut. En contrepartie, ton potentiel de progression explosif et ta faim de réussite surprennent tous les observateurs."
  },
  { 
    id: 'street', 
    name: 'Street Football', 
    desc: '+10% Dribble | Trait: Instinct 1v1', 
    trait: 'Instinct 1v1',
    longDesc: "Le bitume, les cages improvisées entre des sweats et les matches de rue permanents t'ont forgé un instinct de duel implacable. Tu n'as peur de personne, provoques sans cesse ton vis-à-vis et possèdes ce brin d'insolence propre aux virtuoses de la rue."
  },
  { 
    id: 'athlete', 
    name: 'Athlète Polyvalent', 
    desc: '+15% Vitesse/Puissance | Trait: Moteur Hybride', 
    trait: 'Moteur Hybride',
    longDesc: "Doté de dispositions athlétiques hors du commun dès l'adolescence, tu combines vitesse pure et coffre immense. Capable de répéter les efforts haute intensité pendant 90 minutes, tu compenses un placement parfois approximatif par un impact physique total."
  }
];

const BIG_LEAGUES_CLUBS = {
  "Ligue 1 McDonald's (France)": ['Paris Saint-Germain', 'Olympique de Marseille', 'AS Monaco', 'Olympique Lyonnais', 'LOSC Lille', 'RC Lens', 'Stade Rennais FC'],
  "Premier League (Angleterre)": ['Manchester City', 'Arsenal FC', 'Liverpool FC', 'Manchester United', 'Chelsea FC', 'Tottenham Hotspur', 'Newcastle United'],
  "LaLiga EA Sports (Espagne)": ['Real Madrid', 'FC Barcelona', 'Atlético de Madrid', 'Athletic Club', 'Real Sociedad', 'Villarreal CF'],
  "Bundesliga (Allemagne)": ['FC Bayern München', 'Bayer Leverkusen', 'Borussia Dortmund', 'RB Leipzig', 'VfB Stuttgart'],
  "Serie A (Italie)": ['Inter Milan', 'AC Milan', 'Juventus FC', 'SSC Napoli', 'AS Roma', 'Atalanta BC']
};

// --- LISTE MASSIVE DE PLUS DE 100 CLUBS DE DÉPART ALÉATOIRES ---

const CITIES_AND_CLUBS = [
  // France - National / R1 / D3 / D4 / Amateurs
  { name: 'FC Girondins de Bordeaux', league: 'National / R1', tier: 'Amateur', minOvr: 0, coachName: 'Bruno Irles', coachStyle: 'Rigueur tactique et engagement physique total.', trainingQuality: 'Élevée (Historique formateur)', playtime: 'Élevé (Titulaire potentiel en jeunes)' },
  { name: 'US Lormont', league: 'Régional 1', tier: 'Amateur', minOvr: 0, coachName: 'Mehdi Sabri', coachStyle: 'Jeu direct et transition rapide sur les côtés.', trainingQuality: 'Moyenne (Structure amateur)', playtime: 'Très Élevé (Temps de jeu garanti)' },
  { name: 'Stade Bordelais', league: 'National 3', tier: 'Amateur', minOvr: 0, coachName: 'Antoine Verges', coachStyle: 'Bloc bas solide et contre-attaques rapides.', trainingQuality: 'Moyenne', playtime: 'Élevé' },
  { name: 'Aviron Bayonnais', league: 'National 3', tier: 'Amateur', minOvr: 0, coachName: 'Landry Bordagaray', coachStyle: 'Générosité dans l’effort et jeu aérien.', trainingQuality: 'Moyenne', playtime: 'Élevé' },
  { name: 'Bergerac Périgord FC', league: 'National 2', tier: 'Amateur', minOvr: 0, coachName: 'Yassine Azahaf', coachStyle: 'Solidité défensive et percussion sur les ailes.', trainingQuality: 'Bonne', playtime: 'Correct (Rotation régulière)' },
  { name: 'Trélissac FC', league: 'National 3', tier: 'Amateur', minOvr: 0, coachName: 'Hervé Loubat', coachStyle: 'Discipline stricte et duels au milieu.', trainingQuality: 'Moyenne', playtime: 'Élevé' },
  { name: 'Stade Montois', league: 'Régional 1', tier: 'Amateur', minOvr: 0, coachName: 'Cédric Pardeilhan', coachStyle: 'Jeu au sol et projection collective.', trainingQuality: 'Moyenne', playtime: 'Très Élevé' },
  { name: 'Pau FC', league: 'Ligue 2 BKT', tier: 'D2', minOvr: 45, coachName: 'Nicolas Usaï', coachStyle: 'Bloc compact en contre-attaque et solidité.', trainingQuality: 'Très Bonne (Centre pro certifié)', playtime: 'Modéré (Bassin de concurrence rude)' },
  { name: 'SC Bastia', league: 'Ligue 2 BKT', tier: 'D2', minOvr: 48, coachName: 'Benoît Tavenot', coachStyle: 'Duels agressifs et mental de guerrier.', trainingQuality: 'Très Bonne', playtime: 'Modéré' },
  { name: 'Stade Lavallois', league: 'Ligue 2 BKT', tier: 'D2', minOvr: 42, coachName: 'Olivier Frapolli', coachStyle: 'Solidité défensive et pressing haut.', trainingQuality: 'Bonne', playtime: 'Correct' },
  { name: 'En Avant Guingamp', league: 'Ligue 2 BKT', tier: 'D2', minOvr: 46, coachName: 'Sylvain Ripoll', coachStyle: 'Transition rapide et utilisation de la largeur.', trainingQuality: 'Excellente (Réputation post-formation)', playtime: 'Modéré' },
  { name: 'Grenoble Foot 38', league: 'Ligue 2 BKT', tier: 'D2', minOvr: 44, coachName: 'Oswald Tanchot', coachStyle: 'Maîtrise tactique et patience dans la construction.', trainingQuality: 'Bonne', playtime: 'Correct' },
  { name: 'Rodez Aveyron Football', league: 'Ligue 2 BKT', tier: 'D2', minOvr: 43, coachName: 'Didier Santini', coachStyle: 'Impact physique et intensité de tous les instants.', trainingQuality: 'Bonne', playtime: 'Correct' },
  { name: 'SM Caen', league: 'Ligue 2 BKT', tier: 'D2', minOvr: 47, coachName: 'Hervé Chanelet', coachStyle: 'Jeu combiné et possession axiale.', trainingQuality: 'Excellente (Top formateur L2)', playtime: 'Modéré' },
  { name: 'ESTAC Troyes', league: 'Ligue 2 BKT', tier: 'D2', minOvr: 46, coachName: 'Stéphane Dumont', coachStyle: 'Créativité offensive et redoublements de passes.', trainingQuality: 'Excellente', playtime: 'Modéré' },
  { name: 'US Le Mans', league: 'National', tier: 'D3', minOvr: 38, coachName: 'Patrick Videira', coachStyle: 'Fermeté défensive et projections en nombre.', trainingQuality: 'Bonne', playtime: 'Élevé' },
  { name: 'AS Nancy Lorraine', league: 'National', tier: 'D3', minOvr: 39, coachName: 'Pablo Correa', coachStyle: 'Mentalité de fer, duels et grinta.', trainingQuality: 'Bonne', playtime: 'Élevé' },
  { name: 'US Orléans', league: 'National', tier: 'D3', minOvr: 37, coachName: 'Hervé Della Maggiore', coachStyle: 'Équilibre et rigueur tactique rigoureuse.', trainingQuality: 'Moyenne / Bonne', playtime: 'Élevé' },
  { name: 'Valenciennes FC', league: 'National', tier: 'D3', minOvr: 38, coachName: 'Ahmed Kantari', coachStyle: 'Relance propre et pressing coordonné.', trainingQuality: 'Très Bonne (Historique pro)', playtime: 'Élevé' },
  { name: 'FC Sochaux-Montbéliard', league: 'National', tier: 'D3', minOvr: 40, coachName: 'Karim Mokeddem', coachStyle: 'Jeu technique au sol et percussion offensive.', trainingQuality: 'Excellente (Légendaire centre formateur)', playtime: 'Élevé' },
  { name: 'Dijon FCO', league: 'National', tier: 'D3', minOvr: 39, coachName: 'Baptiste Ridira', coachStyle: 'Ambitieux, jeu vertical et intensité.', trainingQuality: 'Bonne', playtime: 'Élevé' },
  { name: 'Aubagne FC', league: 'National', tier: 'D3', minOvr: 36, coachName: 'Maxime D’Ornano', coachStyle: 'Bloc solide et solidarité exemplaire.', trainingQuality: 'Moyenne', playtime: 'Très Élevé' },
  { name: 'US Concarneau', league: 'National', tier: 'D3', minOvr: 37, coachName: 'Stéphane Le Mignan', coachStyle: 'Discipline collective et contre-éclair.', trainingQuality: 'Moyenne', playtime: 'Élevé' },
  { name: 'Châteauroux', league: 'National', tier: 'D3', minOvr: 36, coachName: 'Patrice Lair', coachStyle: 'Rigidité tactique et duels au sol.', trainingQuality: 'Bonne', playtime: 'Élevé' },
  { name: 'Quevilly Rouen Métropole', league: 'National', tier: 'D3', minOvr: 37, coachName: 'David Carré', coachStyle: 'Jeu direct et agressivité positive.', trainingQuality: 'Moyenne', playtime: 'Élevé' },

  // Angleterre - EFL League Two / League One / Non-League
  { name: 'Bromley FC', league: 'EFL League Two', tier: 'D4', minOvr: 40, coachName: 'Andy Woodman', coachStyle: 'Jeu physique à l’anglaise et duels aériens.', trainingQuality: 'Moyenne', playtime: 'Élevé' },
  { name: 'Salford City', league: 'EFL League Two', tier: 'D4', minOvr: 43, coachName: 'Karl Robinson', coachStyle: 'Possession et projection rapide vers l’avant.', trainingQuality: 'Bonne', playtime: 'Correct' },
  { name: 'Notts County', league: 'EFL League Two', tier: 'D4', minOvr: 42, coachName: 'Stuart Maynard', coachStyle: 'Jeu ultra offensif inspiré du tiki-taka bas.', trainingQuality: 'Bonne', playtime: 'Correct' },
  { name: 'Wrexham AFC', league: 'EFL League One', tier: 'D3', minOvr: 46, coachName: 'Phil Parkinson', coachStyle: 'Puissance physique, engagement et mentalité de vainqueur.', trainingQuality: 'Bonne', playtime: 'Modéré (Effectif dense)' },
  { name: 'Stockport County', league: 'EFL League One', tier: 'D3', minOvr: 45, coachName: 'Dave Challinor', coachStyle: 'Bloc haut et agressivité dans les transmissions.', trainingQuality: 'Bonne', playtime: 'Correct' },
  { name: 'Mansfield Town', league: 'EFL League One', tier: 'D3', minOvr: 43, coachName: 'Nigel Clough', coachStyle: 'Expérience, pragmatisme et réalisme froid.', trainingQuality: 'Moyenne / Bonne', playtime: 'Correct' },
  { name: 'Chesterfield FC', league: 'EFL League Two', tier: 'D4', minOvr: 41, coachName: 'Paul Cook', coachStyle: 'Attaque placée et mouvements constants.', trainingQuality: 'Bonne', playtime: 'Élevé' },
  { name: 'Barnet FC', league: 'National League', tier: 'D5', minOvr: 35, coachName: 'Dean Brennan', coachStyle: 'Pressing tout terrain et vitesse sur les ailes.', trainingQuality: 'Basique', playtime: 'Très Élevé' },
  { name: 'Oldham Athletic', league: 'National League', tier: 'D5', minOvr: 35, coachName: 'Micky Mellon', coachStyle: 'Fermeté défensive et engagement total.', trainingQuality: 'Basique', playtime: 'Très Élevé' },
  { name: 'Southend United', league: 'National League', tier: 'D5', minOvr: 34, coachName: 'Kevin Maher', coachStyle: 'Solidité face aux gros et jeu direct.', trainingQuality: 'Basique', playtime: 'Très Élevé' },
  { name: 'York City', league: 'National League', tier: 'D5', minOvr: 35, coachName: 'Adam Hinshelwood', coachStyle: 'Construction propre et audace tactique.', trainingQuality: 'Basique', playtime: 'Très Élevé' },
  { name: 'Gillingham FC', league: 'EFL League Two', tier: 'D4', minOvr: 40, coachName: 'Mark Bonner', coachStyle: 'Bloc hermétique et contres fulgurants.', trainingQuality: 'Moyenne', playtime: 'Élevé' },
  { name: 'Fleetwood Town', league: 'EFL League Two', tier: 'D4', minOvr: 41, coachName: 'Charlie Adam', coachStyle: 'Créativité au milieu et pressing intense.', trainingQuality: 'Bonne (Infrastructures modernes)', playtime: 'Élevé' },
  { name: 'Bradford City', league: 'EFL League Two', tier: 'D4', minOvr: 42, coachName: 'Graham Alexander', coachStyle: 'Impact athlétique et ferveur populaire.', trainingQuality: 'Moyenne', playtime: 'Correct' },
  { name: 'Doncaster Rovers', league: 'EFL League Two', tier: 'D4', minOvr: 42, coachName: 'Grant McCann', coachStyle: 'Jeu léché et redoublement de passes courtes.', trainingQuality: 'Bonne', playtime: 'Correct' },
  { name: 'Leyton Orient', league: 'EFL League One', tier: 'D3', minOvr: 44, coachName: 'Richie Wellens', coachStyle: 'Maîtrise du tempo et possession dynamique.', trainingQuality: 'Bonne', playtime: 'Modéré' },
  { name: 'Lincoln City', league: 'EFL League One', tier: 'D3', minOvr: 44, coachName: 'Michael Skubala', coachStyle: 'Organisation rigoureuse et transition chirurgicale.', trainingQuality: 'Bonne', playtime: 'Modéré' },
  { name: 'Blackpool FC', league: 'EFL League One', tier: 'D3', minOvr: 46, coachName: 'Steve Bruce', coachStyle: 'Expérience tactique et pragmatisme absolu.', trainingQuality: 'Très Bonne', playtime: 'Modéré' },
  { name: 'Charlton Athletic', league: 'EFL League One', tier: 'D3', minOvr: 47, coachName: 'Nathan Jones', coachStyle: 'Intensité physique et duels gagnés.', trainingQuality: 'Excellente (Historique academy PL)', playtime: 'Modéré' },
  { name: 'Huddersfield Town', league: 'EFL League One', tier: 'D3', minOvr: 48, coachName: 'Michael Duff', coachStyle: 'Bloc équipe très resserré et discipline de fer.', trainingQuality: 'Excellente', playtime: 'Modéré' },

  // Espagne - LaLiga Hypermotion & Primera RFEF
  { name: 'CD Castellón', league: 'LaLiga Hypermotion', tier: 'D2', minOvr: 50, coachName: 'Dick Schreuder', coachStyle: 'Possession audacieuse et prise de risque.', trainingQuality: 'Très Bonne', playtime: 'Faible à Modéré' },
  { name: 'CD Mirandés', league: 'LaLiga Hypermotion', tier: 'D2', minOvr: 44, coachName: 'Alessio Lisci', coachStyle: 'Bloc bas ultra discipliné et contres fulgurants.', trainingQuality: 'Bonne', playtime: 'Correct' },
  { name: 'SD Huesca', league: 'LaLiga Hypermotion', tier: 'D2', minOvr: 45, coachName: 'Antonio Hidalgo', coachStyle: 'Solidité défensive et transitions rapides.', trainingQuality: 'Bonne', playtime: 'Correct' },
  { name: 'Racing de Ferrol', league: 'LaLiga Hypermotion', tier: 'D2', minOvr: 43, coachName: 'Cristóbal Parralo', coachStyle: 'Organisation rigoureuse et solidarité.', trainingQuality: 'Moyenne / Bonne', playtime: 'Correct' },
  { name: 'Burgos CF', league: 'LaLiga Hypermotion', tier: 'D2', minOvr: 46, coachName: 'Jon Pérez Bolo', coachStyle: 'Muraille défensive et réalisme offensif.', trainingQuality: 'Bonne', playtime: 'Modéré' },
  { name: 'Real Zaragoza', league: 'LaLiga Hypermotion', tier: 'D2', minOvr: 49, coachName: 'Víctor Fernández', coachStyle: 'Jeu ambitieux tourné vers l’offensive.', trainingQuality: 'Excellente', playtime: 'Faible' },
  { name: 'Sporting de Gijón', league: 'LaLiga Hypermotion', tier: 'D2', minOvr: 48, coachName: 'Rubén Albés', coachStyle: 'Verticalité, intensité et ferveur des supporters.', trainingQuality: 'Excellente (Mareo academy)', playtime: 'Modéré' },
  { name: 'Cádiz CF', league: 'LaLiga Hypermotion', tier: 'D2', minOvr: 50, coachName: 'Paco López', coachStyle: 'Bloc compact et contre-attaques foudroyantes.', trainingQuality: 'Très Bonne', playtime: 'Faible' },
  { name: 'Granada CF', league: 'LaLiga Hypermotion', tier: 'D2', minOvr: 51, coachName: 'Guille Abascal', coachStyle: 'Domination technique et animation sur les côtés.', trainingQuality: 'Très Bonne', playtime: 'Faible' },
  { name: 'Albacete Balompié', league: 'LaLiga Hypermotion', tier: 'D2', minOvr: 45, coachName: 'Alberto González', coachStyle: 'Audace et liberté créative au milieu.', trainingQuality: 'Bonne', playtime: 'Correct' },
  { name: 'CD Tenerife', league: 'LaLiga Hypermotion', tier: 'D2', minOvr: 46, coachName: 'Pepe Mel', coachStyle: 'Expérience, équilibre et solidité à domicile.', trainingQuality: 'Bonne', playtime: 'Modéré' },
  { name: 'FC Andorra', league: 'Primera RFEF', tier: 'D3', minOvr: 40, coachName: 'Ferran Costa', coachStyle: 'Tiki-taka inspiré et possession stérile interdite.', trainingQuality: 'Très Bonne (Philosophie Barça)', playtime: 'Élevé' },
  { name: 'Real Murcia', league: 'Primera RFEF', tier: 'D3', minOvr: 38, coachName: 'Fran Fernández', coachStyle: 'Pression constante et impact physique.', trainingQuality: 'Bonne', playtime: 'Élevé' },
  { name: 'Cultural Leonesa', league: 'Primera RFEF', tier: 'D3', minOvr: 37, coachName: 'Raúl Llona', coachStyle: 'Jeu combiné et rigueur tactique.', trainingQuality: 'Moyenne', playtime: 'Élevé' },
  { name: 'UD Ibiza', league: 'Primera RFEF', tier: 'D3', minOvr: 39, coachName: 'Josep Alcácer', coachStyle: 'Maîtrise technique et transition rapide.', trainingQuality: 'Bonne', playtime: 'Élevé' },

  // Allemagne - 3. Liga & 2. Bundesliga
  { name: 'Viktoria Köln', league: '3. Liga', tier: 'D3', minOvr: 38, coachName: 'Olaf Janßen', coachStyle: 'Discipline allemande et jeu de transition.', trainingQuality: 'Bonne', playtime: 'Élevé' },
  { name: 'Dynamo Dresden', league: '3. Liga', tier: 'D3', minOvr: 42, coachName: 'Thomas Stamm', coachStyle: 'Pressing étouffant et intensité maximale.', trainingQuality: 'Très Bonne', playtime: 'Correct' },
  { name: 'Arminia Bielefeld', league: '3. Liga', tier: 'D3', minOvr: 40, coachName: 'Mitch Kniat', coachStyle: 'Solidité défensive et jeu direct.', trainingQuality: 'Bonne', playtime: 'Élevé' },
  { name: 'FC Ingolstadt 04', league: '3. Liga', tier: 'D3', minOvr: 39, coachName: 'Sabrina Wittmann', coachStyle: 'Rigueur tactique et occupation rationnelle du terrain.', trainingQuality: 'Excellente (Infrastructures pro)', playtime: 'Élevé' },
  { name: 'Hansa Rostock', league: '3. Liga', tier: 'D3', minOvr: 41, coachName: 'Bernd Hollerbach', coachStyle: 'Duels physiques intenses et engagement total.', trainingQuality: 'Bonne', playtime: 'Correct' },
  { name: 'TSV 1860 Munich', league: '3. Liga', tier: 'D3', minOvr: 41, coachName: 'Argirios Giannikis', coachStyle: 'Ferveur, mentalité de combat et jeu vertical.', trainingQuality: 'Très Bonne', playtime: 'Correct' },
  { name: 'SV Sandhausen', league: '3. Liga', tier: 'D3', minOvr: 39, coachName: 'Sahr Senesie', coachStyle: 'Bloc bas et efficacité redoutable sur coup de pied arrêté.', trainingQuality: 'Bonne', playtime: 'Élevé' },
  { name: 'Rot-Weiss Essen', league: '3. Liga', tier: 'D3', minOvr: 38, coachName: 'Christoph Dabrowski', coachStyle: 'Jeu engagé porté par un public bouillant.', trainingQuality: 'Moyenne', playtime: 'Élevé' },
  { name: 'SV Elversberg', league: '2. Bundesliga', tier: 'D2', minOvr: 45, coachName: 'Horst Steffen', coachStyle: 'Football ultra offensif, beau à voir et audacieux.', trainingQuality: 'Très Bonne', playtime: 'Modéré' },
  { name: 'SC Paderborn 07', league: '2. Bundesliga', tier: 'D2', minOvr: 47, coachName: 'Lukas Kwasniok', coachStyle: 'Pressing haut ultra agressif et verticalité folle.', trainingQuality: 'Excellente', playtime: 'Modéré' },
  { name: 'SSV Ulm 1846', league: '2. Bundesliga', tier: 'D2', minOvr: 43, coachName: 'Thomas Wörle', coachStyle: 'Solidité collective et esprit de solidarité.', trainingQuality: 'Bonne', playtime: 'Correct' },
  { name: 'Preußen Münster', league: '2. Bundesliga', tier: 'D2', minOvr: 42, coachName: 'Sascha Hildmann', coachStyle: 'Discipline de fer et contre-attaques chirurgicales.', trainingQuality: 'Bonne', playtime: 'Correct' },
  { name: 'Fortuna Düsseldorf', league: '2. Bundesliga', tier: 'D2', minOvr: 50, coachName: 'Daniel Thioune', coachStyle: 'Maîtrise technique et ambition de remontée.', trainingQuality: 'Excellente', playtime: 'Faible' },
  { name: 'Hannover 96', league: '2. Bundesliga', tier: 'D2', minOvr: 49, coachName: 'Stefan Leitl', coachStyle: 'Équilibre parfait entre possession et rigueur.', trainingQuality: 'Excellente', playtime: 'Faible à Modéré' },
  { name: '1. FC Nürnberg', league: '2. Bundesliga', tier: 'D2', minOvr: 48, coachName: 'Miroslav Klose', coachStyle: 'Précision dans la zone de vérité et jeu combiné.', trainingQuality: 'Excellente (Centre légendaire)', playtime: 'Modéré' },

  // Italie - Serie B & Serie C
  { name: 'US Salernitana', league: 'Serie B', tier: 'D2', minOvr: 48, coachName: 'Giovanni Martusciello', coachStyle: 'Ferveur du Sud, intensité et créativité technique.', trainingQuality: 'Très Bonne', playtime: 'Modéré' },
  { name: 'Sassuolo Calcio', league: 'Serie B', tier: 'D2', minOvr: 51, coachName: 'Fabio Grosso', coachStyle: 'Jeu de possession léché et domination territoriale.', trainingQuality: 'Exceptionnelle (Top ref formation en Italie)', playtime: 'Faible' },
  { name: 'Spezia Calcio', league: 'Serie B', tier: 'D2', minOvr: 46, coachName: 'Luca D’Angelo', coachStyle: 'Bloc compact, agressivité et contres rapides.', trainingQuality: 'Bonne', playtime: 'Modéré' },
  { name: 'Pisa SC', league: 'Serie B', tier: 'D2', minOvr: 47, coachName: 'Filippo Inzaghi', coachStyle: 'Réalisme offensif, grinta et opportunisme.', trainingQuality: 'Bonne', playtime: 'Modéré' },
  { name: 'Brescia Calcio', league: 'Serie B', tier: 'D2', minOvr: 46, coachName: 'Rolando Maran', coachStyle: 'Catenaccio moderne et rigueur tactique italienne.', trainingQuality: 'Excellente (Historique de grands talents)', playtime: 'Modéré' },
  { name: 'AC Reggiana', league: 'Serie B', tier: 'D2', minOvr: 44, coachName: 'William Viali', coachStyle: 'Organisation rigoureuse et solidarité défensive.', trainingQuality: 'Bonne', playtime: 'Correct' },
  { name: 'FC Südtirol', league: 'Serie B', tier: 'D2', minOvr: 43, coachName: 'Federico Valente', coachStyle: 'Discipline autrichienne, bloc bas et efficacité.', trainingQuality: 'Bonne', playtime: 'Correct' },
  { name: 'Modena FC', league: 'Serie B', tier: 'D2', minOvr: 45, coachName: 'Pierpaolo Bisoli', coachStyle: 'Agressivité saine, duels et verticalité.', trainingQuality: 'Bonne', playtime: 'Correct' },
  { name: 'Calcio Padova', league: 'Serie C', tier: 'D3', minOvr: 39, coachName: 'Matteo Andreoletti', coachStyle: 'Équilibre, rigueur et ambition de montée.', trainingQuality: 'Bonne', playtime: 'Élevé' },
  { name: 'Vicenza Calcio', league: 'Serie C', tier: 'D3', minOvr: 39, coachName: 'Stefano Vecchi', coachStyle: 'Jeu direct, impact physique et expérience.', trainingQuality: 'Bonne', playtime: 'Élevé' },
  { name: 'Catania FC', league: 'Serie C', tier: 'D3', minOvr: 40, coachName: 'Domenico Toscano', coachStyle: 'Pression populaire, grinta et solidité.', trainingQuality: 'Moyenne / Bonne', playtime: 'Élevé' },
  { name: 'Benevento Calcio', league: 'Serie C', tier: 'D3', minOvr: 41, coachName: 'Gaetano Auteri', coachStyle: 'Offensif, audacieux et jeu court.', trainingQuality: 'Très Bonne', playtime: 'Élevé' },

  // Autres championnats Européens / Divers exotiques et compétitifs
  { name: 'FC Lausanne-Sport', league: 'Super League (Suisse)', tier: 'D1', minOvr: 46, coachName: 'Ludovic Magnin', coachStyle: 'Intensité physique et transition rapide vers l’avant.', trainingQuality: 'Très Bonne', playtime: 'Modéré' },
  { name: 'FC St. Gallen', league: 'Super League (Suisse)', tier: 'D1', minOvr: 47, coachName: 'Enrico Maassen', coachStyle: 'Pressing haut ultra intense et spectacle offensif.', trainingQuality: 'Très Bonne', playtime: 'Modéré' },
  { name: 'Standard de Liège', league: 'Jupiler Pro League (Belgique)', tier: 'D1', minOvr: 49, coachName: 'Ivan Leko', coachStyle: 'Rugueux, agressif dans les duels et mentalité de feu.', trainingQuality: 'Excellente (Académie réputée)', playtime: 'Faible à Modéré' },
  { name: 'Charleroi SC', league: 'Jupiler Pro League (Belgique)', tier: 'D1', minOvr: 47, coachName: 'Rik De Mil', coachStyle: 'Bloc compact et contre-attaques foudroyantes.', trainingQuality: 'Bonne', playtime: 'Modéré' },
  { name: 'Westerlo', league: 'Jupiler Pro League (Belgique)', tier: 'D1', minOvr: 46, coachName: 'Timmy Simons', coachStyle: 'Discipline tactique et rigueur au milieu de terrain.', trainingQuality: 'Bonne', playtime: 'Modéré' },
  { name: 'FC Groningen', league: 'Eredivisie (Pays-Bas)', tier: 'D1', minOvr: 48, coachName: 'Dick Lukkien', coachStyle: 'Formation de jeunes, audace et jeu au sol.', trainingQuality: 'Excellente (Tremplin idéal jeunes)', playtime: 'Modéré' },
  { name: 'NEC Nijmegen', league: 'Eredivisie (Pays-Bas)', tier: 'D1', minOvr: 49, coachName: 'Rogier Meijer', coachStyle: 'Organisation rigoureuse et transitions propres.', trainingQuality: 'Très Bonne', playtime: 'Faible à Modéré' },
  { name: 'FC Utrecht', league: 'Eredivisie (Pays-Bas)', tier: 'D1', minOvr: 50, coachName: 'Ron Jans', coachStyle: 'Expérience, solidité et percussion offensive.', trainingQuality: 'Excellente', playtime: 'Faible' }
];

// Fonction pour générer une sélection aléatoire de 4 clubs parmi toute la liste massive
function getRandomStarterClubs() {
  let shuffled = [...CITIES_AND_CLUBS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 4);
}

// Variable globale dynamique pour les clubs de départ de la session actuelle
let dynamicStarterClubs = getRandomStarterClubs();

// --- FONCTION DE GÉNÉRATION DYNAMIQUE DES OBJECTIFS & CONTRAT JEUNE ---

function getYouthCategoryAndExpectations(ovr, position, tier) {
  let category = "U16";
  if (ovr >= 44 && ovr < 49) category = "U17";
  else if (ovr >= 49) category = "U19";

  let multiplier = 1;
  if (tier === 'D2') multiplier = 1.3;
  if (tier === 'D1') multiplier = 1.6;

  let expectations = { goals: 0, assists: 0, cleanSheets: 0 };
  let boardExpectation = "";

  const pos = position.toLowerCase();

  if (['bu', 'ad', 'ag', 'moc'].includes(pos)) {
    let baseGoals = pos === 'bu' ? randInt(6, 12) : randInt(4, 9);
    let baseAssists = pos === 'bu' ? randInt(3, 7) : randInt(5, 10);
    expectations.goals = Math.round(baseGoals * multiplier);
    expectations.assists = Math.round(baseAssists * multiplier);
    boardExpectation = `S'imposer comme un élément clé de l'attaque en ${category} et être décisif dans les 30 derniers mètres.`;
  } else if (['mc', 'mdc'].includes(pos)) {
    expectations.goals = Math.round(randInt(2, 5) * multiplier);
    expectations.assists = Math.round(randInt(4, 8) * multiplier);
    boardExpectation = `Assurer l'équilibre de l'entrejeu en ${category}, couper les transmissions adverses et orienter le tempo.`;
  } else if (['dd', 'dg', 'dc'].includes(pos)) {
    expectations.goals = Math.round(randInt(1, 3) * multiplier);
    expectations.cleanSheets = Math.round(randInt(4, 9) * multiplier);
    boardExpectation = `Maintenir la rigueur défensive de la arrière-garde en ${category} et limiter les erreurs de relance.`;
  } else if (pos === 'gk') {
    expectations.cleanSheets = Math.round(randInt(6, 12) * multiplier);
    boardExpectation = `Verrouiller sa cage en ${category}, diriger sa ligne défensive et rassurer sur les ballons aériens.`;
  }

  return {
    category,
    expectations,
    boardExpectation,
    contractText: `Contrat jeune (Formation ${category}) - Pas encore de contrat professionnel.`
  };
}

// --- ÉCONOMIE DU STAFF PRIVÉ ---

const STAFF_DATA = {
  physio: [
    { id: 0, name: 'Aucun', cost: 0, desc: 'Pas de préparateur physique personnel.', effect: 'Aucun' },
    { id: 1, name: 'Préparateur Amateur', unlock: (p) => p.balance > 500, cost: 200, desc: 'Niveau local', effect: 'Risque blessure -5%, Récupération +5%' },
    { id: 2, name: 'Préparateur Pro', unlock: (p) => p.weeklySalary >= 5000, cost: 2500, desc: 'Niveau championnat national', effect: 'Risque blessure -20%, Récupération +20%' },
    { id: 3, name: 'Spécialiste Élite Mondial', unlock: (p) => p.fame >= 70 && p.weeklySalary >= 50000, cost: 15000, desc: 'Niveau Ligue des Champions', effect: 'Risque blessure -50%, Récupération +50%' }
  ],
  tech: [
    { id: 0, name: 'Aucun', cost: 0, desc: 'Pas de préparateur technique personnel.', effect: 'Aucun' },
    { id: 1, name: 'Grand Frère / Ex-Pro Local', unlock: (p) => p.balance > 300, cost: 150, desc: 'Conseils techniques de base', effect: 'XP Dribble/Tir +5%' },
    { id: 2, name: 'Spécialiste Spécifique', unlock: (p) => p.weeklySalary >= 3000, cost: 1800, desc: 'Coach de tir / dribble dédié', effect: 'XP Technique ciblée +15%' },
    { id: 3, name: 'Légende Retraitée', unlock: (p) => p.fame >= 80 && p.balance > 100000, cost: 12000, desc: 'Icône du football', effect: 'XP Technique +35%, Gestes 5⭐' }
  ],
  mental: [
    { id: 0, name: 'Aucun', cost: 0, desc: 'Aucun suivi mental.', effect: 'Aucun' },
    { id: 1, name: 'App & Livres Dev Perso', unlock: (p) => p.balance > 100, cost: 50, desc: 'Lecture et application', effect: 'Plancher mental minimal à 50' },
    { id: 2, name: 'Psychologue du Sport', unlock: (p) => p.weeklySalary >= 2000, cost: 1200, desc: 'Suivi pro indépendant', effect: 'Régénération +10 mental / semaine' },
    { id: 3, name: 'Guru des Stars', unlock: (p) => p.fame >= 60, cost: 8000, desc: 'Accompagnement VIP', effect: 'Immunité totale aux sifflets' }
  ],
  chef: [
    { id: 0, name: 'Cantine Standard', cost: 0, desc: 'Repas classiques du club', effect: 'Statut neutre' },
    { id: 1, name: 'Diététicien Sportif Privé', unlock: (p) => p.weeklySalary >= 4000, cost: 1500, desc: 'Suivi nutritionnel', effect: 'Condition physique +10% après la 70e' },
    { id: 2, name: 'Chef Étoilé Personnel', unlock: (p) => p.fame >= 75, cost: 10000, desc: 'Haute gastronomie sportive', effect: 'Fatigue cumulative -30%' }
  ]
};

// --- FONCTION DE GÉNÉRATION PAR IA ---

async function generateAIEvents(playerState) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const recentHistory = playerState.history && playerState.history.length > 0 
    ? playerState.history.slice(-5).map(h => h.context).join(", ") 
    : "Aucun historique récent";

  const prompt = `
    Tu es le moteur narratif d'un RPG textuel de football ultra-réaliste et imprévisible.
    Voici l'état actuel du joueur :
    - Nom : ${playerState.firstName} ${playerState.lastName}
    - Âge : ${playerState.age} ans
    - Poste : ${playerState.position}
    - Club : ${playerState.currentClub}
    - Stats : Technique ${playerState.stats.technique}, Physique ${playerState.stats.physique}, Mental ${playerState.stats.mental}
    - Relation Coach : ${playerState.stats.relationCoach}/100
    - Solde : $${playerState.balance}

    ÉVÉNEMENTS RÉCENTS À NE SURTOUT PAS REPRODUIRE (INTERDICTION FORMELLE DE RÉPÉTER CES THÈMES OU FORMULATIONS) :
    [ ${recentHistory} ]

    Génère UN événement narratif complètement inédit, surprenant et varié (ex: vie de groupe, proposition extérieure, problème extrasportif, tactique, relation presse ou entraîneur, fatigue, opportunité, etc.).
    
    Règles strictes :
    1. Propose OBLIGATOIREMENT au moins 4 choix distincts pour le joueur.
    2. Renvoie le résultat STRICTEMENT au format JSON avec cette structure précise :
    {
      "context": "Titre court et original du contexte",
      "text": "Le texte narratif décrivant la situation...",
      "choices": [
        {
          "text": "Description du choix 1",
          "impact": { "mental": 5, "discipline": -2 }
        },
        {
          "text": "Description du choix 2",
          "impact": { "technique": 3, "relationCoach": -4 }
        },
        {
          "text": "Description du choix 3",
          "impact": { "physique": -2, "reputation": 2 }
        },
        {
          "text": "Description du choix 4",
          "impact": { "mental": -5, "balance": 100 }
        }
      ]
    }
  `;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    const parsedEvent = JSON.parse(rawText);

    if (!playerState.history) playerState.history = [];
    playerState.history.push({ context: parsedEvent.context });

    return parsedEvent;

  } catch (error) {
    console.error("Erreur API Gemini:", error);
    return {
      context: `Session d'entraînement intense (${playerState.age} ans)`,
      text: `Une tension particulière émerge lors de la mise en place tactique de la semaine au sein du club de ${playerState.currentClub}. Comment gères-tu la situation ?`,
      choices: [
        { text: "Prendre les devants et motiver le groupe", impact: { mental: +3, relationCoach: +2 } },
        { text: "Garder profil bas et tout donner à l'entraînement", impact: { technique: +2, physique: +2 } },
        { text: "Provoquer une discussion franche avec l'entraîneur", impact: { relationCoach: +5, mental: -2 } },
        { text: "Faire cavalier seul pour briller individuellement", impact: { technique: +4, vestiaire: -4 } }
      ]
    };
  }
}

// --- ÉTAT GLOBAL ET GESTION DU JEU ---

let savedData = JSON.parse(localStorage.getItem('career_rpg_save'));
if (savedData && (!savedData.coach || !savedData.staff || savedData.age === undefined)) {
  savedData = null; 
}

// Génération aléatoire initiale des nom/prénom pour le formulaire
const initialRandName = getRandomPlayerName();

let state = {
  player: savedData,
  activeEvent: null,
  activeTab: 'dashboard',
  creationStep: 1,
  form: {
    firstName: initialRandName.firstName,
    lastName: initialRandName.lastName,
    nationality: NATIONALITIES[0],
    height: 180,
    weight: 75,
    position: 'BU',
    origin: ORIGINS[0],
    heartClubLeague: Object.keys(BIG_LEAGUES_CLUBS)[0],
    heartClubName: BIG_LEAGUES_CLUBS["Ligue 1 McDonald's (France)"][0]
  }
};

let lastChoiceFeedback = null;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePlayer(formData, selectedStarterClub) {
  let baseOvr = randInt(38, 48);
  if (formData.origin.id === 'tardif') baseOvr -= 5;
  let basePot = randInt(75, 95);

  let stats = {
    technique: randInt(40, 52),
    physique: randInt(40, 50),
    mental: randInt(35, 45),
    charisme: randInt(20, 50),
    reputation: 10,
    discipline: 50,
    relationCoach: 50,
    vestiaire: 50
  };

  const youthData = getYouthCategoryAndExpectations(baseOvr, formData.position, selectedStarterClub.tier);

  return {
    firstName: formData.firstName,
    lastName: formData.lastName,
    nationality: formData.nationality,
    position: formData.position,
    origin: formData.origin,
    height: formData.height,
    weight: formData.weight,
    age: 14,
    ovr: baseOvr,
    pot: basePot,
    stats: stats,
    traits: [formData.origin.trait],
    week: 1,
    currentClub: selectedStarterClub.name,
    weeklySalary: selectedStarterClub.weeklySalary || 150,
    balance: 300,
    fame: 10,
    coach: {
      name: selectedStarterClub.coachName,
      style: selectedStarterClub.coachStyle,
      category: youthData.category,
      expectations: youthData.expectations,
      boardExpectation: youthData.boardExpectation,
      contractText: youthData.contractText,
      currentGoals: 0,
      currentAssists: 0,
      currentCleanSheets: 0
    },
    staff: {
      physio: 0,
      tech: 0,
      mental: 0,
      chef: 0
    },
    heartClub: formData.heartClubName,
    history: []
  };
}

function updateFormInput() {
  const fnInput = document.getElementById('inp-fn');
  const lnInput = document.getElementById('inp-ln');
  const hInput = document.getElementById('inp-h');
  const wInput = document.getElementById('inp-w');

  if (fnInput) state.form.firstName = fnInput.value;
  if (lnInput) state.form.lastName = lnInput.value;
  if (hInput) state.form.height = parseInt(hInput.value);
  if (wInput) state.form.weight = parseInt(wInput.value);
}

function randomizeName() {
  const newName = getRandomPlayerName();
  state.form.firstName = newName.firstName;
  state.form.lastName = newName.lastName;
  render();
}

function nextStep() {
  updateFormInput();
  state.creationStep += 1;
  render();
}

function prevStep() {
  updateFormInput();
  state.creationStep -= 1;
  render();
}

function setPos(p) { updateFormInput(); state.form.position = p; render(); }
function selectOrigin(id) { updateFormInput(); state.form.origin = ORIGINS.find(o => o.id === id); render(); }
function setNat(name) { updateFormInput(); state.form.nationality = NATIONALITIES.find(n => n.name === name); render(); }
function setHeartLeague(league) {
  updateFormInput();
  state.form.heartClubLeague = league;
  state.form.heartClubName = BIG_LEAGUES_CLUBS[league][0];
  render();
}
function setHeartClub(club) {
  updateFormInput();
  state.form.heartClubName = club;
  render();
}

function submitCreation(clubIndex) {
  updateFormInput();
  const chosenClub = dynamicStarterClubs[clubIndex] || dynamicStarterClubs[0];
  state.player = generatePlayer(state.form, chosenClub);
  
  if (state.player.currentClub === state.player.heartClub) {
    state.player.stats.mental += 10;
  }

  localStorage.setItem('career_rpg_save', JSON.stringify(state.player));
  render();
}

function resetCareer() {
  localStorage.removeItem('career_rpg_save');
  state.player = null;
  state.activeEvent = null;
  state.creationStep = 1;
  lastChoiceFeedback = null;
  dynamicStarterClubs = getRandomStarterClubs();
  const newRandName = getRandomPlayerName();
  state.form.firstName = newRandName.firstName;
  state.form.lastName = newRandName.lastName;
  render();
}

function setTab(tab) {
  state.activeTab = tab;
  render();
}

function hireStaff(category, level) {
  state.player.staff[category] = level;
  localStorage.setItem('career_rpg_save', JSON.stringify(state.player));
  render();
}

async function advanceWeek() {
  state.player.week += 1;
  state.player.balance += state.player.weeklySalary;
  lastChoiceFeedback = null;

  if (state.player.week % 52 === 0) {
    state.player.age += 1;
  }

  if (Math.random() < 0.6) {
    if (['bu', 'ad', 'ag', 'moc'].includes(state.player.position)) {
      if (Math.random() > 0.5) state.player.coach.currentGoals += 1;
      else state.player.coach.currentAssists += 1;
    } else if (['mc', 'mdc'].includes(state.player.position)) {
      if (Math.random() > 0.7) state.player.coach.currentGoals += 1;
      else state.player.coach.currentAssists += 1;
    } else if (state.player.position === 'gk') {
      state.player.coach.currentCleanSheets += 1;
    } else {
      if (Math.random() > 0.6) state.player.coach.currentGoals += 1;
      else state.player.coach.currentCleanSheets += 1;
    }
  }

  if (state.player.week % 4 === 0) {
    let totalStaffCost = 
      STAFF_DATA.physio[state.player.staff.physio].cost +
      STAFF_DATA.tech[state.player.staff.tech].cost +
      STAFF_DATA.mental[state.player.staff.mental].cost +
      STAFF_DATA.chef[state.player.staff.chef].cost;

    state.player.balance -= totalStaffCost;
  }

  if (Math.random() < 0.7) {
    state.activeEvent = await generateAIEvents(state.player);
  } else {
    state.activeEvent = null;
  }

  localStorage.setItem('career_rpg_save', JSON.stringify(state.player));
  render();
}

function handleChoice(choice) {
  let impactSummary = {};

  for (let stat in choice.impact) {
    let val = choice.impact[stat];
    impactSummary[stat] = val;

    if (state.player.stats.hasOwnProperty(stat)) {
      state.player.stats[stat] = Math.max(0, Math.min(100, state.player.stats[stat] + val));
    } else if (state.player.hasOwnProperty(stat)) {
      state.player[stat] += val;
    }
  }
  
  state.player.ovr = Math.round((state.player.stats.technique * 0.4) + (state.player.stats.physique * 0.3) + (state.player.stats.mental * 0.3));
  lastChoiceFeedback = impactSummary;

  state.activeEvent = null;
  localStorage.setItem('career_rpg_save', JSON.stringify(state.player));
  render();
}

// --- RENDU GRAPHIQUE ---

function render() {
  const app = document.getElementById('app');
  if (!app) return;

  if (!state.player) {
    let stepContent = '';

    if (state.creationStep === 1) {
      stepContent = `
        <div class="space-y-4">
          <div class="text-center">
            <span class="text-xs text-emerald-400 font-bold uppercase tracking-wider">Étape 1 / 6</span>
            <h3 class="text-base font-bold text-white mt-1">Identité & Nationalité</h3>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-slate-400 font-bold">Prénom</label>
              <input id="inp-fn" type="text" value="${state.form.firstName}" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white mt-1"/>
            </div>
            <div>
              <label class="text-xs text-slate-400 font-bold">Nom</label>
              <input id="inp-ln" type="text" value="${state.form.lastName}" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white mt-1"/>
            </div>
          </div>
          <button onclick="randomizeName()" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors border border-slate-700">
            🎲 Générer un autre nom aléatoire
          </button>
          <div>
            <label class="text-xs text-slate-400 font-bold">Nationalité</label>
            <select onchange="setNat(this.value)" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white mt-1">
              ${NATIONALITIES.map(n => `<option value="${n.name}" ${state.form.nationality.name === n.name ? 'selected' : ''}>${n.flag} ${n.name}</option>`).join('')}
            </select>
          </div>
          <button onclick="nextStep()" class="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors">
            Suivant ➡️
          </button>
        </div>
      `;
    } else if (state.creationStep === 2) {
      stepContent = `
        <div class="space-y-4">
          <div class="text-center">
            <span class="text-xs text-emerald-400 font-bold uppercase tracking-wider">Étape 2 / 6</span>
            <h3 class="text-base font-bold text-white mt-1">Morphologie</h3>
          </div>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-slate-400 font-bold">Taille : <span id="val-h">${state.form.height}</span>cm</label>
              <input id="inp-h" type="range" min="160" max="205" value="${state.form.height}" oninput="document.getElementById('val-h').innerText=this.value" class="w-full mt-2 accent-emerald-400"/>
            </div>
            <div>
              <label class="text-xs text-slate-400 font-bold">Poids : <span id="val-w">${state.form.weight}</span>kg</label>
              <input id="inp-w" type="range" min="55" max="100" value="${state.form.weight}" oninput="document.getElementById('val-w').innerText=this.value" class="w-full mt-2 accent-emerald-400"/>
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="prevStep()" class="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors">
              ⬅️ Précédent
            </button>
            <button onclick="nextStep()" class="w-2/3 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors">
              Suivant ➡️
            </button>
          </div>
        </div>
      `;
    } else if (state.creationStep === 3) {
      stepContent = `
        <div class="space-y-4">
          <div class="text-center">
            <span class="text-xs text-emerald-400 font-bold uppercase tracking-wider">Étape 3 / 6</span>
            <h3 class="text-base font-bold text-white mt-1">Poste sur le Terrain</h3>
          </div>
          <div class="grid grid-cols-3 gap-2">
            ${POSITIONS.map(p => `<button type="button" onclick="setPos('${p.id}')" class="p-3 rounded-xl border text-xs font-bold transition-all ${state.form.position === p.id ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-300'}">${p.label}</button>`).join('')}
          </div>
          <div class="flex gap-2">
            <button onclick="prevStep()" class="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors">
              ⬅️ Précédent
            </button>
            <button onclick="nextStep()" class="w-2/3 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors">
              Suivant ➡️
            </button>
          </div>
        </div>
      `;
    } else if (state.creationStep === 4) {
      stepContent = `
        <div class="space-y-4">
          <div class="text-center">
            <span class="text-xs text-emerald-400 font-bold uppercase tracking-wider">Étape 4 / 6</span>
            <h3 class="text-base font-bold text-white mt-1">Style d'Origine</h3>
            <p class="text-[11px] text-slate-400">Sélectionne ton parcours formatif initial :</p>
          </div>
          <div class="space-y-2 max-h-52 overflow-y-auto pr-1">
            ${ORIGINS.map(o => `
              <div onclick="selectOrigin('${o.id}')" class="p-3 rounded-xl border cursor-pointer text-xs transition-all ${state.form.origin.id === o.id ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}">
                <span class="font-bold text-white block text-sm">${o.name}</span>
                <span class="text-[10px] text-emerald-400 font-semibold block mt-0.5">${o.desc}</span>
                <p class="text-[11px] text-slate-300 mt-1 italic">${o.longDesc}</p>
              </div>
            `).join('')}
          </div>
          <div class="flex gap-2">
            <button onclick="prevStep()" class="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors">
              ⬅️ Précédent
            </button>
            <button onclick="nextStep()" class="w-2/3 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors">
              Suivant ➡️
            </button>
          </div>
        </div>
      `;
    } else if (state.creationStep === 5) {
      stepContent = `
        <div class="space-y-4">
          <div class="text-center">
            <span class="text-xs text-pink-400 font-bold uppercase tracking-wider">Étape 5 / 6</span>
            <h3 class="text-base font-bold text-white mt-1">❤️ Club de Cœur</h3>
            <p class="text-[11px] text-slate-400">Bonus de mental si tu y signes plus tard.</p>
          </div>
          <div class="space-y-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div>
              <label class="text-xs text-slate-400 font-bold">Championnat</label>
              <select onchange="setHeartLeague(this.value)" class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white mt-1">
                ${Object.keys(BIG_LEAGUES_CLUBS).map(l => `<option value="${l}" ${state.form.heartClubLeague === l ? 'selected' : ''}>${l}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="text-xs text-slate-400 font-bold">Club</label>
              <select onchange="setHeartClub(this.value)" class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white mt-1">
                ${BIG_LEAGUES_CLUBS[state.form.heartClubLeague].map(c => `<option value="${c}" ${state.form.heartClubName === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="prevStep()" class="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors">
              ⬅️ Précédent
            </button>
            <button onclick="nextStep()" class="w-2/3 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors">
              Suivant ➡️
            </button>
          </div>
        </div>
      `;
    } else if (state.creationStep === 6) {
      stepContent = `
        <div class="space-y-4">
          <div class="text-center">
            <span class="text-xs text-yellow-400 font-bold uppercase tracking-wider">Étape 6 / 6</span>
            <h3 class="text-base font-bold text-white mt-1">🏟️ Club de Départ</h3>
            <p class="text-[11px] text-slate-400">Choisis ton point de chute selon la qualité de formation et le temps de jeu :</p>
          </div>
          <div class="space-y-3 max-h-64 overflow-y-auto pr-1">
            ${dynamicStarterClubs.map((club, index) => {
              let simOvr = 42;
              if (state.form.origin.id === 'tardif') simOvr -= 5;
              const previewData = getYouthCategoryAndExpectations(simOvr, state.form.position, club.tier);
              
              return `
                <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div class="flex justify-between items-center">
                    <div>
                      <span class="font-bold text-white text-sm">${club.name}</span>
                      <span class="text-[10px] text-slate-400 block">${club.league} (${club.tier})</span>
                    </div>
                    <button onclick="submitCreation(${index})" class="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-lg text-xs transition-colors">
                      Choisir ✍️
                    </button>
                  </div>
                  <div class="text-[11px] text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800/60 space-y-1.5">
                    <div class="text-emerald-400 font-bold">📄 ${previewData.contractText}</div>
                    <div class="grid grid-cols-2 gap-1 pt-1 border-t border-slate-800">
                      <div>⭐ Formation : <span class="text-slate-200 font-semibold">${club.trainingQuality || 'Standard'}</span></div>
                      <div>⏱️ Temps de jeu : <span class="text-yellow-300 font-semibold">${club.playtime || 'Correct'}</span></div>
                    </div>
                    <div>👨‍🏫 Entraîneur : <span class="text-slate-200 font-semibold">${club.coachName}</span> (${previewData.category})</div>
                    <div>🎯 Objectifs : <span class="text-slate-300">${previewData.expectations.goals > 0 ? previewData.expectations.goals + ' Buts' : ''} ${previewData.expectations.assists > 0 ? previewData.expectations.assists + ' Passes D' : ''} ${previewData.expectations.cleanSheets > 0 ? previewData.expectations.cleanSheets + ' Clean Sheets' : ''}</span></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <div>
            <button onclick="prevStep()" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors">
              ⬅️ Précédent
            </button>
          </div>
        </div>
      `;
    }

    app.innerHTML = `
      <div class="max-w-xl mx-auto my-6 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-white shadow-xl">
        <h1 class="text-lg font-black text-center text-emerald-400 uppercase tracking-wider">Création du Joueur & Carrière</h1>
        ${stepContent}
      </div>
    `;
  } else {
    let eventModalHTML = '';
    if (state.activeEvent) {
      eventModalHTML = `
        <div class="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div class="bg-slate-900 border-2 border-emerald-500 p-5 rounded-2xl max-w-lg w-full my-auto space-y-4 shadow-2xl">
            <div>
              <span class="text-xs font-black uppercase text-emerald-400 tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">${state.activeEvent.context}</span>
              <p class="text-white text-sm mt-3 leading-relaxed">${state.activeEvent.text}</p>
            </div>
            
            <div class="space-y-2">
              ${state.activeEvent.choices.map((c, index) => `
                <button onclick='handleChoice(${JSON.stringify(c)})' 
                        class="w-full text-left p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500 rounded-xl text-xs text-slate-300 hover:text-white transition-all flex items-center gap-3 group">
                  <span class="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 group-hover:border-emerald-400 group-hover:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0">${index + 1}</span>
                  <span>${c.text}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    let tabContent = '';

    if (state.activeTab === 'dashboard') {
      let feedbackHtml = '';
      if (lastChoiceFeedback) {
        feedbackHtml = `
          <div class="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-emerald-400 text-xs space-y-1 animate-pulse">
            <div class="font-bold uppercase tracking-wider">⚡ Dernier impact enregistré :</div>
            <div class="flex flex-wrap gap-2">
              ${Object.keys(lastChoiceFeedback).map(k => `<span class="bg-slate-950 px-2 py-0.5 rounded border border-emerald-500/30">${k}: <b>${lastChoiceFeedback[k] > 0 ? '+' + lastChoiceFeedback[k] : lastChoiceFeedback[k]}</b></span>`).join('')}
            </div>
          </div>
        `;
      }

      tabContent = `
        ${feedbackHtml}
        <div class="text-xs text-slate-300 space-y-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div class="flex justify-between items-center">
            <span>Club actuel : <span class="text-yellow-400 font-bold">${state.player.currentClub}</span></span>
            <span class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-bold">Âge : ${state.player.age || 14} ans • Semaine ${state.player.week}</span>
          </div>
          <div>❤️ Club de cœur : <span class="text-pink-400 font-bold">${state.player.heartClub}</span></div>
          <div class="border-t border-slate-800 pt-2 space-y-1.5">
            <div class="text-emerald-400 font-bold">📄 ${state.player.coach.contractText}</div>
            <div>👨‍🏫 Entraîneur : <span class="text-slate-200 font-bold">${state.player.coach.name}</span> (Équipe <span class="text-yellow-400 font-bold">${state.player.coach.category}</span>)</div>
            <div>📋 Style : <span class="text-slate-400 italic">${state.player.coach.style}</span></div>
            <div class="text-slate-300 bg-slate-900 p-2 rounded border border-slate-800/60 mt-1">
              <span class="font-semibold text-white block mb-0.5">Attentes du coach :</span>
              <span class="text-slate-400 italic">${state.player.coach.boardExpectation}</span>
            </div>
            <div class="flex justify-between pt-1 font-semibold">
              ${state.player.coach.expectations.goals !== undefined ? `<span>Buts : <b class="text-white">${state.player.coach.currentGoals} / ${state.player.coach.expectations.goals}</b></span>` : ''}
              ${state.player.coach.expectations.assists !== undefined ? `<span>Passes D : <b class="text-white">${state.player.coach.currentAssists} / ${state.player.coach.expectations.assists}</b></span>` : ''}
              ${state.player.coach.expectations.cleanSheets !== undefined ? `<span>Clean Sheets : <b class="text-white">${state.player.coach.currentCleanSheets} / ${state.player.coach.expectations.cleanSheets}</b></span>` : ''}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div class="font-bold text-slate-400 uppercase tracking-wider">Stats & Relation</div>
            <div class="flex justify-between"><span>Technique :</span> <span class="font-bold text-white">${state.player.stats.technique}</span></div>
            <div class="flex justify-between"><span>Physique :</span> <span class="font-bold text-white">${state.player.stats.physique}</span></div>
            <div class="flex justify-between"><span>Mental :</span> <span class="font-bold text-white">${state.player.stats.mental}</span></div>
            <div class="flex justify-between"><span>Relation Coach :</span> <span class="font-bold text-emerald-400">${state.player.stats.relationCoach}/100</span></div>
          </div>
          
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div class="font-bold text-slate-400 uppercase tracking-wider">Évaluation (OVR)</div>
            <div class="flex justify-between"><span>Général (OVR) :</span> <span class="font-bold text-yellow-400 text-sm">${state.player.ovr}</span></div>
            <div class="flex justify-between"><span>Potentiel (POT) :</span> <span class="font-bold text-emerald-400 text-sm">${state.player.pot}</span></div>
            <div class="flex justify-between"><span>Trait :</span> <span class="font-semibold text-slate-200">${state.player.traits[0]}</span></div>
          </div>
        </div>
      `;
    } else if (state.activeTab === 'staff') {
      const categories = [
        { key: 'physio', title: '1. Préparateur Physique', list: STAFF_DATA.physio },
        { key: 'tech', title: '2. Préparateur Technique', list: STAFF_DATA.tech },
        { key: 'mental', title: '3. Coach Mental', list: STAFF_DATA.mental },
        { key: 'chef', title: '4. Cuisinier & Nutritionniste', list: STAFF_DATA.chef }
      ];

      tabContent = `
        <div class="space-y-4 max-h-[50vh] overflow-y-auto pr-1 text-xs">
          ${categories.map(cat => `
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <div class="font-bold text-yellow-400 uppercase">${cat.title}</div>
              <div class="space-y-1.5">
                ${cat.list.map(tier => {
                  const isUnlocked = tier.unlock ? tier.unlock(state.player) : true;
                  const isCurrent = state.player.staff[cat.key] === tier.id;
                  return `
                    <div class="p-2.5 rounded-lg border flex justify-between items-center bg-slate-900 ${isCurrent ? 'border-emerald-500' : 'border-slate-800'}">
                      <div class="space-y-0.5">
                        <div class="font-bold text-white">${tier.name} <span class="text-slate-400 font-normal">($${tier.cost}/mois)</span></div>
                        <div class="text-[10px] text-slate-400">${tier.effect}</div>
                      </div>
                      <div>
                        ${isCurrent ? 
                          '<span class="text-emerald-400 font-bold px-2 py-1 bg-emerald-500/10 rounded">Actif</span>' :
                          isUnlocked ? 
                            `<button onclick="hireStaff('${cat.key}', ${tier.id})" class="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded">Engager</button>` :
                            '<span class="text-red-400 text-[10px]">Verrouillé</span>'
                        }
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (state.activeTab === 'finances') {
      let totalMonthlyCost = 
        STAFF_DATA.physio[state.player.staff.physio].cost +
        STAFF_DATA.tech[state.player.staff.tech].cost +
        STAFF_DATA.mental[state.player.staff.mental].cost +
        STAFF_DATA.chef[state.player.staff.chef].cost;

      tabContent = `
        <div class="space-y-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div class="font-bold text-emerald-400 uppercase tracking-wider text-sm mb-2">Bilan Financier & Personnel</div>
          <div class="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
            <span>Solde Actuel :</span>
            <span class="font-bold text-yellow-400">$${state.player.balance.toLocaleString()}</span>
          </div>
          <div class="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
            <span>Allocation / Bourse Jeune :</span>
            <span class="font-bold text-emerald-400">+$${state.player.weeklySalary.toLocaleString()} / sem</span>
          </div>
          <div class="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
            <span>Coût total du Staff (Mensuel) :</span>
            <span class="font-bold text-red-400">-$${totalMonthlyCost.toLocaleString()} / mois</span>
          </div>
          <div class="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
            <span>Notoriété (Fame) :</span>
            <span class="font-bold text-pink-400">${state.player.fame} / 100</span>
          </div>
        </div>
      `;
    }

    app.innerHTML = `
      ${eventModalHTML}
      <div class="max-w-xl mx-auto my-6 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-white shadow-xl">
        <h2 class="text-lg font-black text-emerald-400 flex justify-between items-center">
          <span>${state.player.firstName} ${state.player.lastName} ${state.player.nationality.flag}</span>
          <span class="text-xs bg-slate-950 border border-slate-800 px-2 py-1 rounded text-slate-300 uppercase">${state.player.position}</span>
        </h2>

        <div class="grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button onclick="setTab('dashboard')" class="py-2 text-xs font-bold rounded-lg transition-all ${state.activeTab === 'dashboard' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}">Dashboard</button>
          <button onclick="setTab('staff')" class="py-2 text-xs font-bold rounded-lg transition-all ${state.activeTab === 'staff' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}">Staff Privé</button>
          <button onclick="setTab('finances')" class="py-2 text-xs font-bold rounded-lg transition-all ${state.activeTab === 'finances' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}">Finances</button>
        </div>

        ${tabContent}

        <button onclick="advanceWeek()" ${state.activeEvent ? 'disabled class="opacity-50 cursor-not-allowed"' : ''} class="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-black rounded-xl text-white uppercase text-xs tracking-wider shadow-lg transition-all">
          📅 Avancer d'une Semaine (IA / Match)
        </button>

        <button onclick="resetCareer()" class="w-full py-2 bg-slate-950 hover:bg-red-950/40 text-red-400 border border-slate-800 hover:border-red-900 font-bold rounded-xl text-xs uppercase tracking-wide transition-colors">
          Refaire un joueur
        </button>
      </div>
    `;
  }
}

render();
