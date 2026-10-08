import { useQuery } from "@tanstack/react-query";
import { FileText, Mic, Video } from "lucide-react";
import { useState } from "react";

import { fetchMediaUrl } from "@/lib/inbox/messaging";
import type { MessageRow } from "@/lib/inbox/types";

/**
 * Mídia recebida. O arquivo fica em bucket privado e só abre por URL assinada de curta duração, pedida ao backend
 * (que confere se quem pede é membro ativo). Imagens carregam sozinhas; áudio, vídeo e documento só ao clicar.
 */
export function MediaView({ message }: { message: MessageRow }) {
  const auto = message.type === "image" || message.type === "sticker";
  const [wanted, setWanted] = useState(false);
  const media = useQuery({
    queryKey: ["inbox", "media", message.id],
    queryFn: async () => {
      const r = await fetchMediaUrl(message.id);
      if (!r.ok) throw new Error(r.error);
      return r;
    },
    enabled: auto || wanted,
    staleTime: 4 * 60_000,
    retry: false,
  });

  if (media.isError) {
    return (
      <p className="text-xs opacity-80">
        Não foi possível carregar o arquivo.{" "}
        <button className="underline" onClick={() => void media.refetch()}>
          Tentar de novo
        </button>
      </p>
    );
  }

  if (media.data) {
    const url = media.data.url;
    if (auto)
      return (
        <img
          src={url}
          alt={message.type === "sticker" ? "Figurinha" : "Imagem recebida"}
          className="max-h-72 rounded-2xl object-contain"
          loading="lazy"
        />
      );
    if (message.type === "audio") return <audio controls src={url} className="w-full max-w-xs" />;
    if (message.type === "video")
      return <video controls src={url} className="max-h-72 rounded-2xl" />;
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 text-sm underline"
      >
        <FileText className="h-4 w-4" /> Abrir documento
      </a>
    );
  }

  if (auto)
    return (
      <div
        className="h-32 w-48 animate-pulse rounded-2xl bg-secondary"
        aria-label="Carregando imagem"
      />
    );

  const Icon = message.type === "audio" ? Mic : message.type === "video" ? Video : FileText;
  const label =
    message.type === "audio"
      ? "Ouvir áudio"
      : message.type === "video"
        ? "Ver vídeo"
        : "Abrir documento";
  return (
    <button
      className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground hover:bg-accent"
      onClick={() => setWanted(true)}
      disabled={media.isFetching}
    >
      <Icon className="h-4 w-4" /> {media.isFetching ? "Carregando…" : label}
    </button>
  );
}
