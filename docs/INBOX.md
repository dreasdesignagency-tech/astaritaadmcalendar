# Astarita Inbox

Central privada de atendimento via WhatsApp, no mesmo repositório do calendário (TanStack Start + Supabase),
mas com **banco, login e sessão totalmente separados**.

## Arquitetura em uma olhada

| | Calendário | Inbox |
|---|---|---|
| Rotas | `/`, `/clientes`, `/auth`... | `/inbox/*` |
| Projeto Supabase | o já existente | **Astarita Inbox** (`yappbzpayqejqpkfebho`) |
| Variáveis | `VITE_SUPABASE_*` | `VITE_INBOX_SUPABASE_*` |
| Cliente | `src/integrations/supabase/client.ts` | `src/lib/inbox/client.ts` |
| Login | `/auth` | `/inbox/entrar` |
| Sessão no navegador | chave `sb-…-auth-token` | chave `astarita-inbox-auth` |
| Proteção de rotas | `_authenticated` | `/inbox/_app` |

O Inbox não importa nada do calendário e o calendário não importa nada do Inbox (verificado por teste automático).
**O token do calendário não vale no Inbox e vice-versa**: são projetos Auth diferentes.
Andreas e Juline precisam de uma conta no projeto Inbox, com senha própria.

O cliente do Inbox só é criado quando alguém abre `/inbox`. Se as variáveis `VITE_INBOX_*` faltarem, `/inbox` mostra
"Inbox não configurado" (com os nomes das variáveis) e o calendário nem percebe. O app também recusa:
a URL do calendário no lugar da do Inbox, e qualquer chave `service_role`/`sb_secret_` no frontend.

## Banco

Ver `inbox-db/README.md`. Resumo: o SQL exato aprovado está em `inbox-db/supabase/migrations/20261008000000_inbox_install.sql`
(SHA-256 `0fba7362…ff24`), já aplicado no projeto Inbox pelo SQL Editor (13 tabelas, RLS em todas, 42 políticas, 7 triggers,
Realtime em 5 tabelas). **Não reaplicar**: o arquivo tem guardas que abortam se algo já existir.
As migrations antigas (`inbox-db/superseded/`) ficam só como registro e **não devem ser aplicadas**.

Pendências do banco: reconciliar o ledger de migrations e gerar os tipos reais (instruções no `inbox-db/README.md`),
e definir backup antes de dados reais (o painel mostrava "No backups").

## Configuração para rodar

1. No `.env` local (e no ambiente onde o app for publicado), defina `VITE_INBOX_SUPABASE_URL` e
   `VITE_INBOX_SUPABASE_PUBLISHABLE_KEY` com a URL e a **chave publicável atual** do projeto Astarita Inbox
   (Painel > Project Settings > API). Nunca a service role.
2. No projeto Inbox, em Authentication, desative o cadastro público ("Allow new users to sign up")
   e cadastre em "URL Configuration" o endereço do app e `…/inbox/definir-senha` como URL permitida de redirecionamento.
3. Crie/identifique os usuários de Andreas e Juline no projeto Inbox (Authentication > Users) e rode, no seu terminal:
   ```bash
   INBOX_SUPABASE_URL=https://yappbzpayqejqpkfebho.supabase.co \
   INBOX_SUPABASE_SERVICE_ROLE_KEY=... ANDREAS_EMAIL=... JULINE_EMAIL=... \
   node scripts/provision-inbox-users.mjs --dry-run      # confere o que seria feito
   node scripts/provision-inbox-users.mjs                # reaproveita quem já existe e cria os perfis
   ```
   Por padrão o script **não cria usuário e não manda convite**: quem não existe é só avisado.
   Convite por e-mail só com `--invite` (e `INBOX_SITE_URL`). O envio de e-mail padrão de projetos novos do Supabase é limitado;
   se o convite não chegar, o caminho é configurar SMTP próprio.
4. Quem já tem conta mas não tem senha usa "Definir ou recuperar senha" na tela de entrada.

## Rodar localmente
```bash
bun install        # ou npm install
bun run dev
```

## Fases
| Fase | Escopo | Estado |
|---|---|---|
| 1 | Fundação: banco, RLS, layout, design system | feita |
| 2 | Conversas, contatos, histórico, filtros, responsáveis, tempo real | feita (sem envio, que é da Fase 4) |
| integração | Cliente, login e sessão próprios do Inbox | código pronto; **depende de configuração real** (ver abaixo) |
| 3 | Funil, respostas rápidas, notas, lembretes | pendente |
| 4 | WhatsApp Cloud API oficial | pendente |
| 5 | IA e base de conhecimento | pendente |
| 6 | Qualidade e produção | pendente |

## O que o Inbox faz hoje

**Contatos** (`/inbox/contatos`): criar, editar, buscar (nome, empresa, Instagram, etiqueta, parte do telefone), filtrar
(categoria, responsável, etiqueta), iniciar/abrir conversa. Telefone normalizado (`src/lib/inbox/phone.ts`); duplicidade
considera o nono dígito brasileiro. Não há exclusão de contatos nesta fase.

**Caixa de entrada** (`/inbox`): lista com filtros e busca, histórico de mensagens, atribuir responsável, resolver e reabrir,
edição do contato pelo painel, "Novo contato" que já abre a conversa. Abrir a conversa zera as não lidas.
Resolver, reabrir e atribuir só gravam se a conversa não mudou desde que a tela carregou (`updated_at`).

**Tempo real** (`src/lib/inbox/realtime.ts`): assinatura Supabase Realtime em `conversations`, `messages`, `contacts`,
`contact_tags`, `tags`, pelo cliente do Inbox. Os eventos só invalidam o cache; os dados vêm de consultas sob RLS.
Se a conexão cair, aparece um aviso e a tela consulta a cada 15 s até reconectar.

**Ainda não existe:** envio de mensagens (campo desabilitado até a Fase 4), anexos, respostas rápidas, funil com cartões,
lembretes, notas, IA.

## Testes

```bash
npm test                 # unitários (Node, sem dependências): 26 testes
```
Ponta a ponta no navegador: ver `tests/e2e/README.md`. Ambiente local com Postgres + PostgREST + RLS, usando o SQL exato
instalado, GoTrue **simulado** e Realtime **ausente** (o app cai no modo de contingência).

| O quê | Resultado |
|---|---|
| Unitários: telefone, status, configuração (inclui chave secreta e URL do calendário), paginação de usuários, isolamento por código | 26/26 |
| SQL exato aprovado aplicado em banco limpo com privilégios padrão do Supabase; reaplicar aborta | ok |
| E2E funcional (contatos, conversas, filtros, responsáveis, conflito, RLS, celular) | 37/37 |
| E2E isolamento, login, definir senha, configuração ausente, regressão do calendário | 29/29 |
| `tsc --noEmit`, `vite build` (também sem nenhuma variável do Inbox) | ok |

**Não coberto por teste (depende de configuração real):** login com GoTrue de verdade e convite/e-mail, Supabase Realtime
de verdade entre duas sessões, o projeto Astarita Inbox real (nenhuma conexão a ele foi feita a partir do código ou dos testes),
reconciliação do ledger, tipos gerados reais, backup, e tudo do WhatsApp.
