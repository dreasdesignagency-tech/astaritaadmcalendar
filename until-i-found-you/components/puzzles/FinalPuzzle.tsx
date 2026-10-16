"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { config } from "@/config/experience";
import { normalize } from "@/lib/normalize";
import { playSound } from "@/lib/sound";
import Frame from "../Frame";

export default function FinalPuzzle({ sound, onSolved }: { sound: boolean; onSolved: () => void }) {
  const { final } = config;
  const size = final.solution.length;
  const [slots, setSlots] = useState<(string | null)[]>(() => Array(size).fill(null));
  const [wrong, setWrong] = useState(false);
  const [shake, setShake] = useState(0);

  const pool = final.shuffled.filter((w) => !slots.includes(w));
  const full = slots.every(Boolean);
  const placed = slots.filter(Boolean).length;

  function place(word: string) {
    const i = slots.indexOf(null);
    if (i === -1) return;
    playSound("tap", sound);
    setWrong(false);
    setSlots((s) => s.map((v, k) => (k === i ? word : v)));
  }

  function remove(i: number) {
    playSound("tap", sound);
    setWrong(false);
    setSlots((s) => s.map((v, k) => (k === i ? null : v)));
  }

  function swap(i: number, j: number) {
    if (j < 0 || j >= size) return;
    playSound("tap", sound);
    setWrong(false);
    setSlots((s) => {
      const n = [...s];
      [n[i], n[j]] = [n[j] ?? null, n[i] ?? null];
      return n;
    });
  }

  function check() {
    const ok = slots.every((w, i) => w && normalize(w) === normalize(final.solution[i] ?? ""));
    if (ok) {
      onSolved();
      return;
    }
    playSound("wrong", sound);
    setWrong(true);
    setShake((k) => k + 1);
  }

  return (
    <section className="flex min-h-dvh flex-col justify-center px-4 py-16 sm:px-8">
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <Frame className="px-6 pb-9 pt-8 sm:px-12">
          <div className="flex justify-between">
            <span className="eyebrow">desafio final</span>
            <span className="eyebrow">05 · 05</span>
          </div>

          <h2 className="mt-8 font-serif text-[2rem] font-medium italic leading-[1.05] text-wine sm:text-4xl">
            {final.title}
          </h2>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-[#4d3d3d]">{final.text}</p>

          {/* frase montada */}
          <div
            key={shake}
            className={`mt-8 border border-wine/50 px-2 py-4 ${shake > 0 ? "shake" : ""}`}
            aria-label="Frase montada"
          >
            <ol className="flex flex-wrap items-center justify-center gap-2">
              {slots.map((w, i) => (
                <li key={i} className="flex flex-col items-center">
                  {w ? (
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        aria-label={`Remover ${w}`}
                        className="border border-wine bg-wine px-3 py-2 font-serif text-lg italic text-paper transition active:scale-95"
                      >
                        {w}
                      </button>
                      <div className="flex gap-1 text-wine">
                        <button
                          type="button"
                          onClick={() => swap(i, i - 1)}
                          disabled={i === 0}
                          aria-label={`Mover ${w} para a esquerda`}
                          className="rounded-sm p-1 hover:bg-sand disabled:opacity-20"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => swap(i, i + 1)}
                          disabled={i === size - 1}
                          aria-label={`Mover ${w} para a direita`}
                          className="rounded-sm p-1 hover:bg-sand disabled:opacity-20"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span
                      aria-label={`Espaço ${i + 1} vazio`}
                      className="mb-[26px] block h-10 w-14 border border-dashed border-wine/40"
                    />
                  )}
                </li>
              ))}
            </ol>
          </div>

          <p role="alert" className="min-h-[2.5rem] pt-3 text-center text-sm text-crimson">
            {wrong ? final.wrong : <span className="text-mute">{placed === 0 ? final.hintEmpty : final.hintPlaced}</span>}
          </p>

          {/* palavras disponíveis */}
          <ul className="mt-2 flex min-h-[3.5rem] flex-wrap items-center justify-center gap-2.5" aria-label="Palavras disponíveis">
            {pool.map((w) => (
              <motion.li key={w} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <button
                  type="button"
                  onClick={() => place(w)}
                  className="border border-wine/60 bg-paper px-4 py-2.5 font-serif text-xl italic text-wine transition hover:bg-sand active:scale-95"
                >
                  {w}
                </button>
              </motion.li>
            ))}
          </ul>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={check}
              disabled={!full}
              className="inline-flex items-center gap-2 border border-wine bg-wine px-7 py-4 text-[0.7rem] font-medium tracking-[0.2em] text-paper transition hover:bg-crimson active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {final.check}
              <Check size={14} />
            </button>
          </div>
        </Frame>
      </motion.div>
    </section>
  );
}
