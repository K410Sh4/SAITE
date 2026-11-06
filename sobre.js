(() => {
  'use strict';

  const viewButtons = [...document.querySelectorAll('[data-mode]')];
  const heroSlogan = document.getElementById('heroSlogan');
  const heroSummary = document.getElementById('heroSummary');
  const stageContainer = document.querySelector('.assembly');
  const stageButtons = [...document.querySelectorAll('[data-step]')];
  const storyDialog = document.getElementById('storyDialog');
  const resumeDialog = document.getElementById('resumeDialog');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const gsap = window.gsap;

  const copy = {
    cliente: {
      slogan: 'Transformo problemas em <em>soluções digitais.</em>',
      summary: 'Sou técnico em Informática, atuo com suporte autônomo e desenvolvo sites. Minha proposta é combinar organização, tecnologia e experiência de uso para criar soluções que façam sentido.',
    },
    tecnica: {
      slogan: 'Investigo sistemas. <em>Desenvolvo interfaces.</em>',
      summary: 'Minha formação em Informática e experiência com suporte orientam meu cuidado com estrutura, navegação, responsividade, manutenção e testes de páginas web.',
    },
  };

  function selectView(mode) {
    if (!Object.hasOwn(copy, mode)) return;
    document.body.dataset.view = mode;
    for (const button of viewButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    }
    // Conteúdo editorial controlado: não recebe HTML do visitante.
    heroSlogan.innerHTML = copy[mode].slogan;
    heroSummary.textContent = copy[mode].summary;
  }

  viewButtons.forEach(button => button.addEventListener('click', () => selectView(button.dataset.mode)));
  selectView('cliente');

  function showStage(step) {
    if (!Number.isInteger(step) || step < 0 || step >= stageButtons.length) return;
    stageContainer.dataset.stage = String(step);
    for (const button of stageButtons) {
      button.setAttribute('aria-pressed', String(Number(button.dataset.step) === step));
    }
  }

  stageButtons.forEach(button => button.addEventListener('click', () => showStage(Number(button.dataset.step))));
  showStage(0);

  let buildPlayed = false;
  function playBuildOnce() {
    if (buildPlayed) return;
    buildPlayed = true;
    if (reduced.matches) { showStage(3); return; }
    // Só quatro estados. Nenhuma animação permanente em GPU.
    [1, 2, 3].forEach((step, index) => window.setTimeout(() => {
      if (!document.hidden) showStage(step);
      else if (step === 3) showStage(3);
    }, 650 * (index + 1)));
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          playBuildOnce();
          observer.disconnect();
          break;
        }
      }
    }, { threshold: 0.08 });
    observer.observe(stageContainer);
  } else {
    playBuildOnce();
  }

  const caseData = {
    margot: {
      title: 'Margot Acessórios',
      tag: 'LOJA DIGITAL • ACESSÓRIOS',
      intro: 'Um projeto autoral de loja virtual de acessórios femininos. Os detalhes abaixo descrevem objetivos de interface e recursos presentes no trabalho, sem atribuir resultados comerciais não medidos.',
      url: 'https://k410sh4.github.io/Margot/',
      sections: [
        ['Objetivo', 'Apresentar acessórios em um catálogo visual organizado, com identidade delicada e navegação simples.'],
        ['Decisões de interface', 'Apostar em cards de produtos, categorias, páginas de detalhes e uma sacola acessível.'],
        ['Entrega verificável', 'Um site público com catálogo e recursos de navegação, que pode ser explorado diretamente pelo link.'],
      ],
    },
    piscina: {
      title: 'Espaço Piscina',
      tag: 'SITE COMERCIAL • ALFENAS, MG',
      intro: 'Um site comercial para apresentar produtos, informações e opções de contato relacionadas a piscinas. Os resultados de vendas ou acesso não são estimados.',
      url: 'https://k410sh4.github.io/EspacoPiscinas/',
      sections: [
        ['Objetivo', 'Organizar produtos e orientações em uma presença digital com acesso fácil às informações.'],
        ['Decisões de interface', 'Catálogo, navegação responsiva, identidade visual e caminhos de contato mais diretos.'],
        ['Entrega verificável', 'Página pública disponível para consultar produtos, navegação e conteúdo.'],
      ],
    },
  };

  function openModal(dialog) {
    if (!dialog || dialog.open) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closeModal(dialog) {
    if (!dialog?.open) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  document.querySelectorAll('[data-story]').forEach(button => {
    button.addEventListener('click', () => {
      const data = caseData[button.dataset.story];
      if (!data) return;
      document.getElementById('storyTitle').textContent = data.title;
      document.getElementById('storyTag').textContent = data.tag;
      document.getElementById('storyIntro').textContent = data.intro;
      const container = document.getElementById('storySections');
      container.replaceChildren(...data.sections.map(([title, description], index) => {
        const article = document.createElement('article');
        const h3 = document.createElement('h3');
        h3.textContent = '0' + (index + 1) + ' / ' + title;
        const p = document.createElement('p');
        p.textContent = description;
        article.append(h3, p);
        return article;
      }));
      document.getElementById('storyVisit').href = data.url;
      openModal(storyDialog);
    });
  });

  document.querySelectorAll('[data-open-resume]').forEach(button =>
    button.addEventListener('click', () => openModal(resumeDialog))
  );

  document.querySelectorAll('[data-close-modal]').forEach(button =>
    button.addEventListener('click', () => closeModal(button.closest('dialog')))
  );

  for (const dialog of [storyDialog, resumeDialog]) {
    dialog?.addEventListener('click', event => {
      if (event.target === dialog) closeModal(dialog);
    });
  }

  document.getElementById('printResume')?.addEventListener('click', () => {
    // A folha @media print contém somente o currículo de TI.
    window.print();
  });

  // Fallback para imagens externas indisponíveis.
  for (const image of document.querySelectorAll('.case-photo img')) {
    const showFallback = () => {
      image.hidden = true;
      image.closest('.case-photo')?.classList.add('image-unavailable');
    };
    image.addEventListener('error', showFallback, { once: true });
    if (image.complete && image.naturalWidth === 0) showFallback();
  }

  if (reduced.matches || !gsap) return;
  // Entrada discreta: opacity/transform, uma vez, sem paralaxe nem blur.
  const items = document.querySelectorAll('.hero-inner > *, .lens-head, .lens-card');
  gsap.from(items, {
    autoAlpha: 0,
    y: 12,
    duration: 0.48,
    stagger: 0.045,
    ease: 'power2.out',
    clearProps: 'all'
  });
  // As seções mobile entram apenas quando visíveis, sem rolagem animada forçada.
  if (window.matchMedia('(max-width: 1150px)').matches && 'IntersectionObserver' in window) {
    const observed = document.querySelectorAll('.assembly-copy, .portfolio-intro, .case-card, .resume-tile, .value-strip');
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        revealObserver.unobserve(entry.target);
        gsap.from(entry.target, { autoAlpha: 0, y: 14, duration: 0.48, ease: 'power2.out', clearProps: 'all' });
      });
    }, { threshold: 0.08 });
    observed.forEach(el => revealObserver.observe(el));
  }
})();
