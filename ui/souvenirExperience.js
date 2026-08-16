// ui/souvenirExperience.js
// Expérience isolée de test du Souvenir 1, montée depuis le vrai point d'entrée du jeu via ?souvenir=1.
// Aucun système de carrière n'est modifié ici : ce module sert uniquement à valider le ressenti mobile.

const SCENES = [
    {
        id: 'salon',
        className: 'stp-memory-salon',
        image: './prototype-souvenirs/salon.jpg',
        question: 'Quand tu regardes un joueur, qu’est-ce que tu remarques en premier ?',
        answers: [
            'Sa prise d’information.',
            'Sa prise de risque.',
            'Sa première touche.'
        ]
    },
    {
        id: 'cour',
        className: 'stp-memory-cour',
        question: 'Quand t’as le ballon, qu’est-ce que tu regardes en premier ?',
        answers: [
            'La distance entre moi et l’adversaire.',
            'Le placement de mon coéquipier.',
            'L’espace pour créer quelque chose.'
        ]
    },
    {
        id: 'city',
        className: 'stp-memory-city',
        question: 'Qu’est-ce qui te frustre le plus dans un match ?',
        answers: [
            'Ne pas pouvoir tenter ce que j’ai en tête.',
            'Quand le jeu devient trop lent.',
            'Quand chacun joue personnel.'
        ]
    },
    {
        id: 'porte',
        className: 'stp-memory-room',
        question: 'Quand tout le monde commence à douter de toi, qu’est-ce qui te pousse à continuer ?',
        answers: [
            'Leur prouver qu’ils se trompent.',
            'Voir jusqu’où je peux vraiment aller.',
            'J’ai déjà trop donné pour m’arrêter maintenant.',
            'Parce que jouer reste ce que j’aime le plus.'
        ]
    }
];

const QUESTION_DELAY = 2500;
const ANSWERS_DELAY = 3900;

