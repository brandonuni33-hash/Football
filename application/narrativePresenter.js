// Traduit la sortie du moteur en modèle de présentation. Aucun accès au DOM ici.

export class NarrativePresenter {
    present(output = {}) {
        return Object.freeze({
            primaryScene: output.primaryScene || null,
            passiveBeats: Object.freeze([...(output.passiveBeats || [])]),
            journalEntries: Object.freeze([...(output.journalEntries || [])]),
            notificationCommands: Object.freeze([...(output.notificationCommands || [])]),
            diagnostics: output.diagnostics || null
        });
    }
}

export default NarrativePresenter;
