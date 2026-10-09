import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Plus, ShieldAlert, WifiOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CredentialDialog } from "@/components/inbox/CredentialDialog";
import { EmptyState } from "@/components/inbox/EmptyState";
import { PageHeader } from "@/components/inbox/PageHeader";
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
import { useInboxProfile } from "@/lib/inbox/profile-context";
import {
  createPlatformOrg,
  fetchPlatformOrgs,
  updatePlatformOrg,
  type PlatformOrg,
} from "@/lib/inbox/team";
import { PLAN_LABEL } from "@/lib/inbox/types";

export const Route = createFileRoute("/inbox/_app/plataforma")({
  head: () => ({ meta: [{ title: "Plataforma | Astarita Inbox" }] }),
  component: PlatformPage,
});

const slugify = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

function PlatformPage() {
  const me = useInboxProfile();
  const qc = useQueryClient();
  const orgs = useQuery({
    queryKey: ["inbox", "platform-orgs"],
    queryFn: async () => {
      const r = await fetchPlatformOrgs();
      if (!r.ok) throw new Error(r.error);
      return r.orgs;
    },
    enabled: me.is_platform_admin,
    retry: false,
  });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [plan, setPlan] = useState<"starter" | "pro" | "business">("starter");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creds, setCreds] = useState<{ email: string; password: string; org: string } | null>(null);

  if (!me.is_platform_admin)
    return (
      <>
        <PageHeader title="Plataforma" subtitle="Área restrita" />
        <EmptyState icon={ShieldAlert} title="Acesso restrito">
          Esta área é só do dono da plataforma.
        </EmptyState>
      </>
    );

  const refresh = () => qc.invalidateQueries({ queryKey: ["inbox", "platform-orgs"] });

  const create = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const r = await createPlatformOrg({ name, slug, plan, ownerName, ownerEmail });
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setOpen(false);
    setCreds({ email: r.owner.email, password: r.owner.tempPassword, org: name });
    setName("");
    setSlug("");
    setSlugTouched(false);
    setOwnerName("");
    setOwnerEmail("");
    await refresh();
  };

  const patch = async (p: Parameters<typeof updatePlatformOrg>[0], ok: string) => {
    const r = await updatePlatformOrg(p);
    if (!r.ok) toast.error(r.error);
    else toast.success(ok);
    await refresh();
  };

  return (
    <>
      <PageHeader
        title="Plataforma"
        subtitle="Empresas clientes"
        action={
          <Button className="rounded-full" onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Nova empresa
          </Button>
        }
      />
      <div className="inbox-surface min-h-0 flex-1 overflow-y-auto rounded-[2rem] p-4 sm:p-6">
        {orgs.isPending && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {orgs.isError && (
          <EmptyState tone="error" icon={WifiOff} title="Não foi possível carregar as empresas">
            {orgs.error instanceof Error ? orgs.error.message : "Tente de novo."}
          </EmptyState>
        )}
        {orgs.data && orgs.data.length === 0 && (
          <EmptyState icon={Building2} title="Nenhuma empresa ainda">
            Crie a primeira empresa cliente.
          </EmptyState>
        )}
        <ul className="space-y-3">
          {orgs.data?.map((o) => (
            <OrgRow key={o.id} o={o} isMine={o.id === me.org_id} onPatch={patch} />
          ))}
        </ul>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="inbox-theme rounded-[2rem] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova empresa</DialogTitle>
            <DialogDescription>
              Cria a empresa, o funil de 7 etapas, uma base de conhecimento vazia e o acesso do
              dono.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="po-name">Nome da empresa</Label>
              <Input
                id="po-name"
                value={name}
                className="rounded-full"
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="po-slug">Endereço (identificador)</Label>
              <Input
                id="po-slug"
                value={slug}
                className="rounded-full"
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="po-plan">Plano</Label>
              <Select value={plan} onValueChange={(v) => setPlan(v as typeof plan)}>
                <SelectTrigger id="po-plan" className="rounded-full" aria-label="Plano da empresa">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="inbox-theme">
                  {(["starter", "pro", "business"] as const).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PLAN_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="po-owner">Nome do dono</Label>
              <Input
                id="po-owner"
                value={ownerName}
                className="rounded-full"
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="po-email">E-mail do dono</Label>
              <Input
                id="po-email"
                type="email"
                value={ownerEmail}
                className="rounded-full"
                onChange={(e) => setOwnerEmail(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="rounded-full"
              disabled={busy || !name.trim() || !slug || !ownerName.trim() || !ownerEmail.trim()}
              onClick={() => void create()}
            >
              {busy ? "Criando…" : "Criar empresa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CredentialDialog
        open={!!creds}
        onClose={() => setCreds(null)}
        title={`Acesso do dono de ${creds?.org ?? ""}`}
        email={creds?.email}
        password={creds?.password ?? ""}
      />
    </>
  );
}

function OrgRow({
  o,
  isMine,
  onPatch,
}: {
  o: PlatformOrg;
  isMine: boolean;
  onPatch: (p: Parameters<typeof updatePlatformOrg>[0], ok: string) => Promise<void>;
}) {
  const [maxUsers, setMaxUsers] = useState(String(o.maxUsers));
  const [aiLimit, setAiLimit] = useState(String(o.aiMonthlyLimit));
  const limitsDirty = maxUsers !== String(o.maxUsers) || aiLimit !== String(o.aiMonthlyLimit);
  return (
    <li className="rounded-2xl bg-secondary px-4 py-3" data-org={o.slug}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1 basis-48">
          <p className="truncate text-sm font-semibold">
            {o.name} <span className="text-xs font-normal text-muted-foreground">/{o.slug}</span>
            {isMine && <span className="ml-1.5 text-xs text-muted-foreground">(sua empresa)</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            {o.users}/{o.maxUsers} pessoas · {o.contacts} contatos · {o.conversations} conversas ·
            IA {o.aiUsed}/{o.aiMonthlyLimit} no mês · WhatsApp{" "}
            {o.whatsappConnectedAt
              ? "conectado"
              : o.whatsappConfigured
                ? "configurado"
                : "não configurado"}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${o.status === "active" ? "bg-accent text-primary" : "bg-destructive/10 text-destructive"}`}
        >
          {o.status === "active" ? "Ativa" : "Suspensa"}
        </span>
        <Select
          value={o.plan}
          onValueChange={(v) =>
            void onPatch({ orgId: o.id, plan: v as PlatformOrg["plan"] }, "Plano atualizado.")
          }
        >
          <SelectTrigger
            className="h-8 w-32 rounded-full text-xs"
            aria-label={`Plano de ${o.name}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="inbox-theme">
            {(["starter", "pro", "business"] as const).map((p) => (
              <SelectItem key={p} value={p}>
                {PLAN_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isMine && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            aria-label={`${o.status === "active" ? "Suspender" : "Reativar"} ${o.name}`}
            onClick={() =>
              void onPatch(
                { orgId: o.id, status: o.status === "active" ? "suspended" : "active" },
                o.status === "active"
                  ? "Empresa suspensa. Ninguém dela entra."
                  : "Empresa reativada.",
              )
            }
          >
            {o.status === "active" ? "Suspender" : "Reativar"}
          </Button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor={`mu-${o.slug}`} className="text-xs">
            Máx. de pessoas
          </Label>
          <Input
            id={`mu-${o.slug}`}
            inputMode="numeric"
            value={maxUsers}
            onChange={(e) => setMaxUsers(e.target.value.replace(/\D/g, ""))}
            className="h-8 w-24 rounded-full text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`ai-${o.slug}`} className="text-xs">
            Sugestões de IA por mês
          </Label>
          <Input
            id={`ai-${o.slug}`}
            inputMode="numeric"
            value={aiLimit}
            onChange={(e) => setAiLimit(e.target.value.replace(/\D/g, ""))}
            className="h-8 w-28 rounded-full text-xs"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={!limitsDirty || !maxUsers || !aiLimit}
          aria-label={`Salvar limites de ${o.name}`}
          onClick={() =>
            void onPatch(
              { orgId: o.id, maxUsers: Number(maxUsers), aiMonthlyLimit: Number(aiLimit) },
              "Limites atualizados.",
            )
          }
        >
          Salvar limites
        </Button>
      </div>
    </li>
  );
}
