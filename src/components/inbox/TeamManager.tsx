import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CredentialDialog } from "@/components/inbox/CredentialDialog";
import { UserAvatar } from "@/components/inbox/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchTeam } from "@/lib/inbox/api";
import { useInboxProfile } from "@/lib/inbox/profile-context";
import { addPerson, resetPersonPassword, setPersonAccess, setPersonActive } from "@/lib/inbox/team";
import { personLabel } from "@/lib/inbox/types";

type Creds = { title: string; email?: string; password: string } | null;

export function TeamManager() {
  const me = useInboxProfile();
  const qc = useQueryClient();
  const team = useQuery({ queryKey: ["inbox", "team"], queryFn: fetchTeam });
  const isAdmin = me.access === "owner" || me.access === "admin";
  const isOwner = me.access === "owner";
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [access, setAccess] = useState<"agent" | "admin">("agent");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creds, setCreds] = useState<Creds>(null);

  const activeCount = team.data?.filter((p) => p.active).length ?? 0;
  const refresh = () => qc.invalidateQueries({ queryKey: ["inbox", "team"] });

  const create = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const r = await addPerson({ fullName: name, email, access });
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setAdding(false);
    setName("");
    setEmail("");
    setAccess("agent");
    setCreds({ title: "Acesso criado", email: r.email, password: r.tempPassword });
    await refresh();
  };

  const toggle = async (id: string, active: boolean) => {
    const r = await setPersonActive(id, active);
    if (!r.ok) toast.error(r.error);
    else toast.success(active ? "Pessoa reativada." : "Pessoa desativada. Ela não entra mais.");
    await refresh();
  };

  const reset = async (id: string, who: string) => {
    const r = await resetPersonPassword(id);
    if (!r.ok) toast.error(r.error);
    else setCreds({ title: `Nova senha de ${who}`, password: r.tempPassword });
  };

  const changeAccess = async (id: string, a: "admin" | "agent") => {
    const r = await setPersonAccess(id, a);
    if (!r.ok) toast.error(r.error);
    else toast.success("Nível de acesso atualizado.");
    await refresh();
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-base font-semibold">Equipe com acesso</h2>
        {isAdmin && (
          <Button size="sm" className="rounded-full" onClick={() => setAdding(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" /> Adicionar pessoa
          </Button>
        )}
      </div>
      <ul className="space-y-2">
        {team.data?.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl bg-secondary px-4 py-3"
          >
            <UserAvatar name={p.full_name} src={p.avatar_url} />
            <span className="min-w-0 flex-1 basis-32">
              <span className="block truncate text-sm font-medium">
                {p.full_name}
                {p.id === me.id && (
                  <span className="ml-1.5 text-xs text-muted-foreground">(você)</span>
                )}
              </span>
              <span className="block text-xs text-muted-foreground">{personLabel(p)}</span>
            </span>
            {isAdmin && p.id !== me.id && p.access !== "owner" ? (
              <div className="flex flex-wrap items-center gap-2">
                {isOwner && (
                  <Select
                    value={p.access}
                    onValueChange={(v) => void changeAccess(p.id, v as "admin" | "agent")}
                  >
                    <SelectTrigger
                      className="h-8 w-36 rounded-full text-xs"
                      aria-label={`Nível de ${p.full_name}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="inbox-theme">
                      <SelectItem value="agent">Atendente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  aria-label={`Nova senha de ${p.full_name}`}
                  onClick={() => void reset(p.id, p.full_name)}
                >
                  <KeyRound className="mr-1.5 h-3.5 w-3.5" /> Nova senha
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  aria-label={`${p.active ? "Desativar" : "Reativar"} ${p.full_name}`}
                  onClick={() => void toggle(p.id, !p.active)}
                >
                  {p.active ? "Desativar" : "Reativar"}
                </Button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                {p.active ? "Ativo" : "Inativo"}
              </span>
            )}
          </li>
        ))}
        {team.isPending && <li className="text-sm text-muted-foreground">Carregando…</li>}
        {team.isError && (
          <li className="text-sm text-destructive">Não foi possível carregar a equipe.</li>
        )}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        {activeCount} de {me.org.max_users} pessoas ativas no plano. Não há cadastro público: os
        acessos são criados pelo administrador.
      </p>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="inbox-theme rounded-[2rem] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar pessoa</DialogTitle>
            <DialogDescription>
              O sistema cria o acesso e mostra uma senha temporária uma única vez.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="tm-name">Nome</Label>
              <Input
                id="tm-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-full"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tm-email">E-mail</Label>
              <Input
                id="tm-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-full"
              />
            </div>
            {isOwner && (
              <div className="space-y-1.5">
                <Label htmlFor="tm-access">Nível</Label>
                <Select value={access} onValueChange={(v) => setAccess(v as "agent" | "admin")}>
                  <SelectTrigger
                    id="tm-access"
                    className="rounded-full"
                    aria-label="Nível de acesso"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="inbox-theme">
                    <SelectItem value="agent">Atendente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
            <Button
              className="rounded-full"
              disabled={busy || !name.trim() || !email.trim()}
              onClick={() => void create()}
            >
              {busy ? "Criando…" : "Criar acesso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CredentialDialog
        open={!!creds}
        onClose={() => setCreds(null)}
        title={creds?.title ?? ""}
        email={creds?.email}
        password={creds?.password ?? ""}
      />
    </div>
  );
}
