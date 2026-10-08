# Astarita Inbox

Central privada de atendimento via WhatsApp, dentro do mesmo app do calendário (TanStack Start + Supabase).
Acesso em `/inbox`. O calendário continua intacto; o Inbox tem layout e tokens próprios (`.inbox-theme` em `src/styles.css`).

## Por que não Next.js
O repositório já é TanStack Start + Vite + Supabase, ligado ao Lovable. Trocar de framework não traria nada ao Inbox
e arriscaria o calendário. O que seriam route handlers do Next entra aqui como server routes do TanStack Start (Fase 4).

## Fases
| Fase | Escopo | Estado |
|---|---|---|
| 1 | Fundação: banco, RLS, auth, layout, design system | feita |
| 2 | Conversas, contatos, histórico, filtros, responsáveis, tempo real | feita (sem envio, que é da Fase 4) |
| 3 | Funil, respostas rápidas, notas, lembretes | pendente |
| 4 | WhatsApp Cloud API oficial | pendente |
| 5 | IA e base de conhecimento | pendente |
| 6 | Qualidade e produção | pendente |

## Configuração (uma vez)
1. **Aplicar as migrations, nesta ordem**, no projeto Supabase (SQL Editor, ou pelo fluxo de migrations):
   `20261008000000_inbox_foundation.sql` e depois `20261009000000_inbox_realtime_contacts.sql`.
   As duas só criam tabelas novas e adicionam tabelas à publicação do Realtime. Não mexem em `clients` nem `contents`.
   Para conferir se já foram aplicadas, rode no SQL Editor (somente leitura):
   `select table_name from information_schema.tables where table_schema='public' and table_name in ('profiles','contacts','conversations','messages');`
   Se voltar vazio, ainda não foram.
2. **Desativar cadastro público**: Supabase > Authentication > Providers > Email > desligar "Allow new users to sign up".
   Mesmo com o cadastro aberto, quem não tem perfil ativo não vê nenhum dado do Inbox (RLS), mas o ideal é fechar.
3. **Provisionar Andreas e Juline** (no seu terminal; as chaves nunca vão para o GitHub):
   ```bash
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANDREAS_EMAIL=... JULINE_EMAIL=... npm run inbox:provision
   ```
   Cada um recebe um convite por e-mail e define a própria senha. Se o e-mail já existe como usuário do calendário,
   o script só cria o perfil.

## Rodar localmente
```bash
bun install        # ou npm install
bun run dev
```
Precisa de `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (veja `.env.example`).

## Modelo de acesso
`public.is_inbox_member()` (perfil ativo) guarda todas as políticas. No navegador:
- mensagens só podem ser lidas ou enfileiradas como envio `pending` pelo próprio usuário; mudar status é só do backend;
- `webhook_events` é só leitura; `pipeline_stages` é fixa;
- perfis só podem editar o próprio nome e avatar.

## Fase 2: o que existe

**Autenticação:** o Inbox usa o mesmo login do calendário (`/auth`, Supabase Auth). Nenhuma conta nova é criada.
Quem não tem perfil ativo em `profiles` vê "Acesso restrito" e nenhum dado (a RLS garante isso no banco, não só na tela).

**Contatos** (`/inbox/contatos`): criar, editar, buscar (nome, empresa, Instagram, etiqueta, parte do telefone),
filtrar (categoria, responsável, etiqueta), iniciar/abrir a conversa. Telefone é normalizado (`src/lib/inbox/phone.ts`)
e a duplicidade considera o nono dígito brasileiro (com e sem). Não há exclusão de contatos nesta fase, de propósito.

**Caixa de entrada** (`/inbox`): lista com filtros e busca, histórico de mensagens (texto, rótulo para mídia,
indicadores de envio), atribuir responsável, resolver e reabrir, edição do contato pelo painel de detalhes,
"Novo contato" que já abre a conversa. Abrir a conversa zera as não lidas.
Atribuir responsável a uma conversa "aguardando" a move para "em atendimento".
Reabrir volta para "em atendimento" se há responsável, senão para "aguardando".

**Conflito de atendimento:** resolver, reabrir e atribuir só gravam se a conversa não mudou desde que a tela carregou
(comparação por `updated_at`). Se outra pessoa mexeu antes, nada é sobrescrito e aparece um aviso.

**Tempo real** (`src/lib/inbox/realtime.ts`): uma assinatura Supabase Realtime (`postgres_changes`) em `conversations`,
`messages`, `contacts`, `contact_tags` e `tags`. Os eventos só invalidam o cache; os dados vêm das consultas normais,
sempre sob RLS, e o Realtime também só entrega linhas que a pessoa pode ler. Se a conexão cair, aparece um aviso no
cabeçalho e a tela consulta o banco a cada 15s até reconectar (e busca o que perdeu ao voltar).

**Ainda não existe:** envio de mensagens (campo desabilitado até a Fase 4), anexos, respostas rápidas, funil com cartões,
lembretes, notas, IA. Mensagens só passam a existir quando o webhook da Fase 4 as gravar.

## Testes

| O quê | Como | Resultado |
|---|---|---|
| Lógica pura (telefone, nono dígito, Instagram, regras de status) | `node --test tests/inbox/logic.test.mjs` | 6/6 |
| Migrations + RLS | aplicadas num Postgres 16 local; intruso, anônimo, membro e perfil desativado | ok |
| Ponta a ponta no navegador | `tests/e2e/` (ver README lá): app real, PostgREST, Postgres com RLS e JWT assinado | 37/37 |
| Tipos e build | `npx tsc --noEmit`, `npx vite build` | ok |

O e2e cobre: acesso restrito, criar/editar contato, duplicado e telefone inválido, busca e todos os filtros, abrir conversa,
mensagens novas na tela, não lidas, atribuir/resolver/reabrir, conflito de edição, segunda pessoa vendo os mesmos dados,
perfil desativado e layout de celular.

**Não coberto por teste:** o Supabase Realtime de verdade (servidor local não existe; só o modo de contingência foi testado),
o projeto Supabase de produção, e qualquer coisa do WhatsApp.
