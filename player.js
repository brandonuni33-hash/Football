// player.js — façade publique du modèle joueur canonique.
import { ORIGINS as UI_ORIGINS } from './constants.js';
import { CareerSystem } from './domain/career/careerSystem.js';
import { createPlayer, ensure, calculateOverall, applyProgression, get } from './domain/player/playerSystem.js';

const ORIGIN_MAP={CENTRE_FORMATION:'CENTRE_FORMATION',CLUB_AMATEUR:'CLUB_AMATEUR',FUTSAL:'FUTSAL',STREET:'STREET',ATHLETE:'ATHLETE',DEBUTANT_TARDIF:'DEBUTANT_TARDIF',FILS_DE_PRO:'FILS_DE_PRO'};
export const PlayerLogic={
 generateRandomName(){const first=['Lucas','Hugo','Enzo','Kylian','Theo','Rayan','Diego','Mateo'];const last=['Martin','Bernard','Dubois','Thomas','Robert','Richard','Silva','Gomez'];const pick=a=>a[Math.floor(Math.random()*a.length)];return `${pick(first)} ${pick(last)}`;},
 randomInt(min,max){return Math.floor(Math.random()*(max-min+1))+min;},
 createPlayerProfile(formData={}){
  const hasOrigin=Object.prototype.hasOwnProperty.call(formData,'originId')||Object.prototype.hasOwnProperty.call(formData,'origin');
  const requestedOrigin=hasOrigin?(formData.originId??formData.origin??null):'CENTRE_FORMATION';
  const origin=ORIGIN_MAP[requestedOrigin]||'CENTRE_FORMATION';
  const player=createPlayer({firstname:formData.firstname||formData.firstName||'Joueur',lastname:formData.lastname||formData.lastName||'Inconnu',nationality:formData.nationality||formData.country||'France',position:formData.position||'BU',origin,age:Math.max(14,Number(formData.age)||14)});
  const originData=UI_ORIGINS[formData.originId||formData.origin]||UI_ORIGINS.CENTRE_FORMATION;
  player.origin=requestedOrigin==null?null:player.origin;player.originLabel=requestedOrigin==null?null:(originData?.name||player.origin);player.trait=requestedOrigin==null?null:(originData?.trait||player.origin);player.country=formData.country||player.nationality;
  player.faceId=formData.faceId||null;player.height=Number(formData.height)||168;player.weight=Number(formData.weight)||56;player.preferredFoot=formData.preferredFoot||null;player.primaryNationality=formData.primaryNationality||player.nationality;player.secondaryNationality=formData.secondaryNationality||null;player.raisedInCountry=Object.prototype.hasOwnProperty.call(formData,'raisedInCountry')?(formData.raisedInCountry??null):player.country;player.raisedInContinent=formData.raisedInContinent||null;player.heartClub=formData.heartClub||null;player.youthClub=formData.youthClub||null;player.fame=requestedOrigin==='FILS_DE_PRO'?20:10;
  player.club=null;player.clubCountry=formData.clubCountry||null;player.clubLevel=Number(formData.clubLevel)||1;player.salary=0;
  player.stats.technique=player.attributes.controle;player.stats.physique=player.attributes.puissance;player.stats.mental=player.mental.concentration;player.stats.charisme=(formData.originId||formData.origin)==='FILS_DE_PRO'?55:50;player.stats.reputation=(formData.originId||formData.origin)==='FILS_DE_PRO'?20:10;player.stats.discipline=50;player.stats.relationCoach=50;player.stats.vestiaire=50;
  ensure(player);CareerSystem.initialize(player,formData.youthClub||null);return player;
 },
 applyProgression(player,gains={}){return applyProgression(player,gains);},
 ensure,calculateOverall,get
};
export default PlayerLogic;
