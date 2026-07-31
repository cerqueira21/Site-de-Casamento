import { $ } from './utils.js';

//MÚSICA DE FUNDO – toggle com persistência
// ============================================================ */
function initMusic() {
    const btn = $('#musicBtn');
    const audio = $('#bgMusic');
    const icon = $('#musicIcon');

    if (!btn || !audio) return;

    let playing = false;

    /* Tenta restaurar preferência do usuário */
    const saved = localStorage.getItem('ir_music');
    // Não inicia automaticamente — aguarda interação do usuário (política do navegador)

    function play() {
        audio.volume = 0.35;
        audio.play().catch(() => { }); // alguns navegadores bloqueiam autoplay
        playing = true;
        btn.classList.add('playing');
        icon.className = 'fa-solid fa-pause';
        btn.setAttribute('aria-label', 'Pausar música de fundo');
        localStorage.setItem('ir_music', 'playing');
    }

    function pause() {
        audio.pause();
        playing = false;
        btn.classList.remove('playing');
        icon.className = 'fa-solid fa-music';
        btn.setAttribute('aria-label', 'Ativar música de fundo');
        localStorage.setItem('ir_music', 'paused');
    }

    btn.addEventListener('click', () => { playing ? pause() : play(); });

    /* Fade in/out suave ao pausar/retomar */
    audio.addEventListener('play', () => fadeVolume(audio, 0, 0.35, 1500));
    audio.addEventListener('pause', () => { });
};

function fadeVolume(audio, from, to, duration) {
    const steps = 30;
    const interval = duration / steps;
    const delta = (to - from) / steps;
    audio.volume = from;
    let step = 0;
    const id = setInterval(() => {
        step++;
        audio.volume = Math.min(1, Math.max(0, audio.volume + delta));
        if (step >= steps) clearInterval(id);
    }, interval);
}

export { fadeVolume };
export { initMusic };