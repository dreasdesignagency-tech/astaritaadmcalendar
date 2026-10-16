"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { config } from "@/config/experience";
import { playSound } from "@/lib/sound";
import { Heart } from "./ornaments";

/** Sequência: coração + frase, depois as três linhas, depois o botão. */
export default function Reveal({ sound, onOpen }: { sound: boolean; onOpen: () => void }) {
  const { reveal } = config;
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0); // 0 coração, 1 frase, 2 linhas, 3 botão
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (reduce) {
      setStep(3);
      return;
    }
    playSound("reveal", sound);
    const t = [
      setTimeout(() => setStep(1), 1400),
      setTimeout(() => setStep(2), 5200),
      setTimeout(() => setStep(3), 5200 + reveal.lines.length * 2400 + 800),
    ];
    return () => t.forEach(clearTimeout);
  }, [reduce, sound, reveal.lines.length]);

  return (
    <section className="wine-bg on-wine relative flex min-h-dvh flex-col items-center justify-center px-8 py-16 text-center text-paper">
      <motion.div
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: step >= 2 ? 0.55 : 1, opacity: 1 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Heart className="h-14 w-14 text-paper" />
        </motion.div>
      </motion.div>

      <div className="mt-10 min-h-[16rem] max-w-md">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.p
              key="phrase"
              initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 1.6 }}
              className="font-serif text-[2.4rem] font-medium italic leading-[1.1] sm:text-5xl"
            >
              {reveal.phrase}
            </motion.p>
          )}
          {step >= 2 && (
            <motion.div key="lines" className="space-y-5">
              {reveal.lines.map((line, i) => (
                <motion.p
                  key={line}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduce || skipped ? 0 : i * 2.4, duration: 1.4 }}
                  className={
                    i === reveal.lines.length - 1
                      ? "script pt-2 text-5xl"
                      : "font-serif text-[1.45rem] italic leading-snug"
                  }
                >
                  {line}
                </motion.p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex h-24 flex-col items-center justify-start gap-4">
        {step >= 3 ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            onClick={onOpen}
            autoFocus
            className="border border-paper bg-paper px-7 py-4 text-[0.72rem] font-medium tracking-[0.2em] text-wine transition hover:bg-sand active:scale-[0.98]"
          >
            {reveal.button} ❤️
          </motion.button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setSkipped(true);
              setStep(3);
            }}
            className="text-[0.68rem] tracking-[0.2em] text-paper/50 underline-offset-4 hover:text-paper/80 hover:underline"
          >
            PULAR ANIMAÇÃO
          </button>
        )}
      </div>
    </section>
  );
}
