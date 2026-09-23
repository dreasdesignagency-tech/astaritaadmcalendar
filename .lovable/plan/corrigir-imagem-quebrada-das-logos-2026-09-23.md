# Corrigir imagem quebrada das logos

## Situação atual
- As logos (símbolo Astarita, logo completa e favicon) já estão dentro do projeto e são arquivos de imagem válidos, então vão junto para o GitHub.
- O erro de imagem quebrada vinha da versão antiga, que buscava a logo de um endereço externo.

## O que vou fazer
1. Abrir o app (tela de login, calendário e clientes) e confirmar que nenhuma logo aparece quebrada.
2. Gerar a versão final do app, como no deploy, e checar se as imagens vêm junto.
3. Se alguma tela ainda apontar para um endereço antigo, trocar pela imagem do projeto.
4. Colocar uma proteção: se a imagem não carregar, aparece o nome "Astarita" em texto no lugar do ícone quebrado.

## Detalhes técnicos
- `BrandLogo` importa `src/assets/astarita-symbol.png` (o Vite coloca o arquivo no build). Adicionar `onError` com o texto de reserva.
- Favicon em `public/favicon.png`, referenciado com caminho absoluto `/favicon.png`.
- Verificar com Playwright em `/auth` e rodar `vite build` para confirmar que os arquivos aparecem na pasta de saída.
