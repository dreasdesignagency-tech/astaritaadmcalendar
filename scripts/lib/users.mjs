/**
 * Busca de usuário por e-mail, sem depender do tamanho da base.
 * `listPage(page, perPage)` devolve { users, error }, no formato de supabase.auth.admin.listUsers.
 * Percorre TODAS as páginas até acabar, e para assim que acha.
 */
export async function findUserByEmail(listPage, email, perPage = 200) {
  const wanted = email.trim().toLowerCase();
  for (let page = 1; ; page += 1) {
    const { users, error } = await listPage(page, perPage);
    if (error) throw error;
    const hit = users.find((u) => u.email?.trim().toLowerCase() === wanted);
    if (hit) return hit;
    if (users.length < perPage) return null; // última página
    if (page > 10_000)
      throw new Error("Paginação de usuários não terminou; abortando por segurança.");
  }
}

/** Decide o que fazer com cada pessoa, sem tocar em nada. */
export function planMember(member, existingUser, { invite }) {
  if (existingUser) return { action: "reuse", userId: existingUser.id };
  if (invite) return { action: "invite" };
  return { action: "skip" };
}
