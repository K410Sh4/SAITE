/**
 * Catálogo do portfólio: somente dois projetos reais.
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

const mockups = { margot, 'espaco-piscinas': piscina };
export function renderMockup(id) { return mockups[id] || ''; }
