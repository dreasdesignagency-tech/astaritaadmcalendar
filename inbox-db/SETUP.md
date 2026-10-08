# Configurar o Supabase real do Astarita Inbox

Projeto: **Astarita Inbox** (`yappbzpayqejqpkfebho`), exclusivo do Inbox. Nada aqui usa o banco do calendário.
Nenhum segredo vai para o repositório nem para o chat: valores só em campos de ambiente ou no seu terminal.

## 0. Estado verificado no projeto real (08/10/2026, pelo conector do Supabase, somente leitura)
- Único projeto visível ao conector: **Astarita Inbox** (`yappbzpayqejqpkfebho`), `ACTIVE_HEALTHY`, us-east-1, Postgres 17.
- `audit-readonly.sql` rodou no banco real: **25/25 OK** (13 tabelas, nenhuma fora do Inbox, RLS em todas, 42 políticas só para
  `authenticated`, 59 constraints validadas, 7 triggers, Realtime exatamente nas 5 tabelas e sem `FOR ALL TABLES`, 7 etapas e 8 seções
  de sementes, `role`/`active` não editáveis, `anon` sem SELECT, 0 usuários e 0 perfis).
- Ledger de migrations (`supabase_migrations.schema_migrations`) **não existe**.
- Tipos reais gerados e adotados no cliente (`src/lib/inbox/database.types.ts`).
- Advisors de segurança: `rls_auto_enable()` (função do próprio projeto) chamável por API; `is_inbox_member()` chamável por
  `authenticated` (intencional, as políticas precisam). Advisors de desempenho: 2 políticas com `auth.uid()` por linha, 8 FKs sem
  índice. Correções propostas em `inbox-db/proposed/inbox_hardening.sql` (**não aplicadas, aguardam aprovação**).
- **Ainda não verificado no projeto real:** configurações de Auth (cadastro público, URLs), login, Realtime ao vivo.

## 1. Ações suas (o que não dá para automatizar)
| # | Onde | O que fazer |
|---|---|---|
| 1 | Ambiente da sessão na nuvem (menu do ambiente > Edit > Network access) | Liberar o domínio `yappbzpayqejqpkfebho.supabase.co` em *Allowed domains*, mantendo marcada a opção de gerenciadores de pacote. Hoje o gateway responde 403 a esse host. |
| 2 | Mesmo menu, variáveis de ambiente | Criar `VITE_INBOX_SUPABASE_URL` (`https://yappbzpayqejqpkfebho.supabase.co`) e `VITE_INBOX_SUPABASE_PUBLISHABLE_KEY` (Painel > Project Settings > API Keys > chave **publicável**). Nunca a `service_role`/secret. Vale para sessões novas. |
| 3 | (feito) | A auditoria já foi rodada pelo conector, 25/25 OK. Rode de novo quando quiser: `inbox-db/sql/audit-readonly.sql`. |
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
