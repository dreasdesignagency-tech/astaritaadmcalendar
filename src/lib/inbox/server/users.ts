import type { AdminClient } from "@/lib/inbox/server/admin";
import { tempPassword } from "@/lib/inbox/server/secrets";

export type Access = "owner" | "admin" | "agent";

export type CreateUserResult =
  | { ok: true; userId: string; email: string; tempPassword: string }
  | { ok: false; error: string; code: string };

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

/**
 * Cria uma pessoa DENTRO de uma empresa: usuário no Auth (já confirmado, com senha temporária) + perfil.
 * Respeita o limite de usuários do plano. Se o perfil falhar, desfaz o usuário (nada fica órfão).
 * A senha temporária é devolvida UMA vez, para quem criou entregar à pessoa.
 */
export async function createOrgUser(
  admin: AdminClient,
  orgId: string,
  p: { email: string; fullName: string; access: Access },
): Promise<CreateUserResult> {
  const email = p.email.trim().toLowerCase();
  const fullName = p.fullName.trim();
  if (!EMAIL.test(email)) return { ok: false, error: "E-mail inválido.", code: "bad_email" };
  if (fullName.length < 1 || fullName.length > 120)
    return { ok: false, error: "Informe o nome da pessoa (até 120 letras).", code: "bad_name" };

  const org = await admin
    .from("organizations")
    .select("max_users, status")
    .eq("id", orgId)
    .single();
  if (org.error) return { ok: false, error: "Empresa não encontrada.", code: "not_found" };
  if (org.data.status !== "active")
    return { ok: false, error: "Esta empresa está suspensa.", code: "org_suspended" };
  const used = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("active", true);
  if (used.error)
    return { ok: false, error: "Não foi possível conferir o limite.", code: "db_error" };
  if ((used.count ?? 0) >= org.data.max_users)
    return {
      ok: false,
      error: `O plano permite no máximo ${org.data.max_users} pessoas ativas. Desative alguém ou peça um plano maior.`,
      code: "user_limit",
    };

  const password = tempPassword();
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (created.error || !created.data.user) {
    const msg = String(created.error?.message ?? "");
    if (/already|exists|registered/i.test(msg))
      return { ok: false, error: "Este e-mail já tem uma conta no sistema.", code: "email_exists" };
    return {
      ok: false,
      error: "Não foi possível criar o acesso. Tente de novo.",
      code: "auth_error",
    };
  }
  const userId = created.data.user.id;
  const prof = await admin.from("profiles").insert({
    id: userId,
    full_name: fullName,
    role: "member",
    org_id: orgId,
    access: p.access,
  });
  if (prof.error) {
    await admin.auth.admin.deleteUser(userId);
    return {
      ok: false,
      error: "Não foi possível criar o perfil. Tente de novo.",
      code: "db_error",
    };
  }
  return { ok: true, userId, email, tempPassword: password };
}

/** Nova senha temporária para alguém da mesma empresa. */
export async function resetUserPassword(
  admin: AdminClient,
  userId: string,
): Promise<{ ok: true; tempPassword: string } | { ok: false; error: string }> {
  const password = tempPassword();
  const r = await admin.auth.admin.updateUserById(userId, { password });
  if (r.error) return { ok: false, error: "Não foi possível trocar a senha. Tente de novo." };
  return { ok: true, tempPassword: password };
}
