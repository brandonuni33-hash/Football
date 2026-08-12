// Compose les beats de présentation à partir d'un plan déjà validé.

import { impactLevel } from './narrativeSignificance.js';
import { stableNarrativeId } from './narrativeFactNormalizer.js';

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const finite = value => Number.isFinite(Number(value)) ? Number(value) : null;

function resultView(fact = {}) {
    const metrics = fact.metrics || {}, payload = fact.payload || {};
    return {
        factId: fact.id,
        fixture: payload.fixture || {},
        matchIndex: metrics.matchIndex,
        opponent: payload.opponent || 'Adversaire',
        competitionName: payload.competitionName || 'Match',
        importance: payload.importance,
        phase: payload.phase,
        round: payload.round,
        result: fact.outcome?.result || null,
        teamGoals: n(metrics.teamGoals),
        opponentGoals: n(metrics.opponentGoals),
        rating: metrics.rating === null ? null : n(metrics.rating),
        goals: n(metrics.goals),
        assists: n(metrics.assists),
        playerPlayed: metrics.playerPlayed !== false,
        started: metrics.started !== false,
        minutesPlayed: n(metrics.minutesPlayed),
        interactive: Boolean(metrics.interactive),
        appearance: payload.appearance || (metrics.started === false ? 'substitute' : 'starter')
    };
}

function scoreText(result) { return `${n(result?.teamGoals)}-${n(result?.opponentGoals)}`; }

function stablePick(seed, key, choices = []) {
    if (!choices.length) return null;
    const text = `${seed || 'narrative'}|${key || 'line'}`;
    let hash = 2166136261;
    for (let index = 0; index < text.length; index++) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return choices[(hash >>> 0) % choices.length];
}

function appearanceLabel(result = {}) {
    if (result.playerPlayed === false) return result.appearance === 'bench' ? 'Resté sur le banc' : 'Hors groupe';
    if (result.started === false) return `Entré en jeu · ${n(result.minutesPlayed)} min`;
    if (n(result.minutesPlayed)) return `Titulaire · ${n(result.minutesPlayed)} min`;
    return 'Titulaire';
}

function impactLabel(level) {
    return {
        decisive: 'Impact décisif', strong: 'Impact fort', present: 'Présent',
        difficult: 'En difficulté', unused: 'Non utilisé'
    }[level] || 'Présent';
}

function impactDetail(result = {}) {
    if (result.playerPlayed === false) return appearanceLabel(result);
    const parts = [], goals = n(result.goals), assists = n(result.assists), rating = n(result.rating);
    if (goals) parts.push(`${goals} but${goals > 1 ? 's' : ''}`);
    if (assists) parts.push(`${assists} passe${assists > 1 ? 's' : ''} décisive${assists > 1 ? 's' : ''}`);
    parts.push(`note ${rating.toFixed(1)}`);
    return parts.join(' · ');
}

function outcomeText(result) {
    const opponent = result?.opponent || 'l’adversaire';
    if (result?.result === 'win') return `Le coup de sifflet final confirme la victoire ${scoreText(result)} face à ${opponent}.`;
    if (result?.result === 'loss') return `Le match s’achève sur une défaite ${scoreText(result)} face à ${opponent}.`;
    return `Au terme d’une rencontre indécise, les deux équipes se quittent sur un ${scoreText(result)} face à ${opponent}.`;
}

function goalHaulLabel(goals) {
    return { 2: 'un doublé', 3: 'un triplé', 4: 'un quadruplé', 5: 'un quintuplé', 6: 'un sextuplé' }[goals]
        || `${goals} buts`;
}

function contributionText(result = {}) {
    const goals = n(result.goals), assists = n(result.assists);
    if (goals && assists) return `${goals} but${goals > 1 ? 's' : ''} et ${assists} passe${assists > 1 ? 's' : ''} décisive${assists > 1 ? 's' : ''}`;
    if (goals) return goals === 1 ? 'un but' : goalHaulLabel(goals);
    if (assists) return assists === 1 ? 'une passe décisive' : `${assists} passes décisives`;
    return null;
}

