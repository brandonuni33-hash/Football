// Compose les observations du monde déjà visibles par le joueur.

import { stableNarrativeId } from './narrativeFactNormalizer.js';
import { MINDSET_COPY, familyEventText, stableCareerPick } from './careerLifeNarrativeLibrary.js';

const n = value => Number.isFinite(Number(value)) ? Number(value) : null;

function sentence(text) {
    const value = String(text || '').trim();
    if (!value) return '';
    return /[.!?…]$/.test(value) ? value : `${value}.`;
}

function seedFor(context = {}) { return context.seed || context?.player?.id || 'career'; }
function youthCoachContext(context = {}) {
    const player = context.player || {}, age = Number(player.age || 0);
    const labels = [player.careerStage,player.stage,player.squadStatus,player.contract?.type].filter(Boolean).join(' ').toLowerCase();
    if (/professional|professionnel|\bpro\b|first.?team|premi[eè]re.?[eé]quipe|\bsenior\b/.test(labels)) return false;
    return (age > 0 && age <= 18) || /youth|jeune|academy|acad[eé]mie|formation|u\s?1[5-9]/.test(labels);
}

function coachRelationshipText(coach = {}) {
    const relation = n(coach.relation);
    const name = coach.name || 'le coach';
    const opinion = String(coach.opinion || '').toLowerCase();
    if (coach.isFormative && relation !== null && relation >= 72) return `${name} n’est plus seulement un entraîneur dans ton parcours. Il t’a connu assez tôt pour que son regard compte autrement que celui des autres.`;
    if (relation !== null && relation >= 82) return `Entre ${name} et toi, la confiance s’est construite avec le temps. Ses mots ont désormais le poids d’une relation qui dépasse la simple hiérarchie.`;
    if (relation !== null && relation <= 28) return `Entre ${name} et toi, la confiance est devenue fragile. Dans cette période, une phrase de travers peut laisser plus de traces qu’elle ne devrait.`;
    if (opinion.includes('fâch') || opinion.includes('déçu')) return `${name} ne te regarde plus tout à fait de la même manière. Tu sens que les prochains actes compteront davantage que les explications.`;
    if (relation !== null && relation >= 60) return `Le lien avec ${name} est solide, sans être acquis. C’est précisément pour cela que cet échange mérite ton attention.`;
    return null;
}

function playerMindsetText(player = {}, context = {}) {
    const mindset = player.mindset || {};
    const morale = n(mindset.morale ?? player.morale);
    const fitness = n(mindset.fitness ?? player.fitness);
    const starts = Number(player?.stats?.starts || 0), matches = Number(player?.stats?.matchesPlayed || 0);
    const seed = seedFor(context), key = `mindset:${morale}:${fitness}:${starts}:${matches}`;
    if (morale !== null && morale <= 32) return stableCareerPick(seed, key, MINDSET_COPY.low);
    if (matches >= 3 && starts === 0) return stableCareerPick(seed, key, MINDSET_COPY.unused);
    if (fitness !== null && fitness <= 58) return `La fatigue rend tout plus lourd à lire. Tu le sens jusque dans la manière dont tu anticipes les prochaines semaines.`;
    if (morale !== null && morale >= 78) return stableCareerPick(seed, key, MINDSET_COPY.high);
    if (matches >= 8 && morale !== null && morale >= 60) return stableCareerPick(seed, `${key}:ambition`, MINDSET_COPY.ambition);
    return null;
}

