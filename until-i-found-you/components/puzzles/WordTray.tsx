import { config } from "@/config/experience";

/** Mostra as palavras secretas já descobertas. */
export default function WordTray({ solvedIds }: { solvedIds: string[] }) {
  return (
    <div className="mt-8 border-t border-wine/15 pt-5">
      <p className="eyebrow mb-3 text-center">
        {config.ui.wordsFound} · {solvedIds.length}/{config.chapters.length}
      </p>
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {config.chapters.map((c) => {
          const found = solvedIds.includes(c.id);
          return (
            <li
              key={c.id}
              aria-label={found ? c.word : "palavra ainda secreta"}
              className={
                found
                  ? "font-serif text-lg italic text-wine"
                  : "font-serif text-lg tracking-[0.3em] text-mute/50"
              }
            >
              {found ? c.word : "• • •"}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
