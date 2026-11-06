import { projects, renderMockup } from './projects.js';
import { initGoogleAuth } from './auth.js';

const track = document.querySelector('#carouselTrack');
const dots = document.querySelector('#carouselDots');
const activeNumber = document.querySelector('#activeNumber');
const previewTitle = document.querySelector('#previewTitle');
const previewDescription = document.querySelector('#previewDescription');
const previewContent = document.querySelector('#previewContent');
const previewAddress = document.querySelector('#previewAddress');
const previewLabel = document.querySelector('#previewLabel');
const visitLink = document.querySelector('#visitLink');
const previewSection = document.querySelector('#preview');
const previewFrame = previewSection.querySelector('.browser-frame');
const carousel = document.querySelector('#carousel');
const toast = document.querySelector('#toast');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const hoverCapable = window.matchMedia('(hover: hover)');
let current = 0;
let switchTimer = null;
let revealTimer = null;
let transitionPhase = 'idle';
let autoTimer = null;
let toastTimer = null;
let motionTimer = null;
let carouselVisible = true;
let previewVisible = !('IntersectionObserver' in window);
let hoverPaused = false;
let focusPaused = false;
let dragState = null;
let dragFrame = null;
let pendingDragShift = 0;
let suppressClickUntil = 0;
let wheelAccumulated = 0;
let lastWheelAt = 0;
let lastWheelStepAt = 0;
const previewNodeCache = new Map();

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 4700);
}

function safeUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch { return null; }
}

function renderCards() {
  track.innerHTML = projects.map((project, index) => `
    <button class="project-card" type="button" data-index="${index}" aria-label="Exibir projeto ${index + 1}: ${project.title}" aria-pressed="false">
      <div class="project-surface">${renderMockup(project.id)}</div>
      <span class="card-caption"><span><span class="card-type">${project.category}</span><span class="card-title">${project.title}</span></span><span class="card-cta" aria-hidden="true">↗</span></span>
    </button>
  `).join('');
  dots.innerHTML = projects.map((project, index) => `<button type="button" class="dot-button" data-index="${index}" aria-label="Ir para ${project.title}" aria-current="false"><span></span></button>`).join('');
  track.addEventListener('click', (event) => {
    const button = event.target.closest('.project-card');
    if (button) selectProject(Number(button.dataset.index));
  });
  dots.addEventListener('click', (event) => {
    const button = event.target.closest('.dot-button');
    if (button) selectProject(Number(button.dataset.index));
  });
}

function updateCardPositions() {
  track.querySelectorAll('.project-card').forEach((button, index) => {
    // A ordem é sempre: próximo à esquerda, intermediário, distante à direita.
    // Ao avançar, a posição intermediária cresce e assume a dianteira;
    // o terceiro card vem do fundo e o antigo primeiro retorna à distância.
    const distance = (index - current + projects.length) % projects.length;
    const depth = ['near', 'middle', 'far'][distance];
    const active = distance === 0;
    button.dataset.depth = depth;
    button.dataset.active = String(active);
    button.setAttribute('aria-pressed', String(active));
  });
  dots.querySelectorAll('.dot-button').forEach((button, index) => {
    button.setAttribute('aria-current', String(index === current));
  });
  activeNumber.textContent = String(current + 1).padStart(2, '0');
}

function updatePreview(index) {
  const project = projects[index];
  previewTitle.textContent = project.title;
  previewDescription.textContent = project.description;
  const previewUrl = safeUrl(project.previewUrl);
  const liveUrl = safeUrl(project.siteUrl);

  if (previewUrl && previewVisible) {
    // Somente um site externo ativo, e apenas quando a seção é visível.
    // Não recarrega o iframe se o usuário já estiver olhando o mesmo projeto.
    let iframe = previewContent.querySelector('iframe');
    if (!iframe || iframe.getAttribute('src') !== previewUrl) {
      iframe = document.createElement('iframe');
      iframe.title = `Visualização do site ${project.title}`;
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer';
      iframe.setAttribute('src', previewUrl);
      previewContent.replaceChildren(iframe);
    }
    const address = new URL(previewUrl);
    previewAddress.textContent = address.hostname + address.pathname;
    previewLabel.textContent = 'SITE PUBLICADO · PRÉVIA INTERATIVA';
  } else {
    // Capa estática e leve: não executa os scripts do site fora da tela.
    let mockup = previewNodeCache.get(project.id);
    if (!mockup) {
      const shell = document.createElement('div');
      shell.innerHTML = renderMockup(project.id);
      mockup = shell.firstElementChild;
      if (mockup) previewNodeCache.set(project.id, mockup);
    }
    if (mockup && previewContent.firstElementChild !== mockup) previewContent.replaceChildren(mockup);
    if (!mockup) previewContent.replaceChildren();
    previewAddress.textContent = previewUrl
      ? new URL(previewUrl).hostname + new URL(previewUrl).pathname
      : `saite / conceito / ${project.id}`;
    previewLabel.textContent = previewUrl
      ? 'SITE PUBLICADO · CAPA DO PROJETO'
      : 'CONCEITO VISUAL · DEMONSTRAÇÃO';
  }
  visitLink.hidden = !liveUrl;
  if (liveUrl) visitLink.href = liveUrl;
  else visitLink.removeAttribute('href');
}

