import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/EmptyState-V_MCyutM.js
var import_jsx_runtime = require_jsx_runtime();
function EmptyState({ icon: Icon, title, children, className, tone = "neutral" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex flex-col items-center justify-center gap-2 px-6 py-10 text-center", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("mb-1 flex h-12 w-12 items-center justify-center rounded-full", tone === "error" ? "bg-destructive/10 text-destructive" : "bg-accent text-primary"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-5 w-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium",
				children: title
			}),
			children && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "max-w-xs text-sm text-muted-foreground",
				children
			})
		]
	});
}
//#endregion
export { EmptyState as t };
