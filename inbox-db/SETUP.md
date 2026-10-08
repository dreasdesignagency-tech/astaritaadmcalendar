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

## 5. Plano de aplicação no banco real (AGUARDA CONFIRMAÇÃO FINAL)

Ensaiado em Postgres local que espelha o real (gatilho `ensure_rls` já existente, baseline instalada): aplicar, ledger,
auditoria, comportamento das políticas, **reversão** (estado idêntico ao de antes) e reaplicação. Nada disso foi executado no banco real.

| Passo | Ferramenta | Comando | Reversão |
|---|---|---|---|
| A | `apply_migration` (name `inbox_hardening`) | conteúdo de `proposed/inbox_hardening.sql` (1 revoke, 2 `alter policy`, 8 `create index if not exists`), numa transação única: se algo falhar, nada é aplicado e o ledger não é criado | `proposed/inbox_hardening.revert.sql` |
| B | `execute_sql` (leitura) | `select to_regclass('supabase_migrations.schema_migrations');` deve devolver o nome | nada a reverter |
| C | `execute_sql` | `insert` de metadados da baseline (`proposed/ledger_baseline.sql`), `on conflict do nothing` | `delete from supabase_migrations.schema_migrations where version in ('20261008000000', '<versão do passo A>');` |
| D | leitura | `list_migrations` (2 linhas), `audit-readonly.sql` (25/25), advisors (somem `rls_auto_enable`, `auth_rls_initplan` e `unindexed_foreign_keys`; os `unused_index` novos são esperados com banco vazio) | nada a reverter |
| E | repositório | renomear `proposed/inbox_hardening.sql` para `supabase/migrations/<versão do passo A>_inbox_hardening.sql` | git |

Sem a política de ledger do passo C o CLI ainda acharia que nada foi aplicado. Alternativa pelo CLI: `migration repair` (ver `README.md`).

## 6. Revisão de RLS (banco real, 08/10/2026)
Definições reais conferidas em `pg_policy`: as duas políticas reescritas são idênticas às do SQL instalado, só trocam `auth.uid()` por
`(select auth.uid())`. Pontos que NÃO bloqueiam, para decidir depois (Fase 6):
- Qualquer membro pode apagar contatos e conversas (`delete` liberado), e a exclusão apaga mensagens em cascata. A interface não oferece isso.
- `created_by`/`updated_by` de `reminders`, `quick_replies`, `ai_suggestions` e `knowledge_base` não são forçados ao próprio usuário
  (só `messages.sent_by` é). Afeta a confiabilidade de auditoria, não o acesso.
- Eventos de DELETE do Realtime não passam pela RLS (carregam só as chaves primárias). O app só usa eventos para recarregar, e o
  projeto não tem cadastro público.

## 7. Autenticação de Andreas e Juline
1. Painel > Authentication > Sign In / Providers (ou *Settings*): desligar *Allow new users to sign up*; manter só o provedor Email.
2. Authentication > URL Configuration: *Site URL* = endereço do app; *Redirect URLs* inclui `<endereço>/inbox/definir-senha`.
3. Authentication > Users > Add user > Create new user (Auto Confirm User), com as senhas definidas por cada pessoa. Sem e-mails automáticos.
4. `sql/provision-profiles.sql` com os dois e-mails (cria só os perfis; aborta sem gravar se faltar usuário).
5. Contas de teste (só para a Etapa B): duas contas descartáveis com perfil `member`, removidas por você depois.

## 8. Testes reais: `scripts/inbox-real-check.mjs`
Só chave publicável e contas de teste (nunca service role), sem imprimir chaves ou tokens.
```bash
# Etapa A, somente leitura (auth settings, sondagem anônima das 13 tabelas e dos RPCs, conexão do Realtime)
VITE_INBOX_SUPABASE_URL=... VITE_INBOX_SUPABASE_PUBLISHABLE_KEY=... node scripts/inbox-real-check.mjs
# Etapa B, com escrita, dados [TESTE-CLAUDE] apagados ao final. Só depois da aprovação e das contas de teste:
INBOX_TEST_A_EMAIL=... INBOX_TEST_A_PASSWORD=... INBOX_TEST_B_EMAIL=... INBOX_TEST_B_PASSWORD=... node scripts/inbox-real-check.mjs --write
node scripts/inbox-real-check.mjs --cleanup-only   # se uma execução for interrompida
```
A Etapa A recusa "negado" por qualquer motivo que não seja permissão (42501), para não dar falso verde com chave errada.
Antes do hardening, a verificação de `rls_auto_enable()` reprova de propósito (é o alerta de segurança). Testado só no ambiente
local (28/28, sem Realtime). **As verificações de Realtime do script nunca rodaram contra um servidor Realtime de verdade.**