function performanceText(player, result) {
    if (!result) return `Sur cette période, le staff ne t’a pas utilisé. Ta place dans la rotation reste à gagner.`;
    if (result.playerPlayed === false) return result.appearance === 'bench'
        ? `Tu as suivi toute la rencontre depuis le banc, sans que ton numéro ne soit appelé.`
        : `Cette fois, tu n’étais pas dans le groupe retenu pour la rencontre.`;

    const rating = n(result.rating), goals = n(result.goals), assists = n(result.assists);
    const contribution = contributionText(result);
    if (result.started === false && contribution) {
        const minutes = result.minutesPlayed ? ` en ${result.minutesPlayed} minutes` : '';
        return `Entré en cours de match, tu as trouvé le moyen de peser${minutes} : ${contribution}.`;
    }
    if (result.started === false && rating >= 7) {
        return `Entré en cours de match, tu as utilisé tes minutes pour donner au staff une raison de te regarder autrement.`;
    }
    if (goals >= 2) return `Tu quittes la pelouse avec ${goalHaulLabel(goals)}. Une performance impossible à réduire à une simple ligne de statistiques.`;
    if (goals === 1 && assists >= 1) return `Un but et une passe décisive : tu as directement pesé sur deux moments qui ont changé le match.`;
    if (goals === 1) return `Ton but donne à cette rencontre une place à part dans ta propre histoire.`;
    if (assists >= 2) return `Tes ${assists} passes décisives ont placé ton influence au cœur du résultat.`;
    if (assists === 1) return `Ta passe décisive a laissé une trace concrète dans le scénario du match.`;
    if (rating >= 8.2) return `Tu n’apparais pas forcément au tableau des buteurs, mais ta prestation a imposé sa présence du début à la fin.`;
    if (rating < 5.5) return `Tu quittes le terrain en sachant que cette fois, tu es passé à côté de ton match.`;
    return `Tu as tenu ta place dans le collectif, sans geste décisif mais sans disparaître de la rencontre.`;
}

function blockOverviewText(results, impactMatch) {
    if (results.length <= 1) return null;
    const appearances = results.filter(result => result.playerPlayed !== false).length;
    const starts = results.filter(result => result.playerPlayed !== false && result.started !== false).length;
    if (!appearances) {
        return `Le staff ne t’a pas utilisé sur cette séquence. La concurrence a pris de l’avance et la prochaine occasion comptera davantage.`;
    }
    const opponent = impactMatch?.opponent || 'un adversaire';
    if (appearances === results.length && starts === appearances) {
        return `Tu as conservé une vraie continuité dans le onze. Ton empreinte la plus nette est venue face à ${opponent}.`;
    }
    if (starts === 0) {
        return `Tes minutes sont venues du banc. Tu cherches encore le match capable de modifier la hiérarchie.`;
    }
    return `Ton statut a bougé entre titularisations et passages sur le banc. Face à ${opponent}, tu as laissé la trace la plus nette.`;
}

function atmosphereText(result, importance) {
    const fixture = result?.fixture || {};
    if (importance === 'exceptional') return `Pendant quelques secondes, tout semble ralentir. Ce genre de match ne ressemble pas aux autres.`;
    if (importance === 'major') return fixture.isDerby || fixture.rival || fixture.rivalry
        ? `La tension retombe lentement autour du terrain. Un derby ne se termine jamais vraiment au coup de sifflet.`
        : `Le stade reste chargé d’une tension particulière bien après la dernière action.`;
    if (result?.result === 'win') return `Dans les tribunes, les chants accompagnent encore les joueurs qui quittent la pelouse.`;
    if (result?.result === 'loss') return `Les bruits du stade paraissent plus lointains au moment de rejoindre le tunnel.`;
    return `Les joueurs se dispersent lentement pendant que le stade retrouve son calme.`;
}

function firstCareerGoalMatch(context, results = []) {
    const seasonGoals = finite(context?.player?.seasonStats?.goals);
    const previousGoals = finite(context?.career?.completedGoals);
    if (seasonGoals === null || previousGoals === null || previousGoals !== 0) return null;
    const played = results.filter(result => result.playerPlayed !== false);
    const blockGoals = played.reduce((sum, result) => sum + n(result.goals), 0);
    if (blockGoals <= 0 || seasonGoals !== blockGoals) return null;
    const scorers = played.filter(result => n(result.goals) > 0)
        .sort((left, right) => n(left.matchIndex) - n(right.matchIndex));
    return scorers[0]?.factId || null;
}

