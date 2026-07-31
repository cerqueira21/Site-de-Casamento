import { $, $$ } from './utils.js';

function initNav() {
    const nav = $('#nav');
    const toggle = $('#navToggle');
    const links = $('#navLinks');
    const allLinks = $$('a', links);

    /* Adiciona classe .scrolled ao rolar */
    const onScroll = () => {
        nav.classList.toggle('scrolled', window.scrollY > 60);
        backTop.hidden = window.scrollY < 400;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Abre/fecha menu mobile */
    toggle.addEventListener('click', () => {
        const open = links.classList.toggle('open');
        toggle.classList.toggle('active', open);
        toggle.setAttribute('aria-expanded', open);
        document.body.style.overflow = open ? 'hidden' : '';
    });

    /* Fecha menu ao clicar em um link */
    allLinks.forEach(a => {
        a.addEventListener('click', () => {
            links.classList.remove('open');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', false);
            document.body.style.overflow = '';
        });
    });

    /* Fecha menu ao clicar fora */
    document.addEventListener('click', e => {
        if (!nav.contains(e.target)) {
            links.classList.remove('open');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', false);
            document.body.style.overflow = '';
        }
    });
}

export { initNav };