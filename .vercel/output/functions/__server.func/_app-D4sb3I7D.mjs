import { r as __toESM } from "./_runtime.mjs";
import { u as require_react } from "./_libs/@floating-ui/react-dom+[...].mjs";
import { g as useNavigate } from "./_libs/@tanstack/react-router+[...].mjs";
import { N as require_jsx_runtime, d as DialogContent, f as DialogDescription, h as DialogTitle, l as Dialog, m as DialogPortal, p as DialogOverlay, u as DialogClose } from "./_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as formatTimeLeft, r as windowState, t as Route } from "./_app-DVl6sJSE.mjs";
import { t as cva } from "./_libs/class-variance-authority+clsx.mjs";
import { t as cn } from "./_ssr/utils-C_uf36nf.mjs";
import { t as Button } from "./_ssr/button-CeGigu7E.mjs";
import { A as Clock, D as CornerUpLeft, M as CircleCheck, N as CircleAlert, O as Copy, R as Check, S as LoaderCircle, T as FileText, U as Asterisk, W as ArrowLeft, _ as PanelRight, f as SearchX, g as Pencil, h as Plus, i as Video, m as RotateCcw, n as X, o as Trash2, p as RotateCw, r as WifiOff, s as Sparkles, t as Zap, u as Send, v as Mic, w as Inbox, y as MessageSquare, z as CheckCheck } from "./_libs/lucide-react.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent$1, o as DialogTitle$1, r as DialogDescription$1, t as Dialog$1 } from "./_ssr/dialog-C2Ow_kti.mjs";
import { n as Label, t as Input } from "./_ssr/label-BKrfOzqD.mjs";
import { t as db } from "./_ssr/client-Ba0sJm8H.mjs";
import { i as useQueryClient, n as useQuery } from "./_libs/tanstack__react-query.mjs";
import { f as useFallbackInterval, l as fetchPipelineStages, o as UserAvatar, p as useInboxProfile, s as fetchConversations, u as fetchTeam } from "./_ssr/profile-context-xvvqmyQ6.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { C as reminderBucket, E as setContactStage, O as setReminderStatus, S as queueAndSendTemplate, _ as isoToLocalInput, a as PopoverTrigger, b as openConversationFor, d as fetchMediaUrl, g as inboxApi, h as formatPhone, i as PopoverContent, k as useChannelStatus, l as fetchContactStage, m as formatDue, n as PageHeader, o as createReminder, p as fetchPendingReminders, r as Popover, t as InboxUserError, u as fetchContacts, v as localInputToIso, w as retrySend, x as queueAndSend } from "./_ssr/PageHeader-tdFIi3k3.mjs";
import { t as Textarea } from "./_ssr/textarea-kko37XEX.mjs";
import { r as STATUS_LABEL, t as CATEGORY_LABEL } from "./_ssr/types-QwviL-wI.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, o as Skeleton, r as SelectItem, t as Select } from "./_ssr/skeleton-BS5SZ5Yi.mjs";
import { t as ContactDialog } from "./_ssr/ContactDialog-C9oZUBtD.mjs";
import { t as EmptyState } from "./_ssr/EmptyState-V_MCyutM.mjs";
import { a as renderQuickReply, i as fetchQuickReplies, n as QUICK_REPLY_LABEL, t as QUICK_REPLY_CATEGORIES } from "./_ssr/templates-BjyxYjwj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_app-D4sb3I7D.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Insere uma resposta rápida no campo de mensagem. O texto continua editável e NADA é enviado. */
function QuickReplyPicker({ contactName, onPick, disabled }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [q, setQ] = (0, import_react.useState)("");
	const replies = useQuery({
		queryKey: ["inbox", "quick-replies"],
		queryFn: fetchQuickReplies,
		enabled: open
	});
	const query = q.trim().toLowerCase();
	const rows = (replies.data ?? []).filter((r) => !query || `${r.title} ${r.body}`.toLowerCase().includes(query));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "ghost",
				size: "icon",
				className: "h-[52px] w-[52px] shrink-0 rounded-full",
				"aria-label": "Respostas rápidas",
				disabled,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "h-5 w-5" })
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PopoverContent, {
			side: "top",
			align: "start",
			className: "inbox-theme w-[min(92vw,24rem)] rounded-3xl p-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				placeholder: "Buscar resposta",
				value: q,
				onChange: (e) => setQ(e.target.value),
				"aria-label": "Buscar resposta rápida",
				className: "mb-2",
				autoFocus: true
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-h-72 space-y-3 overflow-y-auto",
				children: [
					replies.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-2 text-sm text-muted-foreground",
						children: "Carregando…"
					}),
					replies.isError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-2 text-sm text-destructive",
						children: "Não foi possível carregar as respostas."
					}),
					replies.data && replies.data.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-2 text-sm text-muted-foreground",
						children: "Nenhuma resposta cadastrada. Crie na tela Respostas rápidas."
					}),
					replies.data && replies.data.length > 0 && rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-2 text-sm text-muted-foreground",
						children: "Sem resultados."
					}),
					QUICK_REPLY_CATEGORIES.map((cat) => {
						const items = rows.filter((r) => r.category === cat);
						if (items.length === 0) return null;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
							children: QUICK_REPLY_LABEL[cat]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: items.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "w-full rounded-2xl px-3 py-2 text-left hover:bg-secondary",
							onClick: () => {
								onPick(renderQuickReply(r.body, contactName));
								setOpen(false);
								setQ("");
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-sm font-medium",
								children: r.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "line-clamp-2 text-xs text-muted-foreground",
								children: r.body
							})]
						}) }, r.id)) })] }, cat);
					})
				]
			})]
		})]
	});
}
/**
* Fora da janela de 24h a Meta só permite MODELOS (templates) previamente aprovados.
* Este formulário envia um modelo que já existe e está aprovado no Gerenciador do WhatsApp.
*/
function TemplateDialog({ open, onOpenChange, conversationId }) {
	const profile = useInboxProfile();
	const queryClient = useQueryClient();
	const [name, setName] = (0, import_react.useState)("");
	const [language, setLanguage] = (0, import_react.useState)("pt_BR");
	const [vars, setVars] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const submit = async () => {
		if (busy) return;
		setBusy(true);
		setError(null);
		const variables = vars.split("|").map((v) => v.trim()).filter(Boolean);
		const { messageId, result } = await queueAndSendTemplate({
			conversationId,
			name,
			language,
			variables,
			userId: profile.id
		});
		setBusy(false);
		if (messageId) {
			await queryClient.invalidateQueries({ queryKey: [
				"inbox",
				"messages",
				conversationId
			] });
			await queryClient.invalidateQueries({ queryKey: ["inbox", "conversations"] });
		}
		if (!result.ok) return setError(result.error);
		toast.success("Modelo enviado à Meta. O status aparece na conversa.");
		setName("");
		setVars("");
		onOpenChange(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog$1, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
			className: "inbox-theme rounded-[2rem] sm:max-w-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
				className: "font-display",
				children: "Enviar modelo aprovado"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, { children: "A janela de 24 horas acabou. A Meta só permite enviar modelos aprovados antes. Informe o nome exato de um modelo aprovado no Gerenciador do WhatsApp." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "grid gap-3",
				onSubmit: (e) => {
					e.preventDefault();
					submit();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "tpl-name",
							children: "Nome do modelo"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "tpl-name",
							placeholder: "ex.: retorno_contato",
							value: name,
							onChange: (e) => setName(e.target.value),
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "tpl-lang",
							children: "Idioma"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "tpl-lang",
							value: language,
							onChange: (e) => setLanguage(e.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "tpl-vars",
							children: "Variáveis do corpo (separe por |), se houver"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "tpl-vars",
							placeholder: "ex.: Maria | segunda às 15h",
							value: vars,
							onChange: (e) => setVars(e.target.value)
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
							children: busy ? "Enviando…" : "Enviar modelo"
						})]
					})
				]
			})]
		})
	});
}
/**
* Campo de mensagem. Regras:
*  - nada é enviado sem clique (ou Enter) de uma pessoa; respostas rápidas e IA só PREENCHEM o campo;
*  - a mensagem só aparece como enviada depois que o banco confirma (o backend atualiza o status);
*  - fora da janela de 24h da Meta só modelos aprovados; sem WhatsApp configurado, não envia.
*/
function Composer({ conversation, draft, onDraftChange, replyTo, onClearReply }) {
	const profile = useInboxProfile();
	const queryClient = useQueryClient();
	const channel = useChannelStatus();
	const [sending, setSending] = (0, import_react.useState)(false);
	const [templateOpen, setTemplateOpen] = (0, import_react.useState)(false);
	const area = (0, import_react.useRef)(null);
	const win = windowState(conversation.last_inbound_at);
	const configured = channel.data?.whatsapp.configured === true;
	const canType = win.open;
	const canSend = configured && win.open && draft.trim().length > 0 && !sending;
	const send = async () => {
		if (!canSend) return;
		setSending(true);
		const { messageId, result } = await queueAndSend({
			conversationId: conversation.id,
			body: draft,
			replyToId: replyTo?.id ?? null,
			userId: profile.id
		});
		setSending(false);
		if (messageId) {
			onDraftChange("");
			onClearReply();
			queryClient.invalidateQueries({ queryKey: [
				"inbox",
				"messages",
				conversation.id
			] });
			queryClient.invalidateQueries({ queryKey: ["inbox", "conversations"] });
		}
		if (!result.ok) toast.error(result.error);
		area.current?.focus();
	};
	let notice = null;
	if (channel.isPending) notice = {
		tone: "info",
		text: "Verificando a conexão com o WhatsApp…"
	};
	else if (channel.isError) notice = {
		tone: "warn",
		text: "Não foi possível verificar a conexão com o WhatsApp. Você pode escrever, mas o envio fica bloqueado até a verificação funcionar."
	};
	else if (!configured) notice = {
		tone: "warn",
		text: "WhatsApp não conectado. Você pode preparar a mensagem, mas ela não será enviada até a conexão ser configurada."
	};
	else if (!win.open) notice = {
		tone: "warn",
		text: "A janela de 24 horas desta conversa acabou. A Meta só permite enviar um modelo aprovado agora."
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "shrink-0 border-t border-border p-3 sm:p-4",
		children: [
			notice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: `mb-2 rounded-2xl px-3 py-2 text-xs ${notice.tone === "warn" ? "bg-highlight/70" : "bg-secondary text-muted-foreground"}`,
				role: "status",
				children: [notice.text, configured && !win.open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					size: "sm",
					className: "ml-2 h-7 rounded-full",
					onClick: () => setTemplateOpen(true),
					children: "Enviar modelo aprovado"
				})]
			}),
			configured && win.open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mb-2 px-1 text-[11px] text-muted-foreground",
				children: [
					"Janela de resposta aberta. Faltam ",
					formatTimeLeft(win.msLeft),
					"."
				]
			}),
			replyTo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 flex items-start gap-2 rounded-2xl bg-secondary px-3 py-2 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CornerUpLeft, { className: "mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "min-w-0 flex-1 truncate",
						children: ["Respondendo: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: replyTo.body ?? "mensagem"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onClearReply,
						"aria-label": "Cancelar resposta",
						className: "rounded-full p-0.5 hover:bg-card",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3.5 w-3.5" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickReplyPicker, {
						contactName: conversation.contact.name,
						disabled: !canType,
						onPick: (text) => {
							onDraftChange(draft.trim() ? `${draft.replace(/\s+$/, "")}\n${text}` : text);
							area.current?.focus();
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						ref: area,
						rows: 2,
						value: draft,
						disabled: !canType,
						onChange: (e) => onDraftChange(e.target.value),
						onKeyDown: (e) => {
							if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(min-width: 768px)").matches) {
								e.preventDefault();
								send();
							}
						},
						placeholder: canType ? "Escreva sua mensagem. Enter envia, Shift+Enter quebra a linha." : "Campo bloqueado: janela de 24 horas encerrada.",
						maxLength: 4096,
						className: "min-h-[52px] flex-1 resize-none rounded-3xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-70",
						"aria-label": "Mensagem"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						className: "h-[52px] w-[52px] rounded-full",
						size: "icon",
						"aria-label": "Enviar",
						disabled: !canSend,
						onClick: () => void send(),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-5 w-5" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TemplateDialog, {
				open: templateOpen,
				onOpenChange: setTemplateOpen,
				conversationId: conversation.id
			})
		]
	});
}
/**
* Mídia recebida. O arquivo fica em bucket privado e só abre por URL assinada de curta duração, pedida ao backend
* (que confere se quem pede é membro ativo). Imagens carregam sozinhas; áudio, vídeo e documento só ao clicar.
*/
function MediaView({ message }) {
	const auto = message.type === "image" || message.type === "sticker";
	const [wanted, setWanted] = (0, import_react.useState)(false);
	const media = useQuery({
		queryKey: [
			"inbox",
			"media",
			message.id
		],
		queryFn: async () => {
			const r = await fetchMediaUrl(message.id);
			if (!r.ok) throw new Error(r.error);
			return r;
		},
		enabled: auto || wanted,
		staleTime: 24e4,
		retry: false
	});
	if (media.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "text-xs opacity-80",
		children: [
			"Não foi possível carregar o arquivo.",
			" ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "underline",
				onClick: () => void media.refetch(),
				children: "Tentar de novo"
			})
		]
	});
	if (media.data) {
		const url = media.data.url;
		if (auto) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: url,
			alt: message.type === "sticker" ? "Figurinha" : "Imagem recebida",
			className: "max-h-72 rounded-2xl object-contain",
			loading: "lazy"
		});
		if (message.type === "audio") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
			controls: true,
			src: url,
			className: "w-full max-w-xs"
		});
		if (message.type === "video") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
			controls: true,
			src: url,
			className: "max-h-72 rounded-2xl"
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
			href: url,
			target: "_blank",
			rel: "noreferrer",
			className: "flex items-center gap-2 text-sm underline",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4" }), " Abrir documento"]
		});
	}
	if (auto) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-32 w-48 animate-pulse rounded-2xl bg-secondary",
		"aria-label": "Carregando imagem"
	});
	const Icon = message.type === "audio" ? Mic : message.type === "video" ? Video : FileText;
	const label = message.type === "audio" ? "Ouvir áudio" : message.type === "video" ? "Ver vídeo" : "Abrir documento";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		className: "flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground hover:bg-accent",
		onClick: () => setWanted(true),
		disabled: media.isFetching,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4" }),
			" ",
			media.isFetching ? "Carregando…" : label
		]
	});
}
var MEDIA_TYPES = /* @__PURE__ */ new Set([
	"image",
	"document",
	"audio",
	"video",
	"sticker"
]);
/** Pendente há mais que isso, sem confirmação do backend: oferece tentar de novo. */
var STUCK_AFTER_MS = 2e4;
function dayLabel(iso) {
	const d = new Date(iso);
	const today = /* @__PURE__ */ new Date();
	const yesterday = /* @__PURE__ */ new Date();
	yesterday.setDate(today.getDate() - 1);
	if (d.toDateString() === today.toDateString()) return "Hoje";
	if (d.toDateString() === yesterday.toDateString()) return "Ontem";
	return d.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "long",
		year: "numeric"
	});
}
var time = (iso) => new Date(iso).toLocaleTimeString("pt-BR", {
	hour: "2-digit",
	minute: "2-digit"
});
/** Indicador de envio: só mostra "enviada" quando o banco confirma (o backend atualiza o status). */
function DeliveryMark({ message }) {
	switch (message.status) {
		case "pending": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
			className: "h-3 w-3",
			"aria-label": "Enviando"
		});
		case "sent": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
			className: "h-3 w-3",
			"aria-label": "Enviada"
		});
		case "delivered": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, {
			className: "h-3 w-3",
			"aria-label": "Entregue"
		});
		case "read": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, {
			className: "h-3 w-3 text-sky-200",
			"aria-label": "Lida"
		});
		case "failed": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
			className: "h-3 w-3 text-red-200",
			"aria-label": "Falha no envio"
		});
		default: return null;
	}
}
var STATUS_TEXT = {
	pending: "Enviando…",
	sent: "Enviada",
	delivered: "Entregue",
	read: "Lida"
};
function MessageList({ messages, loading, error, onRetry, onReply, onRetrySend }) {
	const endRef = (0, import_react.useRef)(null);
	const last = messages[messages.length - 1];
	const lastKey = last ? `${last.id}:${last.status}` : "";
	(0, import_react.useEffect)(() => {
		endRef.current?.scrollIntoView({ block: "end" });
	}, [lastKey]);
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex-1 space-y-3 p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-2/3 rounded-3xl" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "ml-auto h-12 w-1/2 rounded-3xl" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-3/5 rounded-3xl" })
		]
	});
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-1 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(EmptyState, {
			tone: "error",
			icon: WifiOff,
			title: "Erro de conexão",
			children: ["Não foi possível carregar as mensagens.", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: onRetry,
				className: "mt-2 block w-full font-medium text-primary hover:underline",
				children: "Tentar de novo"
			})]
		})
	});
	if (messages.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-1 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			icon: MessageSquare,
			title: "Nenhuma mensagem ainda",
			children: "As mensagens aparecem aqui assim que chegarem ou forem enviadas."
		})
	});
	const byId = new Map(messages.map((m) => [m.id, m]));
	let currentDay = "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6",
		role: "log",
		"aria-live": "polite",
		"aria-label": "Histórico de mensagens",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "flex flex-col gap-1.5",
			children: messages.map((m) => {
				const day = new Date(m.created_at).toDateString();
				const showDay = day !== currentDay;
				currentDay = day;
				const out = m.direction === "out";
				const quoted = m.reply_to_id ? byId.get(m.reply_to_id) : void 0;
				const failed = m.status === "failed";
				const stuck = m.status === "pending" && Date.now() - Date.parse(m.created_at) > STUCK_AFTER_MS;
				const hasMedia = MEDIA_TYPES.has(m.type) && (m.media_path || m.wa_media_id);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "group flex flex-col",
					children: [showDay && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "my-3 self-center rounded-full bg-card px-3 py-1 text-[11px] text-muted-foreground shadow-sm",
						children: dayLabel(m.created_at)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("flex items-end gap-1", out ? "flex-row-reverse self-end" : "self-start"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("max-w-[85%] rounded-3xl px-4 py-2.5 text-sm sm:max-w-[28rem]", out ? "rounded-br-lg bg-primary text-primary-foreground" : "rounded-bl-lg border border-border bg-card", failed && "bg-destructive text-destructive-foreground"),
							children: [
								quoted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: cn("mb-1.5 line-clamp-2 rounded-xl border-l-2 px-2 py-1 text-xs", out ? "border-white/60 bg-white/15" : "border-primary bg-secondary text-muted-foreground"),
									children: quoted.body ?? "mensagem"
								}),
								hasMedia && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mb-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaView, { message: m })
								}),
								MEDIA_TYPES.has(m.type) && !hasMedia && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mb-1 text-xs opacity-80",
									children: "Anexo ainda não disponível"
								}),
								m.type === "unsupported" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs opacity-80",
									children: "Tipo de mensagem não suportado"
								}),
								m.body && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "whitespace-pre-wrap break-words",
									children: m.body
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: cn("mt-1 flex items-center justify-end gap-1 text-[10px]", out ? "opacity-80" : "text-muted-foreground"),
									children: [
										time(m.created_at),
										out && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeliveryMark, { message: m }),
										out && !failed && !stuck && STATUS_TEXT[m.status] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "sr-only",
											children: STATUS_TEXT[m.status]
										})
									]
								}),
								(failed || stuck) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-[11px]",
									children: [
										failed ? `Não enviada${m.error_message ? `: ${m.error_message}` : "."}` : "Sem confirmação de envio.",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											className: "inline-flex items-center gap-1 underline",
											onClick: () => onRetrySend(m),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCw, { className: "h-3 w-3" }), " Tentar de novo"]
										})
									]
								})
							]
						}), m.type !== "template" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onReply(m),
							"aria-label": "Responder esta mensagem",
							className: "mb-1 rounded-full p-1.5 text-muted-foreground opacity-0 transition hover:bg-card hover:text-primary focus-visible:opacity-100 group-hover:opacity-100",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CornerUpLeft, { className: "h-4 w-4" })
						})]
					})]
				}, m.id);
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: endRef })]
	});
}
var NONE$1 = "none";
function ChatPane({ conversation, team, messages, messagesLoading, messagesError, onRetryMessages, busy, onBack, onOpenDetails, onResolve, onReopen, onAssign, draft, onDraftChange }) {
	const queryClient = useQueryClient();
	const [replyTo, setReplyTo] = (0, import_react.useState)(null);
	const conversationId = conversation?.id;
	(0, import_react.useEffect)(() => setReplyTo(null), [conversationId]);
	const retry = async (m) => {
		const r = await retrySend(m.id);
		await queryClient.invalidateQueries({ queryKey: [
			"inbox",
			"messages",
			m.conversation_id
		] });
		if (!r.ok) toast.error(r.error);
	};
	if (!conversation) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "inbox-surface hidden min-h-0 items-center justify-center rounded-[2rem] md:flex",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			icon: MessageSquare,
			title: "Selecione uma conversa",
			children: "O histórico e o campo de resposta aparecem aqui."
		})
	});
	const resolved = conversation.status === "resolved";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "inbox-surface flex min-h-0 flex-col overflow-hidden rounded-[2rem]",
		"aria-label": "Conversa",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-3 sm:px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						className: "rounded-full md:hidden",
						onClick: onBack,
						"aria-label": "Voltar",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-5 w-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserAvatar, { name: conversation.contact.name }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1 basis-40",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-sm font-semibold",
							children: conversation.contact.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-xs text-muted-foreground",
							children: STATUS_LABEL[conversation.status]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: conversation.assigned_to ?? NONE$1,
						onValueChange: (v) => onAssign(v === NONE$1 ? null : v),
						disabled: busy,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "h-9 w-40 rounded-full text-xs",
							"aria-label": "Responsável pela conversa",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, {
							className: "inbox-theme",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: NONE$1,
								children: "Sem responsável"
							}), team.filter((p) => p.active || p.id === conversation.assigned_to).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: p.id,
								children: p.full_name
							}, p.id))]
						})]
					}),
					resolved ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						className: "rounded-full",
						disabled: busy,
						onClick: onReopen,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "mr-1.5 h-4 w-4" }), " Reabrir"]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						className: "rounded-full",
						disabled: busy,
						onClick: onResolve,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mr-1.5 h-4 w-4" }), " Resolver"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						className: "rounded-full lg:hidden",
						onClick: onOpenDetails,
						"aria-label": "Abrir detalhes do contato",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelRight, { className: "h-5 w-5" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-0 flex-1 flex-col bg-secondary/50",
				children: [resolved && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "shrink-0 bg-highlight/70 px-4 py-2 text-center text-xs",
					children: "Conversa resolvida. Reabra para voltar ao atendimento."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageList, {
					messages,
					loading: messagesLoading,
					error: messagesError,
					onRetry: onRetryMessages,
					onReply: setReplyTo,
					onRetrySend: (m) => void retry(m)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Composer, {
				conversation,
				draft,
				onDraftChange,
				replyTo,
				onClearReply: () => setReplyTo(null)
			})
		]
	});
}
var FILTERS = [
	{
		id: "all",
		label: "Todas"
	},
	{
		id: "unread",
		label: "Não lidas"
	},
	{
		id: "waiting",
		label: "Aguardando resposta"
	},
	{
		id: "in_progress",
		label: "Em atendimento"
	},
	{
		id: "resolved",
		label: "Resolvidas"
	}
];
function applyFilter(rows, filter, query) {
	const q = query.trim().toLowerCase();
	return rows.filter((row) => {
		if (filter === "unread" && row.unread_count === 0) return false;
		if (filter !== "all" && filter !== "unread" && row.status !== filter) return false;
		if (!q) return true;
		return [
			row.contact.name,
			row.contact.phone,
			row.contact.company,
			row.last_message_preview
		].filter(Boolean).join(" ").toLowerCase().includes(q);
	});
}
function formatTime(iso) {
	if (!iso) return "";
	const date = new Date(iso);
	const now = /* @__PURE__ */ new Date();
	if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString("pt-BR", {
		hour: "2-digit",
		minute: "2-digit"
	});
	return date.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit"
	});
}
function ConversationList({ rows, loading, error, onRetry, filter, onFilterChange, query, selectedId, onSelect, team, totalCount }) {
	const visible = applyFilter(rows, filter, query);
	const owner = (id) => team.find((p) => p.id === id)?.full_name;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "inbox-surface flex min-h-0 flex-col overflow-hidden rounded-[2rem]",
		"aria-label": "Conversas",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex shrink-0 gap-2 overflow-x-auto px-4 pb-3 pt-4 [scrollbar-width:none]",
			children: FILTERS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => onFilterChange(f.id),
				"aria-pressed": filter === f.id,
				className: cn("shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors", filter === f.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-accent"),
				children: f.label
			}, f.id))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "min-h-0 flex-1 overflow-y-auto px-2 pb-3",
			children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2 px-2",
				children: [
					0,
					1,
					2,
					3,
					4
				].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-[68px] rounded-2xl" }, i))
			}) : error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(EmptyState, {
				tone: "error",
				icon: WifiOff,
				title: "Erro de conexão",
				children: ["Não foi possível carregar as conversas.", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onRetry,
					className: "mt-2 block w-full font-medium text-primary hover:underline",
					children: "Tentar de novo"
				})]
			}) : totalCount === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: Inbox,
				title: "Sem conversas ainda",
				children: "Quando alguém escrever para o WhatsApp da Astarita, a conversa aparece aqui. A conexão com o WhatsApp ainda não foi feita."
			}) : visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: SearchX,
				title: "Sem resultados",
				children: "Nenhuma conversa corresponde a este filtro ou busca."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-1",
				children: visible.map((row) => {
					const active = row.id === selectedId;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => onSelect(row.id),
						"aria-current": active ? "true" : void 0,
						className: cn("flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors", active ? "bg-accent" : "hover:bg-secondary"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserAvatar, { name: row.contact.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-baseline justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate text-sm font-semibold",
										children: row.contact.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "shrink-0 text-[11px] text-muted-foreground",
										children: formatTime(row.last_message_at)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate text-xs text-muted-foreground",
										children: row.last_message_preview ?? "Sem mensagens"
									}), row.unread_count > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground",
										children: row.unread_count
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "mt-0.5 block truncate text-[11px] text-muted-foreground/80",
									children: [STATUS_LABEL[row.status], owner(row.assigned_to) ? ` · ${owner(row.assigned_to)}` : " · Sem responsável"]
								})
							]
						})]
					}) }, row.id);
				})
			})
		})]
	});
}
var AI_ACTIONS = [
	{
		kind: "suggest",
		label: "Sugerir resposta",
		needsText: false
	},
	{
		kind: "natural",
		label: "Mais natural",
		needsText: true
	},
	{
		kind: "shorter",
		label: "Mais curta",
		needsText: true
	},
	{
		kind: "professional",
		label: "Mais profissional",
		needsText: true
	},
	{
		kind: "warmer",
		label: "Mais acolhedora",
		needsText: true
	},
	{
		kind: "summary",
		label: "Resumir conversa",
		needsText: false
	}
];
async function requestAi(p) {
	return inboxApi("/api/inbox/ai", p);
}
/** Registra que a sugestão foi usada (vai para o campo de resposta; o envio continua manual). */
async function markSuggestionUsed(id) {
	await db.from("ai_suggestions").update({ used: true }).eq("id", id);
}
/**
* Assistente Astarita. A IA só SUGERE: o texto aparece aqui para a pessoa editar e só vai para o campo de resposta
* quando ela clica em "Usar resposta". O envio ao cliente continua sendo sempre manual.
*/
function AssistantPanel({ conversation, draft, onUseDraft }) {
	const status = useChannelStatus();
	const [suggestion, setSuggestion] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(null);
	const [lastKind, setLastKind] = (0, import_react.useState)("suggest");
	const conversationId = conversation?.id;
	(0, import_react.useEffect)(() => {
		setSuggestion(null);
		setLoading(null);
	}, [conversationId]);
	const ai = status.data?.ai;
	const unavailable = status.isError ? "Não foi possível verificar a IA agora." : null;
	const notConfigured = ai && !ai.configured;
	const run = async (kind) => {
		if (!conversationId || loading) return;
		const action = AI_ACTIONS.find((a) => a.kind === kind);
		const source = draft.trim() || (suggestion?.kind !== "summary" ? suggestion?.text ?? "" : "");
		if (action?.needsText && !source.trim()) {
			toast.error("Escreva um texto no campo de resposta, ou gere uma sugestão, antes de ajustar o tom.");
			return;
		}
		const forConversation = conversationId;
		setLoading(kind);
		setLastKind(kind);
		const r = await requestAi({
			conversationId,
			kind,
			...action?.needsText ? { text: source } : {}
		});
		setLoading(null);
		if (forConversation !== conversationId) return;
		if (!r.ok) {
			toast.error(r.error);
			return;
		}
		setSuggestion({
			id: r.id,
			kind: r.kind,
			text: r.content
		});
	};
	const copy = async () => {
		if (!suggestion) return;
		try {
			await navigator.clipboard.writeText(suggestion.text);
			toast.success("Texto copiado.");
		} catch {
			toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
		}
	};
	const use = () => {
		if (!suggestion || !suggestion.text.trim()) return;
		onUseDraft(suggestion.text.trim());
		if (suggestion.id) markSuggestionUsed(suggestion.id);
		setSuggestion(null);
		toast.success("Texto colocado no campo de resposta. Revise e envie quando quiser.");
	};
	const disabled = !conversationId || !!notConfigured || !!unavailable || status.isPending;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "inbox-surface rounded-[2rem] p-5",
		"aria-label": "Assistente Astarita",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				className: "mb-3 flex items-center gap-1.5 font-display text-base font-semibold",
				children: ["Assistente Astarita ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Asterisk, {
					className: "h-4 w-4 text-primary",
					strokeWidth: 3
				})]
			}),
			(notConfigured || unavailable) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mb-3 flex items-start gap-2 rounded-2xl bg-highlight/70 px-3 py-2 text-xs text-foreground/80",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "mt-0.5 h-3.5 w-3.5 shrink-0" }), notConfigured ? "A IA ainda não foi ligada. Nenhuma sugestão é simulada. O atendimento e as respostas rápidas funcionam normalmente." : unavailable]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: AI_ACTIONS.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					size: "sm",
					className: "rounded-full",
					disabled: disabled || !!loading,
					onClick: () => void run(a.kind),
					children: [loading === a.kind && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-1.5 h-3.5 w-3.5 animate-spin" }), a.label]
				}, a.kind))
			}),
			loading && !suggestion && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-xs text-muted-foreground",
				role: "status",
				children: "Preparando a sugestão…"
			}),
			suggestion && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 space-y-2",
				"data-testid": "ai-suggestion",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						htmlFor: "ai-suggestion-text",
						className: "text-xs font-medium text-muted-foreground",
						children: suggestion.kind === "summary" ? "Resumo (só para você)" : "Sugestão (edite antes de usar)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						id: "ai-suggestion-text",
						value: suggestion.text,
						onChange: (e) => setSuggestion({
							...suggestion,
							text: e.target.value
						}),
						className: "min-h-28 rounded-2xl text-sm"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							suggestion.kind !== "summary" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								className: "rounded-full",
								onClick: use,
								children: "Usar resposta"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								size: "sm",
								className: "rounded-full",
								disabled: !!loading,
								onClick: () => void run(lastKind),
								children: "Gerar novamente"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								size: "sm",
								className: "rounded-full",
								onClick: () => void copy(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "mr-1.5 h-3.5 w-3.5" }), " Copiar"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "ghost",
								size: "sm",
								className: "rounded-full",
								onClick: () => setSuggestion(null),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "mr-1.5 h-3.5 w-3.5" }), " Descartar"]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Nada é enviado ao cliente. Você revisa e envia pelo campo de resposta."
					})
				]
			})
		]
	});
}
async function fetchNotes(contactId) {
	const { data, error } = await db.from("internal_notes").select("id, contact_id, body, created_by, created_at").eq("contact_id", contactId).order("created_at", { ascending: false }).limit(200);
	if (error) throw error;
	return data ?? [];
}
async function addNote(contactId, body, userId) {
	const text = body.trim();
	if (!text) throw new Error("Escreva a observação.");
	const { error } = await db.from("internal_notes").insert({
		contact_id: contactId,
		body: text,
		created_by: userId
	});
	if (error) throw error;
}
async function deleteNote(id) {
	const { error } = await db.from("internal_notes").delete().eq("id", id);
	if (error) throw error;
}
function when(iso) {
	const d = new Date(iso);
	return `${d.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit"
	})} ${d.toLocaleTimeString("pt-BR", {
		hour: "2-digit",
		minute: "2-digit"
	})}`;
}
/** Observações internas: linha do tempo por contato. Nunca vão para o cliente. */
function NotesSection({ contactId }) {
	const profile = useInboxProfile();
	const queryClient = useQueryClient();
	const interval = useFallbackInterval();
	const notes = useQuery({
		queryKey: [
			"inbox",
			"notes",
			contactId
		],
		queryFn: () => fetchNotes(contactId),
		refetchInterval: interval
	});
	const team = useQuery({
		queryKey: ["inbox", "team"],
		queryFn: fetchTeam
	});
	const [text, setText] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const author = (id) => team.data?.find((p) => p.id === id)?.full_name ?? "Alguém da equipe";
	const refresh = () => queryClient.invalidateQueries({ queryKey: [
		"inbox",
		"notes",
		contactId
	] });
	const submit = async () => {
		if (busy || !text.trim()) return;
		setBusy(true);
		try {
			await addNote(contactId, text, profile.id);
			setText("");
			await refresh();
		} catch {
			toast.error("Não foi possível salvar a observação. Tente de novo.");
		} finally {
			setBusy(false);
		}
	};
	const remove = async (id) => {
		try {
			await deleteNote(id);
			await refresh();
		} catch {
			toast.error("Não foi possível apagar a observação.");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "inbox-surface rounded-[2rem] p-5",
		"aria-label": "Observações internas",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-1 font-display text-base font-semibold",
				children: "Observações internas"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-3 text-xs text-muted-foreground",
				children: "Só a equipe vê. Não são enviadas ao cliente."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "grid gap-2",
				onSubmit: (e) => {
					e.preventDefault();
					submit();
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					rows: 2,
					maxLength: 4e3,
					placeholder: "Ex.: prefere áudio, fecha em novembro…",
					value: text,
					onChange: (e) => setText(e.target.value),
					"aria-label": "Nova observação"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					size: "sm",
					className: "justify-self-end rounded-full",
					disabled: busy || !text.trim(),
					children: "Adicionar"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-3 space-y-2",
				children: [
					notes.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-sm text-muted-foreground",
						children: "Carregando…"
					}),
					notes.isError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-sm text-destructive",
						children: "Não foi possível carregar as observações."
					}),
					notes.data?.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-sm text-muted-foreground",
						children: "Nenhuma observação ainda."
					}),
					notes.data?.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-2xl bg-secondary px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "whitespace-pre-wrap break-words text-sm",
							children: n.body
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 flex items-center justify-between text-[11px] text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								author(n.created_by),
								" · ",
								when(n.created_at)
							] }), n.created_by === profile.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => void remove(n.id),
								"aria-label": "Apagar observação",
								className: "rounded-full p-1 hover:bg-card hover:text-destructive",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
							})]
						})]
					}, n.id))
				]
			})
		]
	});
}
var NONE = "none";
/** Lembretes internos de um contato (retornar contato, confirmar reunião, acompanhar proposta…). Sem notificação externa. */
function RemindersSection({ contactId }) {
	const profile = useInboxProfile();
	const queryClient = useQueryClient();
	const interval = useFallbackInterval();
	const reminders = useQuery({
		queryKey: ["inbox", "reminders"],
		queryFn: fetchPendingReminders,
		refetchInterval: interval
	});
	const team = useQuery({
		queryKey: ["inbox", "team"],
		queryFn: fetchTeam
	});
	const [open, setOpen] = (0, import_react.useState)(false);
	const [description, setDescription] = (0, import_react.useState)("");
	const [due, setDue] = (0, import_react.useState)(() => isoToLocalInput(new Date(Date.now() + 864e5).toISOString()));
	const [assignee, setAssignee] = (0, import_react.useState)(profile.id);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const mine = (reminders.data ?? []).filter((r) => r.contact_id === contactId);
	const refresh = () => queryClient.invalidateQueries({ queryKey: ["inbox", "reminders"] });
	const ownerName = (id) => team.data?.find((p) => p.id === id)?.full_name;
	const submit = async () => {
		if (busy) return;
		const iso = localInputToIso(due);
		if (!description.trim()) return setError("Descreva o lembrete.");
		if (!iso) return setError("Informe uma data e hora válidas.");
		setBusy(true);
		setError(null);
		try {
			await createReminder({
				contact_id: contactId,
				description,
				due_at: iso,
				assigned_to: assignee === NONE ? null : assignee
			}, profile.id);
			setDescription("");
			setOpen(false);
			toast.success("Lembrete criado.");
			await refresh();
		} catch {
			setError("Não foi possível salvar. Tente de novo.");
		} finally {
			setBusy(false);
		}
	};
	const mark = async (id, status) => {
		try {
			await setReminderStatus(id, status);
			await refresh();
		} catch {
			toast.error("Não foi possível atualizar o lembrete.");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "inbox-surface rounded-[2rem] p-5",
		"aria-label": "Lembretes do contato",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-base font-semibold",
					children: "Lembretes"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "outline",
					className: "rounded-full",
					onClick: () => setOpen((v) => !v),
					"aria-expanded": open,
					children: open ? "Fechar" : "Novo lembrete"
				})]
			}),
			open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mb-3 grid gap-2 rounded-2xl bg-secondary p-3",
				onSubmit: (e) => {
					e.preventDefault();
					submit();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Ex.: retornar sobre a proposta",
						maxLength: 500,
						value: description,
						onChange: (e) => setDescription(e.target.value),
						"aria-label": "Descrição do lembrete"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "datetime-local",
						value: due,
						onChange: (e) => setDue(e.target.value),
						"aria-label": "Data e hora do lembrete"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: assignee,
						onValueChange: setAssignee,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							"aria-label": "Responsável pelo lembrete",
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
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						role: "alert",
						className: "text-sm text-destructive",
						children: error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						size: "sm",
						className: "justify-self-end rounded-full",
						disabled: busy,
						children: "Salvar lembrete"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "space-y-2",
				children: [
					reminders.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-sm text-muted-foreground",
						children: "Carregando…"
					}),
					reminders.isError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-sm text-destructive",
						children: "Não foi possível carregar os lembretes."
					}),
					!reminders.isPending && !reminders.isError && mine.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-sm text-muted-foreground",
						children: "Nenhum lembrete pendente."
					}),
					mine.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-start gap-2 rounded-2xl bg-secondary px-3 py-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "break-words text-sm",
									children: r.description
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: cn("text-[11px]", reminderBucket(r.due_at) === "overdue" ? "font-medium text-destructive" : "text-muted-foreground"),
									children: [
										reminderBucket(r.due_at) === "overdue" ? "Atrasado: " : "",
										formatDue(r.due_at),
										ownerName(r.assigned_to) ? ` · ${ownerName(r.assigned_to)}` : ""
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => void mark(r.id, "done"),
								"aria-label": "Concluir lembrete",
								className: "rounded-full p-1.5 hover:bg-card hover:text-primary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => void mark(r.id, "cancelled"),
								"aria-label": "Cancelar lembrete",
								className: "rounded-full p-1.5 hover:bg-card hover:text-destructive",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
							})
						]
					}, r.id))
				]
			})
		]
	});
}
var NO_STAGE = "none";
function Field({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "text-[11px] uppercase tracking-wide text-muted-foreground",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
		className: "text-sm",
		children: value || /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted-foreground",
			children: "Não informado"
		})
	})] });
}
/** Etapa comercial do contato: cria a oportunidade no funil na primeira escolha e move nas seguintes. */
function StageField({ contactId }) {
	const queryClient = useQueryClient();
	const stages = useQuery({
		queryKey: ["inbox", "stages"],
		queryFn: fetchPipelineStages
	});
	const current = useQuery({
		queryKey: [
			"inbox",
			"contact-stage",
			contactId
		],
		queryFn: () => fetchContactStage(contactId)
	});
	const change = async (stageId) => {
		if (stageId === NO_STAGE) return;
		try {
			await setContactStage(contactId, stageId);
			await Promise.all([queryClient.invalidateQueries({ queryKey: [
				"inbox",
				"contact-stage",
				contactId
			] }), queryClient.invalidateQueries({ queryKey: ["inbox", "opportunities"] })]);
			toast.success("Etapa comercial atualizada.");
		} catch {
			toast.error("Não foi possível atualizar a etapa. Tente de novo.");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "mb-1 text-[11px] uppercase tracking-wide text-muted-foreground",
		children: "Etapa comercial"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
		value: current.data?.stage_id ?? NO_STAGE,
		onValueChange: (v) => void change(v),
		disabled: stages.isPending || current.isPending,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
			className: "h-9 rounded-full text-sm",
			"aria-label": "Etapa comercial do contato",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, {
			className: "inbox-theme",
			children: [!current.data && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
				value: NO_STAGE,
				children: "Fora do funil"
			}), stages.data?.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
				value: s.id,
				children: s.name
			}, s.id))]
		})]
	}) })] });
}
function DetailsPanel({ conversation, team, tags, onEditContact, onUseDraft, draft }) {
	const contact = conversation?.contact;
	const owner = team.find((p) => p.id === conversation?.assigned_to)?.full_name;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-col gap-4 overflow-y-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "inbox-surface rounded-[2rem] p-5",
				"aria-label": "Informações do contato",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-base font-semibold",
						children: "Contato"
					}), contact && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						className: "rounded-full",
						onClick: onEditContact,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "mr-1.5 h-3.5 w-3.5" }), " Editar"]
					})]
				}), contact ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Nome",
							value: contact.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Telefone",
							value: formatPhone(contact.phone)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Empresa",
							value: contact.company
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Instagram",
							value: contact.instagram
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Categoria",
							value: CATEGORY_LABEL[contact.category]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Responsável",
							value: owner
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StageField, { contactId: contact.id }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Etiquetas",
							value: tags.join(", ")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Anotação fixa",
							value: contact.notes
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Selecione uma conversa para ver os dados do contato."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssistantPanel, {
				conversation,
				draft,
				onUseDraft
			}),
			contact && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RemindersSection, { contactId: contact.id }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotesSection, { contactId: contact.id })] })
		]
	});
}
var Sheet = Dialog;
var SheetPortal = DialogPortal;
var SheetOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
SheetOverlay.displayName = DialogOverlay.displayName;
var sheetVariants = cva("fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out", {
	variants: { side: {
		top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
		bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
		left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
		right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
	} },
	defaultVariants: { side: "right" }
});
var SheetContent = import_react.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
	ref,
	className: cn(sheetVariants({ side }), className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	}), children]
})] }));
SheetContent.displayName = DialogContent.displayName;
var SheetHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
SheetHeader.displayName = "SheetHeader";
var SheetFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
SheetFooter.displayName = "SheetFooter";
var SheetTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
	ref,
	className: cn("text-lg font-semibold text-foreground", className),
	...props
}));
SheetTitle.displayName = DialogTitle.displayName;
var SheetDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
SheetDescription.displayName = DialogDescription.displayName;
/** Ao reabrir: quem já tem responsável volta "em atendimento"; sem responsável, "aguardando". */
function reopenedStatus(assignedTo) {
	return assignedTo ? "in_progress" : "waiting";
}
/**
* Ao atribuir um responsável a uma conversa que aguardava resposta, ela passa a "em atendimento".
* Conversas resolvidas continuam resolvidas; remover o responsável não muda o status.
*/
function statusAfterAssign(current, newAssignee) {
	if (current === "waiting" && newAssignee) return "in_progress";
	return current;
}
var CONFLICT = "Esta conversa foi alterada por outra pessoa agora há pouco. Atualizei a tela, confira e tente de novo.";
/** Últimas mensagens da conversa, da mais antiga para a mais nova. */
async function fetchMessages(conversationId) {
	const { data, error } = await db.from("messages").select("id, conversation_id, direction, type, body, media_mime, status, error_message, sent_by, reply_to_id, media_path, wa_media_id, created_at").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(300);
	if (error) throw error;
	return (data ?? []).reverse();
}
/**
* Atualiza a conversa só se ninguém mexeu nela desde que a tela carregou (controle por updated_at).
* Evita que duas pessoas sobrescrevam uma à outra sem perceber.
*/
async function guardedUpdate(row, patch) {
	const { data, error } = await db.from("conversations").update(patch).eq("id", row.id).eq("updated_at", row.updated_at).select("id");
	if (error) throw error;
	if (!data || data.length === 0) throw new InboxUserError(CONFLICT);
}
function resolveConversation(row) {
	return guardedUpdate(row, { status: "resolved" });
}
function reopenConversation(row) {
	return guardedUpdate(row, { status: reopenedStatus(row.assigned_to) });
}
function assignConversation(row, assigneeId) {
	return guardedUpdate(row, {
		assigned_to: assigneeId,
		status: statusAfterAssign(row.status, assigneeId)
	});
}
/** Zera o contador de não lidas. Falha em silêncio: não vale atrapalhar quem está lendo. */
async function markConversationRead(conversationId) {
	await db.from("conversations").update({ unread_count: 0 }).eq("id", conversationId).gt("unread_count", 0);
}
function InboxPage() {
	const { c: selectedId } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const queryClient = useQueryClient();
	const interval = useFallbackInterval();
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [query, setQuery] = (0, import_react.useState)("");
	const [detailsOpen, setDetailsOpen] = (0, import_react.useState)(false);
	const [contactDialog, setContactDialog] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [drafts, setDrafts] = (0, import_react.useState)({});
	const conversations = useQuery({
		queryKey: ["inbox", "conversations"],
		queryFn: fetchConversations,
		refetchInterval: interval
	});
	const teamQuery = useQuery({
		queryKey: ["inbox", "team"],
		queryFn: fetchTeam
	});
	const contactsQuery = useQuery({
		queryKey: ["inbox", "contacts"],
		queryFn: fetchContacts
	});
	const rows = conversations.data ?? [];
	const team = teamQuery.data ?? [];
	const selected = rows.find((r) => r.id === selectedId);
	const activeId = selected?.id;
	const fullContact = contactsQuery.data?.find((c) => c.id === selected?.contact.id);
	const messages = useQuery({
		queryKey: [
			"inbox",
			"messages",
			activeId
		],
		queryFn: () => fetchMessages(activeId),
		enabled: !!activeId,
		refetchInterval: interval
	});
	const unread = selected?.unread_count ?? 0;
	(0, import_react.useEffect)(() => {
		if (activeId && unread > 0) markConversationRead(activeId).then(() => queryClient.invalidateQueries({ queryKey: ["inbox", "conversations"] }));
	}, [
		activeId,
		unread,
		queryClient
	]);
	const draft = activeId ? drafts[activeId] ?? "" : "";
	const setDraft = (text) => {
		if (activeId) setDrafts((d) => ({
			...d,
			[activeId]: text
		}));
	};
	const applyDraft = (text) => setDraft(text);
	const select = (id) => void navigate({ search: { c: id } });
	const back = () => void navigate({ search: {} });
	/** Executa uma ação sobre a conversa e trata conflito (outra pessoa mexeu primeiro). */
	const act = async (action, okMessage) => {
		if (busy) return;
		setBusy(true);
		try {
			await action();
			toast.success(okMessage);
		} catch (e) {
			toast.error(e instanceof InboxUserError ? e.message : "Não foi possível salvar a alteração. Tente de novo.");
		} finally {
			await queryClient.invalidateQueries({ queryKey: ["inbox", "conversations"] });
			setBusy(false);
		}
	};
	const subtitle = conversations.isPending ? "Carregando conversas…" : rows.length === 0 ? "Nenhuma conversa ainda" : `${rows.length} ${rows.length === 1 ? "conversa" : "conversas"}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Caixa de entrada",
			subtitle,
			search: {
				value: query,
				onChange: setQuery,
				placeholder: "Buscar conversas"
			},
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				className: "rounded-full",
				onClick: () => setContactDialog("new"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-4 w-4" }), " Novo contato"]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid min-h-0 flex-1 gap-3 sm:gap-4 md:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)_minmax(260px,320px)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("min-h-0", activeId ? "hidden md:grid" : "grid"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConversationList, {
						rows,
						loading: conversations.isPending,
						error: conversations.isError,
						onRetry: () => void conversations.refetch(),
						filter,
						onFilterChange: setFilter,
						query,
						selectedId: activeId,
						onSelect: select,
						team,
						totalCount: rows.length
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("min-h-0", activeId ? "grid" : "hidden md:grid"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatPane, {
						conversation: selected,
						team,
						messages: messages.data ?? [],
						messagesLoading: messages.isPending && !!activeId,
						messagesError: messages.isError,
						onRetryMessages: () => void messages.refetch(),
						busy,
						onBack: back,
						onOpenDetails: () => setDetailsOpen(true),
						onResolve: () => selected && void act(() => resolveConversation(selected), "Conversa resolvida."),
						onReopen: () => selected && void act(() => reopenConversation(selected), "Conversa reaberta."),
						draft,
						onDraftChange: setDraft,
						onAssign: (id) => selected && void act(() => assignConversation(selected, id), id ? "Responsável atribuído." : "Responsável removido.")
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hidden min-h-0 lg:grid",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailsPanel, {
						conversation: selected,
						team,
						tags: fullContact?.tags.map((t) => t.name) ?? [],
						onEditContact: () => setContactDialog("edit"),
						onUseDraft: applyDraft,
						draft
					})
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
			open: detailsOpen,
			onOpenChange: setDetailsOpen,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
				className: "inbox-theme w-[92vw] overflow-y-auto bg-background sm:max-w-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Detalhes" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailsPanel, {
						conversation: selected,
						team,
						tags: fullContact?.tags.map((t) => t.name) ?? [],
						draft,
						onUseDraft: (text) => {
							applyDraft(text);
							setDetailsOpen(false);
						},
						onEditContact: () => {
							setDetailsOpen(false);
							setContactDialog("edit");
						}
					})
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContactDialog, {
			open: contactDialog !== null,
			onOpenChange: (open) => !open && setContactDialog(null),
			contact: contactDialog === "edit" ? fullContact : void 0,
			onSaved: (contactId) => {
				if (contactDialog === "new") openConversationFor(contactId, null).then(async (id) => {
					await queryClient.invalidateQueries({ queryKey: ["inbox"] });
					select(id);
				}).catch(() => toast.error("Contato salvo, mas não foi possível abrir a conversa."));
			}
		})
	] });
}
//#endregion
export { InboxPage as component };
