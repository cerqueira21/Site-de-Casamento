import { $ } from './utils.js';

export function initBackToTop() {
    const backTop = $('#backTop');

    if (!backTop) return;

    const toggleButton = () => {
        backTop.hidden = window.scrollY < 400;
    };

    window.addEventListener(
        'scroll',
        toggleButton
    );

    toggleButton();

    backTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}