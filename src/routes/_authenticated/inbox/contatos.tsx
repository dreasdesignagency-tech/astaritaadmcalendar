import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, MessageSquare, Pencil, Plus, SearchX, Users, WifiOff } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ContactDialog } from "@/components/inbox/ContactDialog";
import { EmptyState } from "@/components/inbox/EmptyState";
import { PageHeader } from "@/components/inbox/PageHeader";
import { UserAvatar } from "@/components/inbox/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchTeam } from "@/lib/inbox/api";
import { fetchContacts, openConversationFor } from "@/lib/inbox/contacts";
import { formatPhone } from "@/lib/inbox/phone";
import { useFallbackInterval } from "@/lib/inbox/realtime";
import { CATEGORY_LABEL, type ContactCategory, type ContactRow } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/inbox/contatos")({
  head: () => ({ meta: [{ title: "Contatos | Astarita Inbox" }] }),
  component: ContactsPage,
});

const ALL = "all";

function ContactsPage() {
  const navigate = useNavigate();
  const interval = useFallbackInterval();
  const contacts = useQuery({
    queryKey: ["inbox", "contacts"],
    queryFn: fetchContacts,
    refetchInterval: interval,
  });
  const team = useQuery({ queryKey: ["inbox", "team"], queryFn: fetchTeam });

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ContactCategory | typeof ALL>(ALL);
  const [owner, setOwner] = useState<string>(ALL);
  const [tag, setTag] = useState<string>(ALL);
  const [editing, setEditing] = useState<ContactRow | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);

  const rows = useMemo(() => contacts.data ?? [], [contacts.data]);
  const tagNames = useMemo(
    () => [...new Set(rows.flatMap((r) => r.tags.map((t) => t.name)))].sort(),
    [rows],
  );
  const ownerName = (id: string | null) => team.data?.find((p) => p.id === id)?.full_name;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return rows.filter((r) => {
      if (category !== ALL && r.category !== category) return false;
      if (owner === "none" ? r.assigned_to !== null : owner !== ALL && r.assigned_to !== owner)
        return false;
      if (tag !== ALL && !r.tags.some((t) => t.name === tag)) return false;
      if (!q) return true;
      const text = [r.name, r.company, r.instagram, ...r.tags.map((t) => t.name)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(q) || (digits.length >= 3 && (r.phone ?? "").includes(digits));
    });
  }, [rows, query, category, owner, tag]);

  const openConversation = async (c: ContactRow) => {
    setOpening(c.id);
    try {
      const id = await openConversationFor(c.id, c.assigned_to);
      void navigate({ to: "/inbox", search: { c: id } });
    } catch {
      toast.error("Não foi possível abrir a conversa. Tente de novo.");
    } finally {
      setOpening(null);
    }
  };

  const openNew = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Contatos"
        subtitle={
          contacts.isPending
            ? "Carregando…"
            : `${rows.length} ${rows.length === 1 ? "contato" : "contatos"}`
        }
        search={{ value: query, onChange: setQuery, placeholder: "Buscar contatos" }}
        action={
          <Button className="rounded-full" onClick={openNew}>
            <Plus className="mr-1.5 h-4 w-4" /> Novo contato
          </Button>
        }
      />

      <section className="inbox-surface flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem]">
        <div className="flex shrink-0 flex-wrap items-center gap-2 px-4 pb-3 pt-4 sm:px-6">
          {(
            [[ALL, "Todos"], ...Object.entries(CATEGORY_LABEL)] as [
              ContactCategory | typeof ALL,
              string,
            ][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setCategory(value)}
              aria-pressed={category === value}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                category === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-accent",
              )}
            >
              {label}
            </button>
          ))}
          <div className="ml-auto flex flex-wrap gap-2">
            <Select value={owner} onValueChange={setOwner}>
              <SelectTrigger
                className="h-9 w-44 rounded-full text-xs"
                aria-label="Filtrar por responsável"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="inbox-theme">
                <SelectItem value={ALL}>Todos os responsáveis</SelectItem>
                <SelectItem value="none">Sem responsável</SelectItem>
                {team.data?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tagNames.length > 0 && (
              <Select value={tag} onValueChange={setTag}>
                <SelectTrigger
                  className="h-9 w-40 rounded-full text-xs"
                  aria-label="Filtrar por etiqueta"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="inbox-theme">
                  <SelectItem value={ALL}>Todas as etiquetas</SelectItem>
                  {tagNames.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 sm:px-4">
          {contacts.isPending ? (
            <div className="space-y-2 px-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[76px] rounded-2xl" />
              ))}
            </div>
          ) : contacts.isError ? (
            <EmptyState tone="error" icon={WifiOff} title="Erro de conexão">
              Não foi possível carregar os contatos.
              <button
                onClick={() => void contacts.refetch()}
                className="mt-2 block w-full font-medium text-primary hover:underline"
              >
                Tentar de novo
              </button>
            </EmptyState>
          ) : rows.length === 0 ? (
            <EmptyState icon={Users} title="Sem contatos ainda">
              Quem escrever pelo WhatsApp vira contato automaticamente. Você também pode cadastrar
              alguém agora.
              <Button className="mt-3 rounded-full" size="sm" onClick={openNew}>
                <Plus className="mr-1.5 h-4 w-4" /> Novo contato
              </Button>
            </EmptyState>
          ) : visible.length === 0 ? (
            <EmptyState icon={SearchX} title="Sem resultados">
              Nenhum contato corresponde à busca ou aos filtros.
            </EmptyState>
          ) : (
            <ul className="space-y-1">
              {visible.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl px-3 py-3 hover:bg-secondary"
                >
                  <UserAvatar name={c.name} />
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold">
                      {c.name}
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                        {CATEGORY_LABEL[c.category]}
                      </span>
                    </p>
                    <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                      <span>{formatPhone(c.phone)}</span>
                      {c.company && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {c.company}
                        </span>
                      )}
                      {c.instagram && <span>{c.instagram}</span>}
                    </p>
                    {c.tags.length > 0 && (
                      <p className="mt-1 flex flex-wrap gap-1">
                        {c.tags.map((t) => (
                          <span
                            key={t.id}
                            className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {t.name}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                  <div className="hidden text-xs text-muted-foreground sm:block sm:w-36">
                    <p>{ownerName(c.assigned_to) ?? "Sem responsável"}</p>
                    <p>Desde {new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={opening === c.id || !c.phone}
                      onClick={() => void openConversation(c)}
                    >
                      <MessageSquare className="mr-1.5 h-4 w-4" />
                      {c.conversation ? "Conversa" : "Iniciar"}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-full"
                      aria-label={`Editar ${c.name}`}
                      onClick={() => {
                        setEditing(c);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <ContactDialog open={dialogOpen} onOpenChange={setDialogOpen} contact={editing} />
    </>
  );
}
