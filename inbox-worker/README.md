# Instalação guiada no Windows (caminho recomendado)

No PowerShell, na pasta `SAITE`, execute o instalador preparado no repositório:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\setup-inbox.ps1 -Etapa Preparar
```

Depois de obter a URL `https://saite-inbox.SUA-CONTA.workers.dev`, crie o cliente OAuth Web do Google autorizando **exatamente essa origem** e um widget Turnstile permitindo `k410sh4.github.io`. Para registrar os identificadores e secrets no servidor:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\setup-inbox.ps1 -Etapa Ativar
```

O script roda testes, cria/identifica o D1, aplica migrações e publica o Worker; a segunda etapa coleta identificadores públicos e pede os segredos diretamente ao Wrangler. Não informe chaves secretas no chat.

**Atenção:** A segunda etapa escreve uma configuração pública local, mas não a publica no GitHub automaticamente. Primeiro teste o login Google no painel do Worker. A mudança dos formulários de produção só deve acontecer após um pedido de teste confirmado.

---

# SAITE — Central privada de pedidos e notificações

O projeto está preparado para receber solicitações de SAITE, Margot e Espaço Piscina, armazenar no Cloudflare D1 e disponibilizar a caixa de entrada **somente após login Google verificado no Worker**. Ao clicar em "Responder pelo Gmail", a central abre o Gmail com o endereço do cliente preenchido. Ela **não envia mensagens automaticamente**.

## Importante antes de começar

**O código está preparado, mas o serviço não está ativo.** A página `/contato.html` não aceita envios enquanto `inbox-public-config.js` estiver sem configuração, e os formulários antigos continuam operando até a substituição controlada. Não publique chaves secretas, e-mails administrativos, senhas nem tokens em arquivos do GitHub.

O painel do administrador fica na própria origem do Worker (`https://saite-inbox.<conta>.workers.dev/admin.html`). Isso o isola de scripts dos sites públicos compartilhados em `k410sh4.github.io`.

## Configuração inicial (Windows/PowerShell)

1. Abra o terminal na pasta do repositório e sincronize o código:

```powershell
cd "$HOME\SAITE"
git pull origin main
cd inbox-worker
npx wrangler login
npx wrangler d1 create saite-inbox-db
```

2. Copie o `database_id` informado no terminal para `inbox-worker/wrangler.jsonc`, substituindo `PREENCHA_O_UUID_D1`. Não use o banco de outro projeto.
3. No Google Cloud Console, crie um **OAuth Client ID para aplicativo Web**. Configure a origem JavaScript autorizada do domínio do Worker gerado após o primeiro deploy (exemplo `https://saite-inbox.<conta>.workers.dev`; não acrescente caminho). Coloque o Client ID público em `wrangler.jsonc` no campo `GOOGLE_CLIENT_ID`. A credencial `client secret` do OAuth não é usada pelo navegador e não deve ser publicada.
4. No Cloudflare Turnstile, crie um widget para hostname `k410sh4.github.io`. Guarde a **site key** pública para o frontend; mantenha a **secret key** só no Worker.
5. Adicione os três secrets do Worker (Wrangler solicitará os valores de forma interativa):

```powershell
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put HASH_SALT
```

`ADMIN_EMAIL` identifica a conta Google que pode acessar a caixa (valor inserido no prompt, nunca no código). Use um valor aleatório longo e exclusivo para `HASH_SALT` (por exemplo, uma sequência criptograficamente aleatória com 32+ bytes). Opcionalmente, adicione `ADMIN_GOOGLE_SUB` com o identificador fixo `sub` da sua conta Google para restringir ainda mais a autorização; ele também deve ser mantido em secret. A conta Google precisa estar com a verificação em duas etapas habilitada.

6. Aplique as migrações e publique:

```powershell
npx wrangler d1 migrations apply saite-inbox-db --remote
npx wrangler deploy
```

7. Abra `https://saite-inbox.<conta>.workers.dev/api/health`. O campo `ready` deve ser `true`. Teste login em `/admin.html` com sua conta autorizada e confirme que outra conta Google **não** recebe pedidos.

