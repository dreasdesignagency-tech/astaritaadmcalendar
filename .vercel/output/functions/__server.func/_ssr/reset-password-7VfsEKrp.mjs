import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-CeGigu7E.mjs";
import { n as Label, t as Input } from "./label-BKrfOzqD.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as supabase } from "./client-Bxc8_G9k.mjs";
import { i as useAuth, n as authErrorMessage, t as BrandLogo } from "./BrandLogo-gaoCjRVB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reset-password-7VfsEKrp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ResetPasswordPage() {
	const { ready, user } = useAuth();
	const navigate = useNavigate();
	const [password, setPassword] = (0, import_react.useState)("");
	const [confirm, setConfirm] = (0, import_react.useState)("");
	const [saving, setSaving] = (0, import_react.useState)(false);
	const submit = async () => {
		if (password.length < 6) {
			toast.error("A senha precisa ter pelo menos 6 caracteres.");
			return;
		}
		if (password !== confirm) {
			toast.error("As senhas não conferem.");
			return;
		}
		setSaving(true);
		const { error } = await supabase.auth.updateUser({ password });
		setSaving(false);
		if (error) {
			toast.error(authErrorMessage(error));
			return;
		}
		toast.success("Senha atualizada.");
		navigate({
			to: "/",
			replace: true
		});
	};
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLogo, { className: "animate-pulse" })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "glass-panel w-full max-w-sm space-y-4 rounded-3xl p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLogo, {
						showName: true,
						className: "mb-6 text-primary"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-lg font-bold text-primary",
						children: "Definir nova senha"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: [
							"Escolha uma senha nova para ",
							user?.email ?? "sua conta",
							"."
						]
					})
				] }),
				!user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground",
					children: "Seu link de recuperação expirou. Solicite um novo na tela de entrada."
				}),
				user && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "new-password",
								children: "Nova senha"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "new-password",
								type: "password",
								autoComplete: "new-password",
								value: password,
								onChange: (e) => setPassword(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "confirm-password",
								children: "Repetir senha"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "confirm-password",
								type: "password",
								autoComplete: "new-password",
								value: confirm,
								onChange: (e) => setConfirm(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "w-full",
							onClick: submit,
							disabled: saving,
							children: "Salvar senha"
						})
					]
				})
			]
		})
	});
}
//#endregion
export { ResetPasswordPage as component };
