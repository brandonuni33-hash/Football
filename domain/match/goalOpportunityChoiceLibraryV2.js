// Street to Pro — occasions de but jouables V2 (OCC-021 à OCC-040).
// Même contrat que la bibliothèque principale : 3 choix, styles distincts, impacts cachés.

const choice = (text, style, impacts = {}, gesture = null) => ({ text, style, impacts, gesture });
const occ = (id, title, description, choices, meta = {}) => ({ id, title, description, choices, ...meta });

export const GOAL_OPPORTUNITY_CHOICES_V2 = Object.freeze([
  occ('OCC-021','La ligne était limite','La passe te lance dans le dos de la défense. Tu sens que la ligne de hors-jeu était très serrée, mais aucun coup de sifflet ne vient. Le gardien avance déjà.',[
    choice('Continuer et frapper avant qu’il ne ferme l’angle','safe',{ratingBonus:.14,goalChance:.21,technicalRisk:.08},'Frappe rapide'),
    choice('Contrôler proprement avant de choisir ta finition','technical',{ratingBonus:.17,goalChance:.23,technicalRisk:.11},'Contrôle avant finition'),
    choice('Pousser le ballon devant le gardien et chercher le contact','cunning',{ratingBonus:.11,goalChance:.08,technicalRisk:.18,cardRisk:.03},'Contact recherché')
  ],{groups:['attacker','winger','midfielder'],weight:4,openPlay:true}),

  occ('OCC-022','La remise tombe dans ta course','Un partenaire gagne son duel aérien et dévie le ballon exactement dans ta course. Devant toi, la surface est à moitié dégagée et les défenseurs se retournent.',[
    choice('Frapper du premier temps','risky',{ratingBonus:.17,goalChance:.2,technicalRisk:.14},'Frappe première intention'),
    choice('Contrôler puis ajuster','safe',{ratingBonus:.15,goalChance:.2,technicalRisk:.08},'Contrôle et frappe'),
    choice('Amortir pour éliminer le dernier défenseur','technical',{ratingBonus:.21,goalChance:.23,duelBonus:.1,technicalRisk:.19},'Amorti-dribble')
  ],{groups:['attacker','winger','midfielder'],weight:4}),

  occ('OCC-023','Il glisse devant toi','Ton adversaire direct perd son appui sur la pelouse humide. Le ballon reste libre devant toi et l’espace s’ouvre brutalement.',[
    choice('Frapper immédiatement','safe',{ratingBonus:.14,goalChance:.2,technicalRisk:.08},'Frappe immédiate'),
    choice('Prendre une touche pour assurer','technical',{ratingBonus:.16,goalChance:.22,technicalRisk:.1},'Contrôle de sécurité'),
    choice('Temporiser pour attirer le gardien','calm',{ratingBonus:.18,goalChance:.23,technicalRisk:.13},'Temporisation face au gardien')
  ],{groups:['attacker','winger','midfielder'],weight:3,requiresWetPitch:true}),

  occ('OCC-024','Tu décroches entre les lignes','Tu reçois dos au but en position de faux neuf. Un partenaire attaque immédiatement l’espace derrière toi pendant qu’un autre arrive de plus loin.',[
    choice('Te retourner et prendre la frappe','ego',{ratingBonus:.15,goalChance:.18,duelBonus:.06,technicalRisk:.12},'Pivot-frappe'),
    choice('Filtrer en une touche dans l’appel','collective',{ratingBonus:.19,assistChance:.23,passAccuracy:.1},'Passe filtrante une touche'),
    choice('Remettre vers le deuxième rideau','collective',{ratingBonus:.16,assistChance:.17,passAccuracy:.11},'Remise deuxième rideau')
  ],{groups:['attacker','midfielder'],weight:4}),

  occ('OCC-025','Le pressing vous offre le ballon','Votre pressing récupère le ballon à une trentaine de mètres du but. Le gardien n’a pas encore retrouvé sa position et la défense court vers sa surface.',[
    choice('Tenter la frappe lointaine immédiatement','spectacular',{ratingBonus:.21,goalChance:.16,technicalRisk:.2},'Frappe lointaine sur récupération'),
    choice('Porter le ballon quelques mètres avant de conclure','safe',{ratingBonus:.15,goalChance:.19,technicalRisk:.09,fatigueRisk:1},'Conduite après pressing'),
    choice('Trouver le partenaire qui accompagne la transition','collective',{ratingBonus:.17,assistChance:.18,passAccuracy:.09},'Passe de transition')
  ],{groups:['attacker','winger','midfielder'],weight:5}),

  occ('OCC-026','Deux joueurs autour de toi','Le centre monte haut. Deux défenseurs encadrent ton saut et cherchent à t’empêcher d’attaquer proprement la retombée.',[
    choice('T’imposer dans le duel et attaquer le ballon','physical',{ratingBonus:.16,goalChance:.17,duelBonus:.11,fatigueRisk:2,technicalRisk:.1},'Duel aérien en force'),
    choice('Sortir du duel et attaquer la zone libre','technical',{ratingBonus:.18,goalChance:.19,technicalRisk:.12},'Déplacement aérien'),
    choice('Te placer entre eux et chercher la faute','cunning',{ratingBonus:.1,goalChance:.06,technicalRisk:.16,cardRisk:.02},'Faute provoquée dans le duel')
  ],{groups:['attacker','midfielder','defender'],weight:3}),

  occ('OCC-027','Le une-deux est lancé','Tu donnes à un partenaire proche et repars immédiatement derrière la défense. Il a vu ton appel et peut te rendre le ballon de plusieurs façons.',[
    choice('Réclamer le retour direct pour finir en une touche','safe',{ratingBonus:.17,goalChance:.2,assistChance:.03,technicalRisk:.1},'Une-deux première intention'),
    choice('Continuer la course et demander le centre en retrait','collective',{ratingBonus:.16,assistChance:.18,passAccuracy:.07},'Une-deux puis centre en retrait'),
    choice('Revenir reprendre toi-même l’initiative balle au pied','technical',{ratingBonus:.18,goalChance:.16,duelBonus:.06,technicalRisk:.13},'Reprise d’initiative')
  ],{groups:['attacker','winger','midfielder'],weight:5}),

  occ('OCC-028','Personne ne te rattrape','Tu pars balle au pied depuis loin. Les premiers adversaires sont éliminés par ta course et, pendant quelques secondes, personne ne parvient à revenir sur toi.',[
    choice('Aller seul jusqu’au bout','ego',{ratingBonus:.2,goalChance:.2,fatigueRisk:3,technicalRisk:.12},'Raid solitaire'),
    choice('Ralentir pour laisser arriver les soutiens','collective',{ratingBonus:.14,assistChance:.16,passAccuracy:.08,fatigueRisk:1},'Temporisation collective'),
    choice('Accélérer encore avant le repli défensif','spectacular',{ratingBonus:.22,goalChance:.23,fatigueRisk:4,technicalRisk:.18},'Accélération longue')
  ],{groups:['attacker','winger','midfielder'],weight:3}),

  occ('OCC-029','Le ballon revient en retrait','Le débordement a ouvert la défense et le ballon revient en retrait dans la surface. Plusieurs joueurs arrivent en même temps dans la zone.',[
    choice('Frapper du premier temps','safe',{ratingBonus:.15,goalChance:.21,technicalRisk:.1},'Frappe sur centre en retrait'),
    choice('Prendre un contrôle orienté pour ouvrir l’angle','technical',{ratingBonus:.18,goalChance:.22,technicalRisk:.13},'Contrôle orienté et frappe'),
    choice('Remettre vers le joueur du deuxième rideau','collective',{ratingBonus:.17,assistChance:.2,passAccuracy:.09},'Remise deuxième rideau')
  ],{groups:['attacker','winger','midfielder'],weight:5}),

  occ('OCC-030','Le ballon traverse la surface','Le ballon file devant le but à hauteur de jambe. En te jetant, tu peux encore couper sa trajectoire avant qu’il ne sorte de ta zone.',[
    choice('Te jeter pour le dévier vers le but','spectacular',{ratingBonus:.22,goalChance:.2,technicalRisk:.2,fatigueRisk:2,injuryRisk:.02},'Tacle glissé offensif'),
    choice('Rester debout et chercher le contrôle','safe',{ratingBonus:.14,goalChance:.15,technicalRisk:.09},'Contrôle dans la surface'),
    choice('Le laisser filer vers le partenaire derrière toi','collective',{ratingBonus:.15,assistChance:.18,passAccuracy:.07},'Ballon laissé au partenaire')
  ],{groups:['attacker','winger','midfielder','defender'],weight:3}),

  occ('OCC-031','Le corner prolonge l’action','Ton premier centre est repoussé en corner. La défense adverse se replace encore et certains joueurs discutent de leur marquage.',[
    choice('Jouer le corner immédiatement','risky',{ratingBonus:.15,assistChance:.15,passAccuracy:.07,technicalRisk:.1},'Corner rapide'),
    choice('Attendre le schéma travaillé','collective',{ratingBonus:.17,assistChance:.18,passAccuracy:.1},'Corner travaillé'),
    choice('Chercher directement le but depuis le coin','spectacular',{ratingBonus:.25,goalChance:.12,technicalRisk:.28},'Corner direct')
  ],{groups:['attacker','winger','midfielder','defender'],weight:2,setPiece:true,requiresSetPieceTaker:true}),

  occ('OCC-032','Le gardien perd le ballon','Sous la pression, le gardien adverse laisse échapper le ballon devant sa surface. Il cherche déjà à le récupérer, mais tu es le plus proche.',[
    choice('Foncer et conclure immédiatement','safe',{ratingBonus:.15,goalChance:.25,technicalRisk:.07},'Finition sur erreur du gardien'),
    choice('Contrôler avant de placer calmement','technical',{ratingBonus:.17,goalChance:.26,technicalRisk:.1},'Contrôle et finition calme'),
    choice('Le contourner avant de pousser dans le but vide','spectacular',{ratingBonus:.23,goalChance:.27,duelBonus:.07,technicalRisk:.2},'Contournement du gardien')
  ],{groups:['attacker','winger','midfielder'],weight:3}),

  occ('OCC-033','Trois contre deux','La transition vous met à trois attaquants contre seulement deux défenseurs. Ils reculent vers leur surface sans pouvoir fermer toutes les lignes.',[
    choice('Prendre l’initiative et attaquer directement','ego',{ratingBonus:.16,goalChance:.18,duelBonus:.06,technicalRisk:.12},'Initiative individuelle'),
    choice('Faire circuler jusqu’à ouvrir le meilleur angle','collective',{ratingBonus:.18,assistChance:.21,passAccuracy:.1},'Circulation trois contre deux'),
    choice('Fixer les deux défenseurs avant de libérer un partenaire','technical',{ratingBonus:.2,assistChance:.24,duelBonus:.07,technicalRisk:.14},'Fixation double')
  ],{groups:['attacker','winger','midfielder'],weight:5}),

  occ('OCC-034','Le ballon vient sur ton mauvais pied','Le ballon arrive directement sur ton pied faible dans une position de frappe. Le défenseur revient suffisamment vite pour t’empêcher de te réorganiser longtemps.',[
    choice('Frapper immédiatement du pied faible','risky',{ratingBonus:.18,goalChance:.16,technicalRisk:.17},'Frappe pied faible'),
    choice('Prendre une touche pour revenir sur ton bon pied','safe',{ratingBonus:.15,goalChance:.18,technicalRisk:.1},'Repositionnement bon pied'),
    choice('Renoncer au tir et centrer en retrait','collective',{ratingBonus:.15,assistChance:.18,passAccuracy:.08},'Centre en retrait pied faible')
  ],{groups:['attacker','winger','midfielder','defender'],weight:4}),

  occ('OCC-035','Coup franc très excentré','La faute est obtenue sur le côté. L’angle de tir est mauvais, mais plusieurs partenaires occupent déjà la surface.',[
    choice('Tenter quand même le tir direct','spectacular',{ratingBonus:.22,goalChance:.11,technicalRisk:.23},'Coup franc direct excentré'),
    choice('Mettre un vrai ballon dans la surface','collective',{ratingBonus:.16,assistChance:.19,passAccuracy:.08},'Centre sur coup franc'),
    choice('Jouer court pour changer l’angle','technical',{ratingBonus:.17,assistChance:.14,passAccuracy:.11,technicalRisk:.07},'Combinaison courte')
  ],{groups:['attacker','winger','midfielder','defender'],weight:2,setPiece:true,requiresSetPieceTaker:true}),

  occ('OCC-036','Le gardien est encore au sol','La première tentative est repoussée. Le gardien reste au sol une fraction de seconde et une partie du but est encore ouverte.',[
    choice('Frapper immédiatement dans l’espace libre','safe',{ratingBonus:.15,goalChance:.29,technicalRisk:.06},'Deuxième frappe immédiate'),
    choice('Ajuster calmement avant de finir','technical',{ratingBonus:.18,goalChance:.28,technicalRisk:.1},'Finition ajustée'),
    choice('Contourner le gardien avant de conclure','spectacular',{ratingBonus:.23,goalChance:.29,duelBonus:.06,technicalRisk:.2},'Dribble gardien au sol')
  ],{groups:['attacker','winger','midfielder','defender'],weight:4}),

  occ('OCC-037','Tout le bloc a récupéré haut','Le pressing collectif vous rend le ballon très haut. Plusieurs adversaires sont encore tournés vers leur propre but et la transition démarre immédiatement.',[
    choice('Partir seul vers le but','ego',{ratingBonus:.17,goalChance:.2,fatigueRisk:2,technicalRisk:.11},'Percée après pressing'),
    choice('Sécuriser d’abord la possession','safe',{ratingBonus:.13,assistChance:.11,passAccuracy:.1},'Possession stabilisée'),
    choice('Chercher immédiatement le une-deux','technical',{ratingBonus:.19,goalChance:.14,assistChance:.19,technicalRisk:.12},'Une-deux de transition')
  ],{groups:['attacker','winger','midfielder'],weight:4}),

  occ('OCC-038','Il tire ton maillot','Au moment où tu prends l’avantage, un défenseur agrippe discrètement ton maillot. Tu restes encore debout, mais ton équilibre est perturbé.',[
    choice('Continuer malgré la gêne et finir l’action','physical',{ratingBonus:.18,goalChance:.17,duelBonus:.08,fatigueRisk:1,technicalRisk:.13},'Finition sous tirage'),
    choice('Te laisser tomber et réclamer la faute','cunning',{ratingBonus:.08,goalChance:.05,technicalRisk:.18,cardRisk:.04},'Faute réclamée'),
    choice('Te dégager d’un appui fort avant de frapper','technical',{ratingBonus:.2,goalChance:.2,duelBonus:.1,technicalRisk:.16},'Dégagement physique et frappe')
  ],{groups:['attacker','winger','midfielder'],weight:3}),

  occ('OCC-039','Plus aucun espace','Trois défenseurs referment l’espace autour de toi à l’entrée de la surface. Le ballon reste à portée, mais chaque touche peut être la dernière.',[
    choice('Tenter le geste serré pour sortir du piège','spectacular',{ratingBonus:.23,goalChance:.15,duelBonus:.12,technicalRisk:.25},'Dribble en petit espace'),
    choice('Remettre immédiatement pour ressortir proprement','safe',{ratingBonus:.14,assistChance:.13,passAccuracy:.11},'Remise rapide'),
    choice('Protéger et chercher le contact','cunning',{ratingBonus:.1,goalChance:.05,technicalRisk:.17,cardRisk:.03},'Contact provoqué')
  ],{groups:['attacker','winger','midfielder'],weight:4}),

  occ('OCC-040','Ton tir au but','La séance est entrée dans sa zone décisive. C’est à ton tour de marcher vers le point de penalty avec le gardien seul devant toi.',[
    choice('Frapper fort dans l’axe, assez haut','safe',{ratingBonus:.17,goalChance:.25,technicalRisk:.1},'Tir au but en force'),
    choice('Placer précisément dans un coin bas','technical',{ratingBonus:.2,goalChance:.28,technicalRisk:.14},'Tir au but placé'),
    choice('Tenter une Panenka ou un petit pont assumé','spectacular',{ratingBonus:.3,goalChance:.25,technicalRisk:.3},'Tir au but audacieux')
  ],{groups:['attacker','winger','midfielder','defender'],weight:10,shootoutOnly:true})
]);

export default GOAL_OPPORTUNITY_CHOICES_V2;
