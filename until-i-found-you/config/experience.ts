/**
 * ============================================================
 *  UNTIL I FOUND YOU  |  ARQUIVO CENTRAL DE CONTEÚDO
 * ============================================================
 *  Tudo que aparece no site está aqui: nomes, datas, perguntas,
 *  respostas, dicas, mensagens, fotos, músicas e a carta.
 *  Você não precisa mexer em nenhum componente.
 *
 *  Tudo marcado com  [CONFIGURAR ...]  é um PLACEHOLDER:
 *  troque pelo dado real antes de enviar para a Juline.
 *
 *  Texto com *asteriscos* aparece em letra caligráfica vinho.
 * ============================================================
 */

export type Chapter = {
  id: string;
  number: string;
  /** rótulo pequeno acima do título */
  label: string;
  title: string;
  question: string;
  /** respostas aceitas (maiúsculas, acentos e espaços extras são ignorados) */
  answers: string[];
  inputPlaceholder: string;
  inputMode?: "text" | "numeric";
  /** dicas em ordem; cada clique em "dica" libera a próxima */
  hints: string[];
  success: string;
  /** referência discreta exibida abaixo da mensagem de sucesso */
  scripture?: { ref: string; text: string };
  /** palavra secreta revelada */
  word: string;
  /** true = a resposta ainda é provisória e precisa ser trocada */
  placeholder?: boolean;
  placeholderNote?: string;
};

