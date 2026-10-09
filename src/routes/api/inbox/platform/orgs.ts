import { createFileRoute } from "@tanstack/react-router";

import {
  configErrorResponse,
  getAdmin,
  json,
  requireMember,
  requirePlatformAdmin,
} from "@/lib/inbox/server/admin";
import { createOrgUser } from "@/lib/inbox/server/users";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PLANS = ["starter", "pro", "business"] as const;

/**
 * Painel do dono da plataforma: empresas clientes. Só quem tem is_platform_admin.
 *  GET   lista empresas com uso (pessoas, contatos, conversas, IA no mês, WhatsApp conectado)
 *  POST  {name, slug, plan, ownerName, ownerEmail}  cria a empresa + o dono (senha temporária devolvida uma vez)
 *  PATCH {orgId, status?, plan?, maxUsers?, aiMonthlyLimit?}
 */
export const Route = createFileRoute("/api/inbox/platform/orgs")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const admin = getAdmin();
          const who = await requireMember(request, admin);
          if (!who.ok) return who.res;
          const denied = requirePlatformAdmin(who);
          if (denied) return denied;
          const orgs = await admin
            .from("organizations")
            .select("id, name, slug, status, plan, max_users, ai_monthly_limit, created_at")
            .order("created_at");
          if (orgs.error) return json({ error: "Erro ao ler empresas.", code: "db_error" }, 503);
          const monthStart = new Date();
          monthStart.setUTCDate(1);
          monthStart.setUTCHours(0, 0, 0, 0);
          const count = async (table: "contacts" | "conversations", orgId: string) =>
            (
              await admin
                .from(table)
                .select("id", { count: "exact", head: true })
                .eq("org_id", orgId)
            ).count ?? 0;
          const activeUsers = async (orgId: string) =>
            (
              await admin
                .from("profiles")
                .select("id", { count: "exact", head: true })
                .eq("org_id", orgId)
                .eq("active", true)
            ).count ?? 0;
          const rows = await Promise.all(
            orgs.data.map(async (o) => {
              const [users, contacts, conversations, ai, wa] = await Promise.all([
                activeUsers(o.id),
                count("contacts", o.id),
                count("conversations", o.id),
                admin
                  .from("ai_suggestions")
                  .select("id", { count: "exact", head: true })
                  .eq("org_id", o.id)
                  .gte("created_at", monthStart.toISOString()),
                admin
                  .from("org_whatsapp")
                  .select("connected_at, phone_number_id")
                  .eq("org_id", o.id)
                  .maybeSingle(),
              ]);
              return {
                id: o.id,
                name: o.name,
                slug: o.slug,
                status: o.status,
                plan: o.plan,
                maxUsers: o.max_users,
                aiMonthlyLimit: o.ai_monthly_limit,
                createdAt: o.created_at,
                users,
                contacts,
                conversations,
                aiUsed: ai.count ?? 0,
                whatsappConfigured: !!wa.data?.phone_number_id,
                whatsappConnectedAt: wa.data?.connected_at ?? null,
              };
            }),
          );
          return json({ ok: true, orgs: rows });
        } catch (e) {
          return fail(e);
        }
      },
      POST: async ({ request }) => {
        try {
          const admin = getAdmin();
          const who = await requireMember(request, admin);
          if (!who.ok) return who.res;
          const denied = requirePlatformAdmin(who);
          if (denied) return denied;
          const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
          const plan = PLANS.find((p) => p === b?.["plan"]) ?? "starter";
          if (
            !b ||
            typeof b["name"] !== "string" ||
            typeof b["slug"] !== "string" ||
            typeof b["ownerName"] !== "string" ||
            typeof b["ownerEmail"] !== "string"
          )
            return json(
              { error: "Informe empresa, endereço, nome e e-mail do dono.", code: "bad_request" },
              400,
            );
          if (
            b["name"].trim().length < 2 ||
            !/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(b["slug"].trim().toLowerCase())
          )
            return json(
              {
                error:
                  "Nome com pelo menos 2 letras e endereço só com letras minúsculas, números e hífen (3 a 40).",
                code: "bad_request",
              },
              400,
            );
          const made = await admin.rpc("inbox_create_org", {
            p_name: b["name"],
            p_slug: b["slug"],
            p_plan: plan,
          });
          if (made.error) {
            const dup = made.error.code === "23505";
            return json(
              {
                error: dup
                  ? "Já existe uma empresa com esse endereço."
                  : "Não foi possível criar a empresa.",
                code: dup ? "slug_taken" : "db_error",
              },
              dup ? 409 : 400,
            );
          }
          const orgId = made.data as string;
          const owner = await createOrgUser(admin, orgId, {
            email: b["ownerEmail"],
            fullName: b["ownerName"],
            access: "owner",
          });
          if (!owner.ok) {
            await admin.from("organizations").delete().eq("id", orgId); // desfaz: nada fica pela metade
            return json(
              { error: owner.error, code: owner.code },
              owner.code === "email_exists" ? 409 : 400,
            );
          }
          return json({
            ok: true,
            orgId,
            owner: { email: owner.email, tempPassword: owner.tempPassword },
          });
        } catch (e) {
          return fail(e);
        }
      },
      PATCH: async ({ request }) => {
        try {
          const admin = getAdmin();
          const who = await requireMember(request, admin);
          if (!who.ok) return who.res;
          const denied = requirePlatformAdmin(who);
          if (denied) return denied;
          const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
          if (!b || typeof b["orgId"] !== "string" || !UUID.test(b["orgId"]))
            return json({ error: "Pedido inválido.", code: "bad_request" }, 400);
          const patch: {
            status?: string;
            plan?: string;
            max_users?: number;
            ai_monthly_limit?: number;
          } = {};
          if (b["status"] === "active" || b["status"] === "suspended") {
            if (b["status"] === "suspended" && b["orgId"] === who.orgId)
              return json(
                { error: "Você não pode suspender a sua própria empresa.", code: "forbidden" },
                400,
              );
            patch.status = b["status"];
          }
          const plan = PLANS.find((p) => p === b["plan"]);
          if (plan) patch.plan = plan;
          if (
            typeof b["maxUsers"] === "number" &&
            Number.isInteger(b["maxUsers"]) &&
            b["maxUsers"] >= 1 &&
            b["maxUsers"] <= 500
          )
            patch.max_users = b["maxUsers"];
          if (
            typeof b["aiMonthlyLimit"] === "number" &&
            Number.isInteger(b["aiMonthlyLimit"]) &&
            b["aiMonthlyLimit"] >= 0 &&
            b["aiMonthlyLimit"] <= 1_000_000
          )
            patch.ai_monthly_limit = b["aiMonthlyLimit"];
          if (Object.keys(patch).length === 0)
            return json({ error: "Nada para alterar.", code: "bad_request" }, 400);
          const up = await admin
            .from("organizations")
            .update(patch)
            .eq("id", b["orgId"])
            .select("id");
          if (up.error) return json({ error: "Não foi possível salvar.", code: "db_error" }, 503);
          if (!up.data?.length)
            return json({ error: "Empresa não encontrada.", code: "not_found" }, 404);
          return json({ ok: true });
        } catch (e) {
          return fail(e);
        }
      },
    },
  },
});

function fail(e: unknown): Response {
  const cfg = configErrorResponse(e);
  if (cfg) return cfg;
  console.error("[inbox-platform]", (e as { message?: string })?.message);
  return json({ error: "Erro interno. Tente de novo.", code: "internal" }, 500);
}
