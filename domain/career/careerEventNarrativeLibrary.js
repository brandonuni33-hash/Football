// Textes narratifs des événements de carrière hors-match.
// Les effets mécaniques restent dans les systèmes existants ; ce fichier ne contient que la voix du jeu.

export const CAREER_EVENT_RESPONSES = Object.freeze({
  accepter_agent: 'Tu ne signes pas immédiatement. Vous parcourez le contrat ligne par ligne, puis tu poses ton nom au bas de la page. À partir d’aujourd’hui, quelqu’un d’autre entre officiellement dans les décisions autour de ta carrière.',
  refuser_agent: 'Tu remercies l’agent et ranges son numéro. Pour l’instant, tu préfères garder le contrôle et voir jusqu’où ton parcours peut avancer sans intermédiaire.',
  negocier_contrat: 'La discussion dure plus longtemps que prévu. Tu refuses de signer avant d’avoir compris ce que chaque commission implique. L’agent finit par revenir avec une proposition revue.',
  avis_famille: 'Tu ne réponds pas dans l’instant. Le soir, tu poses le contrat sur la table avec tes proches. Pour une fois, la décision de carrière commence loin du vestiaire.',
  prevenir_staff: 'Tu fais signe au kiné avant même la fin du retour au calme. Il te demande de t’allonger et commence les premiers tests. Le prochain match vient de passer au second plan.',
  cacher_douleur: 'Tu ne dis rien. Dans le vestiaire, tu évites certains mouvements pour que personne ne remarque la gêne. Le pari est simple : tenir assez longtemps pour ne pas perdre ta place.',
  medecin_prive: 'Tu prends un rendez-vous en urgence. Le diagnostic est rassurant, mais le message l’est moins : la prochaine accélération devra être faite sans ego.',
  strap_bandage: 'Le kiné pose le strap et te regarde une seconde de trop. Tu lui dis que ça ira. Il ne répond pas, mais son silence ressemble déjà à un avertissement.',
  donner_fond: 'Tu termines la séance au même rythme que les autres. Dans les dernières répétitions, tes jambes brûlent davantage que d’habitude. Tu as tenu — reste à savoir ce que ça coûtera demain.',
  lever_pied: 'Tu réduis l’intensité sur les dernières séries. Ce n’est pas spectaculaire, mais tu quittes le terrain avec la sensation d’avoir protégé la suite plutôt que gagné une séance.',
  entrainement_allege: 'Tu vas voir le coach avant le dernier atelier. Il accepte d’adapter la charge, mais te rappelle que récupérer fait aussi partie du travail professionnel.',
  cryotherapie: 'La séance est froide, longue et franchement désagréable. En sortant, tes jambes semblent pourtant un peu plus légères.',
  accepter_interview: 'Tu acceptes le rendez-vous. Le journaliste ne te demande pas seulement ce que tu veux devenir ; il veut comprendre d’où tu viens et ce que tu refuses de perdre en route.',
  refuser_interview: 'Tu déclines sans faire de déclaration. Cette semaine, tu préfères que ton prochain match parle à ta place.',
  interview_differee: 'Tu proposes de reparler après le prochain match. Le média accepte. La question ne disparaît pas : elle attend simplement un résultat de plus.',
  interview_duo: 'Tu demandes qu’un coéquipier soit présent. L’entretien devient moins personnel, plus détendu, et votre complicité finit par devenir une partie du sujet.',
  epargner: 'La prime arrive sur ton compte et tu n’y touches presque pas. Pendant longtemps, l’argent paraissait loin du football. Il commence désormais à faire partie des décisions autour.',
  faire_plaisir: 'Tu t’autorises quelque chose que tu aurais hésité à acheter quelques mois plus tôt. Ce n’est pas la raison pour laquelle tu joues, mais tu comprends enfin ce que certaines étapes changent hors du terrain.',
  regaler_equipe: 'Le repas dure plus longtemps que prévu. Les discussions quittent vite le football. Ce soir-là, le vestiaire ressemble davantage à un groupe d’amis qu’à une hiérarchie de titulaires et de remplaçants.',
  don_association: 'Tu demandes que l’opération reste discrète. La nouvelle finit quand même par circuler localement, mais ce n’était pas vraiment le but.',
  aider_financierement: 'Tu acceptes d’aider. Le virement part en quelques secondes, mais la conversation qui l’a précédé te rappelle que ta carrière change aussi la manière dont tes proches te regardent.',
  refuser_poliment: 'Tu expliques que tu ne peux pas devenir la solution automatique à chaque problème. Le silence après ta réponse est un peu plus lourd que prévu.',
  aider_partiellement: 'Tu proposes une aide plus limitée. Ce n’est pas exactement ce qu’on t’avait demandé, mais c’est ce que tu peux assumer sans transformer le lien en dette permanente.',
  aider_temps: 'Tu ne donnes pas simplement de l’argent. Tu passes des appels, demandes des contacts et consacres une partie de ta semaine au projet. L’aide prend une autre forme.',
  accepter_contrat: 'Tu poses le contrat devant toi une dernière fois. Le salaire, la durée et le rôle promis ne racontent pas toute l’histoire, mais ils rendent la décision soudain très concrète.',
  refuser_contrat: 'Tu rends le document sans signer. Une offre officielle n’est pas forcément une bonne destination.',
  negocier_offre: 'Tu demandes du temps et reviens avec des conditions précises. À partir de là, la discussion n’est plus une marque d’intérêt : c’est une vraie négociation.',
  signer_contrat: 'Tu signes. Pour la première fois, une marque veut associer son image à la tienne. Tu ranges le stylo en essayant de ne pas donner à ce moment plus d’importance qu’au prochain entraînement.',
  surenchere: 'Tu fais comprendre que d’autres options existent. La discussion change immédiatement de ton.',
  dotation_club: 'Tu demandes qu’une partie de l’accord profite aussi au club qui t’a accompagné plus tôt. La marque hésite, puis accepte de revoir la proposition.',
  refuser: 'Tu dis non. La décision ferme une porte, mais elle clarifie aussi celle que tu veux continuer à suivre.',
  accepter: 'Tu acceptes. À partir de cet instant, ce qui ressemblait à une possibilité devient une vraie étape de carrière.'
});

