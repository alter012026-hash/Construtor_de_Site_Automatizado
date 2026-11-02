# Construtor de Sites Automatizados

Hub central para planejar, criar e administrar sites editoriais de nichos diferentes. Cada projeto tem identidade, regras editoriais, módulos e pasta de conteúdo próprios. Os sites públicos são servidos em subpastas no formato `/sites/identificador`.

## Começar

Requisitos: Node.js 20 ou superior e npm.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Abra `http://localhost:3000` para ver o hub e a biblioteca de guias. Para acessar `/admin`, defina `ADMIN_PASSWORD` em `.env.local`. Chaves de IA, newsletter, GitHub e Redis são opcionais para executar o site; configure somente os serviços que utilizar.

## Criar e administrar sites

1. Abra **Admin → Sites do hub → Criar novo site**.
2. Siga o assistente para definir identidade, endereço, público, voz editorial, categorias, pautas, regras, fontes, módulos, SEO e monetização.
3. Revise o resumo. Salve como oculto para continuar configurando, ou deixe visível para publicar no catálogo público.
4. Abra **/guias** para consultar os roteiros de planejamento, produção, revisão e lançamento.

O catálogo e os perfis ficam em `data/sites.json`; o projeto inicial Descomplica Bula continua em `data/site-profile.json` para compatibilidade. Cada novo site recebe uma pasta `posts/<identificador>` e aparece em `/sites/<identificador>`. Ocultar um site remove sua página do acesso público e do catálogo, mas preserva seu perfil e arquivos.

Em desenvolvimento, alterações são gravadas nos arquivos locais. Em produção Vercel, salvar um perfil ou alterar a visibilidade grava `data/sites.json` no GitHub e inicia um novo deploy; configure `GITHUB_TOKEN` e `GITHUB_REPO` com permissão de escrita. Para geração editorial, filas, assinaturas e logs, os estados de cada nicho ficam separados em `.editorial-state/<identificador>/`.

O módulo **Conteúdo de saúde** é opcional e conserva salvaguardas específicas. Ative-o somente em um projeto de saúde e configure fontes permitidas. Antes de lançar qualquer nicho, revise páginas institucionais, política de privacidade e informações de contato para refletirem as práticas reais do projeto.

## Automações em produção

O deploy de produção já é feito pela integração nativa Vercel-GitHub a cada push na branch `main`; não precisa de `VERCEL_DEPLOY_HOOK`. Os workflows agendados rodam no GitHub Actions, então cadastre os valores em **Settings → Secrets and variables → Actions** no repositório, e não em arquivos do Git.

| Automação | Variáveis na Vercel | GitHub Actions secrets | Observações |
| --- | --- | --- | --- |
| Admin (`/admin`) | `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | — | Defina uma senha forte e gere um segredo aleatório. |
| Resumo da bula | `GROQ_API_KEY` ou `GEMINI_API_KEY` | — | O usuário baixa a bula no Bulário da Anvisa e envia o PDF; a API extrai o texto e o envia ao serviço de IA. O Groq é tentado primeiro; Gemini é usado como fallback. Configure pelo menos uma chave na Vercel. |
| Rascunhos diários com IA | Uma chave: `GROK_API_KEY`, `GROQ_API_KEY`, `CEREBRAS_API_KEY`, `OPENROUTER_API_KEY` ou `GEMINI_API_KEY` | A mesma chave, com o mesmo nome | O workflow gera rascunhos para revisão; não publica artigos automaticamente. |
| Newsletter diária | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEWSLETTER_CRON_SECRET`, `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH` | `NEWSLETTER_CRON_SECRET`, `SITE_URL` | Use o mesmo segredo cron nos dois painéis, um remetente verificado no Resend e um token GitHub com acesso de leitura e escrita ao repositório. O `SITE_URL` deve ser a URL pública implantada. |
| Métricas e controle de funcionalidades | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | — | Credenciais da base Redis REST do Upstash. Obrigatórias para o estado persistente do controle do Resumo da bula no admin; sem Redis, o recurso fica indisponível e desativado. O projeto usa o prefixo `descomplica-bula:` nas chaves. |