function playerMindsetText(context, result, importance, { firstCareerGoal = false } = {}) {
    if (!result) return null;
    const seed = context?.seed;
    const key = result.factId || `${result.opponent}:${result.matchIndex}`;
    const morale = finite(context?.player?.mindset?.morale);
    const rating = result.rating === null ? null : n(result.rating);
    const goals = n(result.goals), assists = n(result.assists);
    const contribution = goals + assists;

    if (firstCareerGoal) {
        if (result.result === 'loss') return stablePick(seed, `${key}:first-goal-loss`, [
            `Le résultat t’empêche de vraiment le savourer, mais une chose reste à toi : c’était le premier. Le premier but de ta carrière ne disparaîtra pas avec cette défaite.`,
            `La défaite prend presque toute la place. Presque. Parce qu’au milieu de la frustration, tu sais aussi que tu viens d’inscrire le premier but de ta carrière.`
        ]);
        return stablePick(seed, `${key}:first-goal`, [
            `Dans le vestiaire, le bruit continue autour de toi, mais une pensée revient : c’était le premier. Le premier but de ta carrière. Celui-là ne se confondra jamais avec les suivants.`,
            `Tu peux rejouer l’action autant que tu veux, le détail le plus simple reste le plus fort : tu viens de marquer le premier but de ta carrière.`,
            `Il y aura peut-être d’autres buts, dans de plus grands stades et dans de plus grands matchs. Mais le premier vient d’exister, et personne ne pourra te l’enlever.`
        ]);
    }

    if (result.playerPlayed === false) {
        if (morale !== null && morale <= 35) return stablePick(seed, `${key}:unused-low`, [
            `Le plus difficile n’est pas de rester assis. C’est de regarder le match avancer sans toi et de sentir que ta place paraît un peu plus loin qu’hier.`,
            `Tu essaies de rester dans le match depuis le banc, mais une pensée revient malgré toi : il va falloir donner au coach une raison claire de te rappeler.`,
            `Tu ne veux pas dramatiser une rencontre. Pourtant, dans ta période actuelle, ne pas entrer laisse une trace plus profonde que tu ne l’aurais voulu.`
        ]);
        if (importance === 'major' || importance === 'exceptional') return `Regarder un match de cette importance sans pouvoir y entrer laisse une frustration particulière. Tu la gardes pour toi.`;
        return null;
    }

    if (result.started === false && (contribution > 0 || rating >= 7.3)) return stablePick(seed, `${key}:sub-impact`, [
        `Tu n’avais pas beaucoup de temps. C’est précisément pour cela que cette entrée compte : tu as réussi à exister avant même que le match ne te laisse vraiment t’installer.`,
        `Quand tu es entré, tu savais que chaque ballon aurait plus de poids. En quittant la pelouse, tu as au moins la certitude d’avoir utilisé les minutes qu’on t’a données.`,
        `Une entrée ne change pas toujours une hiérarchie. Mais celle-ci te donne quelque chose de concret à emporter vers la prochaine séance.`
    ]);

    if (result.result === 'loss' && (contribution > 0 || rating >= 7.5)) return stablePick(seed, `${key}:strong-loss`, [
        `Tes chiffres diront que tu as répondu présent. Ils n’effacent pourtant pas cette sensation : avoir fait un bon match ne rend pas la défaite plus facile à accepter.`,
        `Tu sais que ta prestation tient debout. Ce soir, ça ne suffit pas vraiment à te consoler. Le résultat reste celui que tout le monde emporte avec lui.`,
        `Il y a une frustration étrange à sortir d’un bon match sans victoire. Tu peux être fier de ce que tu as produit et détester la soirée en même temps.`
    ]);

    if (rating !== null && rating < 5.5) {
        if (morale !== null && morale <= 35) return stablePick(seed, `${key}:poor-low`, [
            `Tu n’as pas besoin qu’on te détaille les erreurs. Tu les rejoues déjà dans ta tête, et dans ta période actuelle il faudra éviter qu’un mauvais soir devienne une habitude.`,
            `Le trajet vers le vestiaire paraît plus long que d’habitude. Tu sais surtout qu’il faudra revenir demain sans laisser ce match décider de la suite à ta place.`,
            `Ce soir touche un peu plus fort parce que la confiance n’était déjà pas au plus haut. La seule réponse utile viendra au prochain entraînement.`
        ]);
        return stablePick(seed, `${key}:poor`, [
            `Tu sais déjà quelles actions vont revenir dans ta tête ce soir. Pas besoin de chercher d’excuse : ce match devra surtout servir à ne pas refaire les mêmes erreurs.`,
            `Certains matchs s’oublient vite. Celui-ci demande plutôt d’être regardé en face, puis laissé derrière soi.`,
            `Tu quittes la pelouse agacé contre toi-même. La frustration est nette, mais elle peut encore devenir utile si tu t’en sers dès la prochaine séance.`
        ]);
    }

    if ((importance === 'major' || importance === 'exceptional') && result.result === 'win' && (contribution > 0 || rating >= 7.8)) {
        return stablePick(seed, `${key}:big-win`, [
            `Tu sens que cette soirée peut déplacer quelque chose autour de toi. Pas toute une carrière en un match, mais peut-être la manière dont on prononcera ton nom demain.`,
            `Il y a des victoires que l’on célèbre, et d’autres qui semblent ouvrir une porte. En regagnant le vestiaire, tu as le sentiment d’avoir touché à la seconde catégorie.`,
            `Tu essaies de rester calme, mais tu le sais : répondre présent dans un match comme celui-ci n’a pas tout à fait la même valeur.`
        ]);
    }

    if (result.result === 'win' && rating !== null && rating >= 8.3) return stablePick(seed, `${key}:elite-win`, [
        `Tu n’as pas besoin de regarder la note pour savoir que tu as pesé. Il y a des soirs où le jeu paraît plus simple parce que tu arrives toujours une demi-seconde avant les autres.`,
        `En quittant la pelouse, tu ressens cette satisfaction rare d’avoir joué presque exactement comme tu l’espérais avant le coup d’envoi.`,
        `Tu gardes une sensation simple : ce soir, tu n’as pas subi le match. Tu l’as habité.`
    ]);

    if (morale !== null && morale <= 30 && result.result === 'win' && contribution > 0) return stablePick(seed, `${key}:relief-win`, [
        `Tu avais besoin d’un signe que tout n’était pas en train de t’échapper. Cette victoire n’efface rien, mais ta contribution te redonne quelque chose à quoi t’accrocher.`,
        `Le soulagement arrive avant la joie. Dans ta période actuelle, avoir compté dans une victoire fait plus de bien que tu ne veux vraiment le montrer.`
    ]);

    return null;
}

