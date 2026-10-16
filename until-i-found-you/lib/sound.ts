/** Sons suaves gerados pelo navegador (sem arquivos). Só tocam se o som estiver ligado. */
let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, duration: number, volume = 0.05, type: OscillatorType = "sine") {
  const c = context();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = c.currentTime + start;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export type SoundName = "tap" | "wrong" | "success" | "reveal";

export function playSound(name: SoundName, enabled: boolean) {
  if (!enabled) return;
  switch (name) {
    case "tap":
      tone(660, 0, 0.12, 0.03);
      break;
    case "wrong":
      tone(220, 0, 0.25, 0.04, "triangle");
      tone(196, 0.12, 0.3, 0.035, "triangle");
      break;
    case "success":
      tone(523.25, 0, 0.5, 0.05);
      tone(659.25, 0.12, 0.5, 0.045);
      tone(783.99, 0.24, 0.7, 0.04);
      break;
    case "reveal":
      [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.22, 1.2, 0.04));
      break;
  }
}
