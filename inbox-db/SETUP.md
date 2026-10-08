# Configurar o Supabase real do Astarita Inbox

Projeto: **Astarita Inbox** (`yappbzpayqejqpkfebho`), exclusivo do Inbox. Nada aqui usa o banco do calendário.
Nenhum segredo vai para o repositório nem para o chat: valores só em campos de ambiente ou no seu terminal.

## 0. Estado conhecido
- Banco instalado com o SQL de `supabase/migrations/20261008000000_inbox_install.sql` (aplicado pelo Codex).
- Código do app pronto (cliente, login e sessão próprios), testado só em ambiente local simulado.
- **Ainda não verificado no projeto real:** login, RLS vista de fora, Realtime, configurações de Auth.

## 1. Ações suas (o que não dá para automatizar)
| # | Onde | O que fazer |
|---|---|---|
| 1 | Ambiente da sessão na nuvem (menu do ambiente > Edit > Network access) | Liberar o domínio `yappbzpayqejqpkfebho.supabase.co` em *Allowed domains*, mantendo marcada a opção de gerenciadores de pacote. Hoje o gateway responde 403 a esse host. |
| 2 | Mesmo menu, variáveis de ambiente | Criar `VITE_INBOX_SUPABASE_URL` (`https://yappbzpayqejqpkfebho.supabase.co`) e `VITE_INBOX_SUPABASE_PUBLISHABLE_KEY` (Painel > Project Settings > API Keys > chave **publicável**). Nunca a `service_role`/secret. Vale para sessões novas. |
| 3 | Painel Supabase > SQL Editor | Rodar `inbox-db/sql/audit-readonly.sql` (só leitura) e me passar a tabela de resultado. Não contém segredos. |
| 4 | Painel > Authentication | Desativar cadastro público (*Allow new users to sign up*). Em *URL Configuration*, definir *Site URL* e permitir o redirecionamento `<endereço do app>/inbox/definir-senha`. |
| 5 | Painel > Authentication > Users | Criar Andreas e Juline (*Add user > Create new user*, com *Auto Confirm*), com senhas que só vocês sabem. |
| 6 | SQL Editor | Trocar os dois e-mails em `inbox-db/sql/provision-profiles.sql` e rodar. Cria só os perfis; aborta sem gravar se algum usuário não existir. |
| 7 | Onde o app for publicado | Repetir as duas variáveis `VITE_INBOX_*` lá (e no seu `.env` local). Publicar exige autorização à parte. |

## 2. O que a auditoria confere
`audit-readonly.sql` roda 25 verificações: 13 tabelas, nenhuma tabela fora do Inbox, RLS em todas, 42 políticas,
59 constraints validadas, 7 triggers, Realtime nas 5 tabelas, sementes, `profiles.role/active` não editáveis,
`anon` sem SELECT, `authenticated` sem TRUNCATE, `messages`/`webhook_events`/`pipeline_stages` sem escrita pelo navegador.
Testada localmente: 25/25 OK na versão aprovada, 7 falhas na versão antiga que tinha privilégios herdados.

## 3. O que eu faço sozinho depois de 1 e 2 (somente leitura, sem login)
- `GET /auth/v1/settings`: confirma se o cadastro público está desligado e quais provedores estão ativos.
- Sonda anônima das 13 tabelas com a chave publicável: tudo deve ser negado.
- Conexão WebSocket do Realtime com a chave publicável: confirma que o serviço responde.

## 4. Testes reais com escrita (só com sua autorização do plano)
Com duas contas de teste (perfil `member`, nomes "Teste A" e "Teste B"), credenciais em variáveis de ambiente suas:
login, criar contato, conversa, atribuir, resolver, reabrir e **Realtime entre duas sessões**. Todo dado de teste leva o
prefixo `[TESTE-CLAUDE]` e é apagado por mim ao final; depois você remove as duas contas de teste.
Mensagens recebidas (que só o backend grava) já foram testadas localmente e não são simuladas no banco real.
