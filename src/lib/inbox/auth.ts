import type { User } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";

import { getInboxClient, getInboxConfig } from "@/lib/inbox/client";

/**
 * Autenticação do Inbox. Totalmente independente do login do calendário:
 * outro projeto Supabase, outra sessão, outro armazenamento.
 */
export type InboxAuthState = { ready: boolean; user: User | null };

const SERVER_STATE: InboxAuthState = { ready: false, user: null };

let state: InboxAuthState = SERVER_STATE;
const listeners = new Set<() => void>();
let started = false;

function publish(user: User | null) {
  state = { ready: true, user };
  listeners.forEach((l) => l());
}

function start() {
  if (started || typeof window === "undefined") return;
  // Sem configuração não há cliente: a tela de "Inbox não configurado" cuida disso.
  if (!getInboxConfig().ok) return;
  started = true;

  const auth = getInboxClient().auth;
  auth.onAuthStateChange((_event, session) => publish(session?.user ?? null));
  void auth.getSession().then(({ data }) => publish(data.session?.user ?? null));
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useInboxAuth(): InboxAuthState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );
}

export async function inboxSignIn(email: string, password: string) {
  return getInboxClient().auth.signInWithPassword({ email: email.trim(), password });
}

/** Encerra só a sessão do Inbox. A sessão do calendário não é tocada. */
export async function inboxSignOut() {
  await getInboxClient().auth.signOut();
}

export async function inboxResetPassword(email: string) {
  return getInboxClient().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/inbox/definir-senha`,
  });
}

export async function inboxSetPassword(password: string) {
  return getInboxClient().auth.updateUser({ password });
}

/** Mensagens em português para erros do Supabase Auth. */
export function inboxAuthError(error: unknown): string {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const msg = raw.toLowerCase();

  if (msg.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (msg.includes("rate limit") || msg.includes("too many requests"))
    return "Muitas tentativas. Aguarde um pouco e tente de novo.";
  if (msg.includes("same password") || msg.includes("different from the old"))
    return "Escolha uma senha diferente da atual.";
  if (msg.includes("password") && msg.includes("characters"))
    return "A senha precisa ter pelo menos 8 caracteres.";
  if (msg.includes("network") || msg.includes("failed to fetch"))
    return "Não foi possível conectar. Verifique sua internet e tente de novo.";
  return raw || "Algo deu errado. Tente novamente.";
}
