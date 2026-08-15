// Bibliothèque de textes hors-match : coach, état d'esprit, médias, famille et carrière.
// Les systèmes fournissent les faits ; cette couche choisit uniquement une formulation cohérente.

export function stableCareerPick(seed, key, values = []) {
    if (!values.length) return '';
    const text = `${seed || 'career'}|${key || 'line'}`;
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return values[(hash >>> 0) % values.length];
}

export const COACH_COPY = Object.freeze({
    role: [
        "Après la séance, le coach ne parle pas de ton niveau général. Il revient sur un déplacement précis et sur l'espace qu'il aurait dû ouvrir.",
        "Le coach te retient devant le tableau. Il repasse une action deux fois, puis te demande ce que tu avais vu au moment de recevoir.",
        "Tout le groupe est déjà presque sorti quand le coach t'appelle. Il veut parler d'un détail de placement, pas de ta note du dernier match.",
        "À la vidéo, le coach arrête l'image juste avant ta prise de balle. « Regarde ce qu'il y avait derrière toi. »",
        "Le coach te montre deux séquences très proches : sur l'une tu crées de l'espace, sur l'autre tu l'occupes trop tôt."
    ],
    competition: [
        "Le coach te parle de la concurrence à ton poste sans tourner autour du sujet. Il veut savoir comment tu vis les dernières compositions.",
        "Avant de quitter le centre, le coach te demande de rester. Ton temps de jeu est au centre de la discussion.",
        "Le coach ne te promet rien. Il t'explique simplement ce qu'il manque aujourd'hui pour te voir davantage dans le onze.",
        "La hiérarchie à ton poste a bougé. Le coach préfère t'en parler directement plutôt que te laisser l'apprendre sur la prochaine feuille de match.",
        "Le coach pose son téléphone sur la table et te regarde : « Tu veux savoir où tu en es ? »"
    ],
    trust: [
        "La relation a changé. Le coach te demande désormais de faire passer une consigne au groupe avant le prochain match.",
        "Le coach te confie une responsabilité qu'il ne t'aurait pas donnée quelques mois plus tôt.",
        "Avant la séance, le coach t'appelle à part. Il veut que tu aides un joueur plus jeune à comprendre ce qu'il attend de lui.",
        "Le coach ne te parle plus seulement de ton jeu. Il te demande ce que tu as pensé de l'attitude du groupe.",
        "Un simple « j'ai besoin de toi là-dessus » suffit à te faire comprendre que ton statut auprès du coach a changé."
    ],
    tension: [
        "Le ton reste calme, mais la discussion est moins confortable que d'habitude. Le coach estime que tes dernières réponses sur le terrain ne suffisent pas.",
        "Le coach ferme la porte derrière toi. Il veut comprendre si ton attitude récente vient de la frustration ou d'un vrai désaccord.",
        "La conversation commence sur le football et glisse vite vers la confiance entre vous.",
        "Il n'y a pas de cri. Seulement une phrase du coach qui reste : « En ce moment, je ne sais pas toujours lequel de tes visages je vais retrouver. »",
        "Le coach te demande directement si tu crois encore à ce qu'il te demande."
    ],
    fatigue: [
        "Pendant le retour au calme, le coach remarque que tes appuis sont moins nets. Il te propose d'alléger la fin de séance.",
        "Le coach coupe ton exercice avant la dernière série. « Aujourd'hui, travailler plus ne t'aidera pas. »",
        "Tu essaies de masquer la fatigue, mais le coach l'a vue avant toi sur tes changements de direction.",
        "Le staff échange quelques mots au bord du terrain. Le coach vient ensuite te demander franchement comment répondent tes jambes.",
        "Le coach te rappelle qu'une place se gagne aussi en sachant quand récupérer."
    ],
    oldCoach: [
        "Un message de ton premier coach apparaît sur ton téléphone. Il a vu quelques images de ton dernier match.",
        "Ton ancien coach t'écrit sans commentaire sur le score. Il revient plutôt sur un détail de ton jeu qu'il te répétait déjà plus jeune.",
        "Après plusieurs semaines sans nouvelles, ton premier coach t'envoie simplement : « Je regarde toujours. »",
        "Le nom de ton ancien coach s'affiche sur ton écran. Son message est court, mais il te ramène immédiatement à tes premières saisons.",
        "Ton premier coach te félicite, puis ajoute exactement le même correctif qu'il te donnait des années plus tôt."
    ]
});

