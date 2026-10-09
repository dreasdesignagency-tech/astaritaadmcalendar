import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { d as Outlet, g as useNavigate, h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { B as CalendarDays, a as Users, x as LogOut } from "../_libs/lucide-react.mjs";
import { i as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as useAuth, r as signOut, t as BrandLogo } from "./BrandLogo-gaoCjRVB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-Hq_b3vdu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var nav = [{
	to: "/",
	label: "Calendário",
	icon: CalendarDays
}, {
	to: "/clientes",
	label: "Clientes",
	icon: Users
}];
function AppShell({ children }) {
	const { user } = useAuth();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const leave = async () => {
		queryClient.cancelQueries();
		queryClient.clear();
		await signOut();
		toast.success("Você saiu.");
		navigate({
			to: "/auth",
			replace: true
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen p-3 text-foreground sm:p-5 lg:p-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "glass-panel mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1540px] overflow-hidden rounded-[2rem]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "hidden w-24 shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar px-3 py-7 md:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLogo, { className: "mb-10" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "space-y-3",
						children: nav.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							activeOptions: { exact: item.to === "/" },
							className: "flex h-12 w-12 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-accent hover:text-primary",
							activeProps: { className: "bg-primary text-primary-foreground shadow-lg font-medium" },
							title: item.label,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "h-5 w-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "sr-only",
								children: item.label
							})]
						}, item.to))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: leave,
							className: "flex h-11 w-11 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-accent hover:text-primary",
							title: `Sair de ${user?.email ?? "sua conta"}`,
							"aria-label": "Sair",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" })
						})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 flex-1 flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex items-center gap-3 border-b border-border bg-sidebar px-4 py-3 md:hidden",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLogo, { className: "[&_img]:h-9 [&_img]:w-9" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							className: "ml-auto flex gap-1",
							children: nav.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: item.to,
								activeOptions: { exact: item.to === "/" },
								className: "rounded-md px-2 py-1 text-xs text-muted-foreground",
								activeProps: { className: "bg-accent text-foreground font-medium" },
								children: item.label
							}, item.to))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: leave,
							"aria-label": "Sair",
							className: "rounded-md border border-border p-1.5 text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" })
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "flex-1 overflow-x-hidden p-4 md:p-7 lg:p-10",
					children
				})]
			})]
		})
	});
}
function AuthenticatedLayout() {
	const { ready, user } = useAuth();
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		if (ready && !user) navigate({
			to: "/auth",
			replace: true
		});
	}, [
		ready,
		user,
		navigate
	]);
	if (!ready || !user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingScreen, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) });
}
function LoadingScreen() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLogo, { className: "animate-pulse" })
	});
}
//#endregion
export { AuthenticatedLayout as component };
