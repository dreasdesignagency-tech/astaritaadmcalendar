"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { config } from "@/config/experience";
import Frame from "./Frame";
import { Heart } from "./ornaments";

export default function Intro({ onStart }: { onStart: () => void }) {
  const { intro } = config;
  const [first, ...rest] = intro.title.split(" ");

  return (
    <section className="flex min-h-dvh items-center px-4 py-14 sm:px-8">
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <Frame className="px-6 pb-10 pt-8 text-center sm:px-12">
          <div className="flex items-center justify-between">
            <span className="eyebrow">{intro.period}</span>
            <span className="eyebrow">01 · 05</span>
          </div>

          <div className="mx-auto mt-10 h-px w-10 bg-wine/40" />

          <h1 className="mt-8 font-serif text-[2.7rem] font-medium italic leading-[1.05] text-wine sm:text-6xl">
            <span className="script mr-0.5 text-[5.2rem] not-italic leading-[0.5] sm:text-[6.5rem]">{first.charAt(0)}</span>
            {first.slice(1)} {rest.join(" ")}
          </h1>

          <p className="mt-5 font-serif text-lg italic text-mute">{intro.subtitle}</p>

          <div className="mx-auto my-8 flex items-center justify-center gap-3 text-wine/70">
            <span className="h-px w-10 bg-wine/30" />
            <Heart className="h-3 w-3" />
            <span className="h-px w-10 bg-wine/30" />
          </div>

          <p className="script text-4xl text-wine">{intro.dedication}</p>

          <div className="mx-auto mt-7 max-w-sm space-y-4 text-[0.95rem] leading-relaxed text-[#5b4a4a]">
            {intro.lines.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>

          <button
            type="button"
            onClick={onStart}
            className="group mt-10 inline-flex items-center gap-3 border border-wine bg-wine px-7 py-4 text-[0.72rem] font-medium tracking-[0.2em] text-paper transition hover:bg-crimson active:scale-[0.98]"
          >
            {intro.button}
            <ArrowRight size={15} className="transition group-hover:translate-x-1" />
          </button>
        </Frame>
      </motion.div>
    </section>
  );
}