export const MINDSET_COPY = Object.freeze({
    low: [
        "Tu as du mal à chasser les dernières semaines de ta tête. Même une séance correcte ne suffit pas encore à tout remettre en place.",
        "Le football occupe plus de place que tu ne le voudrais en dehors du terrain. Tu rejoues des actions sans même ouvrir une vidéo.",
        "Tu te surprends à regarder la prochaine composition plus tôt que d'habitude.",
        "Une partie de toi veut simplement retrouver une action propre, quelque chose de concret auquel raccrocher la confiance.",
        "Tu n'as pas besoin qu'on te dise que la période est difficile. La vraie question est ce que tu vas en faire."
    ],
    high: [
        "En ce moment, tu demandes le ballon sans réfléchir à ce qui pourrait mal se passer.",
        "Tu sens que les bonnes décisions arrivent plus vite. La confiance ne te pousse pas à tout tenter ; elle rend le jeu plus clair.",
        "Tu as envie que le prochain match arrive vite.",
        "Même à l'entraînement, tu ressens cette impression rare d'être toujours une demi-seconde en avance.",
        "Les compliments te font plaisir, mais ce qui te marque surtout est la sensation de maîtriser davantage ton propre jeu."
    ],
    unused: [
        "Tu regardes les matchs avancer sans toi et la patience devient un vrai travail.",
        "Le plus difficile n'est pas le banc lui-même. C'est de ne pas savoir exactement quand la prochaine chance arrivera.",
        "Tu essaies de rester utile au groupe, même quand ton nom n'est pas dans le onze.",
        "Chaque séance prend un peu plus d'importance quand le week-end ne te donne presque aucune minute.",
        "Tu ne veux pas transformer trois matchs sur le banc en crise, mais l'idée d'un changement commence à exister."
    ],
    ambition: [
        "Ce qui te suffisait il y a quelques mois ne te suffit déjà plus.",
        "Tu regardes désormais le niveau au-dessus comme une étape possible, pas comme quelque chose d'abstrait.",
        "Tu commences à vouloir compter, pas seulement participer.",
        "La progression change aussi tes attentes. Tu veux savoir jusqu'où cette carrière peut aller.",
        "Pour la première fois, tu te demandes non pas si tu peux atteindre le prochain niveau, mais quand."
    ]
});

export const MEDIA_COPY = Object.freeze({
    breakthrough: [
        ({name, goals}) => `${name} frappe fort avec ${goals} buts. Une performance qui oblige les observateurs à regarder son début de saison autrement.`,
        ({name, goals}) => `${goals} buts et beaucoup moins de discrétion autour de ${name}. La soirée pourrait accélérer l'attention autour de son nom.`,
        ({name, goals}) => `${name} signe ${goals} buts dans le même match. Jusqu'ici suivi de loin, il vient de donner une raison de s'attarder sur son dossier.`,
        ({name, goals}) => `Difficile d'ignorer ${name} après ${goals} buts. Le prochain match dira si c'était un sommet isolé ou le début d'une série.`,
        ({name, goals}) => `${name} n'avait pas besoin d'un long discours : ${goals} buts ont suffi à faire circuler son nom davantage ce soir.`
    ],
    decisive: [
        ({name, goals, assists}) => `${name} laisse une trace directe sur le score${goals ? ` avec ${goals} but${goals > 1 ? 's' : ''}` : ''}${goals && assists ? ' et' : ''}${assists ? ` ${assists} passe${assists > 1 ? 's' : ''} décisive${assists > 1 ? 's' : ''}` : ''}.`,
        ({name}) => `${name} a trouvé le geste décisif. Pas encore de quoi changer un statut, mais assez pour renforcer sa place dans les discussions.`,
        ({name}) => `Une action décisive de plus pour ${name}. Son influence commence à devenir plus régulière.`,
        ({name}) => `${name} apparaît directement dans le scénario du match. Le genre de contribution que le staff peut difficilement ignorer.`,
        ({name}) => `Le score porte aussi la trace de ${name}. Une soirée utile dans une carrière qui cherche encore sa direction.`
    ],
    poor: [
        ({name}) => `Soirée plus compliquée pour ${name}. Plusieurs décisions ont manqué de justesse et la prochaine réponse sera attendue sur le terrain.`,
        ({name}) => `${name} est resté en retrait. Rien de dramatique sur un match, mais la concurrence ne laisse pas beaucoup de place aux séries moyennes.`,
        ({name}) => `Un match à oublier pour ${name}, ou plutôt à comprendre. La manière dont il répondra comptera davantage que la mauvaise note elle-même.`,
        ({name}) => `Cette fois, ${name} n'a pas réussi à peser. Le staff comme les observateurs regarderont surtout la réaction.`,
        ({name}) => `${name} traverse une soirée sans relief. Dans une jeune carrière, ce sont souvent les matchs suivants qui donnent le vrai sens à celui-ci.`
    ],
    neutral: [
        ({name}) => `${name} poursuit son installation chez les professionnels. Pas d'emballement : sa place se construira sur la répétition.`,
        ({name}) => `Une apparition de plus pour ${name}. Rien de spectaculaire, mais du temps de jeu qui commence à former une vraie trajectoire.`,
        ({name}) => `${name} continue d'accumuler des minutes. Son prochain cap sera de transformer cette présence en influence régulière.`,
        ({name}) => `Pas de statistique marquante pour ${name}, mais une nouvelle étape dans son adaptation au rythme professionnel.`,
        ({name}) => `${name} avance encore sans faire beaucoup de bruit. Pour l'instant, sa progression reste plus visible au club qu'à l'extérieur.`
    ]
});