function titleFor(result, importance, matchCount, firstCareerGoal = false) {
    if (matchCount > 1) return 'Une période, plusieurs histoires';
    const opponent = result?.opponent || 'Adversaire';
    if (firstCareerGoal) return `Le premier restera à part`;
    if (importance === 'exceptional') return `Une soirée qui peut compter longtemps`;
    if (importance === 'major') return `Plus qu’un simple match contre ${opponent}`;
    if (result?.result === 'win') return `Le travail est fait`;
    if (result?.result === 'loss') return `Une soirée à digérer`;
    return `Un match qui laisse des questions`;
}

function toneFor(result) {
    if (result?.result === 'win') return n(result.rating) >= 7.5 ? 'triumph' : 'relief';
    if (result?.result === 'loss') return n(result.rating) >= 7 ? 'bittersweet' : 'disappointment';
    return 'reflection';
}

function recap(facts, featuredFact, impactFact, evaluations) {
    return facts.map(fact => {
        const result = resultView(fact);
        const level = evaluations.get(fact.id)?.impactLevel || impactLevel(fact);
        return {
            matchIndex: result.matchIndex,
            opponent: result.opponent,
            competition: result.competitionName,
            score: scoreText(result),
            result: result.result,
            rating: result.playerPlayed === false ? null : n(result.rating),
            goals: n(result.goals),
            assists: n(result.assists),
            interactive: result.interactive,
            playerPlayed: result.playerPlayed,
            started: result.started,
            appearance: result.appearance,
            minutesPlayed: result.minutesPlayed,
            appearanceLabel: appearanceLabel(result),
            impactLevel: level,
            impactLabel: impactLabel(level),
            impactDetail: impactDetail(result),
            isNarrativeFocus: fact.id === featuredFact.id,
            isImpactMatch: fact.id === impactFact?.id && result.playerPlayed !== false
        };
    });
}