## Ativação do formulário público

Edite `SAITE/inbox-public-config.js` **somente depois** de confirmar o backend:

```js
window.SAITE_INBOX_PUBLIC_CONFIG = Object.freeze({
  apiBase: 'https://saite-inbox.<conta>.workers.dev',
  turnstileSiteKey: '0xSUA_SITE_KEY_PUBLICA'
});
```

Publique o site. Teste `https://k410sh4.github.io/SAITE/contato.html` com um envio real autorizado e confirme que aparece na central. Faça um teste de e-mail de resposta pelo Gmail. Verifique também que requisições sem Turnstile, com origem inválida e sem credenciais administrativas não conseguem acessar dados.

**Só depois dos testes:**
- Substitua a ação do formulário antigo de `orcamento.html` pelo fluxo `contato.html?origem=saite`, removendo totalmente a URL antiga do FormSubmit.
- Troque o botão de pedido da Margot para a central alterando `USE_SAITE_PRIVATE_INBOX` para `true` em `Margot/store.js`. Na mesma atualização, remova a constante do telefone pessoal e qualquer outro link público ao número que não seja mais necessário.
- No Espaço Piscina, altere `USE_SAITE_PRIVATE_INBOX` para `true` em `EspacoPiscinas/app.js`. Isso direciona **orçamentos e pedidos** à central; a página de avaliações e os dados de contato **comercial** permanecem separados e devem ser revisados à parte.
- Atualize avisos de privacidade e links em todas as páginas para refletir o novo meio de contato.
- Confirme que o histórico público do GitHub e cópias em buscadores podem continuar contendo contatos anteriormente publicados. Considere usar um endereço administrativo novo e exclusivo.

## Fluxo final

1. Cliente acessa formulário no site e informa nome, e-mail, assunto e mensagem.
2. Turnstile gera token; o Worker verifica o token com a API oficial, valida os campos, limita frequência e registra o pedido em D1.
3. O administrador abre a central privada, faz login Google e consulta os pedidos. O token Google é verificado criptograficamente em cada chamada ao backend.
4. Ao selecionar **Responder pelo Gmail**, abre-se um rascunho destinado ao e-mail informado pelo cliente, usando a conta Gmail em que o administrador estiver conectado.
5. O administrador envia e marca o pedido como respondido na central. Nenhum envio é feito automaticamente.

## Notas de segurança e privacidade

- **Digitar um e-mail não comprova propriedade desse endereço.** O sistema valida sintaxe e aplica proteção contra robôs, mas não verifica a posse da caixa. Para isso, implemente confirmação de e-mail via serviço de envio transacional, se necessário.
- O e-mail pessoal do administrador **não aparece no novo formulário ou banco público**. Quando você enviar uma resposta pelo seu próprio Gmail, seu endereço de remetente será revelado àquele destinatário. Use um e-mail comercial separado se quiser preservar o endereço pessoal até dos clientes atendidos.
- D1 guarda os dados somente na tabela privada. Uma tarefa diária exclui pedidos com mais de 180 dias; adapte a retenção à política de privacidade e às obrigações aplicáveis.
- Turnstile não substitui regras de firewall de aplicação (WAF), limites de infraestrutura ou monitoramento. Configure rate limiting de borda e alertas de consumo no Cloudflare.
- Se os scripts de terceiros dos sites públicos forem comprometidos, a experiência do visitante ainda pode sofrer adulteração; o painel separado limita a exposição de dados administrativos.
- Nunca trate `mailto:` ou o Gmail como envio automático nem marque como respondido sem confirmação sua.

## Arquivos principais

- `src/index.js`: Worker com validação, D1, Google OIDC e API administrativa.
- `migrations/0001_requests.sql`: tabelas D1.
- `public/admin.html`, `admin.css`, `admin.js`: painel privado servido na origem do Worker.
- `../contato.html`, `../contato.js`, `../inbox-public-config.js`: formulário público em estágio seguro, não habilitado sem configuração.
- `../pedidos.html`: porta de entrada para a central no SAITE.