export const MEDIA_DILEMMAS = Object.freeze([
    { id:'media_minutes', title:'🎙️ La question sur ton temps de jeu', description:'Un journaliste te demande si ton rôle actuel correspond vraiment à ce que tu espérais en début de saison.', choices:[
        { text:'Dire que tu veux jouer davantage sans attaquer le coach', response:'La réponse est reprise comme une marque d’ambition, pas comme une déclaration de guerre.', effect:{hypeDelta:5,moraleDelta:2,coachDelta:-2} },
        { text:'Rappeler que le choix appartient au coach', response:'Le sujet retombe vite. En interne, le staff apprécie que tu ne déplaces pas la discussion dans la presse.', effect:{coachDelta:7,hypeDelta:-1} },
        { text:'Dire que tu dois surtout être meilleur', response:'La phrase circule moins, mais elle plaît au staff et à plusieurs supporters.', effect:{coachDelta:5,hypeDelta:1,moraleDelta:1} }
    ]},
    { id:'media_future', title:'📱 Ton avenir devient une question', description:'Une rumeur de transfert circule et on te demande si tu peux garantir que tu seras encore au club la saison prochaine.', choices:[
        { text:'Dire que tu es heureux ici', response:'Les supporters retiennent surtout la déclaration de fidélité.', effect:{hypeDelta:2,followerDelta:300,coachDelta:4} },
        { text:'Répondre que le football va vite', response:'La phrase reste volontairement ouverte. Elle suffit à alimenter les discussions pour quelques jours.', effect:{hypeDelta:9,followerDelta:700,coachDelta:-3} },
        { text:'Refuser de parler de ton avenir', response:'Tu fermes la porte à la question, pas aux spéculations.', effect:{hypeDelta:5,coachDelta:0} }
    ]},
    { id:'media_criticism', title:'🎙️ Une critique revient en conférence', description:'Un journaliste te rappelle plusieurs commentaires négatifs sur ta régularité et te demande s’ils t’atteignent.', choices:[
        { text:'Reconnaître que certaines critiques sont justes', response:'La réponse surprend par sa simplicité. Tu ne cherches pas d’excuse.', effect:{coachDelta:5,moraleDelta:1,hypeDelta:1} },
        { text:'Dire que tu ne lis rien', response:'La réponse coupe court, même si personne ne peut vraiment vérifier ce que tu lis ou non.', effect:{moraleDelta:3,hypeDelta:-1} },
        { text:'Répondre que les critiques changeront au prochain bon match', response:'La confiance plaît à certains et agace les autres. Au moins, la phrase te ressemble.', effect:{hypeDelta:7,moraleDelta:4,coachDelta:-1} }
    ]},
    { id:'media_team_credit', title:'🎙️ Après une grosse performance', description:'Tu viens d’être décisif et la première question cherche déjà à faire de toi l’unique héros du match.', choices:[
        { text:'Mettre immédiatement l’équipe en avant', response:'Tes coéquipiers remarquent la réponse. Le sujet individuel retombe un peu.', effect:{relationshipDelta:6,coachDelta:4,hypeDelta:-1} },
        { text:'Assumer que tu as fait un grand match', response:'Tu ne minimises pas ta performance. La confiance fait rapidement le tour des réseaux.', effect:{hypeDelta:8,followerDelta:600,moraleDelta:3} }
    ]}
]);

