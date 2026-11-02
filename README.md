# Hub de Sites Automatizados

Plataforma para criar e administrar sites de diferentes nichos a partir de um painel central. Cada projeto possui perfil, identidade, conteúdo editorial, domínio e configurações de SEO independentes.

## Requisitos

- Node.js 20 ou superior
- npm
- Uma senha administrativa

## Desenvolvimento local

```bash
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Edite `.env.local` e configure ao menos:

```env
ADMIN_PASSWORD=uma-senha-forte
ADMIN_SESSION_SECRET=um-segredo-aleatorio-com-32-caracteres-ou-mais
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Abra `/admin`, entre e crie o primeiro site. O catálogo começa vazio intencionalmente.

## Criar e publicar um site

1. No painel, crie um site e configure o nome, o nicho, a identidade, o público, as categorias e as pautas.
2. Salve a configuração e ative o site quando estiver pronto para torná-lo público.
3. Configure as chaves de IA, GitHub e Vercel como variáveis de ambiente; o painel informa quais integrações estão disponíveis sem revelar segredos.
4. Para um domínio próprio, cadastre-o no perfil, conecte-o à Vercel pelo painel e configure os registros DNS solicitados.
5. Configure a propriedade do Search Console e envie o sitemap do site depois do deploy.
6. Revise cada rascunho editorial antes de publicá-lo.

As rotas padrão usam `/sites/<slug>`. Um domínio próprio configurado no perfil encaminha suas páginas para o mesmo site.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha apenas os serviços usados:

- **Administração:** `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`
- **IA:** uma ou mais chaves de provedores listadas no exemplo
- **GitHub:** `GITHUB_TOKEN`, `GITHUB_REPO` e opcionalmente `GITHUB_BRANCH`
- **Vercel/domínios:** `VERCEL_TOKEN`, `VERCEL_PROJECT_ID` e opcionalmente `VERCEL_TEAM_ID`
- **URL pública:** `NEXT_PUBLIC_SITE_URL`

Em produção, configure os segredos nas variáveis do projeto Vercel. Nunca coloque chaves em perfis de sites, conteúdo versionado ou código do navegador.

## Geração editorial

O comando exige o slug de um site cadastrado e mantém conteúdo e estado isolados por projeto:

```bash
npm run generate-article -- --site meu-site
npm run generate-article -- --site meu-site --topic "Uma pauta definida" --category "Guias"
```

O workflow do GitHub Actions aceita um slug na execução manual. Para execuções agendadas, defina a variável de repositório `SITE_SLUG`. Configure também ao menos uma chave de provedor de IA como secret do Actions.

Os artigos gerados ficam como rascunhos para revisão; o workflow não os publica automaticamente.

## Comandos

```bash
npm test
npm run build
npm run start
```
