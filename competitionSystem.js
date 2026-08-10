// competitionSystem.js
// Calendrier saisonnier persistant + championnats + coupes + parcours europeen.

import { WorldSystem } from './worldSystem.js';
import { CupSystem } from './cupSystem.js';

export const COMPETITIONS = {
    FR_L1: { id: 'FR_L1', name: 'Ligue 1', country: 'France', level: 1, type: 'league', matches: 34 },
    FR_L2: { id: 'FR_L2', name: 'Ligue 2', country: 'France', level: 2, type: 'league', matches: 34 },
    EN_PL: { id: 'EN_PL', name: 'Premier League', country: 'Angleterre', level: 1, type: 'league', matches: 38 },
    EN_CH: { id: 'EN_CH', name: 'Championship', country: 'Angleterre', level: 2, type: 'league', matches: 46 },
    ES_LA: { id: 'ES_LA', name: 'La Liga', country: 'Espagne', level: 1, type: 'league', matches: 38 },
    ES_SD: { id: 'ES_SD', name: 'Segunda División', country: 'Espagne', level: 2, type: 'league', matches: 42 },
    IT_A: { id: 'IT_A', name: 'Serie A', country: 'Italie', level: 1, type: 'league', matches: 38 },
    IT_B: { id: 'IT_B', name: 'Serie B', country: 'Italie', level: 2, type: 'league', matches: 38 },
    DE_B1: { id: 'DE_B1', name: 'Bundesliga', country: 'Allemagne', level: 1, type: 'league', matches: 34 },
    DE_B2: { id: 'DE_B2', name: '2. Bundesliga', country: 'Allemagne', level: 2, type: 'league', matches: 34 },
    NATIONAL_CUP: { id: 'NATIONAL_CUP', name: 'Coupe nationale', type: 'cup', matches: null },
    CHAMPIONS_LEAGUE: { id: 'CHAMPIONS_LEAGUE', name: 'Ligue des Champions', type: 'continental', matches: 8 },
    EUROPA_LEAGUE: { id: 'EUROPA_LEAGUE', name: 'Ligue Europa', type: 'continental', matches: 8 },
    EURO: { id: 'EURO', name: 'Euro', type: 'international', matches: null },
    WORLD_CUP: { id: 'WORLD_CUP', name: 'Coupe du Monde', type: 'international', matches: null }
};

const SEASON_MONTHS = [8,9,10,11,12,1,2,3,4,5];
const ALL_MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12];
const MONTH_INFO = {
    1:{label:'Janvier',phase:'season',period:'Seconde partie de saison'},2:{label:'Février',phase:'season',period:'Seconde partie de saison'},
    3:{label:'Mars',phase:'season',period:'Seconde partie de saison'},4:{label:'Avril',phase:'season',period:'Sprint final'},
    5:{label:'Mai',phase:'finale',period:'Fin des compétitions'},6:{label:'Juin',phase:'offseason',period:'Bilan / sélections / intersaison'},
    7:{label:'Juillet',phase:'offseason',period:'Repos / préparation / mercato'},8:{label:'Août',phase:'season',period:'Pré-saison & reprise'},
    9:{label:'Septembre',phase:'season',period:'Première partie de saison'},10:{label:'Octobre',phase:'season',period:'Première partie de saison'},
    11:{label:'Novembre',phase:'season',period:'Première partie de saison'},12:{label:'Décembre',phase:'season',period:'Trêve hivernale / première partie de saison'}
};

const seasonLabel = year => `${year}/${year + 1}`;
const clamp = (v,min,max) => Math.min(max,Math.max(min,Number(v)||0));

