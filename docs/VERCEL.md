# Hospedar o Astarita Inbox na Vercel (projeto separado)

O calendário continua na publicação atual. O Inbox ganha um projeto Vercel próprio, ligado à branch `claude/happy-johnson-e8kozp`.

## Como o build funciona
- O app é TanStack Start com Nitro. O `vercel.json` manda construir com `NITRO_PRESET=vercel`, que gera o formato da Vercel.
  O build do Lovable continua usando o alvo dele (Cloudflare): este arquivo só vale na Vercel.
- `git.deploymentEnabled.main = false`: este projeto Vercel **não** faz deploy da `main`.
- Em produção o app usa sozinho a URL e a chave **publicável** do projeto Supabase do Inbox (`PUBLIC_INBOX_PROJECT` em
  `src/lib/inbox/config.ts`). Variáveis `VITE_INBOX_*` na Vercel, se existirem, têm prioridade.
- Nada secreto vai para o navegador: `INBOX_SUPABASE_SERVICE_ROLE_KEY`, `WHATSAPP_*`, `META_APP_SECRET` e `INBOX_AI_*` só são
  lidas no servidor, em tempo de execução. Conferido no build com valores falsos: nenhum apareceu nos arquivos do navegador nem no servidor.

## Passo a passo (no painel da Vercel)
1. Add New > Project > importe o repositório `dreasdesignagency-tech/astaritaadmcalendar`.
2. Nome sugerido: `astarita-inbox`. Framework: deixe como detectado (Other/Nitro). Não mude Build Command nem Output.
3. Settings > Git > **Production Branch**: `claude/happy-johnson-e8kozp`.
4. Variáveis de ambiente: **nenhuma é obrigatória** para o CRM. Opcional: `VITE_INBOX_SUPABASE_URL` e `VITE_INBOX_SUPABASE_PUBLISHABLE_KEY`.
5. Deploy. O endereço será `https://astarita-inbox.vercel.app` (ou parecido).
6. No Supabase do Inbox: Authentication > URL Configuration: Site URL = esse endereço; Redirect URLs = `https://SEU-ENDERECO/inbox/definir-senha`.

## Depois (WhatsApp e IA)
Na Vercel, Settings > Environment Variables (marque Production, **sem** prefixo `VITE_`): `INBOX_SUPABASE_SERVICE_ROLE_KEY`,
`WHATSAPP_*`, `META_APP_SECRET`, `INBOX_AI_*`. Depois, Redeploy. O webhook da Meta fica em `https://SEU-ENDERECO/api/whatsapp/webhook`.
