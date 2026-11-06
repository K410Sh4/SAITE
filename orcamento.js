(() => {
  'use strict';

  const select = document.querySelector('#tipo-site');
  const cards = [...document.querySelectorAll('.plan-card[data-plan]')];
  const available = new Set(['Essencial', 'Comercial', 'Inteligente']);
  if (!select || cards.length !== 3) return;

  const announcement = document.createElement('p');
  announcement.className = 'sr-only';
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  document.querySelector('.plans')?.appendChild(announcement);

  function synchronize(value, announce = false) {
    const chosen = available.has(value) ? value : '';
    select.value = chosen;
    for (const card of cards) {
      const active = card.dataset.plan === chosen;
      card.setAttribute('aria-pressed', String(active));
    }
    if (announce && chosen) {
      announcement.textContent = 'Plano ' + chosen + ' selecionado no formulário.';
    }
  }

  for (const card of cards) {
    card.addEventListener('click', () => synchronize(card.dataset.plan, true));
  }
  select.addEventListener('change', () => synchronize(select.value, true));

  // Permite compartilhar o formulário com um plano pré-selecionado, sem
  // esconder do cliente qual opção foi escolhida.
  const params = new URLSearchParams(window.location.search);
  const requested = (params.get('plano') || '').trim().toLowerCase();
  const initial = [...available].find(item => item.toLowerCase() === requested);
  if (initial) synchronize(initial);
  else synchronize('');

  // A validação do HTML é mantida. Não interceptamos o POST nem declaramos
  // sucesso: a confirmação depende da resposta do FormSubmit e da ativação.
  const form = document.querySelector('#form-orcamento');
  form?.addEventListener('invalid', (event) => {
    if (event.target === select && !select.value) {
      announcement.textContent = 'Selecione um tipo de site para enviar o orçamento.';
    }
  }, true);
})();