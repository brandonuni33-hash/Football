// Bibliothèque narrative contextuelle du match jouable.
// Aucun texte n'expose les bonus cachés. Les variantes sont choisies de façon stable.

export function stablePick(seed, key, values = []) {
    if (!values.length) return '';
    const text = `${seed || 'match'}|${key || 'line'}`;
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return values[(hash >>> 0) % values.length];
}

export const MATCH_COPY = Object.freeze({
    opening: [
        'Ton premier ballon arrive plus vite que prévu. Tu contrôles et lèves la tête.',
        'Les premières secondes servent surtout à comprendre où l’adversaire veut t’emmener.',
        'Un premier duel suffit à donner le ton. Personne ne veut reculer.',
        'Le rythme s’installe immédiatement. Les espaces sont plus petits qu’à l’échauffement.',
        'Tu touches ton premier ballon et le reste du bruit disparaît un instant.',
        'Les deux blocs se cherchent encore, mais les premiers contacts sont déjà francs.',
        'Ton adversaire direct vient te tester dès la première prise de balle.',
        'Une passe simple, un replacement, puis une accélération : le match est lancé.',
        'Tu regardes une dernière fois le placement de leur milieu avant de demander le ballon.',
        'Le terrain paraît plus étroit dès que l’intensité monte.'
    ],
    neutralFlow: [
        'Le jeu se concentre au milieu. Chaque contrôle sous pression compte davantage.',
        'Ton équipe fait circuler sans trouver encore la passe qui casse une ligne.',
        'Les duels se succèdent et personne ne parvient à installer complètement son rythme.',
        'Tu décroches pour offrir une solution. Un adversaire te suit jusque dans ta zone.',
        'Le ballon change plusieurs fois de camp sans qu’une vraie occasion n’apparaisse.',
        'Votre bloc reste compact. Il faut attendre qu’un espace se crée vraiment.',
        'Tu demandes le ballon entre les lignes, mais la fenêtre se referme avant la passe.',
        'Les secondes passent sans action spectaculaire. Le placement devient le vrai travail.',
        'L’adversaire ferme l’axe et vous oblige à chercher les côtés.',
        'Le match reste serré. Une mauvaise orientation du corps peut suffire à perdre un temps.'
    ],
    leading: [
        'L’adversaire avance ses lignes. Derrière son pressing, les espaces deviennent plus grands.',
        'Tu sens qu’ils vont devoir prendre des risques. Le prochain ballon récupéré peut être important.',
        'Le score vous donne une marge, pas le droit de sortir du match.',
        'Leur bloc se découvre davantage à chaque récupération.',
        'Le coach demande de rester ensemble. Une transition mal gérée suffirait à tout relancer.',
        'Tu choisis mieux tes courses. Il n’est plus nécessaire de poursuivre chaque ballon.',
        'Leur latéral monte plus haut. Dans son dos, une zone commence à apparaître.',
        'Chaque passe simple fait courir l’adversaire un peu plus.',
        'Ils pressent plus fort, mais moins proprement.',
        'Le temps commence à travailler pour vous, à condition de ne rien offrir.'
    ],
    trailing: [
        'Ton équipe joue plus haut. Les distances entre les lignes deviennent plus risquées.',
        'Le temps commence à peser sur chaque possession perdue.',
        'Il faut accélérer sans transformer chaque ballon en action désespérée.',
        'L’adversaire recule et protège davantage sa surface.',
        'Le coach demande plus de présence devant, même si cela laisse des espaces derrière.',
        'Tu prends quelques mètres de plus à chaque récupération.',
        'Les appels se multiplient. Tout le monde cherche la passe qui peut ouvrir le match.',
        'Leur défense gagne du temps dès qu’elle le peut.',
        'Tu regardes brièvement le chrono. Il reste assez de temps pour une vraie action.',
        'Les possessions deviennent plus directes. Le prochain duel peut changer l’urgence du match.'
    ],
    confidence: [
        'Tes premières prises de balle sont propres. Tu commences à demander le ballon plus tôt.',
        'Ton adversaire recule avant même que tu accélères.',
        'Tu viens de gagner deux duels de suite. Le prochain se joue déjà dans sa tête.',
        'Les partenaires commencent à te chercher davantage.',
        'Tu sens que ton jeu est en place. Rien ne te pousse à forcer.',
        'Ton premier contrôle te met immédiatement face au jeu.',
        'Tu trouves les bons espaces sans avoir besoin de les chercher longtemps.',
        'Un partenaire te redonne aussitôt le ballon : « Encore. »',
        'Le coach lève simplement le pouce depuis la ligne.',
        'Tu as la sensation que le prochain ballon peut devenir dangereux.'
    ],
    doubt: [
        'Deux gestes simples viennent de t’échapper. Tu te répètes de revenir à l’essentiel.',
        'Ton contrôle part trop loin et tu entends une réaction du banc.',
        'Tu hésites à redemander le ballon après ta dernière perte.',
        'Un partenaire te regarde : « Tranquille. Le prochain. »',
        'Tu rejoues encore l’action précédente alors que le ballon est déjà ailleurs.',
        'Le coach te demande de simplifier pendant quelques minutes.',
        'Tu lèves la main après une passe ratée et te replaces immédiatement.',
        'Le prochain ballon arrive. Tu n’as plus le temps de penser au précédent.',
        'Tu sens que tu joues une demi-seconde trop tard depuis quelques minutes.',
        'Il faut retrouver un geste propre, même banal, pour revenir dans le match.'
    ],
    fatigue: [
        'Après ton dernier sprint, le retour paraît plus long que les précédents.',
        'Tu poses brièvement les mains sur les genoux. Le jeu repart déjà.',
        'Tes jambes répondent encore, mais elles demandent davantage à chaque accélération.',
        'Tu commences à choisir tes courses au lieu de toutes les faire.',
        'Le prochain duel arrive avant que tu aies complètement récupéré.',
        'Ton replacement prend une seconde de plus. Le coach le voit.',
        'La lucidité devient aussi importante que les jambes.',
        'Tu inspires profondément pendant une remise en jeu.',
        'Chaque changement de direction coûte un peu plus.',
        'Le match entre dans une zone où l’énergie restante doit être utilisée au bon moment.'
    ],
    coachSupport: [
        '« Continue. Ça va venir. »',
        '« Ton prochain ballon, simple. »',
        '« Voilà. C’est ça que je veux. »',
        '« Reste dans ton match. »',
        '« Je veux que tu continues à demander. »',
        '« Regarde avant de recevoir. Tu as le temps. »',
        '« Garde confiance dans ce que tu fais. »',
        '« Ne cherche pas à tout régler sur une action. »',
        '« Reviens dans le plan. »',
        '« J’ai besoin de toi maintenant. »'
    ],
    coachDemanding: [
        '« Plus vite ! »',
        '« Ne plonge pas ! »',
        '« Plus haut ! »',
        '« Reste avec lui ! »',
        '« Joue derrière eux ! »',
        '« Pas de faute inutile ! »',
        '« Réveille-toi ! »',
        '« Ferme l’intérieur ! »',
        '« Une touche de moins ! »',
        '« Fais le bon choix ! »'
    ],
    teammate: [
        '« Seul ! »', '« Ça vient ! »', '« Encore ! »', '« J’ai l’intérieur ! »', '« Remets ! »',
        '« Tourne ! »', '« Garde ! »', '« Dans ton dos ! »', '« Continue ton appel ! »', '« On reste ensemble ! »'
    ],
    thoughtsAmbitious: [
        'Encore.', 'Donne-la-moi.', 'Je peux lui faire mal.', 'Une seule bonne course.', 'Je vais en avoir une autre.',
        'Pas maintenant.', 'Je dois faire mieux.', 'Il commence à reculer.', 'La prochaine est pour moi.', 'Reste dans le match.'
    ],
    thoughtsCalm: [
        'Patience.', 'Simple.', 'Encore du temps.', 'Pas besoin de forcer.', 'Lis avant d’agir.',
        'Le prochain ballon.', 'Garde le rythme.', 'Reste propre.', 'Attends l’espace.', 'Respire.'
    ],
    success: [
        'Ton geste crée exactement l’espace recherché. L’adversaire doit se retourner et courir.',
        'Tu prends un temps d’avance. Le bloc adverse se déforme autour de l’action.',
        'Le choix est juste. Ton partenaire peut jouer face au jeu.',
        'Tu sors du duel avec le ballon et une nouvelle zone s’ouvre devant toi.',
        'Ton adversaire avait anticipé autre chose. Tu gagnes le mètre qui manquait.',
        'La combinaison fonctionne et vous éliminez le premier rideau.',
        'Tu protèges puis ressors au bon moment. La pression retombe.',
        'Ton intervention coupe proprement la transition.',
        'Tu fixes avant de donner. Le défenseur est obligé de sortir.',
        'Le ballon arrive là où l’action en avait besoin.'
    ],
    failure: [
        'L’adversaire lit ton intention et coupe la trajectoire.',
        'Ton toucher est trop long. Le duel suivant devient défensif.',
        'La fenêtre se referme juste avant ton geste.',
        'Tu forces la passe et leur milieu récupère.',
        'Ton adversaire ne mord pas. Tu dois ressortir le ballon.',
        'La remise manque de précision et casse le mouvement.',
        'Tu pars une fraction de seconde trop tôt.',
        'Le défenseur t’accompagne jusqu’à la ligne sans se jeter.',
        'Ton choix ne crée pas l’espace attendu. Il faut se replacer.',
        'Tu perds le duel. L’action part dans l’autre sens.'
    ],
    timeout: [
        'Tu attends une seconde de trop. La ligne de passe disparaît.',
        'L’hésitation suffit : le défenseur revient et ferme l’espace.',
        'Tu vois l’option, mais trop tard. L’adversaire a déjà corrigé son placement.',
        'La fenêtre existait. Elle vient de se refermer.',
        'Ton premier regard tarde, et l’action n’attend pas.',
        'Le ballon reste une touche de trop dans tes pieds. Le pressing arrive.',
        'Tu changes d’idée au dernier moment. Il n’y a plus de solution propre.',
        'L’adversaire profite de ton hésitation pour réduire l’espace.',
        'Le moment passe avant que tu choisisses.',
        'Tu dois finalement rejouer derrière. L’occasion de progresser s’est refermée.'
    ]
});

export function contextualFlow({ seed, key, scoreFor = 0, scoreAgainst = 0, confidence = 50, fatigue = 0 } = {}) {
    if (fatigue >= 70) return stablePick(seed, key, MATCH_COPY.fatigue);
    if (confidence >= 70) return stablePick(seed, key, MATCH_COPY.confidence);
    if (confidence <= 30) return stablePick(seed, key, MATCH_COPY.doubt);
    if (scoreFor > scoreAgainst) return stablePick(seed, key, MATCH_COPY.leading);
    if (scoreFor < scoreAgainst) return stablePick(seed, key, MATCH_COPY.trailing);
    return stablePick(seed, key, MATCH_COPY.neutralFlow);
}