export class NarrativeBeatComposer {
    compose({ plan, context, memory } = {}) {
        if (!plan?.primary?.featuredFact || !context?.player) return { primaryScene: null, callbackCommands: [] };
        const { featuredFact, impactFact, facts, evaluation, evaluations, arc } = plan.primary;
        const results = facts.map(resultView), featured = resultView(featuredFact);
        const impactMatch = impactFact ? resultView(impactFact) : null;
        const playerResults = results.filter(result => result.playerPlayed !== false);
        const importance = evaluation?.importance || 'normal';
        const callback = memory?.callbacksByFactId?.[featuredFact.id] || null;
        const continuity = memory?.continuityByFactId?.[featuredFact.id] || null;
        const overview = blockOverviewText(results, impactMatch);
        const narrativeFocus = impactMatch || featured;
        const firstGoalFactId = firstCareerGoalMatch(context, results);
        const firstCareerGoal = Boolean(firstGoalFactId && narrativeFocus?.factId === firstGoalFactId);
        const mindsetText = playerMindsetText(context, narrativeFocus, importance, { firstCareerGoal });
        const beats = [];
        const addBeat = beat => beats.push({ ...beat, key: `${featuredFact.id}:${beat.kind}` });
        if (overview) addBeat({ kind: 'block-overview', text: overview, delay: 800, emphasis: true });
        addBeat({ kind: 'atmosphere', text: atmosphereText(featured, importance), delay: 700 });
        addBeat({ kind: 'result', text: outcomeText(featured), delay: 950, emphasis: true });
        addBeat({ kind: 'player', text: performanceText(context.player, narrativeFocus), delay: 1050 });
        if (mindsetText) addBeat({ kind: 'player-mindset', text: mindsetText, delay: 1150, intimate: true, emphasis: firstCareerGoal });
        if (callback) addBeat({ kind: 'memory', text: callback.text, delay: 1200, callback: true });
        else if (continuity) addBeat({ kind: 'continuity', text: continuity, delay: 1100 });

        const scene = {
            id: stableNarrativeId('narrative_match', featuredFact.id),
            type: 'match.end',
            importance,
            tone: toneFor(featured),
            title: titleFor(featured, importance, results.length, firstCareerGoal),
            subtitle: results.length > 1
                ? `${playerResults.length} apparition${playerResults.length > 1 ? 's' : ''} · statut en mouvement`
                : `${featured.competitionName} · ${featured.opponent}`,
            matchIndex: featured.matchIndex ?? null,
            impactMatchIndex: impactMatch?.matchIndex ?? null,
            interactive: featured.interactive,
            matches: recap(facts, featuredFact, impactFact, evaluations),
            beats,
            arc,
            narrativeSeed: context.seed,
            sourceFactIds: facts.map(fact => fact.id),
            facts: {
                matchCount: results.length,
                appearances: playerResults.length,
                result: featured.result,
                score: scoreText(featured),
                rating: impactMatch ? n(impactMatch.rating) : (featured.playerPlayed ? n(featured.rating) : 0),
                goals: playerResults.reduce((sum, result) => sum + n(result.goals), 0),
                assists: playerResults.reduce((sum, result) => sum + n(result.assists), 0),
                firstCareerGoal
            }
        };
        const callbackCommands = callback ? [{
            id: stableNarrativeId('callback', { memoryId: callback.memoryId, factId: featuredFact.id }),
            action: 'record',
            memoryId: callback.memoryId,
            factId: featuredFact.id,
            sceneId: scene.id,
            occurredAt: featuredFact.occurredAt
        }] : [];
        return { primaryScene: scene, callbackCommands };
    }
}

export default NarrativeBeatComposer;
