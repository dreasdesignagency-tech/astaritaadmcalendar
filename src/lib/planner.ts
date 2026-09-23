import { supabase } from "@/integrations/supabase/client";

export type FunnelStage = "topo" | "meio" | "fundo";

export const FUNNEL_STAGES: FunnelStage[] = ["topo", "meio", "fundo"];

export const FUNNEL_LABEL: Record<FunnelStage, string> = {
  topo: "Topo",
  meio: "Meio",
  fundo: "Fundo",
};

export const FUNNEL_CLASSES: Record<FunnelStage, { dot: string; block: string; bar: string }> = {
  topo: {
    dot: "bg-topo",
    block: "bg-topo-soft border-topo/40 text-topo",
    bar: "bg-topo",
  },
  meio: {
    dot: "bg-meio",
    block: "bg-meio-soft border-meio/40 text-meio",
    bar: "bg-meio",
  },
  fundo: {
    dot: "bg-fundo",
    block: "bg-fundo-soft border-fundo/40 text-fundo",
    bar: "bg-fundo",
  },
};

export const FORMATS = ["Reel", "Carrossel", "Post estático", "Stories", "Vídeo", "Outro"];

export const STATUSES = [
  "Ideia",
  "Planejado",
  "Em produção",
  "Aguardando aprovação",
  "Aprovado",
  "Agendado",
  "Publicado",
];

export type Client = {
  id: string;
  name: string;
  color: string;
  active: boolean;
  created_at: string;
};

export type Content = {
  id: string;
  client_id: string;
  title: string;
  publication_date: string;
  funnel_stage: FunnelStage;
  format: string;
  status: string;
  color: string | null;
};

/** Cores disponíveis para marcar um conteúdo no calendário. */
export const CONTENT_COLORS = [
  "#0805f1",
  "#2563eb",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#64748b",
  "#111827",
];

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase.from("clients").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function fetchContents(monthStart: string, monthEnd: string): Promise<Content[]> {
  const { data, error } = await supabase
    .from("contents")
    .select("id, client_id, title, publication_date, funnel_stage, format, status, color")
    .gte("publication_date", monthStart)
    .lte("publication_date", monthEnd)
    .order("publication_date");
  if (error) throw error;
  return (data ?? []) as Content[];
}

export const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const WEEKDAYS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

export function iso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Data de hoje no fuso horário do Brasil (America/Sao_Paulo). */
export function todaySaoPaulo(): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month") - 1, day: get("day") };
}

/** Escolhe texto claro ou escuro conforme o contraste com a cor de fundo. */
export function contrastText(hex: string): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1f2937" : "#ffffff";
}

/** Days of the grid, starting on Monday, with nulls for padding. */
export function monthGrid(year: number, month: number): (number | null)[] {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const total = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = Array.from({ length: offset }, () => null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