export const config = {
  /**
   * Mostra avisos discretos nos itens provisórios (respostas, músicas, fotos).
   * Troque para false quando tudo estiver preenchido.
   */
  showPlaceholderNotes: true,

  couple: { her: "Juline", him: "Andreas" },

  intro: {
    period: "2024 — 2026",
    title: "Until I Found You",
    subtitle: "Uma história de dois anos, cinco segredos e um único destino.",
    dedication: "Para Juline, com amor.",
    lines: [
      "Durante esses dois anos, construímos uma história que só nós dois conhecemos.",
      "Mas antes de chegar à sua surpresa, preciso saber se você ainda lembra de alguns detalhes...",
    ],
    button: "COMEÇAR NOSSA HISTÓRIA",
  },

  chapters: [
    {
      id: "comeco",
      number: "01",
      label: "O começo",
      title: "O dia em que tudo mudou.",
      question:
        "Antes de sermos nós, existiu um dia que mudou tudo. Você lembra qual foi?",
      // [CONFIGURAR DATA OFICIAL DO INÍCIO DO NAMORO] no formato DD/MM/AAAA
      answers: ["00/00/0000"],
      inputPlaceholder: "DD/MM/AAAA",
      inputMode: "text",
      hints: [
        "Pense no dia em que a gente deixou de ser só amigos e passou a ser nós dois.",
        "É uma data completa: dia, mês e ano, separados por barra.",
        "Escreva no formato DD/MM/AAAA, por exemplo 05/03/2024.",
      ],
      success: "Foi nesse dia que Deus começou um dos capítulos mais bonitos da minha vida.",
      word: "VOCÊ",
      placeholder: true,
      placeholderNote: "Resposta provisória: digite 00/00/0000. Troque pela data real em config/experience.ts.",
    },
    {
      id: "primeira-memoria",
      number: "02",
      label: "A primeira memória",
      title: "Onde tudo começou.",
      question:
        "O tempo passou, mas existe um lugar que sempre vai me lembrar de nós. Onde foi nosso primeiro encontro?",
      // [CONFIGURAR LOCAL DO PRIMEIRO ENCONTRO] (pode listar várias formas de escrever)
      answers: ["local do primeiro encontro"],
      inputPlaceholder: "Escreva o nome do lugar",
      hints: [
        "Não foi um lugar qualquer: ele ainda faz a gente sorrir quando passa por perto.",
        "Pense no lugar, não no dia. Pode ser só o nome, sem endereço.",
        "Se o lugar tem mais de um jeito de ser chamado, qualquer um deles vale.",
      ],
      success:
        "Eu não sabia tudo que a gente viveria depois daquele dia. Mas hoje, olhando para trás, sou muito grato por ele ter acontecido.",
      word: "É",
      placeholder: true,
      placeholderNote:
        'Resposta provisória: digite "local do primeiro encontro". Troque pelo lugar real em config/experience.ts.',
    },
    {
      id: "nosso-jeito",
      number: "03",
      label: "Nosso jeito",
      title: "Uma palavra, tantos significados.",
      question:
        "Existem milhares de maneiras de chamar alguém. Mas qual é a palavra que mais usamos um com o outro?",
      answers: ["amor", "meu amor", "amorzinho"],
      inputPlaceholder: "Uma palavra",
      hints: [
        "Tem quatro letras.",
        "É o que a gente fala o dia inteiro, de manhã e antes de dormir.",
        "Começa com A e tem tudo a ver com o motivo desse site.",
      ],
      success:
        "Engraçado como uma palavra tão pequena consegue carregar tanta coisa. Você virou meu amor, minha companhia e minha melhor amiga.",
      word: "MINHA",
    },
    {
      id: "o-centro",
      number: "04",
      label: "O centro",
      title: "Quem escreveu essa história?",
      question:
        "Antes de existir um nós, Ele já conhecia nossa história. Quem eu quero que continue sendo o centro dela?",
      answers: ["jesus", "jesus cristo", "cristo", "deus"],
      inputPlaceholder: "Escreva o nome",
      hints: [
        "É quem a gente mais agradece nas orações.",
        "O nome tem cinco letras.",
        "É o nome que está acima de todos os nomes.",
      ],
      success:
        "Minha oração é que Jesus continue sendo o centro da nossa história. Que a gente cresça em amor, paciência e fé, aprendendo todos os dias a cuidar um do outro.",
      scripture: {
        ref: "Eclesiastes 4:12",
        text: "O cordão de três dobras não se rompe com facilidade.",
      },
      word: "PESSOA",
    },
    {
      id: "proximos-capitulos",
      number: "05",
      label: "Os próximos capítulos",
      title: "Eu escolheria de novo.",
      question:
        "Se eu pudesse escolher alguém para viver todos os próximos capítulos da minha vida, quem seria?",
      answers: ["juline", "a juline", "voce", "você", "eu", "a minha juline"],
      inputPlaceholder: "Um nome",
      hints: [
        "Essa pessoa está lendo isso agora.",
        "Não é difícil: é a pessoa mais importante deste site inteiro.",
        "É o nome que abre esta página: Para ... com amor.",
      ],
      success:
        "Dois anos foram só o começo. E se eu pudesse voltar no tempo, escolheria viver tudo outra vez com você.",
      word: "FAVORITA",
    },
  ] satisfies Chapter[],

  wrongMessages: [
    "Hmm, não foi essa. Tenta de novo, meu amor.",
    "Quase. Respira e pensa mais um pouquinho.",
    "Ainda não. Se precisar, tem uma dica logo abaixo.",
    "Essa não abre o cadeado. Mas eu sei que você lembra.",
  ],

  ui: {
    verify: "VERIFICAR",
    hint: "Receber uma dica",
    noMoreHints: "Sem mais dicas",
    nextChapter: "PRÓXIMO CAPÍTULO",
    toFinal: "IR PARA O DESAFIO FINAL",
    secretWord: "Palavra secreta",
    wordsFound: "Palavras secretas",
  },

  final: {
    title: "Você encontrou todos os segredos.",
    text: "Agora só falta uma coisa. Organize as palavras e descubra o que eu queria te dizer desde o começo.",
    /** ordem inicial embaralhada das palavras */
    shuffled: ["PESSOA", "VOCÊ", "FAVORITA", "É", "MINHA"],
    /** frase correta, na ordem certa */
    solution: ["VOCÊ", "É", "MINHA", "PESSOA", "FAVORITA"],
    check: "VERIFICAR FRASE",
    wrong: "Essa ordem ainda não diz o que eu quero dizer. Tenta outra vez.",
    hintEmpty: "Toque nas palavras abaixo para montar a frase.",
    hintPlaced: "Toque numa palavra montada para tirá-la, ou use as setas para trocar de lugar.",
  },

  reveal: {
    phrase: "Você sempre foi minha resposta favorita.",
    lines: [
      "Parabéns, meu amor. Você chegou até aqui.",
      "Mas a melhor parte dessa história nunca esteve escondida.",
      "Ela sempre foi você.",
    ],
    button: "ABRIR NOSSO MUNDO",
  },

  album: {
    easterEgg: "Se você encontrou isso, ganhou mais um eu te amo. ❤️",

    page1: {
      left: "09",
      right: "02",
      /** use \n para quebrar linha */
      title: "How *divine*\nto just be [ *mine* ].",
      stickers: {
        left: "She's my girl.",
        center: "My favorite person.",
        right: "Only you.",
      },
      signature: "Andreas & Juline",
      caption: "Two years, countless memories.",
    },

    /**
     * Coloque suas fotos em /public/photos com estes nomes (ou troque aqui).
     * Enquanto o arquivo não existir, aparece um espaço elegante de placeholder.
     */
    photos: [
      { src: "/photos/foto-1.jpg", alt: "Andreas e Juline, foto 1" },
      { src: "/photos/foto-2.jpg", alt: "Andreas e Juline, foto 2" },
      { src: "/photos/foto-3.jpg", alt: "Andreas e Juline, foto 3" },
    ],
    /** fotos em preto e branco (apenas filtro de cor, sem distorcer) */
    grayscale: true,

    page2: {
      cornerLeft: "true love",
      cornerCenter: "the story of us",
      cornerRight: "02 / 03",
      headline: "Girl, I'm so *in love* with *you.*",
    },

    /** Cada item é um parágrafo. Use "" para uma linha em branco. */
    letter: {
      greeting: "Meu amor,",
      paragraphs: [
        "Dois anos.",
        "É engraçado pensar em tudo que aconteceu desde que começamos essa história. Tantas conversas, risadas, sonhos, desafios e momentos que hoje fazem parte de quem nós somos.",
        "Eu sou muito grato a Deus pela tua vida e por poder caminhar contigo.",
        "Amo nossas brincadeiras, nossos planos e até os dias mais comuns, porque contigo eles também se tornam especiais.",
        "Minha oração é que Jesus continue sendo o centro de tudo que estamos construindo.",
        "Obrigado por estar comigo, por me apoiar e por dividir tua vida comigo.",
        "Se esses foram nossos primeiros dois anos, eu fico imaginando quantas coisas bonitas ainda temos pela frente.",
        "Eu te amo, Juline.",
      ],
      closing: "Com amor,",
      signature: "Andreas.",
    },

    page3: {
      title: "You remind me\nof the color *Blue.*",
      footer: "Every love song reminds me of you.",
      pageNumber: "03 / 03",
      listen: "Ouvir",
    },

    /**
     * Músicas. Para cada uma:
     *  - cover: arquivo em /public/music (ex.: "/music/capa-1.jpg"); sem arquivo, aparece uma capa de placeholder
     *  - url: link do Spotify ou YouTube (deixe "" se ainda não tiver)
     *  - dedication: sua dedicatória (não copie letras de músicas)
     */
    songs: [
      {
        title: "[CONFIGURAR MÚSICA 1]",
        artist: "[ARTISTA]",
        dedication: "[CONFIGURAR DEDICATÓRIA 1] Escreva aqui por que essa música lembra dela.",
        cover: "/music/capa-1.jpg",
        url: "",
        provider: "Spotify",
        placeholder: true,
      },
      {
        title: "[CONFIGURAR MÚSICA 2]",
        artist: "[ARTISTA]",
        dedication: "[CONFIGURAR DEDICATÓRIA 2] Escreva aqui por que essa música lembra dela.",
        cover: "/music/capa-2.jpg",
        url: "",
        provider: "Spotify",
        placeholder: true,
      },
      {
        title: "[CONFIGURAR MÚSICA 3]",
        artist: "[ARTISTA]",
        dedication: "[CONFIGURAR DEDICATÓRIA 3] Escreva aqui por que essa música lembra dela.",
        cover: "/music/capa-3.jpg",
        url: "",
        provider: "YouTube",
        placeholder: true,
      },
    ] as Song[],
  },
};

export type Song = {
  title: string;
  artist: string;
  dedication: string;
  cover: string;
  url: string;
  provider: string;
  placeholder?: boolean;
};