function clearTransitionTimers() {
  clearTimeout(switchTimer);
  clearTimeout(revealTimer);
  switchTimer = null;
  revealTimer = null;
}

function completeTransitionImmediately() {
  clearTransitionTimers();
  transitionPhase = 'idle';
  previewSection.classList.remove('is-switching');
  previewSection.removeAttribute('aria-busy');
  updatePreview(current);
}

// A substituição acontece apenas após o elemento real estar desfocado.
function finishBlurIn() {
  if (transitionPhase !== 'covering') return;
  clearTimeout(switchTimer);
  switchTimer = null;
  updatePreview(current);
  transitionPhase = 'revealing';
  requestAnimationFrame(() => {
    if (transitionPhase === 'revealing') {
      previewSection.classList.remove('is-switching');
    }
  });
  revealTimer = setTimeout(finishReveal, 640);
}

function finishReveal() {
  if (transitionPhase !== 'revealing') return;
  clearTimeout(revealTimer);
  revealTimer = null;
  transitionPhase = 'idle';
  previewSection.removeAttribute('aria-busy');
}

function selectProject(next, { animate = true } = {}) {
  const index = (next + projects.length) % projects.length;
  if (index === current && animate) return;
  // Prepara camadas gráficas apenas durante o movimento visível.
  if (animate && !reducedMotion.matches && carouselVisible) {
    carousel.classList.add('is-moving');
    clearTimeout(motionTimer);
    motionTimer = setTimeout(() => carousel.classList.remove('is-moving'), 1700);
  }
  current = index;
  updateCardPositions();
  // Se ninguém está vendo a prévia, não processa o blur de uma área enorme.
  if (!animate || reducedMotion.matches || !previewVisible) {
    completeTransitionImmediately();
    return;
  }
  // Cliques rápidos durante o blur atualizam o destino, sem reiniciar a animação.
  if (transitionPhase === 'covering') return;
  clearTransitionTimers();
  transitionPhase = 'covering';
  previewSection.setAttribute('aria-busy', 'true');
  previewSection.classList.add('is-switching');
  switchTimer = setTimeout(finishBlurIn, 640);
}

// O sinal de conclusão vem do próprio CSS filter do preview.
previewFrame.addEventListener('transitionend', (event) => {
  if (event.target !== previewFrame || event.propertyName !== 'filter') return;
  if (transitionPhase === 'covering') finishBlurIn();
  else if (transitionPhase === 'revealing') finishReveal();
});

function stopAuto() {
  clearInterval(autoTimer);
  autoTimer = null;
}
function startAuto() {
  stopAuto();
  if (reducedMotion.matches || document.hidden || !carouselVisible || hoverPaused || focusPaused || dragState) return;
  autoTimer = setInterval(() => selectProject(current + 1), 7200);
}


/**
 * Gestos horizontais: arraste com o dedo ou mouse para mudar um projeto.
 * O CSS touch-action:pan-y deixa a rolagem vertical com o navegador.
 */
function resetDragVisual() {
  if (dragFrame !== null) cancelAnimationFrame(dragFrame);
  dragFrame = null;
  pendingDragShift = 0;
  carousel.classList.remove('is-dragging');
  track.style.removeProperty('--drag-shift');
}

function cancelDrag() {
  if (!dragState) return;
  dragState = null;
  resetDragVisual();
  startAuto();
}

carousel.addEventListener('pointerdown', (event) => {
  if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
  if (dragState) return;
  dragState = {
    id: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startTime: performance.now(),
    dragging: false,
  };
  stopAuto();
});

carousel.addEventListener('pointermove', (event) => {
  const state = dragState;
  if (!state || event.pointerId !== state.id) return;
  const dx = event.clientX - state.startX;
  const dy = event.clientY - state.startY;
  if (!state.dragging) {
    // Nunca interceptar uma tentativa de rolagem vertical.
    if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.15) {
      cancelDrag();
      return;
    }
    if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy) * 1.15) return;
    state.dragging = true;
    carousel.classList.add('is-dragging');
    try { carousel.setPointerCapture(event.pointerId); } catch { /* Ponteiro já liberado. */ }
  }
  if (event.cancelable && event.pointerType === 'mouse') event.preventDefault();
  pendingDragShift = Math.max(-135, Math.min(135, dx * .55));
  if (dragFrame === null) {
    dragFrame = requestAnimationFrame(() => {
      track.style.setProperty('--drag-shift', pendingDragShift + 'px');
      dragFrame = null;
    });
  }
});

