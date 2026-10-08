export type InboxRole = "director" | "ceo" | "member";

export type InboxProfile = {
  id: string;
  full_name: string;
  role: InboxRole;
  avatar_url: string | null;
  active: boolean;
};

export type ConversationStatus = "waiting" | "in_progress" | "resolved";

export type ContactCategory = "lead" | "cliente" | "parceiro" | "outro";

export type ConversationRow = {
  id: string;
  status: ConversationStatus;
  assigned_to: string | null;
  unread_count: number;
  last_message_at: string | null;
  last_message_preview: string | null;
  contact: {
    id: string;
    name: string;
    phone: string | null;
    company: string | null;
    instagram: string | null;
    category: ContactCategory;
    notes: string | null;
  };
};

export type PipelineStage = {
  id: string;
  slug: string;
  name: string;
  position: number;
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
