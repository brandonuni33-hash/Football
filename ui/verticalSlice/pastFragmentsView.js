function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

const VISUAL_COPY = Object.freeze({
    penalty: Object.freeze({ kicker: 'TIREUR', keeper: 'GB', cue: 'POINT DE PENALTY' }),
    celebration: Object.freeze({ kicker: 'TON POTE', keeper: '', cue: 'BUT QUALIFICATIF' }),
    'locker-room-judgment': Object.freeze({ kicker: 'VESTIAIRE', keeper: '', cue: 'APRÈS L’ENTRAÎNEMENT' }),
    'locker-room-praise': Object.freeze({ kicker: 'VESTIAIRE', keeper: '', cue: 'APRÈS TON MATCH' })
});

function visualTemplate(fragment) {
    const copy = VISUAL_COPY[fragment.visualKey] || VISUAL_COPY.penalty;
    return `
      <div class="stp-memory-image visual-${escapeHtml(fragment.visualKey)}" aria-hidden="true">
        <div class="stp-memory-haze"></div>
        <div class="stp-memory-scene">
          <span class="stp-memory-cue">${escapeHtml(copy.cue)}</span>
          <i class="stp-memory-ground"></i>
          <i class="stp-memory-subject">${escapeHtml(copy.kicker)}</i>
          ${copy.keeper ? `<i class="stp-memory-keeper">${escapeHtml(copy.keeper)}</i>` : ''}
          <i class="stp-memory-ball"></i>
        </div>
        <div class="stp-memory-vignette"></div>
        <div class="stp-memory-grain"></div>
      </div>`;
}

export function pastFragmentTemplate(fragment, index, total) {
    const answers = fragment.answers.map(answer => `
      <button type="button" class="stp-memory-answer" data-memory-answer="${escapeHtml(answer.id)}">
        <span>${escapeHtml(answer.text)}</span>
      </button>`).join('');

    return `
<section class="stp-memory-screen" data-stp-step="pastFragments" data-memory-id="${escapeHtml(fragment.id)}">
  ${visualTemplate(fragment)}
  <div class="stp-memory-content">
    <div class="stp-memory-meta"><span>${escapeHtml(fragment.memoryLabel)}</span><span>${index + 1} / ${total}</span></div>
    <p class="stp-memory-prompt">${escapeHtml(fragment.prompt)}</p>
    <h1>${escapeHtml(fragment.question)}</h1>
    <div class="stp-memory-answers" aria-label="Réponses au souvenir">${answers}</div>
  </div>
</section>`;
}

