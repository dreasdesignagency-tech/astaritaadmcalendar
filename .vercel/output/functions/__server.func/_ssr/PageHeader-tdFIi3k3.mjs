import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Button } from "./button-CeGigu7E.mjs";
import { H as Bell, R as Check, d as Search } from "../_libs/lucide-react.mjs";
import { n as getInboxClient, t as db } from "./client-Ba0sJm8H.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { i as Trigger, n as Portal, r as Root2, t as Content2 } from "../_libs/@radix-ui/react-popover+[...].mjs";
import { a as TooltipTrigger, f as useFallbackInterval, h as useRealtimeState, n as Tooltip, o as UserAvatar, p as useInboxProfile, r as TooltipContent, u as fetchTeam } from "./profile-context-xvvqmyQ6.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/PageHeader-tdFIi3k3.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Popover = Root2;
var PopoverTrigger = Trigger;
var PopoverContent = import_react.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	align,
	sideOffset,
	className: cn("z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)", className),
	...props
}) }));
PopoverContent.displayName = Content2.displayName;
/** Erro com mensagem pronta para mostrar a quem usa o sistema. */
var InboxUserError = class extends Error {};
async function fetchOpportunities() {
	const { data, error } = await db.from("opportunities").select("id, contact_id, stage_id, title, assigned_to, position, last_interaction_at, created_at, contact:contacts!inner(id, name, company, phone, category)").order("position").limit(1e3);
	if (error) throw error;
	return data ?? [];
}
/** Move o cartão e persiste no banco. Falha explícita se a linha não existir mais (outra pessoa removeu). */
async function moveOpportunity(id, stageId, position) {
	const { data, error } = await db.from("opportunities").update({
		stage_id: stageId,
		position
	}).eq("id", id).select("id");
	if (error) throw error;
	if (!data || data.length === 0) throw new InboxUserError("Este cartão não existe mais. Atualizei o funil.");
}
async function setOpportunityOwner(id, assignedTo) {
	const { error } = await db.from("opportunities").update({ assigned_to: assignedTo }).eq("id", id);
	if (error) throw error;
}
async function deleteOpportunity(id) {
	const { error } = await db.from("opportunities").delete().eq("id", id);
	if (error) throw error;
}
async function nextPosition(stageId) {
	const { data, error } = await db.from("opportunities").select("position").eq("stage_id", stageId).order("position", { ascending: false }).limit(1);
	if (error) throw error;
	return (data?.[0]?.position ?? 0) + 1;
}
async function stageIdBySlug(slug) {
	const { data, error } = await db.from("pipeline_stages").select("id").eq("slug", slug).maybeSingle();
	if (error) throw error;
	return data?.id ?? null;
}
/** Garante uma oportunidade para o contato (uma por contato no app). Devolve a existente se já houver. */
async function ensureOpportunity(contactId, stageId, title = null) {
	const found = await db.from("opportunities").select("id").eq("contact_id", contactId).limit(1);
	if (found.error) throw found.error;
	if (found.data && found.data[0]) return {
		id: found.data[0].id,
		created: false
	};
	const position = await nextPosition(stageId);
	const ins = await db.from("opportunities").insert({
		contact_id: contactId,
		stage_id: stageId,
		title,
		position,
		last_interaction_at: (/* @__PURE__ */ new Date()).toISOString()
	}).select("id").single();
	if (ins.error) throw ins.error;
	return {
		id: ins.data.id,
		created: true
	};
}
/** Define a etapa do contato: cria a oportunidade se ainda não existir, senão move para o fim da etapa. */
async function setContactStage(contactId, stageId) {
	const found = await db.from("opportunities").select("id, stage_id").eq("contact_id", contactId).limit(1);
	if (found.error) throw found.error;
	const existing = found.data?.[0];
	if (!existing) {
		await ensureOpportunity(contactId, stageId);
		return;
	}
	if (existing.stage_id === stageId) return;
	await moveOpportunity(existing.id, stageId, await nextPosition(stageId));
}
async function fetchContactStage(contactId) {
	const { data, error } = await db.from("opportunities").select("id, stage_id").eq("contact_id", contactId).limit(1);
	if (error) throw error;
	return data?.[0] ?? null;
}
/**
* Telefones no Inbox ficam no formato que a Meta usa: só dígitos, com DDI, sem "+"
* (ex.: 5511999998888). Este arquivo não importa nada de propósito, para ser testado
* sozinho e reaproveitado pelo webhook na Fase 4.
*/
/** Devolve o número normalizado ou null se não parecer um telefone válido. */
function normalizePhone(input) {
	const international = input.trim().startsWith("+");
	let digits = input.replace(/\D/g, "").replace(/^0+/, "");
	if (!international && (digits.length === 10 || digits.length === 11)) digits = `55${digits}`;
	if (digits.length < 8 || digits.length > 15) return null;
	if (digits.startsWith("55") && digits.length !== 12 && digits.length !== 13) return null;
	return digits;
}
/**
* Celulares brasileiros chegam ora com o nono dígito (13 dígitos), ora sem (12).
* Para não duplicar contatos, a busca por duplicidade usa as duas formas.
*/
function phoneVariants(normalized) {
	if (normalized.startsWith("55") && normalized.length === 13 && normalized[4] === "9") return [normalized, normalized.slice(0, 4) + normalized.slice(5)];
	if (normalized.startsWith("55") && normalized.length === 12 && /[6-9]/.test(normalized[4] ?? "")) return [normalized, normalized.slice(0, 4) + "9" + normalized.slice(4)];
	return [normalized];
}
/** Mostra 5511999998888 como +55 (11) 99999-8888. Outros países ficam com "+" e dígitos. */
function formatPhone(phone) {
	if (!phone) return "";
	if (phone.startsWith("55") && (phone.length === 12 || phone.length === 13)) {
		const ddd = phone.slice(2, 4);
		const rest = phone.slice(4);
		const split = rest.length - 4;
		return `+55 (${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
	}
	return `+${phone}`;
}
/** "@usuario", "instagram.com/usuario/" ou "usuario" viram "@usuario". Vazio vira null. */
function normalizeInstagram(input) {
	const handle = input.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/[/?#].*$/, "").replace(/^@+/, "");
	return handle ? `@${handle}` : null;
}
async function fetchContacts() {
	const { data, error } = await db.from("contacts").select("id, name, phone, company, instagram, category, assigned_to, notes, created_at, contact_tags(tag:tags(id, name, color)), conversations(id, status, last_message_at)").order("name").limit(2e3);
	if (error) throw error;
	return (data ?? []).map(({ contact_tags, conversations, ...c }) => ({
		...c,
		tags: (contact_tags ?? []).map((ct) => ct.tag).filter((t) => !!t),
		conversation: conversations?.[0] ?? null
	}));
}
async function fetchTags() {
	const { data, error } = await db.from("tags").select("id, name, color").order("name");
	if (error) throw error;
	return data ?? [];
}
var blank = (v) => v.trim() === "" ? null : v.trim();
/** Cria ou atualiza um contato, barrando duplicidade de telefone (inclusive o nono dígito). */
async function saveContact(input, id) {
	const name = input.name.trim();
	if (!name) throw new InboxUserError("Informe o nome do contato.");
	const phone = normalizePhone(input.phone);
	if (!phone) throw new InboxUserError("Telefone inválido. Use DDD + número, por exemplo (11) 99999-8888.");
	const dup = await db.from("contacts").select("id, name").in("phone", phoneVariants(phone)).limit(2);
	if (dup.error) throw dup.error;
	const clash = (dup.data ?? []).find((c) => c.id !== id);
	if (clash) throw new InboxUserError(`Esse telefone já pertence a ${clash.name}.`);
	const row = {
		name,
		phone,
		company: blank(input.company),
		instagram: normalizeInstagram(input.instagram),
		category: input.category,
		assigned_to: input.assigned_to,
		notes: blank(input.notes)
	};
	let contactId = id;
	if (id) {
		const { error } = await db.from("contacts").update(row).eq("id", id);
		if (error) throw mapError(error);
	} else {
		const { data, error } = await db.from("contacts").insert(row).select("id").single();
		if (error) throw mapError(error);
		contactId = data.id;
		if (row.category === "lead") try {
			const stage = await stageIdBySlug("novo-lead");
			if (stage) await ensureOpportunity(contactId, stage, row.name);
		} catch {}
	}
	await syncTags(contactId, input.tags);
	return contactId;
}
function mapError(error) {
	if (error.code === "23505") return new InboxUserError("Esse telefone já está cadastrado.");
	return error;
}
/** Deixa o contato com exatamente as etiquetas informadas, criando as que ainda não existem. */
async function syncTags(contactId, names) {
	const wanted = [...new Map(names.map((n) => [n.trim().toLowerCase(), n.trim()])).entries()].filter(([key]) => key).map(([, name]) => name);
	const existing = await fetchTags();
	const byKey = new Map(existing.map((t) => [t.name.toLowerCase(), t]));
	const toCreate = wanted.filter((n) => !byKey.has(n.toLowerCase()));
	if (toCreate.length) {
		const { data, error } = await db.from("tags").insert(toCreate.map((name) => ({ name }))).select("id, name, color");
		if (error) throw error;
		for (const t of data ?? []) byKey.set(t.name.toLowerCase(), t);
	}
	const targetIds = new Set(wanted.map((n) => byKey.get(n.toLowerCase())?.id).filter((v) => !!v));
	const current = await db.from("contact_tags").select("tag_id").eq("contact_id", contactId);
	if (current.error) throw current.error;
	const currentIds = new Set((current.data ?? []).map((r) => r.tag_id));
	const add = [...targetIds].filter((t) => !currentIds.has(t));
	const remove = [...currentIds].filter((t) => !targetIds.has(t));
	if (add.length) {
		const { error } = await db.from("contact_tags").insert(add.map((tag_id) => ({
			contact_id: contactId,
			tag_id
		})));
		if (error) throw error;
	}
	if (remove.length) {
		const { error } = await db.from("contact_tags").delete().eq("contact_id", contactId).in("tag_id", remove);
		if (error) throw error;
	}
}
/** Devolve o id da conversa do contato, criando-a se ainda não existir. */
async function openConversationFor(contactId, defaultAssignee) {
	const found = await db.from("conversations").select("id").eq("contact_id", contactId).maybeSingle();
	if (found.error) throw found.error;
	if (found.data) return found.data.id;
	const up = await db.from("conversations").upsert({
		contact_id: contactId,
		assigned_to: defaultAssignee,
		status: defaultAssignee ? "in_progress" : "waiting"
	}, {
		onConflict: "contact_id",
		ignoreDuplicates: true
	});
	if (up.error) throw up.error;
	const again = await db.from("conversations").select("id").eq("contact_id", contactId).single();
	if (again.error) throw again.error;
	return again.data.id;
}
var SELECT = "id, contact_id, description, due_at, assigned_to, status, contact:contacts!inner(id, name)";
async function fetchPendingReminders() {
	const { data, error } = await db.from("reminders").select(SELECT).eq("status", "pending").order("due_at").limit(500);
	if (error) throw error;
	return data ?? [];
}
async function createReminder(input, userId) {
	const description = input.description.trim();
	if (!description) throw new Error("Descreva o lembrete.");
	const { error } = await db.from("reminders").insert({
		...input,
		description,
		created_by: userId
	});
	if (error) throw error;
}
async function setReminderStatus(id, status) {
	const { error } = await db.from("reminders").update({ status }).eq("id", id);
	if (error) throw error;
}
function startOfDay(ms) {
	const d = new Date(ms);
	d.setHours(0, 0, 0, 0);
	return d.getTime();
}
function reminderBucket(dueAt, now = Date.now()) {
	const due = Date.parse(dueAt);
	if (due < now) return "overdue";
	return due < startOfDay(now) + 864e5 ? "today" : "upcoming";
}
function bucketReminders(list, now = Date.now()) {
	const out = {
		overdue: [],
		today: [],
		upcoming: []
	};
	for (const r of list) {
		if (r.status !== "pending") continue;
		out[reminderBucket(r.due_at, now)].push(r);
	}
	for (const k of Object.keys(out)) out[k].sort((a, b) => Date.parse(a.due_at) - Date.parse(b.due_at));
	return out;
}
function formatDue(dueAt, now = Date.now()) {
	const d = new Date(dueAt);
	const time = d.toLocaleTimeString("pt-BR", {
		hour: "2-digit",
		minute: "2-digit"
	});
	const b = reminderBucket(dueAt, now);
	if (b === "today") return `hoje às ${time}`;
	if (b === "overdue" && startOfDay(now) <= d.getTime()) return `hoje às ${time}`;
	return `${d.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit"
	})} às ${time}`;
}
/** Valor do <input type="datetime-local"> (hora local) para ISO UTC, e o contrário. */
function localInputToIso(value) {
	const t = Date.parse(value);
	return Number.isNaN(t) ? null : new Date(t).toISOString();
}
function isoToLocalInput(iso) {
	const d = new Date(iso);
	const pad = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
var LABEL = {
	overdue: "Atrasados",
	today: "Hoje",
	upcoming: "Próximos"
};
/** Seção discreta de lembretes pendentes: um sino no cabeçalho com a contagem do que está atrasado ou vence hoje. */
function RemindersPopover() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
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
	const groups = bucketReminders(reminders.data ?? []);
	const urgent = groups.overdue.length + groups.today.length;
	const total = urgent + groups.upcoming.length;
	const owner = (id) => team.data?.find((p) => p.id === id)?.full_name;
	const done = async (id) => {
		try {
			await setReminderStatus(id, "done");
			await queryClient.invalidateQueries({ queryKey: ["inbox", "reminders"] });
		} catch {
			toast.error("Não foi possível concluir o lembrete.");
		}
	};
	const openChat = async (contactId) => {
		try {
			const id = await openConversationFor(contactId, null);
			setOpen(false);
			navigate({
				to: "/inbox",
				search: { c: id }
			});
		} catch {
			toast.error("Não foi possível abrir a conversa.");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				"aria-label": urgent > 0 ? `Lembretes pendentes, ${urgent} atrasados ou para hoje` : "Lembretes pendentes",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-5 w-5" }), urgent > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground",
					children: urgent
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PopoverContent, {
			align: "end",
			className: "inbox-theme w-[min(92vw,22rem)] rounded-3xl p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 font-display text-sm font-semibold",
					children: "Lembretes pendentes"
				}),
				reminders.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Carregando…"
				}),
				reminders.isError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-destructive",
					children: "Não foi possível carregar."
				}),
				!reminders.isPending && !reminders.isError && total === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Nada pendente. Crie lembretes pelo painel de um contato."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "max-h-80 space-y-3 overflow-y-auto",
					children: [
						"overdue",
						"today",
						"upcoming"
					].map((k) => groups[k].length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: cn("mb-1 text-[11px] font-semibold uppercase tracking-wide", k === "overdue" ? "text-destructive" : "text-muted-foreground"),
						children: LABEL[k]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-1.5",
						children: groups[k].map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-start gap-2 rounded-2xl bg-secondary px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "min-w-0 flex-1 text-left",
								onClick: () => void openChat(r.contact_id),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block truncate text-sm font-medium",
										children: r.contact.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block break-words text-xs text-muted-foreground",
										children: r.description
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "block text-[11px] text-muted-foreground",
										children: [formatDue(r.due_at), owner(r.assigned_to) ? ` · ${owner(r.assigned_to)}` : ""]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "icon",
								variant: "ghost",
								className: "h-8 w-8 rounded-full",
								"aria-label": "Concluir lembrete",
								onClick: () => void done(r.id),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" })
							})]
						}, r.id))
					})] }, k))
				})
			]
		})]
	});
}
async function authHeader() {
	const { data } = await getInboxClient().auth.getSession();
	const token = data.session?.access_token;
	return token ? { Authorization: `Bearer ${token}` } : {};
}
async function inboxApi(path, body, method = "POST") {
	try {
		const res = await fetch(path, {
			method,
			headers: {
				"content-type": "application/json",
				...await authHeader()
			},
			...method === "POST" ? { body: JSON.stringify(body ?? {}) } : {}
		});
		const json = await res.json().catch(() => null);
		if (!res.ok || !json) return {
			ok: false,
			error: json?.error ?? `O servidor respondeu com erro (${res.status}).`,
			...json?.code ? { code: json.code } : {}
		};
		return {
			ok: true,
			...json
		};
	} catch {
		return {
			ok: false,
			error: "Não foi possível falar com o servidor. Verifique sua internet e tente de novo.",
			code: "network"
		};
	}
}
/** Grava como pendente e pede o envio. Devolve o id da mensagem mesmo se o envio falhar (ela fica visível como falha). */
async function queueAndSend(p) {
	const text = p.body.trim();
	if (!text) return {
		messageId: null,
		result: {
			ok: false,
			error: "Escreva a mensagem."
		}
	};
	const ins = await db.from("messages").insert({
		conversation_id: p.conversationId,
		direction: "out",
		type: "text",
		body: text,
		status: "pending",
		sent_by: p.userId,
		client_token: crypto.randomUUID(),
		reply_to_id: p.replyToId
	}).select("id").single();
	if (ins.error || !ins.data) return {
		messageId: null,
		result: {
			ok: false,
			error: "Não foi possível registrar a mensagem. Tente de novo."
		}
	};
	return {
		messageId: ins.data.id,
		result: await inboxApi("/api/inbox/send", { messageId: ins.data.id })
	};
}
/** Tenta de novo uma mensagem que falhou ou ficou sem confirmação. */
function retrySend(messageId) {
	return inboxApi("/api/inbox/send", {
		messageId,
		retry: true
	});
}
/** Fora da janela de 24h: só modelo aprovado pela Meta. */
async function queueAndSendTemplate(p) {
	const name = p.name.trim();
	if (!name) return {
		messageId: null,
		result: {
			ok: false,
			error: "Informe o nome do modelo aprovado."
		}
	};
	const ins = await db.from("messages").insert({
		conversation_id: p.conversationId,
		direction: "out",
		type: "template",
		body: `Modelo aprovado: ${name}${p.variables.length ? ` (${p.variables.join(", ")})` : ""}`,
		status: "pending",
		sent_by: p.userId,
		client_token: crypto.randomUUID()
	}).select("id").single();
	if (ins.error || !ins.data) return {
		messageId: null,
		result: {
			ok: false,
			error: "Não foi possível registrar a mensagem. Tente de novo."
		}
	};
	return {
		messageId: ins.data.id,
		result: await inboxApi("/api/inbox/send", {
			messageId: ins.data.id,
			template: {
				name,
				language: p.language.trim() || "pt_BR",
				variables: p.variables
			}
		})
	};
}
async function fetchChannelStatus() {
	const r = await inboxApi("/api/inbox/status", void 0, "GET");
	if (!r.ok) throw new Error(r.error);
	return r.status;
}
/** URL assinada, de curta duração, para ver mídia de uma mensagem (só membros). */
async function fetchMediaUrl(messageId) {
	return inboxApi("/api/inbox/media", { messageId });
}
/** Estado real dos canais (WhatsApp e IA), vindo do backend. Nunca assume "conectado" sem confirmação. */
function useChannelStatus() {
	return useQuery({
		queryKey: ["inbox", "channel-status"],
		queryFn: fetchChannelStatus,
		staleTime: 6e4,
		retry: 1
	});
}
function whatsappChip(status) {
	if (status.isPending) return {
		label: "Verificando WhatsApp…",
		hint: "Consultando o servidor.",
		dot: "bg-muted-foreground/40"
	};
	if (status.isError) return {
		label: "WhatsApp: sem verificação",
		hint: "Não foi possível consultar o servidor sobre o WhatsApp.",
		dot: "bg-highlight ring-1 ring-black/10"
	};
	const w = status.data.whatsapp;
	if (!w.configured) return {
		label: "WhatsApp não conectado",
		hint: `Faltam variáveis no servidor: ${w.missing.join(", ")}.`,
		dot: "bg-highlight ring-1 ring-black/10"
	};
	if (w.reachable === false) return {
		label: "WhatsApp com erro",
		hint: w.error ?? "A Meta recusou as credenciais.",
		dot: "bg-destructive"
	};
	if (w.reachable === true) return {
		label: `WhatsApp conectado${w.phone ? ` (${w.phone})` : ""}`,
		hint: w.verifiedName ? `Conta: ${w.verifiedName}` : "Credenciais confirmadas pela Meta.",
		dot: "bg-green-500"
	};
	return {
		label: "WhatsApp configurado",
		hint: "Credenciais presentes; conexão ainda não confirmada.",
		dot: "bg-highlight ring-1 ring-black/10"
	};
}
function WhatsAppStatus() {
	const chip = whatsappChip(useChannelStatus());
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "inbox-surface hidden items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium text-muted-foreground lg:flex",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("h-2.5 w-2.5 rounded-full", chip.dot) }), chip.label]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipContent, { children: chip.hint })] });
}
/** Só aparece quando o tempo real caiu: a tela segue atualizando a cada 15s. */
function RealtimeOffline() {
	if (useRealtimeState() !== "offline") return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "inbox-surface flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium text-muted-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2.5 w-2.5 rounded-full bg-highlight ring-1 ring-black/10" }), "Atualização em tempo real offline"]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipContent, { children: "Reconectando. Enquanto isso, a tela consulta o banco a cada 15 segundos." })] });
}
function PageHeader({ title, subtitle, search, action }) {
	const profile = useInboxProfile();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "inbox-surface flex shrink-0 flex-wrap items-center gap-x-4 gap-y-3 rounded-[2rem] px-5 py-4 sm:px-7",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-[13rem] flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "truncate font-display text-xl font-semibold tracking-tight sm:text-2xl",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-sm text-muted-foreground",
					children: subtitle
				})]
			}),
			search && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "relative order-last w-full sm:order-none sm:w-64",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "sr-only",
						children: "Buscar"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "search",
						value: search.value,
						onChange: (e) => search.onChange(e.target.value),
						placeholder: search.placeholder ?? "Buscar",
						className: "h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RealtimeOffline, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatsAppStatus, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RemindersPopover, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserAvatar, {
				name: profile.full_name,
				src: profile.avatar_url,
				className: "hidden sm:flex"
			}),
			action
		]
	});
}
//#endregion
export { reminderBucket as C, setOpportunityOwner as D, setContactStage as E, setReminderStatus as O, queueAndSendTemplate as S, saveContact as T, isoToLocalInput as _, PopoverTrigger as a, openConversationFor as b, ensureOpportunity as c, fetchMediaUrl as d, fetchOpportunities as f, inboxApi as g, formatPhone as h, PopoverContent as i, useChannelStatus as k, fetchContactStage as l, formatDue as m, PageHeader as n, createReminder as o, fetchPendingReminders as p, Popover as r, deleteOpportunity as s, InboxUserError as t, fetchContacts as u, localInputToIso as v, retrySend as w, queueAndSend as x, moveOpportunity as y };
