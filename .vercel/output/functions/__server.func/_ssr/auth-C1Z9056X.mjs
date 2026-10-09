import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-CeGigu7E.mjs";
import { n as Label, t as Input } from "./label-BKrfOzqD.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as supabase } from "./client-Bxc8_G9k.mjs";
import { i as useAuth, n as authErrorMessage, t as BrandLogo } from "./BrandLogo-gaoCjRVB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-C1Z9056X.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AuthPage() {
	const { ready, user } = useAuth();
	const navigate = useNavigate();
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [notice, setNotice] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (ready && user) navigate({
			to: "/",
			replace: true
		});
	}, [
		ready,
		user,
		navigate
	]);
	const submit = async () => {
		if (busy) return;
		setBusy(true);
		setNotice(null);
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});
		setBusy(false);
		if (error) {
			setNotice(authErrorMessage(error));
			return;
		}
		navigate({
			to: "/",
			replace: true
		});
	};
	const recover = async () => {
		if (!email.trim()) {
			setNotice("Informe seu e-mail para receber o link de recuperação.");
			return;
		}
		setBusy(true);
		const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
		setBusy(false);
		if (error) {
			setNotice(authErrorMessage(error));
			return;
		}
		toast.success("Se o e-mail existir, o link de recuperação chega em instantes.");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Layout, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-lg font-semibold",
			children: "Entrar"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mt-4 space-y-3",
			onSubmit: (e) => {
				e.preventDefault();
				submit();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "email",
						children: "E-mail"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "email",
						type: "email",
						autoComplete: "email",
						required: true,
						value: email,
						onChange: (e) => setEmail(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "password",
						children: "Senha"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "password",
						type: "password",
						autoComplete: "current-password",
						required: true,
						minLength: 6,
						value: password,
						onChange: (e) => setPassword(e.target.value)
					})]
				}),
				notice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-sm text-destructive",
					children: notice
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "w-full",
					disabled: busy,
					children: "Entrar"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			type: "button",
			variant: "link",
			onClick: () => void recover(),
			className: "mt-3 px-0 text-muted-foreground",
			children: "Esqueci minha senha"
		})
	] });
}
function Layout({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid min-h-screen p-3 sm:p-5 md:grid-cols-[1.05fr_1fr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "hidden flex-col justify-between overflow-hidden rounded-[2rem] bg-primary p-10 text-primary-foreground shadow-2xl md:flex",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLogo, {
				showName: true,
				className: "text-primary-foreground"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-3xl font-bold leading-snug",
					children: "Seu calendário editorial, num só lugar."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "max-w-xs text-sm text-primary-foreground/70",
					children: "Planeje publicações por cliente, acompanhe o funil e mantenha tudo aprovado antes da hora."
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-center justify-center px-4 py-10",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLogo, {
					showName: true,
					className: "mb-6 text-primary md:hidden"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "glass-panel rounded-3xl p-6",
					children
				})]
			})
		})]
	});
}
//#endregion
export { AuthPage as component };
