# SAITE — portfólio digital

Página inicial estática e responsiva, sem build: `index.html`, `home.css` e `home.js`, com autenticação opcional em `auth.js`. As versões antigas `styles.css`, `app.js` e `projects.js` foram mantidas apenas para histórico e não são carregadas pela página inicial atual.

## Página inicial atual (layout verde e amarelo)

- Header com marca SAITE, **Início**, **Sobre mim**, **Quero fazer um orçamento** e conta Google configurável. No celular, menu retrátil e botão de login compacto.
- Hero com título “Seu negócio merece um site à altura”, CTA de orçamento e ilustração de notebook inteiramente em CSS/SVG, responsiva e sem dependência de imagens pesadas.
- Três cartões de serviços **Essencial**, **Comercial** e **Inteligente**, com preços iniciais de referência e links para `orcamento.html?plano=...` que pré-selecionam o tipo de site no formulário.
- Quatro benefícios, dois projetos reais (**Margot** e **Espaço Piscina**) com cards ilustrativos de laptop e controle de galeria. No mobile, a galeria aceita swipe horizontal.
- Botão **Prévia** de cada projeto abre um diálogo acessível e carrega o site original por iframe apenas sob demanda. Fechar o diálogo descarrega o iframe. O link externo permanece disponível se houver bloqueio de incorporação.
- Banner final para solicitação de orçamento. Layout adaptado a dispositivos móveis e respeita `prefers-reduced-motion`.
- A integração com Firebase permanece pendente se `firebase-config.js` estiver definido como `null`; não há simulação de login.

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

## Auditoria visual: identidade e responsividade

- Paleta da página Sobre mim harmonizada com a página inicial (carvão #0a0c12, painéis #10131c, acento verde suave #b6e7d0), incluindo o símbolo de marca.
- Em monitores de altura insuficiente, a página rola em vez de cortar texto do hero ou ultrapassar o contêiner das visões. Tela única apenas em desktops com altura suficiente.
- A imagem do Espaço Piscina usa o destaque do próprio site e tem fallback visual caso uma imagem remota falhe.
- Estrutura do currículo de TI, estudos de caso e ações dos botões mantidas.

## Ajustes de apresentação

- A página Sobre mim exibe **Kaio Fellipe** no título e mantém somente **Início / Sobre mim** na navegação superior. O nome completo permanece no currículo formal.
- O projeto demonstrativo Control Center foi removido do catálogo e de seu mockup; há somente os dois projetos reais no carrossel.
- A contagem e a perspectiva foram adaptadas para dois cards, mantendo arraste, roda do mouse, setas, autoplay e prévias reais.

## Solicitação de orçamento por e-mail

- Botão **Quero fazer um orçamento** ao lado de `Sobre mim` na página inicial e na navegação de `sobre.html`.
- Nova rota `/orcamento.html`, com três informações obrigatórias: e-mail de contato, escolha de um dos **três tipos de site** (Básico, Profissional, Avançado) e descrição dos serviços/produtos da empresa.
- Campo de observações e perguntas **opcional**. Validação de HTML5 antes do POST.
- O formulário faz POST por HTTPS para `https://formsubmit.co/elgator833@gmail.com` e usa reCAPTCHA do serviço, honeypot, assunto identificando SAITE e resposta ao e-mail informado.
- **ATIVAÇÃO NECESSÁRIA:** o FormSubmit envia uma mensagem de confirmação ao endereço destinatário no primeiro envio. O proprietário deve clicar no link de ativação. Não afirmar que os e-mails estão chegando antes de confirmar e testar.
- Rota `orcamento-recebido.html` explica que a solicitação foi encaminhada para processamento, sem prometer entrega direta ao inbox.
- O serviço é terceirizado: não existe armazenamento de solicitações no GitHub Pages; informar aos clientes que os dados serão encaminhados ao FormSubmit. Não solicitar dados sensíveis.
- Não foram implementados e-mails falsos de teste e nenhuma mensagem foi enviada durante a implantação.

## Página de orçamento — Proposta 02 (layout comercial)

- `orcamento.html` apresenta um hero com ilustração de interface leve em CSS, três planos selecionáveis lado a lado no desktop e formulário em destaque abaixo; no celular, os cards e campos ficam em uma coluna.
- Identidade alinhada às demais páginas SAITE: carvão `#0a0c12`, painéis `#10131c`, verde menta `#b6e7d0`, tipografia Space Grotesk + DM Sans.
- Planos **Essencial** (a partir de R$ 100), **Comercial** (R$ 250) e **Inteligente** (R$ 500): preços referenciais, sujeitos ao escopo, sem prometer painel, bot ou API sem contratação separada.
- Clicar no card atualiza o `select` obrigatório no formulário; selecionar no formulário também atualiza o card. Nenhum plano é escolhido automaticamente, exceto via parâmetro `?plano=...`.
- Campos obrigatórios: e-mail, tipo de site e serviços/produtos da empresa. Observações permanecem opcionais; validação nativa de e-mail, minlength e obrigatoriedade.
- Formulário mantém POST tradicional HTTPS ao FormSubmit para `elgator833@gmail.com`, honeypot e configuração de retorno. Não existe envio AJAX nem confirmação falsa: a ativação do destinatário e um teste real de entrega são necessários.
- A página `orcamento-recebido.html` usa a mesma folha `orcamento.css` e foi preservada.

## Nota de manutenção — versão anterior

As seções antigas deste README sobre carrossel 3D, blur do preview e `projects.js` descrevem o layout anterior, mantido no histórico do repositório para eventual consulta. Não fazem parte da página inicial atual, que usa `home.js` e `home.css`.
