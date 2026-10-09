import { r as __toESM } from "./_runtime.mjs";
import { u as require_react } from "./_libs/@floating-ui/react-dom+[...].mjs";
import { N as require_jsx_runtime } from "./_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./_ssr/button-CeGigu7E.mjs";
import { F as ChevronRight, I as ChevronLeft, h as Plus } from "./_libs/lucide-react.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, t as Dialog } from "./_ssr/dialog-C2Ow_kti.mjs";
import { n as Label, t as Input } from "./_ssr/label-BKrfOzqD.mjs";
import { n as useQuery } from "./_libs/tanstack__react-query.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { t as supabase } from "./_ssr/client-Bxc8_G9k.mjs";
import { a as FUNNEL_STAGES, c as WEEKDAYS, d as fetchContents, f as iso, i as FUNNEL_LABEL, l as contrastText, m as todaySaoPaulo, n as FORMATS, o as MONTHS, p as monthGrid, r as FUNNEL_CLASSES, s as STATUSES, t as CONTENT_COLORS, u as fetchClients } from "./_ssr/planner-BpHitoEP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_authenticated-DYCmDS2q.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var selectClass = "h-10 w-full rounded-xl border border-input bg-card/45 px-3 text-sm shadow-sm backdrop-blur-md outline-none focus-visible:ring-2 focus-visible:ring-ring";
function ContentDialog({ open, onOpenChange, clients, content, defaultDate, defaultClientId, onSaved }) {
	const [draft, setDraft] = (0, import_react.useState)({
		client_id: "",
		title: "",
		publication_date: defaultDate,
		funnel_stage: "topo",
		format: FORMATS[0],
		status: STATUSES[0],
		color: CONTENT_COLORS[0]
	});
	const [saving, setSaving] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		if (content) {
			const client = clients.find((c) => c.id === content.client_id);
			setDraft({
				client_id: content.client_id,
				title: content.title,
				publication_date: content.publication_date,
				funnel_stage: content.funnel_stage,
				format: content.format,
				status: content.status,
				color: content.color ?? client?.color ?? CONTENT_COLORS[0]
			});
		} else {
			const clientId = defaultClientId ?? clients[0]?.id ?? "";
			const client = clients.find((c) => c.id === clientId);
			setDraft({
				client_id: clientId,
				title: "",
				publication_date: defaultDate,
				funnel_stage: "topo",
				format: FORMATS[0],
				status: STATUSES[0],
				color: client?.color ?? CONTENT_COLORS[0]
			});
		}
	}, [
		open,
		content,
		defaultDate,
		defaultClientId,
		clients
	]);
	const save = async () => {
		if (!draft.client_id || !draft.title.trim() || !draft.publication_date) {
			toast.error("Preencha cliente, título e data.");
			return;
		}
		setSaving(true);
		const payload = {
			...draft,
			title: draft.title.trim()
		};
		const { error } = content ? await supabase.from("contents").update(payload).eq("id", content.id) : await supabase.from("contents").insert(payload);
		setSaving(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success(content ? "Conteúdo atualizado" : "Conteúdo criado");
		onSaved();
		onOpenChange(false);
	};
	const remove = async () => {
		if (!content) return;
		setSaving(true);
		const { error } = await supabase.from("contents").delete().eq("id", content.id);
		setSaving(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success("Conteúdo excluído");
		onSaved();
		onOpenChange(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: content ? "Editar conteúdo" : "Novo conteúdo" }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "content-client",
								children: "Cliente *"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								id: "content-client",
								className: selectClass,
								value: draft.client_id,
								onChange: (e) => {
									const client = clients.find((c) => c.id === e.target.value);
									setDraft({
										...draft,
										client_id: e.target.value,
										...client && !content ? { color: client.color } : {}
									});
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Selecione"
								}), clients.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: c.id,
									children: c.name
								}, c.id))]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "content-title",
								children: "Título *"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "content-title",
								value: draft.title,
								onChange: (e) => setDraft({
									...draft,
									title: e.target.value
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "content-date",
									children: "Data *"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "content-date",
									type: "date",
									value: draft.publication_date,
									onChange: (e) => setDraft({
										...draft,
										publication_date: e.target.value
									})
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "content-funnel",
									children: "Funil *"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									id: "content-funnel",
									className: selectClass,
									value: draft.funnel_stage,
									onChange: (e) => setDraft({
										...draft,
										funnel_stage: e.target.value
									}),
									children: FUNNEL_STAGES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: s,
										children: FUNNEL_LABEL[s]
									}, s))
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "content-format",
									children: "Formato *"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									id: "content-format",
									className: selectClass,
									value: draft.format,
									onChange: (e) => setDraft({
										...draft,
										format: e.target.value
									}),
									children: FORMATS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: f,
										children: f
									}, f))
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "content-status",
									children: "Status"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									id: "content-status",
									className: selectClass,
									value: draft.status,
									onChange: (e) => setDraft({
										...draft,
										status: e.target.value
									}),
									children: STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: s,
										children: s
									}, s))
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Cor no calendário" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [CONTENT_COLORS.map((color) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": `Cor ${color}`,
									"aria-pressed": draft.color.toLowerCase() === color,
									onClick: () => setDraft({
										...draft,
										color
									}),
									style: { backgroundColor: color },
									className: `h-7 w-7 rounded-full border transition-transform ${draft.color.toLowerCase() === color ? "scale-110 border-foreground ring-2 ring-ring ring-offset-2 ring-offset-background" : "border-border"}`
								}, color)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "color",
									"aria-label": "Outra cor",
									value: draft.color,
									onChange: (e) => setDraft({
										...draft,
										color: e.target.value
									}),
									className: "h-7 w-9 cursor-pointer rounded border border-input bg-background p-0.5"
								})]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "gap-2 sm:justify-between",
					children: [content ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: remove,
						disabled: saving,
						children: "Excluir"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							onClick: () => onOpenChange(false),
							disabled: saving,
							children: "Cancelar"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: save,
							disabled: saving,
							children: "Salvar"
						})]
					})]
				})
			]
		})
	});
}
function FunnelSummary({ title, subtitle, contents }) {
	const total = contents.length;
	const counts = FUNNEL_STAGES.map((stage) => ({
		stage,
		count: contents.filter((c) => c.funnel_stage === stage).length
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "glass-soft rounded-[1.75rem] p-5 sm:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-baseline justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-base font-bold text-primary",
					children: "Resumo do funil"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs font-medium text-muted-foreground",
					children: [
						title,
						" · ",
						subtitle
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-sm text-muted-foreground",
					children: [
						total,
						" ",
						total === 1 ? "conteúdo" : "conteúdos"
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 flex h-2 w-full overflow-hidden rounded-full bg-muted",
				children: counts.map(({ stage, count }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: FUNNEL_CLASSES[stage].bar,
					style: { width: total ? `${count / total * 100}%` : "0%" }
				}, stage))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid grid-cols-3 gap-2 sm:gap-4",
				children: counts.map(({ stage, count }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl bg-card/50 p-3 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-2 w-2 rounded-full ${FUNNEL_CLASSES[stage].dot}` }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-2 block text-[10px] font-semibold uppercase text-muted-foreground",
							children: FUNNEL_LABEL[stage]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display block text-2xl font-bold text-primary",
							children: count
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "block text-[10px] text-muted-foreground",
							children: [total ? Math.round(count / total * 100) : 0, "%"]
						})
					]
				}, stage))
			})
		]
	});
}
function CalendarPage() {
	const today = todaySaoPaulo();
	const [year, setYear] = (0, import_react.useState)(today.year);
	const [month, setMonth] = (0, import_react.useState)(today.month);
	const [clientFilter, setClientFilter] = (0, import_react.useState)("all");
	const [dialogOpen, setDialogOpen] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [defaultDate, setDefaultDate] = (0, import_react.useState)(iso(today.year, today.month, today.day));
	const clients = useQuery({
		queryKey: ["clients"],
		queryFn: fetchClients
	}).data ?? [];
	const currentClient = clients.find((c) => c.id === clientFilter);
	const monthStart = iso(year, month, 1);
	const monthEnd = iso(year, month, new Date(Date.UTC(year, month + 1, 0)).getUTCDate());
	const contentsQuery = useQuery({
		queryKey: ["contents", monthStart],
		queryFn: () => fetchContents(monthStart, monthEnd)
	});
	const visible = (0, import_react.useMemo)(() => {
		const all = contentsQuery.data ?? [];
		return clientFilter === "all" ? all : all.filter((c) => c.client_id === clientFilter);
	}, [contentsQuery.data, clientFilter]);
	const byDay = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const c of visible) {
			const list = map.get(c.publication_date) ?? [];
			list.push(c);
			map.set(c.publication_date, list);
		}
		return map;
	}, [visible]);
	const clientName = (id) => clients.find((c) => c.id === id)?.name ?? "—";
	const clientColor = (id) => clients.find((c) => c.id === id)?.color ?? "#0805f1";
	(0, import_react.useEffect)(() => {
		if (clientFilter === "all" && clients[0]) setClientFilter(clients[0].id);
	}, [clients.length]);
	const shift = (delta) => {
		const d = new Date(Date.UTC(year, month + delta, 1));
		setYear(d.getUTCFullYear());
		setMonth(d.getUTCMonth());
	};
	const openNew = (date) => {
		setEditing(null);
		setDefaultDate(date);
		setDialogOpen(true);
	};
	const openEdit = (content) => {
		setEditing(content);
		setDialogOpen(true);
	};
	const refresh = () => contentsQuery.refetch();
	const cells = monthGrid(year, month);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mr-auto",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold uppercase text-primary/65",
							children: "Centro de planejamento"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display mt-1 text-2xl font-bold text-primary sm:text-3xl",
							children: currentClient ? `Calendário de ${currentClient.name}` : "Calendário editorial"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "glass-soft flex items-center gap-1 rounded-2xl px-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								onClick: () => shift(-1),
								"aria-label": "Mês anterior",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-4 w-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-36 text-center text-sm font-medium uppercase tracking-wide",
								children: [
									MONTHS[month],
									" ",
									year
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								onClick: () => shift(1),
								"aria-label": "Próximo mês",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4" })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: () => openNew(iso(year, month, 1)),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), " Novo conteúdo"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [clients.map((c) => {
					const active = clientFilter === c.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						variant: active ? "default" : "outline",
						size: "sm",
						onClick: () => setClientFilter(c.id),
						className: "rounded-xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "h-2.5 w-2.5 rounded-full",
							style: { backgroundColor: active ? "currentColor" : c.color }
						}), c.name]
					}, c.id);
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: clientFilter === "all" ? "default" : "outline",
					size: "sm",
					onClick: () => setClientFilter("all"),
					className: "rounded-xl",
					children: "Todos os clientes"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FunnelSummary, {
				title: clientFilter === "all" ? "Todos os clientes" : clientName(clientFilter),
				subtitle: `${MONTHS[month]?.toUpperCase()} ${year}`,
				contents: visible
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap items-center gap-4 text-xs text-muted-foreground",
				children: FUNNEL_STAGES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-2 w-2 rounded-full ${FUNNEL_CLASSES[s].dot}` }), FUNNEL_LABEL[s]]
				}, s))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "glass-soft hidden overflow-hidden rounded-[1.75rem] md:block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-7 border-b border-border",
					children: WEEKDAYS.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-2 py-2 text-center text-[11px] font-medium tracking-wide text-muted-foreground",
						children: d
					}, d))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-7",
					children: cells.map((day, i) => {
						const date = day ? iso(year, month, day) : "";
						const items = day ? byDay.get(date) ?? [] : [];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "min-h-28 border-b border-r border-border/70 p-1.5 last:border-r-0",
							children: day && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "ghost",
								onClick: () => openNew(date),
								className: "mb-1 h-7 w-full justify-start px-2 text-[11px] text-muted-foreground",
								children: day
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-1",
								children: items.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContentBlock, {
									content: c,
									clientName: clientName(c.client_id),
									onClick: () => openEdit(c),
									fallbackColor: clientColor(c.client_id)
								}, c.id))
							})] })
						}, i);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3 md:hidden",
				children: [[...byDay.keys()].sort().length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Nenhum conteúdo neste mês."
				}), [...byDay.keys()].sort().map((date) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg border border-border bg-card p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mb-2 text-xs font-medium text-muted-foreground",
						children: [
							Number(date.slice(8, 10)),
							" de ",
							MONTHS[month]
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-1",
						children: (byDay.get(date) ?? []).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContentBlock, {
							content: c,
							clientName: clientName(c.client_id),
							onClick: () => openEdit(c),
							fallbackColor: clientColor(c.client_id)
						}, c.id))
					})]
				}, date))]
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContentDialog, {
		open: dialogOpen,
		onOpenChange: setDialogOpen,
		clients,
		content: editing,
		defaultDate,
		...clientFilter !== "all" ? { defaultClientId: clientFilter } : {},
		onSaved: refresh
	})] });
}
function ContentBlock({ content, clientName, fallbackColor, onClick }) {
	const color = content.color ?? fallbackColor;
	const textColor = contrastText(color);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		type: "button",
		variant: "ghost",
		onClick,
		style: {
			backgroundColor: color,
			color: textColor
		},
		className: "glass-lift h-auto w-full justify-start rounded-xl px-2 py-1.5 text-left shadow-sm hover:brightness-105 hover:opacity-95",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block truncate text-[10px] font-semibold uppercase tracking-wide",
				style: {
					color: textColor,
					opacity: .85
				},
				children: clientName
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block truncate text-[11px] font-semibold",
				style: { color: textColor },
				children: content.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block truncate text-[10px] uppercase",
				style: {
					color: textColor,
					opacity: .85
				},
				children: content.format
			})
		]
	});
}
//#endregion
export { CalendarPage as component };
