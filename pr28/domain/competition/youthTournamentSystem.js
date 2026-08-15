// Street to Pro — compétitions internationales de jeunes.
// Modèle volontairement compatible avec le calendrier actuel : phase de ligue/groupes + élimination directe.

export const YOUTH_TOURNAMENTS = Object.freeze({
  YOUTH_LEAGUE: {
    id: 'YOUTH_LEAGUE', name: 'UEFA Youth League', type: 'continental_youth', minAge: 16, maxAge: 19,
    groupMonths: [9,10,11,12], knockoutMonths: [2,3,4,5], requiresEuropeanAcademy: true
  },
  U20_WORLD_CUP: {
    id: 'U20_WORLD_CUP', name: 'Coupe du Monde U20', type: 'international_youth', minAge: 17, maxAge: 20,
    groupMonths: [6], knockoutMonths: [6,7], cycle: 2
  }
});

function hashSeed(input) { let h=2166136261; for(const c of String(input)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);} return h>>>0; }
function pick(seed, values){return values.length?values[hashSeed(seed)%values.length]:null;}
const EUROPEAN_COUNTRIES=new Set(['France','Angleterre','Espagne','Italie','Allemagne','Portugal','Pays-Bas','Belgique','Croatie','Suisse']);
const U20_OPPONENTS=['Brésil','Argentine','Espagne','Angleterre','Italie','Allemagne','Portugal','Pays-Bas','Maroc','Sénégal','Japon','Corée du Sud','Uruguay','Colombie','Mexique','États-Unis'];

export function youthLeagueEligible(player={}){
  const age=Number(player.age)||0;
  if(age<16||age>19)return false;
  const country=player.clubCountry||player.youthClubData?.country||player.country;
  if(!EUROPEAN_COUNTRIES.has(country))return false;
  return Boolean(player.inEurope||player.europeanCompetition||player.clubLevel===1||player.youthClubData?.academyLevel==='elite');
}

export function u20WorldCupEligible(player={},year){
  const age=Number(player.age)||0;
  if(age<17||age>20||!(player.country||player.nationality))return false;
  // Tournoi biennal dans le moteur, les années impaires à partir de 2027.
  return Number(year)%2===1;
}

function fixture({id,competition,month,phase,round,index,opponent,importance='normal'}){
  const knockout=phase==='knockout';
  return {
    id:`${id}-${index+1}`,competitionId:competition.id,competitionName:competition.name,competitionType:competition.type,type:competition.type,
    month,phase,round,opponent,status:'scheduled',played:false,importance,
    knockout,requiresWinner:knockout,extraTime:knockout,penalties:knockout
  };
}

export function buildYouthLeagueFixtures(player={},seasonYear=2026){
  if(!youthLeagueEligible(player))return[];
  const c=YOUTH_TOURNAMENTS.YOUTH_LEAGUE;
  const pool=['Paris SG U19','Real Madrid U19','Barcelona U19','Manchester City U19','Arsenal U19','Bayern U19','Dortmund U19','Inter U19','Juventus U19','Benfica U19','Ajax U19'];
  const fixtures=[];
  for(let i=0;i<6;i++)fixtures.push(fixture({id:`YL-${seasonYear}`,competition:c,month:c.groupMonths[i%c.groupMonths.length],phase:'league_phase',round:'Phase de ligue',index:i,opponent:pick(`${seasonYear}|${player.club}|YL|${i}`,pool),importance:i>=4?'important':'normal'}));
  fixtures.push(fixture({id:`YL-${seasonYear}`,competition:c,month:2,phase:'knockout',round:'Huitièmes de finale',index:6,opponent:pick(`${seasonYear}|${player.club}|YL|R16`,pool),importance:'important'}));
  return fixtures;
}

export function buildU20WorldCupFixtures(player={},seasonYear=2026){
  if(!u20WorldCupEligible(player,seasonYear))return[];
  const c=YOUTH_TOURNAMENTS.U20_WORLD_CUP,country=player.country||player.nationality;
  const pool=U20_OPPONENTS.filter(x=>x!==country),fixtures=[];
  for(let i=0;i<3;i++)fixtures.push(fixture({id:`U20WC-${seasonYear}`,competition:c,month:6,phase:'group',round:'Phase de groupes',index:i,opponent:pick(`${seasonYear}|${country}|U20|G|${i}`,pool),importance:'important'}));
  fixtures.push(fixture({id:`U20WC-${seasonYear}`,competition:c,month:6,phase:'knockout',round:'Huitièmes de finale',index:3,opponent:pick(`${seasonYear}|${country}|U20|R16`,pool),importance:'major'}));
  return fixtures;
}

export function buildYouthTournamentFixtures(player={},seasonYear=2026){
  return [...buildYouthLeagueFixtures(player,seasonYear),...buildU20WorldCupFixtures(player,seasonYear)];
}

export default {YOUTH_TOURNAMENTS,youthLeagueEligible,u20WorldCupEligible,buildYouthLeagueFixtures,buildU20WorldCupFixtures,buildYouthTournamentFixtures};
