import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Button } from "./button-CeGigu7E.mjs";
import { A as Clock, h as Plus, o as Trash2, r as WifiOff, y as MessageSquare } from "../_libs/lucide-react.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-C2Ow_kti.mjs";
import { n as Label, t as Input } from "./label-BKrfOzqD.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { f as useFallbackInterval, l as fetchPipelineStages, o as UserAvatar, u as fetchTeam } from "./profile-context-xvvqmyQ6.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { D as setOpportunityOwner, b as openConversationFor, c as ensureOpportunity, f as fetchOpportunities, h as formatPhone, n as PageHeader, s as deleteOpportunity, t as InboxUserError, u as fetchContacts, y as moveOpportunity } from "./PageHeader-tdFIi3k3.mjs";
import { t as CATEGORY_LABEL } from "./types-QwviL-wI.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, o as Skeleton, r as SelectItem, t as Select } from "./skeleton-BS5SZ5Yi.mjs";
import { t as EmptyState } from "./EmptyState-V_MCyutM.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-CS1PmlF4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/funil-BSHW76ap.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Coloca um contato existente no funil. Cada contato tem no máximo uma oportunidade. */
function AddToFunnelDialog({ open, onOpenChange, stages }) {
	const queryClient = useQueryClient();
	const contacts = useQuery({
		queryKey: ["inbox", "contacts"],
		queryFn: fetchContacts,
		enabled: open
	});
	const [query, setQuery] = (0, import_react.useState)("");
	const [contactId, setContactId] = (0, import_react.useState)(null);
	const [stageId, setStageId] = (0, import_react.useState)(stages[0]?.id ?? "");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const inFunnel = new Set((queryClient.getQueryData(["inbox", "opportunities"]) ?? []).map((o) => o.contact_id));
	const q = query.trim().toLowerCase();
	const available = (contacts.data ?? []).filter((c) => !inFunnel.has(c.id)).filter((c) => !q || [
		c.name,
		c.company,
		c.phone
	].filter(Boolean).join(" ").toLowerCase().includes(q)).slice(0, 50);
	const submit = async () => {
		if (!contactId || !stageId || busy) return;
		setBusy(true);
		try {
			const contact = contacts.data?.find((c) => c.id === contactId);
			await ensureOpportunity(contactId, stageId, contact?.name ?? null);
			await queryClient.invalidateQueries({ queryKey: ["inbox", "opportunities"] });
			toast.success("Contato adicionado ao funil.");
			setContactId(null);
			setQuery("");
			onOpenChange(false);
		} catch {
			toast.error("Não foi possível adicionar ao funil. Tente de novo.");
		} finally {
			setBusy(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "inbox-theme rounded-[2rem] sm:max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "font-display",
					children: "Adicionar ao funil"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Escolha um contato que ainda não está no funil e a etapa inicial." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "funnel-contact-search",
								children: "Contato"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "funnel-contact-search",
								placeholder: "Buscar por nome, empresa ou telefone",
								value: query,
								onChange: (e) => setQuery(e.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "max-h-48 overflow-y-auto rounded-2xl border border-border",
								children: [
									contacts.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
										className: "px-3 py-2 text-sm text-muted-foreground",
										children: "Carregando…"
									}),
									!contacts.isPending && available.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
										className: "px-3 py-2 text-sm text-muted-foreground",
										children: (contacts.data ?? []).length === 0 ? "Ainda não há contatos." : "Todos os contatos encontrados já estão no funil."
									}),
									available.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => setContactId(c.id),
										"aria-pressed": contactId === c.id,
										className: `flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-secondary ${contactId === c.id ? "bg-accent" : ""}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium",
											children: c.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-muted-foreground",
											children: [c.company, formatPhone(c.phone)].filter(Boolean).join(" · ")
										})]
									}) }, c.id))
								]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Etapa" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: stageId,
							onValueChange: setStageId,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								"aria-label": "Etapa inicial",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
								className: "inbox-theme",
								children: stages.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: s.id,
									children: s.name
								}, s.id))
							})]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "gap-2 sm:gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						className: "rounded-full",
						onClick: () => onOpenChange(false),
						children: "Cancelar"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "rounded-full",
						disabled: !contactId || busy,
						onClick: () => void submit(),
						children: busy ? "Adicionando…" : "Adicionar"
					})]
				})
			]
		})
	});
}
/** Cartões de uma etapa, na ordem exibida. */
function cardsOfStage(cards, stageId) {
	return cards.filter((c) => c.stage_id === stageId).sort((a, b) => a.position - b.position);
}
/**
* Posição para soltar um cartão no índice `index` de uma etapa, entre os vizinhos (sem renumerar a coluna inteira).
* `column` é a coluna SEM o cartão que está sendo movido.
*/
function dropPosition(column, index) {
	const sorted = [...column].sort((a, b) => a.position - b.position);
	const i = Math.max(0, Math.min(index, sorted.length));
	const before = sorted[i - 1]?.position;
	const after = sorted[i]?.position;
	if (before === void 0 && after === void 0) return 1;
	if (before === void 0) return after - 1;
	if (after === void 0) return before + 1;
	return (before + after) / 2;
}
/** Número de dias desde a última interação (para destacar oportunidades paradas). */
function daysSince(iso, now = Date.now()) {
	if (!iso) return null;
	const t = Date.parse(iso);
	return Number.isNaN(t) ? null : Math.floor((now - t) / 864e5);
}
var NONE = "none";
/** Detalhes do cartão: mover de etapa (também no celular, onde arrastar não funciona), responsável, abrir conversa, remover. */
function OpportunityDialog({ card, stages, team, onClose, onOpenConversation }) {
	const queryClient = useQueryClient();
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [confirmRemove, setConfirmRemove] = (0, import_react.useState)(false);
	const run = async (action, ok) => {
		if (busy) return;
		setBusy(true);
		try {
			await action();
			if (ok) toast.success(ok);
		} catch (e) {
			toast.error(e instanceof InboxUserError ? e.message : "Não foi possível salvar. Tente de novo.");
		} finally {
			await queryClient.invalidateQueries({ queryKey: ["inbox", "opportunities"] });
			setBusy(false);
		}
	};
	if (!card) return null;
	const all = (queryClient.getQueryData(["inbox", "opportunities"]) ?? []).filter((c) => c.id !== card.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: true,
		onOpenChange: (open) => !open && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "inbox-theme rounded-[2rem] sm:max-w-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
				className: "font-display",
				children: card.contact.name
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: [
				card.contact.company,
				formatPhone(card.contact.phone),
				CATEGORY_LABEL[card.contact.category]
			].filter(Boolean).join(" · ") })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Etapa comercial" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: card.stage_id,
							disabled: busy,
							onValueChange: (stageId) => {
								if (stageId === card.stage_id) return;
								const pos = cardsOfStage(all, stageId).slice(-1)[0]?.position ?? 0;
								run(() => moveOpportunity(card.id, stageId, pos + 1), "Etapa atualizada.").then(onClose);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								"aria-label": "Etapa comercial",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
								className: "inbox-theme",
								children: stages.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: s.id,
									children: s.name
								}, s.id))
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Responsável" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: card.assigned_to ?? NONE,
							disabled: busy,
							onValueChange: (v) => void run(() => setOpportunityOwner(card.id, v === NONE ? null : v), "Responsável atualizado.").then(onClose),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								"aria-label": "Responsável do cartão",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, {
								className: "inbox-theme",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: NONE,
									children: "Sem responsável"
								}), team.filter((p) => p.active).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: p.id,
									children: p.full_name
								}, p.id))]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex flex-wrap justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "rounded-full",
							disabled: busy,
							onClick: () => void run(async () => {
								const id = await openConversationFor(card.contact_id, card.assigned_to);
								onClose();
								onOpenConversation(id);
							}),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "mr-1.5 h-4 w-4" }), " Abrir conversa"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							className: "rounded-full text-destructive",
							disabled: busy,
							onClick: () => setConfirmRemove(true),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-1.5 h-4 w-4" }), " Remover do funil"]
						})]
					})
				]
			})]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
		open: confirmRemove,
		onOpenChange: setConfirmRemove,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, {
			className: "inbox-theme rounded-[2rem]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogTitle, { children: [
				"Remover ",
				card.contact.name,
				" do funil?"
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "O contato e a conversa continuam. Só a oportunidade comercial sai do funil." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, {
				className: "rounded-full",
				children: "Cancelar"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
				className: "rounded-full",
				onClick: () => void run(() => deleteOpportunity(card.id), "Removido do funil.").then(() => {
					setConfirmRemove(false);
					onClose();
				}),
				children: "Remover"
			})] })]
		})
	})] });
}
var KEY = ["inbox", "opportunities"];
function lastInteractionLabel(iso) {
	const d = daysSince(iso);
	if (d === null) return "Sem interação";
	if (d === 0) return "Hoje";
	return d === 1 ? "Há 1 dia" : `Há ${d} dias`;
}
function FunnelBoard({ search }) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const interval = useFallbackInterval();
	const stages = useQuery({
		queryKey: ["inbox", "stages"],
		queryFn: fetchPipelineStages
	});
	const opps = useQuery({
		queryKey: KEY,
		queryFn: fetchOpportunities,
		refetchInterval: interval
	});
	const team = useQuery({
		queryKey: ["inbox", "team"],
		queryFn: fetchTeam
	});
	const dragId = (0, import_react.useRef)(null);
	const [overStage, setOverStage] = (0, import_react.useState)(null);
	const [selected, setSelected] = (0, import_react.useState)(null);
	const q = search.trim().toLowerCase();
	const cards = (0, import_react.useMemo)(() => {
		const all = opps.data ?? [];
		if (!q) return all;
		return all.filter((c) => [
			c.contact.name,
			c.contact.company,
			c.title
		].filter(Boolean).join(" ").toLowerCase().includes(q));
	}, [opps.data, q]);
	const owner = (id) => team.data?.find((p) => p.id === id);
	/** Solta o cartão numa etapa, antes do cartão `beforeId` (ou no fim). Atualiza a tela na hora e confirma no banco. */
	const drop = async (stageId, beforeId) => {
		const id = dragId.current;
		dragId.current = null;
		setOverStage(null);
		if (!id) return;
		const all = opps.data ?? [];
		const moving = all.find((c) => c.id === id);
		if (!moving) return;
		const column = cardsOfStage(all.filter((c) => c.id !== id), stageId);
		const position = dropPosition(column, beforeId ? Math.max(0, column.findIndex((c) => c.id === beforeId)) : column.length);
		if (moving.stage_id === stageId && moving.position === position) return;
		queryClient.setQueryData(KEY, (old) => (old ?? []).map((c) => c.id === id ? {
			...c,
			stage_id: stageId,
			position
		} : c));
		try {
			await moveOpportunity(id, stageId, position);
		} catch (e) {
			toast.error(e instanceof InboxUserError ? e.message : "Não foi possível mover o cartão. Voltei ao estado anterior.");
		} finally {
			queryClient.invalidateQueries({ queryKey: KEY });
		}
	};
	if (stages.isError || opps.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(EmptyState, {
		tone: "error",
		icon: WifiOff,
		title: "Erro de conexão",
		children: ["Não foi possível carregar o funil.", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			onClick: () => {
				stages.refetch();
				opps.refetch();
			},
			className: "mt-2 block w-full font-medium text-primary hover:underline",
			children: "Tentar de novo"
		})]
	});
	if (stages.isPending || opps.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-full min-w-max gap-3",
		children: [
			0,
			1,
			2,
			3,
			4,
			5,
			6
		].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-full w-60 rounded-3xl" }, i))
	});
	const stageList = stages.data;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-full min-w-max gap-3",
		role: "list",
		"aria-label": "Etapas do funil",
		children: stageList.map((stage) => {
			const column = cardsOfStage(cards, stage.id);
			const active = overStage === stage.id;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				role: "listitem",
				"aria-label": `${stage.name}, ${column.length} oportunidades`,
				onDragOver: (e) => {
					if (!dragId.current) return;
					e.preventDefault();
					if (overStage !== stage.id) setOverStage(stage.id);
				},
				onDragLeave: (e) => {
					if (!e.currentTarget.contains(e.relatedTarget)) setOverStage((s) => s === stage.id ? null : s);
				},
				onDrop: (e) => {
					e.preventDefault();
					drop(stage.id, null);
				},
				className: cn("flex h-full w-60 shrink-0 flex-col rounded-3xl bg-secondary p-3 transition-colors", active && "bg-accent ring-2 ring-primary/40"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "px-1 pb-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-center gap-2 text-sm font-semibold",
						children: [stage.name, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground",
							children: column.length
						})]
					}), (stage.is_won || stage.is_lost) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-muted-foreground",
						children: stage.is_won ? "Negócios fechados" : "Negócios perdidos"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto",
					children: [column.map((card) => {
						const o = owner(card.assigned_to);
						const idle = daysSince(card.last_interaction_at);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							draggable: true,
							onDragStart: (e) => {
								dragId.current = card.id;
								e.dataTransfer.effectAllowed = "move";
								e.dataTransfer.setData("text/plain", card.id);
							},
							onDragEnd: () => {
								dragId.current = null;
								setOverStage(null);
							},
							onDragOver: (e) => {
								if (dragId.current && dragId.current !== card.id) e.preventDefault();
							},
							onDrop: (e) => {
								e.preventDefault();
								e.stopPropagation();
								drop(stage.id, card.id);
							},
							onClick: () => setSelected(card),
							className: "w-full cursor-grab rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition hover:shadow-md active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-sm font-semibold",
									children: card.contact.name
								}),
								card.contact.company && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-xs text-muted-foreground",
									children: card.contact.company
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "mt-2 flex items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: cn("flex items-center gap-1 text-[11px]", idle !== null && idle >= 7 ? "text-destructive" : "text-muted-foreground"),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-3 w-3" }), lastInteractionLabel(card.last_interaction_at)]
									}), o ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserAvatar, {
										name: o.full_name,
										src: o.avatar_url,
										className: "h-6 w-6 text-[10px]"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] text-muted-foreground",
										children: "Sem responsável"
									})]
								})
							]
						}) }, card.id);
					}), column.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border py-6 text-xs text-muted-foreground",
						children: q ? "Nada aqui" : "Arraste um cartão para cá"
					})]
				})]
			}, stage.id);
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpportunityDialog, {
		card: selected,
		stages: stageList,
		team: team.data ?? [],
		onClose: () => setSelected(null),
		onOpenConversation: (conversationId) => void navigate({
			to: "/inbox",
			search: { c: conversationId }
		})
	})] });
}
function PipelinePage() {
	const stages = useQuery({
		queryKey: ["inbox", "stages"],
		queryFn: fetchPipelineStages
	});
	const [search, setSearch] = (0, import_react.useState)("");
	const [adding, setAdding] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Funil comercial",
			subtitle: "Do primeiro contato ao fechamento. Arraste os cartões entre as etapas.",
			search: {
				value: search,
				onChange: setSearch,
				placeholder: "Buscar no funil"
			},
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				className: "rounded-full",
				disabled: !stages.data,
				onClick: () => setAdding(true),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-4 w-4" }), " Adicionar ao funil"]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "inbox-surface min-h-0 flex-1 overflow-x-auto rounded-[2rem] p-4 sm:p-5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FunnelBoard, { search })
		}),
		stages.data && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddToFunnelDialog, {
			open: adding,
			onOpenChange: setAdding,
			stages: stages.data
		})
	] });
}
//#endregion
export { PipelinePage as component };
