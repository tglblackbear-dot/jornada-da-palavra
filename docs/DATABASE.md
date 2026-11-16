# Banco de dados

Migração única: `supabase/migrations/0001_init.sql`. Seed: `supabase/seed.sql`.

## Domínios

| Domínio | Tabelas |
|---|---|
| Identidade | `profiles`, `roles`, `user_roles`, `deletion_requests` |
| Conteúdo | `categories`, `questions`, `question_options`, `study_tracks`, `study_track_items`, `daily_word` |
| Estudo | `study_sessions`, `study_answers`, `study_days`, `review_items` |
| Pontuação | `user_scores`, `score_events`, `achievements`, `user_achievements` |
| Comunidade | `groups`, `group_members`, `cycles`, `cycle_tracks`, `cycle_participants` |
| Eventos | `events`, `event_codes`, `event_participation` |
| Operação | `notifications`, `reports`, `audit_logs`, `app_settings` |

## Integridade

- `auth.users` → `profiles` (1:1), perfil criado por trigger.
- `question_options` garante unicidade de `position` e é validado na publicação (`check_single_correct`).
- `score_events` tem `unique (user_id, event_type, reference_id)` — base da idempotência.
- `event_participation` tem `unique (event_id, user_id)` — impede presença duplicada.
- `review_items` tem `unique (user_id, question_id)` — revisão espaçada por questão.

## RLS

Todas as tabelas públicas têm RLS habilitado. Leitura de conteúdo exige `PUBLISHED` ou admin. Dados de estudo, pontos, notificações e presença são privados ao titular. Escrita de papéis, conteúdo, eventos e auditoria é restrita a administradores.

## Funções

`handle_new_user`, `my_roles`, `is_admin`, `dashboard_summary`, `complete_study`, `register_event`, `approve_content`, `publish_content`, `admin_stats`, `request_account_deletion`, `check_single_correct`.

## Storage

Buckets privados: `avatars`, `question-media`, `event-media`, `group-media`. Políticas limitam upload/modificação ao diretório do próprio usuário (avatares) ou a administradores (demais).
