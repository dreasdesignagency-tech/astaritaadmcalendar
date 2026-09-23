# calendario

Quero criar um web app pequeno e funcional para planejamento mensal de conteúdo da Astarita.

IMPORTANTE:

Tenho apenas 5 créditos disponíveis no Lovable.

Por isso:

- faça o máximo possível nesta primeira implementação;

- mantenha a arquitetura simples;

- não crie funcionalidades além das solicitadas;

- não desperdice créditos com alterações cosméticas desnecessárias;

- priorize funcionamento + calendário + clientes + funil;

- use componentes reutilizáveis;

- antes de criar algo novo, aproveite tudo que o projeto já possuir.

A imagem anexada é a principal referência visual.

Use como inspiração de layout, proporções, organização e experiência, sem copiar marca, textos ou identidade.

==================================================

OBJETIVO

==================================================

Quero uma ferramenta interna da Astarita para planejar os conteúdos mensais de cada cliente.

Cada cliente precisa ter seu próprio calendário editorial.

Porém, NÃO crie um calendário separado tecnicamente para cada cliente.

Crie um único sistema de calendário relacionado aos clientes.

Exemplo:

Seleciono:

ASTERA BEAUTY

→ aparecem somente os conteúdos da Astera.

Seleciono:

MAB SOLUÇÕES

→ aparecem somente os conteúdos da MAB.

Seleciono:

TODOS OS CLIENTES

→ aparecem todos os conteúdos juntos.

Cada conteúdo obrigatoriamente pertence a um cliente.

==================================================

TELA PRINCIPAL

==================================================

A tela principal deve ser o CALENDÁRIO.

Estrutura semelhante à referência:

SIDEBAR

ASTARITA

- Calendário

- Clientes

Não criar outras páginas neste primeiro momento.

Na área principal:

CALENDÁRIO DE CONTEÚDO

No topo:

[ Todos os clientes ▼ ]

[ ← ] OUTUBRO 2026 [ → ]

[ + Novo conteúdo ]

O sistema deve abrir inicialmente em OUTUBRO DE 2026.

O calendário deve funcionar dinamicamente para outros meses e anos.

==================================================

CALENDÁRIO

==================================================

Exibir:

SEG

TER

QUA

QUI

SEX

SÁB

DOM

Mostrar todos os dias do mês em grid.

Cada conteúdo aparece dentro do respectivo dia como um pequeno bloco.

Exemplo:

ASTERA BEAUTY

Vitamina C + ácidos

REEL

ou

VION

Bastidores do buffet

CARROSSEL

Não criar cards grandes.

Preciso visualizar o mês inteiro facilmente.

==================================================

FUNIL DE CONTEÚDO

==================================================

Essa funcionalidade é MUITO IMPORTANTE.

Todo conteúdo deve possuir:

TOPO

MEIO

FUNDO

Cada etapa deve possuir uma cor diferente.

Topo = azul

Meio = amarelo

Fundo = coral/vermelho

Usar essas cores nos pequenos blocos do calendário.

Adicionar legenda:

● Topo

● Meio

● Fundo

==================================================

ANÁLISE DO MÊS

==================================================

Quando eu selecionar um cliente, quero enxergar imediatamente a distribuição dos conteúdos daquele cliente.

Exemplo:

ASTERA BEAUTY

OUTUBRO 2026

12 conteúdos

TOPO 5

MEIO 4

FUNDO 3

42% topo

33% meio

25% fundo

Criar uma barra horizontal proporcional dividida pelas três cores.

Isso deve atualizar automaticamente conforme eu adiciono, removo ou altero conteúdos.

Se selecionar "Todos os clientes", mostrar os números gerais.

==================================================

NOVO CONTEÚDO

==================================================

Ao clicar:

+ Novo conteúdo

abrir um modal simples.

Campos:

Cliente *

Título *

Data *

Funil *

Formato *

Status

FUNIL:

Topo

Meio

Fundo

FORMATO:

Reel

Carrossel

Post estático

Stories

Vídeo

Outro

STATUS:

Ideia

Planejado

Em produção

Aguardando aprovação

Aprovado

Agendado

Publicado

Botões:

Cancelar

Salvar

==================================================

EDIÇÃO

==================================================

Ao clicar em um conteúdo existente no calendário:

abrir o mesmo modal preenchido.

Permitir:

editar

alterar data

alterar funil

alterar formato

alterar status

excluir

Após salvar, atualizar o calendário imediatamente.

==================================================

CLIENTES

==================================================

Criar uma página extremamente simples chamada:

CLIENTES

Permitir:

+ Adicionar cliente

Campos:

Nome

Cor identificadora

Mostrar os clientes cadastrados.

Permitir editar e arquivar.

Não criar CRM.

Não criar perfil complexo do cliente.

A função dessa página é somente alimentar o calendário.

==================================================

DADOS

==================================================

Se Supabase estiver conectado, utilizar Supabase.

Criar somente as estruturas necessárias.

Tabela:

clients

id

name

color

active

created_at

Tabela:

contents

id

client_id

title

publication_date

funnel_stage

format

status

created_at

updated_at

Relacionamento:

contents.client_id → clients.id

IMPORTANTE:

Cada cliente terá seu calendário através desse relacionamento.

Não criar tabelas de calendário separadas para cada cliente.

==================================================

VISUAL

==================================================

Seguir fortemente a referência anexada.

Quero:

fundo cinza/off-white muito claro

área principal branca

sidebar branca

bordas finas cinza

tipografia sans-serif moderna

muito espaço em branco

visual extremamente organizado

poucas sombras

cantos discretos

calendário grande

Não quero:

gradientes

glassmorphism

efeitos exagerados

dashboard colorido

cards gigantes

visual genérico de SaaS

As cores devem aparecer principalmente nos conteúdos e na análise do funil.

O calendário precisa ser o protagonista.

==================================================

RESPONSIVIDADE

==================================================

Prioridade: DESKTOP.

No mobile, em vez de comprimir as 7 colunas, mostrar os conteúdos em formato de agenda/lista por data.

==================================================

IMPORTANTE PARA ECONOMIZAR CRÉDITOS

==================================================

Faça essa primeira versão já funcional e completa dentro desse escopo.

Não pare no meio para me perguntar decisões visuais pequenas.

Quando houver uma decisão não especificada, escolha a solução mais simples e coerente com a referência.

Não adicione:

- financeiro

- relatórios complexos

- IA

- notificações

- chat

- CRM

- usuários/equipe

- automações

- configurações avançadas

Quero apenas:

CLIENTES + CALENDÁRIO + CONTEÚDOS + FUNIL.

Todos os botões criados precisam funcionar.

Antes de finalizar:

- teste criação de cliente;

- teste criação de conteúdo;

- teste edição;

- teste exclusão;

- teste troca de cliente;

- teste troca de mês;

- confirme que outubro de 2026 aparece corretamente;

- confirme que os números de topo/meio/fundo são calculados automaticamente;

- verifique desktop e mobile.

Não faça alterações fora desse escopo.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/528b4e7e-5013-456d-8937-a2809bebe07a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
