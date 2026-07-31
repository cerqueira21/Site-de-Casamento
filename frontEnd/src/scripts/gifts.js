import { gifts_data } from './giftsData.js';

/* ============================================================
    Botão "Voltar" (usado só na gifts.html)
============================================================ */
const btnVoltarPresente = document.getElementById('btnVoltar');
if (btnVoltarPresente) {
    btnVoltarPresente.addEventListener('click', () => {
        window.location.href = './index.html#presentes';
    });
}

/* Categorias com nome amigável para exibir nos cards */
const CATEGORY_LABELS = {
    'lua-de-mel': 'Lua de Mel',
    'jantar': 'Jantar Romântico',
    'casa': 'Itens para Casa',
    'eletro': 'Eletrodomésticos',
    'experiencias': 'Experiências',
    'divertidos': 'Presentes divertidos'
};

/* ── Configurações — edite aqui ── */
const CONFIG = {
    pixKey: 'liandra@gmail.com',
    whatsapp: '5511999999999',
    mercadoPagoUrl: 'link.mercadopago.com.br/presentecasamentoli',
    apiUrl: 'http://localhost:3000',
};

/* ============================================================
    FUNÇÕES UTILITÁRIAS (compartilhadas pelas duas páginas)
============================================================ */

/* Formata número para Real brasileiro: 1500 → "R$ 1.500" */
function formatBRL(value) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}

/* Evita problemas de segurança ao inserir texto no HTML */
function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

/* Copia uma chave Pix para a área de transferência */
async function copyToClipboard(text, btn, originalHTML) {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado!';
    setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
}

