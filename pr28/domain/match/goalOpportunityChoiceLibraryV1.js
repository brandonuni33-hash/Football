// Street to Pro — occasions de but jouables V1 (OCC-001 à OCC-020).

const choice = (text, style, impacts = {}, gesture = null) => ({ text, style, impacts, gesture });
const occ = (id, title, description, choices, meta = {}) => ({ id, title, description, choices, ...meta });

export const GOAL_OPPORTUNITY_CHOICES_V1 = Object.freeze([
  occ('OCC-001','Le gardien sort','La contre-attaque t’ouvre le terrain. Un défenseur est loin derrière et le gardien a quitté sa ligne pour venir fermer l’angle.',[
    choice('Éliminer le gardien d’un crochet','technical',{ratingBonus:.16,goalChance:.19,duelBonus:.1,technicalRisk:.14,fatigueRisk:1},'Crochet sur le gardien'),
    choice('Tenter le lob piqué avant qu’il ne se replace','spectacular',{ratingBonus:.22,goalChance:.22,technicalRisk:.2,fatigueRisk:1},'Lob piqué'),
    choice('Frapper fort et ras avant qu’il ne se couche','safe',{ratingBonus:.13,goalChance:.2,technicalRisk:.07},'Frappe rase')
  ],{groups:['attacker','winger','midfielder'],weight:5}),
  occ('OCC-002','Presque plus d’angle','Tu récupères le ballon tout près de la ligne de but, côté droit. Le gardien verrouille son premier poteau et l’angle paraît minuscule.',[
    choice('Viser le petit filet au premier poteau','safe',{ratingBonus:.11,goalChance:.13,technicalRisk:.08},'Frappe petit filet'),
    choice('Remettre en retrait vers un partenaire lancé','collective',{ratingBonus:.15,assistChance:.2,passAccuracy:.08},'Centre en retrait'),
    choice('Enrouler vers la lucarne opposée','spectacular',{ratingBonus:.23,goalChance:.18,technicalRisk:.22},'Enroulé lucarne opposée')
  ],{groups:['attacker','winger'],weight:3}),
  occ('OCC-003','Seul dans les airs','Le centre arrive parfaitement au point de penalty. Tu t’élèves entre deux défenseurs déséquilibrés et tu as le ballon pour toi.',[
    choice('Piquer la tête vers le sol','safe',{ratingBonus:.13,goalChance:.19,technicalRisk:.07},'Tête piquée'),
    choice('Armer une tête puissante vers la lucarne','technical',{ratingBonus:.18,goalChance:.21,technicalRisk:.14},'Tête puissante'),
    choice('Dévier pour le partenaire mieux placé','collective',{ratingBonus:.16,assistChance:.19,passAccuracy:.06},'Remise de la tête')
  ],{groups:['attacker','winger','midfielder','defender'],weight:3}),
  occ('OCC-004','Le ballon te revient','Ta première tentative est repoussée. Le ballon revient à cinq mètres du but et le gardien est encore au sol.',[
    choice('La pousser simplement au fond','safe',{ratingBonus:.12,goalChance:.3,technicalRisk:.03},'Finition simple'),
    choice('Frapper immédiatement en force','technical',{ratingBonus:.16,goalChance:.25,technicalRisk:.13},'Reprise en force'),
    choice('Contrôler pour replacer avant de finir','calm',{ratingBonus:.17,goalChance:.24,technicalRisk:.1},'Contrôle et finition')
  ],{groups:['attacker','winger','midfielder','defender'],weight:4}),
  occ('OCC-005','Deux contre un','Vous partez à deux face à un seul défenseur. Il recule, regarde alternativement le ballon et ton partenaire, et attend que tu choisisses.',[
    choice('Continuer seul jusqu’à la frappe','ego',{ratingBonus:.14,goalChance:.18,duelBonus:.07,technicalRisk:.1},'Percée personnelle'),
    choice('Attendre le bon instant pour donner','collective',{ratingBonus:.17,assistChance:.23,passAccuracy:.09},'Passe décisive'),
    choice('Feinter la passe pour éliminer le défenseur','spectacular',{ratingBonus:.22,goalChance:.23,duelBonus:.13,technicalRisk:.2},'Feinte de passe')
  ],{groups:['attacker','winger','midfielder'],weight:5}),
  occ('OCC-006','Coup franc à dix-huit mètres','La faute est proche de la surface, légèrement décalée. Le mur est en place et le gardien cherche encore son angle.',[
    choice('Enrouler au-dessus du mur','technical',{ratingBonus:.18,goalChance:.18,technicalRisk:.16},'Coup franc enroulé'),
    choice('Brosser le ballon sous la barre','spectacular',{ratingBonus:.22,goalChance:.2,technicalRisk:.21},'Coup franc brossé'),
    choice('Frapper fort sous le mur','risky',{ratingBonus:.17,goalChance:.17,technicalRisk:.15},'Frappe sous le mur')
  ],{groups:['attacker','winger','midfielder','defender'],weight:2,setPiece:true}),
  occ('OCC-007','Dos au but','Tu reçois dos au but dans la surface. Un défenseur te colle et un partenaire surgit dans ton dos.',[
    choice('Tenter la talonnade surprise','spectacular',{ratingBonus:.21,assistChance:.17,goalChance:.06,technicalRisk:.21},'Talonnade'),
    choice('Pivoter et frapper toi-même','technical',{ratingBonus:.17,goalChance:.18,duelBonus:.08,technicalRisk:.15},'Pivot-frappe'),
    choice('Remettre simplement dans la course du partenaire','safe',{ratingBonus:.14,assistChance:.18,passAccuracy:.09},'Remise simple')
  ],{groups:['attacker','winger','midfielder'],weight:3}),
  occ('OCC-008','Le centre traverse tout','Un centre fort traverse la surface. Tu arrives à la retombée avec le ballon encore haut et très rapide.',[
    choice('Reprendre de volée sans réfléchir','spectacular',{ratingBonus:.23,goalChance:.21,technicalRisk:.23},'Reprise de volée'),
    choice('Contrôler avant de placer la frappe','technical',{ratingBonus:.16,goalChance:.18,technicalRisk:.11},'Contrôle-frappe'),
    choice('Dévier de la tête vers un partenaire','collective',{ratingBonus:.14,assistChance:.16,passAccuracy:.06},'Déviation de la tête')
  ],{groups:['attacker','winger','midfielder'],weight:3}),
  occ('OCC-009','Une dernière occasion','Le temps additionnel est lancé, le score est toujours à égalité et le ballon tombe dans la surface. Autour du terrain, tout se fige une fraction de seconde.',[
    choice('Frapper immédiatement','risky',{ratingBonus:.18,goalChance:.21,technicalRisk:.12},'Frappe immédiate'),
    choice('Contrôler avant de placer','safe',{ratingBonus:.19,goalChance:.23,technicalRisk:.1},'Contrôle et frappe placée'),
    choice('Protéger le ballon et chercher le contact','cunning',{ratingBonus:.12,goalChance:.08,technicalRisk:.15,cardRisk:.02},'Contact provoqué')
  ],{groups:['attacker','winger','midfielder'],weight:8,minMinute:88,requiresDraw:true}),
  occ('OCC-010','Ils reviennent sur toi','Tu avais pris de l’avance, mais deux défenseurs reviennent à pleine vitesse dans ton dos. L’espace se referme à chaque foulée.',[
    choice('Frapper avant leur retour','safe',{ratingBonus:.14,goalChance:.17,technicalRisk:.08},'Frappe précoce'),
    choice('Protéger et attendre le soutien','collective',{ratingBonus:.11,assistChance:.11,passAccuracy:.07,fatigueRisk:1},'Protection du ballon'),
    choice('Réaccélérer pour provoquer le face-à-face','risky',{ratingBonus:.2,goalChance:.23,duelBonus:.1,technicalRisk:.18,fatigueRisk:3},'Accélération franche')
  ],{groups:['attacker','winger','midfielder'],weight:4}),
  occ('OCC-011','Le ballon tombe sur toi','Le dribble de ton partenaire échoue, mais un contre favorable expédie le ballon directement dans tes pieds. La défense n’a pas encore eu le temps de réagir.',[
    choice('Frapper sans contrôle','risky',{ratingBonus:.17,goalChance:.19,technicalRisk:.13},'Frappe sans contrôle'),
    choice('Prendre un contrôle orienté','safe',{ratingBonus:.14,goalChance:.18,technicalRisk:.08},'Contrôle orienté'),
    choice('Tenter un extérieur ou un piqué','spectacular',{ratingBonus:.22,goalChance:.2,technicalRisk:.21},'Finition extérieure')
  ],{groups:['attacker','winger','midfielder'],weight:3}),
  occ('OCC-012','Il est seul à gauche','Tu peux frapper, mais un partenaire est complètement libre sur ta gauche, dans une position encore meilleure.',[
    choice('Prendre la frappe toi-même','ego',{ratingBonus:.13,goalChance:.18,technicalRisk:.1},'Frappe personnelle'),
    choice('Servir le partenaire seul','collective',{ratingBonus:.18,assistChance:.27,passAccuracy:.1},'Passe décisive'),
    choice('Feinter la passe puis frapper','spectacular',{ratingBonus:.21,goalChance:.22,technicalRisk:.19},'Feinte de passe et frappe')
  ],{groups:['attacker','winger','midfielder'],weight:6}),
  occ('OCC-013','Tu pars en déséquilibre','Un contact te déséquilibre au moment même où tu dois conclure. Tu peux encore jouer le ballon, mais ton appui se dérobe.',[
    choice('Frapper pendant la chute','spectacular',{ratingBonus:.2,goalChance:.17,technicalRisk:.22},'Frappe en déséquilibre'),
    choice('Te recentrer pour retrouver un appui','safe',{ratingBonus:.13,goalChance:.15,technicalRisk:.08},'Recentrage'),
    choice('Accentuer le contact et réclamer le penalty','cunning',{ratingBonus:.08,goalChance:.06,technicalRisk:.18,cardRisk:.04},'Contact recherché')
  ],{groups:['attacker','winger','midfielder'],weight:2}),
  occ('OCC-014','Le penalty peut tout changer','Le ballon est posé sur le point de penalty. Le gardien bouge sur sa ligne et le match semble soudain beaucoup plus silencieux.',[
    choice('Frapper fort au centre','safe',{ratingBonus:.14,goalChance:.24,technicalRisk:.09},'Penalty en force'),
    choice('Placer précisément dans un coin','technical',{ratingBonus:.18,goalChance:.27,technicalRisk:.13},'Penalty placé'),
    choice('Tenter une Panenka','spectacular',{ratingBonus:.28,goalChance:.24,technicalRisk:.28},'Panenka')
  ],{groups:['attacker','winger','midfielder','defender'],weight:2,setPiece:true}),
  occ('OCC-015','Le but est presque désert','Le gardien s’est aventuré loin de sa ligne pour anticiper. Tu récupères le ballon à distance et il doit maintenant courir vers son but.',[
    choice('Tenter le lob immédiatement','spectacular',{ratingBonus:.24,goalChance:.2,technicalRisk:.23},'Lob lointain'),
    choice('Avancer pour réduire la distance','safe',{ratingBonus:.13,goalChance:.19,technicalRisk:.08,fatigueRisk:1},'Approche contrôlée'),
    choice('Le contourner s’il revient sur toi','technical',{ratingBonus:.19,goalChance:.22,duelBonus:.08,technicalRisk:.17},'Dribble de contournement')
  ],{groups:['attacker','winger','midfielder'],weight:2}),
  occ('OCC-016','L’espace s’ouvre à vingt mètres','Tu as de l’espace à l’entrée de la surface, mais un défenseur revient déjà pour fermer ta fenêtre de tir.',[
    choice('Déclencher immédiatement de loin','risky',{ratingBonus:.17,goalChance:.15,technicalRisk:.13},'Frappe lointaine'),
    choice('Conduire vers le but pour améliorer l’angle','technical',{ratingBonus:.15,goalChance:.18,duelBonus:.05,technicalRisk:.11,fatigueRisk:1},'Conduite vers le but'),
    choice('Glisser la passe dans la profondeur','collective',{ratingBonus:.16,assistChance:.19,passAccuracy:.08},'Passe en profondeur')
  ],{groups:['attacker','winger','midfielder','defender'],weight:5}),
  occ('OCC-017','Deux contre le gardien','La ligne défensive est éliminée. Il ne reste que le gardien face à toi et ton partenaire, lancé à la même hauteur.',[
    choice('Assumer la frappe','ego',{ratingBonus:.15,goalChance:.23,technicalRisk:.1},'Frappe personnelle'),
    choice('Donner au partenaire pour le but ouvert','collective',{ratingBonus:.19,assistChance:.29,passAccuracy:.09},'Passe face au gardien'),
    choice('Feinter la passe pour coucher le gardien','spectacular',{ratingBonus:.23,goalChance:.26,technicalRisk:.21},'Feinte face au gardien')
  ],{groups:['attacker','winger','midfielder'],weight:5}),
  occ('OCC-018','Tes jambes sont vides','La fin du match approche. Tes jambes sont lourdes, mais un ballon favorable arrive encore dans la surface.',[
    choice('Chercher le geste précis malgré la fatigue','technical',{ratingBonus:.17,goalChance:.18,technicalRisk:.14,fatigueRisk:2},'Finition précise'),
    choice('Faire le geste le plus simple possible','safe',{ratingBonus:.13,goalChance:.17,technicalRisk:.06},'Finition simple'),
    choice('Remettre au partenaire plus frais','collective',{ratingBonus:.14,assistChance:.17,passAccuracy:.08,fatigueRisk:-1},'Remise au partenaire')
  ],{groups:['attacker','winger','midfielder'],weight:7,minMinute:82,requiresFatigue:true}),
  occ('OCC-019','Tu l’as éliminé','Ton crochet laisse ton adversaire direct derrière toi. Le but s’ouvre devant toi, mais il peut encore revenir si tu tardes.',[
    choice('Finir immédiatement','safe',{ratingBonus:.15,goalChance:.23,technicalRisk:.07},'Finition immédiate'),
    choice('Ajouter un dernier geste pour effacer le gardien','spectacular',{ratingBonus:.25,goalChance:.26,duelBonus:.08,technicalRisk:.24},'Dribble du gardien'),
    choice('Attendre une fraction de seconde pour mieux ajuster','calm',{ratingBonus:.17,goalChance:.22,technicalRisk:.11},'Temporisation')
  ],{groups:['attacker','winger'],weight:8,requiresDuelAdvantage:true}),
  occ('OCC-020','Le corner revient sur toi','Le corner est mal dégagé. Le ballon retombe à l’entrée de la surface et la défense ressort dans le désordre.',[
    choice('Reprendre de volée immédiatement','spectacular',{ratingBonus:.22,goalChance:.17,technicalRisk:.22},'Volée sur corner'),
    choice('Contrôler avant de placer la frappe','technical',{ratingBonus:.16,goalChance:.17,technicalRisk:.1},'Contrôle-frappe'),
    choice('Décaler latéralement vers un partenaire libre','collective',{ratingBonus:.13,assistChance:.13,passAccuracy:.08},'Transmission latérale')
  ],{groups:['attacker','winger','midfielder','defender'],weight:3,setPiece:true})
]);

export default GOAL_OPPORTUNITY_CHOICES_V1;