function installStyles() {
    if (document.getElementById('stp-souvenir-styles')) return;
    const style = document.createElement('style');
    style.id = 'stp-souvenir-styles';
    style.textContent = `
        html.stp-souvenir-mode,
        html.stp-souvenir-mode body {
            margin: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #050505;
            overscroll-behavior: none;
        }
        html.stp-souvenir-mode body {
            position: fixed;
            inset: 0;
        }
        #app.stp-souvenir-app {
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100vh;
            height: 100dvh;
            max-width: 520px;
            margin: 0 auto;
            overflow: hidden;
            background: #050505;
            color: #f2eee7;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
            isolation: isolate;
        }
        .stp-memory-stage {
            position: absolute;
            inset: 0;
            overflow: hidden;
            background: #080706;
        }
        .stp-memory-visual {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            opacity: 1;
            transform: scale(1);
            transition: opacity .72s ease, transform 7s ease-out;
            background: #161311;
        }
        .stp-memory-visual.is-live { transform: scale(1.018); }
        .stp-memory-visual img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
            object-position: center;
        }
        .stp-memory-cour {
            background:
                radial-gradient(circle at 63% 74%, rgba(225,215,196,.58) 0 2.5%, transparent 2.7%),
                linear-gradient(180deg, #a47a4c 0 30%, #665342 30% 53%, #81715c 53% 55%, #4d453b 55% 100%);
        }
        .stp-memory-cour::before {
            content: '';
            position: absolute;
            left: 0; right: 0; top: 15%; height: 35%;
            background: repeating-linear-gradient(90deg, rgba(48,42,36,.9) 0 26%, rgba(76,62,49,.94) 26% 31%);
            opacity: .88;
        }
        .stp-memory-city {
            background: linear-gradient(180deg, #66513b 0 38%, #34312c 38% 60%, #242623 60% 100%);
        }
        .stp-memory-city::before {
            content: '';
            position: absolute;
            inset: 13% 7% 17%;
            border: 1px solid rgba(230,225,211,.32);
            background:
                repeating-linear-gradient(90deg, transparent 0 29px, rgba(228,228,217,.10) 30px 31px),
                repeating-linear-gradient(0deg, transparent 0 29px, rgba(228,228,217,.10) 30px 31px);
        }
        .stp-memory-room {
            background: linear-gradient(145deg, #554035 0%, #2c2420 55%, #12110f 100%);
        }
        .stp-memory-room::before {
            content: '';
            position: absolute;
            left: 21%; top: 9%; width: 58%; height: 75%;
            border: 7px solid #1b1714;
            background: linear-gradient(90deg, #2f231c, #50382a 61%, #281f19);
            box-shadow: 0 20px 55px rgba(0,0,0,.42);
        }
        .stp-memory-ui {
            position: absolute;
            left: 0;
            right: 0;
            bottom: max(92px, env(safe-area-inset-bottom));
            z-index: 6;
            padding: 0 16px;
            pointer-events: none;
            transition: opacity .34s ease, transform .34s ease;
        }
        .stp-memory-ui.is-leaving {
            opacity: 0;
            transform: translateY(4px);
        }
        .stp-memory-question,
        .stp-memory-answers {
            opacity: 0;
            visibility: hidden;
            transform: translateY(8px);
            transition: opacity .68s ease, transform .68s ease;
        }
        .stp-memory-question.is-visible,
        .stp-memory-answers.is-visible {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
        .stp-memory-question {
            margin: 0 0 14px;
            max-width: 94%;
            color: #f4f0e9;
            font-size: clamp(21px, 5.7vw, 25px);
            font-weight: 520;
            line-height: 1.12;
            letter-spacing: -.02em;
            text-shadow: 0 2px 13px rgba(0,0,0,.95), 0 1px 3px rgba(0,0,0,.85);
        }
        .stp-memory-answers {
            display: grid;
            gap: 7px;
            pointer-events: none;
        }
        .stp-memory-answers.is-visible {
            pointer-events: auto;
        }
        .stp-memory-choice {
            width: 100%;
            min-height: 43px;
            margin: 0;
            padding: 10px 12px;
            border: .5px solid rgba(255,255,255,.19);
            border-radius: 10px;
            background: rgba(5,5,5,.63);
            color: #eeeae3;
            text-align: left;
            font-size: 13px;
            font-weight: 410;
            line-height: 1.28;
            appearance: none;
            -webkit-appearance: none;
            touch-action: manipulation;
            transition: transform .12s ease, background .16s ease, border-color .16s ease;
        }
        .stp-memory-choice:active { transform: scale(.988); }
        .stp-memory-choice.is-selected {
            border-color: rgba(231,210,174,.48);
            background: rgba(40,31,24,.82);
        }
        .stp-memory-fade {
            position: absolute;
            inset: 0;
            z-index: 20;
            background: #050505;
            opacity: 0;
            pointer-events: none;
            transition: opacity .72s ease;
        }
        .stp-memory-fade.is-visible { opacity: 1; }
        .stp-memory-ending {
            position: absolute;
            inset: 0;
            z-index: 30;
            background: #090807;
            opacity: 0;
            visibility: hidden;
            transition: opacity .72s ease;
        }
        .stp-memory-ending.is-visible { opacity: 1; visibility: visible; }
        .stp-door-frame {
            position: absolute;
            left: 20%; top: 8%; width: 60%; height: 79%;
            border: 8px solid #171411;
        }
        .stp-door-light {
            position: absolute;
            left: 24%; top: 11%; bottom: 15%; width: 0;
            opacity: 0;
            background: linear-gradient(90deg, rgba(255,205,135,.10), rgba(255,229,188,.79));
            transition: width 1.7s ease, opacity .5s ease;
        }
        .stp-door-leaf {
            position: absolute;
            left: 23%; top: 11%; width: 54%; height: 73%;
            transform-origin: left center;
            transform: perspective(900px) rotateY(0deg);
            background: linear-gradient(90deg, #30241d, #51392a 58%, #291f19);
            box-shadow: 14px 0 35px rgba(0,0,0,.5);
            transition: transform 2.1s cubic-bezier(.22,.61,.36,1);
        }
        .stp-door-leaf::after {
            content: '';
            position: absolute;
            right: 8%; top: 52%; width: 15px; height: 15px;
            border-radius: 50%; background: #b29362;
        }
        .stp-memory-ending.is-open .stp-door-leaf { transform: perspective(900px) rotateY(-72deg); }
        .stp-memory-ending.is-open .stp-door-light { width: 49%; opacity: 1; }
        .stp-memory-present {
            position: absolute;
            inset: 0;
            display: grid;
            place-items: center;
            padding: 34px 24px;
            text-align: center;
            background: #080706;
            opacity: 0;
            visibility: hidden;
            transition: opacity .7s ease;
        }
        .stp-memory-present.is-visible { opacity: 1; visibility: visible; }
        .stp-memory-present-label {
            margin-bottom: 12px;
            color: rgba(238,226,205,.58);
            font-size: 10px;
            font-weight: 450;
            letter-spacing: .18em;
            text-transform: uppercase;
        }
        .stp-memory-present-line {
            max-width: 330px;
            margin: 0 auto;
            color: #f0ece5;
            font-size: 17px;
            font-weight: 430;
            line-height: 1.42;
        }
        .stp-memory-end-actions {
            display: flex;
            justify-content: center;
            gap: 9px;
            margin-top: 25px;
        }
        .stp-memory-end-button {
            padding: 9px 14px;
            border: .5px solid rgba(255,255,255,.19);
            border-radius: 999px;
            background: rgba(20,17,15,.82);
            color: #eae5dd;
            font-size: 12px;
            font-weight: 430;
        }
        @media (min-width: 600px) {
            #app.stp-souvenir-app {
                left: 50%;
                right: auto;
                width: min(520px, 100vw);
                transform: translateX(-50%);
            }
        }
    `;
    document.head.appendChild(style);
}

