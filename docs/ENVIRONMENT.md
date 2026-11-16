# Ambiente

## Variáveis do frontend

| Variável | Obrigatória | Descrição |
|---|---|---|
| `VITE_SUPABASE_URL` | sim | URL do projeto Supabase (`https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | sim | Chave anônima pública |
| `VITE_SITE_URL` | recomendada | URL pública usada nos redirects de Auth |
| `VITE_BASE_PATH` | não | `/` ou `/jornada-da-palavra/` |

Copie `.env.example` para `.env.local`. O arquivo `.env.local` não é versionado.

## Segredos (nunca no frontend)

- `SUPABASE_SERVICE_ROLE_KEY` — apenas Edge Functions.
- Chaves de API de IA — apenas backend, com limites e controle de custo.

## Verificação local

```bash
npm install
npm run dev
```

Sem as variáveis, a UI exibe "Configuração necessária" em vez de simular autenticação.

## Supabase local

```bash
supabase start
supabase db reset       # aplica migrations + seed
```

Portas padrão em `supabase/config.toml`: API 54321, DB 54322, Studio 54323.