function hashSeed(input){let h=2166136261;for(let i=0;i<String(input).length;i++){h^=String(input).charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function seededRandom(seed){let value=seed>>>0;return()=>{value+=0x6D2B79F5;let t=value;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function distributeExact(total,weights,random){const result=Object.fromEntries(SEASON_MONTHS.map(m=>[m,0]));if(total<=0)return result;const raw=SEASON_MONTHS.map(month=>({month,weight:Math.max(.001,Number(weights[month]||.1))})).map(x=>({...x,exact:total*x.weight}));let assigned=0;raw.forEach(x=>{result[x.month]=Math.floor(x.exact);assigned+=result[x.month];});raw.sort((a,b)=>{const d=(b.exact-Math.floor(b.exact))-(a.exact-Math.floor(a.exact));return d||random()-.5;});for(let i=0;i<total-assigned;i++)result[raw[i%raw.length].month]++;return result;}
function createMatch({competition,month,index,seasonYear,random,importance='normal'}){const info=MONTH_INFO[month];const home=random()>=.5;return{id:`${seasonYear}-${month}-${competition.id}-${index+1}`,competitionId:competition.id,competitionName:competition.name,type:competition.type,month,monthLabel:info.label,seasonYear,matchday:index+1,venue:home?'Domicile':'Extérieur',opponent:competition.type==='league'?'Adversaire de championnat':competition.name,importance,status:'scheduled',played:false};}
function importanceFor(month,index,total,random){if(month===5)return'major';if(index===total-1&&total>=30)return'important';if(random()<.12)return'important';return'normal';}
function clubEuropeanStrength(club){return Number(club?.strength||50)+Number(club?.prestige||0)*2;}

function getEuropeanQualification(player,competition){
    if(!player||Number(player.age)<18||Number(player.clubLevel)!==1)return{championsLeague:false,europaLeague:false,rank:null};
    const clubs=WorldSystem.getClubs(competition.id), playerClub=WorldSystem.getClub(player.clubId||player.club);
    if(!playerClub||!clubs.length)return{championsLeague:false,europaLeague:false,rank:null};
    const ranking=[...clubs].sort((a,b)=>clubEuropeanStrength(b)-clubEuropeanStrength(a));
    const rank=ranking.findIndex(c=>c.id===playerClub.id)+1;
    return{championsLeague:rank>=1&&rank<=4,europaLeague:rank>=5&&rank<=6,rank};
}

function europeanPool(player){
    const ids=Object.values(COMPETITIONS).filter(c=>c.type==='league'&&c.level===1).map(c=>c.id);
    const playerClub=WorldSystem.getClub(player?.clubId||player?.club);
    return ids.flatMap(id=>WorldSystem.getClubs(id)).filter(c=>c?.id&&c.id!==playerClub?.id).sort((a,b)=>clubEuropeanStrength(b)-clubEuropeanStrength(a));
}

function buildEuropeanLeague(player,seasonYear,random,qualification){
    if(!qualification.championsLeague&&!qualification.europaLeague)return[];
    const competition=qualification.championsLeague?COMPETITIONS.CHAMPIONS_LEAGUE:COMPETITIONS.EUROPA_LEAGUE;
    const pool=europeanPool(player), playerClub=WorldSystem.getClub(player?.clubId||player?.club);
    const months=[9,9,10,10,11,12,1,1], opponents=[];
    let cursor=0;while(opponents.length<8&&cursor<pool.length){const c=pool[cursor++];if(!opponents.some(o=>o.id===c.id))opponents.push(c);}
    return opponents.map((opponent,index)=>{const home=index%2===0;const m=createMatch({competition,month:months[index],index,seasonYear,random,importance:index>=6?'major':'important'});return{...m,competitionType:'continental',phase:'league_phase',matchday:index+1,playerClubId:playerClub?.id||player?.clubId||null,opponentClubId:opponent.id,opponent:opponent.name,venue:home?'Domicile':'Extérieur',homeClubId:home?playerClub?.id:opponent.id,awayClubId:home?opponent.id:playerClub?.id,homeClub:home?playerClub?.name:opponent.name,awayClub:home?opponent.name:playerClub?.name,europeanSlot:qualification.championsLeague?'UCL':'UEL',europeanRound:'Phase de ligue',played:false};});
}

function buildYouthSchedule(player,seasonYear,random){const age=Number(player?.age)||14;const category=age<=15?'U15':age===16?'U16':'U17/U19';const totals={U15:22,U16:26,'U17/U19':30};const total=totals[category]||22;const monthly=distributeExact(total,{8:.09,9:.10,10:.11,11:.11,12:.08,1:.09,2:.11,3:.11,4:.11,5:.09},random);const matches=[];for(const month of SEASON_MONTHS)for(let i=0;i<monthly[month];i++){const c={id:`YOUTH_${category.replace('/','_')}`,name:`${category} Formation`,type:'youth'};matches.push(createMatch({competition:c,month,index:matches.length,seasonYear,random,importance:importanceFor(month,i,monthly[month],random)}));}return{category,totalLeagueMatches:total,matches,extras:[]};}

function buildSeniorSchedule(player,seasonYear,random,competition){
    const monthly=distributeExact(competition.matches,{8:.08,9:.10,10:.11,11:.10,12:.07,1:.10,2:.11,3:.10,4:.12,5:.11},random);
    const clubs=WorldSystem.getClubs(competition.id),playerClub=WorldSystem.getClub(player?.clubId||player?.club),opponents=clubs.filter(c=>!playerClub||c.id!==playerClub.id);let cursor=0;const matches=[];
    for(const month of SEASON_MONTHS)for(let i=0;i<monthly[month];i++){const opponent=opponents.length?opponents[cursor++%opponents.length]:null;const m=createMatch({competition,month,index:matches.length,seasonYear,random,importance:importanceFor(month,i,monthly[month],random)});m.leagueId=competition.id;m.playerClubId=playerClub?.id||player?.clubId||null;m.opponent=opponent?.name||'Adversaire de championnat';m.opponentClubId=opponent?.id||null;m.homeClubId=m.venue==='Domicile'?m.playerClubId:m.opponentClubId;m.awayClubId=m.venue==='Domicile'?m.opponentClubId:m.playerClubId;matches.push(m);}
    const qualification=getEuropeanQualification(player,competition);player.inEurope=qualification.championsLeague||qualification.europaLeague;player.europeanCompetition=qualification.championsLeague?'CHAMPIONS_LEAGUE':qualification.europaLeague?'EUROPA_LEAGUE':null;player.europeanRank=qualification.rank;
    const extras=buildEuropeanLeague(player,seasonYear,random,qualification);return{category:'Senior',totalLeagueMatches:competition.matches,matches:[...matches,...extras],extras,europeanQualification:qualification};
}

function sortMatches(matches){const order=new Map(SEASON_MONTHS.map((m,i)=>[m,i]));return[...matches].sort((a,b)=>{const md=(order.get(a.month)||99)-(order.get(b.month)||99);if(md)return md;if(a.type!==b.type)return a.type==='league'?-1:1;return String(a.id).localeCompare(String(b.id));});}

// Génère le classement virtuel européen de la saison. Il permet de préparer
// les tours à élimination directe sans dépendre d'un moteur de résultats global.
function createEuropeanTournament(player,seasonYear,qualification,seed){
    if(!qualification.championsLeague&&!qualification.europaLeague)return null;
    const pool=europeanPool(player).slice(0,35), playerClub=WorldSystem.getClub(player?.clubId||player?.club);
    const clubs=[playerClub,...pool].filter(Boolean).slice(0,36);
    const standings=clubs.map((club,index)=>({clubId:club.id,club:club.name,played:0,points:0,goalsFor:0,goalsAgainst:0,strength:clubEuropeanStrength(club),rank:index+1}));
    // Le joueur démarre avec une position neutre ; ses performances de saison
    // pourront faire varier son indice avant la phase finale.
    const playerRow=standings.find(r=>r.clubId===playerClub?.id);if(playerRow){playerRow.rank=1;playerRow.points=0;}
    standings.sort((a,b)=>b.strength-a.strength||String(a.club).localeCompare(String(b.club)));
    standings.forEach((r,i)=>r.rank=i+1);
    return{version:1,seasonYear,seasonLabel:seasonLabel(seasonYear),competition:qualification.championsLeague?'CHAMPIONS_LEAGUE':'EUROPA_LEAGUE',slot:qualification.championsLeague?'UCL':'UEL',phase:'league_phase',leagueMatchesPlayed:0,leaguePoints:0,leagueGoalsFor:0,leagueGoalsAgainst:0,rank:null,qualified:false,eliminated:false,currentRound:null,standings,fixtures:[],history:[],seed};
}

function makeKnockoutFixture(tournament,player,round,month,opponent,index){
    const playerClub=WorldSystem.getClub(player?.clubId||player?.club),home=index%2===0;const comp=COMPETITIONS[tournament.competition];
    return{id:`${tournament.seasonYear}-${round}-${tournament.slot}-${index+1}`,competitionId:comp.id,competitionName:comp.name,type:'continental',competitionType:'continental',phase:'knockout',round,month,monthLabel:MONTH_INFO[month].label,seasonYear:tournament.seasonYear,matchday:index+1,importance:'major',status:'scheduled',played:false,playerClubId:playerClub?.id||player?.clubId||null,opponentClubId:opponent?.id||null,opponent:opponent?.name||'Adversaire européen',venue:home?'Domicile':'Extérieur',homeClubId:home?playerClub?.id:opponent?.id,awayClubId:home?opponent?.id:playerClub?.id,homeClub:home?playerClub?.name:opponent?.name,awayClub:home?opponent?.name:playerClub?.name,europeanSlot:tournament.slot,europeanRound:round};
}

function prepareKnockoutRoute(state){
    const tournament=state?.europeanTournament,player=state?.player;if(!tournament||tournament.eliminated||tournament.currentRound)return null;
    const row=tournament.standings?.find(r=>r.clubId===player?.clubId||r.clubId===WorldSystem.getClub(player?.clubId||player?.club)?.id);if(!row)return null;
    const rank=Number(tournament.rank||row.rank||18);tournament.rank=rank;
    if(rank>24){tournament.eliminated=true;tournament.phase='eliminated';return null;}
    const pool=europeanPool(player).filter(c=>c.id!==player?.clubId);const opponent=pool[Math.min(pool.length-1,Math.max(0,rank-1))];
    let round,month;if(rank<=8){round='Huitièmes de finale';month=3;}else{round='Barrages';month=2;}
    tournament.currentRound=round;tournament.phase='knockout';const fixture=makeKnockoutFixture(tournament,player,round,month,opponent,0);tournament.fixtures=[fixture];return fixture;
}

export const CompetitionSystem={
    getSeniorCompetition(player){const country=player?.clubCountry||player?.country||'France',level=Number(player?.clubLevel||1);const map={France:level===2?COMPETITIONS.FR_L2:COMPETITIONS.FR_L1,Angleterre:level===2?COMPETITIONS.EN_CH:COMPETITIONS.EN_PL,Espagne:level===2?COMPETITIONS.ES_SD:COMPETITIONS.ES_LA,Italie:level===2?COMPETITIONS.IT_B:COMPETITIONS.IT_A,Allemagne:level===2?COMPETITIONS.DE_B2:COMPETITIONS.DE_B1};return map[country]||COMPETITIONS.FR_L1;},
    getEuropeanQualification,
    getYouthCategory(age){if(age<=15)return'U15';if(age===16)return'U16';if(age===17)return'U17/U19';return null;},
    getPeriodName(month){return MONTH_INFO[Number(month)]?.period||'Période de carrière';},
    getMonthLabel(month){return MONTH_INFO[Number(month)]?.label||`Mois ${month}`;},
    isOffSeason(month){return[6,7].includes(Number(month));},

    createSeasonSchedule(player,seasonYear){const seed=hashSeed(`${seasonYear}|${player?.club||''}|${player?.country||''}|${player?.age||14}|${player?.position||''}`),random=seededRandom(seed),age=Number(player?.age)||14;if(age<18){const youth=buildYouthSchedule(player,seasonYear,random);return this.finalizeSchedule(player,seasonYear,youth.matches,youth.category,seed);}const competition=this.getSeniorCompetition(player),senior=buildSeniorSchedule(player,seasonYear,random,competition);return this.finalizeSchedule(player,seasonYear,senior.matches,senior.category,seed);},

    finalizeSchedule(player,seasonYear,matches,category,seed){const ordered=sortMatches(matches),byMonth={};for(const month of ALL_MONTHS)byMonth[month]={month,label:this.getMonthLabel(month),period:this.getPeriodName(month),phase:MONTH_INFO[month]?.phase||'offseason',matches:[]};ordered.forEach(m=>byMonth[m.month].matches.push(m));return{version:4,seasonYear,seasonLabel:seasonLabel(seasonYear),generatedForAge:Number(player?.age)||14,category,seed,matches:ordered,byMonth,totals:{allMatches:ordered.length,leagueMatches:ordered.filter(m=>m.type==='league').length,cupMatches:ordered.filter(m=>m.competitionId==='NATIONAL_CUP').length,europeanMatches:ordered.filter(m=>['CHAMPIONS_LEAGUE','EUROPA_LEAGUE'].includes(m.competitionId)).length}};},

    ensureSeasonSchedule(state){if(!state?.player||!state?.calendar)return null;const year=Number(state.calendar.currentSeasonYear)||new Date().getFullYear(),existing=state.calendar.seasonSchedule;if(existing&&Number(existing.seasonYear)===year&&Array.isArray(existing.matches)&&Number(existing.version||0)>=4)return existing;CupSystem.ensure(state);const schedule=this.createSeasonSchedule(state.player,year);state.calendar.seasonSchedule=schedule;state.calendar.seasonMatchCursor=0;const comp=this.getSeniorCompetition(state.player),qualification=getEuropeanQualification(state.player,comp);if(Number(state.player.age)>=18){state.europeanTournament=createEuropeanTournament(state.player,year,qualification,schedule.seed);}else{state.europeanTournament=null;}return schedule;},

    getEuropeanStatus(state){const t=state?.europeanTournament;if(!t)return null;return{competition:t.competition,slot:t.slot,phase:t.phase,rank:t.rank,points:t.leaguePoints,played:t.leagueMatchesPlayed,qualified:t.qualified,eliminated:t.eliminated,currentRound:t.currentRound,standings:t.standings||[],history:t.history||[]};},

    getEuropeanFixture(state){const t=state?.europeanTournament;if(!t||t.eliminated)return null;const month=Number(state?.calendar?.currentMonth);if(t.phase==='league_phase'&&Number(t.leagueMatchesPlayed)>=8)return prepareKnockoutRoute(state);return t.fixtures?.find(f=>Number(f.month)===month&&!f.played)||null;},

    getBlockPlan(state){const player=state?.player||{},calendar=state?.calendar||{},month=Number(calendar.currentMonth)||8,seasonYear=Number(calendar.currentSeasonYear)||new Date().getFullYear(),schedule=this.ensureSeasonSchedule(state),monthData=schedule?.byMonth?.[month];if(this.isOffSeason(month))return{type:'offseason',month,monthLabel:this.getMonthLabel(month),season:seasonYear,seasonLabel:seasonLabel(seasonYear),matches:0,scheduledMatches:[],activities:month===7?['repos','mercato','programme_individuel','preparation_saison']:['bilan','selection_internationale','repos','recovery'],importance:'none',mode:'career_activity'};
        const base=[...(monthData?.matches||[]),...CupSystem.getPlayerFixtures(state)];
        const europeanFixture=this.getEuropeanFixture(state);if(europeanFixture&&!base.some(m=>m.id===europeanFixture.id))base.push(europeanFixture);
        const hasMajor=base.some(m=>m.importance==='major'),hasImportant=base.some(m=>m.importance==='important');
        return{type:player.age<18?'youth':'senior',category:schedule?.category||(player.age<18?this.getYouthCategory(player.age):'Senior'),month,monthLabel:this.getMonthLabel(month),season:seasonYear,seasonLabel:seasonLabel(seasonYear),matches:base.length,scheduledMatches:base,competition:base[0]?.competitionName||null,activities:base.length?[player.age<18?'match_jeunes':'match','entrainement']:['entrainement','evenement'],importance:hasMajor?'major':hasImportant?'important':base.length>=4?'normal':'low',mode:hasMajor?'major':hasImportant?'mixed':base.length?'simulation':'career_activity'};
    },

    // Enregistre la phase de ligue avec un classement cohérent et prépare
    // automatiquement les barrages ou les huitièmes.
    recordEuropeanResults(state,scheduledMatches,matchResults){
        const t=state?.europeanTournament;if(!t||t.eliminated||!Array.isArray(scheduledMatches))return null;
        const european=scheduledMatches.filter(m=>m?.competitionType==='continental'&&m?.phase);
        if(!european.length)return t;
        for(const match of european){
            if(match.played)continue;
            const result=matchResults?.find(r=>r.matchIndex===scheduledMatches.indexOf(match))||{};
            const rating=Number(result.rating)||6,goals=Number(result.goals)||0;
            const performancePoints=rating>=7.5?3:rating>=6?1:0;
            if(match.phase==='league_phase'){
                t.leagueMatchesPlayed++;t.leaguePoints+=performancePoints;t.leagueGoalsFor+=goals;t.leagueGoalsAgainst+=rating<5.5?2:1;
                const row=t.standings.find(r=>r.clubId===match.opponentClubId);if(row){row.played++;row.points+=Math.max(0,3-performancePoints);row.goalsAgainst+=goals;row.goalsFor+=rating<6?2:1;}
                const own=t.standings.find(r=>r.clubId===match.playerClubId);if(own){own.played++;own.points=t.leaguePoints;own.goalsFor=t.leagueGoalsFor;own.goalsAgainst=t.leagueGoalsAgainst;}
                match.played=true;match.status='played';
            } else if(match.phase==='knockout'){
                match.played=true;match.status='played';
                const won=rating>=6.3||goals>0;if(won)this.advanceEuropeanRound(state,match);else{t.eliminated=true;t.phase='eliminated';t.history.push({round:match.round,result:'Éliminé',seasonYear:t.seasonYear});}
            }
        }
        t.standings.sort((a,b)=>b.points-a.points||b.strength-a.strength||b.goalsFor-a.goalsAgainst);t.standings.forEach((r,i)=>r.rank=i+1);if(t.leagueMatchesPlayed>=8&&!t.rank){t.rank=t.standings.find(r=>r.clubId===state.player.clubId)?.rank||18;t.qualified=t.rank<=24;}
        return t;
    },

    advanceEuropeanRound(state,match){const t=state?.europeanTournament,player=state?.player;if(!t||t.eliminated)return null;const order=['Barrages','Huitièmes de finale','Quarts de finale','Demi-finales','Finale'];const i=order.indexOf(match.round);if(i<0)return null;if(i===order.length-1){t.phase='winner';t.currentRound=null;t.history.push({round:'Finale',result:'Vainqueur',seasonYear:t.seasonYear});return null;}const next=order[i+1],months={Barrages:2,'Huitièmes de finale':3,'Quarts de finale':4,'Demi-finales':4,'Finale':5};const pool=europeanPool(player).filter(c=>c.id!==player?.clubId),opponent=pool[(t.history.length+Math.max(0,i))%Math.max(1,pool.length)];t.currentRound=next;const fixture=makeKnockoutFixture(t,player,next,months[next],opponent,t.history.length);t.fixtures.push(fixture);t.history.push({round:match.round,result:'Qualification',seasonYear:t.seasonYear});return fixture;},

    getCurrentMatches(state){return this.getBlockPlan(state).scheduledMatches||[];},
    getSeasonSkeleton(player,year){const schedule=this.createSeasonSchedule(player,year);return ALL_MONTHS.map(month=>({month,monthLabel:this.getMonthLabel(month),period:this.getPeriodName(month),phase:MONTH_INFO[month]?.phase||'offseason',matches:schedule.byMonth[month]?.matches||[]}));}
};

export default CompetitionSystem;
