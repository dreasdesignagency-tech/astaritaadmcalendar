export type InboxRole = "director" | "ceo" | "member";

export type InboxAccess = "owner" | "admin" | "agent";

export type InboxOrg = {
  id: string;
  name: string;
  slug: string;
  plan: "starter" | "pro" | "business";
  status: "active" | "suspended";
  max_users: number;
  ai_monthly_limit: number;
};

export type InboxProfile = {
  id: string;
  full_name: string;
  role: InboxRole;
  avatar_url: string | null;
  active: boolean;
  org_id: string;
  access: InboxAccess;
  is_platform_admin: boolean;
};

/** O perfil de quem está logado, já com a empresa. */
export type MyProfile = InboxProfile & { org: InboxOrg };

export type ConversationStatus = "waiting" | "in_progress" | "resolved";

export type ContactCategory = "lead" | "cliente" | "parceiro" | "outro";

export type ConversationRow = {
  id: string;
  status: ConversationStatus;
  assigned_to: string | null;
  unread_count: number;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_inbound_at: string | null;
  updated_at: string;
  contact: {
    id: string;
    name: string;
    phone: string | null;
    company: string | null;
    instagram: string | null;
    category: ContactCategory;
    notes: string | null;
    assigned_to: string | null;
  };
};

export type TagRow = { id: string; name: string; color: string };

export type ContactRow = {
  id: string;
  name: string;
  phone: string | null;
  company: string | null;
  instagram: string | null;
  category: ContactCategory;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  tags: TagRow[];
  conversation: { id: string; status: ConversationStatus; last_message_at: string | null } | null;
};

export type MessageStatus = "received" | "pending" | "sent" | "delivered" | "read" | "failed";

export type MessageRow = {
  id: string;
  conversation_id: string;
  direction: "in" | "out";
  type: "text" | "image" | "document" | "audio" | "video" | "sticker" | "template" | "unsupported";
  body: string | null;
  media_mime: string | null;
  status: MessageStatus;
  error_message: string | null;
  sent_by: string | null;
  reply_to_id: string | null;
  media_path: string | null;
  wa_media_id: string | null;
  created_at: string;
};

export type PipelineStage = {
  id: string;
  slug: string;
  name: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
};

export const STATUS_LABEL: Record<ConversationStatus, string> = {
  waiting: "Aguardando resposta",
  in_progress: "Em atendimento",
  resolved: "Resolvida",
};

export const CATEGORY_LABEL: Record<ContactCategory, string> = {
  lead: "Lead",
  cliente: "Cliente",
  parceiro: "Parceiro",
  outro: "Outro",
};

export const ROLE_LABEL: Record<InboxRole, string> = {
  director: "Diretor Criativo",
  ceo: "CEO",
  member: "Equipe",
};

export const ACCESS_LABEL: Record<InboxAccess, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  agent: "Atendente",
};

/** Texto curto sob o nome: o cargo, quando existe, senão o nível de acesso. */
export function personLabel(p: Pick<InboxProfile, "role" | "access">): string {
  return p.role === "member" ? ACCESS_LABEL[p.access] : ROLE_LABEL[p.role];
}

export const PLAN_LABEL: Record<InboxOrg["plan"], string> = {
  starter: "Starter",
  pro: "Pro",
  business: "Business",
};
