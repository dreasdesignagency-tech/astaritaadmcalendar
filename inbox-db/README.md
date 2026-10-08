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

## Configurar o projeto real

Ver `SETUP.md` (passo a passo, o que depende de você e o que a auditoria confere) e `sql/` (auditoria somente leitura e criação dos perfis).

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

Alternativa sem o CLI (verificado em 08/10/2026: a tabela `supabase_migrations.schema_migrations` não existe no projeto Inbox):
aplicar a primeira migration nova (por exemplo `proposed/inbox_hardening.sql`) com `apply_migration` do conector, que cria o ledger,
e em seguida registrar a baseline com um `insert` de metadados (`version = '20261008000000'`, `name = 'inbox_install'`).
Isso não executa o SQL da baseline de novo. Depende de aprovação.

## Próximas mudanças de banco

Cada alteração nova vira um arquivo novo em `supabase/migrations/` com timestamp posterior, nunca edição do instalado.
Aplique com `supabase --workdir inbox-db db push` somente depois da reconciliação acima.

## Tipos TypeScript reais

`src/lib/inbox/database.types.ts` foi gerado do projeto Inbox real em 08/10/2026 e o cliente do Inbox já é tipado com ele.
Para regerar: `npm run inbox:types` (precisa de sessão do CLI autorizada ao projeto) ou o gerador de tipos do conector.
Nunca sobrescreva `src/integrations/supabase/types.ts`: é do calendário e o schema do Inbox não tem `clients`/`contents`.
Os campos de status e papel vêm como `string` (o banco usa `check`, não enum); os tipos de união ficam em `src/lib/inbox/types.ts`.
