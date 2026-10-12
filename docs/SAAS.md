# Astarita Inbox como SaaS (várias empresas)

Esta versão atende **várias empresas no mesmo sistema**, cada uma com os seus dados, equipe, WhatsApp, funil, base de conhecimento
e limites. A Astarita é a empresa nº 1. Você (dono da plataforma) cria as outras pelo painel **Plataforma**.

## Como funciona
| Peça | O que é |
|---|---|
| Empresa (`organizations`) | Cliente do sistema: nome, endereço, plano, limite de pessoas, limite de sugestões de IA por mês, ativa ou suspensa. |
| Pessoa (`profiles`) | Pertence a UMA empresa. Nível: **proprietário** (tudo), **administrador** (equipe e WhatsApp), **atendente** (atende). |
| Dono da plataforma | Pessoa com `is_platform_admin`. Só ela vê o menu **Plataforma** e cria/suspende empresas. Hoje: Andreas. |
| WhatsApp por empresa (`org_whatsapp`) | Cada empresa salva o próprio ID do número, token e App Secret **na tela de Configurações**. Segredos criptografados (AES-256-GCM); o navegador nunca os lê. |
| Webhook por empresa | `/api/whatsapp/webhook/<chave aleatória da empresa>`. A assinatura é conferida com o App Secret da empresa e o evento precisa ser do número dela. |

## Como o isolamento é garantido (quatro camadas)
1. **Banco (RLS):** toda tabela tem `org_id` e cada consulta só enxerga a empresa de quem está logado. Empresa suspensa não lê nem escreve nada.
2. **Chaves compostas e gatilhos:** um filho (mensagem, nota, oportunidade...) só aponta para pai da mesma empresa; responsável de outra empresa e troca de empresa são recusados pelo banco.
3. **Servidor:** a empresa vem sempre do login (nunca do pedido) e toda consulta feita com a chave de serviço filtra por empresa.
4. **Webhook:** chave, verify token, App Secret e número são por empresa. Evento de outro número é ignorado.

Tudo isso tem teste automático com **duas empresas** (banco local, 96 verificações de API e 27 de interface, além dos testes de SQL),
inclusive tentativas de leitura, escrita, envio, mídia, IA e webhook cruzados. Mutações de teste (tirar o filtro de empresa de uma consulta)
fazem os testes falharem, ou seja, os testes pegam o erro.

## Colocar um cliente novo no ar (uns 3 minutos)
1. Entre como dono da plataforma e abra **Plataforma > Nova empresa**.
2. Informe nome da empresa, plano, nome e e-mail do dono. O sistema cria a empresa, o funil de 7 etapas, a base de conhecimento vazia e o acesso do dono.
3. Copie a **senha temporária** (aparece uma vez) e entregue ao dono por um canal seguro. Ele entra em `/inbox/entrar` e troca a senha em `/inbox/definir-senha`.
4. O dono, em **Configurações**, adiciona a equipe, preenche a **base de conhecimento** e conecta o **WhatsApp** (passo a passo na própria tela e em `docs/WHATSAPP-CONEXAO.md`).

## Planos e limites (editáveis por empresa no painel)
| Plano | Pessoas | Sugestões de IA por mês |
|---|---|---|
| Starter | 3 | 200 |
| Pro | 10 | 1.000 |
| Business | 25 | 3.000 |

Os valores são apenas padrões iniciais; o preço que você cobra é decisão sua. Custos que existem por trás: hospedagem (Vercel), banco (Supabase),
**IA (você paga o provedor; o limite mensal protege o seu custo)** e **mensagens da Meta (cobradas pela Meta ao dono da conta WhatsApp de cada empresa)**.

## O que ainda NÃO existe (decisões e trabalho futuro)
- **Cobrança automática** (cartão, boleto, bloqueio por falta de pagamento). Hoje a cobrança é manual e você suspende a empresa no painel.
- **Cadastro do WhatsApp pelo botão da Meta (Embedded Signup)** e **coexistência** com o app WhatsApp Business: exigem que a plataforma seja
  Tech Provider da Meta. Nesta versão **cada cliente usa o próprio app e o próprio número na Meta** e cola os dados na tela.
- **Chave de IA própria por cliente.** Hoje todas as empresas usam a chave da plataforma, com limite mensal.
- **Domínio próprio por cliente**, white-label (logo e cores por empresa), relatórios e exportação de dados.
- **Apagar uma empresa pelo painel** (o banco apaga tudo dela em cascata, mas só depois de remover as pessoas; não há botão ainda).
- **LGPD:** você passa a guardar conversas de clientes dos seus clientes. Antes de vender, redija contrato/termos e política de privacidade
  (a plataforma é operadora dos dados, cada empresa é a controladora) e defina retenção e backup. Isso precisa de orientação jurídica; o sistema não substitui.
- **Cadastro público.** Continua desligado de propósito: só o dono da plataforma e os administradores criam acessos.

## Variáveis do servidor (Vercel, Production, sem `VITE_`)
| Nome | Para quê |
|---|---|
| `INBOX_SUPABASE_SERVICE_ROLE_KEY` | o servidor criar usuários, empresas e receber webhooks (ignora a RLS: só no servidor) |
| `INBOX_SECRETS_KEY` | chave que criptografa o token e o App Secret de cada empresa (32 bytes em base64). **Se for perdida ou trocada, cada empresa precisa salvar o WhatsApp de novo.** Guarde uma cópia em cofre de senhas. |
| `INBOX_AI_PROVIDER`, `INBOX_AI_API_KEY`, `INBOX_AI_MODEL` | Assistente de IA (opcional) |

Para gerar a `INBOX_SECRETS_KEY`: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` (guarde o resultado; não mande por chat).

## Antes da migration (modo legado)

Se o código novo subir antes da migration multiempresa ser aplicada, o login e o CRM continuam funcionando: o app
reconhece que faltam as colunas novas (`org_id`, `access`, `is_platform_admin`) e trata todo mundo como uma empresa só,
sem poder de administração. Nesse período **não** funcionam: tela Plataforma, gestão de equipe por API, conexão do WhatsApp
por empresa, envio, mídia e IA (as rotas de servidor respondem com erro claro). Tudo isso volta ao aplicar a migration.
Teste: `STACK_SCHEMA=legacy tests/e2e/stack.sh up` e `node tests/e2e/inbox.e2e.mjs` (36 de 37 passam; a que falha é a
imagem recebida, que depende da rota de mídia).
