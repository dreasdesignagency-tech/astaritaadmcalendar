import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Button } from "./button-CeGigu7E.mjs";
import { V as Building2, a as Users, f as SearchX, g as Pencil, h as Plus, r as WifiOff, y as MessageSquare } from "../_libs/lucide-react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { f as useFallbackInterval, o as UserAvatar, u as fetchTeam } from "./profile-context-xvvqmyQ6.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { b as openConversationFor, h as formatPhone, n as PageHeader, u as fetchContacts } from "./PageHeader-tdFIi3k3.mjs";
import { t as CATEGORY_LABEL } from "./types-QwviL-wI.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, o as Skeleton, r as SelectItem, t as Select } from "./skeleton-BS5SZ5Yi.mjs";
import { t as ContactDialog } from "./ContactDialog-C9oZUBtD.mjs";
import { t as EmptyState } from "./EmptyState-V_MCyutM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/contatos-BHjXtyr2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ALL = "all";
function ContactsPage() {
	const navigate = useNavigate();
	const interval = useFallbackInterval();
	const contacts = useQuery({
		queryKey: ["inbox", "contacts"],
		queryFn: fetchContacts,
		refetchInterval: interval
	});
	const team = useQuery({
		queryKey: ["inbox", "team"],
		queryFn: fetchTeam
	});
	const [query, setQuery] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)(ALL);
	const [owner, setOwner] = (0, import_react.useState)(ALL);
	const [tag, setTag] = (0, import_react.useState)(ALL);
	const [editing, setEditing] = (0, import_react.useState)(void 0);
	const [dialogOpen, setDialogOpen] = (0, import_react.useState)(false);
	const [opening, setOpening] = (0, import_react.useState)(null);
	const rows = (0, import_react.useMemo)(() => contacts.data ?? [], [contacts.data]);
	const tagNames = (0, import_react.useMemo)(() => [...new Set(rows.flatMap((r) => r.tags.map((t) => t.name)))].sort(), [rows]);
	const ownerName = (id) => team.data?.find((p) => p.id === id)?.full_name;
	const visible = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		const digits = q.replace(/\D/g, "");
		return rows.filter((r) => {
			if (category !== ALL && r.category !== category) return false;
			if (owner === "none" ? r.assigned_to !== null : owner !== ALL && r.assigned_to !== owner) return false;
			if (tag !== ALL && !r.tags.some((t) => t.name === tag)) return false;
			if (!q) return true;
			return [
				r.name,
				r.company,
				r.instagram,
				...r.tags.map((t) => t.name)
			].filter(Boolean).join(" ").toLowerCase().includes(q) || digits.length >= 3 && (r.phone ?? "").includes(digits);
		});
	}, [
		rows,
		query,
		category,
		owner,
		tag
	]);
	const openConversation = async (c) => {
		setOpening(c.id);
		try {
			const id = await openConversationFor(c.id, c.assigned_to);
			navigate({
				to: "/inbox",
				search: { c: id }
			});
		} catch {
			toast.error("Não foi possível abrir a conversa. Tente de novo.");
		} finally {
			setOpening(null);
		}
	};
	const openNew = () => {
		setEditing(void 0);
		setDialogOpen(true);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Contatos",
			subtitle: contacts.isPending ? "Carregando…" : `${rows.length} ${rows.length === 1 ? "contato" : "contatos"}`,
			search: {
				value: query,
				onChange: setQuery,
				placeholder: "Buscar contatos"
			},
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				className: "rounded-full",
				onClick: openNew,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-4 w-4" }), " Novo contato"]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "inbox-surface flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex shrink-0 flex-wrap items-center gap-2 px-4 pb-3 pt-4 sm:px-6",
				children: [[[ALL, "Todos"], ...Object.entries(CATEGORY_LABEL)].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setCategory(value),
					"aria-pressed": category === value,
					className: cn("rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors", category === value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-accent"),
					children: label
				}, value)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ml-auto flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: owner,
						onValueChange: setOwner,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "h-9 w-44 rounded-full text-xs",
							"aria-label": "Filtrar por responsável",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, {
							className: "inbox-theme",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: ALL,
									children: "Todos os responsáveis"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "none",
									children: "Sem responsável"
								}),
								team.data?.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: p.id,
									children: p.full_name
								}, p.id))
							]
						})]
					}), tagNames.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: tag,
						onValueChange: setTag,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "h-9 w-40 rounded-full text-xs",
							"aria-label": "Filtrar por etiqueta",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, {
							className: "inbox-theme",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: ALL,
								children: "Todas as etiquetas"
							}), tagNames.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: n,
								children: n
							}, n))]
						})]
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-0 flex-1 overflow-y-auto px-2 pb-3 sm:px-4",
				children: contacts.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2 px-2",
					children: [
						0,
						1,
						2,
						3
					].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-[76px] rounded-2xl" }, i))
				}) : contacts.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(EmptyState, {
					tone: "error",
					icon: WifiOff,
					title: "Erro de conexão",
					children: ["Não foi possível carregar os contatos.", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => void contacts.refetch(),
						className: "mt-2 block w-full font-medium text-primary hover:underline",
						children: "Tentar de novo"
					})]
				}) : rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(EmptyState, {
					icon: Users,
					title: "Sem contatos ainda",
					children: ["Quem escrever pelo WhatsApp vira contato automaticamente. Você também pode cadastrar alguém agora.", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "mt-3 rounded-full",
						size: "sm",
						onClick: openNew,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-4 w-4" }), " Novo contato"]
					})]
				}) : visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: SearchX,
					title: "Sem resultados",
					children: "Nenhum contato corresponde à busca ou aos filtros."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-1",
					children: visible.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl px-3 py-3 hover:bg-secondary",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserAvatar, { name: c.name }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1 basis-48",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "flex items-center gap-2 truncate text-sm font-semibold",
										children: [c.name, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground",
											children: CATEGORY_LABEL[c.category]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatPhone(c.phone) }),
											c.company && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "h-3 w-3" }), c.company]
											}),
											c.instagram && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c.instagram })
										]
									}),
									c.tags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 flex flex-wrap gap-1",
										children: c.tags.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground",
											children: t.name
										}, t.id))
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hidden text-xs text-muted-foreground sm:block sm:w-36",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: ownerName(c.assigned_to) ?? "Sem responsável" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Desde ", new Date(c.created_at).toLocaleDateString("pt-BR")] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									className: "rounded-full",
									disabled: opening === c.id || !c.phone,
									onClick: () => void openConversation(c),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "mr-1.5 h-4 w-4" }), c.conversation ? "Conversa" : "Iniciar"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "icon",
									variant: "outline",
									className: "rounded-full",
									"aria-label": `Editar ${c.name}`,
									onClick: () => {
										setEditing(c);
										setDialogOpen(true);
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
								})]
							})
						]
					}, c.id))
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContactDialog, {
			open: dialogOpen,
			onOpenChange: setDialogOpen,
			contact: editing
		})
	] });
}
//#endregion
export { ContactsPage as component };
