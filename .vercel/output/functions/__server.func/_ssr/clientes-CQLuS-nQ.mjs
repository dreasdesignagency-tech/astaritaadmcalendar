import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-CeGigu7E.mjs";
import { h as Plus } from "../_libs/lucide-react.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, t as Dialog } from "./dialog-C2Ow_kti.mjs";
import { n as Label, t as Input } from "./label-BKrfOzqD.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as supabase } from "./client-Bxc8_G9k.mjs";
import { u as fetchClients } from "./planner-BpHitoEP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/clientes-CQLuS-nQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ClientsPage() {
	const query = useQuery({
		queryKey: ["clients"],
		queryFn: fetchClients
	});
	const clients = query.data ?? [];
	const [open, setOpen] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [name, setName] = (0, import_react.useState)("");
	const [color, setColor] = (0, import_react.useState)("#831a4b");
	const [saving, setSaving] = (0, import_react.useState)(false);
	const openNew = () => {
		setEditing(null);
		setName("");
		setColor("#831a4b");
		setOpen(true);
	};
	const openEdit = (client) => {
		setEditing(client);
		setName(client.name);
		setColor(client.color);
		setOpen(true);
	};
	const save = async () => {
		if (!name.trim()) {
			toast.error("Informe o nome do cliente.");
			return;
		}
		setSaving(true);
		const payload = {
			name: name.trim(),
			color
		};
		const { error } = editing ? await supabase.from("clients").update(payload).eq("id", editing.id) : await supabase.from("clients").insert(payload);
		setSaving(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success(editing ? "Cliente atualizado" : "Cliente adicionado");
		setOpen(false);
		query.refetch();
	};
	const toggleActive = async (client) => {
		const { error } = await supabase.from("clients").update({ active: !client.active }).eq("id", client.id);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success(client.active ? "Cliente arquivado" : "Cliente reativado");
		query.refetch();
	};
	const remove = async (client) => {
		if (!confirm(`Apagar o cliente "${client.name}" e todos os seus conteúdos?`)) return;
		await supabase.from("contents").delete().eq("client_id", client.id);
		const { error } = await supabase.from("clients").delete().eq("id", client.id);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success("Cliente apagado");
		query.refetch();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mr-auto",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold uppercase text-primary/65",
					children: "Organização"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display mt-1 text-3xl font-bold text-primary",
					children: "Clientes"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: openNew,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), " Adicionar cliente"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
			children: [clients.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "glass-soft col-span-full rounded-3xl p-6 text-sm text-muted-foreground",
				children: "Nenhum cliente cadastrado."
			}), clients.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "glass-soft glass-lift rounded-3xl p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-5 flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex h-11 w-11 items-center justify-center rounded-2xl font-display font-bold text-primary-foreground",
						style: { backgroundColor: c.color },
						"aria-hidden": true,
						children: c.name.slice(0, 2).toUpperCase()
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `block truncate font-display text-sm font-bold ${c.active ? "text-primary" : "text-muted-foreground line-through"}`,
							children: c.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: c.active ? "Cliente ativo" : "Cliente arquivado"
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-1 border-t border-border/60 pt-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "sm",
							onClick: () => openEdit(c),
							children: "Editar"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "sm",
							onClick: () => toggleActive(c),
							children: c.active ? "Arquivar" : "Reativar"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "sm",
							className: "ml-auto text-destructive",
							onClick: () => remove(c),
							children: "Apagar"
						})
					]
				})]
			}, c.id))]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-sm",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: editing ? "Editar cliente" : "Adicionar cliente" }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "client-name",
							children: "Nome"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "client-name",
							value: name,
							onChange: (e) => setName(e.target.value)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "client-color",
							children: "Cor identificadora"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "client-color",
							type: "color",
							className: "h-9 w-16 p-1",
							value: color,
							onChange: (e) => setColor(e.target.value)
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => setOpen(false),
						disabled: saving,
						children: "Cancelar"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: save,
						disabled: saving,
						children: "Salvar"
					})]
				})
			]
		})
	})] });
}
//#endregion
export { ClientsPage as component };
