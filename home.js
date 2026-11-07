import { initGoogleAuth } from './auth.js';

const menuButton = document.querySelector('#menuToggle');
const mobileNav = document.querySelector('#mobileNav');
const viewport = document.querySelector('#projectsViewport');
const cards = [...document.querySelectorAll('.work-card')];
const dotButtons = [...document.querySelectorAll('#projectDots [data-go]')];
const previous = document.querySelector('#projectPrev');
const next = document.querySelector('#projectNext');
const previewDialog = document.querySelector('#previewDialog');
const previewIframe = document.querySelector('#previewIframe');
const dialogTitle = document.querySelector('#previewDialogTitle');
const dialogAddress = document.querySelector('#dialogAddress');
const dialogVisit = document.querySelector('#dialogVisit');
const closePreview = document.querySelector('#closePreview');
const toast = document.querySelector('#toast');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopProjects = window.matchMedia('(min-width: 601px)');

const projectSites = Object.freeze({
  margot: { title: 'Margot Acessórios', url: 'https://k410sh4.github.io/Margot/' },
  piscina: { title: 'Espaço Piscina', url: 'https://k410sh4.github.io/EspacoPiscinas/' }
});

let currentProject = 0;
let toastTimer = 0;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 4700);
}

function toggleMenu(open) {
  const expanded = Boolean(open);
  menuButton.setAttribute('aria-expanded', String(expanded));
  menuButton.setAttribute('aria-label', expanded ? 'Fechar menu' : 'Abrir menu');
  mobileNav.hidden = !expanded;
}

menuButton.addEventListener('click', () => toggleMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
mobileNav.addEventListener('click', event => {
  if (event.target.closest('a')) toggleMenu(false);
});
document.addEventListener('pointerdown', event => {
  if (!mobileNav.hidden && !event.target.closest('.home-header')) toggleMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    toggleMenu(false);
    if (previewDialog.open) previewDialog.close();
  }
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 860 && !mobileNav.hidden) toggleMenu(false);
}, { passive: true });

// Os cards são usados diretamente; o iframe do projeto só existe durante a prévia.
function updateDots(index) {
  currentProject = ((index % cards.length) + cards.length) % cards.length;
  dotButtons.forEach((dot, i) => dot.setAttribute('aria-current', String(i === currentProject)));
  cards.forEach((card, i) => card.classList.toggle('is-highlighted', i === currentProject));
}

function goToProject(index, smooth = true) {
  const normalized = ((index % cards.length) + cards.length) % cards.length;
  updateDots(normalized);
  if (!desktopProjects.matches) {
    const cardRect = cards[normalized].getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const target = viewport.scrollLeft + cardRect.left - viewportRect.left;
    viewport.scrollTo({
      left: target,
      behavior: smooth && !reducedMotion.matches ? 'smooth' : 'auto'
    });
  }
}

dotButtons.forEach((button, index) => button.addEventListener('click', () => goToProject(index)));
previous.addEventListener('click', () => goToProject(currentProject - 1));
next.addEventListener('click', () => goToProject(currentProject + 1));

let scrollFrame = 0;
viewport.addEventListener('scroll', () => {
  if (desktopProjects.matches || scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    const viewportRect = viewport.getBoundingClientRect();
    let nearest = 0, distance = Infinity;
    cards.forEach((card, index) => {
      const delta = Math.abs(card.getBoundingClientRect().left - viewportRect.left);
      if (delta < distance) { distance = delta; nearest = index; }
    });
    updateDots(nearest);
  });
}, { passive: true });

viewport.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    goToProject(currentProject + (event.key === 'ArrowRight' ? 1 : -1));
  }
});

desktopProjects.addEventListener('change', () => {
  if (desktopProjects.matches) viewport.scrollLeft = 0;
  updateDots(currentProject);
});

function openProjectPreview(key) {
  const project = projectSites[key];
  if (!project) return;
  dialogTitle.textContent = project.title;
  dialogAddress.textContent = new URL(project.url).hostname + new URL(project.url).pathname;
  dialogVisit.href = project.url;
  previewIframe.title = 'Prévia interativa do site ' + project.title;
  // Não mantém dois sites pesados rodando por trás do portfólio.
  previewIframe.src = project.url;
  if (!previewDialog.open) previewDialog.showModal();
}

document.querySelectorAll('[data-preview]').forEach(button => {
  button.addEventListener('click', () => openProjectPreview(button.dataset.preview));
});
closePreview.addEventListener('click', () => previewDialog.close());
previewDialog.addEventListener('click', event => {
  // O navegador fecha a janela apenas quando a pessoa clica no backdrop.
  if (event.target === previewDialog) previewDialog.close();
});
previewDialog.addEventListener('close', () => previewIframe.removeAttribute('src'));

// Capa de fallback: não mostrar ícones de imagem quebrada nos cards.
document.querySelectorAll('.work-laptop-screen img').forEach(image => {
  const fallback = () => image.closest('.work-card')?.classList.add('image-unavailable');
  image.addEventListener('error', fallback, { once: true });
  if (image.complete && image.naturalWidth === 0) fallback();
});

updateDots(0);
initGoogleAuth(showToast);
