import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as supabase } from "./client-Bxc8_G9k.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/BrandLogo-gaoCjRVB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SERVER_STATE = {
	ready: false,
	user: null
};
var state = SERVER_STATE;
var listeners = /* @__PURE__ */ new Set();
var started = false;
function start() {
	if (started || typeof window === "undefined") return;
	started = true;
	supabase.auth.onAuthStateChange((_event, session) => {
		state = {
			ready: true,
			user: session?.user ?? null
		};
		listeners.forEach((l) => l());
	});
	supabase.auth.getSession().then(({ data }) => {
		state = {
			ready: true,
			user: data.session?.user ?? null
		};
		listeners.forEach((l) => l());
	});
}
function subscribe(listener) {
	start();
	listeners.add(listener);
	return () => listeners.delete(listener);
}
function useAuth() {
	return (0, import_react.useSyncExternalStore)(subscribe, () => state, () => SERVER_STATE);
}
async function signOut() {
	await supabase.auth.signOut();
}
/** Turns auth library errors into something a person can act on. */
function authErrorMessage(error) {
	const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
	const code = raw.toLowerCase();
	if (code.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
	if (code.includes("confirm")) return "Confirme seu e-mail antes de entrar.";
	if (code.includes("already registered") || code.includes("already exists")) return "Já existe uma conta com esse e-mail.";
	if (code.includes("rate limit") || code.includes("too many requests")) return "Muitas tentativas. Aguarde um minuto e tente de novo.";
	if (code.includes("password")) return "A senha precisa ter pelo menos 6 caracteres.";
	if (code.includes("network") || code.includes("failed to fetch")) return "Não foi possível conectar. Verifique sua internet e tente de novo.";
	return raw || "Algo deu errado. Tente novamente.";
}
var astarita_symbol_default = "data:image/png;base64,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";
function BrandLogo({ className, showName = false }) {
	const [failed, setFailed] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex items-center gap-3", className),
		children: [failed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground",
			children: "A"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: astarita_symbol_default,
			alt: "Astarita",
			className: "h-11 w-11 shrink-0 object-contain",
			onError: () => setFailed(true)
		}), showName && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-base font-bold text-current",
			children: "Astarita"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[10px] font-semibold uppercase text-current/55",
			children: "Planejamento de conteúdo"
		})] })]
	});
}
//#endregion
export { useAuth as i, authErrorMessage as n, signOut as r, BrandLogo as t };
