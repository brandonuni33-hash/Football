// player.js — façade publique du modèle joueur canonique.
import { ORIGINS as UI_ORIGINS } from './constants.js';
import { CareerSystem } from './domain/career/careerSystem.js';
import { createPlayer, ensure, calculateOverall, applyProgression, get } from './domain/player/playerSystem.js';

const ORIGIN_MAP={CENTRE_FORMATION:'CENTRE_FORMATION',CLUB_AMATEUR:'CLUB_AMATEUR',FUTSAL:'FUTSAL',STREET:'STREET',ATHLETE:'ATHLETE',DEBUTANT_TARDIF:'DEBUTANT_TARDIF',FILS_DE_PRO:'FILS_DE_PRO'};
export const PlayerLogic={
 generateRandomName(){const first=['Lucas','Hugo','Enzo','Kylian','Theo','Rayan','Diego','Mateo'];const last=['Martin','Bernard','Dubois','Thomas','Robert','Richard','Silva','Gomez'];const pick=a=>a[Math.floor(Math.random()*a.length)];return `${pick(first)} ${pick(last)}`;},
 randomInt(min,max){return Math.floor(Math.random()*(max-min+1))+min;},
 createPlayerProfile(formData={}){
  const origin=ORIGIN_MAP[formData.originId||formData.origin]||'CENTRE_FORMATION';
  const player=createPlayer({firstname:formData.firstname||formData.firstName||'Joueur',lastname:formData.lastname||formData.lastName||'Inconnu',nationality:formData.nationality||formData.country||'France',position:formData.position||'BU',origin,age:Math.max(14,Number(formData.age)||14)});
  const originData=UI_ORIGINS[formData.originId||formData.origin]||UI_ORIGINS.CENTRE_FORMATION;
  player.originLabel=originData?.name||player.origin;player.trait=originData?.trait||player.origin;player.country=formData.country||player.nationality;
  player.height=Number(formData.height)||178;player.weight=Number(formData.weight)||72;player.heartClub=formData.heartClub||null;player.fame=(formData.originId||formData.origin)==='FILS_DE_PRO'?20:10;
  player.club=null;player.clubCountry=formData.clubCountry||null;player.clubLevel=Number(formData.clubLevel)||1;player.salary=0;
  player.stats.technique=player.attributes.controle;player.stats.physique=player.attributes.puissance;player.stats.mental=player.mental.concentration;player.stats.charisme=(formData.originId||formData.origin)==='FILS_DE_PRO'?55:50;player.stats.reputation=(formData.originId||formData.origin)==='FILS_DE_PRO'?20:10;player.stats.discipline=50;player.stats.relationCoach=50;player.stats.vestiaire=50;
  ensure(player);CareerSystem.initialize(player,formData.youthClub||null);return player;
 },
 applyProgression(player,gains={}){return applyProgression(player,gains);},
 ensure,calculateOverall,get
};
export default PlayerLogic;
