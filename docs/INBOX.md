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
| 2 | Conversas, contatos, chat, filtros, responsáveis | pendente |
| 3 | Funil, respostas rápidas, notas, lembretes | pendente |
| 4 | WhatsApp Cloud API oficial | pendente |
| 5 | IA e base de conhecimento | pendente |
| 6 | Qualidade e produção | pendente |

## Configuração (uma vez)
1. **Aplicar a migration** `supabase/migrations/20261008000000_inbox_foundation.sql` no projeto Supabase
   (SQL Editor ou fluxo de migrations do Lovable). Ela só cria tabelas novas.
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
