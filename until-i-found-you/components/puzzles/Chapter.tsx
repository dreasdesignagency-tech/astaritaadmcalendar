"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Lightbulb } from "lucide-react";
import { config, type Chapter as ChapterT } from "@/config/experience";
import { isCorrect } from "@/lib/normalize";
import { playSound } from "@/lib/sound";
import Frame from "../Frame";
import { Heart } from "../ornaments";
import WordTray from "./WordTray";

type Props = {
  chapter: ChapterT;
  index: number;
  total: number;
  solved: boolean;
  solvedIds: string[];
  hintsUsed: number;
  sound: boolean;
  onSolve: () => void;
  onHint: () => void;
  onNext: () => void;
};

export default function Chapter({
  chapter,
  index,
  total,
  solved,
  solvedIds,
  hintsUsed,
  sound,
  onSolve,
  onHint,
  onNext,
}: Props) {
  const [value, setValue] = useState("");
  const [wrongCount, setWrongCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { ui } = config;
  const isLast = index === total - 1;
  const hints = chapter.hints.slice(0, hintsUsed);
  const hasMoreHints = hintsUsed < chapter.hints.length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isCorrect(value, chapter.answers)) {
      setMessage(null);
      playSound("success", sound);
      onSolve();
      return;
    }
    const msgs = config.wrongMessages;
    setMessage(msgs[wrongCount % msgs.length] ?? msgs[0] ?? "Tenta de novo.");
    setWrongCount((n) => n + 1);
    setShakeKey((k) => k + 1);
    playSound("wrong", sound);
    inputRef.current?.focus();
    inputRef.current?.select();
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
        {/* indicador de progresso */}
        <div className="on-wine mx-auto mb-4 w-full max-w-[560px] px-1 text-paper">
          <div className="mb-2 flex items-baseline justify-between text-[0.7rem] tracking-[0.2em]">
            <span aria-live="polite">
              {chapter.number} / {String(total).padStart(2, "0")}
            </span>
            <span className="opacity-70">{ui.wordsFound.toUpperCase()}</span>
          </div>
          <div className="flex gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={solvedIds.length}>
            {config.chapters.map((c, i) => (
              <span
                key={c.id}
                className={`h-[3px] flex-1 transition-colors duration-700 ${
                  solvedIds.includes(c.id) ? "bg-paper" : i === index ? "bg-paper/50" : "bg-paper/20"
                }`}
              />
            ))}
          </div>
        </div>

        <Frame className="px-6 pb-8 pt-7 sm:px-12">
          <div className="flex items-start justify-between">
            <span className="eyebrow">{chapter.label}</span>
            <span className="eyebrow">capítulo</span>
          </div>

          <div className="mt-6 flex items-end gap-4">
            <span className="font-serif text-[4.2rem] font-light italic leading-[0.8] text-wine/80">{chapter.number}</span>
            <h2 className="pb-1 font-serif text-[1.9rem] font-medium italic leading-[1.05] text-wine sm:text-4xl">
              {chapter.title}
            </h2>
          </div>

          <p className="mt-6 text-[0.98rem] leading-relaxed text-[#4d3d3d]">{chapter.question}</p>

          <AnimatePresence mode="wait" initial={false}>
            {!solved ? (
              <motion.div key="ask" exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                <form onSubmit={submit} className="mt-7" noValidate>
                  <label htmlFor="answer" className="sr-only">
                    Sua resposta
                  </label>
                  <div key={shakeKey} className={shakeKey > 0 ? "shake" : ""}>
                    <input
                      id="answer"
                      ref={inputRef}
                      value={value}
                      onChange={(e) => {
                        setValue(e.target.value);
                        if (message) setMessage(null);
                      }}
                      inputMode={chapter.inputMode ?? "text"}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      placeholder={chapter.inputPlaceholder}
                      aria-invalid={!!message}
                      aria-describedby={message ? "feedback" : undefined}
                      className="w-full border-0 border-b border-wine/60 bg-transparent px-0 py-3 font-serif text-2xl italic text-wine placeholder:text-mute/60 focus:border-wine focus:outline-none focus:ring-0"
                    />
                  </div>

                  <p id="feedback" role="alert" className="min-h-[1.75rem] pt-2 text-sm text-crimson">
                    {message}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 border border-wine bg-wine px-6 py-3.5 text-[0.7rem] font-medium tracking-[0.2em] text-paper transition hover:bg-crimson active:scale-[0.98]"
                    >
                      {ui.verify}
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={!hasMoreHints}
                      onClick={() => {
                        playSound("tap", sound);
                        onHint();
                      }}
                      className="inline-flex items-center gap-2 border border-wine/40 px-5 py-3.5 text-[0.7rem] tracking-[0.15em] text-wine transition hover:border-wine disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Lightbulb size={14} strokeWidth={1.5} />
                      {hasMoreHints ? ui.hint : ui.noMoreHints}
                    </button>
                  </div>
                </form>

                {hints.length > 0 && (
                  <ol className="mt-6 space-y-2 border-l border-wine/30 pl-4" aria-label="Dicas liberadas">
                    {hints.map((h, i) => (
                      <motion.li
                        key={h}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-sm italic leading-relaxed text-mute"
                      >
                        <span className="not-italic text-wine">
                          Dica {i + 1}/{chapter.hints.length}.{" "}
                        </span>
                        {h}
                      </motion.li>
                    ))}
                  </ol>
                )}

                {config.showPlaceholderNotes && chapter.placeholder && (
                  <p className="mt-6 rounded-sm bg-sand px-3 py-2 text-[0.72rem] leading-snug text-mute">
                    {chapter.placeholderNote}
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="done"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="mt-8"
              >
                <div className="relative border border-wine/60 px-4 py-7 text-center">
                  <span className="eyebrow absolute -top-2 left-1/2 -translate-x-1/2 bg-paper px-3">
                    {ui.secretWord}
                  </span>
                  <p className="font-serif text-[2.6rem] font-medium italic leading-none text-wine" aria-label={chapter.word}>
                    {chapter.word.split("").map((ch, i) => (
                      <motion.span
                        key={i}
                        aria-hidden="true"
                        className="inline-block"
                        initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ delay: 0.35 + i * 0.12, duration: 0.7 }}
                      >
                        {ch}
                      </motion.span>
                    ))}
                  </p>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 12 }}
                    className="absolute -right-2.5 -top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-wine text-paper"
                  >
                    <Heart className="h-3.5 w-3.5" />
                  </motion.div>
                </div>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.8 }}
                  className="mt-6 font-serif text-xl italic leading-snug text-[#4d3d3d]"
                >
                  {chapter.success}
                </motion.p>

                {chapter.scripture && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4, duration: 0.8 }}
                    className="mt-4 text-[0.78rem] leading-relaxed text-mute"
                  >
                    <span className="tracking-[0.15em] text-wine">{chapter.scripture.ref.toUpperCase()}</span>
                    <span className="mx-2 text-wine/40">·</span>
                    <span className="italic">{chapter.scripture.text}</span>
                  </motion.p>
                )}

                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.6, duration: 0.6 }}
                  onClick={() => {
                    playSound("tap", sound);
                    onNext();
                  }}
                  autoFocus
                  className="group mt-8 inline-flex items-center gap-3 border border-wine bg-wine px-6 py-3.5 text-[0.7rem] font-medium tracking-[0.2em] text-paper transition hover:bg-crimson active:scale-[0.98]"
                >
                  {isLast ? ui.toFinal : ui.nextChapter}
                  <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <WordTray solvedIds={solvedIds} />
        </Frame>
      </motion.div>
    </section>
  );
}
