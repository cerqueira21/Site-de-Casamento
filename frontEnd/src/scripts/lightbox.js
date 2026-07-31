import { $ } from './utils.js';

let currentItems = [];
let currentIndex = 0;
let getCaption = () => '';

function show() {
    const item = currentItems[currentIndex];
    const img = $('#lightboxImg');
    const caption = $('#lightboxCaption');
    if (img) img.src = typeof item === 'string' ? item : item.url;
    if (caption) caption.textContent = getCaption(item);
}

export function openLightbox(items, startIndex, captionFn = () => '') {
    currentItems = items;
    currentIndex = startIndex;
    getCaption = captionFn;
    show();
    $('#lightbox').hidden = false;
    $('#lightboxBackdrop').hidden = false;
    document.body.style.overflow = 'hidden';
}

function close() {
    $('#lightbox').hidden = true;
    $('#lightboxBackdrop').hidden = true;
    document.body.style.overflow = '';
}

export function initLightbox() {
    $('#lightboxClose')?.addEventListener('click', close);
    $('#lightboxBackdrop')?.addEventListener('click', close);
    $('#lightboxPrev')?.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + currentItems.length) % currentItems.length;
        show();
    });
    $('#lightboxNext')?.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % currentItems.length;
        show();
    });
    document.addEventListener('keydown', e => {
        if ($('#lightbox').hidden) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') { currentIndex = (currentIndex - 1 + currentItems.length) % currentItems.length; show(); }
        if (e.key === 'ArrowRight') { currentIndex = (currentIndex + 1) % currentItems.length; show(); }
    });
}