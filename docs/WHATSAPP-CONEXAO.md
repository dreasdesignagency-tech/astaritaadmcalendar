# Conectar o WhatsApp ao Astarita Inbox (Cloud API oficial)

**Aviso de confiabilidade.** A documentação oficial da Meta (`developers.facebook.com`) não pôde ser aberta durante o desenvolvimento
(o ambiente bloqueia o domínio). Os nomes de menus e campos abaixo vêm do conhecimento do autor e **podem ter mudado**. Se uma tela da Meta
for diferente, siga a tela da Meta. O que foi testado é o lado do Inbox, contra uma Meta **simulada**, e nunca contra a Meta real.

Endereço do webhook de produção: `https://astarita-inbox.vercel.app/api/whatsapp/webhook`

## 1. Qual número usar (decidir antes de mexer na Meta)

| Opção | O que acontece | Recomendação |
|---|---|---|
| **A. Número de teste da Meta** | A Meta dá um número de teste e permite enviar para até 5 telefones cadastrados. Não toca no atendimento atual. | **Comece por aqui.** |
| **B. Um número novo, só para a API** | Chip ou linha nova, registrada na Cloud API. Não existe no WhatsApp comum. | Boa para produção se não puder arriscar o número atual. |
| **C. O número que a Astarita já usa no app WhatsApp Business** | Existe um recurso oficial chamado **coexistência** (usar app e API no mesmo número). **Não confirmado para o seu caso**, ver abaixo. | Só depois de confirmar com a Meta. |

**Registrar o número atual diretamente na Cloud API, sem coexistência, normalmente tira esse número do app WhatsApp Business**
(o atendimento pelo celular para). Esse comportamento é do conhecimento do autor, não foi confirmado na documentação atual. **Não faça isso
com o número em uso.**

### O que se sabe sobre coexistência (fontes não oficiais, resultado de busca)
- Exige o fluxo **Embedded Signup** da Meta, em modo próprio para "conectar um app WhatsApp Business existente". Não é o cadastro comum de número.
- Pelas fontes consultadas: app WhatsApp Business em versão recente (citada 2.24.17 ou maior), país do número suportado, app mantido instalado
  no celular e aberto de tempos em tempos, taxa fixa de 20 mensagens por segundo, e a Meta envia os webhooks `smb_message_echoes`
  (o que você envia pelo app), `history` e `smb_app_state_sync`.
- A Meta publicou uma lista de países suportados que cresceu ao longo do tempo. **Não consegui confirmar se o Brasil (+55) está na lista atual.**
- **Não consegui confirmar se uma empresa pode usar a coexistência com o próprio app da Meta, sem ser Tech Provider/parceiro.** Se for
  exigido ser parceiro, a Astarita não consegue por conta própria.
- O Inbox já entende o webhook de eco (`smb_message_echoes`) e mostra as mensagens enviadas pelo app na conversa. O histórico antigo (`history`)
  **não é importado** e o webhook `smb_app_state_sync` é ignorado.

**Pergunta para a Meta/suporte antes de decidir:** "Minha empresa pode ativar a coexistência para o número +55 … usando meu próprio app, sem ser
Tech Provider? O Brasil é suportado hoje?"

## 2. Passos na Meta (opção A, número de teste)

1. Entre em `developers.facebook.com` com a conta da Meta de quem administra a Astarita. Se não tiver conta de desenvolvedor, crie.
2. **Meus apps > Criar app** > tipo **Empresa (Business)**. Dê o nome (por exemplo, "Astarita Inbox") e escolha o portfólio empresarial da Astarita.
3. No app, adicione o produto **WhatsApp**.
4. Em **WhatsApp > Configuração da API (API Setup)** aparecem a conta WhatsApp Business de teste, o **número de teste** e o **ID do número de telefone**.
   Anote o ID do número (é o valor de `WHATSAPP_PHONE_NUMBER_ID`). Cadastre o seu celular como destinatário de teste.
5. **App secret:** **Configurações do app > Básico > Chave secreta do app** (mostrar). Vai em `META_APP_SECRET`.
6. **Token que não expira:** o token da tela de API Setup vale só 24 horas. Para um token permanente: **Configurações do negócio** (Business Settings) >
   **Usuários > Usuários do sistema** > criar um usuário do sistema (Admin) > **Adicionar ativos** (o app e a conta WhatsApp Business, controle total) >
   **Gerar token**, escolhendo o app e as permissões `whatsapp_business_messaging` e `whatsapp_business_management`. Vai em `WHATSAPP_ACCESS_TOKEN`.
7. **Verify token:** invente um texto longo e aleatório. Ele vai em `WHATSAPP_VERIFY_TOKEN` e também no campo da Meta (passo 9).
8. **Versão da API:** use a versão que a Meta mostra nos exemplos da API Setup, por exemplo `v21.0` (ou mais nova). Vai em `WHATSAPP_API_VERSION`.

## 3. Variáveis na Vercel (projeto `astarita-inbox`)

**Settings > Environment Variables**, ambiente Production, **sem** prefixo `VITE_`. Só estes **nomes** (os valores você digita lá, nunca em chat nem no GitHub):

| Nome | De onde vem |
|---|---|
| `INBOX_SUPABASE_SERVICE_ROLE_KEY` | Supabase do Inbox > Project Settings > API (chave de serviço / secret). Só para o servidor. |
| `WHATSAPP_PHONE_NUMBER_ID` | passo 4 |
| `META_APP_SECRET` | passo 5 |
| `WHATSAPP_ACCESS_TOKEN` | passo 6 |
| `WHATSAPP_VERIFY_TOKEN` | passo 7 |
| `WHATSAPP_API_VERSION` | passo 8 |

Depois, **Redeploy** (as variáveis só valem em um novo deploy). Abra **Configurações > Conectar o WhatsApp** no Inbox: os passos 1 a 3 devem ficar
verdes, e a tela mostra o número e o nome que a Meta devolveu.

## 4. Webhook na Meta

1. No app, **WhatsApp > Configuração (Configuration)** > Webhook > **Editar**.
2. **URL de retorno de chamada:** `https://astarita-inbox.vercel.app/api/whatsapp/webhook`
3. **Verificar token:** o mesmo texto de `WHATSAPP_VERIFY_TOKEN`. Salvar (a Meta faz uma chamada GET que o Inbox responde).
4. Em **Campos do webhook**, assine **messages**. (Só na coexistência, se confirmada: `smb_message_echoes`.)
5. Mande uma mensagem do seu celular para o número de teste. No Inbox, o passo "O webhook está recebendo eventos" fica verde e a conversa aparece.

Se a tela mostrar "chamada(s) recusada(s) por assinatura inválida", o `META_APP_SECRET` não é o do app que está enviando o webhook.

## 5. Regras da Meta que o Inbox respeita
- Texto livre só até **24 horas** depois da última mensagem do cliente. Depois disso, só **modelo de mensagem aprovado**
  (criado em **Gerenciador do WhatsApp > Modelos**). O Inbox trava o campo e oferece os modelos.
- Modelos e conversas iniciadas pela empresa podem ser cobrados pela Meta, e para sair do modo de teste costuma ser exigida uma
  forma de pagamento e a verificação do negócio. **Confira a tabela de preços atual da Meta.** O Inbox não ativa nada pago sozinho.

## 6. O que cada um faz
- **Andreas (na Meta e na Vercel):** passos 2 a 4. Não me mande tokens: digite os valores direto na Vercel.
- **Claude:** só confere o estado pela tela e pelos testes. Não mexo na conta da Meta nem envio mensagem real sem autorização específica.
