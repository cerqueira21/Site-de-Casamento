import { $ } from './utils.js';

//PARALLAX SUAVE no hero
//============================================================ */
function initParallax() {
    const bg = $('#heroBg');
    if (!bg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            // Move o fundo a 40% da velocidade de scroll
            bg.style.transform = `translateY(${scrollY * 0.4}px)`;
            ticking = false;
        });
        ticking = true;
    }, { passive: true });
};

export { initParallax };