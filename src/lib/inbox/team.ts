import { inboxApi, type ApiResult } from "@/lib/inbox/messaging";

/** Equipe da empresa (só dono/administrador). A senha temporária volta uma vez e deve ser entregue à pessoa. */
export const addPerson = (p: { fullName: string; email: string; access: "admin" | "agent" }) =>
  inboxApi<{ userId: string; email: string; tempPassword: string }>("/api/inbox/team", p);

export const setPersonActive = (userId: string, active: boolean): Promise<ApiResult> =>
  inboxApi("/api/inbox/team", { userId, active }, "PATCH");

export const setPersonAccess = (userId: string, access: "admin" | "agent"): Promise<ApiResult> =>
  inboxApi("/api/inbox/team", { userId, access }, "PATCH");

export const resetPersonPassword = (userId: string) =>
  inboxApi<{ tempPassword: string }>("/api/inbox/team", { userId, resetPassword: true }, "PATCH");

/** Conexão do WhatsApp da empresa. Token e App Secret só vão; nunca voltam. */
export type WhatsAppSettings = {
  webhookKey: string | null;
  verifyToken: string | null;
  phoneNumberId: string | null;
  version: string | null;
  hasToken: boolean;
  hasAppSecret: boolean;
};
export const fetchWhatsAppSettings = () =>
  inboxApi<WhatsAppSettings>("/api/inbox/whatsapp", undefined, "GET");

export const saveWhatsAppSettings = (p: {
  phoneNumberId?: string;
  version?: string;
  token?: string;
  appSecret?: string;
}) => inboxApi<{ status: unknown }>("/api/inbox/whatsapp", p);

/** Painel do dono da plataforma. */
export type PlatformOrg = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended";
  plan: "starter" | "pro" | "business";
  maxUsers: number;
  aiMonthlyLimit: number;
  createdAt: string;
  users: number;
  contacts: number;
  conversations: number;
  aiUsed: number;
  whatsappConfigured: boolean;
  whatsappConnectedAt: string | null;
};
export const fetchPlatformOrgs = () =>
  inboxApi<{ orgs: PlatformOrg[] }>("/api/inbox/platform/orgs", undefined, "GET");

export const createPlatformOrg = (p: {
  name: string;
  slug: string;
  plan: "starter" | "pro" | "business";
  ownerName: string;
  ownerEmail: string;
}) =>
  inboxApi<{ orgId: string; owner: { email: string; tempPassword: string } }>(
    "/api/inbox/platform/orgs",
    p,
  );

export const updatePlatformOrg = (p: {
  orgId: string;
  status?: "active" | "suspended";
  plan?: "starter" | "pro" | "business";
  maxUsers?: number;
  aiMonthlyLimit?: number;
}): Promise<ApiResult> => inboxApi("/api/inbox/platform/orgs", p, "PATCH");
