# Until I Found You

Um presente digital para a Juline: cinco enigmas, cinco palavras secretas, uma frase para montar e um álbum romântico no final.

Feito com Next.js, TypeScript, Tailwind CSS e Framer Motion. Sem banco de dados, sem login, sem API. O progresso fica salvo no próprio navegador (localStorage).

## Rodar no computador

```bash
cd until-i-found-you
npm install
npm run dev        # abre em http://localhost:3000
```

Para testar a versão de produção:

```bash
npm run build
npm start
```

## O que você precisa trocar antes de enviar

Tudo fica em **`config/experience.ts`**. O que está marcado com `[CONFIGURAR ...]` é provisório:

1. **Data do início do namoro** (capítulo 1). Hoje a resposta provisória é `00/00/0000`.
2. **Local do primeiro encontro** (capítulo 2). Hoje a resposta provisória é `local do primeiro encontro`.
3. **Fotos** (3 arquivos).
4. **Músicas** (nome, artista, dedicatória, capa e link).

Quando terminar, mude `showPlaceholderNotes` para `false` no topo do arquivo. Isso esconde os avisos cinzas de "resposta provisória" e "link a configurar".

## Adicionar as fotos

Coloque três arquivos em `public/photos/`:

- `foto-1.jpg` (esquerda)
- `foto-2.jpg` (central, a maior)
- `foto-3.jpg` (direita)

Fotos em pé (retrato) funcionam melhor. Elas aparecem em preto e branco por um filtro de cor, sem cortar nem distorcer os rostos além do enquadramento. Se quiser colorido, mude `grayscale` para `false` no config. Se usar outros nomes, ajuste os caminhos em `album.photos`.

Enquanto o arquivo não existir, aparece um espaço de placeholder escrito "sua foto aqui".

## Editar perguntas e respostas

Em `config/experience.ts`, no bloco `chapters`. Cada capítulo tem:

- `question`: a pergunta
- `answers`: lista de respostas aceitas (pode colocar várias formas de escrever)
- `hints`: dicas, liberadas uma por clique
- `success`: mensagem ao acertar
- `word`: a palavra secreta revelada

A conferência ignora maiúsculas, acentos, pontuação e espaços extras. Datas aceitam `1/1/2024`, `01-01-2024` e `01012024` como se fossem `01/01/2024`.

Se mudar as palavras secretas, atualize também `final.solution` (ordem certa) e `final.shuffled` (ordem embaralhada que aparece no desafio).

## Trocar as músicas

Em `album.songs`, três itens. Para cada um:

- `title` e `artist`
- `dedication`: seu texto (não coloque letras de músicas)
- `cover`: capa em `public/music/` (ex.: `/music/capa-1.jpg`, quadrada)
- `url`: link do Spotify ou YouTube. Se ficar vazio, o botão de ouvir não aparece
- `provider`: "Spotify" ou "YouTube" (só o texto do botão)

O site não toca música. O botão abre o link em outra aba.

## Modificar a carta

Em `album.letter`. Cada item de `paragraphs` é um parágrafo. `greeting`, `closing` e `signature` são o começo e o fim.

## Easter eggs

Dois jeitos de achar a mensagem escondida: tocar no **&** de "Andreas & Juline" na página 1, ou tocar na estrela clara no canto da página 3. O texto fica em `album.easterEgg`.

## Publicar na Vercel

Este projeto mora numa subpasta do repositório. Na Vercel:

1. Importe o repositório.
2. Em **Root Directory**, escolha `until-i-found-you`.
3. O framework é detectado como Next.js. Não precisa de variável de ambiente.
4. Clique em Deploy.

Também dá pelo terminal, de dentro da pasta: `npx vercel`.

O site já está com `noindex`, então o Google não lista a página.

## Detalhes

- Sons são opcionais e começam desligados (ícone no canto superior direito). São gerados pelo navegador, sem arquivos.
- O botão de reiniciar (canto superior esquerdo) pede confirmação antes de apagar o progresso.
- Quem usa "reduzir movimento" no aparelho vê as animações simplificadas.
- Navegação do álbum: botões back/next, deslizar o dedo para o lado, ou setas do teclado.