function endDrag(event, cancelled = false) {
  const state = dragState;
  if (!state || event.pointerId !== state.id) return;
  const dx = event.clientX - state.startX;
  const elapsed = performance.now() - state.startTime;
  dragState = null;
  if (state.dragging) {
    // Impede que o click sintético após o swipe selecione acidentalmente um card.
    suppressClickUntil = performance.now() + 380;
    resetDragVisual();
    if (!cancelled && (Math.abs(dx) >= Math.min(90, Math.max(42, carousel.clientWidth * .095))
      || (Math.abs(dx) >= 27 && elapsed < 240))) {
      selectProject(current + (dx < 0 ? 1 : -1));
    }
  }
  if (carousel.hasPointerCapture(event.pointerId)) {
    try { carousel.releasePointerCapture(event.pointerId); } catch { /* Já liberado. */ }
  }
  startAuto();
}

carousel.addEventListener('pointerup', (event) => endDrag(event));
carousel.addEventListener('pointercancel', (event) => endDrag(event, true));
window.addEventListener('blur', cancelDrag);
carousel.addEventListener('dragstart', (event) => event.preventDefault());
carousel.addEventListener('click', (event) => {
  if (performance.now() < suppressClickUntil) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);

// Roda vertical do mouse e gestos horizontais do trackpad.
// Consome somente o evento que realmente muda o projeto, sem prender a rolagem.
carousel.addEventListener('wheel', (event) => {
  if (event.ctrlKey || document.hidden || !carouselVisible || dragState) return;
  const raw = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  const pixels = raw * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? carousel.clientHeight : 1);
  if (Math.abs(pixels) < 1) return;
  const now = performance.now();
  if (now - lastWheelAt > 300 || Math.sign(wheelAccumulated) !== Math.sign(pixels)) {
    wheelAccumulated = 0;
  }
  lastWheelAt = now;
  if (now - lastWheelStepAt < 700) return;
  wheelAccumulated += pixels;
  if (Math.abs(wheelAccumulated) < 44) return;
  const direction = Math.sign(wheelAccumulated);
  wheelAccumulated = 0;
  lastWheelStepAt = now;
  event.preventDefault();
  selectProject(current + direction);
  startAuto();
}, { passive: false });

renderCards();
selectProject(0, { animate: false });

document.querySelector('#previousButton').addEventListener('click', () => { selectProject(current - 1); startAuto(); });
document.querySelector('#nextButton').addEventListener('click', () => { selectProject(current + 1); startAuto(); });
carousel.addEventListener('mouseenter', () => {
  if (hoverCapable.matches) { hoverPaused = true; stopAuto(); }
});
carousel.addEventListener('mouseleave', () => { hoverPaused = false; startAuto(); });
carousel.addEventListener('focusin', () => {
  if (hoverCapable.matches) { focusPaused = true; stopAuto(); }
});
carousel.addEventListener('focusout', (event) => {
  if (!carousel.contains(event.relatedTarget)) { focusPaused = false; startAuto(); }
});
carousel.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    selectProject(current + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopAuto();
    clearTimeout(motionTimer);
    carousel.classList.remove('is-moving');
    if (transitionPhase !== 'idle') completeTransitionImmediately();
  } else startAuto();
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches && transitionPhase !== 'idle') completeTransitionImmediately();
  startAuto();
});
// Anima somente áreas visíveis. Evita GPU trabalhando fora da tela.
if ('IntersectionObserver' in window) {
  const visibilityObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === carousel) {
        carouselVisible = entry.isIntersecting;
        if (!carouselVisible) {
          stopAuto();
          clearTimeout(motionTimer);
          carousel.classList.remove('is-moving');
        } else startAuto();
      } else if (entry.target === previewSection) {
        const wasVisible = previewVisible;
        previewVisible = entry.isIntersecting;
        if (!previewVisible && transitionPhase !== 'idle') {
          completeTransitionImmediately();
        } else if (wasVisible !== previewVisible && transitionPhase === 'idle') {
          // Ao entrar na seção, substitui a capa pelo site ao vivo.
          // Ao sair, descarrega o iframe para economizar CPU e memória.
          updatePreview(current);
        }
      }
    }
  }, { threshold: 0.05 });
  visibilityObserver.observe(carousel);
  visibilityObserver.observe(previewSection);
}
startAuto();

initGoogleAuth(showToast);
