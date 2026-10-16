# Motion · Clínica PorInteiro + Escolinha Daia Baby

Animação vertical 1080×1920 (9:16), 11,7 s em loop, feita só com HTML, CSS e Web Animations API.

## Abrir

```bash
cd motion-porinteiro
python3 -m http.server 8765
```

- Prévia com controles: http://localhost:8765/
- Gravação (sem controles, palco colado no canto): http://localhost:8765/?rec
  Numa janela de 1080×1920 o palco fica em escala 1:1.

Atalhos: `Espaço` pausa/play, `R` reinicia, `H` esconde os controles.

## Onde editar

- Textos e blocos: `index.html` (cada cena tem seu bloco comentado)
- Cores e fontes: variáveis em `:root` no `style.css`
- Tempos e movimentos: array `SCENES` no `script.js`
- Arte de fundo e foto: `CONFIG` no `script.js` (arquivos em `assets/`)
