/* ==========================================================
   Configuração
   ========================================================== */
const CONFIG = {
  // Arte de fundo pronta (ex.: "assets/fundo.jpg"). null = fundo em CSS.
  background: null,
  // Foto com parallax (ex.: "assets/foto.jpg"). null = sem foto.
  photo: null,
  // Reinicia sozinho ao terminar
  loop: true,
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"; // saída suave, sem tranco
const EASE_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";

/* ==========================================================
   Linha do tempo (ms)
   at: início · dur: duração · stagger: atraso entre itens do mesmo grupo
   ========================================================== */
const SCENES = [
  // CENA 1 · fundo e elementos visuais (0 a 1s)
  { el: "bg", at: 0, dur: 1000, from: { opacity: 0 }, to: { opacity: 1 } },
  {
    // zoom muito lento do fundo, termina antes da pausa final
    el: "bg",
    at: 0,
    dur: 8600,
    ease: EASE_IN_OUT,
    from: { transform: "scale(1.06)" },
    to: { transform: "scale(1)" },
  },
  {
    el: "deco",
    at: 100,
    dur: 1100,
    stagger: 150,
    from: { opacity: 0, transform: "translateY(30px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  {
    el: "photo",
    at: 0,
    dur: 1000,
    from: { opacity: 0 },
    to: { opacity: 1 },
  },

  // CENA 2 · título revelado por máscara, linha a linha (1s a 2.4s)
  {
    el: "title",
    at: 900,
    dur: 1100,
    stagger: 220,
    from: { opacity: 0, transform: "translateY(105%)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },

  // CENA 3 · realização, discreta (2.3s a 3.2s)
  {
    el: "partners",
    at: 2300,
    dur: 900,
    from: { opacity: 0, transform: "translateY(-12px)", letterSpacing: "0.3em" },
    to: { opacity: 1, transform: "translateY(0)", letterSpacing: "0.16em" },
  },

  // CENA 4 · informações em sequência (3.1s a 4.6s)
  {
    el: "info",
    at: 3100,
    dur: 800,
    stagger: 180,
    from: { opacity: 0, transform: "translateY(24px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },

  // CENA 5 · proposta e pilares (4.6s a 6.3s)
  {
    el: "proposal",
    at: 4600,
    dur: 1000,
    from: { opacity: 0, transform: "translateY(20px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  {
    el: "pillar",
    at: 5200,
    dur: 700,
    stagger: 160,
    from: { opacity: 0, transform: "translateY(14px) scale(0.96)" },
    to: { opacity: 1, transform: "translateY(0) scale(1)" },
  },

  // CENA 6 · inscrição e "venha de rosa" (6.4s a 7.6s)
  {
    el: "price",
    at: 6400,
    dur: 900,
    from: { opacity: 0, transform: "translateY(20px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  {
    el: "dresscode",
    at: 6750,
    dur: 900,
    from: { opacity: 0, transform: "scale(0.9)" },
    to: { opacity: 1, transform: "scale(1)" },
  },

  // CENA FINAL · CTA (7.7s a 8.6s), depois composição parada
  {
    el: "cta",
    at: 7700,
    dur: 900,
    from: { opacity: 0, transform: "translateY(24px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
];

const HOLD_END = 8600; // última entrada termina aqui
const HOLD_MS = 2600; // composição final parada para leitura
const EXIT_MS = 500; // fade curto antes de reiniciar o loop
const TOTAL = HOLD_END + HOLD_MS + EXIT_MS; // 11.7s

/* ==========================================================
   Motor de animação (Web Animations API, sem bibliotecas)
   ========================================================== */
const stage = document.getElementById("stage");
const frame = document.getElementById("stageFrame");
let animations = [];
let master = null;

function q(name) {
  return Array.from(stage.querySelectorAll(`[data-anim="${name}"]`));
}

function build() {
  animations.forEach((a) => a.cancel());
  animations = [];

  SCENES.forEach((s) => {
    q(s.el).forEach((node, i) => {
      const anim = node.animate([s.from, s.to], {
        duration: s.dur,
        delay: s.at + i * (s.stagger || 0),
        easing: s.ease || EASE,
        fill: "both",
      });
      animations.push(anim);
    });
  });

  // Parallax suave da foto ao longo de toda a peça
  const photoImg = stage.querySelector(".photo img");
  if (CONFIG.photo) {
    animations.push(
      photoImg.animate(
        [
          { transform: "translateY(30px) scale(1.08)" },
          { transform: "translateY(-10px) scale(1.02)" },
        ],
        { duration: HOLD_END, easing: EASE_IN_OUT, fill: "both" },
      ),
    );
  }

  // Saída: some o conteúdo e o fundo continua, para o loop não dar corte seco
  const exitTargets = [stage.querySelector(".content"), ...q("deco"), ...q("photo")];
  exitTargets.forEach((node) => {
    animations.push(
      node.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: EXIT_MS,
        delay: TOTAL - EXIT_MS,
        easing: EASE_IN_OUT,
        fill: "forwards",
      }),
    );
  });

  // Relógio mestre: controla o fim e o loop
  master = new Animation(new KeyframeEffect(null, [], { duration: TOTAL }), document.timeline);
  master.onfinish = () => {
    if (CONFIG.loop) restart();
  };
  animations.push(master);
}

function play() {
  animations.forEach((a) => a.play());
  setPressed("play");
}

function pause() {
  animations.forEach((a) => a.pause());
  setPressed("pause");
}

function restart() {
  build();
  play();
}

function isPaused() {
  return master && master.playState === "paused";
}

/* ==========================================================
   Escala do palco: 1080x1920 fixo, reduzido só para caber na tela
   ========================================================== */
const isRec = new URLSearchParams(location.search).has("rec");
if (isRec) document.body.classList.add("is-rec");

function fit() {
  const controls = document.getElementById("controls");
  const narrow = window.innerWidth <= 700;
  const controlsVisible = !isRec && !document.body.classList.contains("controls-hidden");
  const pad = isRec ? 0 : narrow ? 32 : 48;
  const sideW = controlsVisible && !narrow ? controls.offsetWidth + 32 : 0;
  const bottomH = controlsVisible && narrow ? controls.offsetHeight + 16 : 0;

  const availW = window.innerWidth - pad - sideW;
  const availH = window.innerHeight - pad - bottomH;
  const scale = Math.min(1, availW / 1080, availH / 1920);
  frame.style.setProperty("--scale", scale.toFixed(4));
}

/* ==========================================================
   Controles
   ========================================================== */
const btnRestart = document.getElementById("btnRestart");
const btnPause = document.getElementById("btnPause");
const btnPlay = document.getElementById("btnPlay");
const progressBar = document.getElementById("progressBar");
const timeLabel = document.getElementById("timeLabel");

function setPressed(state) {
  btnPlay.setAttribute("aria-pressed", String(state === "play"));
  btnPause.setAttribute("aria-pressed", String(state === "pause"));
}

btnRestart.addEventListener("click", restart);
btnPause.addEventListener("click", pause);
btnPlay.addEventListener("click", play);

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (isPaused()) play();
    else pause();
  } else if (e.key === "r" || e.key === "R") {
    restart();
  } else if (e.key === "h" || e.key === "H") {
    document.body.classList.toggle("controls-hidden");
    fit();
  }
});

function tick() {
  if (master) {
    const t = Number(master.currentTime) || 0;
    progressBar.style.width = `${Math.min(100, (t / TOTAL) * 100)}%`;
    timeLabel.textContent = `${(t / 1000).toFixed(1)}s`;
  }
  requestAnimationFrame(tick);
}

/* ==========================================================
   Início
   ========================================================== */
function applyAssets() {
  if (CONFIG.background) {
    stage.style.setProperty("--bg-image", `url("${CONFIG.background}")`);
  }
  if (CONFIG.photo) {
    const photo = stage.querySelector(".photo");
    photo.querySelector("img").src = CONFIG.photo;
    photo.hidden = false;
  }
}

function start() {
  applyAssets();
  fit();
  restart();
  tick();
}

window.addEventListener("resize", fit);

// Espera as fontes para o título não mudar de tamanho no meio da animação
const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))]).then(start);
