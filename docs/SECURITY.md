# Segurança

## Princípios aplicados

- Autoridade no servidor: RLS + funções `SECURITY DEFINER`.
- Papéis vêm de `user_roles`, lidos via RPC `my_roles()` — nunca de localStorage.
- Pontuação, presença e publicação apenas por funções de backend.
- Nenhuma chave de serviço no frontend. `SUPABASE_SERVICE_ROLE_KEY` fica somente em Edge Functions.
- Frontend usa somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- Upload valida MIME, tamanho (2 MB) e redimensiona para WEBP 512×512; o caminho é fixo por usuário.
- Avatar privado com signed URL de 1 hora.

## Ameaças tratadas

| Ameaça | Mitigação |
|---|---|
| Usuário alterar pontos | Ledger somente-leitura + RPC valida respostas no banco |
| Usuário virar admin | `user_roles` gravável apenas por admin; verificação no servidor |
| Modificar outro perfil | RLS `id = auth.uid()` |
| Acessar sessões de terceiros | RLS em `study_sessions`/`study_answers` |
| Publicar sem permissão | `publish_content` exige `is_admin()` e alternativa correta única |
| Duplicar presença | `unique (event_id, user_id)` + `register_event` |
| Upload indevido | Políticas Storage por `storage.foldername(name)` |
| Exposição de segredos | `.env.example` sem valores; nunca logar credenciais |

## Pendências de endurecimento

- Revisar tax limits / WAF no Supabase.
- Adicionar monitoramento de `audit_logs`.
- Testes de intrusão com clientes não autenticados.
