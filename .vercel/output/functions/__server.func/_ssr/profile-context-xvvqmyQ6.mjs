import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { n as getInboxClient, t as db } from "./client-Ba0sJm8H.mjs";
import { i as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { n as AvatarFallback$1, r as AvatarImage$1, t as Avatar$1 } from "../_libs/radix-ui__react-avatar.mjs";
import { a as Trigger, i as Root3, n as Portal, r as Provider, t as Content2 } from "../_libs/radix-ui__react-tooltip.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-context-xvvqmyQ6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Postgres 42P01 / PostgREST PGRST205: a migration do Inbox ainda não foi aplicada. */
function isMissingSchemaError(error) {
	const e = error;
	return e?.code === "42P01" || e?.code === "PGRST205" || /schema cache|does not exist/i.test(e?.message ?? "");
}
async function fetchMyProfile(userId) {
	const { data, error } = await db.from("profiles").select("id, full_name, role, avatar_url, active").eq("id", userId).maybeSingle();
	if (error) throw error;
	return data ?? null;
}
async function fetchTeam() {
	const { data, error } = await db.from("profiles").select("id, full_name, role, avatar_url, active").order("full_name");
	if (error) throw error;
	return data ?? [];
}
async function fetchConversations() {
	const { data, error } = await db.from("conversations").select("id, status, assigned_to, unread_count, last_message_at, last_message_preview, last_inbound_at, updated_at, contact:contacts!inner(id, name, phone, company, instagram, category, notes, assigned_to)").order("last_message_at", {
		ascending: false,
		nullsFirst: false
	}).limit(200);
	if (error) throw error;
	return data ?? [];
}
async function fetchPipelineStages() {
	const { data, error } = await db.from("pipeline_stages").select("id, slug, name, position, is_won, is_lost").order("position");
	if (error) throw error;
	return data ?? [];
}
var state = "connecting";
var listeners = /* @__PURE__ */ new Set();
var setState = (next) => {
	if (state === next) return;
	state = next;
	listeners.forEach((l) => l());
};
function useRealtimeState() {
	return (0, import_react.useSyncExternalStore)((l) => {
		listeners.add(l);
		return () => listeners.delete(l);
	}, () => state, () => "connecting");
}
/** Intervalo de segurança: se o tempo real cair, a tela volta a consultar a cada 15s. */
function useFallbackInterval() {
	return useRealtimeState() === "connected" ? false : 15e3;
}
var WATCHED = [
	"conversations",
	"messages",
	"contacts",
	"contact_tags",
	"tags"
];
/** Monta a assinatura uma vez, no layout do Inbox. */
function useInboxRealtime(userId) {
	const queryClient = useQueryClient();
	(0, import_react.useEffect)(() => {
		let timer;
		let wasDown = false;
		const refresh = () => {
			clearTimeout(timer);
			timer = setTimeout(() => void queryClient.invalidateQueries({ queryKey: ["inbox"] }), 250);
		};
		const supabase = getInboxClient();
		let channel = supabase.channel(`inbox-${userId}`);
		for (const table of WATCHED) channel = channel.on("postgres_changes", {
			event: "*",
			schema: "public",
			table
		}, refresh);
		channel.subscribe((status) => {
			if (status === "SUBSCRIBED") {
				setState("connected");
				if (wasDown) refresh();
				wasDown = false;
			} else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
				wasDown = true;
				setState("offline");
			}
		});
		return () => {
			clearTimeout(timer);
			setState("connecting");
			supabase.removeChannel(channel);
		};
	}, [queryClient, userId]);
}
var Avatar = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar$1, {
	ref,
	className: cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className),
	...props
}));
Avatar.displayName = Avatar$1.displayName;
var AvatarImage = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage$1, {
	ref,
	className: cn("aspect-square h-full w-full", className),
	...props
}));
AvatarImage.displayName = AvatarImage$1.displayName;
var AvatarFallback = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback$1, {
	ref,
	className: cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className),
	...props
}));
AvatarFallback.displayName = AvatarFallback$1.displayName;
function initials(name) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	return ((parts[0]?.charAt(0) ?? "") + (parts.length > 1 ? parts[parts.length - 1]?.charAt(0) ?? "" : "")).toUpperCase();
}
function UserAvatar({ name, src, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
		className: cn("h-10 w-10", className),
		children: [src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, {
			src,
			alt: name
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
			className: "bg-accent text-xs font-semibold text-accent-foreground",
			children: initials(name)
		})]
	});
}
var TooltipProvider = Provider;
var Tooltip = Root3;
var TooltipTrigger = Trigger;
var TooltipContent = import_react.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	sideOffset,
	className: cn("z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-tooltip-content-transform-origin)", className),
	...props
}) }));
TooltipContent.displayName = Content2.displayName;
var ProfileContext = (0, import_react.createContext)(null);
var InboxProfileProvider = ProfileContext.Provider;
function useInboxProfile() {
	const profile = (0, import_react.useContext)(ProfileContext);
	if (!profile) throw new Error("useInboxProfile precisa estar dentro de InboxProfileProvider");
	return profile;
}
//#endregion
export { TooltipTrigger as a, fetchMyProfile as c, isMissingSchemaError as d, useFallbackInterval as f, useRealtimeState as h, TooltipProvider as i, fetchPipelineStages as l, useInboxRealtime as m, Tooltip as n, UserAvatar as o, useInboxProfile as p, TooltipContent as r, fetchConversations as s, InboxProfileProvider as t, fetchTeam as u };
