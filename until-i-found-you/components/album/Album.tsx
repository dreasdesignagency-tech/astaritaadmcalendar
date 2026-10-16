"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { config } from "@/config/experience";
import { Heart } from "../ornaments";
import PageOne from "./PageOne";
import PageThree from "./PageThree";
import PageTwo from "./PageTwo";

const PAGES = 3;

export default function Album({ page, onPage }: { page: number; onPage: (p: number) => void }) {
  const [dir, setDir] = useState(1);
  const [egg, setEgg] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= PAGES || next === page) return;
      setDir(next > page ? 1 : -1);
      onPage(next);
    },
    [page, onPage],
  );

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [page]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(page + 1);
      if (e.key === "ArrowLeft") go(page - 1);
      if (e.key === "Escape") setEgg(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, page]);

  useEffect(() => {
    if (!egg) return;
    const t = setTimeout(() => setEgg(false), 5200);
    return () => clearTimeout(t);
  }, [egg]);

  const showEgg = useCallback(() => setEgg(true), []);

  return (
    <section className="flex h-dvh flex-col px-3 pb-3 pt-[max(3.25rem,calc(env(safe-area-inset-top)+2.5rem))] sm:px-8 sm:pb-6">
      <div className="paper relative mx-auto flex min-h-0 w-full max-w-[640px] flex-1 flex-col overflow-hidden">
        <div
          ref={scroller}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
          style={{ perspective: 1400, touchAction: "pan-y" }}
          onTouchStart={(e) => {
            const t = e.touches[0];
            if (t) touch.current = { x: t.clientX, y: t.clientY };
          }}
          onTouchEnd={(e) => {
            const s = touch.current;
            const t = e.changedTouches[0];
            touch.current = null;
            if (!s || !t) return;
            const dx = t.clientX - s.x;
            const dy = t.clientY - s.y;
            if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) go(page + (dx < 0 ? 1 : -1));
          }}
        >
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={page}
              custom={dir}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * 36, rotateY: d * -9 }),
                center: { opacity: 1, x: 0, rotateY: 0 },
                exit: (d: number) => ({ opacity: 0, x: d * -36, rotateY: d * 9 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: dir > 0 ? "left center" : "right center" }}
              className="min-h-full"
            >
              {page === 0 && <PageOne onEgg={showEgg} />}
              {page === 1 && <PageTwo />}
              {page === 2 && <PageThree onEgg={showEgg} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <nav
          aria-label="Navegação do álbum"
          className="grid shrink-0 grid-cols-3 items-center border-t border-wine/15 bg-paper px-4 py-3 text-[0.78rem] text-mute"
        >
          <button
            type="button"
            onClick={() => go(page - 1)}
            disabled={page === 0}
            className="flex items-center gap-1.5 justify-self-start py-1 tracking-[0.1em] transition hover:text-wine disabled:opacity-0"
          >
            <ArrowLeft size={14} /> back
          </button>
          <span className="text-center" aria-live="polite">
            page <span className="text-wine">{page + 1}</span> of {PAGES}
          </span>
          <button
            type="button"
            onClick={() => go(page + 1)}
            disabled={page === PAGES - 1}
            className="flex items-center gap-1.5 justify-self-end py-1 tracking-[0.1em] transition hover:text-wine disabled:opacity-0"
          >
            next <ArrowRight size={14} />
          </button>
        </nav>

        <AnimatePresence>
          {egg && (
            <motion.div
              role="status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEgg(false)}
              className="wine-bg on-wine absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center gap-6 px-10 text-center text-paper"
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 180, damping: 10 }}>
                <Heart className="h-12 w-12" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.9 }}
                className="font-serif text-3xl italic leading-tight"
              >
                {config.album.easterEgg}
              </motion.p>
              <span className="text-[0.65rem] tracking-[0.2em] text-paper/50">TOQUE PARA FECHAR</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
