(() => {
  'use strict';

  const select = document.querySelector('#tipo-site');
  const cards = [...document.querySelectorAll('.plan-card[data-plan]')];
  const available = new Set(['Essencial', 'Comercial', 'Inteligente']);
  const form = document.querySelector('#form-orcamento');
  const submit = document.querySelector('#orcamento-submit');
  const info = document.querySelector('#orcamento-setup');
  const status = document.querySelector('#orcamento-status');
  const confirmed = document.querySelector('#orcamento-confirmacao');
  const protocol = document.querySelector('#orcamento-protocolo');
  const config = window.SAITE_INBOX_PUBLIC_CONFIG || {};
  let apiBase = '', token = '', widgetId = null, ready = false, sending = false;
  if (!select || cards.length !== 3 || !form || !submit) return;

  const announcement = document.createElement('p');
  announcement.className = 'sr-only';
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  document.querySelector('.plans')?.appendChild(announcement);

  function synchronize(value, announce = false) {
    const chosen = available.has(value) ? value : '';
    select.value = chosen;
    for (const card of cards) card.setAttribute('aria-pressed', String(card.dataset.plan === chosen));
    if (announce && chosen) announcement.textContent = 'Plano ' + chosen + ' selecionado no formulário.';
  }

  for (const card of cards) card.addEventListener('click', () => synchronize(card.dataset.plan, true));
  select.addEventListener('change', () => synchronize(select.value, true));

  const params = new URLSearchParams(window.location.search);
  const requested = (params.get('plano') || '').trim().toLowerCase();
  synchronize([...available].find(item => item.toLowerCase() === requested) || '');

  function feedback(message) { status.textContent = message || ''; }
  function refreshButton() {
    submit.disabled = !ready || !token || sending;
    submit.setAttribute('aria-busy', String(sending));
    submit.innerHTML = sending
      ? '<span aria-hidden="true">◌</span> Enviando solicitação...'
      : '<span aria-hidden="true">➤</span> Enviar solicitação de orçamento <span aria-hidden="true">↗</span>';
  }
  function validConfig() {
    try {
      const url = new URL(config.apiBase);
      if (url.origin !== 'https://saite-inbox.k410sh4-ai-forum-2026.workers.dev' ||
          url.pathname !== '/' || url.search || url.hash || url.username || url.password) return false;
      if (typeof config.turnstileSiteKey !== 'string' ||
          !/^0x[A-Za-z0-9_-]{12,}$/.test(config.turnstileSiteKey)) return false;
      apiBase = url.origin;
      return true;
    } catch { return false; }
  }
  async function initialize() {
    ready = validConfig();
    if (!ready) {
      info.hidden = false;
      feedback('O serviço de orçamentos está em ativação. Nenhum pedido será enviado enquanto estiver indisponível.');
      refreshButton();
      return;
    }
    let attempts = 0;
    while (!window.turnstile && attempts++ < 70) await new Promise(resolve => setTimeout(resolve, 200));
    if (!window.turnstile) {
      ready = false;
      info.hidden = false;
      info.textContent = 'Não foi possível carregar a proteção antispam. Atualize a página e tente novamente.';
      refreshButton();
      return;
    }
    try {
      widgetId = window.turnstile.render('#orcamento-turnstile', {
        sitekey: config.turnstileSiteKey,
        action: 'pedido',
        callback: newToken => { token = newToken; refreshButton(); feedback(''); },
        'expired-callback': () => { token = ''; refreshButton(); feedback('A verificação expirou. Conclua-a novamente.'); },
        'error-callback': () => { token = ''; refreshButton(); feedback('Erro na verificação antispam. Tente novamente.'); }
      });
      info.hidden = true;
    } catch {
      ready = false;
      info.hidden = false;
      info.textContent = 'A verificação antispam não pôde ser iniciada. Atualize a página.';
    }
    refreshButton();
  }

  form.addEventListener('invalid', (event) => {
    if (event.target === select && !select.value) {
      announcement.textContent = 'Selecione um tipo de site para solicitar o orçamento.';
    }
  }, true);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!ready || sending) return;
    if (!form.reportValidity()) return;
    if (!token) { feedback('Conclua a verificação antispam antes de enviar.'); return; }

    const customerName = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const services = document.getElementById('servicos').value.trim();
    const observations = document.getElementById('observacoes').value.trim();
    const plan = select.value;
    const message = [
      'Plano de interesse: ' + plan,
      'Serviços ou produtos da empresa:\n' + services,
      observations ? 'Observações:\n' + observations : ''
    ].filter(Boolean).join('\n\n');

    if (customerName.length < 2 || !available.has(plan) || services.length < 12) {
      feedback('Confira o nome, o plano e os serviços oferecidos.');
      return;
    }
    if (message.length > 3000) {
      feedback('Sua mensagem está muito longa. Reduza as observações para enviar até 3.000 caracteres.');
      return;
    }
    sending = true;
    const currentToken = token;
    token = '';
    refreshButton();
    feedback('');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      let response;
      try {
        response = await fetch(apiBase + '/api/requests', {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-store',
          referrerPolicy: 'no-referrer',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            source: 'saite',
            name: customerName,
            email,
            subject: 'Orçamento SAITE - Plano ' + plan,
            message,
            website: document.getElementById('form-honey').value,
            turnstileToken: currentToken
          }),
          signal: controller.signal
        });
      } finally { clearTimeout(timeout); }
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true || typeof result.id !== 'string') {
        throw new Error(result.error || 'Não foi possível registrar o pedido.');
      }
      form.hidden = true;
      confirmed.hidden = false;
      protocol.textContent = 'Protocolo: ' + result.id.slice(0,8).toUpperCase();
      confirmed.scrollIntoView({block: 'center', behavior: 'smooth'});
    } catch (error) {
      feedback(error.name === 'AbortError'
        ? 'O servidor demorou para responder. Confira a caixa de pedidos antes de tentar reenviar.'
        : (error.message || 'Não foi possível enviar o orçamento. Tente novamente.'));
    } finally {
      sending = false;
      if (widgetId !== null && window.turnstile) window.turnstile.reset(widgetId);
      refreshButton();
    }
  });
  refreshButton();
  initialize();
})();
