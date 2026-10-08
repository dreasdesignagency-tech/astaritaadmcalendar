# Banco do Astarita Inbox

Projeto Supabase **separado** do calendário.

- Projeto: Astarita Inbox, ref `yappbzpayqejqpkfebho`, URL `https://yappbzpayqejqpkfebho.supabase.co`.
- O calendário NÃO usa este banco, e o ref antigo do calendário (`supabase/config.toml` da raiz) não é o do Inbox.

## O que está instalado

`supabase/migrations/20261008000000_inbox_install.sql` é a cópia **idêntica byte a byte** do SQL aprovado e aplicado
pelo Codex no SQL Editor, numa transação única.

SHA-256: `0fba7362035e3280b7e638fa0fbb60494efcc01c083c313c9dd6b8a32734ff24`
(confira com `sha256sum inbox-db/supabase/migrations/20261008000000_inbox_install.sql`).

O comentário "Ainda não aplicado" no cabeçalho registra o momento do preparo. Foi aplicado e verificado
(13 tabelas, 13 com RLS, 42 políticas, 59 constraints, 7 triggers, Realtime em 5 tabelas). Não edite este arquivo:
mudar um byte muda o hash e perde a prova de que é o que está no banco.

O arquivo abre com guardas que abortam se as tabelas ou funções já existirem. Por isso aplicá-lo de novo no
projeto Inbox falha sem alterar nada, o que é o comportamento desejado.

## Pendência: ledger de migrations

A instalação foi feita pelo SQL Editor, então `supabase_migrations.schema_migrations` não existe e o CLI acredita que
nada foi aplicado. **Não rode `db push` antes de reconciliar**, ou o CLI tentará aplicar a fundação de novo (as guardas
abortariam, mas o erro confunde). Reconciliação, com sessão do CLI autorizada ao projeto Inbox e sem reexecutar o SQL:

```bash
supabase --workdir inbox-db login
supabase --workdir inbox-db link --project-ref yappbzpayqejqpkfebho
supabase --workdir inbox-db migration repair --status applied 20261008000000
supabase --workdir inbox-db migration list     # local e remoto devem aparecer iguais
```

`migration repair` só grava a linha no ledger. Não executa o SQL. **Isto ainda não foi feito.**

## Próximas mudanças de banco

Cada alteração nova vira um arquivo novo em `supabase/migrations/` com timestamp posterior, nunca edição do instalado.
Aplique com `supabase --workdir inbox-db db push` somente depois da reconciliação acima.

## Tipos TypeScript reais

`src/lib/inbox/` hoje fala com o banco sem tipos gerados (formatos em `src/lib/inbox/types.ts`).
Quando houver sessão do CLI autorizada ao projeto Inbox:

```bash
npm run inbox:types
```

Isso grava `src/lib/inbox/database.types.ts`. Nunca sobrescreva `src/integrations/supabase/types.ts`: é do calendário
e o schema do Inbox não tem `clients`/`contents`. **Pendente: depende dessa sessão do CLI.**
