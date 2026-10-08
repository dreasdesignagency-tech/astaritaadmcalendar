import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";

import { supabase } from "@/integrations/supabase/client";

/**
 * Atualizações em tempo real via Supabase Realtime (postgres_changes).
 * O Realtime aplica a RLS com o JWT de quem está logado: só chegam eventos de linhas
 * que essa pessoa já poderia ler. O evento não carrega dados para a tela; ele só
 * invalida o cache e as consultas normais (também protegidas por RLS) buscam o novo estado.
 */
export type RealtimeState = "connecting" | "connected" | "offline";

let state: RealtimeState = "connecting";
const listeners = new Set<() => void>();
const setState = (next: RealtimeState) => {
  if (state === next) return;
  state = next;
  listeners.forEach((l) => l());
};

export function useRealtimeState(): RealtimeState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => "connecting",
  );
}

/** Intervalo de segurança: se o tempo real cair, a tela volta a consultar a cada 15s. */
export function useFallbackInterval(): number | false {
  return useRealtimeState() === "connected" ? false : 15_000;
}

const WATCHED = ["conversations", "messages", "contacts", "contact_tags", "tags"] as const;

/** Monta a assinatura uma vez, no layout do Inbox. */
export function useInboxRealtime(userId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let wasDown = false;

    // Vários eventos seguidos (ex.: mensagem + conversa) viram uma única atualização.
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void queryClient.invalidateQueries({ queryKey: ["inbox"] }), 250);
    };

    let channel = supabase.channel(`inbox-${userId}`);
    for (const table of WATCHED) {
      channel = channel.on("postgres_changes", { event: "*", schema: "public", table }, refresh);
    }
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setState("connected");
        // Depois de uma queda, busca o que se perdeu enquanto estava offline.
        if (wasDown) refresh();
        wasDown = false;
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        wasDown = true;
        setState("offline");
      }
    });

    return () => {
      clearTimeout(timer);
      setState("connecting");
      void supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);
}
