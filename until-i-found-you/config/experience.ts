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

export type Round = {
  question: string;
  /** respostas aceitas (maiúsculas, acentos e espaços extras são ignorados) */
  answers: string[];
  inputPlaceholder: string;
  inputMode?: "text" | "numeric";
  /** dicas em ordem; cada clique em "dica" libera a próxima */
  hints: string[];
  /** mensagem ao acertar (a da última pergunta aparece junto com a palavra secreta) */
  success: string;
  /** referência discreta exibida abaixo da mensagem de sucesso */
  scripture?: { ref: string; text: string };
  /** true = a resposta ainda é provisória e precisa ser trocada */
  placeholder?: boolean;
  placeholderNote?: string;
};

export type Chapter = {
  id: string;
  number: string;
  /** rótulo pequeno acima do título */
  label: string;
  title: string;
  /** perguntas do capítulo, em ordem. A palavra só é revelada depois da última. */
  rounds: Round[];
  /** palavra secreta revelada */
  word: string;
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
      word: "VOCÊ",
      rounds: [
        {
          question: "Antes de sermos nós, a gente se conheceu. Em que dia e mês foi isso?",
          answers: ["14/10", "14/10/2024"],
          inputPlaceholder: "DD/MM",
          hints: [
            "Foi em outubro de 2024.",
            "Foi lá pela metade do mês.",
            "Escreva só dia e mês, separados por barra. O dia é o 14.",
          ],
          success: "Foi aí que tudo começou, mesmo sem a gente saber.",
        },
        {
          question: "Depois de nos conhecermos, chegou o primeiro dia em que nos vimos pessoalmente. Que data foi essa?",
          answers: ["20/10/2024", "20/10"],
          inputPlaceholder: "DD/MM/AAAA",
          hints: [
            "Foi poucos dias depois de a gente se conhecer.",
            "Ainda em outubro de 2024, e foi no domingo.",
            "O dia tem dois números iguais a vinte.",
          ],
          success: "Foi nesse dia que Deus começou um dos capítulos mais bonitos da minha vida.",
        },
      ],
    },
    {
      id: "primeira-memoria",
      number: "02",
      label: "A primeira memória",
      title: "Onde tudo começou.",
      word: "É",
      rounds: [
        {
          question: "No dia seguinte ao nosso primeiro encontro, eu me expressei pra você. Que data foi essa?",
          answers: ["21/10/2024", "21/10"],
          inputPlaceholder: "DD/MM/AAAA",
          hints: [
            "Foi um dia depois de a gente se ver pela primeira vez.",
            "Se o primeiro encontro foi dia 20, esse foi o dia seguinte.",
            "Ainda é outubro de 2024.",
          ],
          success: "Tive coragem de falar o que eu sentia. Foi uma das melhores decisões que já tomei.",
        },
        {
          question: "Teve um dia em que a gente deu o primeiro beijo. Quando foi?",
          answers: ["31/10/2024", "31/10"],
          inputPlaceholder: "DD/MM/AAAA",
          hints: [
            "Foi no mesmo mês em que tudo começou.",
            "Foi no último dia do mês, e é o dia do Halloween para muita gente.",
            "Último dia de outubro de 2024.",
          ],
          success:
            "Eu não sabia tudo que a gente viveria depois daquele dia. Mas hoje, olhando para trás, sou muito grato por ele ter acontecido.",
        },
      ],
    },
    {
      id: "nosso-jeito",
      number: "03",
      label: "Nosso jeito",
      title: "Uma palavra, tantos significados.",
      word: "MINHA",
      rounds: [
        {
          question:
            "Existem milhares de maneiras de chamar alguém. Mas qual é a palavra que mais usamos um com o outro?",
          answers: ["amor", "meu amor", "amorzinho"],
          inputPlaceholder: "Uma palavra",
          hints: [
            "Tem quatro letras.",
            "É o que a gente fala o dia inteiro, de manhã e antes de dormir.",
            "Começa com A e tem tudo a ver com o motivo desse site.",
          ],
          success: "Uma palavra tão pequena e que diz tanta coisa.",
        },
        {
          question: "Toda história de amor tem uma trilha sonora. Qual é a nossa música?",
          answers: ["voce e assim", "você é assim"],
          inputPlaceholder: "Nome da música",
          hints: [
            "Ela fala de como a pessoa amada é, do jeito dela.",
            "O nome começa com Você.",
            "São três palavras: Você, é, assim.",
          ],
          success: "Toda vez que ela toca, eu lembro de você.",
        },
        {
          question: "Agora uma bem de pertinho: que chocolate eu mais gosto?",
          answers: ["alpino", "o alpino", "chocolate alpino"],
          inputPlaceholder: "O chocolate",
          hints: [
            "É um chocolate de marca conhecida, com leite.",
            "O nome lembra montanhas.",
            "Começa com A e termina com O.",
          ],
          success:
            "Engraçado como uma palavra tão pequena consegue carregar tanta coisa. Você virou meu amor, minha companhia e minha melhor amiga.",
        },
      ],
    },
    {
      id: "o-centro",
      number: "04",
      label: "O centro",
      title: "Quem escreveu essa história?",
      word: "PESSOA",
      rounds: [
        {
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
        },
        {
          question: "Todo casal que ora junto se apoia numa promessa. Qual é o nosso versículo? (livro, capítulo e versículo)",
          answers: ["mateus 18:19", "mateus 18 19", "mt 18:19", "matheus 18:19"],
          inputPlaceholder: "Livro 00:00",
          hints: [
            "Fala sobre dois que concordam na terra.",
            "É um livro do Novo Testamento, o primeiro deles.",
            "O capítulo é 18 e o versículo é 19.",
          ],
          success: "Quando a gente concorda e ora junto, Ele ouve.",
          scripture: {
            ref: "Mateus 18:19",
            text: "Se dois de vocês concordarem na terra sobre qualquer coisa que pedirem, meu Pai que está nos céus fará por eles.",
          },
        },
      ],
    },
    {
      id: "proximos-capitulos",
      number: "05",
      label: "Os próximos capítulos",
      title: "Eu escolheria de novo.",
      word: "FAVORITA",
      rounds: [
        {
          question: "Teve um dia em que fui na sua casa pela primeira vez. Que data foi essa?",
          answers: ["15/12/2024", "15/12"],
          inputPlaceholder: "DD/MM/AAAA",
          hints: [
            "Foi bem no fim do ano de 2024.",
            "Foi na metade de dezembro.",
            "Dia 15 do mês 12.",
          ],
          success: "Entrar na sua casa foi entrar um pouquinho mais na sua vida.",
        },
        {
          question: "Teve um dia muito especial, com trilha e uma tarde inteira só nossa. Quando foi?",
          answers: ["04/03/2025", "04/03", "4/3/2025"],
          inputPlaceholder: "DD/MM/AAAA",
          hints: [
            "Foi em 2025, no começo do ano.",
            "Foi no mês de março.",
            "Dia 4 de março.",
          ],
          success: "Uma tarde inteira com você já vale mais que muita semana.",
        },
        {
          question: "Passamos o feriado de Páscoa todo juntos. Em que dia ele começou?",
          answers: ["18/04/2025", "18/04"],
          inputPlaceholder: "DD/MM/AAAA",
          hints: [
            "Foi em abril de 2025.",
            "Foi numa sexta-feira, a Sexta-feira Santa.",
            "A data tem dois números: 18 e 04.",
          ],
          success: "Nem precisava de programa. Bastava estar junto.",
        },
        {
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
        },
      ],
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
    nextQuestion: "PRÓXIMA PERGUNTA",
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
     * position: onde fica o foco do corte (x% y%), para os rostos não serem cortados.
     */
    photos: [
      { src: "/photos/foto-1.jpg", alt: "Andreas e Juline sorrindo juntos dentro de um carro", position: "50% 40%" },
      { src: "/photos/foto-2.jpg", alt: "Andreas e Juline frente a frente ao pôr do sol", position: "50% 55%" },
      { src: "/photos/foto-3.jpg", alt: "Andreas abraça Juline e os dois sorriem para a câmera", position: "35% 50%" },
    ],
    /** fotos em preto e branco (apenas filtro de cor, sem distorcer) */
    grayscale: true,

    page2: {
      cornerLeft: "true love",
      cornerCenter: "the story of us",
      cornerRight: "02 / 03",
      headline: "Girl, I'm so *in love* with *you.*",
    },

    /** Cada item é um parágrafo (use \n para quebrar linha dentro dele). */
    letter: {
      greeting: "Meu amor,",
      paragraphs: [
        "Quão linda e única tu és!\nSua doçura e ousadia me apaixonam.\nQuando estou contigo, a noite brilha\ncomo o sol da manhã.",
        "Acredito que Van Gogh colocou\nestrelas sobre a vila,\npois ainda não conhecia\nseu sorriso estrelado.",
        "Amava o amarelo dos girassóis,\njamais olhou para o seu coração radiante.\nCristo é em ti!",
        "Sinto-me mais feliz que Van Gogh, amo seu sorriso, seu coração doce e ensinável, disposto a amar.",
        "Meu coração não te ama como Jesus,\nnessa substância carnal não chegaria a tal amor. Mas em paz, sei que o Amor nos amou\ne nos ensina a amar,\ne se Ele nos amou, quero buscar amar a ti também.",
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
        title: "Você é assim",
        artist: "Aliança",
        dedication: "[CONFIGURAR DEDICATÓRIA 1] A nossa música. Escreva aqui o que ela significa pra você.",
        cover: "/music/capa-1.jpg",
        url: "https://open.spotify.com/intl-pt/track/3HVbfel1UyI3CPirCfnSWe",
        provider: "Spotify",
        placeholder: true,
      },
      {
        title: "Partilhar",
        artist: "Rubel",
        dedication: "[CONFIGURAR DEDICATÓRIA 2] Escreva aqui por que essa música lembra dela.",
        cover: "/music/capa-2.jpg",
        url: "https://open.spotify.com/intl-pt/track/3qs9dRNSLaJ5l8pz2o6PdU",
        provider: "Spotify",
        placeholder: true,
      },
      {
        title: "Porque Eu Te Amo",
        artist: "Ana Vitória",
        dedication: "[CONFIGURAR DEDICATÓRIA 3] Escreva aqui por que essa música lembra dela.",
        cover: "/music/capa-3.jpg",
        url: "https://open.spotify.com/intl-pt/track/3idU6lZVKD6hvGjnpSHde8",
        provider: "Spotify",
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
