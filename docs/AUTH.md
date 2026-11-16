# Autenticação (Supabase Auth)

Fluxos implementados com o cliente oficial — **nenhum é simulado**.

## Cadastro — `/cadastro`
Nome, e-mail, senha e confirmação. Zod no cliente; Supabase valida a senha no servidor. Perfil é criado por trigger `on_auth_user_created`. E-mail duplicado, senha fraca e submissões repetidas são tratados na UI.

## Login — `/login`
`signInWithPassword`, sessão persistida pelo Supabase com `autoRefreshToken` e `detectSessionInUrl`. Logout encerra a sessão no servidor.

## Confirmação de e-mail
`enable_confirmations = true`. Redirect: `${VITE_SITE_URL}/app`. Links inválidos/expirados são tratados pelo Supabase e pela UI.

## Recuperação — `/recuperar-senha` → `/reset-password`
1. `resetPasswordForEmail` com `redirectTo: /reset-password`.
2. Supabase envia o e-mail (configuração de SMTP é responsabilidade do projeto).
3. PKCE + `detectSessionInUrl` processam o token.
4. `updateUser({ password })`.
5. UI informa explicitamente quando o link é inválido/expirado.

## Configurações obrigatórias no painel Supabase
- Authentication → URL Configuration → Site URL e Redirect URLs.
- Templates de e-mail revisados (idioma pt-BR).
- SMTP próprio em produção, se o limite do provedor padrão for insuficiente.

> Não é afirmado que um e-mail foi enviado ou recebido sem resposta positiva do Supabase. Em ambiente sem acesso a e-mail, o teste real de recuperação permanece **não executado**.

## Testes manuais pendentes
Criar usuário → confirmar → entrar → recuperar → abrir link → nova senha → sair → entrar novamente; além de links expirados e reutilizados.
