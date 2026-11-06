(() => {
  'use strict';
  const tabs = [...document.querySelectorAll('[data-select]')];
  const panels = [...document.querySelectorAll('[data-resume]')];
  const supported = new Set(['ti', 'atendimento', 'geral']);
  function choose(id, focus = false) {
    if (!supported.has(id)) id = 'ti';
    for (const tab of tabs) {
      const selected = tab.dataset.select === id;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (focus && selected) tab.focus();
    }
    for (const panel of panels) panel.hidden = panel.dataset.resume !== id;
  }
  const fromHash = () => decodeURIComponent(location.hash.slice(1)).replace(/^curriculo-/, '');
  choose(fromHash());
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      choose(tab.dataset.select);
      history.replaceState(null, '', '#curriculo-' + tab.dataset.select);
    });
    tab.addEventListener('keydown', (event) => {
      const key = event.key;
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(key)) return;
      event.preventDefault();
      const next = key === 'Home' ? 0 : key === 'End' ? tabs.length - 1 :
        (index + (key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      choose(tabs[next].dataset.select, true);
      history.replaceState(null, '', '#curriculo-' + tabs[next].dataset.select);
    });
  });
  window.addEventListener('hashchange', () => choose(fromHash()));
  document.querySelector('#printResume')?.addEventListener('click', () => window.print());
})();