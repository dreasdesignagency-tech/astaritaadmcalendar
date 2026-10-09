import type { ChannelStatus } from "@/lib/inbox/messaging";

/**
 * Passo a passo de conexão do WhatsApp, calculado a partir do estado REAL que o servidor informa.
 * Função pura (testável). Nunca recebe nem devolve valores secretos: só nomes de variáveis e datas.
 */
export type StepState = "done" | "todo" | "error" | "unknown";
export type SetupStep = { id: string; title: string; state: StepState; detail: string };
export type EnvRow = ChannelStatus["envRows"][number];

export const WEBHOOK_PATH = "/api/whatsapp/webhook";

/** O servidor ainda não tem acesso ao banco: não dá para saber o resto, e a tela diz isso em vez de chutar. */
export function serverNotReadyStatus(serverMissing: string[]): ChannelStatus {
  return {
    whatsapp: {
      configured: false,
      missing: [],
      reachable: null,
      phone: null,
      verifiedName: null,
      error: null,
    },
    ai: { configured: false, provider: null, model: null, missing: [] },
    webhook: null,
    envRows: serverMissing.map((name) => ({
      name,
      scope: "banco",
      present: false,
      hint: "Falta no servidor do Inbox",
    })),
    serverMissing,
  };
}

export function webhookUrl(origin: string): string {
  return `${origin.replace(/\/+$/, "")}${WEBHOOK_PATH}`;
}

/** A Meta só aceita endereço público em HTTPS. */
export function isPublicHttps(origin: string): boolean {
  try {
    const u = new URL(origin);
    return u.protocol === "https:" && !/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(u.hostname);
  } catch {
    return false;
  }
}

/** Linhas da tabela de variáveis: vêm prontas do servidor (nomes e sim/não). */
export function buildEnvRows(status: ChannelStatus): EnvRow[] {
  return status.envRows;
}

export function buildSteps(status: ChannelStatus): SetupStep[] {
  const serverDown = !!status.serverMissing?.length;
  const wa = status.whatsapp;
  const steps: SetupStep[] = [];

  steps.push({
    id: "server",
    title: "O servidor do Inbox acessa o banco",
    state: serverDown ? "todo" : "done",
    detail: serverDown
      ? `Falta definir na hospedagem: ${status.serverMissing?.join(", ")}.`
      : "Pronto.",
  });

  steps.push({
    id: "env",
    title: "Variáveis do WhatsApp no servidor",
    state: serverDown ? "unknown" : wa.configured ? "done" : "todo",
    detail: serverDown
      ? "Só dá para conferir depois do passo anterior."
      : wa.configured
        ? "Todas definidas."
        : `Faltam: ${wa.missing.join(", ")}.`,
  });

  steps.push({
    id: "meta",
    title: "A Meta aceita as credenciais",
    state:
      serverDown || !wa.configured
        ? "unknown"
        : wa.reachable === true
          ? "done"
          : wa.reachable === false
            ? "error"
            : "unknown",
    detail:
      serverDown || !wa.configured
        ? "Depende dos passos anteriores."
        : wa.reachable === true
          ? `Conectado${wa.phone ? ` ao número ${wa.phone}` : ""}${wa.verifiedName ? ` (${wa.verifiedName})` : ""}.`
          : wa.reachable === false
            ? (wa.error ?? "A Meta recusou as credenciais.")
            : (wa.error ?? "Ainda não foi possível confirmar com a Meta."),
  });

  const hook = status.webhook;
  const refused = hook?.invalidLast24h ?? 0;
  steps.push({
    id: "webhook",
    title: "O webhook está recebendo eventos da Meta",
    state:
      serverDown || !wa.configured
        ? "unknown"
        : hook?.lastValidAt
          ? "done"
          : refused > 0
            ? "error"
            : "todo",
    detail:
      serverDown || !wa.configured
        ? "Depende dos passos anteriores."
        : hook?.lastValidAt
          ? `Último evento válido em ${new Date(hook.lastValidAt).toLocaleString("pt-BR")}.`
          : refused > 0
            ? `${refused} chamada(s) recusada(s) nas últimas 24 h por assinatura inválida. Confira se o App Secret configurado no servidor é o do app da Meta.`
            : "Nenhum evento recebido ainda. Cadastre o webhook na Meta e envie uma mensagem de teste.",
  });

  return steps;
}
