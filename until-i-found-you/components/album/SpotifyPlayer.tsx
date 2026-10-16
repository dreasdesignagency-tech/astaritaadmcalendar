"use client";

import { useEffect, useRef } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: any) => void;
  }
}

const PREVIEW_MS = 30_000;
let apiPromise: Promise<any> | null = null;

/** Carrega a API oficial de embed do Spotify uma única vez. */
function loadSpotifyApi(): Promise<any> {
  apiPromise ??= new Promise((resolve, reject) => {
    window.onSpotifyIframeApiReady = resolve;
    const s = document.createElement("script");
    s.src = "https://open.spotify.com/embed/iframe-api/v1";
    s.async = true;
    s.onerror = () => {
      apiPromise = null;
      reject(new Error("spotify api"));
    };
    document.body.appendChild(s);
  });
  return apiPromise;
}

export function trackIdFromUrl(url: string): string | null {
  return url.match(/track\/([A-Za-z0-9]+)/)?.[1] ?? null;
}

/**
 * Player oficial do Spotify (embed). Toca ao montar e para sozinho aos 30 segundos.
 * Se a pessoa estiver logada no Spotify, o embed tocaria a faixa inteira; o corte em 30s vale nos dois casos.
 */
export default function SpotifyPlayer({
  trackId,
  onPlaying,
  onError,
}: {
  trackId: string;
  onPlaying: (playing: boolean) => void;
  onError: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let controller: any = null;
    let cancelled = false;
    loadSpotifyApi()
      .then((api) => {
        if (cancelled || !host.current) return;
        const mount = document.createElement("div");
        host.current.appendChild(mount);
        api.createController(
          mount,
          { uri: `spotify:track:${trackId}`, width: "100%", height: 80 },
          (c: any) => {
            controller = c;
            c.addListener("ready", () => c.play());
            c.addListener("playback_update", (e: any) => {
              const { isPaused, position } = e.data;
              onPlaying(!isPaused);
              if (!isPaused && position >= PREVIEW_MS) {
                c.pause();
                c.seek(0);
              }
            });
          },
        );
      })
      .catch(() => !cancelled && onError());
    return () => {
      cancelled = true;
      onPlaying(false);
      try {
        controller?.destroy();
      } catch {
        /* ignora */
      }
      if (host.current) host.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId]);

  return <div ref={host} className="w-full overflow-hidden rounded-xl" aria-label="Player do Spotify" />;
}
