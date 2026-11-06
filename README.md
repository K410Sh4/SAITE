# SAITE — portfólio digital

Página inicial estática, responsiva e sem build: `index.html`, `styles.css`, `app.js`, `projects.js` e `auth.js`.

## Recursos

- Header compacto (5–10% de altura) com marca à esquerda, **Sobre** e conta Google à direita.
- Carrossel 3D em **perspectiva de profundidade**: card próximo e grande à esquerda, intermediário ao centro, distante e pequeno à direita. Navegação por arraste horizontal com dedo ou mouse, roda do mouse e trackpad, setas, teclado, autoplay e `prefers-reduced-motion`. A rolagem vertical da página continua disponível.
- Área de preview ampla abaixo do carrossel. A troca de projeto aplica blur diretamente a todos os blocos da prévia (título, descrição, moldura, conteúdo e rodapé), com substituição sincronizada no pico do desfoque.
- Projetos reais **Margot Acessórios** e **Espaço Piscina** nas duas primeiras posições, com capas leves usando imagens dos próprios sites; terceiro card preservado como conceito Control Center.
- Login Google com Firebase Authentication, visualização do perfil e logout **assim que configurado**.

## Publicar no GitHub Pages

1. No repositório `K410Sh4/SAITE`, abra **Settings → Pages**.
2. Em **Build and deployment**, selecione **Deploy from a branch**.
3. Escolha `main`, pasta `/(root)`, e **Save**.
4. O endereço esperado, após publicação pelo GitHub, é `https://k410sh4.github.io/SAITE/`.

Não é necessário Node, Vite, npm ou servidor de backend para renderizar o portfólio. Para testar localmente módulos JavaScript, rode um servidor HTTP (`python -m http.server 8000`) e abra `http://localhost:8000`.

## Ativar login Google

A interface está implementada, mas **o login real não funciona até configurar o Firebase**. Não há autenticação simulada.

1. Crie ou escolha um projeto em [Firebase Console](https://console.firebase.google.com/).
2. Registre um **aplicativo Web** e copie o objeto `firebaseConfig` exibido na área de configurações do projeto.
3. Em **Authentication → Sign-in method**, habilite **Google** e configure o e-mail de suporte solicitado.
4. Em **Authentication → Settings → Authorized domains**, inclua **`k410sh4.github.io`**. Para testes, autorize o domínio de desenvolvimento necessário.
5. Edite `firebase-config.js`, substituindo `null` pelo objeto público gerado no console (incluindo `apiKey`, `authDomain`, `projectId` e `appId`).
6. Atualize o site: a ação **Entrar com Google** usará uma janela real de autenticação e o perfil aparecerá no header após o login.

> O objeto de configuração do aplicativo Web é público por natureza. **Nunca** inclua credenciais de serviço (private keys, tokens de acesso, JSON de service account) no GitHub. Controle acesso a dados privados pelas regras do Firebase.

## Colocar seus sites reais nos cards

Edite o array `projects` em `projects.js`. Cada projeto tem:

```js
{
  id: 'atelier',             // Identificador do mockup local
  title: 'Meu site',         // Nome no card e no preview
  category: 'SITE / LOJA',  // Etiqueta
  description: 'Resumo...',  // Descrição na área de preview
  previewUrl: 'https://meusite.example/', // Opcional: iframe da página
  siteUrl: 'https://meusite.example/',    // Opcional: botão "Visitar projeto"
}
```

Se uma página proibir exibição em `iframe` com `X-Frame-Options` ou `Content-Security-Policy`, ela **não aparecerá dentro do preview**. Nesse caso, personalize `renderMockup` em `projects.js` ou use uma imagem capturada do site. Não é possível contornar esse bloqueio no GitHub Pages.

Para mudar a marca de texto, edite `.brand` em `index.html`. O favicon está em `favicon.svg`.

## Desempenho e adaptação visual

- O carrossel para de avançar quando fica fora da tela e quando a aba não está ativa.
- O blur da prévia só é processado quando a seção está visível. No celular mantém o efeito com 6px e duração de 320ms; no desktop preserva o blur original.
- Conteúdo das prévias HTML é reutilizado entre trocas, sem reconstruir todo o DOM.
- Removidos filtros contínuos de cor e sombras animadas nos cards; `will-change` é ativado apenas durante o movimento.
- A área grande de preview utiliza `content-visibility: auto`, permitindo ao navegador evitar renderização fora da tela.

As melhorias reduzem trabalho desnecessário, mas FPS, consumo de energia e memória reais devem ser medidos no dispositivo para confirmação quantitativa.

## Sites reais incorporados no preview

- Margot: https://k410sh4.github.io/Margot/
- Espaço Piscina: https://k410sh4.github.io/EspacoPiscinas/
- Os cards usam imagens leves e estáticas, sem abrir as páginas completas dentro do carrossel.
- Quando a seção de preview aparece na tela, carrega somente o iframe do projeto selecionado; ao sair da seção, volta à capa estática para reduzir trabalho de CPU/GPU, especialmente no celular.
- O botão **Visitar projeto** permite abrir a página completa caso o navegador ou o site bloqueie a incorporação em iframe.
- Uma prévia incorporada pode executar recursos do próprio site (ex.: GSAP). A carga é feita sob demanda, não ao navegar no carrossel.

## Gestos do carrossel

- Celular: arrastar horizontalmente para a esquerda/direita muda o projeto; arrastar verticalmente continua rolando a página.
- Computador: clicar e arrastar com o botão esquerdo, usar a roda do mouse sobre o carrossel ou fazer scroll horizontal pelo trackpad.
- Uma rotação da roda não captura a rolagem indefinidamente: apenas o evento que alterna o card é consumido, com intervalo mínimo entre mudanças.
- Toques curtos continuam selecionando um card diretamente, e arrastes não disparam cliques acidentais.

## Página Sobre mim — modo imersivo, responsivo e currículo de TI

- **Rota:** `./sobre.html` (o link do cabeçalho principal foi mantido).
- Inspirado no conceito de uma tela compacta com hero editorial, **Visão cliente / Visão técnica** interativa, montagem de site em quatro etapas, projetos contados como histórias e currículo de TI.
- Em desktops de pelo menos 1281px de largura e 690px de altura, o layout usa a altura disponível da viewport, sem forçar rolagem para acessar os painéis principais. Em janelas pequenas, permite rolagem para não esconder informação.
- No celular, os painéis se reorganizam em uma coluna; cards, botões e etapas recebem áreas confortáveis de toque.
- A foto de uma pessoa exibida na imagem conceitual **não** é usada como fotografia do autor: a capa emprega arte de interface construída em CSS. As imagens dos cases vêm dos repositórios de origem.
- A visão escolhida altera título/explicação e destaca o painel correspondente. As histórias mostram objetivos, decisões e entrega verificável, sem inventar métricas comerciais.
- Currículo completo disponível em modal acessível, com impressão A4. **Somente a versão de Suporte Técnico e Infraestrutura** aparece. Não foram incluídas outras experiências excluídas pelo usuário.
- GSAP para entradas pontuais, sem filtros pesados, efeitos infinitos ou animações forçadas de rolagem. Funciona também sem carregar a biblioteca e respeita `prefers-reduced-motion`.