/* Mostra uma mensagem rápida no canto da tela */
let toastTimeout;
function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${message}`;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
}


/* ============================================================
    BLOCO 1 — Painel de presente embutido na index.html
    (seção "presentes" com preview + botão "Ver mais")
============================================================ */
function initGiftPicker() {
    const grid = document.getElementById('giftsGrid');
    const payment = document.getElementById('giftsPayment');

    if (!grid || !payment) return;

    console.log('initGiftPicker carregou');

    const pixInfo = document.getElementById('pixInfo');
    const cardInfo = document.getElementById('cardInfo');
    const amountInput = document.getElementById('giftAmount');
    const ctaText = document.getElementById('giftCtaText');
    const ctaBtn = document.getElementById('giftCta');
    const btnVerMais = document.getElementById('btnVerMais');
    const successPanel = document.getElementById('giftsSuccess');

    let currentMethod = 'pix';
    let selectedGiftId = null;
    let pollingInterval = null;

    async function aplicarDisponibilidade() {
        try {
            const response = await fetch(`${CONFIG.apiUrl}/gifts/disponibilidade`);
            const disponibilidade = await response.json();

            grid.querySelectorAll('.gift-card').forEach(card => {
                const id = card.dataset.id;
                const info = disponibilidade[id];

                if (info && !info.available) {
                    card.disabled = true;
                    card.classList.add('gift-card--funded');
                    const msgEl = card.querySelector('.gift-card__msg');
                    if (msgEl) msgEl.textContent = 'Já presenteado ✓';
                }
            });
        } catch (err) {
            console.error('Erro ao verificar disponibilidade:', err);
        }
    }

    aplicarDisponibilidade();

    if (btnVerMais) {
        btnVerMais.addEventListener('click', () => {
            window.location.href = './gifts.html';
        });
    }

    /* Selecionar presente */
    grid.querySelectorAll('.gift-card:not([disabled])').forEach(card => {
        card.addEventListener('click', () => {
            grid.querySelectorAll('.gift-card--selected')
                .forEach(c => c.classList.remove('gift-card--selected'));
            card.classList.add('gift-card--selected');

            selectedGiftId = card.dataset.id;
            const price = parseInt(card.dataset.price, 10);
            if (amountInput) amountInput.value = price;

            resetPaymentPanel();
            showPayment();
        });
    });

    const closeBtn = document.getElementById('paymentCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeModalGifts);

    function closeModalGifts() {
        payment.hidden = true;
        document.body.style.overflow = '';
        stopPolling();
    }

    function showPayment() {
        payment.hidden = false;
    }

    function resetPaymentPanel() {
        stopPolling();
        document.getElementById('pixQrWrap').hidden = true;
        ctaBtn.disabled = false;
        updateMethodUI();
    }

    /* Formas de pagamento */
    document.querySelectorAll('#giftsPayment .payment__method').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#giftsPayment .payment__method')
                .forEach(b => b.classList.remove('payment__method--active'));
            btn.classList.add('payment__method--active');
            currentMethod = btn.dataset.method;
            resetPaymentPanel();
        });
    });

    function updateMethodUI() {
        const isPix = currentMethod === 'pix';
        if (pixInfo) pixInfo.hidden = false;
        if (cardInfo) cardInfo.hidden = isPix;
        document.getElementById('pixQrWrap').hidden = true;
        if (ctaText) {
            ctaText.textContent = isPix
                ? 'Gerar QR Code e presentear'
                : 'Ir para pagamento seguro';
        }
    }

    /* Clique no botão principal (CTA) */
    ctaBtn.addEventListener('click', async () => {
        if (!selectedGiftId) return;

        const guestName = document.getElementById('giftGuestName')?.value || '';
        const guestMessage = document.getElementById('giftGuestMessage')?.value || '';

        ctaBtn.disabled = true;
        const textoOriginal = ctaText.textContent;
        ctaText.textContent = 'Gerando pagamento...';

        try {
            if (currentMethod === 'pix') {
                await gerarPix(selectedGiftId, guestName, guestMessage);
            } else {
                await gerarCheckoutCartao(selectedGiftId, guestName, guestMessage);
            }
        } catch (err) {
            console.error(err);
            showToast('Erro ao gerar pagamento. Tenta de novo.');
            ctaBtn.disabled = false;
            ctaText.textContent = textoOriginal;
        }
    });

    async function gerarPix(giftId, guestName, guestMessage) {
        const response = await fetch(`${CONFIG.apiUrl}/pagamentos/criar-pix`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ giftIds: [giftId], guestName, guestMessage }),
        });
        const data = await response.json();

        if (!response.ok) {
            showToast(data.error || 'Não foi possível gerar o Pix.');
            ctaBtn.disabled = false;
            ctaText.textContent = 'Gerar QR Code e presentear';
            return;
        }

        document.getElementById('pixQrImage').src = `data:image/png;base64,${data.qr_code_base64}`;
        document.getElementById('pixCodigoValue').textContent = data.qr_code;
        document.getElementById('pixQrWrap').hidden = false;
        ctaBtn.style.display = 'none';

        const copyBtn = document.getElementById('pixCopyBtn');
        copyBtn.onclick = () => copyToClipboard(data.qr_code, copyBtn, '<i class="fa-regular fa-copy"></i> Copiar');

        iniciarPolling(data.paymentRecordId);
    }

    async function gerarCheckoutCartao(giftId, guestName, guestMessage) {
        const response = await fetch(`${CONFIG.apiUrl}/pagamentos/criar-preferencia`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ giftIds: [giftId], guestName, guestMessage }),
        });
        const data = await response.json();

        if (!response.ok) {
            showToast(data.error || 'Não foi possível gerar o pagamento.');
            ctaBtn.disabled = false;
            ctaText.textContent = 'Ir para pagamento seguro';
            return;
        }

        window.location.href = data.init_point;
    }

    function iniciarPolling(paymentRecordId) {
        document.getElementById('pixStatusMsg').textContent = 'Aguardando pagamento...';
        pollingInterval = setInterval(async () => {
            try {
                const response = await fetch(`${CONFIG.apiUrl}/pagamentos/status/${paymentRecordId}`);
                const data = await response.json();

                if (data.status === 'approved') {
                    stopPolling();
                    payment.hidden = true;
                    successPanel.hidden = false;
                    showToast('Pagamento confirmado! Muito obrigado 💛');
                }
            } catch (err) {
                console.error('Erro ao consultar status:', err);
            }
        }, 3000);
    }

    function stopPolling() {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    }
}

/* ============================================================
   BLOCO 2 — Lista completa de presentes (gifts.html)
============================================================ */
function initGiftsListPage() {
    const grid = document.getElementById('giftsGrid');
    const cartFab = document.getElementById('cartFab');

    // Só continua se estivermos na página da lista completa
    if (!grid || !cartFab) return;

    console.log('initGiftsListPage carregou');

    /* Estado dos filtros e do carrinho */
    const state = {
        search: '',
        sort: 'popular',
        priceRange: 'all',   // 'all' | '0-100' | '100-500' | '500-1000' | '1000-99999' | 'custom'
        customMin: null,
        customMax: null,
        category: 'all',
        cart: [],
        disponibilidade: {},
    };

    async function carregarDisponibilidade() {
        try {
            const response = await fetch(`${CONFIG.apiUrl}/gifts/disponibilidade`);
            state.disponibilidade = await response.json();
        } catch (err) {
            console.error('Erro ao verificar disponibilidade:', err);
            state.disponibilidade = {};
        }
        renderGifts();
    }

    let checkoutMethod = 'pix';
    let checkoutPollingInterval = null;

    /* Carrega/salva o carrinho no navegador */
    function loadCart() {
        try {
            const saved = localStorage.getItem('ir_gift_cart');
            state.cart = saved ? JSON.parse(saved) : [];
        } catch {
            state.cart = [];
        }
    }
    function saveCart() {
        localStorage.setItem('ir_gift_cart', JSON.stringify(state.cart));
    }

    /* ---------- Filtros ---------- */
    function getFilteredGifts() {
        let result = [...gifts_data];

        if (state.search.trim()) {
            const term = state.search.trim().toLowerCase();
            result = result.filter(g =>
                g.name.toLowerCase().includes(term) ||
                g.description.toLowerCase().includes(term)
            );
        }

        if (state.category !== 'all') {
            result = result.filter(g => g.category === state.category);
        }

        if (state.priceRange === 'custom') {
            const min = state.customMin ?? 0;
            const max = state.customMax ?? Infinity;
            result = result.filter(g => g.price >= min && g.price <= max);
        } else if (state.priceRange !== 'all') {
            const [min, max] = state.priceRange.split('-').map(Number);
            result = result.filter(g => g.price >= min && g.price <= max);
        }

        switch (state.sort) {
            case 'price-asc':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'recent':
                result.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
                break;
            case 'popular':
            default:
                result.sort((a, b) => b.popularity - a.popularity);
                break;
        }

        return result;
    }

    /* ---------- Renderização da lista ---------- */
    function renderGifts() {
        const emptyState = document.getElementById('emptyState');
        const countLabel = document.getElementById('resultsCount');

        const gifts = getFilteredGifts();

        countLabel.textContent = gifts.length === 1
            ? '1 presente encontrado'
            : `${gifts.length} presentes encontrados`;

        if (gifts.length === 0) {
            grid.innerHTML = '';
            emptyState.hidden = false;
            return;
        }
        emptyState.hidden = true;

        grid.innerHTML = gifts.map(gift => buildGiftCardHTML(gift)).join('');

        grid.querySelectorAll('.gift-card__add').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const gift = gifts_data.find(g => g.id === id);
                addToCart(gift);

                btn.classList.add('added');
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Adicionado';
                setTimeout(() => {
                    btn.classList.remove('added');
                    btn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Adicionar ao carrinho';
                }, 1200);

                showToast(`"${gift.name}" adicionado ao carrinho`);
            });
        });
    }

    function buildGiftCardHTML(gift) {
        const info = state.disponibilidade[gift.id];
        const isFunded = info ? !info.available : false;
        const categoryLabel = CATEGORY_LABELS[gift.category] || gift.category;
        const priceFormatted = formatBRL(gift.price);

        return `
    <article class="gift-card" role="listitem">
      <div class="gift-card__img-wrap">
        <img src="${gift.image}" alt="${escapeHTML(gift.name)}" loading="lazy" />
      </div>
      <div class="gift-card__body">
        <span class="gift-card__category">${categoryLabel}</span>
        <h3 class="gift-card__name">${escapeHTML(gift.name)}</h3>
        <p class="gift-card__desc">${escapeHTML(gift.description)}</p>
        <p class="gift-card__price">${priceFormatted}</p>

        <button
          class="btn btn--primary gift-card__add"
          data-id="${gift.id}"
          ${isFunded ? 'disabled' : ''}
        >
          <i class="fa-solid fa-cart-plus"></i>
          ${isFunded ? 'Já presenteado' : 'Adicionar ao carrinho'}
        </button>
      </div>
    </article>
  `;
    }

    /* ---------- Carrinho ---------- */
    function addToCart(gift) {
        const existing = state.cart.find(item => item.id === gift.id);
        if (existing) {
            existing.qty += 1;
        } else {
            state.cart.push({
                id: gift.id,
                name: gift.name,
                price: gift.price,
                image: gift.image,
                qty: 1,
            });
        }
        saveCart();
        renderCart();
        updateCartBadge();
    }

    function removeFromCart(id) {
        state.cart = state.cart.filter(item => item.id !== id);
        saveCart();
        renderCart();
        updateCartBadge();
    }

    function changeQty(id, delta) {
        const item = state.cart.find(i => i.id === id);
        if (!item) return;

        item.qty += delta;
        if (item.qty <= 0) {
            removeFromCart(id);
            return;
        }
        saveCart();
        renderCart();
        updateCartBadge();
    }

    function getCartTotal() {
        return state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    }
    function getCartCount() {
        return state.cart.reduce((sum, item) => sum + item.qty, 0);
    }

    function renderCart() {
        const itemsWrap = document.getElementById('cartItems');
        const emptyEl = document.getElementById('cartEmpty');
        const footer = document.getElementById('cartFooter');
        const totalEl = document.getElementById('cartTotal');

        itemsWrap.querySelectorAll('.cart-item').forEach(el => el.remove());

        if (state.cart.length === 0) {
            emptyEl.hidden = false;
            footer.hidden = true;
            return;
        }

        emptyEl.hidden = true;
        footer.hidden = false;

        state.cart.forEach(item => {
            const subtotal = item.price * item.qty;
            const el = document.createElement('div');
            el.className = 'cart-item';
            el.innerHTML = `
      <div class="cart-item__img">
        <img src="${item.image}" alt="${escapeHTML(item.name)}" />
      </div>
      <div class="cart-item__info">
        <p class="cart-item__name">${escapeHTML(item.name)}</p>
        <p class="cart-item__price">${formatBRL(item.price)} cada</p>
        <div class="cart-item__qty">
          <button aria-label="Diminuir quantidade" data-action="decrease">−</button>
          <span>${item.qty}</span>
          <button aria-label="Aumentar quantidade" data-action="increase">+</button>
        </div>
      </div>
      <div>
        <p class="cart-item__subtotal">${formatBRL(subtotal)}</p>
        <button class="cart-item__remove" aria-label="Remover item" data-action="remove">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
            el.querySelector('[data-action="decrease"]').addEventListener('click', () => changeQty(item.id, -1));
            el.querySelector('[data-action="increase"]').addEventListener('click', () => changeQty(item.id, +1));
            el.querySelector('[data-action="remove"]').addEventListener('click', () => removeFromCart(item.id));

            itemsWrap.appendChild(el);
        });

        totalEl.textContent = formatBRL(getCartTotal());
    }

    function updateCartBadge() {
        const badge = document.getElementById('cartBadge');
        const count = getCartCount();
        if (count > 0) {
            badge.textContent = count;
            badge.hidden = false;
        } else {
            badge.hidden = true;
        }
    }

    function openCart() {
        document.getElementById('cartDrawer').classList.add('open');
        document.getElementById('cartDrawer').setAttribute('aria-hidden', 'false');
        document.getElementById('cartOverlay').hidden = false;
        document.body.style.overflow = 'hidden';
    }
    function closeCart() {
        document.getElementById('cartDrawer').classList.remove('open');
        document.getElementById('cartDrawer').setAttribute('aria-hidden', 'true');
        document.getElementById('cartOverlay').hidden = true;
        document.body.style.overflow = '';
    }

    /* ---------- Checkout ---------- */
    function openCheckout() {
        if (state.cart.length === 0) return;

        const summaryEl = document.getElementById('checkoutSummary');
        summaryEl.innerHTML = state.cart.map(item => `
    <div class="checkout-modal__summary-row">
      <span>${escapeHTML(item.name)} ${item.qty > 1 ? `× ${item.qty}` : ''}</span>
      <span>${formatBRL(item.price * item.qty)}</span>
    </div>
  `).join('');

        document.getElementById('checkoutTotal').textContent = formatBRL(getCartTotal());

        checkoutMethod = 'pix';
        document.querySelectorAll('#checkoutModal .payment__method').forEach(btn =>
            btn.classList.toggle('payment__method--active', btn.dataset.method === 'pix')
        );
        updateCheckoutMethodUI();

        document.getElementById('checkoutOverlay').hidden = false;
        document.getElementById('checkoutModal').hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function closeCheckout() {
        document.getElementById('checkoutOverlay').hidden = true;
        document.getElementById('checkoutModal').hidden = true;
        document.body.style.overflow = '';
        if (checkoutPollingInterval) {
            clearInterval(checkoutPollingInterval);
            checkoutPollingInterval = null;
        }
    }

    function updateCheckoutMethodUI() {
        const isPix = checkoutMethod === 'pix';
        document.getElementById('checkoutPixInfo').hidden = false;
        document.getElementById('checkoutCardInfo').hidden = isPix;
        document.getElementById('checkoutPixQrWrap').hidden = true;
        document.getElementById('checkoutCta').hidden = false;
        document.getElementById('checkoutCtaText').textContent = isPix
            ? 'Gerar QR Code e presentear'
            : 'Ir para pagamento seguro';
    }

    async function handleCheckoutCta() {
        if (state.cart.length === 0) return;

        const guestName = document.getElementById('seuNomeNoPresente')?.value || '';
        const guestMessage = document.getElementById('mensagemNoivos')?.value || '';
        const giftIds = state.cart.map(item => item.id);

        const ctaBtn = document.getElementById('checkoutCta');
        const ctaText = document.getElementById('checkoutCtaText');
        ctaBtn.disabled = true;
        const textoOriginal = ctaText.textContent;
        ctaText.textContent = 'Gerando pagamento...';

        try {
            if (checkoutMethod === 'pix') {
                await gerarPixCarrinho(giftIds, guestName, guestMessage);
            } else {
                await gerarCheckoutCartaoCarrinho(giftIds, guestName, guestMessage);
            }
        } catch (err) {
            console.error(err);
            showToast('Erro ao gerar pagamento. Tenta de novo.');
            ctaBtn.disabled = false;
            ctaText.textContent = textoOriginal;
        }
    }

    async function gerarPixCarrinho(giftIds, guestName, guestMessage) {
        const response = await fetch(`${CONFIG.apiUrl}/pagamentos/criar-pix`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ giftIds, guestName, guestMessage }),
        });
        const data = await response.json();

        const ctaBtn = document.getElementById('checkoutCta');
        const ctaText = document.getElementById('checkoutCtaText');

        if (!response.ok) {
            showToast(data.error || 'Não foi possível gerar o Pix.');
            ctaBtn.disabled = false;
            ctaText.textContent = 'Gerar QR Code e presentear';
            return;
        }

        document.getElementById('checkoutPixQrImage').src = `data:image/png;base64,${data.qr_code_base64}`;
        document.getElementById('checkoutPixCodigoValue').textContent = data.qr_code;
        document.getElementById('checkoutPixQrWrap').hidden = false;
        ctaBtn.style.display = 'none';

        const copyBtn = document.getElementById('checkoutPixCopy');
        copyBtn.onclick = () => copyToClipboard(data.qr_code, copyBtn, '<i class="fa-regular fa-copy"></i> Copiar');

        iniciarPollingCarrinho(data.paymentRecordId);
    }

    async function gerarCheckoutCartaoCarrinho(giftIds, guestName, guestMessage) {
        const response = await fetch(`${CONFIG.apiUrl}/pagamentos/criar-preferencia`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ giftIds, guestName, guestMessage }),
        });
        const data = await response.json();

        if (!response.ok) {
            showToast(data.error || 'Não foi possível gerar o pagamento.');
            document.getElementById('checkoutCta').disabled = false;
            document.getElementById('checkoutCtaText').textContent = 'Ir para pagamento seguro';
            return;
        }

        window.location.href = data.init_point;
    }

    function iniciarPollingCarrinho(paymentRecordId) {
        document.getElementById('checkoutPixStatusMsg').textContent = 'Aguardando pagamento...';
        checkoutPollingInterval = setInterval(async () => {
            try {
                const response = await fetch(`${CONFIG.apiUrl}/pagamentos/status/${paymentRecordId}`);
                const data = await response.json();

                if (data.status === 'approved') {
                    clearInterval(checkoutPollingInterval);
                    checkoutPollingInterval = null;

                    state.cart = [];
                    saveCart();
                    renderCart();
                    updateCartBadge();

                    closeCheckout();
                    document.getElementById('checkoutSuccess').hidden = false;
                    showToast('Pagamento confirmado! Muito obrigado 💛');
                }
            } catch (err) {
                console.error('Erro ao consultar status:', err);
            }
        }, 3000);
    }

    /* ---------- Filtros ---------- */
    function initFilters() {
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                state.search = searchInput.value;
                renderGifts();
            }, 250);
        });

        document.getElementById('sortSelect').addEventListener('change', e => {
            state.sort = e.target.value;
            renderGifts();
        });

        const priceSelect = document.getElementById('priceSelect');
        const customFields = document.getElementById('customPriceFields');

        priceSelect.addEventListener('change', e => {
            state.priceRange = e.target.value;
            if (state.priceRange === 'custom') {
                customFields.hidden = false;
            } else {
                customFields.hidden = true;
                renderGifts();
            }
        });

        document.getElementById('applyCustomPrice').addEventListener('click', () => {
            const min = document.getElementById('priceMin').value;
            const max = document.getElementById('priceMax').value;
            state.customMin = min ? Number(min) : 0;
            state.customMax = max ? Number(max) : Infinity;
            renderGifts();
        });

        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
                chip.classList.add('chip--active');
                state.category = chip.dataset.category;
                renderGifts();
            });
        });

        const filtersToggle = document.getElementById('filtersToggle');
        const categoryFilters = document.getElementById('categoryFilters');
        filtersToggle.addEventListener('click', () => {
            const isOpen = categoryFilters.classList.toggle('open');
            filtersToggle.setAttribute('aria-expanded', isOpen);
        });

        document.getElementById('clearFiltersBtn').addEventListener('click', () => {
            state.search = '';
            state.sort = 'popular';
            state.priceRange = 'all';
            state.category = 'all';

            searchInput.value = '';
            document.getElementById('sortSelect').value = 'popular';
            priceSelect.value = 'all';
            customFields.hidden = true;

            document.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
            document.querySelector('.chip[data-category="all"]').classList.add('chip--active');

            renderGifts();
        });
    }

    /* ---------- Inicialização desta página ---------- */
    loadCart();


    cartFab.addEventListener('click', openCart);
    document.getElementById('cartClose').addEventListener('click', closeCart);
    document.getElementById('cartOverlay').addEventListener('click', closeCart);

    document.getElementById('checkoutBtn').addEventListener('click', () => {
        closeCart();
        openCheckout();
    });

    document.getElementById('checkoutClose').addEventListener('click', closeCheckout);
    document.getElementById('checkoutOverlay').addEventListener('click', closeCheckout);

    document.querySelectorAll('#checkoutModal .payment__method').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#checkoutModal .payment__method')
                .forEach(b => b.classList.remove('payment__method--active'));
            btn.classList.add('payment__method--active');
            checkoutMethod = btn.dataset.method;
            updateCheckoutMethodUI();
        });
    });

    document.getElementById('checkoutCta').addEventListener('click', handleCheckoutCta);

    const checkoutPixCopyBtn = document.getElementById('checkoutPixCopy');
    checkoutPixCopyBtn.addEventListener('click', () => {
        copyToClipboard(
            CONFIG.pixKey,
            checkoutPixCopyBtn,
            '<i class="fa-regular fa-copy"></i> Copiar'
        );
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeCart();
            closeCheckout();
        }
    });

    initFilters();

    carregarDisponibilidade();
    renderCart();
    updateCartBadge();
}


/* ============================================================
   Inicia tudo quando a página carrega
   Cada função "se protege" checando se os elementos que
   ela precisa existem — então rodar as duas juntas é seguro
   em qualquer uma das páginas.
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    initGiftPicker();
    initGiftsListPage();
});

export { initGiftPicker, initGiftsListPage };