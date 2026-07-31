'use strict';

import { openLightbox, initLightbox } from './lightbox.js';
import { prewedding_photos } from './preweddingData.js';

const API_URL = 'http://192.168.15.4:3000';

document.getElementById('btnVoltar')?.addEventListener('click', () => {
    window.location.href = './index.html#galeria';
});

/* ── Troca de abas ─────────────────────────── */
const tabs = document.querySelectorAll('.galerias-tab');
const paineis = {
    'pre-wedding': document.getElementById('panelPreWedding'),
    'noivos': document.getElementById('panelNoivos'),
    'convidados': document.getElementById('panelConvidados'),
};

function ativarTab(tab) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    Object.entries(paineis).forEach(([key, el]) => {
        if (el) el.hidden = key !== tab;
    });

    if (tab === 'noivos') carregarGaleriaDinamica('noivo', 'noivosGrid', 'noivosEmptyMsg');
    if (tab === 'convidados') carregarGaleriaDinamica('convidado', 'convidadosGrid', 'convidadosEmptyMsg');
}

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        ativarTab(tab.dataset.tab);
        /* Atualiza a URL sem recarregar a página, pra manter o link compartilhável */
        const url = new URL(window.location);
        url.searchParams.set('tab', tab.dataset.tab);
        window.history.replaceState({}, '', url);
    });
});

/* ── Pré-wedding: renderiza a partir do array centralizado ─── */
function renderPreWedding() {
    const grid = document.getElementById('preWeddingGrid');
    if (!grid) return;

    grid.innerHTML = '';

    prewedding_photos.forEach((foto, index) => {
        const btn = document.createElement('button');
        btn.className = 'galerias-item';
        btn.innerHTML = `<img src="${foto.thumb}" alt="${foto.alt}" loading="lazy" />`;
        btn.addEventListener('click', () => {
            openLightbox(prewedding_photos, index, f => f.caption);
        });
        grid.appendChild(btn);
    });
}

/* ── Noivos / Convidados: busca do backend ────── */
async function carregarGaleriaDinamica(tipo, gridId, emptyMsgId) {
    const grid = document.getElementById(gridId);
    const emptyMsg = document.getElementById(emptyMsgId);

    // Evita buscar de novo se já carregou uma vez
    if (grid.dataset.carregado === 'true') return;

    try {
        const response = await fetch(`${API_URL}/fotos?tipo=${tipo}`);
        const fotos = await response.json();

        grid.innerHTML = '';

        if (fotos.length === 0) {
            emptyMsg.hidden = false;
            grid.dataset.carregado = 'true';
            return;
        }
        emptyMsg.hidden = true;

        fotos.forEach((foto, index) => {
            const btn = document.createElement('button');
            btn.className = 'galerias-item';
            btn.innerHTML = `<img src="${foto.url}" alt="Foto enviada por ${escapeHTML(foto.guest_name || 'convidado')}" loading="lazy" />`;
            btn.addEventListener('click', () => {
                openLightbox(fotos, index, f => f.guest_name ? `Enviado por ${f.guest_name}` : '');
            });
            grid.appendChild(btn);
        });

        grid.dataset.carregado = 'true';
    } catch (err) {
        console.error(`Erro ao carregar galeria de ${tipo}:`, err);
    }
}

function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

/* ── Inicialização ────────────────────────────── */
initLightbox();
renderPreWedding();

const params = new URLSearchParams(window.location.search);
const tabInicial = params.get('tab') || 'pre-wedding';
ativarTab(tabInicial);