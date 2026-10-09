import { d as Outlet, h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { l as Settings } from "../_libs/lucide-react.mjs";
import { r as getInboxConfig } from "./client-Ba0sJm8H.mjs";
import { t as EmptyState } from "./EmptyState-V_MCyutM.mjs";
import { t as InboxScreen } from "./InboxScreen-cpJnJmz3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-DQkLnMnJ.js
var import_jsx_runtime = require_jsx_runtime();
/**
* Portão de configuração do Inbox. Tudo abaixo de /inbox (inclusive o login) só aparece se o cliente do
* projeto do Inbox estiver configurado. O calendário não passa por aqui e nunca depende disto.
*/
function InboxRoot() {
	const config = getInboxConfig();
	if (config.ok) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(InboxScreen, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		icon: Settings,
		title: "Inbox não configurado",
		children: config.reason === "missing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			"Faltam variáveis de ambiente do projeto Supabase do Inbox:",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-2 block space-y-1 font-mono text-xs text-foreground",
				children: config.missing.map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block",
					children: name
				}, name))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-2 block",
				children: "Defina as duas e reinicie o app. O calendário não é afetado."
			})
		] }) : config.message
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/",
			className: "text-sm font-medium text-primary hover:underline",
			children: "Ir para o calendário"
		})
	})] });
}
//#endregion
export { InboxRoot as component };