function coachObservation(fact, evaluation, context, memory) {
    const payload = fact.payload || {};
    const coach = context?.relationships?.coach || {};
    const callback = memory?.callbacksByFactId?.[fact.id] || null;
    const formative = youthCoachContext(context);
    // En formation, l'événement du coach doit rester un moment humain très court.
    // Les souvenirs, jauges et états physiques restent mémorisés mais ne viennent
    // plus transformer une phrase simple en paragraphe de remplissage.
    if (formative) {
        return {
            id:stableNarrativeId('observation',fact.id),key:`${fact.id}:world-observation`,kind:'world-observation',category:'coach',
            title:payload.title || (coach.name ? `${coach.name} vient te voir` : 'Le coach vient te voir'),
            text:sentence(payload.text),importance:evaluation?.importance || payload.importance || 'normal',factId:fact.id,
            occurredAt:fact.occurredAt,delay:650,callbackMemoryId:null,emphasis:false,shortForm:true
        };
    }
    const parts = [sentence(payload.text)];
    const relationship = coachRelationshipText(coach);
    if (callback?.memoryType === 'coach-choice' && callback.text) parts.push(callback.text);
    if (relationship) parts.push(relationship);
    const mindset = playerMindsetText(context?.player, context);
    if (mindset) parts.push(mindset);
    return {
        id: stableNarrativeId('observation', fact.id), key: `${fact.id}:world-observation`, kind: 'world-observation', category: 'coach',
        title: payload.title || (coach.name ? `${coach.name} veut te parler` : 'Le coach veut te parler'),
        text: parts.filter(Boolean).join(' '), importance: evaluation?.importance || payload.importance || 'normal', factId: fact.id,
        occurredAt: fact.occurredAt, delay: 900, callbackMemoryId: callback?.memoryType === 'coach-choice' ? callback.memoryId : null,
        emphasis: ['important', 'major', 'exceptional'].includes(evaluation?.importance || payload.importance)
    };
}

function familyObservation(fact, evaluation, context) {
    const payload = fact.payload || {};
    const name = payload.firstName || 'ton enfant';
    const text = fact.type === 'family.child-born'
        ? familyEventText({ seed: seedFor(context), event: 'birth', name })
        : sentence(payload.text);
    return {
        id: stableNarrativeId('observation', fact.id), key:`${fact.id}:world-observation`, kind:'world-observation', category:'family',
        title: payload.title || 'Ta vie personnelle change', text,
        importance: evaluation?.importance || payload.importance || 'important', factId:fact.id, occurredAt:fact.occurredAt, delay:1000,
        emphasis:true
    };
}

function transferObservation(fact, evaluation, context) {
    const payload = fact.payload || {};
    const seed = seedFor(context);
    let text = sentence(payload.text);
    if (fact.type === 'transfer.offer.created') text = stableCareerPick(seed, `${fact.id}:offer`, [
        `${payload.club || 'Un club'} vient de formaliser son intérêt. Pour la première fois, ton avenir n’est plus une rumeur mais une décision à prendre.`,
        `Une proposition de ${payload.club || 'un autre club'} est désormais sur la table. Le choix ne se résume pas au prestige : il touche au temps de jeu, au rôle et à la trajectoire que tu veux construire.`,
        `Ton agent te transmet l’offre de ${payload.club || 'un club'}. Quelques chiffres, un projet sportif, et soudain la saison peut prendre une autre direction.`
    ]);
    else if (fact.type === 'transfer.contact.created') text = stableCareerPick(seed, `${fact.id}:contact`, [
        `Le suivi devient plus concret. On ne parle toujours pas d’offre, mais ton nom est désormais discuté directement entre clubs et entourage.`,
        `Un club qui te suivait de loin cherche maintenant un contact. Rien n’est signé, mais quelque chose vient de changer de niveau.`,
        `Les renseignements ne se limitent plus aux tribunes. Un premier contact existe désormais autour de ton dossier.`
    ]);
    return {
        id:stableNarrativeId('observation',fact.id),key:`${fact.id}:world-observation`,kind:'world-observation',category:'transfer',
        title:payload.title||'Ton avenir bouge',text,importance:evaluation?.importance||payload.importance||'important',factId:fact.id,occurredAt:fact.occurredAt,delay:950,
        emphasis:['major','exceptional'].includes(evaluation?.importance||payload.importance)
    };
}

