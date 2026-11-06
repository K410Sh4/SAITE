/**
 * Catálogo do portfólio: dois projetos reais e um conceito demonstrativo.
 * Imagens de capa pertencem aos próprios repositórios públicos do usuário.
 * Os sites completos só são carregados no preview quando ele está visível.
 */
export const projects = [
  {
    id: 'margot',
    title: 'Margot Acessórios',
    category: 'E-COMMERCE / ACESSÓRIOS',
    description: 'Loja digital de acessórios femininos com catálogo, identidade delicada e experiência de compra.',
    previewUrl: 'https://k410sh4.github.io/Margot/',
    siteUrl: 'https://k410sh4.github.io/Margot/',
  },
  {
    id: 'espaco-piscinas',
    title: 'Espaço Piscina',
    category: 'SITE COMERCIAL / PISCINAS',
    description: 'Site comercial da Espaço Piscina, em Alfenas (MG), com produtos, atendimento e orientações para clientes.',
    previewUrl: 'https://k410sh4.github.io/EspacoPiscinas/',
    siteUrl: 'https://k410sh4.github.io/EspacoPiscinas/',
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

const margot = `
  <div class="mock-site real-mock real-mock--margot">
    <div class="real-mock-nav">
      <div class="real-mock-brand"><img src="https://k410sh4.github.io/Margot/assets/margot-logo.webp" alt="" loading="lazy" decoding="async" /><span>MARGOT</span></div>
      <span class="real-mock-nav-links">COLEÇÃO &nbsp; PRESENTES &nbsp; SOBRE</span>
    </div>
    <div class="real-mock-stage">
      <div class="real-mock-copy">
        <span class="real-mock-kicker">ESSENCIAIS COM AFETO</span>
        <h3>Delicadeza em cada detalhe.</h3>
        <p>Acessórios para acompanhar cada momento.</p>
        <span class="real-mock-pill">Explorar coleção ↗</span>
      </div>
      <div class="real-mock-media"><img src="https://k410sh4.github.io/Margot/assets/hero-1.webp" alt="Imagem do catálogo visual da Margot" loading="lazy" decoding="async" /></div>
    </div>
    <div class="real-mock-footer"><span>BRINCOS</span><span>COLARES</span><span>PRESENTES</span></div>
  </div>`;

const piscina = `
  <div class="mock-site real-mock real-mock--piscina">
    <div class="real-mock-nav">
      <div class="real-mock-brand"><img src="https://k410sh4.github.io/EspacoPiscinas/assets/espaco-piscina-logo.svg" alt="" loading="lazy" decoding="async" /><span>ESPAÇO PISCINA</span></div>
      <span class="real-mock-nav-links">PRODUTOS &nbsp; ATENDIMENTO</span>
    </div>
    <div class="real-mock-stage">
      <div class="real-mock-copy">
        <span class="real-mock-kicker">ALFENAS · MINAS GERAIS</span>
        <h3>Sua piscina bem cuidada.</h3>
        <p>Produtos e soluções para cada mergulho.</p>
        <span class="real-mock-pill">Conhecer produtos ↗</span>
      </div>
      <div class="real-mock-media"><img src="https://k410sh4.github.io/EspacoPiscinas/assets/problemas/ph-alto.webp" alt="Imagem ilustrativa de piscina usada no site Espaço Piscina" loading="lazy" decoding="async" /></div>
    </div>
    <div class="real-mock-footer"><span>TRATAMENTO</span><span>PISCINAS</span><span>SUPORTE</span></div>
  </div>`;

const lab = `
  <div class="mock-site mock-site--lab">
    <aside class="lab-sidebar"><div class="lab-brand"><span class="lab-brandmark">⌘</span> AXIOM</div><p class="lab-section-caption">WORKSPACE</p><div class="lab-nav-item is-selected">▤ &nbsp; Overview</div><div class="lab-nav-item">◫ &nbsp; Analytics</div><div class="lab-nav-item">☷ &nbsp; Projects</div><div class="lab-nav-item">⚙ &nbsp; Settings</div></aside>
    <div class="lab-main"><div class="lab-head"><div><small>WORKSPACE / GENERAL</small><h3>Overview<span style="color:#83dcb3">.</span></h3></div><span class="lab-live">● &nbsp; System online</span></div>
      <div class="lab-stats"><div class="lab-stat"><small>Active projects</small><strong>24</strong><span>↗ +12% this month</span></div><div class="lab-stat"><small>Tasks completed</small><strong>1.8k</strong><span>↗ +8.4% this week</span></div><div class="lab-stat"><small>System health</small><strong>99.8<span style="font-size:.45em">%</span></strong><span>● All systems stable</span></div></div>
      <div class="lab-graph"><div class="lab-chart"><p class="lab-chart-title">Activity & performance</p><div class="lab-bars"><i style="--bar-h:39%"></i><i style="--bar-h:64%"></i><i style="--bar-h:51%"></i><i style="--bar-h:82%"></i><i style="--bar-h:73%"></i><i style="--bar-h:95%"></i><i style="--bar-h:72%"></i><i style="--bar-h:86%"></i><i style="--bar-h:66%"></i><i style="--bar-h:91%"></i></div></div><div class="lab-log"><p class="lab-log-title">Recent activity</p><div class="lab-log-row"><b></b> Deploy completed</div><div class="lab-log-row"><b></b> New workspace</div><div class="lab-log-row"><b></b> Sync successful</div><div class="lab-log-row"><b></b> Updates installed</div></div></div>
    </div>
  </div>`;


const mockups = { margot, 'espaco-piscinas': piscina, lab };
export function renderMockup(id) { return mockups[id] || ''; }
