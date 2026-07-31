import { $ } from './utils.js';

//LAZY LOAD de imagens(fallback nativo já está no HTML)
// ============================================================ */
export function initLazyLoad() {
    if ('loading' in HTMLImageElement.prototype)
        return;

    const images = $$('img[loading="lazy"]');

    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const img = entry.target;

                img.src = img.dataset.src || img.src;

                observer.unobserve(img);
            });
        }
    );

    images.forEach(img =>
        observer.observe(img)
    );
}
