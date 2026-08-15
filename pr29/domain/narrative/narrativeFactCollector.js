// Adapte les rapports métier déjà résolus en faits bruts. Aucun résultat n'est recalculé ici.

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

function blockOccurrence(state) {
    const season = state?.calendar?.currentSeasonYear ?? state?.season ?? 'unknown';
    const month = state?.calendar?.currentMonth ?? 'unknown';
    const playedCount = state?.player?.stats?.matchesPlayed ?? 'unknown';
    return `season:${season}:month:${month}:played:${playedCount}`;
}

function worldFact(state, {
    type, source, identity, occurredAt, actorIds = [], metrics = {}, outcome = {},
    certainty = 'confirmed', visibility = 'player', tags = [], payload = {}
}) {
    const playerId = state?.player?.id || null;
    return {
        type,
        source,
        occurredAt: String(occurredAt || blockOccurrence(state)),
        subjectId: playerId,
        actorIds: [playerId, ...actorIds].filter(Boolean),
        metrics,
        outcome,
        certainty,
        visibility,
        tags,
        dedupeKey: `${type}|${playerId || 'active-player'}|${identity}`,
        payload
    };
}

function importanceForDelta(delta) {
    return Math.abs(n(delta)) >= 8 ? 'important' : 'normal';
}

function consequenceTitle(consequence = {}) {
    const raw = String(consequence.label || '').trim();
    const key = raw.toLowerCase();
    const delta = n(consequence.result?.delta);
    const technical = /^(attributes?|stats?|media|player|career|social|relationships?)\.|^(relationcoach|vestiaire|morale|fitness|mental|discipline|charisme)$/i.test(raw);
    if (!technical && raw && !/[._]/.test(raw)) return raw;
    if (/vitesse|speed|accel/.test(key)) return delta < 0 ? 'Tes jambes répondent moins bien' : 'Tu gagnes en explosivité';
    if (/controle|control|technique|dribble/.test(key)) return delta < 0 ? 'Ton toucher demande du travail' : 'Ton toucher devient plus sûr';
    if (/passe|passing/.test(key)) return delta < 0 ? 'Ta justesse baisse un peu' : 'Ta lecture du jeu progresse';
    if (/tir|shoot/.test(key)) return delta < 0 ? 'La finition te résiste davantage' : 'Tu te sens plus juste devant le but';
    if (/puissance|physique|fitness/.test(key)) return delta < 0 ? 'Le corps rappelle ses limites' : 'Le travail physique commence à payer';
    if (/defense|défense/.test(key)) return delta < 0 ? 'Tes repères défensifs se brouillent' : 'Tes repères défensifs deviennent plus nets';
    if (/relationcoach/.test(key)) return delta < 0 ? 'La confiance du coach se fragilise' : 'La confiance avec le coach grandit';
    if (/vestiaire|relationship/.test(key)) return delta < 0 ? 'Le vestiaire prend ses distances' : 'Ta place dans le groupe se renforce';
    if (/morale|mental/.test(key)) return delta < 0 ? 'Le doute laisse une trace' : 'La confiance revient peu à peu';
    if (/discipline/.test(key)) return delta < 0 ? 'Ton attitude te rattrape' : 'Ta maîtrise commence à se voir';
    if (/media|reputation|charisme/.test(key)) return delta < 0 ? 'Le regard extérieur se refroidit' : 'Ton nom commence à circuler davantage';
    return delta < 0 ? 'Une décision passée laisse une trace' : delta > 0 ? 'Une décision passée commence à payer' : 'Une décision passée refait surface';
}

function occurrenceOf(state, result, index) {
    const fixture = result?.fixture || {};
    if (fixture.playedAt || fixture.date) return String(fixture.playedAt || fixture.date);
    const season = state?.calendar?.currentSeasonYear ?? state?.season ?? 'unknown';
    const month = state?.calendar?.currentMonth ?? 'unknown';
    return `season:${season}:month:${month}:match:${result?.matchIndex ?? index}`;
}

function matchIdentity(state, result, index) {
    const fixture = result?.fixture || {};
    const playerId = state?.player?.id || 'active-player';
    const playedCount = state?.player?.stats?.matchesPlayed ?? 'unknown';
    return [
        'match.completed', playerId, fixture.id || result?.id || occurrenceOf(state, result, index),
        result?.matchIndex ?? index, result?.opponent || 'opponent', n(result?.teamGoals),
        n(result?.opponentGoals), n(result?.goals), n(result?.assists), playedCount
    ].join('|');
}

function fixtureSnapshot(result = {}) {
    const fixture = result.fixture || {};
    return {
        id: fixture.id || result.id || null,
        opponentClubId: fixture.opponentClubId || fixture.clubId || null,
        isDerby: Boolean(fixture.isDerby),
        rival: Boolean(fixture.rival),
        rivalry: Boolean(fixture.rivalry),
        importance: fixture.importance || null,
        phase: fixture.phase || null,
        round: fixture.round || fixture.europeanRound || null,
        competitionName: fixture.competitionName || null
    };
}