export const FAMILY_COPY = Object.freeze({
    pressure: [
        "Ton téléphone reste silencieux un moment après votre discussion. Pour une fois, le football n'était pas le vrai sujet.",
        "La carrière prend de la place à la maison. Pas sous forme de dispute spectaculaire, plutôt dans les horaires, les absences et les conversations repoussées.",
        "Un proche te demande si tu vas vraiment bien. La question arrive sans parler de résultat ni de temps de jeu.",
        "Tu réalises que les dernières semaines ont aussi été vécues par les gens autour de toi.",
        "Ce soir, quelqu'un de proche te demande simplement de poser ton téléphone et d'être là."
    ],
    support: [
        "Un message d'un proche arrive après le match : pas d'analyse, juste quelques mots qui te ramènent à ce qui existait avant le football professionnel.",
        "Chez toi, personne ne te demande ta note. On te demande seulement comment tu l'as vécu.",
        "Un proche ressort une vieille photo de tes premières années. Le contraste avec aujourd'hui te fait sourire.",
        "Quelqu'un de ta famille te rappelle que ton statut a changé plus vite que toi.",
        "La conversation finit par parler d'autre chose que de football. Tu ne savais pas à quel point tu en avais besoin."
    ],
    birth: [
        ({name}) => `La journée ne ressemble à aucune autre de ta carrière. ${name} vient de naître, et pendant quelques heures le football passe très loin derrière.`,
        ({name}) => `${name} est né${String(name||'').endsWith('a') ? 'e' : ''}. Ton téléphone se remplit de messages, mais aucun ne ressemble à ceux d'après un match.`,
        ({name}) => `Une nouvelle personne entre dans ton histoire : ${name}. Tout ce que tu appelais « pression » paraît soudain différent.`,
        ({name}) => `La naissance de ${name} change immédiatement l'échelle des choses. Le prochain match arrivera, mais pas tout de suite dans ta tête.`,
        ({name}) => `${name} vient de naître. Pour la première fois depuis longtemps, tu ne penses ni à la prochaine sélection ni au classement.`
    ],
    separation: [
        "La discussion dure plus longtemps que prévu. Cette fois, vous n'arrivez pas à repousser ce qui s'accumulait depuis des mois.",
        "Il n'y a pas de grande scène. Seulement la décision difficile d'arrêter de faire semblant que tout va encore bien.",
        "La séparation devient réelle quand le silence après la conversation ne ressemble plus aux autres silences.",
        "Le football continuera demain. Ce soir, ta vie personnelle vient de changer de direction.",
        "Vous vous quittez sans réussir à résumer en une cause tout ce qui vous a amenés là."
    ],
    reconciliation: [
        "Vous recommencez à parler sans chercher immédiatement à avoir raison.",
        "La réconciliation ne règle pas tout. Elle ouvre simplement une possibilité de reconstruire autrement.",
        "Pour la première fois depuis longtemps, la conversation ne finit pas sur une porte qui se ferme.",
        "Vous décidez d'essayer encore, avec moins de promesses et davantage de choses concrètes à changer.",
        "Le lien n'est pas revenu à ce qu'il était. Peut-être que c'est justement la condition pour repartir."
    ]
});

export function mediaPostText({ seed='career', key='media', name='Le joueur', goals=0, assists=0, rating=0 }={}) {
    const pool = goals >= 2 ? MEDIA_COPY.breakthrough : (goals || assists) ? MEDIA_COPY.decisive : rating > 0 && rating < 5.5 ? MEDIA_COPY.poor : MEDIA_COPY.neutral;
    const factory = stableCareerPick(seed,key,pool);
    return typeof factory === 'function' ? factory({name,goals,assists,rating}) : String(factory || '');
}

export function familyEventText({ seed='career', event='support', name='' }={}) {
    const pool = FAMILY_COPY[event] || FAMILY_COPY.support;
    const value = stableCareerPick(seed,`family:${event}:${name}`,pool);
    return typeof value === 'function' ? value({name}) : value;
}

export default { stableCareerPick, COACH_COPY, MINDSET_COPY, MEDIA_COPY, MEDIA_DILEMMAS, FAMILY_COPY, mediaPostText, familyEventText };
