import { initCountdown } from './countdown.js';
import { initGiftPicker, initGiftsListPage } from './gifts.js';
import { initGallery } from './gallery.js';
import { initPreweddingGallery } from './preweddingGallery.js';
import { initLightbox } from './lightbox.js';
import { initNav } from './navbar.js';
import { initReveal } from './reveal.js';
import { initLazyLoad } from './lazyload.js';
import { initBackToTop } from './backToTop.js';
import { initMusic } from './music.js';


console.log('Scripts carregados com sucesso!');


document.addEventListener('DOMContentLoaded', () => {
    initLightbox(); 
    initCountdown();
    initGiftPicker();
    initGiftsListPage();
    initGallery();
    initPreweddingGallery();
    initNav();
    initReveal();
    initLazyLoad();
    initBackToTop();
    initMusic();
})