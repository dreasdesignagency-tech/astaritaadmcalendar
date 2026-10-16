"use client";

import { AnimatePresence, MotionConfig } from "framer-motion";
import { config } from "@/config/experience";
import { useProgress } from "@/lib/useProgress";
import Intro from "./Intro";
import Chapter from "./puzzles/Chapter";
import FinalPuzzle from "./puzzles/FinalPuzzle";
import Reveal from "./Reveal";
import Album from "./album/Album";
import TopBar from "./TopBar";

const chapterIds = config.chapters.map((c) => c.id);

export default function Experience() {
  const { state, update, reset, ready } = useProgress(chapterIds);
  const total = config.chapters.length;

  // fundo vinho enquanto o progresso salvo é carregado
  if (!ready) return <main className="wine-bg min-h-dvh" aria-busy="true" />;

  let stage: string;
  let view: React.ReactNode;

  if (!state.started) {
    stage = "intro";
    view = <Intro onStart={() => update({ started: true, cursor: 0 })} />;
  } else if (state.cursor < total) {
    const chapter = config.chapters[state.cursor]!;
    stage = `chapter-${chapter.id}`;
    view = (
      <Chapter
        chapter={chapter}
        index={state.cursor}
        total={total}
        solved={state.solved.includes(chapter.id)}
        solvedIds={state.solved}
        hintsUsed={state.hints[chapter.id] ?? 0}
        sound={state.sound}
        onSolve={() =>
          update((s) => ({ solved: s.solved.includes(chapter.id) ? s.solved : [...s.solved, chapter.id] }))
        }
        onHint={() => update((s) => ({ hints: { ...s.hints, [chapter.id]: (s.hints[chapter.id] ?? 0) + 1 } }))}
        onNext={() => update((s) => (s.solved.includes(chapter.id) ? { cursor: s.cursor + 1 } : {}))}
      />
    );
  } else if (!state.finalDone) {
    stage = "final";
    view = <FinalPuzzle sound={state.sound} onSolved={() => update({ finalDone: true })} />;
  } else if (!state.opened) {
    stage = "reveal";
    view = <Reveal sound={state.sound} onOpen={() => update({ opened: true, page: 0 })} />;
  } else {
    stage = "album";
    view = <Album page={state.page} onPage={(page) => update({ page })} />;
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="wine-bg relative min-h-dvh">
        {state.started && (
          <TopBar
            sound={state.sound}
            onToggleSound={() => update((s) => ({ sound: !s.sound }))}
            onReset={reset}
          />
        )}
        <AnimatePresence mode="wait">
          <div key={stage}>{view}</div>
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}
