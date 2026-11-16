# Deploy

## Frontend (estático)

```bash
npm run build
```

O `base` do Vite vem de `VITE_BASE_PATH`. Em GitHub Pages, use `/jornada-da-palavra/`.

### GitHub Pages — SPA
O roteamento usa `BrowserRouter`; refresh em rotas profundas exige fallback para `index.html`. Inclua um `404.html` que redirecione preservando o caminho, ou migre para `HashRouter` se o fallback não for possível. O workflow `.github/workflows/deploy.yml` faz build e publica `dist/`.

## Backend (Supabase)

1. Criar projeto.
2. `supabase link --project-ref <ref>`
3. `supabase db push`
4. `supabase db seed`
5. Configurar Auth (site URL, redirects, confirmação, templates, SMTP).
6. `supabase functions deploy complete-study`
7. Configurar secrets da Edge Function: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## Variáveis

Somente `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_BASE_PATH` e `VITE_SITE_URL` no frontend. Nunca `SERVICE_ROLE_KEY`.

## Projeto aplicado

- Ref: `pmlsmagwxyfpwnjtgvrv` (região `us-east-1`).
- `supabase db push --remote --yes` aplicado; seed via `supabase db query --remote --file supabase/seed.sql --yes`.
- Auth: `site_url` e `uri_allow_list` configurados via Management API; `mailer_autoconfirm = false`.
- Edge Function `complete-study` deployada com verificação de JWT.

## Verificação pós-deploy

- Rota `/` carrega; `/login` redireciona corretamente.
- Cadastro real confirma e-mail.
- RPCs respondem; RLS bloqueia acesso cruzado.
- Build sem erros de tipo; console sem erros.
