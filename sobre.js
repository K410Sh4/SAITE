(() => {
  'use strict';
  const printButton = document.getElementById('printResume');
  printButton?.addEventListener('click', () => {
    if (typeof window.print === 'function') window.print();
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const gsap = window.gsap;
  // O conteúdo é visível por padrão; falha do CDN nunca deixa a página invisível.
  if (!gsap || reduceMotion.matches) return;

  const smallScreen = window.matchMedia('(max-width: 760px)').matches;
  const travel = smallScreen ? 16 : 32;
  const duration = smallScreen ? .62 : .85;

  // Entrada curta, sem loops, blur animado nem GSAP scrub durante a rolagem.
  gsap.from('.hero-enter', {
    opacity: 0,
    y: travel,
    duration,
    ease: 'power2.out',
    stagger: smallScreen ? .055 : .09,
    clearProps: 'opacity,transform',
  });

  // ScrollTrigger é opcional: se não carregar, o HTML continua visível.
  const ScrollTrigger = window.ScrollTrigger;
  if (!ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const revealElements = gsap.utils.toArray('[data-reveal]');
  revealElements.forEach((element) => {
    gsap.from(element, {
      opacity: 0,
      y: travel,
      duration,
      ease: 'power2.out',
      clearProps: 'opacity,transform',
      scrollTrigger: {
        trigger: element,
        start: 'top 90%',
        once: true,
      },
    });
  });

  // Deixe o navegador economizar recursos quando a aba não estiver visível.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) gsap.globalTimeline.pause();
    else gsap.globalTimeline.resume();
  });

  window.addEventListener('beforeprint', () => {
    gsap.set('.hero-enter, [data-reveal]', { clearProps: 'all' });
  });
})();