function careerObservation(fact, evaluation, context) {
    const payload = fact.payload || {};
    const seed = seedFor(context);
    let text = sentence(payload.text);
    if (fact.type === 'career.role.discovered') text = stableCareerPick(seed, `${fact.id}:role`, [
        `Le staff ne te décrit plus seulement par ton poste. Il commence à te voir dans un rôle de ${payload.role || 'plus précis'}, avec des responsabilités qui reviennent d’un match à l’autre.`,
        `Ton identité se précise. Pour le staff, tu n’es plus simplement un joueur à placer sur une ligne de composition : un rôle de ${payload.role || 'plus précis'} commence à s’installer.`,
        `Plusieurs semaines de travail finissent par produire quelque chose de concret : le staff associe désormais ton jeu à un rôle de ${payload.role || 'plus précis'}.`
    ]);
    if (fact.type === 'career.position.proposed') text = stableCareerPick(seed, `${fact.id}:position`, [
        `Le staff pense qu’un passage de ${payload.from || 'ton poste actuel'} vers ${payload.to || 'un autre poste'} pourrait ouvrir une nouvelle version de ton jeu. Rien n’est décidé sans toi.`,
        `Le coach te voit peut-être autrement. L’idée de passer de ${payload.from || 'ton poste actuel'} à ${payload.to || 'un autre poste'} devient une vraie discussion, pas une simple expérimentation d’entraînement.`,
        `Une évolution vers ${payload.to || 'un autre poste'} est désormais envisagée. Accepter pourrait créer de nouvelles opportunités ; refuser protégerait ce que tu as déjà construit.`
    ]);
    return {
        id:stableNarrativeId('observation',fact.id),key:`${fact.id}:world-observation`,kind:'world-observation',category:'career',title:payload.title||'Ta carrière évolue',
        text,importance:evaluation?.importance||payload.importance||'normal',factId:fact.id,occurredAt:fact.occurredAt,delay:900,
        emphasis:['important','major','exceptional'].includes(evaluation?.importance||payload.importance)
    };
}

function observation(fact, evaluation, context, memory) {
    if (fact.type === 'coach.interaction.created') return coachObservation(fact, evaluation, context, memory);
    if (String(fact.type || '').startsWith('family.')) return familyObservation(fact, evaluation, context);
    if (String(fact.type || '').startsWith('transfer.')) return transferObservation(fact, evaluation, context);
    if (String(fact.type || '').startsWith('career.')) return careerObservation(fact, evaluation, context);

    const payload = fact.payload || {};
    const category = payload.category || fact.source || 'career';
    const mindset = category === 'media' ? null : playerMindsetText(context?.player, context);
    return {
        id: stableNarrativeId('observation', fact.id), key: `${fact.id}:world-observation`, kind: 'world-observation', category,
        title: payload.title || 'Le monde réagit', text: [payload.text || 'Quelque chose évolue autour de ta carrière.', mindset].filter(Boolean).join(' '),
        importance: evaluation?.importance || payload.importance || 'normal', factId: fact.id, occurredAt: fact.occurredAt, delay: 900,
        emphasis: ['important', 'major', 'exceptional'].includes(evaluation?.importance || payload.importance)
    };
}

export class NarrativeWorldBeatComposer {
    compose({ facts = [], evaluations = [], context = {}, memory = {} } = {}) {
        const evaluationById = new Map(evaluations.map(item => [item.factId, item]));
        const worldFacts = facts.filter(fact => fact.type !== 'match.completed');
        const ranked = [...worldFacts].sort((left, right) => (evaluationById.get(right.id)?.score || 0) - (evaluationById.get(left.id)?.score || 0));
        const allObservations = ranked.map(fact => observation(fact, evaluationById.get(fact.id), context, memory));
        const passiveBeats = allObservations.slice(0, 3);
        const journalEntries = [...allObservations].reverse().map(item => ({
            id: stableNarrativeId('journal', item.factId), type: 'narrative.observation', category: item.category, title: item.title, text: item.text,
            importance: item.importance, sourceFactId: item.factId, occurredAt: item.occurredAt
        }));
        if (!passiveBeats.length) return { primaryScene: null, passiveBeats, journalEntries };
        const first = passiveBeats[0];
        return {
            primaryScene: {
                id: stableNarrativeId('narrative_world', passiveBeats.map(item => item.factId)), type: 'world.update', importance: first.importance, tone: 'reflection',
                title: first.category === 'coach' ? first.title : first.category === 'family' ? first.title : 'Le monde continue de bouger',
                subtitle: first.shortForm ? 'Le lien se construit petit à petit'
                    : first.category === 'coach' ? 'Un échange qui peut compter dans la relation'
                    : first.category === 'family' ? 'Il y a aussi une vie loin du terrain'
                    : `${worldFacts.length} évolution${worldFacts.length > 1 ? 's' : ''} autour de ta carrière`,
                matches: [], beats: passiveBeats, sourceFactIds: ranked.map(fact => fact.id),
                facts: { factCount: worldFacts.length, categories: [...new Set(allObservations.map(item => item.category))] }
            }, passiveBeats, journalEntries
        };
    }
}

export default NarrativeWorldBeatComposer;
