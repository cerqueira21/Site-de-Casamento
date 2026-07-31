


  /* ── Envio do formulário ─────────────── */
  uploadForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      showFeedback('upload', 'error', 'Selecione ao menos uma foto antes de enviar.');
      return;
    }

    const guestName = guestNameInput.value.trim() || 'Convidado(a)';

    uploadActions.hidden = true;
    uploadProgress.hidden = false;
    hideFeedback('upload');

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        /* Atualiza barra de progresso */
        const pct = Math.round(((i + 0.3) / selectedFiles.length) * 100);
        setProgress(pct, `Comprimindo imagem ${i + 1} de ${selectedFiles.length}…`);

        /* Comprime */
        const blob = await compressImage(file);

        /* Converte para base64 para armazenar no localStorage (demo) */
        const base64 = await blobToBase64(blob);

        setProgress(
          Math.round(((i + 0.9) / selectedFiles.length) * 100),
          `Enviando imagem ${i + 1} de ${selectedFiles.length}…`
        );

        /* ── PONTO DE INTEGRAÇÃO COM BACKEND ───────────────────────
           Em produção, substitua o bloco abaixo pelo upload real:

           // Firebase Storage:
           const storageRef = firebase.storage().ref(`events/${Date.now()}_${i}.jpg`);
           await storageRef.put(blob);
           const url = await storageRef.getDownloadURL();

           // Supabase Storage:
           const { data, error } = await supabase.storage
             .from('wedding-photos')
             .upload(`${Date.now()}_${i}.jpg`, blob, { contentType: 'image/jpeg' });

           // Salvar metadados no Firestore / Supabase DB:
           await db.collection('photos').add({ url, name: guestName, ts: Date.now() });
        ──────────────────────────────────────────────────────── */

        /* Demo offline: salva no localStorage */
        savePhotoLocally({ base64, name: guestName, ts: Date.now() });
      }

      setProgress(100, 'Tudo pronto! ✓');

      setTimeout(() => {
        uploadProgress.hidden = true;
        setProgress(0, '');
        uploadPreview.innerHTML = '';
        guestNameInput.value = '';
        selectedFiles = [];
        showFeedback('upload', 'success', `🎉 Obrigado, ${guestName}! Sua${selectedFiles.length !== 1 ? 's' : ''} foto${selectedFiles.length !== 1 ? 's' : ''} já aparece${selectedFiles.length !== 1 ? 'm' : ''} na galeria.`);
        renderCollabGrid();
      }, 800);

    } catch (err) {
      console.error('Upload error:', err);
      uploadProgress.hidden = true;
      uploadActions.hidden = false;
      showFeedback('upload', 'error', 'Ops! Ocorreu um erro ao enviar. Tente novamente.');
    }
  });

  btnCancel.addEventListener('click', () => {
    selectedFiles = [];
    uploadPreview.innerHTML = '';
    uploadActions.hidden = true;
    hideFeedback('upload');
  });

  /* ── localStorage helpers (demo) ─────── */
  const STORAGE_KEY = 'ir_wedding_photos';

  function savePhotoLocally(photoObj) {
    const all = getPhotosLocally();
    all.unshift(photoObj); // mais recente primeiro
    // Mantém no máximo 30 fotos para não estourar o localStorage
    const trimmed = all.slice(0, 30);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      /* localStorage cheio – remove a mais antiga e tenta de novo */
      trimmed.pop();
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)); } catch { }
    }
  }

  function getPhotosLocally() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function blobToBase64(blob) {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(blob);
    });
  }

  /* ── Renderiza o grid colaborativo ────── */
  function renderCollabGrid() {
    const photos = getPhotosLocally();

    /* Remove fotos antigas do grid (mantém o elemento #collabEmpty) */
    $$('.collab__photo', collabGrid).forEach(el => el.remove());

    if (photos.length === 0) {
      collabEmpty.style.display = '';
      return;
    }

    collabEmpty.style.display = 'none';

    photos.forEach(p => {
      const div = document.createElement('div');
      div.className = 'collab__photo';
      div.setAttribute('role', 'listitem');

      const img = document.createElement('img');
      img.src = p.base64;
      img.alt = `Foto enviada por ${p.name}`;
      img.loading = 'lazy';

      const info = document.createElement('div');
      info.className = 'collab__photo-info';
      const ts = new Date(p.ts);
      const hms = ts.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      info.innerHTML = `<strong>${escapeHTML(p.name)}</strong><br>${hms}`;

      div.appendChild(img);
      div.appendChild(info);
      collabGrid.appendChild(div);
    });
  }

  /* Utilitário contra XSS */
  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* Progresso */
  function setProgress(pct, text) {
    progressFill.style.width = pct + '%';
    progressText.textContent = text;
  }

  /* Feedback visual */
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
    el.style.display = '';
  }

  /* Renderiza ao iniciar (fotos já salvas de sessões anteriores) */
  renderCollabGrid();

/* ============================================================
  9. BACK TO TOP
   ============================================================ */
const backTop = $('#backTop');
if (backTop) {
  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================================
   10. SCROLL SUAVE para links âncora (fallback para browsers
       que não suportam CSS scroll-behavior)
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 70; // altura da nav fixa
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});


/* ============================================================
   NOTAS DE INTEGRAÇÃO – LEIA ANTES DE IR PARA PRODUÇÃO
   ============================================================

   ── FIREBASE (recomendado) ──────────────────────────────────
   1. Crie um projeto em https://console.firebase.google.com
   2. Habilite: Authentication (anônima), Firestore, Storage
   3. Adicione o SDK no <head> do index.html:
      <script src="https://www.gstatic.com/firebasejs/10.x.x/firebase-app-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/10.x.x/firebase-firestore-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/10.x.x/firebase-storage-compat.js"></script>
   4. Inicialize com suas credenciais:
      firebase.initializeApp({ apiKey: "...", authDomain: "...", ... });
      const db      = firebase.firestore();
      const storage = firebase.storage();
   5. No upload de fotos: use storage.ref().put(blob) → getDownloadURL()
   6. Salve a URL no Firestore: db.collection('photos').add({ url, name, ts })
   7. Ouça mudanças em tempo real:
      db.collection('photos').orderBy('ts','desc').onSnapshot(snap => renderGrid(snap))

   ── SUPABASE (alternativa open-source) ─────────────────────
   1. Crie projeto em https://supabase.com
   2. Crie tabela 'rsvp' e bucket 'wedding-photos'
   3. npm install @supabase/supabase-js ou use CDN
   4. const supabase = createClient(URL, ANON_KEY)
   5. Upload: supabase.storage.from('wedding-photos').upload(path, blob)
   6. Insert: supabase.from('rsvp').insert([data])

   ── QR CODE PARA AS MESAS ──────────────────────────────────
   Opção mais simples (sem instalar nada):
   1. Hospede o site (Netlify, Vercel ou GitHub Pages – gratuito)
   2. Acesse: https://qr.io ou https://www.qrcode-monkey.com
   3. Cole a URL do site hospedado
   4. Personalize com as cores do casamento
   5. Baixe em PDF ou PNG de alta resolução
   6. Imprima nas cartelas de mesa

   Ou gere via código com a lib qrcode.js:
   <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
   new QRCode(document.getElementById("qrcode"), "https://seu-site.com/#fotos-evento");

   ── HOSPEDAGEM GRATUITA ─────────────────────────────────────
   • Netlify: arraste a pasta do projeto em https://app.netlify.com/drop
   • Vercel:  npx vercel na pasta do projeto
   • GitHub Pages: push no branch gh-pages e ative nas configurações do repo

============================================================ */
