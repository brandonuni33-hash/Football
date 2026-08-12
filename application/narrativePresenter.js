// Traduit la sortie du moteur en modèle de présentation. Aucun accès au DOM ici.

export class NarrativePresenter {
    present(output = {}) {
        const passiveBeats = [...(output.passiveBeats || [])];
        const sourceScene = output.primaryScene || null;
        const primaryScene = sourceScene?.type === 'match.end' && passiveBeats.length
            ? { ...sourceScene, beats: [...(sourceScene.beats || []), ...passiveBeats.slice(0, 2)] }
            : sourceScene;
        return Object.freeze({
            primaryScene,
            passiveBeats: Object.freeze(passiveBeats),
            journalEntries: Object.freeze([...(output.journalEntries || [])]),
            notificationCommands: Object.freeze([...(output.notificationCommands || [])]),
            diagnostics: output.diagnostics || null
        });
    }

    getJournal(state) {
        // Le journal raconte la carrière comme une chronologie : les premières étapes
        // restent en haut et les nouveaux événements s'ajoutent en bas.
        return [...(state?.narrativeState?.journalEntries || [])]
            .map(entry => Object.freeze({
                id: entry.id,
                category: entry.category || 'career',
                title: entry.title || 'Actualité de carrière',
                text: entry.text || '',
                importance: entry.importance || 'normal',
                occurredAt: entry.occurredAt || null
            }));
    }
}

export default NarrativePresenter;
