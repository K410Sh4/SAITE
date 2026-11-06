# SAITE — portfólio digital

Página inicial estática, responsiva e sem build: `index.html`, `styles.css`, `app.js`, `projects.js` e `auth.js`.

## Recursos

- Header compacto (5–10% de altura) com marca à esquerda, **Sobre** e conta Google à direita.
- Carrossel 3D com **3 cards** e progressão suave em perspectiva, com navegação, pausa no hover/foco, setas do teclado e suporte a `prefers-reduced-motion`.
- Área de preview ampla abaixo do carrossel. A troca de projeto aplica blur diretamente a todos os blocos da prévia (título, descrição, moldura, conteúdo e rodapé), com substituição sincronizada no pico do desfoque.
- Três conceitos visuais construídos em HTML/CSS, sem imagens externas: loja editorial, loja aquática e painel de administração.
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
