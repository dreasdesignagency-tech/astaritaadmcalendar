import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AuthState = {
  ready: boolean;
  user: User | null;
};

const SERVER_STATE: AuthState = { ready: false, user: null };

let state: AuthState = SERVER_STATE;
const listeners = new Set<() => void>();
let started = false;

function start() {
  if (started || typeof window === "undefined") return;
  started = true;

  // Keeps the UI in step with sign in, sign out, token refresh and
  // password-recovery links landing in this tab.
  supabase.auth.onAuthStateChange((_event, session) => {
    state = { ready: true, user: session?.user ?? null };
    listeners.forEach((l) => l());
  });

  supabase.auth.getSession().then(({ data }) => {
    state = { ready: true, user: data.session?.user ?? null };
    listeners.forEach((l) => l());
  });
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAuth(): AuthState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );
}

export async function signOut() {
  await supabase.auth.signOut();
}

/** Turns auth library errors into something a person can act on. */
export function authErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const code = raw.toLowerCase();

  if (code.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (code.includes("confirm")) return "Confirme seu e-mail antes de entrar.";
  if (code.includes("already registered") || code.includes("already exists"))
    return "Já existe uma conta com esse e-mail.";
  if (code.includes("rate limit") || code.includes("too many requests"))
    return "Muitas tentativas. Aguarde um minuto e tente de novo.";
  if (code.includes("password")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (code.includes("network") || code.includes("failed to fetch"))
    return "Não foi possível conectar. Verifique sua internet e tente de novo.";

  return raw || "Algo deu errado. Tente novamente.";
}