export class NarrativeFactCollector {
    collectBlockFacts({ state, report, resolved = {} } = {}) {
        return [
            ...this.collectMatchFacts({ state, report }),
            ...this.collectWorldFacts({ state, resolved })
        ];
    }

    collectMatchFacts({ state, report } = {}) {
        const rawResults = report?.summary?.matchResults || report?.results || [];
        const results = Array.isArray(rawResults) ? rawResults.filter(Boolean) : [];
        return results.map((result, index) => {
            const fixture = fixtureSnapshot(result);
            const playerId = state?.player?.id || null;
            const opponentClubId = fixture.opponentClubId;
            const matchIndex = Number.isFinite(Number(result.matchIndex)) ? Number(result.matchIndex) : index;
            return {
                type: 'match.completed',
                source: 'match',
                occurredAt: occurrenceOf(state, result, index),
                subjectId: playerId,
                actorIds: [playerId, state?.player?.clubId, opponentClubId].filter(Boolean),
                metrics: {
                    matchIndex,
                    teamGoals: n(result.teamGoals),
                    opponentGoals: n(result.opponentGoals),
                    rating: result.playerPlayed === false ? null : n(result.rating),
                    goals: n(result.goals),
                    assists: n(result.assists),
                    playerPlayed: result.playerPlayed !== false,
                    started: result.started !== false,
                    minutesPlayed: n(result.minutesPlayed),
                    interactive: Boolean(result.interactive)
                },
                outcome: {
                    result: result.result || null,
                    score: `${n(result.teamGoals)}-${n(result.opponentGoals)}`
                },
                certainty: 'confirmed',
                visibility: 'public',
                tags: [
                    result.competitionType || result.type || 'match',
                    result.interactive ? 'interactive' : 'simulated',
                    result.playerPlayed === false ? 'unused' : 'appearance'
                ],
                dedupeKey: matchIdentity(state, result, index),
                payload: {
                    opponent: result.opponent || 'Adversaire',
                    competitionName: result.competitionName || fixture.competitionName || 'Match',
                    competitionId: result.competitionId || null,
                    competitionType: result.competitionType || result.type || null,
                    importance: result.importance || fixture.importance || null,
                    phase: result.phase || fixture.phase || null,
                    round: result.round || fixture.round || null,
                    appearance: result.appearance || (result.started === false ? 'substitute' : 'starter'),
                    fixture
                }
            };
        });
    }

