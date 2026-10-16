"use client";

import { motion, useReducedMotion } from "framer-motion";
import { config } from "@/config/experience";
import { Rich } from "../ornaments";

function LineHeart() {
  const reduce = useReducedMotion();
  const draw = (delay: number) => ({
    initial: { pathLength: reduce ? 1 : 0 },
    animate: { pathLength: 1 },
    transition: { duration: 2.6, delay, ease: "easeInOut" as const },
  });
  return (
    <svg viewBox="0 0 200 180" className="h-full w-full" fill="none" stroke="#88817E" strokeWidth="0.8" strokeLinecap="round" aria-hidden="true">
      <motion.path
        d="M100 168C42 122 12 88 12 56 12 32 31 16 54 16c20 0 37 12 46 30 9-18 26-30 46-30 23 0 42 16 42 40 0 32-30 66-88 112Z"
        {...draw(0.2)}
      />
      <motion.path
        d="M104 172C50 126 22 92 24 62 26 38 42 22 64 24c18 2 32 12 40 26 8-16 24-28 44-28 20 0 36 12 38 36 2 28-26 62-82 114Z"
        strokeOpacity="0.55"
        {...draw(0.6)}
      />
      <motion.path d="M6 128C40 92 82 150 120 112S180 96 196 128" strokeOpacity="0.7" {...draw(1)} />
      <motion.path d="M30 40C60 8 98 30 100 52" strokeOpacity="0.5" {...draw(1.4)} />
    </svg>
  );
}

export default function PageTwo() {
  const { page2, letter } = config.album;

  return (
    <div className="flex min-h-full flex-col px-5 pb-8 pt-6 sm:px-10">
      <header className="eyebrow grid grid-cols-3 items-start gap-2 text-[0.62rem] normal-case tracking-[0.12em] sm:text-xs">
        <span className="font-serif text-sm italic sm:text-base">{page2.cornerLeft}</span>
        <span className="text-center font-serif text-sm italic text-wine sm:text-base">{page2.cornerCenter}</span>
        <span className="text-right font-serif text-sm italic sm:text-base">{page2.cornerRight}</span>
      </header>

      <div className="relative mx-auto mt-10 flex aspect-[5/3.2] w-full max-w-sm items-center justify-center">
        <div className="absolute inset-0 opacity-70">
          <LineHeart />
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1.2 }}
          className="relative max-w-[16rem] text-center font-serif text-[1.55rem] italic leading-[1.1] text-wine sm:text-3xl"
        >
          <Rich text={page2.headline.replace(/ /g, " ").replace(/ \*/g, " *")} scriptClass="text-[2.1rem] text-wine sm:text-5xl" />
        </motion.h2>
      </div>

      <article className="mx-auto mt-14 w-full max-w-md">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 1 }}
          className="font-serif text-[1.55rem] italic text-wine"
        >
          {letter.greeting}
        </motion.p>

        <div className="mt-5 space-y-5">
          {letter.paragraphs.map((p, i) =>
            p === "" ? (
              <div key={i} className="h-3" />
            ) : (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className={
                  i === 0
                    ? "font-serif text-3xl italic text-wine"
                    : "text-[0.98rem] leading-[1.75] text-[#4d3d3d]"
                }
              >
                {p}
              </motion.p>
            ),
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="mt-8"
        >
          <p className="font-serif text-lg italic text-mute">{letter.closing}</p>
          <p className="script mt-1 text-5xl text-wine">{letter.signature}</p>
        </motion.div>
      </article>
    </div>
  );
}
