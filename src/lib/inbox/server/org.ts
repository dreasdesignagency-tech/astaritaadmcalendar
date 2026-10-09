import type { TablesUpdate } from "@/lib/inbox/database.types";
import type { AdminClient } from "@/lib/inbox/server/admin";
import { secretsKey } from "@/lib/inbox/server/env";
import { decryptSecret, encryptSecret, randomHex } from "@/lib/inbox/server/secrets";
import {
  validateCredentialInput,
  type CredentialInput,
  type WaCredentials,
} from "@/lib/inbox/server/whatsapp-core";

/**
 * Credenciais do WhatsApp de cada empresa. Os segredos ficam criptografados no banco (tabela org_whatsapp, que o navegador
 * não consegue ler) e só são descriptografados aqui, no servidor, no momento de usar.
 */
export type OrgWhatsApp = {
  orgId: string;
  webhookKey: string;
  creds: WaCredentials;
  connectedAt: string | null;
  /** Havia texto cifrado que não abriu (chave trocada ou dado corrompido). */
  undecryptable: boolean;
};

export class SecretsKeyError extends Error {
  constructor() {
    super("INBOX_SECRETS_KEY ausente ou inválida");
  }
}

function requireKey(): string {
  const k = secretsKey();
  if (!k) throw new SecretsKeyError();
  return k;
}

type Row = {
  org_id: string;
  webhook_key: string;
  phone_number_id: string | null;
  api_version: string | null;
  access_token_enc: string | null;
  app_secret_enc: string | null;
  verify_token_enc: string | null;
  connected_at: string | null;
};

async function open(row: Row): Promise<OrgWhatsApp> {
  const key = requireKey();
  let bad = false;
  const dec = async (v: string | null) => {
    if (!v) return null;
    const out = await decryptSecret(v, key);
    if (out === null) bad = true;
    return out;
  };
  const creds: WaCredentials = {
    phoneNumberId: row.phone_number_id,
    version: row.api_version,
    token: await dec(row.access_token_enc),
    appSecret: await dec(row.app_secret_enc),
    verifyToken: await dec(row.verify_token_enc),
  };
  return {
    orgId: row.org_id,
    webhookKey: row.webhook_key,
    creds,
    connectedAt: row.connected_at,
    undecryptable: bad,
  };
}

const COLS =
  "org_id, webhook_key, phone_number_id, api_version, access_token_enc, app_secret_enc, verify_token_enc, connected_at";

export async function loadOrgWhatsApp(
  admin: AdminClient,
  orgId: string,
): Promise<OrgWhatsApp | null> {
  const r = await admin.from("org_whatsapp").select(COLS).eq("org_id", orgId).maybeSingle();
  if (r.error) throw r.error;
  return r.data ? open(r.data) : null;
}

/** Acha a empresa pelo endereço do webhook (parte aleatória). Empresa suspensa não recebe nada. */
export async function findByWebhookKey(
  admin: AdminClient,
  key: string,
): Promise<OrgWhatsApp | null> {
  if (!/^[a-f0-9]{32}$/.test(key)) return null;
  const r = await admin
    .from("org_whatsapp")
    .select(`${COLS}, org:organizations!inner(status)`)
    .eq("webhook_key", key)
    .maybeSingle();
  if (r.error) throw r.error;
  if (!r.data) return null;
  if ((r.data.org as unknown as { status: string }).status !== "active") return null;
  return open(r.data);
}

export type SaveResult = { ok: true } | { ok: false; error: string; field?: string; code: string };

/** Salva o que a pessoa informou. Campo ausente mantém o valor atual. O verify token é gerado na primeira vez. */
export async function saveOrgWhatsApp(
  admin: AdminClient,
  orgId: string,
  input: CredentialInput,
): Promise<SaveResult> {
  const v = validateCredentialInput(input);
  if (!v.ok) return { ok: false, error: v.error, field: v.field, code: "invalid" };
  const key = requireKey();
  const cur = await admin
    .from("org_whatsapp")
    .select("org_id, verify_token_enc")
    .eq("org_id", orgId)
    .maybeSingle();
  if (cur.error) throw cur.error;

  const patch: TablesUpdate<"org_whatsapp"> = {};
  if (v.value.phoneNumberId !== undefined) patch.phone_number_id = v.value.phoneNumberId;
  if (v.value.version !== undefined) patch.api_version = v.value.version;
  if (v.value.token !== undefined) patch.access_token_enc = await encryptSecret(v.value.token, key);
  if (v.value.appSecret !== undefined)
    patch.app_secret_enc = await encryptSecret(v.value.appSecret, key);
  if (!cur.data?.verify_token_enc) patch.verify_token_enc = await encryptSecret(randomHex(24), key);

  const res = cur.data
    ? await admin.from("org_whatsapp").update(patch).eq("org_id", orgId)
    : await admin
        .from("org_whatsapp")
        .insert({ org_id: orgId, webhook_key: randomHex(16), ...patch });
  if (res.error) {
    if (res.error.code === "23505")
      return {
        ok: false,
        code: "phone_in_use",
        field: "phoneNumberId",
        error: "Este número já está conectado a outra conta do sistema.",
      };
    throw res.error;
  }
  return { ok: true };
}

export async function markConnected(admin: AdminClient, orgId: string, reachable: boolean) {
  await admin
    .from("org_whatsapp")
    .update({ connected_at: reachable ? new Date().toISOString() : null })
    .eq("org_id", orgId);
}
