// player.js — façade publique du modèle joueur canonique.
import { ORIGINS as UI_ORIGINS } from './constants.js';
import { CareerSystem } from './domain/career/careerSystem.js';
import { createPlayer, ensure, calculateOverall, applyProgression, get } from './domain/player/playerSystem.js';

const ORIGIN_MAP={CENTRE_FORMATION:'CENTRE_FORMATION',CLUB_AMATEUR:'CLUB_AMATEUR',FUTSAL:'FUTSAL',STREET:'STREET',ATHLETE:'ATHLETE',DEBUTANT_TARDIF:'DEBUTANT_TARDIF',FILS_DE_PRO:'FILS_DE_PRO'};
const clamp=(value,min=1,max=99)=>Math.min(max,Math.max(min,Math.round(Number(value)||0)));
const randomInt=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
const average=values=>values.reduce((sum,value)=>sum+Number(value||0),0)/Math.max(1,values.length);

function resetToNeutralYouthProfile(player){
 for(const key of Object.keys(player.attributes||{})) player.attributes[key]=clamp(40+randomInt(-4,4));
 player.mental.concentration=clamp(55+randomInt(-6,6));
 player.mental.sangFroid=clamp(52+randomInt(-6,6));
 player.mental.decision=clamp(50+randomInt(-6,6));
 player.mental.resistancePression=clamp(average([player.mental.concentration,player.mental.sangFroid,player.mental.regularite]));
 player.origin=null;
 player.originLabel=null;
 player.trait=null;
 player.overall=calculateOverall(player);
}

export const PlayerLogic={
 generateRandomName(){const first=['Lucas','Hugo','Enzo','Kylian','Theo','Rayan','Diego','Mateo'];const last=['Martin','Bernard','Dubois','Thomas','Robert','Richard','Silva','Gomez'];const pick=a=>a[Math.floor(Math.random()*a.length)];return `${pick(first)} ${pick(last)}`;},
 randomInt(min,max){return randomInt(min,max);},
 createPlayerProfile(formData={}){
  const originInput=formData.originId??formData.origin;
  const originDeferred=Object.prototype.hasOwnProperty.call(formData,'origin')&&formData.origin===null;
  const origin=originDeferred?'CENTRE_FORMATION':ORIGIN_MAP[originInput]||'CENTRE_FORMATION';
  const primaryNationality=formData.primaryNationality||formData.nationality||formData.country||'France';
  const raisedInCountry=formData.raisedInCountry||formData.country||primaryNationality;
  const player=createPlayer({firstname:formData.firstname||formData.firstName||'Joueur',lastname:formData.lastname||formData.lastName||'Inconnu',nationality:primaryNationality,position:formData.position||'BU',origin,age:Math.max(14,Number(formData.age)||14)});
  if(originDeferred) resetToNeutralYouthProfile(player);
  const originData=originDeferred?null:(UI_ORIGINS[originInput]||UI_ORIGINS.CENTRE_FORMATION);
  player.originLabel=originDeferred?null:(originData?.name||player.origin);player.trait=originDeferred?null:(originData?.trait||player.origin);player.country=raisedInCountry;
  player.primaryNationality=primaryNationality;player.secondaryNationality=formData.secondaryNationality||null;player.raisedInCountry=raisedInCountry;
  player.faceId=formData.faceId||null;player.preferredFoot=formData.preferredFoot||null;
  player.height=Number(formData.height)||178;player.weight=Number(formData.weight)||72;player.heartClub=formData.heartClub??null;player.fame=originInput==='FILS_DE_PRO'?20:10;
  player.youthClub=formData.youthClub??null;
  player.club=null;player.clubCountry=formData.clubCountry||null;player.clubLevel=Number(formData.clubLevel)||1;player.salary=0;
  player.stats.technique=player.attributes.controle;player.stats.physique=player.attributes.puissance;player.stats.mental=player.mental.concentration;player.stats.charisme=originInput==='FILS_DE_PRO'?55:50;player.stats.reputation=originInput==='FILS_DE_PRO'?20:10;player.stats.discipline=50;player.stats.relationCoach=50;player.stats.vestiaire=50;
  ensure(player);CareerSystem.initialize(player,formData.youthClub||null);return player;
 },
 applyProgression(player,gains={}){return applyProgression(player,gains);},
 ensure,calculateOverall,get
};
export default PlayerLogic;
