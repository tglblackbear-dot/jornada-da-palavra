# Jornada da Palavra

**PALAVRA • CRESCIMENTO • COMUNHÃO** — Conheça a Palavra. Cresça na fé. Caminhe com a comunidade.

Plataforma cristã de estudo bíblico, crescimento espiritual e comunhão. React + TypeScript + Vite + Tailwind + Supabase.

> **Estado atual:** fundação funcional implementada. Autenticação, banco, RLS, funções e testes existem. **Credenciais Supabase não foram fornecidas**, então a aplicação mostra um estado explícito de configuração pendente — nada é simulado.

## Executar

```bash
npm install
cp .env.example .env.local   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

## Comandos

| Comando | Finalidade |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Type-check + build de produção |
| `npm run lint` | Lint (oxlint) |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Testes E2E (Playwright; requer `npx playwright install chromium`) |
| `npm run preview` | Servir o build local |

## Backend

```bash
supabase link --project-ref <SEU_PROJECT_REF>
supabase db push                 # aplica supabase/migrations/0001_init.sql
supabase db seed                 # aplica supabase/seed.sql (conteúdo em DRAFT)
supabase functions deploy complete-study
```

A aplicação **não publica conteúdo bíblico automaticamente**: todo seed entra como `DRAFT` e precisa de revisão humana (`approve_content` → `publish_content`).

## Estrutura

```
src/
  components/   UI, layouts, guards
  contexts/     Auth, Toast
  features/     (domínio em lib/ + services/)
  hooks/        useAsync
  lib/          env, supabase, validação, regras de negócio
  pages/        públicas, autenticação, app, admin
  services/     auth, dados
supabase/       migrations, functions, seed, config
tests/          unit, e2e
docs/           arquitetura, banco, segurança, auth, deploy, testes, env
```

## Documentação

[ARCHITECTURE](docs/ARCHITECTURE.md) · [DATABASE](docs/DATABASE.md) · [SECURITY](docs/SECURITY.md) · [AUTH](docs/AUTH.md) · [DEPLOY](docs/DEPLOY.md) · [TESTING](docs/TESTING.md) · [ENVIRONMENT](docs/ENVIRONMENT.md)
