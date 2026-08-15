// Construit uniquement une présentation à partir d'un but déjà validé par le match.
export function buildGoalPresentation({ eventId,matchId,teamSide=null,playerContribution=null,scorer,minute,score,gesture=null,source=null,celebration=null,stadiumReaction=null }={}) {
    if (!eventId || !matchId || !scorer || !Number.isFinite(Number(minute)) || !score) return null;
    return {
        kind:'goal', eventId:String(eventId), matchId, teamSide, playerContribution, minute:Number(minute), scorer:String(scorer),
        score:{home:Number(score.home)||0,away:Number(score.away)||0}, gesture:gesture||null,
        source:source?{...source}:null,
        celebration:celebration||'Le ballon franchit la ligne. Tes coéquipiers réagissent avant même que l’action ait vraiment le temps de retomber.',
        stadiumReaction:stadiumReaction||'Autour de la pelouse, les réactions arrivent d’un seul coup.',
        requiresContinue:true
    };
}
export default buildGoalPresentation;
