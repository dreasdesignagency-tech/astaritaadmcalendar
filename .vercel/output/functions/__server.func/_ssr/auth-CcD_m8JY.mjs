import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as getInboxClient, r as getInboxConfig } from "./client-Ba0sJm8H.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-CcD_m8JY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var SERVER_STATE = {
	ready: false,
	user: null
};
var state = SERVER_STATE;
var listeners = /* @__PURE__ */ new Set();
var started = false;
function publish(user) {
	state = {
		ready: true,
		user
	};
	listeners.forEach((l) => l());
}
function start() {
	if (started || typeof window === "undefined") return;
	if (!getInboxConfig().ok) return;
	started = true;
	const auth = getInboxClient().auth;
	auth.onAuthStateChange((_event, session) => publish(session?.user ?? null));
	auth.getSession().then(({ data }) => publish(data.session?.user ?? null));
}
function subscribe(listener) {
	start();
	listeners.add(listener);
	return () => listeners.delete(listener);
}
function useInboxAuth() {
	return (0, import_react.useSyncExternalStore)(subscribe, () => state, () => SERVER_STATE);
}
async function inboxSignIn(email, password) {
	return getInboxClient().auth.signInWithPassword({
		email: email.trim(),
		password
	});
}
/** Encerra só a sessão do Inbox. A sessão do calendário não é tocada. */
async function inboxSignOut() {
	await getInboxClient().auth.signOut();
}
async function inboxResetPassword(email) {
	return getInboxClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/inbox/definir-senha` });
}
async function inboxSetPassword(password) {
	return getInboxClient().auth.updateUser({ password });
}
/** Mensagens em português para erros do Supabase Auth. */
function inboxAuthError(error) {
	const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
	const msg = raw.toLowerCase();
	if (msg.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
	if (msg.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
	if (msg.includes("rate limit") || msg.includes("too many requests")) return "Muitas tentativas. Aguarde um pouco e tente de novo.";
	if (msg.includes("same password") || msg.includes("different from the old")) return "Escolha uma senha diferente da atual.";
	if (msg.includes("password") && msg.includes("characters")) return "A senha precisa ter pelo menos 8 caracteres.";
	if (msg.includes("network") || msg.includes("failed to fetch")) return "Não foi possível conectar. Verifique sua internet e tente de novo.";
	return raw || "Algo deu errado. Tente novamente.";
}
//#endregion
export { inboxSignOut as a, inboxSignIn as i, inboxResetPassword as n, useInboxAuth as o, inboxSetPassword as r, inboxAuthError as t };