    collectWorldFacts({ state, resolved = {} } = {}) {
        const facts = [];
        const occurrence = blockOccurrence(state);

        for (const consequence of resolved.revealedConsequences || []) {
            facts.push(worldFact(state, {
                type: 'decision.consequence.revealed',
                source: 'consequence',
                identity: consequence.id || `${consequence.choiceId}|${occurrence}`,
                metrics: { delta: n(consequence.result?.delta) },
                outcome: { status: 'revealed', change: consequence.result || null },
                tags: ['decision', consequence.source].filter(Boolean),
                payload: {
                    category: 'decision',
                    title: consequenceTitle(consequence),
                    text: consequence.narrative || 'Une décision passée commence à produire ses effets.',
                    choiceId: consequence.choiceId || null,
                    originalVisibility: consequence.visibility || null,
                    importance: importanceForDelta(consequence.result?.delta)
                }
            }));
        }

        const mediaPost = resolved.mediaCycle?.post;
        if (mediaPost) facts.push(worldFact(state, {
            type: 'media.post.created',
            source: 'media',
            identity: mediaPost.id || `${mediaPost.source}|${occurrence}`,
            occurredAt: mediaPost.createdAt || occurrence,
            outcome: { postType: mediaPost.type || null },
            visibility: 'public',
            tags: ['media', mediaPost.type].filter(Boolean),
            payload: {
                category: 'media',
                title: mediaPost.source || 'Les réactions continuent',
                text: mediaPost.content || '',
                importance: mediaPost.type === 'critique' ? 'important' : 'low'
            }
        }));

        const mediaDilemma = resolved.mediaCycle?.dilemma;
        if (mediaDilemma) facts.push(worldFact(state, {
            type: 'media.dilemma.created',
            source: 'media',
            identity: `${mediaDilemma.id || mediaDilemma.title}|${occurrence}`,
            tags: ['media', 'decision'],
            payload: {
                category: 'media',
                title: mediaDilemma.title || 'Une situation médiatique demande une réponse',
                text: mediaDilemma.description || '',
                importance: 'important'
            }
        }));

        if (resolved.event) facts.push(worldFact(state, {
            type: 'career.event.created',
            source: 'event',
            identity: `${resolved.event.id || resolved.event.titre || resolved.event.title}|${occurrence}`,
            tags: ['event', resolved.event.categorie].filter(Boolean),
            payload: {
                category: resolved.event.categorie || 'career',
                title: resolved.event.titre || resolved.event.title || 'Une situation inattendue',
                text: resolved.event.description || '',
                importance: ['sante', 'carriere', 'famille'].includes(resolved.event.categorie) ? 'important' : 'normal'
            }
        }));

        if (resolved.coachEvent) facts.push(worldFact(state, {
            type: 'coach.interaction.created',
            source: 'coach',
            identity: `${resolved.coachEvent.id || resolved.coachEvent.title}|${occurrence}`,
            actorIds: ['coach'],
            tags: ['coach', 'decision'],
            payload: {
                category: 'coach',
                title: resolved.coachEvent.title || 'Le coach veut te parler',
                text: resolved.coachEvent.description || '',
                importance: String(resolved.coachEvent.id || '').includes('warning') ? 'important' : 'normal'
            }
        }));

        if (resolved.discoveredRole) facts.push(worldFact(state, {
            type: 'career.role.discovered',
            source: 'career',
            identity: `${state?.player?.id}|${resolved.discoveredRole}`,
            tags: ['career', 'identity'],
            payload: {
                category: 'career',
                title: 'Ton identité de joueur se précise',
                text: `Le staff te voit désormais dans un rôle de ${resolved.discoveredRole}.`,
                role: resolved.discoveredRole,
                importance: 'important'
            }
        }));

        if (resolved.positionProposal) facts.push(worldFact(state, {
            type: 'career.position.proposed',
            source: 'career',
            identity: `${resolved.positionProposal.from}|${resolved.positionProposal.to}|${occurrence}`,
            tags: ['career', 'coach', 'decision'],
            payload: {
                category: 'career',
                title: 'Le staff imagine un autre poste pour toi',
                text: resolved.positionProposal.message || `Une évolution de ${resolved.positionProposal.from} vers ${resolved.positionProposal.to} est envisagée.`,
                from: resolved.positionProposal.from || null,
                to: resolved.positionProposal.to || null,
                importance: 'important'
            }
        }));

        const transferCycle = resolved.transferCycle || {};
        const hasOfficialOffer = (transferCycle.activity || []).some(activity => activity.type === 'official_offer');
        for (const activity of transferCycle.activity || []) {
            if (activity.type !== 'interest_stage_changed' || !['contact', 'offer'].includes(activity.to)) continue;
            if (activity.to === 'offer' && hasOfficialOffer) continue;
            facts.push(worldFact(state, {
                type: 'transfer.contact.created',
                source: 'transfer',
                identity: `${activity.interestId || activity.clubId}|${activity.to}`,
                occurredAt: activity.at || occurrence,
                actorIds: [activity.clubId],
                metrics: { seriousness: n(activity.seriousness) },
                outcome: { from: activity.from || null, to: activity.to },
                tags: ['transfer', activity.to],
                payload: {
                    category: 'transfer',
                    title: activity.to === 'offer' ? 'Un intérêt devient concret' : 'Un club passe au contact direct',
                    text: activity.to === 'offer'
                        ? 'Les discussions ont franchi un cap et une proposition peut désormais arriver.'
                        : 'Le suivi ne se limite plus aux observations : le club cherche désormais un contact.',
                    clubId: activity.clubId || null,
                    interestId: activity.interestId || null,
                    importance: activity.to === 'offer' ? 'major' : 'important'
                }
            }));
        }

        const createdOffer = hasOfficialOffer
            ? (transferCycle.offer || resolved.transferOffer) : null;
        if (createdOffer) facts.push(worldFact(state, {
            type: 'transfer.offer.created',
            source: 'transfer',
            identity: createdOffer.interestId || `${createdOffer.clubId || createdOffer.club}|${occurrence}`,
            actorIds: [createdOffer.clubId],
            outcome: { status: 'offered' },
            tags: ['transfer', 'offer', 'decision'],
            payload: {
                category: 'transfer',
                title: `Proposition de ${createdOffer.club || 'un club'}`,
                text: createdOffer.message || 'Une proposition officielle vient d’arriver sur la table.',
                club: createdOffer.club || null,
                clubId: createdOffer.clubId || null,
                interestId: createdOffer.interestId || null,
                importance: 'major'
            }
        }));

        for (const birth of resolved.familyBirths || []) {
            const child = birth?.child || birth;
            if (!child?.id) continue;
            facts.push(worldFact(state, {
                type: 'family.child-born',
                source: 'family',
                identity: child.id,
                occurredAt: child.birthDate || child.createdAt || occurrence,
                actorIds: [child.id, child.partnerId],
                outcome: { status: 'born' },
                tags: ['family', 'legacy', 'life-event'],
                payload: {
                    category: 'family',
                    title: 'La famille s’agrandit',
                    text: `${child.firstName || 'Un enfant'} vient de naître. Une nouvelle histoire commence loin des terrains.`,
                    childId: child.id,
                    firstName: child.firstName || null,
                    importance: 'exceptional'
                }
            }));
        }

        return facts;
    }
}

export default NarrativeFactCollector;
