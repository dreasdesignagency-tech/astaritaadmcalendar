"use client";

import { motion } from "framer-motion";
import { config } from "@/config/experience";
import { Rich } from "../ornaments";
import Photo from "./Photo";

function Sticker({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span
      className={`absolute z-10 whitespace-nowrap bg-wine px-1.5 py-[3px] font-serif text-[0.62rem] italic leading-none text-paper sm:text-xs ${className}`}
    >
      {children}
    </span>
  );
}

export default function PageOne({ onEgg }: { onEgg: () => void }) {
  const { page1, photos, grayscale } = config.album;
  const [left, center, right] = photos;

  return (
    <div className="flex min-h-full flex-col px-4 pb-6 pt-6 sm:px-8">
      <header className="grid grid-cols-[2rem_1fr_2rem] items-start gap-2 sm:grid-cols-[3rem_1fr_3rem]">
        <span className="pt-4 font-serif text-sm text-wine">{page1.left}</span>
        <h2 className="text-center font-serif text-[1.7rem] font-normal italic leading-[1.05] text-mute sm:text-4xl">
          <Rich text={page1.title} scriptClass="text-wine text-[2.4rem] sm:text-6xl" />
        </h2>
        <span className="pt-4 text-right font-serif text-sm text-wine">{page1.right}</span>
      </header>

      <div className="my-auto py-8">
        <div className="-mx-4 flex items-center justify-center gap-[3%] sm:-mx-8">
          {left && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="-ml-[9%] w-[31%] shrink-0"
            >
              <Photo src={left.src} alt={left.alt} grayscale={grayscale} priority sizes="(max-width: 560px) 31vw, 180px" className="aspect-[3/4.1] w-full">
                <Sticker className="-bottom-2 -right-3">{page1.stickers.left}</Sticker>
              </Photo>
            </motion.div>
          )}
          {center && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="z-[1] w-[56%] shrink-0"
            >
              <Photo src={center.src} alt={center.alt} grayscale={grayscale} priority sizes="(max-width: 560px) 56vw, 320px" className="aspect-[4/5] w-full">
                <Sticker className="-left-2 top-[18%] sm:-left-3">{page1.stickers.center}</Sticker>
              </Photo>
            </motion.div>
          )}
          {right && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="-mr-[9%] w-[31%] shrink-0"
            >
              <Photo src={right.src} alt={right.alt} grayscale={grayscale} sizes="(max-width: 560px) 31vw, 180px" className="aspect-[3/4.1] w-full">
                <Sticker className="-bottom-2 -left-3">{page1.stickers.right}</Sticker>
              </Photo>
            </motion.div>
          )}
        </div>
      </div>

      <footer className="pb-1 text-center">
        <p className="text-[0.82rem] text-mute">
          {page1.signature.split("&")[0]}
          <button
            type="button"
            onClick={onEgg}
            aria-label="Um detalhe escondido"
            className="script mx-1 cursor-default px-1 text-xl text-wine"
          >
            &
          </button>
          {page1.signature.split("&")[1]}
        </p>
        <p className="mt-1 font-serif text-[0.95rem] italic text-wine">{page1.caption}</p>
      </footer>
    </div>
  );
}