export const CAREER_EVENT_DESCRIPTIONS = Object.freeze({
  propo_agent: 'À la sortie de l’entraînement, un numéro inconnu insiste. Lorsque tu rappelles, un agent se présente et te dit qu’il suit ta progression depuis plusieurs semaines. Il veut parler de la manière dont tu vas gérer les prochaines étapes de ta carrière.',
  fatigue_entrainement: 'Sur les dernières courses, tes appuis répondent moins vite. Le staff ne t’a encore rien dit, mais ton corps envoie un message clair : la charge de travail commence à s’accumuler.',
  blessure_legere: 'À la fin d’une accélération, une douleur nette apparaît derrière la cuisse. Tu marches quelques mètres pour tester. Elle est toujours là.',
  sollicitation_media: 'Un journaliste local demande un long entretien sur ton parcours. Pas une réaction de trente secondes après un match : il veut parler de tes choix, de tes ambitions et de ce qui a changé autour de toi.',
  proche_besoin_aide: 'Un proche te demande de l’aide pour un projet personnel. La conversation n’a rien à voir avec le football, sauf pour une chose : sans ta carrière actuelle, cette demande ne serait probablement jamais arrivée.',
  prime_match: 'Après une performance marquante, le club t’annonce qu’une prime va être versée. Le chiffre apparaît sur ton téléphone quelques heures plus tard.',
  proposition_equipementier: 'Une marque veut te faire signer un premier accord d’image. Le contrat n’est pas énorme, mais voir ton nom écrit à côté d’un logo rend ta nouvelle exposition beaucoup plus réelle.'
});

export const CAREER_MILESTONE_COPY = Object.freeze({
  first_pro_match: 'Au moment d’entrer, tu repenses brièvement à tous les terrains où personne ne connaissait ton nom. Cette fois, la feuille de match est professionnelle et le changement n’a rien de symbolique.',
  first_start: 'Le onze est affiché. Ton nom n’est plus dans la colonne des remplaçants. Pour la première fois, le match commencera avec toi sur le terrain.',
  first_goal: 'Le premier restera différent des autres. Pas parce qu’il sera forcément le plus beau, mais parce qu’avant lui aucun but professionnel ne portait ton nom.',
  first_transfer: 'Les sacs sont prêts. Tu quittes un vestiaire où tu connaissais chaque habitude pour un autre où tu devras tout recommencer : les prénoms, les automatismes, ta place.',
  first_contract: 'Le document est posé devant toi. Pendant des années, devenir professionnel était une idée. Quelques pages et une signature suffisent maintenant à la rendre administrative, concrète, presque étrange.',
  comeback: 'Ton nom revient sur la feuille de match. Après les soins, les séances à l’écart et les accélérations surveillées, le football redevient enfin quelque chose que tu peux jouer.',
  captain: 'Le brassard passe autour de ton bras. Il ne te rend pas meilleur techniquement. Il change simplement le nombre de regards qui se tournent vers toi quand le match se complique.',
  retirement: 'Tu sais que certains gestes reviendront encore longtemps : nouer les lacets, attendre dans le tunnel, entendre ton nom. La différence, c’est qu’il n’y aura plus de prochain match pour les répéter.'
});

export function eventResponse(choice = {}, fallback = '') {
  return CAREER_EVENT_RESPONSES[choice.id] || choice.response || fallback || null;
}
export function eventDescription(event = {}) {
  return CAREER_EVENT_DESCRIPTIONS[event.id] || event.description || '';
}
