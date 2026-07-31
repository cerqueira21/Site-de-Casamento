import { $, $$ } from './utils.js';

//REVEAL ao scroll (IntersectionObserver)
//============================================================ */
function initReveal() {
    const elements = document.querySelectorAll('.reveal');

    // Se o navegador não suporta IntersectionObserver, mostra tudo direto
    if (!('IntersectionObserver' in window)) {
        elements.forEach(el => el.classList.add('visible'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // para de observar após aparecer
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));

    
    if (!('IntersectionObserver' in window)) {
        /* Fallback: mostra tudo */
        $$('.reveal').forEach(el => el.classList.add('visible'));
        return;
    }

    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    $$('.reveal').forEach(el => obs.observe(el));
};

export { initReveal };