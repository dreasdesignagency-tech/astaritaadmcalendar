"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "until-i-found-you:v1";

export type Progress = {
  started: boolean;
  /** ids dos capítulos resolvidos */
  solved: string[];
  /** capítulo exibido (0..total). total = desafio final */
  cursor: number;
  hints: Record<string, number>;
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
  finalDone: false,
  opened: false,
  page: 0,
  sound: false,
};

function sanitize(raw: unknown, chapterIds: string[]): Progress {
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
  return {
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

export function useProgress(chapterIds: string[]) {
  const [state, setState] = useState<Progress>(initialProgress);
  const [ready, setReady] = useState(false);
  const idsKey = chapterIds.join("|");

  useEffect(() => {
    let loaded: unknown = null;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) loaded = JSON.parse(raw);
    } catch {
      /* armazenamento indisponível: segue sem salvar */
    }
    setState(sanitize(loaded, idsKey.split("|")));
    setReady(true);
  }, [idsKey]);

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
