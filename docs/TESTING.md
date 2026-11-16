# Testes

## Executar

```bash
npm run test          # Vitest (unitários)
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

## Cobertura implementada

- **Unitários**: pontuação sem dupla contagem, estudo vazio, intervalos de revisão, classificação de grau, constância, marcos, validação de cadastro/senha/e-mail/questões.
- **E2E**: identidade da landing e redirecionamento de rota protegida.

## Matriz pendente (requer Supabase configurado)

| Área | Casos |
|---|---|
| Auth | cadastro válido/inválido, duplicado, confirmação, login, logout, persistência, expiração, recuperação, link expirado, nova senha |
| Perfil | criar/editar, upload/substituição/remoção de avatar, arquivo inválido/acima do limite, acesso indevido |
| Estudos | iniciar, responder, concluir, histórico, pontuação, revisão, duplicidade |
| Segurança | alterar pontos/role, modificar outro perfil, acessar sessões alheias, publicar sem permissão, duplicar presença, upload indevido |

Testes de integração com RLS devem rodar com usuários de teste isolados. **Nenhum teste é marcado como aprovado sem execução real.**

## Auditoria final

Checklist em `README.md` + comandos acima. Registrar no relatório final: executados, aprovados, reprovados, bloqueios externos e débitos técnicos.
