// Construit uniquement une présentation à partir d'un but déjà validé par le match.
export function buildGoalPresentation({ matchId, scorer, minute, score, gesture=null, celebration=null, stadiumReaction=null }={}) {
    if (!matchId || !scorer || !Number.isFinite(Number(minute)) || !score) return null;
    return {
        kind:'goal', matchId, minute:Number(minute), scorer:String(scorer),
        score:{home:Number(score.home)||0,away:Number(score.away)||0}, gesture:gesture||null,
        celebration:celebration||'Tu te retournes vers les tribunes pendant que tes coéquipiers arrivent.',
        stadiumReaction:stadiumReaction||'Le stade réagit d’un seul mouvement.',
        requiresContinue:true
    };
}
export default buildGoalPresentation;
