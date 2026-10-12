import type { InboxProfile, MyProfile } from "./types";

/**
 * Compatibilidade com o banco ANTERIOR à migration multiempresa. Enquanto a migration não for aplicada no projeto,
 * o banco não tem organizations nem profiles.org_id/access/is_platform_admin. Nesse período o app funciona como antes
 * (uma empresa só), sem poderes de administração: assim o código novo pode ir ao ar ANTES da migration sem quebrar o login.
 */
export const LEGACY_ORG_ID = "00000000-0000-0000-0000-000000000000";

/** Erros que significam "essa coluna/relação ainda não existe": 42703 (coluna), PGRST200 (relação não encontrada), PGRST204. */
export function isLegacySchemaError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return (
    e?.code === "42703" ||
    e?.code === "PGRST200" ||
    e?.code === "PGRST204" ||
    /column .* does not exist|Could not find a relationship|Could not find the .* column/i.test(
      e?.message ?? "",
    )
  );
}

type OldRow = Pick<InboxProfile, "id" | "full_name" | "role" | "avatar_url" | "active">;

/** Pessoa do banco antigo: sem poder de administrar (o servidor também recusaria sem a migration). */
export function legacyPerson(row: OldRow): InboxProfile {
  return { ...row, org_id: LEGACY_ORG_ID, access: "agent", is_platform_admin: false };
}

export function legacyMyProfile(row: OldRow): MyProfile {
  return {
    ...legacyPerson(row),
    org: {
      id: LEGACY_ORG_ID,
      name: "Astarita Inbox",
      slug: "legado",
      plan: "business",
      status: "active",
      max_users: 10,
      ai_monthly_limit: 0,
    },
  };
}
