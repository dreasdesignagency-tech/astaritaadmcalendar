# Astarita Inbox

Central privada de atendimento via WhatsApp, (TanStack Start + Supabase). **Nesta branch o calendário foi removido**: o projeto é só o Inbox e `/` redireciona para `/inbox`. O calendário continua na `main` e na publicação do Lovable. As menções ao calendário abaixo descrevem o desenho original de isolamento,
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

### Servidor (WhatsApp e IA)
As rotas `/api/whatsapp/webhook` e `/api/inbox/*` rodam no servidor e leem estas variáveis (modelo em `.env.example`).
Elas **nunca** levam o prefixo `VITE_` e nunca vão para o GitHub:

| Variável | Para quê |
|---|---|
| `INBOX_SUPABASE_URL`, `INBOX_SUPABASE_SERVICE_ROLE_KEY` | o servidor gravar mensagens recebidas e confirmar envios (ignora a RLS: só no servidor) |
| `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION` | enviar pela Cloud API |
| `WHATSAPP_VERIFY_TOKEN`, `META_APP_SECRET` | verificar o webhook e validar a assinatura de cada evento |
| `INBOX_AI_PROVIDER` (`anthropic` ou `openai`), `INBOX_AI_API_KEY`, `INBOX_AI_MODEL` | Assistente Astarita (opcional) |

Na Meta, o webhook aponta para `https://SEU-ENDERECO/api/whatsapp/webhook`, com o mesmo verify token. Isso exige um endereço
público em HTTPS: não funciona em `localhost`. Sem as variáveis, o Inbox funciona normalmente e as telas dizem o que falta.

## Rodar localmente
```bash
bun install        # ou npm install
bun run dev
```

## Fases
| Fase | Escopo | Estado |
|---|---|---|
| 1 | Fundação: banco, RLS, layout, design system | feita |
| 2 | Conversas, contatos, histórico, filtros, responsáveis, tempo real | feita |
| integração | Cliente, login e sessão próprios do Inbox | código pronto; **depende de configuração real** |
| 3 | Funil, respostas rápidas, observações internas, lembretes | feita, testada em ambiente local |
| 4 | WhatsApp Cloud API oficial | código pronto, testado contra uma Meta **simulada**; **não testado com a Meta real** |
| 5 | Assistente de IA e base de conhecimento | código pronto, testado contra uma IA **simulada**; **não testado com provedor real** |
| 6 | Qualidade e produção | em andamento (ver `docs/GUIA-DE-USO.md` e o relatório de validação) |

## O que o Inbox faz
Resumo por tela em `docs/GUIA-DE-USO.md`. Pontos técnicos:

- **Contatos / conversas:** telefone normalizado (`phone.ts`, considera o nono dígito); resolver, reabrir e atribuir só gravam se a
  conversa não mudou desde que a tela carregou (`updated_at`).
- **Tempo real** (`realtime.ts`): Supabase Realtime só invalida o cache; os dados vêm de consultas sob RLS. Se cair, aviso e consulta a cada 15 s.
- **Funil:** 7 etapas; arrastar persiste a posição; alternativa por seletor para celular.
- **Envio** (`messaging.ts` + `/api/inbox/send`): o navegador grava a mensagem como `pending` (RLS) e o servidor envia; só ele
  confirma o status. Um "claim" no banco impede envio duplicado. Janela de 24 h conferida de novo no servidor.
- **Webhook** (`/api/whatsapp/webhook`): assinatura HMAC sobre o corpo cru, eventos idempotentes (`webhook_events`),
  status só avançam, status que chega antes do id é aplicado depois, eco do app (coexistência) tratado.
- **Mídia:** baixada sob demanda para o bucket privado `inbox-media`; a tela recebe URL assinada de 5 minutos.
- **IA** (`server/ai-*.ts`, `/api/inbox/ai`): provedor Anthropic ou compatível com OpenAI, chamado por `fetch` no servidor
  (escolha deliberada: sem dependência nova, roda em Workers e não amarra um provedor). A IA só devolve texto; falas do cliente
  entram no prompt como dados, com as tags neutralizadas; limite de 12 pedidos por minuto por pessoa; recusa, corte e erro viram
  mensagens em português; toda sugestão é gravada em `ai_suggestions`. Nada envia mensagem sozinho.

**Formatos da Meta:** escritos conforme o conhecimento do autor. A documentação oficial não pôde ser aberta durante o
desenvolvimento (o ambiente bloqueia `developers.facebook.com`). Conferir com a Meta real é parte da validação com credenciais.

## Testes
```bash
npm test      # unitários (Node, sem dependências): 65 testes
```
Os testes de ponta a ponta usam `tests/e2e/stack.sh up` (Postgres + PostgREST com o SQL exato instalado e RLS, GoTrue, Storage,
Meta e IA **simulados**, Realtime **ausente**). Ver `tests/e2e/README.md`.

| O quê | Resultado |
|---|---|
| Unitários (telefone, status, configuração, usuários, isolamento por código, funil, lembretes, WhatsApp, IA) | 65/65 |
| Banco: SQL aprovado em banco limpo, reaplicar aborta, hardening e migration de notas com reversão | ok |
| E2E contatos/conversas/filtros/responsáveis/RLS/celular | 37/37 |
| E2E isolamento, login, definir senha, configuração ausente, rota raiz, 404 das rotas antigas | ver abaixo |
| API WhatsApp (assinatura, idempotência, status, envio, concorrência, janela, mídia, vazamento de segredo) | 76/76 |
| E2E funil, respostas rápidas, notas, lembretes, envio e janela (Meta simulada) | 41/41 |
| API da IA (prompt, base de conhecimento, injeção, erros, limite, não envia nada) | 35/35 |
| E2E do Assistente e da base de conhecimento (IA simulada) | 22/22 |

**Não coberto por teste (depende de configuração real):** login com GoTrue de verdade e e-mail de convite, Realtime de verdade
entre duas sessões, o projeto Supabase real (nenhuma conexão a ele foi feita pelo código ou pelos testes), a Meta real
(envio, recebimento, assinatura, modelos, número de produção), um provedor de IA real (qualidade das respostas), backup e publicação.
