# Motion · Clínica PorInteiro + Escolinha Daia Baby (HyperFrames)

Vídeo vertical 1080×1920, 25,4 s, com narração e trilha. Feito com [HyperFrames](https://hyperframes.heygen.com).

## Renderizar o MP4

```bash
cd motion-porinteiro-hyperframes
npx hyperframes@0.8.168 browser ensure   # só na primeira vez
npx hyperframes@0.8.168 render -q high -o renders/motion.mp4
```

Para ver e mexer na linha do tempo: `npx hyperframes@0.8.168 preview`.

## Onde editar

- `compositions/peca.html`: textos, cores (variáveis em `#root`) e animações (objeto `T` com o início de cada cena, em segundos)
- `index.html`: trilha e falas da narração (`<audio>` com `data-start` de cada fala)
- `assets/audio/`: `trilha.mp3` e `voz-1.mp3` a `voz-6.mp3`

Se trocar a narração, ajuste o `data-start` de cada `voz-N` e o tempo da cena correspondente em `T`.
