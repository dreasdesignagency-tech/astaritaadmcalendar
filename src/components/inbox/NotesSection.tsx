import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetchTeam } from "@/lib/inbox/api";
import { addNote, deleteNote, fetchNotes } from "@/lib/inbox/notes";
import { useInboxProfile } from "@/lib/inbox/profile-context";
import { useFallbackInterval } from "@/lib/inbox/realtime";

function when(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

/** Observações internas: linha do tempo por contato. Nunca vão para o cliente. */
export function NotesSection({ contactId }: { contactId: string }) {
  const profile = useInboxProfile();
  const queryClient = useQueryClient();
  const interval = useFallbackInterval();
  const notes = useQuery({
    queryKey: ["inbox", "notes", contactId],
    queryFn: () => fetchNotes(contactId),
    refetchInterval: interval,
  });
  const team = useQuery({ queryKey: ["inbox", "team"], queryFn: fetchTeam });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const author = (id: string | null) =>
    team.data?.find((p) => p.id === id)?.full_name ?? "Alguém da equipe";
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["inbox", "notes", contactId] });

  const submit = async () => {
    if (busy || !text.trim()) return;
    setBusy(true);
    try {
      await addNote(contactId, text, profile.id);
      setText("");
      await refresh();
    } catch {
      toast.error("Não foi possível salvar a observação. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteNote(id);
      await refresh();
    } catch {
      toast.error("Não foi possível apagar a observação.");
    }
  };

  return (
    <section className="inbox-surface rounded-[2rem] p-5" aria-label="Observações internas">
      <h2 className="mb-1 font-display text-base font-semibold">Observações internas</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Só a equipe vê. Não são enviadas ao cliente.
      </p>
      <form
        className="grid gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Textarea
          rows={2}
          maxLength={4000}
          placeholder="Ex.: prefere áudio, fecha em novembro…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Nova observação"
        />
        <Button
          type="submit"
          size="sm"
          className="justify-self-end rounded-full"
          disabled={busy || !text.trim()}
        >
          Adicionar
        </Button>
      </form>
      <ul className="mt-3 space-y-2">
        {notes.isPending && <li className="text-sm text-muted-foreground">Carregando…</li>}
        {notes.isError && (
          <li className="text-sm text-destructive">Não foi possível carregar as observações.</li>
        )}
        {notes.data?.length === 0 && (
          <li className="text-sm text-muted-foreground">Nenhuma observação ainda.</li>
        )}
        {notes.data?.map((n) => (
          <li key={n.id} className="rounded-2xl bg-secondary px-3 py-2">
            <p className="whitespace-pre-wrap break-words text-sm">{n.body}</p>
            <p className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                {author(n.created_by)} · {when(n.created_at)}
              </span>
              {n.created_by === profile.id && (
                <button
                  onClick={() => void remove(n.id)}
                  aria-label="Apagar observação"
                  className="rounded-full p-1 hover:bg-card hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
