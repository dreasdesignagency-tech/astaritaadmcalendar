import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-CeGigu7E.mjs";
import { U as Asterisk } from "../_libs/lucide-react.mjs";
import { n as Label, t as Input } from "./label-BKrfOzqD.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as InboxScreen } from "./InboxScreen-cpJnJmz3.mjs";
import { i as inboxSignIn, n as inboxResetPassword, o as useInboxAuth, t as inboxAuthError } from "./auth-CcD_m8JY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/entrar-DfZ2Wkh8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function InboxLogin() {
	const { ready, user } = useInboxAuth();
	const navigate = useNavigate();
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [notice, setNotice] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (ready && user) navigate({
			to: "/inbox",
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
		try {
			const { error } = await inboxSignIn(email, password);
			if (error) setNotice(inboxAuthError(error));
		} catch (e) {
			setNotice(inboxAuthError(e));
		} finally {
			setBusy(false);
		}
	};
	/** Só envia e-mail quando a pessoa pede, e para o endereço que ela digitou. */
	const recover = async () => {
		if (!email.trim()) {
			setNotice("Informe seu e-mail para receber o link de definição de senha.");
			return;
		}
		setBusy(true);
		try {
			const { error } = await inboxResetPassword(email);
			if (error) setNotice(inboxAuthError(error));
			else toast.success("Se o e-mail tiver acesso ao Inbox, o link chega em instantes.");
		} catch (e) {
			setNotice(inboxAuthError(e));
		} finally {
			setBusy(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(InboxScreen, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Asterisk, {
					className: "h-6 w-6",
					strokeWidth: 2.5
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-xl font-semibold leading-tight",
				children: "Astarita Inbox"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Atendimento da equipe"
			})] })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "grid gap-3",
			onSubmit: (e) => {
				e.preventDefault();
				submit();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "inbox-email",
						children: "E-mail"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "inbox-email",
						type: "email",
						autoComplete: "username",
						value: email,
						onChange: (e) => setEmail(e.target.value),
						required: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "inbox-password",
						children: "Senha"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "inbox-password",
						type: "password",
						autoComplete: "current-password",
						value: password,
						onChange: (e) => setPassword(e.target.value),
						required: true
					})]
				}),
				notice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "alert",
					className: "rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive",
					children: notice
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "rounded-full",
					disabled: busy,
					children: busy ? "Entrando…" : "Entrar"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => void recover(),
					disabled: busy,
					className: "text-sm font-medium text-primary hover:underline disabled:opacity-60",
					children: "Definir ou recuperar senha"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-6 text-xs text-muted-foreground",
			children: "Acesso restrito. Este login é só do Inbox e não é o mesmo do calendário."
		})
	] });
}
//#endregion
export { InboxLogin as component };
