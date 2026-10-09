import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/InboxScreen-cpJnJmz3.js
var import_jsx_runtime = require_jsx_runtime();
/** Tela cheia no visual do Inbox, para estados fora do layout principal (login, erros, configuração). */
function InboxScreen({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "inbox-theme fixed inset-0 flex items-center justify-center overflow-y-auto bg-background p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "inbox-surface w-full max-w-md rounded-[2rem] p-6 sm:p-8",
			children
		})
	});
}
//#endregion
export { InboxScreen as t };
