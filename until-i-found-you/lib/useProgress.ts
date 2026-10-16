"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "until-i-found-you:v1";

export type Progress = {
  started: boolean;
  /** ids dos capítulos resolvidos */
  solved: string[];
  /** capítulo exibido (0..total). total = desafio final */
  cursor: number;
  /** dicas usadas, por pergunta ("capitulo:indice") */
  hints: Record<string, number>;
  /** perguntas acertadas por capítulo */
  done: Record<string, number>;
  /** perguntas cujo "parabéns" já foi visto */
  ack: Record<string, number>;
  finalDone: boolean;
  opened: boolean;
  page: number;
  sound: boolean;
};

export const initialProgress: Progress = {
  started: false,
  solved: [],
  cursor: 0,
  hints: {},
  done: {},
  ack: {},
  finalDone: false,
  opened: false,
  page: 0,
  sound: false,
};

function sanitize(raw: unknown, chapterIds: string[], roundCounts: number[]): Progress {
  const p = { ...initialProgress, ...(typeof raw === "object" && raw ? (raw as Partial<Progress>) : {}) };
  // só aceita capítulos resolvidos em sequência, sem pular nenhum
  const solved: string[] = [];
  for (const id of chapterIds) {
    if (Array.isArray(p.solved) && p.solved.includes(id)) solved.push(id);
    else break;
  }
  const total = chapterIds.length;
  const cursor = Math.max(0, Math.min(Number(p.cursor) || 0, solved.length));
  const allSolved = solved.length === total;
  const finalDone = allSolved && cursor >= total && !!p.finalDone;
  const rawDone = typeof p.done === "object" && p.done ? p.done : {};
  const rawAck = typeof p.ack === "object" && p.ack ? p.ack : {};
  const done: Record<string, number> = {};
  const ack: Record<string, number> = {};
  chapterIds.forEach((id, i) => {
    const n = roundCounts[i] ?? 1;
    const isSolved = solved.includes(id);
    done[id] = isSolved ? n : Math.max(0, Math.min(Number(rawDone[id]) || 0, n - 1));
    ack[id] = Math.max(0, Math.min(Number(rawAck[id]) || 0, done[id]!));
  });
  return {
    done,
    ack,
    started: !!p.started,
    solved,
    cursor,
    hints: typeof p.hints === "object" && p.hints ? p.hints : {},
    finalDone,
    opened: finalDone && !!p.opened,
    page: Math.max(0, Math.min(Number(p.page) || 0, 2)),
    sound: !!p.sound,
  };
}

export function useProgress(chapterIds: string[], roundCounts: number[]) {
  const [state, setState] = useState<Progress>(initialProgress);
  const [ready, setReady] = useState(false);
  const idsKey = chapterIds.join("|");
  const countsKey = roundCounts.join("|");

  useEffect(() => {
    let loaded: unknown = null;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) loaded = JSON.parse(raw);
    } catch {
      /* armazenamento indisponível: segue sem salvar */
    }
    setState(sanitize(loaded, idsKey.split("|"), countsKey.split("|").map(Number)));
    setReady(true);
  }, [idsKey, countsKey]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignora */
    }
  }, [state, ready]);

  const update = useCallback((patch: Partial<Progress> | ((s: Progress) => Partial<Progress>)) => {
    setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  }, []);

  const reset = useCallback(() => {
    setState((s) => ({ ...initialProgress, sound: s.sound }));
  }, []);

  return { state, update, reset, ready };
}
