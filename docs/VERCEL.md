# Hospedar o Astarita Inbox na Vercel (projeto separado)

Esta branch NÃO contém mais o calendário (removido; ele segue na `main` e na publicação do Lovable). O Inbox ganha um projeto Vercel próprio, ligado à branch `claude/happy-johnson-e8kozp`.

## Como o build funciona
- O app é TanStack Start com Nitro. O `vercel.json` manda construir com `NITRO_PRESET=vercel`, que gera o formato da Vercel.
  O build do Lovable continua usando o alvo dele (Cloudflare): este arquivo só vale na Vercel.
- `git.deploymentEnabled.main = false`: este projeto Vercel **não** faz deploy da `main`.
- Em produção o app usa sozinho a URL e a chave **publicável** do projeto Supabase do Inbox (`PUBLIC_INBOX_PROJECT` em
  `src/lib/inbox/config.ts`). Variáveis `VITE_INBOX_*` na Vercel, se existirem, têm prioridade.
- Nada secreto vai para o navegador: `INBOX_SUPABASE_SERVICE_ROLE_KEY`, `INBOX_SECRETS_KEY` e `INBOX_AI_*` só são
  lidas no servidor, em tempo de execução (token e App Secret do WhatsApp ficam cifrados no banco). Conferido no build com valores falsos: nenhum apareceu nos arquivos do navegador nem no servidor.

## Passo a passo (no painel da Vercel)
1. Add New > Project > importe o repositório `dreasdesignagency-tech/astaritaadmcalendar`.
2. Nome sugerido: `astarita-inbox`. Framework: deixe como detectado (Other/Nitro). Não mude Build Command nem Output.
3. Settings > Git > **Production Branch**: `claude/happy-johnson-e8kozp`.
4. Variáveis de ambiente: **nenhuma é obrigatória** para o CRM. Opcional: `VITE_INBOX_SUPABASE_URL` e `VITE_INBOX_SUPABASE_PUBLISHABLE_KEY`.
5. Deploy. O endereço será `https://astarita-inbox.vercel.app` (ou parecido).
6. No Supabase do Inbox: Authentication > URL Configuration: Site URL = esse endereço; Redirect URLs = `https://SEU-ENDERECO/inbox/definir-senha`.

## Depois (equipe, WhatsApp e IA)
Na Vercel, Settings > Environment Variables (Production, **sem** prefixo `VITE_`): `INBOX_SUPABASE_SERVICE_ROLE_KEY`, `INBOX_SECRETS_KEY` e, para a IA,
`INBOX_AI_PROVIDER`, `INBOX_AI_API_KEY`, `INBOX_AI_MODEL`. Depois, Redeploy. As credenciais do WhatsApp **não** vão mais na Vercel:
cada empresa as salva em Configurações (ver `docs/SAAS.md` e `docs/WHATSAPP-CONEXAO.md`).
