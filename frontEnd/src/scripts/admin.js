

const API_URL = 'http://192.168.15.4:3000';
const TOKEN_KEY = 'ir_admin_token';

const loginPanel = document.getElementById('loginPanel');
const adminContent = document.getElementById('adminContent');
const loginError = document.getElementById('loginError');
const passwordInput = document.getElementById('passwordInput');

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}
function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}
function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path, options = {}) {
    const token = getToken();
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
        },
    });
    if (response.status === 401) {
        clearToken();
        showLogin();
        throw new Error('Sessão expirada.');
    }
    return response;
}

function showLogin() {
    loginPanel.hidden = false;
    adminContent.hidden = true;
}
function showAdmin() {
    loginPanel.hidden = true;
    adminContent.hidden = false;
    loadGifts();
}

document.getElementById('btnLogin').addEventListener('click', doLogin);
passwordInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
});

async function doLogin() {
    loginError.textContent = '';
    const password = passwordInput.value;

    try {
        const response = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });
        const data = await response.json();

        if (!response.ok) {
            loginError.textContent = data.error || 'Erro ao entrar.';
            return;
        }

        setToken(data.token);
        passwordInput.value = '';
        showAdmin();
    } catch (err) {
        loginError.textContent = 'Erro de conexão com o servidor.';
    }
}

document.getElementById('btnLogout').addEventListener('click', () => {
    clearToken();
    showLogin();
});

/* ---- Tabs ---- */
document.querySelectorAll('[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('[data-tab]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        document.getElementById('panelGifts').hidden = tab.dataset.tab !== 'gifts';
        document.getElementById('panelPhotos').hidden = tab.dataset.tab !== 'photos';
        document.getElementById('panelUpload').hidden = tab.dataset.tab !== 'upload';

        if (tab.dataset.tab === 'gifts') loadGifts();
        if (tab.dataset.tab === 'photos') loadPhotos();
    });
});

/* ---- Filtro de fotos (Todas/Noivos/Convidados) ---- */
document.querySelectorAll('[data-filtro-foto]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filtro-foto]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadPhotos(btn.dataset.filtroFoto);
    });
});

/* ---- Presentes ---- */
async function loadGifts() {
    try {
        const response = await apiFetch('/admin/gifts');
        const gifts = await response.json();

        const tbody = document.getElementById('giftsTableBody');
        const empty = document.getElementById('giftsEmpty');
        tbody.innerHTML = '';

        if (gifts.length === 0) {
            empty.hidden = false;
            return;
        }
        empty.hidden = true;

        gifts.forEach(g => {
            const tr = document.createElement('tr');
            const dataFormatada = new Date(g.created_at).toLocaleString('pt-BR');
            const presentes = Array.isArray(g.gift_id) ? g.gift_id.join(', ') : g.gift_id;

            tr.innerHTML = `
            <td>${escapeHTML(presentes)}</td>
            <td>R$ ${Number(g.amount).toFixed(2)}</td>
            <td>${escapeHTML(g.guest_name || '—')}</td>
            <td>${escapeHTML(g.guest_message || '—')}</td>
            <td>${dataFormatada}</td>
          `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
    }
}

/* ---- Fotos ---- */
let fotoAtualId = null;

async function loadPhotos(tipo = 'all') {
    try {
        const path = tipo === 'all' ? '/admin/photos' : `/admin/photos?tipo=${tipo}`;
        const response = await apiFetch(path);
        const photos = await response.json();

        const grid = document.getElementById('photosGrid');
        const empty = document.getElementById('photosEmpty');
        grid.innerHTML = '';

        if (photos.length === 0) {
            empty.hidden = false;
            return;
        }
        empty.hidden = true;

        photos.forEach(photo => {
            const div = document.createElement('div');
            div.className = 'admin__photo-item';
            div.style.cursor = 'pointer';
            div.innerHTML = `
        <img src="${photo.url}" alt="Foto" loading="lazy" />
        <span class="admin__photo-tag">${photo.uploaded_by === 'noivo' ? 'Noivos' : escapeHTML(photo.guest_name || 'Convidado')}</span>
        <button class="admin__photo-delete" data-id="${photo.id}"><i class="fa-solid fa-trash"></i></button>
      `;

            // Clique na imagem abre o lightbox (não conflita com o botão de excluir do card)
            div.querySelector('img').addEventListener('click', () => abrirLightbox(photo.url, photo.id));

            div.querySelector('.admin__photo-delete').addEventListener('click', e => {
                e.stopPropagation();
                excluirFoto(photo.id);
            });

            grid.appendChild(div);
        });
    } catch (err) {
        console.error(err);
    }
}

function abrirLightbox(url, id) {
    fotoAtualId = id;
    document.getElementById('adminLightboxImg').src = url;
    document.getElementById('adminLightbox').style.display = 'flex';
}

function fecharLightbox() {
    document.getElementById('adminLightbox').style.display = 'none';
    fotoAtualId = null;
}

document.getElementById('adminLightboxClose').addEventListener('click', fecharLightbox);
document.getElementById('adminLightbox').addEventListener('click', e => {
    if (e.target.id === 'adminLightbox') fecharLightbox();
});
document.getElementById('adminLightboxDelete').addEventListener('click', async () => {
    if (!fotoAtualId) return;
    await excluirFoto(fotoAtualId);
    fecharLightbox();
});

async function excluirFoto(id) {
    if (!confirm('Tem certeza que deseja excluir essa foto?')) return;

    try {
        const response = await apiFetch(`/admin/photos/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadPhotos();
        }
    } catch (err) {
        console.error(err);
    }
}

/* ---- Upload noivos ---- */
document.getElementById('uploadNoivoForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fileInput = document.getElementById('noivoFileInput');
    const feedback = document.getElementById('uploadNoivoFeedback');

    if (!fileInput.files[0]) return;

    feedback.textContent = 'Enviando...';
    feedback.className = 'admin__feedback';

    try {
        const formData = new FormData();
        formData.append('foto', fileInput.files[0]);

        const response = await apiFetch('/admin/photos/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Erro ao enviar.');
        }

        feedback.textContent = 'Foto enviada com sucesso! 🎉';
        feedback.className = 'admin__feedback success';
        fileInput.value = '';
    } catch (err) {
        feedback.textContent = err.message;
        feedback.className = 'admin__feedback error';
    }
});

function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

/* ---- Inicialização ---- */
if (getToken()) {
    showAdmin();
} else {
    showLogin();
}