import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as useNavigate, h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-CeGigu7E.mjs";
import { C as KeyRound } from "../_libs/lucide-react.mjs";
import { n as Label, t as Input } from "./label-BKrfOzqD.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as EmptyState } from "./EmptyState-V_MCyutM.mjs";
import { t as InboxScreen } from "./InboxScreen-cpJnJmz3.mjs";
import { o as useInboxAuth, r as inboxSetPassword, t as inboxAuthError } from "./auth-CcD_m8JY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/definir-senha-D_ss41Bd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Destino dos links de convite e de recuperação de senha do projeto Inbox. */
var MIN = 8;
function SetPassword() {
	const { ready, user } = useInboxAuth();
	const navigate = useNavigate();
	const [password, setPassword] = (0, import_react.useState)("");
	const [confirm, setConfirm] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [notice, setNotice] = (0, import_react.useState)(null);
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InboxScreen, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-center text-sm text-muted-foreground",
		children: "Validando o link…"
	}) });
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(InboxScreen, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		icon: KeyRound,
		title: "Link inválido ou expirado",
		children: "Peça um novo link na tela de entrada."
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/inbox/entrar",
			className: "text-sm font-medium text-primary hover:underline",
			children: "Ir para a entrada"
		})
	})] });
	const submit = async () => {
		if (busy) return;
		if (password.length < MIN) return setNotice(`A senha precisa ter pelo menos ${MIN} caracteres.`);
		if (password !== confirm) return setNotice("As senhas não são iguais.");
		setBusy(true);
		setNotice(null);
		try {
			const { error } = await inboxSetPassword(password);
			if (error) return setNotice(inboxAuthError(error));
			toast.success("Senha definida.");
			navigate({
				to: "/inbox",
				replace: true
			});
		} catch (e) {
			setNotice(inboxAuthError(e));
		} finally {
			setBusy(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(InboxScreen, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-xl font-semibold",
			children: "Definir senha"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-5 text-sm text-muted-foreground",
			children: user.email
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
						htmlFor: "new-password",
						children: "Nova senha"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "new-password",
						type: "password",
						autoComplete: "new-password",
						value: password,
						onChange: (e) => setPassword(e.target.value),
						required: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "confirm-password",
						children: "Repita a senha"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "confirm-password",
						type: "password",
						autoComplete: "new-password",
						value: confirm,
						onChange: (e) => setConfirm(e.target.value),
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
					children: busy ? "Salvando…" : "Salvar senha"
				})
			]
		})
	] });
}
//#endregion
export { SetPassword as component };