function visualMarkup(scene) {
    if (scene.image) {
        return `<div class="stp-memory-visual ${scene.className}"><img src="${scene.image}" alt="" draggable="false"></div>`;
    }
    return `<div class="stp-memory-visual ${scene.className}" aria-hidden="true"></div>`;
}

function sceneMarkup(scene) {
    return `
        ${visualMarkup(scene)}
        <div class="stp-memory-ui">
            <h1 class="stp-memory-question">${scene.question}</h1>
            <div class="stp-memory-answers">
                ${scene.answers.map((answer, index) => `
                    <button class="stp-memory-choice" type="button" data-answer="${index}">${answer}</button>
                `).join('')}
            </div>
        </div>
    `;
}

export function mountSouvenirExperience() {
    installStyles();
    document.documentElement.classList.add('stp-souvenir-mode');

    const app = document.getElementById('app');
    if (!app) throw new Error('Souvenir test: #app introuvable.');
    app.className = 'stp-souvenir-app';
    app.innerHTML = `
        <main class="stp-memory-stage" aria-label="Souvenir 1">
            <section class="stp-memory-scene" id="stp-memory-scene"></section>
            <div class="stp-memory-fade" id="stp-memory-fade"></div>
            <section class="stp-memory-ending" id="stp-memory-ending" aria-hidden="true">
                <div class="stp-door-light"></div>
                <div class="stp-door-frame"></div>
                <div class="stp-door-leaf"></div>
                <div class="stp-memory-present" id="stp-memory-present">
                    <div>
                        <div class="stp-memory-present-label">Retour au présent</div>
                        <p class="stp-memory-present-line">Maman<br>« Je t’ai laissé à manger. Tu te serviras quand t’auras faim. »</p>
                        <div class="stp-memory-end-actions">
                            <button type="button" class="stp-memory-end-button" id="stp-memory-replay">Rejouer</button>
                            <button type="button" class="stp-memory-end-button" id="stp-memory-exit">Retour au jeu</button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    `;

    const sceneRoot = document.getElementById('stp-memory-scene');
    const fade = document.getElementById('stp-memory-fade');
    const ending = document.getElementById('stp-memory-ending');
    const present = document.getElementById('stp-memory-present');
    const replay = document.getElementById('stp-memory-replay');
    const exit = document.getElementById('stp-memory-exit');

    let index = 0;
    let locked = false;
    let timers = [];

    const later = (fn, delay) => {
        const id = window.setTimeout(fn, delay);
        timers.push(id);
        return id;
    };
    const clearTimers = () => {
        timers.forEach(id => window.clearTimeout(id));
        timers = [];
    };

    function showScene(sceneIndex) {
        clearTimers();
        locked = false;
        index = sceneIndex;
        ending.className = 'stp-memory-ending';
        ending.setAttribute('aria-hidden', 'true');
        present.classList.remove('is-visible');
        fade.classList.add('is-visible');
        sceneRoot.innerHTML = sceneMarkup(SCENES[index]);

        const visual = sceneRoot.querySelector('.stp-memory-visual');
        const question = sceneRoot.querySelector('.stp-memory-question');
        const answers = sceneRoot.querySelector('.stp-memory-answers');
        const ui = sceneRoot.querySelector('.stp-memory-ui');

        requestAnimationFrame(() => {
            visual?.classList.add('is-live');
            fade.classList.remove('is-visible');
        });

        later(() => question?.classList.add('is-visible'), QUESTION_DELAY);
        later(() => answers?.classList.add('is-visible'), ANSWERS_DELAY);

        sceneRoot.querySelectorAll('.stp-memory-choice').forEach(button => {
            button.addEventListener('click', () => {
                if (locked) return;
                locked = true;
                button.classList.add('is-selected');
                later(() => ui?.classList.add('is-leaving'), 420);
                later(() => fade.classList.add('is-visible'), 820);
                later(() => {
                    if (index < SCENES.length - 1) showScene(index + 1);
                    else showEnding();
                }, 1580);
            }, { once: true });
        });
    }

    function showEnding() {
        clearTimers();
        locked = true;
        sceneRoot.innerHTML = '';
        ending.classList.add('is-visible');
        ending.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(() => fade.classList.remove('is-visible'));
        later(() => ending.classList.add('is-open'), 1050);
        later(() => present.classList.add('is-visible'), 3650);
    }

    replay.addEventListener('click', () => showScene(0));
    exit.addEventListener('click', () => {
        const url = new URL(window.location.href);
        url.searchParams.delete('souvenir');
        window.location.href = `${url.pathname}${url.search}${url.hash}`;
    });

    showScene(0);
}

export default mountSouvenirExperience;
