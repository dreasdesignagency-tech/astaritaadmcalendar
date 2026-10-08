# NÃO APLICAR

Estas duas migrations foram a primeira versão da fundação do Inbox (commits da Fase 1 e 2).
Ficam aqui só como registro. A versão realmente instalada no projeto Inbox, com as correções aprovadas,
é `../supabase/migrations/20261008000000_inbox_install.sql`.

Diferenças em relação a estes arquivos: função de trigger exclusiva `inbox_set_updated_at` (a antiga
`set_updated_at` podia sobrescrever uma função de outro sistema), `revoke all ... from public, anon, authenticated`
antes das concessões (evita privilégios herdados) e guardas que abortam se algo já existir.

Eles saíram de `supabase/migrations/` para que nenhuma ferramenta ligada ao projeto do calendário os enxergue.
