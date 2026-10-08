import { db } from "@/lib/inbox/client";

export type KnowledgeRow = {
  id: string;
  section: string;
  title: string;
  content: string;
  updated_at: string;
};

/** Dicas do que escrever em cada seção. Nada é preenchido por nós: valores e condições vêm da Astarita. */
export const KNOWLEDGE_HINTS: Record<string, string> = {
  apresentacao: "Quem é a Astarita, em poucas linhas.",
  servicos: "O que a Astarita faz, um serviço por linha, com uma frase de explicação.",
  diferenciais: "O que torna o trabalho da Astarita diferente.",
  metodologia: "Como o trabalho acontece, do primeiro contato à entrega.",
  tom_de_voz: "Como a Astarita fala com clientes. Pode incluir o que evitar.",
  faq: "Perguntas frequentes e as respostas aprovadas. Uma por bloco.",
  condicoes_comerciais:
    "Prazos, formas de pagamento, o que está incluído. A IA só cita o que estiver aqui.",
  respostas_aprovadas: "Textos prontos que a equipe já aprovou e quer ver reaproveitados.",
};

const ORDER = Object.keys(KNOWLEDGE_HINTS);

export async function fetchKnowledge(): Promise<KnowledgeRow[]> {
  const { data, error } = await db
    .from("knowledge_base")
    .select("id, section, title, content, updated_at");
  if (error) throw error;
  return [...data].sort((a, b) => ORDER.indexOf(a.section) - ORDER.indexOf(b.section));
}

export async function saveKnowledge(id: string, content: string, userId: string): Promise<void> {
  const { error } = await db
    .from("knowledge_base")
    .update({ content, updated_by: userId })
    .eq("id", id);
  if (error) throw error;
}
