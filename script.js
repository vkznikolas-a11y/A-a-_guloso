// Número do WhatsApp da Açaiteria (Mr. Açaí)
const WHATSAPP_NUMBER = "5541984073915";

// Dados da Loja com as Regras do Adamastor
const sizes = [
    { id: 'copo300', name: 'Copo 300ml', price: 15.00, maxAdditionals: 2 },
    { id: 'copo500', name: 'Copo 500ml', price: 20.00, maxAdditionals: 4 },
    { id: 'copo700', name: 'Copo 700ml', price: 26.00, maxAdditionals: null },
    { id: 'tigela1l', name: 'Tigela Família 1L', price: 38.00, maxAdditionals: null }
];

const additionals = [
    { id: 'leite_ninho', name: 'Leite Ninho', price: 3.50 },
    { id: 'leite_condensado', name: 'Leite Condensado', price: 3.00 },
    { id: 'banana', name: 'Banana Fatiada', price: 2.50 },
    { id: 'morango', name: 'Morangos Frescos', price: 4.00 },
    { id: 'granola', name: 'Granola Crocante', price: 2.50 },
    { id: 'pacoca', name: 'Paçoca Desfarelada', price: 3.00 },
    { id: 'nutella', name: 'Creme de Nutella', price: 6.00 },
    { id: 'ovomaltine', name: 'Ovomaltine', price: 4.00 }
];

// Estado Atual
let selectedSize = null;
let selectedAdditionals = [];
let appliedCouponCode = '';
let appliedCouponData = null;

document.addEventListener('DOMContentLoaded', () => {
    renderSizes();
    renderAdditionals();
    loadProfileToForm();
    renderHistory();
    updateSummary();
});

