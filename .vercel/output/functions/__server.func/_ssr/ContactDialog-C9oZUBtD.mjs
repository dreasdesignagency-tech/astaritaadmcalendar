import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-CeGigu7E.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-C2Ow_kti.mjs";
import { n as Label, t as Input } from "./label-BKrfOzqD.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as fetchTeam } from "./profile-context-xvvqmyQ6.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { T as saveContact, h as formatPhone, t as InboxUserError } from "./PageHeader-tdFIi3k3.mjs";
import { t as Textarea } from "./textarea-kko37XEX.mjs";
import { t as CATEGORY_LABEL } from "./types-QwviL-wI.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./skeleton-BS5SZ5Yi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ContactDialog-C9oZUBtD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var NONE = "none";
var empty = {
	name: "",
	phone: "",
	company: "",
	instagram: "",
	category: "lead",
	assigned_to: null,
	notes: "",
	tags: []
};
function fromContact(c) {
	return {
		name: c.name,
		phone: formatPhone(c.phone),
		company: c.company ?? "",
		instagram: c.instagram ?? "",
		category: c.category,
		assigned_to: c.assigned_to,
		notes: c.notes ?? "",
		tags: c.tags.map((t) => t.name)
	};
}
/** Criar ou editar contato. `contact` ausente = novo contato. */
function ContactDialog({ open, onOpenChange, contact, onSaved }) {
	const queryClient = useQueryClient();
	const team = useQuery({
		queryKey: ["inbox", "team"],
		queryFn: fetchTeam
	});
	const [form, setForm] = (0, import_react.useState)(empty);
	const [tagsText, setTagsText] = (0, import_react.useState)("");
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const initial = contact ? fromContact(contact) : empty;
		setForm(initial);
		setTagsText(initial.tags.join(", "));
		setError(null);
	}, [open, contact]);
	const set = (key, value) => setForm((f) => ({
		...f,
		[key]: value
	}));
	const submit = async () => {
		if (saving) return;
		setSaving(true);
		setError(null);
		try {
			const tags = tagsText.split(",").map((t) => t.trim()).filter(Boolean);
			const id = await saveContact({
				...form,
				tags
			}, contact?.id);
			await queryClient.invalidateQueries({ queryKey: ["inbox"] });
			toast.success(contact ? "Contato atualizado." : "Contato criado.");
			onOpenChange(false);
			onSaved?.(id);
		} catch (e) {
			setError(e instanceof InboxUserError ? e.message : "Não foi possível salvar. Verifique a conexão e tente de novo.");
		} finally {
			setSaving(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "inbox-theme max-h-[92vh] overflow-y-auto rounded-[2rem] sm:max-w-lg",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
				className: "font-display",
				children: contact ? "Editar contato" : "Novo contato"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "O telefone identifica o contato e não pode se repetir." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "grid gap-3",
				onSubmit: (e) => {
					e.preventDefault();
					submit();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "c-name",
							children: "Nome *"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "c-name",
							value: form.name,
							onChange: (e) => set("name", e.target.value),
							maxLength: 160,
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "c-phone",
							children: "Telefone (WhatsApp) *"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "c-phone",
							inputMode: "tel",
							placeholder: "(11) 99999-8888",
							value: form.phone,
							onChange: (e) => set("phone", e.target.value),
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "c-company",
								children: "Empresa"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "c-company",
								value: form.company,
								onChange: (e) => set("company", e.target.value)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "c-ig",
								children: "Instagram"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "c-ig",
								placeholder: "@usuario",
								value: form.instagram,
								onChange: (e) => set("instagram", e.target.value)
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Categoria" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: form.category,
								onValueChange: (v) => set("category", v),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									"aria-label": "Categoria",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
									className: "inbox-theme",
									children: Object.entries(CATEGORY_LABEL).map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value,
										children: label
									}, value))
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Responsável" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: form.assigned_to ?? NONE,
								onValueChange: (v) => set("assigned_to", v === NONE ? null : v),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									"aria-label": "Responsável",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, {
									className: "inbox-theme",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: NONE,
										children: "Sem responsável"
									}), team.data?.filter((p) => p.active).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: p.id,
										children: p.full_name
									}, p.id))]
								})]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "c-tags",
							children: "Etiquetas"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "c-tags",
							placeholder: "separe por vírgula",
							value: tagsText,
							onChange: (e) => setTagsText(e.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "c-notes",
							children: "Anotação fixa do contato"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							id: "c-notes",
							rows: 3,
							value: form.notes,
							onChange: (e) => set("notes", e.target.value)
						})]
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						role: "alert",
						className: "rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive",
						children: error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
						className: "gap-2 sm:gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							className: "rounded-full",
							onClick: () => onOpenChange(false),
							children: "Cancelar"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							className: "rounded-full",
							disabled: saving,
							children: saving ? "Salvando…" : "Salvar"
						})]
					})
				]
			})]
		})
	});
}
//#endregion
export { ContactDialog as t };
