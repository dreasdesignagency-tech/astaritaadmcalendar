import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-CeGigu7E.mjs";
import { f as SearchX, g as Pencil, h as Plus, o as Trash2, r as WifiOff, t as Zap } from "../_libs/lucide-react.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-C2Ow_kti.mjs";
import { n as Label, t as Input } from "./label-BKrfOzqD.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { f as useFallbackInterval, p as useInboxProfile } from "./profile-context-xvvqmyQ6.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as PageHeader } from "./PageHeader-tdFIi3k3.mjs";
import { t as Textarea } from "./textarea-kko37XEX.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, o as Skeleton, r as SelectItem, t as Select } from "./skeleton-BS5SZ5Yi.mjs";
import { t as EmptyState } from "./EmptyState-V_MCyutM.mjs";
import { i as fetchQuickReplies, n as QUICK_REPLY_LABEL, o as saveQuickReply, r as deleteQuickReply, t as QUICK_REPLY_CATEGORIES } from "./templates-BjyxYjwj.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-CS1PmlF4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/respostas-BVkYCIKc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function QuickReplyDialog({ open, onOpenChange, reply }) {
	const profile = useInboxProfile();
	const queryClient = useQueryClient();
	const [category, setCategory] = (0, import_react.useState)("primeiro_contato");
	const [title, setTitle] = (0, import_react.useState)("");
	const [body, setBody] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		setCategory(reply?.category ?? "primeiro_contato");
		setTitle(reply?.title ?? "");
		setBody(reply?.body ?? "");
		setError(null);
	}, [open, reply]);
	const submit = async () => {
		if (busy) return;
		setBusy(true);
		setError(null);
		try {
			await saveQuickReply({
				category,
				title,
				body
			}, profile.id, reply?.id);
			await queryClient.invalidateQueries({ queryKey: ["inbox", "quick-replies"] });
			toast.success(reply ? "Resposta atualizada." : "Resposta criada.");
			onOpenChange(false);
		} catch (e) {
			setError(e instanceof Error && e.message.startsWith("Preencha") ? e.message : "Não foi possível salvar. Tente de novo.");
		} finally {
			setBusy(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "inbox-theme rounded-[2rem] sm:max-w-lg",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
				className: "font-display",
				children: reply ? "Editar resposta rápida" : "Nova resposta rápida"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
				"Use ",
				"{nome}",
				" para inserir o primeiro nome do contato. O texto sempre pode ser editado antes de enviar."
			] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "grid gap-3",
				onSubmit: (e) => {
					e.preventDefault();
					submit();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Categoria" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: category,
							onValueChange: (v) => setCategory(v),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								"aria-label": "Categoria da resposta",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
								className: "inbox-theme",
								children: QUICK_REPLY_CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: c,
									children: QUICK_REPLY_LABEL[c]
								}, c))
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "qr-title",
							children: "Título"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "qr-title",
							maxLength: 80,
							value: title,
							onChange: (e) => setTitle(e.target.value),
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "qr-body",
							children: "Texto"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							id: "qr-body",
							rows: 6,
							maxLength: 4e3,
							value: body,
							onChange: (e) => setBody(e.target.value),
							required: true
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
							disabled: busy,
							children: busy ? "Salvando…" : "Salvar"
						})]
					})
				]
			})]
		})
	});
}
function QuickRepliesPage() {
	const queryClient = useQueryClient();
	const interval = useFallbackInterval();
	const replies = useQuery({
		queryKey: ["inbox", "quick-replies"],
		queryFn: fetchQuickReplies,
		refetchInterval: interval
	});
	const [search, setSearch] = (0, import_react.useState)("");
	const [editing, setEditing] = (0, import_react.useState)(void 0);
	const [dialogOpen, setDialogOpen] = (0, import_react.useState)(false);
	const [removing, setRemoving] = (0, import_react.useState)(null);
	const rows = (0, import_react.useMemo)(() => replies.data ?? [], [replies.data]);
	const q = search.trim().toLowerCase();
	const visible = (0, import_react.useMemo)(() => rows.filter((r) => !q || `${r.title} ${r.body}`.toLowerCase().includes(q)), [rows, q]);
	const openNew = () => {
		setEditing(void 0);
		setDialogOpen(true);
	};
	const remove = async () => {
		if (!removing) return;
		try {
			await deleteQuickReply(removing.id);
			await queryClient.invalidateQueries({ queryKey: ["inbox", "quick-replies"] });
			toast.success("Resposta excluída.");
		} catch {
			toast.error("Não foi possível excluir. Tente de novo.");
		} finally {
			setRemoving(null);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Respostas rápidas",
			subtitle: "Textos prontos para usar no chat. Sempre editáveis antes de enviar.",
			search: {
				value: search,
				onChange: setSearch,
				placeholder: "Buscar respostas"
			},
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				className: "rounded-full",
				onClick: openNew,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-4 w-4" }), " Nova resposta"]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "inbox-surface min-h-0 flex-1 overflow-y-auto rounded-[2rem] p-4 sm:p-6",
			children: replies.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: [
					0,
					1,
					2
				].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 rounded-2xl" }, i))
			}) : replies.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(EmptyState, {
				tone: "error",
				icon: WifiOff,
				title: "Erro de conexão",
				children: ["Não foi possível carregar as respostas.", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => void replies.refetch(),
					className: "mt-2 block w-full font-medium text-primary hover:underline",
					children: "Tentar de novo"
				})]
			}) : rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(EmptyState, {
				icon: Zap,
				title: "Nenhuma resposta cadastrada",
				children: ["Crie respostas para os assuntos que se repetem: primeiro contato, serviços, Google Meet, propostas e outros.", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "mt-3 rounded-full",
					size: "sm",
					onClick: openNew,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-4 w-4" }), " Nova resposta"]
				})]
			}) : visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: SearchX,
				title: "Sem resultados",
				children: "Nenhuma resposta corresponde à busca."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-6",
				children: QUICK_REPLY_CATEGORIES.map((cat) => {
					const items = visible.filter((r) => r.category === cat);
					if (items.length === 0) return null;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
						children: QUICK_REPLY_LABEL[cat]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "grid gap-2 lg:grid-cols-2",
						children: items.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex flex-col gap-2 rounded-2xl bg-secondary p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold",
									children: r.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex shrink-0 gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "icon",
										variant: "ghost",
										className: "h-8 w-8 rounded-full",
										"aria-label": `Editar ${r.title}`,
										onClick: () => {
											setEditing(r);
											setDialogOpen(true);
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "icon",
										variant: "ghost",
										className: "h-8 w-8 rounded-full text-destructive",
										"aria-label": `Excluir ${r.title}`,
										onClick: () => setRemoving(r),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground",
								children: r.body
							})]
						}, r.id))
					})] }, cat);
				})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickReplyDialog, {
			open: dialogOpen,
			onOpenChange: setDialogOpen,
			reply: editing
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
			open: !!removing,
			onOpenChange: (open) => !open && setRemoving(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, {
				className: "inbox-theme rounded-[2rem]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogTitle, { children: [
					"Excluir \"",
					removing?.title,
					"\"?"
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "A resposta sai da biblioteca. Mensagens já enviadas com ela não mudam." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, {
					className: "rounded-full",
					children: "Cancelar"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					className: "rounded-full",
					onClick: () => void remove(),
					children: "Excluir"
				})] })]
			})
		})
	] });
}
//#endregion
export { QuickRepliesPage as component };