// Navegação por Abas
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Exibir Alerta na Tela
function showAlert(message) {
    const banner = document.getElementById('alert-banner');
    banner.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="font-size:1.2rem; color:#856404;"></i> <span>${message}</span>`;
    banner.classList.add('active');

    banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    setTimeout(() => {
        banner.classList.remove('active');
    }, 5000);
}

// Renderizar Opções de Tamanho
function renderSizes() {
    const grid = document.getElementById('sizes-grid');
    grid.innerHTML = sizes.map(size => {
        let limitText = size.maxAdditionals !== null 
            ? `Máx. ${size.maxAdditionals} adicionais` 
            : `Adicionais ilimitados`;
            
        return `
            <div class="option-card ${selectedSize?.id === size.id ? 'selected' : ''}" onclick="selectSize('${size.id}')">
                <div class="option-header">
                    <span class="option-title">${size.name}</span>
                    <input type="radio" name="size" ${selectedSize?.id === size.id ? 'checked' : ''}>
                </div>
                <span class="option-price">R$ ${size.price.toFixed(2).replace('.', ',')}</span>
                <span class="size-limit-tag"><i class="fa-solid fa-circle-info"></i> ${limitText}</span>
            </div>
        `;
    }).join('');
}

function selectSize(sizeId) {
    const newSize = sizes.find(s => s.id === sizeId);
    
    if (newSize.maxAdditionals !== null && selectedAdditionals.length > newSize.maxAdditionals) {
        selectedAdditionals = selectedAdditionals.slice(0, newSize.maxAdditionals);
        showAlert(`Atenção: O <strong>${newSize.name}</strong> permite no máximo <strong>${newSize.maxAdditionals} adicionais</strong>. Sua seleção foi ajustada!`);
    }

    selectedSize = newSize;
    renderSizes();
    renderAdditionals();
    updateSummary();
}

// Renderizar Adicionais
function renderAdditionals() {
    const grid = document.getElementById('additionals-grid');
    const badge = document.getElementById('limit-badge');
    const subtitle = document.getElementById('additionals-subtitle');

    if (!selectedSize) {
        badge.textContent = 'Selecione um tamanho acima';
        subtitle.textContent = 'Escolha primeiro o tamanho para verificar os limites de adicionais.';
    } else if (selectedSize.maxAdditionals !== null) {
        badge.textContent = `Selecionados: ${selectedAdditionals.length} / ${selectedSize.maxAdditionals} máx.`;
        subtitle.textContent = `Limite máximo de ${selectedSize.maxAdditionals} adicionais para o ${selectedSize.name}.`;
    } else {
        badge.textContent = `Selecionados: ${selectedAdditionals.length} (Ilimitado)`;
        subtitle.textContent = `Monte seu açaí como quiser!`;
    }

    grid.innerHTML = additionals.map(add => {
        const isSelected = selectedAdditionals.some(a => a.id === add.id);
        
        return `
            <div class="option-card ${isSelected ? 'selected' : ''}" onclick="toggleAdditional('${add.id}')">
                <div class="option-header">
                    <span class="option-title">${add.name}</span>
                    <input type="checkbox" ${isSelected ? 'checked' : ''}>
                </div>
                <span class="option-price">+ R$ ${add.price.toFixed(2).replace('.', ',')}</span>
            </div>
        `;
    }).join('');
}

// Marcar/Desmarcar Adicionais com Bloqueio
function toggleAdditional(addId) {
    if (!selectedSize) {
        showAlert('Por favor, <strong>selecione o tamanho do copo</strong> antes de escolher os adicionais!');
        return;
    }

    const index = selectedAdditionals.findIndex(a => a.id === addId);
    const isSelected = index > -1;

    if (!isSelected) {
        if (selectedSize.maxAdditionals !== null && selectedAdditionals.length >= selectedSize.maxAdditionals) {
            showAlert(`<strong>Bloqueado!</strong> O ${selectedSize.name} só permite até <strong>${selectedSize.maxAdditionals} adicionais</strong>.`);
            return;
        }
        
        const item = additionals.find(a => a.id === addId);
        selectedAdditionals.push(item);
    } else {
        selectedAdditionals.splice(index, 1);
    }

    renderAdditionals();
    updateSummary();
}

// Cálculo da Taxa de Entrega baseada no Bairro (Centro = R$ 5,00 | Outros = R$ 10,00)
function calculateDeliveryFee(bairro) {
    if (!bairro) return 0;
    const cleanBairro = bairro.trim().toLowerCase();
    if (cleanBairro === 'centro') {
        return 5.00;
    }
    return 10.00;
}

function updateDeliveryRateRealtime() {
    updateSummary();
}

// Aplicação dos 5 Cupons
function applyCoupon() {
    const code = document.getElementById('coupon-input').value.trim().toUpperCase();
    const feedback = document.getElementById('coupon-feedback');

    const coupons = {
        'PRIMEIRA10': { type: 'percent', value: 0.10, label: '10% de desconto!' },
        'ACAI20':     { type: 'percent', value: 0.20, label: '20% de desconto!' },
        'MRACAI15':   { type: 'percent', value: 0.15, label: '15% de desconto!' },
        'VIP25':      { type: 'percent', value: 0.25, label: '25% de desconto VIP!' },
        'DELICIA5':   { type: 'fixed',   value: 5.00, label: 'R$ 5,00 de desconto!' },
        'GRATIS100':  { type: 'percent', value: 1.00, label: '100% de desconto (Açaí Grátis)!' } // Cupom Secreto
    };

    if (coupons[code]) {
        const coupon = coupons[code];
        appliedCouponCode = code;
        appliedCouponData = coupon;

        feedback.textContent = `Cupom (${code}) aplicado: ${coupon.label}`;
        feedback.className = 'coupon-feedback success';
    } else if (code === '') {
        appliedCouponCode = '';
        appliedCouponData = null;
        feedback.textContent = 'Por favor, digite um código de cupom.';
        feedback.className = 'coupon-feedback error';
    } else {
        appliedCouponCode = '';
        appliedCouponData = null;
        feedback.textContent = 'Cupom inválido ou expirado.';
        feedback.className = 'coupon-feedback error';
    }

    updateSummary();
}

// Atualizar Resumo com Taxa de Entrega
function updateSummary() {
    const container = document.getElementById('summary-details');
    const totalElement = document.getElementById('total-price');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (!selectedSize) {
        container.innerHTML = `<p class="empty-summary">Nenhum tamanho selecionado ainda.</p>`;
        totalElement.textContent = 'R$ 0,00';
        checkoutBtn.disabled = true;
        return;
    }

    let subtotal = selectedSize.price;
    let html = `<strong>Base:</strong> ${selectedSize.name} (R$ ${selectedSize.price.toFixed(2).replace('.', ',')})<br>`;

    if (selectedAdditionals.length > 0) {
        html += `<br><strong>Adicionais (${selectedAdditionals.length}):</strong><br>`;
        selectedAdditionals.forEach(add => {
            subtotal += add.price;
            html += `- ${add.name} (+R$ ${add.price.toFixed(2).replace('.', ',')})<br>`;
        });
    } else {
        html += `<br><span style="color:var(--text-muted)">Sem adicionais selecionados.</span>`;
    }

    // Taxa de entrega do Bairro
    const profile = getProfile();
    const bairroInput = document.getElementById('prof-bairro');
    const currentBairro = bairroInput ? bairroInput.value : profile.bairro;
    const deliveryFee = calculateDeliveryFee(currentBairro);

    if (currentBairro && currentBairro.trim() !== '') {
        html += `<br><strong>Taxa de Entrega (${currentBairro}):</strong> R$ ${deliveryFee.toFixed(2).replace('.', ',')}<br>`;
    } else {
        html += `<br><span style="color:var(--accent-coral)"><strong>Taxa de Entrega:</strong> Informe o bairro no cadastro.</span><br>`;
    }

    // Desconto
    let discountAmount = 0;
    if (appliedCouponData) {
        if (appliedCouponData.type === 'percent') {
            discountAmount = subtotal * appliedCouponData.value;
        } else if (appliedCouponData.type === 'fixed') {
            discountAmount = appliedCouponData.value;
        }

        if (discountAmount > subtotal) discountAmount = subtotal;

        html += `<span style="color:var(--green-brand)"><strong>Desconto (${appliedCouponCode}):</strong> -R$ ${discountAmount.toFixed(2).replace('.', ',')}</span>`;
    }

    let totalFinal = (subtotal - discountAmount) + deliveryFee;
    if (totalFinal < 0) totalFinal = 0;

    container.innerHTML = html;
    totalElement.textContent = `R$ ${totalFinal.toFixed(2).replace('.', ',')}`;
    checkoutBtn.disabled = false;
}

// Gerar Link do WhatsApp
function buildWhatsAppLink(order, profile) {
    let msg = `🍇 *NOVO PEDIDO - MR. AÇAÍ* 🍇\n`;
    msg += `--------------------------------\n`;
    msg += `🆔 *Pedido:* #${order.id}\n`;
    msg += `👤 *Cliente:* ${profile.name}\n`;
    msg += `📞 *Telefone:* ${profile.phone}\n`;
    msg += `🏙️ *Bairro:* ${profile.bairro}\n`;
    msg += `📍 *Endereço/Mesa:* ${profile.address}\n`;
    msg += `--------------------------------\n`;
    msg += `🍧 *Tamanho:* ${order.size.name} (R$ ${order.size.price.toFixed(2).replace('.', ',')})\n`;
    
    if (order.additionals.length > 0) {
        msg += `➕ *Adicionais:* \n`;
        order.additionals.forEach(a => {
            msg += `  • ${a.name} (+R$ ${a.price.toFixed(2).replace('.', ',')})\n`;
        });
    } else {
        msg += `➕ *Adicionais:* Nenhum\n`;
    }

    if (order.discountCode) {
        msg += `🎟️ *Cupom Aplicado:* ${order.discountCode}\n`;
    }

    msg += `🛵 *Taxa de Entrega:* R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}\n`;
    msg += `--------------------------------\n`;
    msg += `💰 *TOTAL FINAL:* R$ ${order.total.toFixed(2).replace('.', ',')}\n`;
    msg += `--------------------------------\n`;
    msg += `Aguardando confirmação! 😋`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// Finalizar Pedido com Validação Rigorosa
function finalizeOrder() {
    const profile = getProfile();

    // Validação dos Campos Obrigatórios Solicitados pelo Adamastor
    if (!profile.name || profile.name.trim().length < 3) {
        showAlert('<strong>Atenção!</strong> Preencha seu <strong>Nome Completo</strong> no cadastro antes de enviar!');
        redirectProfileTab();
        return;
    }

    // Validação de Telefone com DDD
    const phoneDigits = profile.phone ? profile.phone.replace(/\D/g, '') : '';
    if (phoneDigits.length < 10) {
        showAlert('<strong>Atenção!</strong> Informe um <strong>Telefone válido com DDD</strong> no cadastro!');
        redirectProfileTab();
        return;
    }

    // Validação de Bairro
    if (!profile.bairro || profile.bairro.trim() === '') {
        showAlert('<strong>Atenção!</strong> Informe seu <strong>Bairro</strong> para cálculo da entrega!');
        redirectProfileTab();
        return;
    }

    if (!profile.address || profile.address.trim() === '') {
        showAlert('<strong>Atenção!</strong> Informe seu <strong>Endereço Completo / Mesa</strong>!');
        redirectProfileTab();
        return;
    }

    let subtotal = selectedSize.price;
    selectedAdditionals.forEach(a => subtotal += a.price);

    let discountAmount = 0;
    if (appliedCouponData) {
        if (appliedCouponData.type === 'percent') discountAmount = subtotal * appliedCouponData.value;
        else if (appliedCouponData.type === 'fixed') discountAmount = appliedCouponData.value;
        if (discountAmount > subtotal) discountAmount = subtotal;
    }

    const deliveryFee = calculateDeliveryFee(profile.bairro);
    const finalTotal = (subtotal - discountAmount) + deliveryFee;

    const newOrder = {
        id: Math.floor(1000 + Math.random() * 9000),
        date: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
        size: selectedSize,
        additionals: [...selectedAdditionals],
        discountCode: appliedCouponCode,
        deliveryFee: deliveryFee,
        total: finalTotal
    };

    const history = getHistory();
    history.unshift(newOrder);
    localStorage.setItem('mr_acai_history', JSON.stringify(history));

    const waUrl = buildWhatsAppLink(newOrder, profile);
    
    window.open(waUrl, '_blank');

    showModal(newOrder, waUrl);

    // Resetar carrinho
    selectedSize = null;
    selectedAdditionals = [];
    appliedCouponCode = '';
    appliedCouponData = null;
    document.getElementById('coupon-input').value = '';
    document.getElementById('coupon-feedback').textContent = '';
    renderSizes();
    renderAdditionals();
    updateSummary();
    renderHistory();
}

function redirectProfileTab() {
    switchTab('profile-tab');
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.querySelectorAll('.tab-btn')[0].classList.remove('active');
}

function showModal(order, waUrl) {
    const modal = document.getElementById('success-modal');
    const details = document.getElementById('modal-order-details');
    const waBtn = document.getElementById('modal-whatsapp-btn');
    
    details.innerHTML = `
        <strong>Pedido #${order.id}</strong><br>
        <strong>Tamanho:</strong> ${order.size.name}<br>
        <strong>Adicionais:</strong> ${order.additionals.length > 0 ? order.additionals.map(a => a.name).join(', ') : 'Nenhum'}<br>
        <strong>Entrega:</strong> R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}<br>
        <strong>Total Final:</strong> R$ ${order.total.toFixed(2).replace('.', ',')}
    `;

    waBtn.onclick = () => window.open(waUrl, '_blank');
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('success-modal').classList.remove('active');
}

// Cadastro
function saveProfile(event) {
    event.preventDefault();
    const profile = {
        name: document.getElementById('prof-name').value,
        phone: document.getElementById('prof-phone').value,
        bairro: document.getElementById('prof-bairro').value,
        address: document.getElementById('prof-address').value
    };

    localStorage.setItem('mr_acai_profile', JSON.stringify(profile));
    
    const feedback = document.getElementById('profile-feedback');
    feedback.textContent = 'Cadastro e Bairro salvos com sucesso!';
    feedback.style.color = 'var(--green-brand)';
    setTimeout(() => feedback.textContent = '', 3000);

    updateSummary();
}

function clearProfileDefinitive() {
    if (confirm('Tem certeza de que deseja apagar permanentemente seu cadastro?')) {
        localStorage.removeItem('mr_acai_profile');
        document.getElementById('prof-name').value = '';
        document.getElementById('prof-phone').value = '';
        document.getElementById('prof-bairro').value = '';
        document.getElementById('prof-address').value = '';

        const feedback = document.getElementById('profile-feedback');
        feedback.textContent = 'Cadastro apagado com sucesso!';
        feedback.style.color = 'var(--accent-coral)';
        setTimeout(() => feedback.textContent = '', 3000);

        updateSummary();
    }
}

function getProfile() {
    const data = localStorage.getItem('mr_acai_profile');
    return data ? JSON.parse(data) : { name: '', phone: '', bairro: '', address: '' };
}

function loadProfileToForm() {
    const profile = getProfile();
    if (profile.name) document.getElementById('prof-name').value = profile.name;
    if (profile.phone) document.getElementById('prof-phone').value = profile.phone;
    if (profile.bairro) document.getElementById('prof-bairro').value = profile.bairro;
    if (profile.address) document.getElementById('prof-address').value = profile.address;
}

// Histórico
function getHistory() {
    const data = localStorage.getItem('mr_acai_history');
    return data ? JSON.parse(data) : [];
}

function renderHistory() {
    const history = getHistory();
    const list = document.getElementById('history-list');
    const badge = document.getElementById('history-badge');
    
    badge.textContent = history.length;

    if (history.length === 0) {
        list.innerHTML = `<p class="empty-summary">Nenhum pedido realizado ainda.</p>`;
        return;
    }

    const profile = getProfile();

    list.innerHTML = history.map(order => {
        const waUrl = buildWhatsAppLink(order, profile);

        return `
            <div class="history-item">
                <div class="history-item-header">
                    <span>Pedido #${order.id}</span>
                    <span>${order.date}</span>
                </div>
                <div class="history-item-body">
                    <strong>${order.size.name}</strong><br>
                    ${order.additionals.length > 0 ? 'Adicionais: ' + order.additionals.map(a => a.name).join(', ') : 'Sem adicionais'}<br>
                    <small>Entrega: R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}</small>
                </div>
                <div class="history-item-footer">
                    <span class="option-price">Total: R$ ${order.total.toFixed(2).replace('.', ',')}</span>
                    <div>
                        <button class="btn-repeat" onclick="repeatOrder(${order.id})"><i class="fa-solid fa-rotate-right"></i> Refazer</button>
                        <button class="btn-resend-zap" onclick="window.open('${waUrl}', '_blank')"><i class="fa-brands fa-whatsapp"></i> Reenviar</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function repeatOrder(orderId) {
    const history = getHistory();
    const order = history.find(o => o.id === orderId);
    if (!order) return;

    selectedSize = order.size;
    selectedAdditionals = [...order.additionals];
    appliedCouponCode = '';
    appliedCouponData = null;

    renderSizes();
    renderAdditionals();
    updateSummary();

    switchTab('order-tab');
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.querySelectorAll('.tab-btn')[2].classList.remove('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearHistory() {
    if (confirm('Deseja limpar todo o seu histórico de pedidos?')) {
        localStorage.removeItem('mr_acai_history');
        renderHistory();
    }
}