export const PAST_FRAGMENTS_CSS = `
html:has(.stp-memory-screen),body:has(.stp-memory-screen){background:#050403;overflow:hidden}.stp-memory-screen{position:relative;width:100%;min-height:100%;height:100dvh;overflow:hidden;background:#080604;color:#f4efe6;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.stp-memory-image{position:absolute;inset:0;background:#1a140d;overflow:hidden;filter:saturate(.62) contrast(1.04) sepia(.18)}.stp-memory-image:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,216,158,.14),rgba(74,45,21,.22) 44%,rgba(5,4,3,.9) 82%,#050403 100%)}.stp-memory-haze{position:absolute;inset:-10%;background:radial-gradient(circle at 22% 28%,rgba(255,223,170,.2),transparent 24%),radial-gradient(circle at 72% 38%,rgba(255,255,255,.08),transparent 28%),linear-gradient(115deg,transparent 30%,rgba(255,255,255,.035),transparent 58%);filter:blur(12px);opacity:.9}.stp-memory-vignette{position:absolute;inset:0;box-shadow:inset 0 0 110px rgba(0,0,0,.7);background:linear-gradient(180deg,rgba(0,0,0,.06),transparent 40%,rgba(0,0,0,.58) 78%,rgba(0,0,0,.92))}.stp-memory-grain{position:absolute;inset:0;opacity:.13;mix-blend-mode:soft-light;background-image:radial-gradient(circle at 20% 30%,#fff 0 .7px,transparent .8px),radial-gradient(circle at 70% 60%,#fff 0 .6px,transparent .7px);background-size:6px 7px,5px 6px}.stp-memory-scene{position:absolute;inset:10% 8% 30%;border:1px solid rgba(255,255,255,.04);border-radius:28px;overflow:hidden}.stp-memory-cue{position:absolute;left:18px;top:18px;font-size:10px;letter-spacing:.16em;font-weight:900;color:rgba(245,226,192,.5)}.stp-memory-ground{position:absolute;left:-10%;right:-10%;bottom:12%;height:38%;background:linear-gradient(180deg,rgba(68,74,53,.08),rgba(52,58,42,.24));transform:perspective(300px) rotateX(54deg);border-top:1px solid rgba(255,255,255,.07)}.stp-memory-subject,.stp-memory-keeper{position:absolute;font-style:normal;font-size:9px;font-weight:900;letter-spacing:.1em;color:rgba(255,245,226,.33);display:grid;place-items:center;width:64px;height:132px;border-radius:40% 40% 14px 14px;background:linear-gradient(180deg,rgba(20,18,16,.83),rgba(8,7,6,.92));box-shadow:0 16px 30px rgba(0,0,0,.3)}.stp-memory-subject{left:23%;bottom:16%}.stp-memory-keeper{right:14%;bottom:19%;height:116px;width:72px}.stp-memory-ball{position:absolute;width:17px;height:17px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#eee9df,#c8c0b2 60%,#6f695f 100%);left:46%;bottom:18%;box-shadow:0 5px 10px rgba(0,0,0,.35)}.visual-celebration .stp-memory-subject{left:45%;bottom:16%;transform:rotate(-7deg)}.visual-celebration .stp-memory-subject:before,.visual-celebration .stp-memory-subject:after{content:"";position:absolute;width:55px;height:105px;border-radius:36% 36% 14px 14px;background:rgba(10,9,8,.75);bottom:0}.visual-celebration .stp-memory-subject:before{left:-72px;transform:rotate(-10deg)}.visual-celebration .stp-memory-subject:after{right:-72px;transform:rotate(10deg)}.visual-locker-room-judgment .stp-memory-scene,.visual-locker-room-praise .stp-memory-scene{background:linear-gradient(180deg,rgba(36,31,25,.35),rgba(11,9,8,.68));border-radius:12px}.visual-locker-room-judgment .stp-memory-ground,.visual-locker-room-praise .stp-memory-ground{height:22%;transform:none;background:rgba(45,34,26,.28)}.visual-locker-room-judgment .stp-memory-subject,.visual-locker-room-praise .stp-memory-subject{left:50%;transform:translateX(-50%);bottom:18%;height:126px}.visual-locker-room-judgment .stp-memory-subject:before,.visual-locker-room-judgment .stp-memory-subject:after,.visual-locker-room-praise .stp-memory-subject:before,.visual-locker-room-praise .stp-memory-subject:after{content:"";position:absolute;width:54px;height:112px;bottom:0;border-radius:38% 38% 12px 12px;background:rgba(8,7,6,.65)}.visual-locker-room-judgment .stp-memory-subject:before,.visual-locker-room-praise .stp-memory-subject:before{left:-82px}.visual-locker-room-judgment .stp-memory-subject:after,.visual-locker-room-praise .stp-memory-subject:after{right:-82px}.visual-locker-room-judgment .stp-memory-ball,.visual-locker-room-praise .stp-memory-ball{display:none}.stp-memory-content{position:absolute;z-index:5;left:0;right:0;bottom:0;padding:0 22px calc(22px + env(safe-area-inset-bottom,0));background:linear-gradient(180deg,transparent,#080604 15%,#080604 100%)}.stp-memory-meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;color:#c49b64;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.stp-memory-prompt{margin:0 0 8px;color:rgba(230,219,201,.58);font-size:12px}.stp-memory-content h1{margin:0;max-width:365px;font-size:27px;line-height:1.08;letter-spacing:-.035em}.stp-memory-answers{display:grid;gap:9px;margin-top:17px}.stp-memory-answer{appearance:none;width:100%;min-height:50px;border-radius:15px;border:1px solid rgba(240,222,191,.11);background:rgba(19,15,11,.8);color:#eee7dc;text-align:left;padding:12px 14px;font:inherit;font-size:13px;line-height:1.3;backdrop-filter:blur(8px);transition:border-color .18s ease,background .18s ease,transform .12s ease,opacity .2s ease}.stp-memory-answer:active{transform:scale(.987)}.stp-memory-answer.selected{border-color:rgba(210,159,88,.75);background:rgba(54,38,20,.9)}.stp-memory-screen{animation:stp-memory-in .55s ease both}.stp-memory-screen.is-leaving{animation:stp-memory-out .32s ease both}.stp-memory-prompt,.stp-memory-content h1,.stp-memory-answers{opacity:0;transform:translateY(8px);animation:stp-memory-copy .42s ease forwards}.stp-memory-prompt{animation-delay:.22s}.stp-memory-content h1{animation-delay:.35s}.stp-memory-answers{animation-delay:.5s}@keyframes stp-memory-in{from{opacity:0}to{opacity:1}}@keyframes stp-memory-out{to{opacity:0;transform:scale(1.01)}}@keyframes stp-memory-copy{to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){.stp-memory-screen,.stp-memory-screen.is-leaving,.stp-memory-prompt,.stp-memory-content h1,.stp-memory-answers{animation:none;opacity:1;transform:none}.stp-memory-answer{transition:none}}
`;

export function mountPastFragments(container, fragments, { onAnswer, onComplete } = {}) {
    if (!container) throw new Error('Conteneur souvenirs requis.');
    if (!Array.isArray(fragments) || fragments.length === 0) throw new Error('Souvenirs requis.');

    let index = 0;
    const answers = [];
    let locked = false;

    const render = () => {
        locked = false;
        const fragment = fragments[index];
        container.innerHTML = pastFragmentTemplate(fragment, index, fragments.length);
        container.querySelectorAll('[data-memory-answer]').forEach(button => button.addEventListener('click', () => {
            if (locked) return;
            locked = true;
            button.classList.add('selected');
            const answerId = button.dataset.memoryAnswer;
            answers.push(Object.freeze({ fragmentId: fragment.id, answerId }));
            onAnswer?.({ fragment, answerId, index });

            const screen = container.querySelector('.stp-memory-screen');
            const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
            const advance = () => {
                index += 1;
                if (index >= fragments.length) {
                    onComplete?.(Object.freeze([...answers]));
                    return;
                }
                render();
            };
            if (reduced) return advance();
            screen?.classList.add('is-leaving');
            setTimeout(advance, 300);
        }));
    };

    render();
    return Object.freeze({
        getIndex: () => index,
        getAnswers: () => Object.freeze([...answers])
    });
}
