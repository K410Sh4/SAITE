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
let current = 0;
let switchTimer = null;
let revealTimer = null;
let transitionPhase = 'idle';
let autoTimer = null;
let toastTimer = null;

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
  previewContent.replaceChildren();
  const previewUrl = safeUrl(project.previewUrl);
  const liveUrl = safeUrl(project.siteUrl);
  if (previewUrl) {
    const iframe = document.createElement('iframe');
    iframe.title = `Site demonstrativo ${project.title}`;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer';
    iframe.src = previewUrl;
    previewContent.append(iframe);
    previewAddress.textContent = new URL(previewUrl).hostname;
    previewLabel.textContent = 'VISUALIZAÇÃO DO SITE';
  } else {
    previewContent.innerHTML = renderMockup(project.id);
    previewAddress.textContent = `saite / conceito / ${project.id}`;
    previewLabel.textContent = 'CONCEITO VISUAL · DEMONSTRAÇÃO';
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
  current = index;
  updateCardPositions();
  if (!animate || reducedMotion.matches) {
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
  if (reducedMotion.matches || document.hidden) return;
  autoTimer = setInterval(() => selectProject(current + 1), 7200);
}

renderCards();
selectProject(0, { animate: false });

document.querySelector('#previousButton').addEventListener('click', () => { selectProject(current - 1); startAuto(); });
document.querySelector('#nextButton').addEventListener('click', () => { selectProject(current + 1); startAuto(); });
carousel.addEventListener('mouseenter', stopAuto);
carousel.addEventListener('mouseleave', startAuto);
carousel.addEventListener('focusin', stopAuto);
carousel.addEventListener('focusout', (event) => { if (!carousel.contains(event.relatedTarget)) startAuto(); });
carousel.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    selectProject(current + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopAuto();
    if (transitionPhase !== 'idle') completeTransitionImmediately();
  } else startAuto();
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches && transitionPhase !== 'idle') completeTransitionImmediately();
  startAuto();
});
startAuto();

const aboutDialog = document.querySelector('#aboutDialog');
document.querySelector('#aboutButton').addEventListener('click', () => aboutDialog.showModal());
document.querySelector('#aboutClose').addEventListener('click', () => aboutDialog.close());
aboutDialog.addEventListener('click', (event) => { if (event.target === aboutDialog) aboutDialog.close(); });

initGoogleAuth(showToast);
