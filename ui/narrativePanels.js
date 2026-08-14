// ui/narrativePanels.js
// Présentation UI uniquement : affiche jusqu'à trois panneaux narratifs empilés.
// Aucun fait métier, pacing ou état narratif n'est décidé ici.

const MAX_PANELS = 3;

function assertFiniteTime(value, label) {
    if (!Number.isFinite(value) || value < 0) {
        throw new TypeError(`${label} doit être un nombre positif.`);
    }
}

export function normalizeNarrativePanelsScene(scene = {}) {
    const panels = Array.isArray(scene.panels) ? scene.panels : [];
    if (!panels.length || panels.length > MAX_PANELS) {
        throw new RangeError(`Une scène NarrativePanels doit contenir entre 1 et ${MAX_PANELS} panneaux.`);
    }

    const normalizedPanels = panels.map((panel, index) => {
        const activeFrom = panel.activeFrom ?? 0;
        const activeTo = panel.activeTo ?? Number.POSITIVE_INFINITY;
        assertFiniteTime(activeFrom, `panels[${index}].activeFrom`);
        if (activeTo !== Number.POSITIVE_INFINITY) {
            assertFiniteTime(activeTo, `panels[${index}].activeTo`);
            if (activeTo <= activeFrom) {
                throw new RangeError(`panels[${index}].activeTo doit être supérieur à activeFrom.`);
            }
        }

        const media = panel.media || {};
        const mediaType = media.type || 'image';
        if (!['image', 'video'].includes(mediaType)) {
            throw new TypeError(`panels[${index}].media.type doit être "image" ou "video".`);
        }

        return Object.freeze({
            id: panel.id || `panel-${index + 1}`,
            activeFrom,
            activeTo,
            media: Object.freeze({
                type: mediaType,
                src: media.src || '',
                alt: media.alt || ''
            }),
            speaker: panel.speaker || '',
            dialogue: panel.dialogue || '',
            expand: Boolean(panel.expand)
        });
    });

    return Object.freeze({
        id: scene.id || 'narrative-panels-scene',
        label: scene.label || '',
        panels: Object.freeze(normalizedPanels)
    });
}

export function getActiveNarrativePanelIndex(scene, elapsedMs) {
    const normalized = normalizeNarrativePanelsScene(scene);
    assertFiniteTime(elapsedMs, 'elapsedMs');

    const exact = normalized.panels.findIndex(
        panel => elapsedMs >= panel.activeFrom && elapsedMs < panel.activeTo
    );
    if (exact >= 0) return exact;

    const started = normalized.panels
        .map((panel, index) => ({ panel, index }))
        .filter(({ panel }) => elapsedMs >= panel.activeFrom);

    return started.length ? started[started.length - 1].index : 0;
}

function createMedia(panel) {
    if (panel.media.type === 'video') {
        const video = document.createElement('video');
        video.src = panel.media.src;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.setAttribute('aria-label', panel.media.alt || '');
        return video;
    }

    const image = document.createElement('img');
    image.src = panel.media.src;
    image.alt = panel.media.alt || '';
    image.loading = 'eager';
    image.decoding = 'async';
    return image;
}

function createPanelElement(panel, index) {
    const article = document.createElement('article');
    article.className = 'stp-narrative-panel';
    article.dataset.panelId = panel.id;
    article.dataset.panelIndex = String(index);

    const media = createMedia(panel);
    media.className = 'stp-narrative-panel__media';
    article.appendChild(media);

    const shade = document.createElement('div');
    shade.className = 'stp-narrative-panel__shade';
    article.appendChild(shade);

    if (panel.speaker || panel.dialogue) {
        const copy = document.createElement('div');
        copy.className = 'stp-narrative-panel__copy';

        if (panel.speaker) {
            const speaker = document.createElement('div');
            speaker.className = 'stp-narrative-panel__speaker';
            speaker.textContent = panel.speaker;
            copy.appendChild(speaker);
        }

        const dialogue = document.createElement('div');
        dialogue.className = 'stp-narrative-panel__dialogue';
        dialogue.textContent = panel.dialogue;
        copy.appendChild(dialogue);
        article.appendChild(copy);
    }

    return article;
}

export class NarrativePanels {
    constructor({ root, scene, onPanelChange = null } = {}) {
        if (!root || typeof root.replaceChildren !== 'function') {
            throw new TypeError('NarrativePanels nécessite un élément root valide.');
        }
        this.root = root;
        this.scene = normalizeNarrativePanelsScene(scene);
        this.onPanelChange = onPanelChange;
        this.activeIndex = -1;
        this.panelElements = [];
    }

    mount() {
        const shell = document.createElement('section');
        shell.className = 'stp-narrative-panels';
        shell.dataset.sceneId = this.scene.id;
        if (this.scene.label) shell.setAttribute('aria-label', this.scene.label);

        this.panelElements = this.scene.panels.map((panel, index) => {
            const element = createPanelElement(panel, index);
            shell.appendChild(element);
            return element;
        });

        this.root.replaceChildren(shell);
        this.setTime(0);
        return shell;
    }

    setTime(elapsedMs) {
        const nextIndex = getActiveNarrativePanelIndex(this.scene, elapsedMs);
        this.panelElements.forEach((element, index) => {
            const active = index === nextIndex;
            const panel = this.scene.panels[index];
            element.classList.toggle('is-active', active);
            element.classList.toggle('is-inactive', !active);
            element.classList.toggle('is-expanded', active && panel.expand);
            element.setAttribute('aria-current', active ? 'true' : 'false');

            const video = element.querySelector('video');
            if (video) {
                if (active) video.play().catch(() => {});
                else video.pause();
            }
        });

        if (nextIndex !== this.activeIndex) {
            const previousIndex = this.activeIndex;
            this.activeIndex = nextIndex;
            this.onPanelChange?.({
                sceneId: this.scene.id,
                previousIndex,
                activeIndex: nextIndex,
                panel: this.scene.panels[nextIndex],
                elapsedMs
            });
        }
        return nextIndex;
    }

    destroy() {
        this.panelElements.forEach(element => element.querySelector('video')?.pause());
        this.panelElements = [];
        this.root.replaceChildren();
        this.activeIndex = -1;
    }
}

export default NarrativePanels;