`GITHUB_TOKEN` e `GITHUB_REPO` na Vercel são necessários para ações do painel administrativo que escrevem no GitHub e para a newsletter atualizar seu estado de envio. O token deve ter permissão de conteúdo de leitura e escrita no repositório. O workflow de geração usa o `GITHUB_TOKEN` automático do Actions, com permissão de escrita no repositório. `VERCEL_DEPLOY_HOOK` é opcional para acionamentos extras e não é necessário para o deploy normal.

Gere `ADMIN_SESSION_SECRET` e `NEWSLETTER_CRON_SECRET` com valores aleatórios, por exemplo no PowerShell: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Cadastre os segredos diretamente nos painéis Vercel/GitHub; não os envie por chat nem os salve no repositório. Após alterar variáveis da Vercel, faça um novo deploy para aplicá-las.

## Conteúdo e segurança editorial

- Configure os dados do site em **Admin → Configurações** ou em `data/site-profile.json`, incluindo domínio, e-mail, categorias e domínios de fontes permitidos.
- A geração de artigos depende de uma chave de provedor de IA e das variáveis de ambiente documentadas em `.env.example`.
- A geração valida a categoria do tema, acessa até três URLs oficiais e fornece o texto extraído como contexto; se nenhuma fonte legível puder ser checada, a geração não é aprovada. Isso não comprova automaticamente cada afirmação: a revisão humana continua obrigatória.
- No admin, use **Artigos → Posts publicados → Atualizar com fontes oficiais** para propor uma revisão. Informe páginas da Anvisa ou de outros domínios permitidos; a proposta fica na fila editorial, mantém a versão publicada intacta e tem as fontes acessadas novamente antes da aprovação.
- Artigos gerados e enviados manualmente passam por verificações automáticas e devem ser aprovados por uma pessoa antes da publicação.
- A validação exige fontes HTTPS de domínios permitidos, referência à bula oficial, avisos de segurança e contatos de emergência. Ela não substitui revisão clínica e editorial.
- O recurso “Tire sua dúvida” responde com base no artigo e encaminha perguntas de risco para serviços de emergência. Não use a resposta para decidir tratamento ou dose.
- O Resumo da bula exige que o usuário informe o nome do medicamento, abra o Bulário Eletrônico da Anvisa, baixe a bula do paciente e envie o PDF. O site confere se nome e concentração informados aparecem no texto extraído, mas não confirma a autenticidade nem a vigência do arquivo; PDFs sem texto legível não são aceitos.
- O Resumo da bula começa desativado. Para exibi-lo e aceitar solicitações, ative-o em **Admin → Configurações → Resumo da bula**. O estado é salvo no Upstash Redis; o endpoint também bloqueia solicitações quando o recurso está desligado.
- O PDF não é armazenado pelo site. Seu texto extraído é enviado ao provedor de IA configurado para elaborar o resumo. O recurso não informa doses nem orienta tratamento. Configure `GROQ_API_KEY` ou `GEMINI_API_KEY` na Vercel; o formulário informa quando não há provedor disponível.
- Em uma emergência, ligue para o SAMU (192) ou para o Disque-Intoxicação (0800 722 6001). Em crise emocional, ligue para o CVV (188).

## Comandos

| Comando | Uso |
| --- | --- |
| `npm run dev` | Desenvolvimento local |
| `npm run build` | Compilar para produção |
| `npm start` | Servir a compilação |
| `npm test` | Executar os testes automatizados |
| `npm run generate-article` | Gerar uma sugestão de artigo; aceita `--topic "tema" --category "categoria"` |
| `npm run audit:seo` | Auditar SEO dos artigos |
| `npm run verify:seo` | Verificar metadados e rotas |
| `npm run check:redis` | Verificar a configuração opcional do Redis |

## Privacidade e configurações

O Google AdSense e a verificação do Search Console estão desativados por padrão. O domínio e o e-mail definidos no projeto são provisórios; atualize `site.config.js` antes de publicar. Consulte `/privacidade` para informações sobre newsletter, métricas e processamento de perguntas por provedores de IA.
