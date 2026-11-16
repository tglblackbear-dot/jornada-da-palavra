# Arquitetura

## Camadas

- **Interface** (`src/pages`, `src/components`) — somente apresentação e interação.
- **Contextos** (`src/contexts`) — sessão, perfil, papéis e feedback ao usuário.
- **Serviços** (`src/services`) — acesso ao Supabase (Auth, Storage, RPC, tabelas).
- **Domínio** (`src/lib/domain.ts`) — regras puras de pontuação, revisão espaçada e constância.
- **Validção** (`src/lib/validation.ts`) — Zod, usada no cliente; o servidor valida novamente.
- **Backend** (`supabase/`) — Postgres + RLS + funções SECURITY DEFINER + Edge Function.

## Fluxo de conclusão de estudo

1. Cliente envia apenas `question_id`/`option_id` para `complete_study`.
2. A RPC confirma a sessão, valida que a pergunta está `PUBLISHED` e que a alternativa pertence à questão.
3. Registra sessão, respostas, dias de estudo, itens de revisão e ledger de pontos (idempotente por `unique (user_id, event_type, reference_id)`).
4. Atualiza `user_scores`, concessão de marcos e `audit_logs`.
5. Retorna resultado calculado no servidor.

O cliente **nunca** envia pontos, presença, papéis ou status de conteúdo.

## Decisões

- `my_roles()` e `is_admin()` são `SECURITY DEFINER` para evitar recursão em RLS.
- Avatares usam **signed URLs** (bucket privado); o caminho é sempre `{user_id}/profile.webp`.
- Sem credenciais, `supabase` é `null` e rotas exibem configuração pendente — não há login falso.
- PWA usa `vite-plugin-pwa` com atualização automática; nada é creditado offline sem validação posterior.

## Limitações atuais

- Conteúdo bíblico permanece em `DRAFT` até revisão humana.
- Web Push, importação/exportação de conteúdo e relatórios avançados estão preparados, mas não implementados.
- Testes E2E dependem de Chromium instalado localmente.
