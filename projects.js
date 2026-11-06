/**
 * Projetos de demonstração. Quando um site estiver pronto:
 * - altere title, category, description;
 * - informe uma URL HTTPS em previewUrl para exibi-lo na janela (se permitir iframe);
 * - informe a URL pública em siteUrl para habilitar “Visitar projeto”.
 * Se o site bloquear iframe, prefira uma captura ou um mockup local.
 */
export const projects = [
  {
    id: 'atelier',
    title: 'Atelier Concept',
    category: 'E-COMMERCE / CONCEITO',
    description: 'Uma vitrine editorial de produtos com apresentação sofisticada.',
    previewUrl: null,
    siteUrl: null,
  },
  {
    id: 'aqua',
    title: 'Blue Summer',
    category: 'LOJA DIGITAL / CONCEITO',
    description: 'Uma experiência comercial luminosa, com foco em produtos e navegação.',
    previewUrl: null,
    siteUrl: null,
  },
  {
    id: 'lab',
    title: 'Control Center',
    category: 'DASHBOARD / CONCEITO',
    description: 'Um painel tecnológico com métricas, atividade e organização modular.',
    previewUrl: null,
    siteUrl: null,
  },
];

const atelier = `
  <div class="mock-site mock-site--atelier">
    <div class="mock-nav"><div class="mock-logo"><span class="atelier-nav-symbol">✧</span> MAISON ATELIER</div><div class="mock-links"><span>COLEÇÃO</span><span>ESSÊNCIA</span><span>MENU ☰</span></div></div>
    <div class="atelier-hero">
      <div class="atelier-copy">
        <p class="atelier-kicker">EDIÇÃO ESSENCIAL / 2026</p>
        <h3>Peças para <em>sentir</em> e lembrar.</h3>
        <p class="atelier-desc">Design delicado, detalhes atemporais. Descubra o extraordinário no cotidiano.</p>
        <span class="mock-pill atelier-cta">Explorar coleção ↗</span>
      </div>
      <div class="atelier-scene"><div class="atelier-art"></div><span class="atelier-float">OBJETOS DE DESEJO — Nº 01</span></div>
    </div>
    <div class="atelier-collections"><div class="atelier-collection">Essenciais ↗</div><div class="atelier-collection">Assinaturas ↗</div><div class="atelier-collection">Presenteáveis ↗</div></div>
  </div>`;

const aqua = `
  <div class="mock-site mock-site--aqua">
    <div class="mock-nav"><div class="mock-logo"><span class="aqua-logo-mark">◈</span> ESPAÇO AZUL</div><div class="mock-links"><span>PISCINAS</span><span>PRODUTOS</span><span>CONTATO ↗</span></div></div>
    <div class="aqua-hero">
      <div class="aqua-water"></div><div class="aqua-pool"></div>
      <div class="aqua-copy"><p class="eyeline">O MELHOR DO VERÃO</p><h3>Seu lugar ao sol começa aqui.</h3><p>Produtos e soluções pensados para tornar cada mergulho especial.</p><span class="mock-pill">Ver novidades ↗</span></div>
    </div>
    <div class="aqua-catalog">
      <div class="aqua-product"><div class="aqua-bottle"></div><div><p>Cuidados</p><small>Produtos essenciais</small></div></div>
      <div class="aqua-product"><div class="aqua-bottle"></div><div><p>Tratamento</p><small>Água cristalina</small></div></div>
      <div class="aqua-product"><div class="aqua-bottle"></div><div><p>Acessórios</p><small>Para aproveitar</small></div></div>
    </div>
  </div>`;

const lab = `
  <div class="mock-site mock-site--lab">
    <aside class="lab-sidebar"><div class="lab-brand"><span class="lab-brandmark">⌘</span> AXIOM</div><p class="lab-section-caption">WORKSPACE</p><div class="lab-nav-item is-selected">▤ &nbsp; Overview</div><div class="lab-nav-item">◫ &nbsp; Analytics</div><div class="lab-nav-item">☷ &nbsp; Projects</div><div class="lab-nav-item">⚙ &nbsp; Settings</div></aside>
    <div class="lab-main"><div class="lab-head"><div><small>WORKSPACE / GENERAL</small><h3>Overview<span style="color:#83dcb3">.</span></h3></div><span class="lab-live">● &nbsp; System online</span></div>
      <div class="lab-stats"><div class="lab-stat"><small>Active projects</small><strong>24</strong><span>↗ +12% this month</span></div><div class="lab-stat"><small>Tasks completed</small><strong>1.8k</strong><span>↗ +8.4% this week</span></div><div class="lab-stat"><small>System health</small><strong>99.8<span style="font-size:.45em">%</span></strong><span>● All systems stable</span></div></div>
      <div class="lab-graph"><div class="lab-chart"><p class="lab-chart-title">Activity & performance</p><div class="lab-bars"><i style="--bar-h:39%"></i><i style="--bar-h:64%"></i><i style="--bar-h:51%"></i><i style="--bar-h:82%"></i><i style="--bar-h:73%"></i><i style="--bar-h:95%"></i><i style="--bar-h:72%"></i><i style="--bar-h:86%"></i><i style="--bar-h:66%"></i><i style="--bar-h:91%"></i></div></div><div class="lab-log"><p class="lab-log-title">Recent activity</p><div class="lab-log-row"><b></b> Deploy completed</div><div class="lab-log-row"><b></b> New workspace</div><div class="lab-log-row"><b></b> Sync successful</div><div class="lab-log-row"><b></b> Updates installed</div></div></div>
    </div>
  </div>`;

const mockups = { atelier, aqua, lab };
export function renderMockup(id) { return mockups[id] || ''; }
