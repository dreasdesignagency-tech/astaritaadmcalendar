# Guia de uso do Astarita Inbox

Este guia é para quem vai atender: Andreas e Juline. Tudo o que está aqui existe no sistema. Se algo depender de configuração
que ainda não foi feita (WhatsApp ou IA), a própria tela avisa no topo ou em Configurações.

## Entrar
1. Abra o endereço do Inbox e vá em `/inbox`.
2. Entre com seu e-mail e senha. Não existe cadastro aberto: só quem foi liberado pela administração entra.
3. Primeira vez, ou senha esquecida: na tela de entrada, clique em "Definir ou recuperar senha" e siga o e-mail.

## Caixa de entrada (`/inbox`)
- À esquerda, as conversas. Use as abas (Todas, Não lidas, Aguardando resposta, Resolvidas) e a busca por nome, telefone ou texto.
- No meio, o histórico. Ao abrir uma conversa, as não lidas zeram.
- À direita, os dados do contato, a etapa no funil, as observações, os lembretes e o Assistente Astarita.
- No celular, a lista e a conversa ficam em telas separadas. O botão de painel no topo da conversa abre os detalhes.

**Responder.** Escreva no campo de baixo. Enter envia, Shift+Enter quebra a linha. A mensagem aparece como "enviando", depois
"enviada", "entregue" e "lida", conforme o WhatsApp informar. Se falhar, aparece o motivo em português e o botão "Tentar de novo".

**Janela de 24 horas.** O WhatsApp só permite texto livre até 24 horas depois da última mensagem do cliente. O Inbox mostra
quanto tempo falta. Passou disso, o campo de texto livre trava e só dá para enviar um modelo de mensagem aprovado pela Meta.
Essa regra é da Meta, não do Inbox.

**Responsável e status.** No topo da conversa você escolhe quem cuida dela e clica em Resolver. Reabrir traz a conversa de volta.
Se outra pessoa mexeu na mesma conversa antes de você, o sistema avisa e recarrega, em vez de sobrescrever.

**Respostas rápidas.** O raio no campo de mensagem abre a lista. Escolha uma e o texto entra no campo para você revisar.
`{nome}` vira o nome do cliente. Nada é enviado sozinho.

**Observações internas.** Ficam só para a equipe, nunca vão para o cliente. Cada uma mostra quem escreveu e quando.

**Lembretes.** Crie no painel do contato, com data e hora. O sino no topo mostra os que estão vencidos ou próximos.

## Assistente Astarita
Fica no painel da direita. Ele **só sugere**. Nada vai para o cliente sem você clicar em Enviar.

- **Sugerir resposta:** escreve uma resposta com base na conversa e na base de conhecimento.
- **Mais natural, mais curta, mais profissional, mais acolhedora:** reescrevem o texto que está no campo de resposta
  (ou a última sugestão).
- **Resumir conversa:** resumo só para você, não vai para o cliente.
- A sugestão aparece numa caixa que você pode editar. **Usar resposta** coloca o texto no campo de resposta.
  **Gerar novamente**, **Copiar** e **Descartar** fazem o que dizem.
- Se faltar informação (preço, prazo, condição), ele não deve inventar. Ele sugere confirmar ou perguntar.
  Mesmo assim, **sempre leia antes de enviar**.

**Base de conhecimento** (Configurações > Conhecimento da Astarita). São 8 campos. Apresentação e metodologia já vêm com o que
estava no briefing. Serviços, diferenciais, perguntas frequentes, condições comerciais e respostas aprovadas começam vazios de
propósito: preencha com o que a Astarita realmente oferece e cobra. Quanto melhor o texto aqui, melhores as sugestões.

## Contatos (`/inbox/contatos`)
Cadastre, edite e busque por nome, empresa, Instagram, etiqueta ou parte do telefone. Filtre por categoria, responsável e etiqueta.
O botão de conversa abre ou cria o atendimento. Contato novo vira "Novo lead" no funil. Telefones são padronizados
(por exemplo, `11 99999-8888` vira `+55 11 99999-8888`) e o sistema evita duplicar o mesmo número.

## Funil (`/inbox/funil`)
Sete etapas: Novo lead, Em conversa, Reunião marcada, Proposta enviada, Negociação, Cliente fechado, Perdido.
Arraste o cartão para mudar a etapa (no celular, use o seletor dentro do cartão). Dá para trocar o responsável, buscar,
adicionar um contato ao funil e remover do funil sem apagar o contato.

## Configurações
- **Equipe com acesso:** quem pode entrar.
- **Conexões:** mostra o estado real do WhatsApp e da IA. Se algo faltar, diz o nome do que falta.
- **Conhecimento da Astarita:** os 8 campos usados pelo assistente.

## Se algo não funcionar
| Sintoma | O que fazer |
|---|---|
| "Inbox não configurado" ao abrir | Faltam as variáveis do projeto no ambiente publicado. Fale com quem administra. |
| "WhatsApp não conectado" no topo | Credenciais da Meta ausentes ou recusadas. Veja Configurações > Conexões. |
| Mensagem em vermelho "fora da janela de 24 horas" | Regra da Meta. Envie um modelo aprovado. |
| "Atualização em tempo real offline" | A tela continua funcionando e se atualiza sozinha a cada 15 segundos. |
| Assistente com botões desabilitados | IA não ligada. O atendimento funciona normalmente sem ela. |
