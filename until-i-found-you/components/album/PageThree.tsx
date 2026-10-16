"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { config, type Song } from "@/config/experience";
import { Rich, Star } from "../ornaments";
import SpotifyPlayer, { trackIdFromUrl } from "./SpotifyPlayer";

function Cover({ song, index }: { song: Song; index: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        role="img"
        aria-label={`Capa provisória de ${song.title}`}
        className="flex h-full w-full flex-col items-center justify-center bg-sand p-3 text-center"
      >
        <span className="font-serif text-4xl italic text-wine/70">{index + 1}</span>
        <span className="mt-2 text-[0.55rem] tracking-[0.15em] text-mute">CAPA DO ÁLBUM</span>
      </div>
    );
  }
  return (
    <Image
      src={song.cover}
      alt={`Capa de ${song.title}, ${song.artist}`}
      fill
      sizes="(max-width: 560px) 40vw, 220px"
      loading="lazy"
      onError={() => setFailed(true)}
      className="object-cover"
    />
  );
}

function SongRow({
  song,
  index,
  flip,
  active,
  onToggle,
}: {
  song: Song;
  index: number;
  flip: boolean;
  active: boolean;
  onToggle: () => void;
}) {
  const [hover, setHover] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const trackId = trackIdFromUrl(song.url);
  const canPlay = !!trackId && !failed;
  const out = hover || active;

  return (
    <motion.li
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={`flex items-center gap-3 ${flip ? "flex-row-reverse" : ""}`}>
      {/* capa + disco saindo pela lateral */}
      <button
        type="button"
        onClick={() => {
          setFailed(false);
          onToggle();
        }}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHover(false)}
        aria-pressed={active}
        aria-label={active ? `Parar ${song.title}` : canPlay ? `Tocar 30 segundos de ${song.title}` : `Girar o disco de ${song.title}`}
        className="relative shrink-0"
        style={{
          width: "min(34vw, 180px)",
          [flip ? "marginLeft" : "marginRight"]: "min(10.5vw, 56px)",
        }}
      >
        <div className="relative aspect-square w-full">
          <div
            className={`absolute top-[4%] z-0 aspect-square h-[92%] transition-transform duration-700 ease-out ${
              flip ? "right-0" : "left-0"
            }`}
            style={{
              transform: `translateX(${out ? (flip ? "-52%" : "52%") : flip ? "-34%" : "34%"})`,
            }}
          >
            <div
              className="vinyl relative h-full w-full rounded-full"
              style={{ animation: playing || (hover && !active) ? "spin-slow 4s linear infinite" : undefined }}
            />
          </div>
          <div className="relative z-10 h-full w-full overflow-hidden border-2 border-wine bg-sand">
            <Cover song={song} index={index} />
          </div>
        </div>
      </button>

      {/* texto */}
      <div className={`min-w-0 flex-1 ${flip ? "pl-2 text-right" : "pr-2"}`}>
        <p className="font-serif text-xl font-medium italic leading-tight text-wine">{song.title}</p>
        <p className="eyebrow mt-1 !text-[0.62rem]">{song.artist}</p>
        <p className="mt-3 text-[0.82rem] italic leading-relaxed text-[#5b4a4a]">&ldquo;{song.dedication}&rdquo;</p>
        {song.url ? (
          <a
            href={song.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-3 inline-flex items-center gap-1.5 border-b border-wine pb-0.5 text-[0.68rem] tracking-[0.16em] text-wine hover:text-crimson ${
              flip ? "flex-row-reverse" : ""
            }`}
          >
            {config.album.page3.listen.toUpperCase()} NO {song.provider.toUpperCase()}
            <ExternalLink size={11} />
          </a>
        ) : (
          config.showPlaceholderNotes &&
          song.placeholder && (
            <p className="mt-3 text-[0.65rem] leading-snug text-mute/80">
              [link do {song.provider} a configurar]
            </p>
          )
        )}
      </div>
      </div>

      {active && canPlay && trackId && (
        <div className="mt-4">
          <SpotifyPlayer trackId={trackId} onPlaying={setPlaying} onError={() => setFailed(true)} />
          <p className="mt-1.5 text-center text-[0.65rem] tracking-[0.12em] text-mute">
            30 SEGUNDOS DA NOSSA MÚSICA
          </p>
        </div>
      )}
      {active && failed && (
        <p className="mt-3 text-center text-xs text-mute">Não deu para carregar o player. Use o botão &ldquo;Ouvir&rdquo; acima.</p>
      )}
    </motion.li>
  );
}

export default function PageThree({ onEgg }: { onEgg: () => void }) {
  const { page3, songs } = config.album;
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden px-5 pb-8 pt-8 sm:px-10">
      <Star className="pointer-events-none absolute -left-6 top-4 h-16 w-16 text-blush/70" />
      <button
        type="button"
        onClick={onEgg}
        aria-label="Uma estrela escondida"
        className="absolute -right-7 top-16 h-20 w-20 rotate-12 cursor-default text-blush/60"
      >
        <Star className="h-full w-full" />
      </button>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative text-center font-serif text-[1.9rem] italic leading-[1.1] text-mute sm:text-4xl"
      >
        <Rich text={page3.title} scriptClass="text-wine text-[3rem] sm:text-6xl" />
      </motion.h2>

      <ul className="relative mt-10 flex-1 space-y-9">
        {songs.map((s, i) => (
          <SongRow
            key={i}
            song={s}
            index={i}
            flip={i % 2 === 1}
            active={activeIdx === i}
            onToggle={() => setActiveIdx((a) => (a === i ? null : i))}
          />
        ))}
      </ul>

      <footer className="mt-10 flex items-end justify-between gap-4">
        <p className="font-serif text-base italic text-mute">{page3.footer}</p>
        <span className="font-serif text-sm text-wine">{page3.pageNumber}</span>
      </footer>
    </div>
  );
}
