'use strict';

import { $, $$ } from './utils.js';
import { openLightbox } from './lightbox.js';

const API_URL = 'http://192.168.15.4:3000';

function initGallery() {

    let abaAtiva = 'convidado';
    const uploadArea = $('#uploadArea');
    const fileInput = $('#fileInput');
    const uploadForm = $('#uploadForm');
    const uploadPreview = $('#uploadPreview');
    const uploadActions = $('#uploadActions');
    const uploadProgress = $('#uploadProgress');
    const progressFill = $('#progressFill');
    const progressText = $('#progressText');
    const uploadFeedback = $('#uploadFeedback');
    const guestNameInput = $('#guestName');
    const collabGrid = $('#collabGrid');
    const btnCancel = $('#btnCancelUpload');

    if (!uploadArea) return;

    let selectedFiles = [];

    /* ── Seleção de arquivo (clique ou arrastar) ─────────────── */

    uploadArea.addEventListener('dragover', e => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', e => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
    });

    function handleFiles(fileList) {
        selectedFiles = Array.from(fileList);
        renderPreview();
    }

    function renderPreview() {
        uploadPreview.innerHTML = '';
        if (selectedFiles.length === 0) {
            uploadActions.hidden = true;
            return;
        }
        uploadActions.hidden = false;

        selectedFiles.forEach((file, index) => {
            const url = URL.createObjectURL(file);
            const item = document.createElement('div');
            item.className = 'upload__preview-item';
            item.innerHTML = `
                <img src="${url}" alt="Pré-visualização" />
                <button type="button" data-index="${index}" aria-label="Remover">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            item.querySelector('button').addEventListener('click', () => {
                selectedFiles.splice(index, 1);
                renderPreview();
            });
            uploadPreview.appendChild(item);
        });
    }

    /* ── Compressão simples de imagem antes de enviar ────────── */
    function compressImage(file, maxWidth = 1600, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = e => { img.src = e.target.result; };
            reader.onerror = reject;

            img.onload = () => {
                const scale = Math.min(1, maxWidth / img.width);
                const canvas = document.createElement('canvas');
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(
                    blob => resolve(blob),
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = reject;

            reader.readAsDataURL(file);
        });
    }

    /* ── Envio do formulário ─────────────── */
    uploadForm.addEventListener('submit', async e => {
        e.preventDefault();
        if (selectedFiles.length === 0) {
            showFeedback('upload', 'error', 'Selecione ao menos uma foto antes de enviar.');
            return;
        }

        const guestName = guestNameInput.value.trim() || 'Convidado(a)';
        const total = selectedFiles.length;

        uploadActions.hidden = true;
        uploadProgress.hidden = false;
        hideFeedback('upload');

        let enviadas = 0;

        try {
            for (let i = 0; i < total; i++) {
                const file = selectedFiles[i];

                setProgress(
                    Math.round(((i + 0.3) / total) * 100),
                    `Comprimindo imagem ${i + 1} de ${total}…`
                );

                const blob = await compressImage(file);

                setProgress(
                    Math.round(((i + 0.6) / total) * 100),
                    `Enviando imagem ${i + 1} de ${total}…`
                );

                const formData = new FormData();
                formData.append('foto', blob, `foto-${Date.now()}.jpg`);
                formData.append('guestName', guestName);

                const response = await fetch(`${API_URL}/fotos/upload`, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Erro ao enviar');
                }

                enviadas++;
                setProgress(Math.round(((i + 1) / total) * 100), `Enviado ${enviadas} de ${total}`);
            }

            setProgress(100, 'Tudo pronto! ✓');

            setTimeout(() => {
                uploadProgress.hidden = true;
                setProgress(0, '');
                uploadPreview.innerHTML = '';
                fileInput.value = '';
                guestNameInput.value = '';
                selectedFiles = [];
                showFeedback('upload', 'success', `🎉 Obrigado, ${guestName}! Sua(s) foto(s) já aparece(m) na galeria.`);
                window.filterPhotos('convidados');
            }, 600);

        } catch (err) {
            console.error('Upload error:', err);
            uploadProgress.hidden = true;
            uploadActions.hidden = false;
            showFeedback('upload', 'error', 'Ops! Ocorreu um erro ao enviar. Tente novamente.');
        }
    });

    btnCancel.addEventListener('click', () => {
        selectedFiles = [];
        fileInput.value = '';
        uploadPreview.innerHTML = '';
        uploadActions.hidden = true;
        hideFeedback('upload');
    });

    /* ── Carrega e renderiza a galeria (dados reais do backend) ── */
    async function carregarFotos(tipo) {
        try {
            const url = tipo ? `${API_URL}/fotos?tipo=${tipo}` : `${API_URL}/fotos`;
            const response = await fetch(url);
            const fotos = await response.json();
            renderCollabGrid(fotos, tipo);
        } catch (err) {
            console.error('Erro ao carregar fotos:', err);
        }
    }

    function renderCollabGrid(fotos, tipo) {
        const noivosEmpty = document.getElementById('noivosEmpty');
        const collabEmpty = document.getElementById('collabEmpty');

        $$('.collab__photo', collabGrid).forEach(el => el.remove());

        const semFotos = fotos.length === 0;

        if (noivosEmpty) noivosEmpty.hidden = !(tipo === 'noivo' && semFotos);
        if (collabEmpty) collabEmpty.hidden = !(tipo === 'convidado' && semFotos);

        if (semFotos) return;
        fotos.forEach((foto, index) => {
            const div = document.createElement('div');
            div.className = 'collab__photo';
            div.setAttribute('role', 'listitem');
            div.style.cursor = 'pointer';   // NOVO: indica que é clicável

            const img = document.createElement('img');
            img.src = foto.url;
            img.alt = `Foto enviada por ${foto.guest_name || 'convidado'}`;
            img.loading = 'lazy';

            const info = document.createElement('div');
            info.className = 'collab__photo-info';
            const ts = new Date(foto.created_at);
            const hms = ts.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            info.innerHTML = `<strong>${escapeHTML(foto.guest_name || 'Convidado(a)')}</strong><br>${hms}`;

            div.appendChild(img);
            div.appendChild(info);

            div.addEventListener('click', () => {
                openLightbox(fotos, index, foto => foto.guest_name ? `Enviado por ${foto.guest_name}` : '');
            });

            collabGrid.appendChild(div);
        });
    }

    /* ── Filtro noivos/convidados ─────────── */
    window.filterPhotos = function (tipo) {
        const btnGalleryNoivos = document.getElementById('filterNoivos');
        const btnGalleryConvidados = document.getElementById('filterConvidados');

        btnGalleryNoivos?.classList.toggle('active', tipo === 'noivos');
        btnGalleryConvidados?.classList.toggle('active', tipo === 'convidados');

        abaAtiva = tipo === 'noivos' ? 'noivo' : 'convidado';   // NOVO: guarda a aba atual
        carregarFotos(abaAtiva);
    };

    /* Utilitário contra XSS */
    function escapeHTML(str) {
        return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function setProgress(pct, text) {
        progressFill.style.width = pct + '%';
        progressText.textContent = text;
    }

    function showFeedback(scope, type, msg) {
        const el = scope === 'upload' ? uploadFeedback : null;
        if (!el) return;
        el.textContent = msg;
        el.className = `upload__feedback ${type}`;
    }
    function hideFeedback(scope) {
        const el = scope === 'upload' ? uploadFeedback : null;
        if (!el) return;
        el.className = 'upload__feedback';
        el.textContent = '';
    }

    /* Carrega fotos reais ao iniciar */
    carregarFotos(abaAtiva);
}

export { initGallery };