import { openLightbox } from './lightbox.js';
import { prewedding_photos } from './preweddingData.js';

const LIMITE_INICIAL = 6;   // quantas fotos aparecem no preview do index.html

export function initPreweddingGallery() {
    const grid = document.querySelector('.gallery__grid');
    if (!grid) return;

    grid.innerHTML = '';

    const visiveis = prewedding_photos.slice(0, LIMITE_INICIAL);

    visiveis.forEach((foto, index) => {
        const btn = document.createElement('button');
        btn.className = 'gallery__item reveal';
        btn.dataset.src = foto.url;
        btn.dataset.caption = foto.caption;
        btn.setAttribute('role', 'listitem');
        btn.setAttribute('aria-label', `Abrir foto ${index + 1} do ensaio`);

        btn.innerHTML = `
            <img src="${foto.thumb}" alt="${foto.alt}" loading="lazy" />
            <div class="gallery__item-overlay"><i class="fa-solid fa-magnifying-glass-plus"></i></div>
        `;

        btn.addEventListener('click', () => {
            openLightbox(visiveis, index, f => f.caption);
        });

        grid.appendChild(btn);
    });
}