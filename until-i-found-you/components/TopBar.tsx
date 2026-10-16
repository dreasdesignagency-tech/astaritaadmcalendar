"use client";

import { useState } from "react";
import { RotateCcw, Volume2, VolumeX } from "lucide-react";

export default function TopBar({
  sound,
  onToggleSound,
  onReset,
}: {
  sound: boolean;
  onToggleSound: () => void;
  onReset: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="on-wine pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto flex items-center gap-2 text-paper/80">
        {confirming ? (
          <div className="flex items-center gap-2 rounded-full bg-paper px-3 py-1.5 text-[0.7rem] text-wine shadow-sm">
            <span>Recomeçar tudo?</span>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                onReset();
              }}
              className="font-medium underline underline-offset-2"
            >
              Sim
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="text-mute">
              Não
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label="Reiniciar a experiência"
            title="Reiniciar a experiência"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
          >
            <RotateCcw size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onToggleSound}
        aria-pressed={sound}
        aria-label={sound ? "Desligar sons" : "Ligar sons"}
        title={sound ? "Desligar sons" : "Ligar sons"}
        className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full text-paper/80 hover:bg-white/10"
      >
        {sound ? <Volume2 size={17} strokeWidth={1.5} /> : <VolumeX size={17} strokeWidth={1.5} />}
      </button>
    </div>
  );
}
