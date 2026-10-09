import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { d as Outlet, g as useNavigate, h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Button } from "./button-CeGigu7E.mjs";
import { B as CalendarDays, E as DatabaseZap, U as Asterisk, a as Users, b as MessageSquareText, c as ShieldAlert, k as Columns3, l as Settings, r as WifiOff, t as Zap, x as LogOut } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { a as TooltipTrigger, c as fetchMyProfile, d as isMissingSchemaError, i as TooltipProvider, m as useInboxRealtime, n as Tooltip, o as UserAvatar, p as useInboxProfile, r as TooltipContent, t as InboxProfileProvider } from "./profile-context-xvvqmyQ6.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as ROLE_LABEL } from "./types-QwviL-wI.mjs";
import { t as EmptyState } from "./EmptyState-V_MCyutM.mjs";
import { t as InboxScreen } from "./InboxScreen-cpJnJmz3.mjs";
import { a as inboxSignOut, o as useInboxAuth } from "./auth-CcD_m8JY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-DTRybKa2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var nav = [
	{
		to: "/inbox",
		label: "Caixa de entrada",
		icon: MessageSquareText,
		exact: true
	},
	{
		to: "/inbox/contatos",
		label: "Contatos",
		icon: Users,
		exact: false
	},
	{
		to: "/inbox/funil",
		label: "Funil comercial",
		icon: Columns3,
		exact: false
	},
	{
		to: "/inbox/respostas",
		label: "Respostas rápidas",
		icon: Zap,
		exact: false
	},
	{
		to: "/inbox/configuracoes",
		label: "Configurações",
		icon: Settings,
		exact: false
	}
];
var itemClass = "flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
function Hint({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger, {
		asChild: true,
		children
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipContent, {
		side: "right",
		children: label
	})] });
}
function InboxShell({ children }) {
	const profile = useInboxProfile();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const leave = async () => {
		await queryClient.cancelQueries({ queryKey: ["inbox"] });
		queryClient.removeQueries({ queryKey: ["inbox"] });
		await inboxSignOut();
		toast.success("Você saiu do Inbox.");
		navigate({
			to: "/inbox/entrar",
			replace: true
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipProvider, {
		delayDuration: 150,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "inbox-theme fixed inset-0 flex gap-3 overflow-hidden bg-background p-3 sm:gap-4 sm:p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "inbox-surface hidden w-[72px] shrink-0 flex-col items-center rounded-[2rem] py-5 md:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/inbox",
						"aria-label": "Astarita Inbox",
						className: "mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Asterisk, {
							className: "h-6 w-6",
							strokeWidth: 2.5
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "flex flex-col items-center gap-1.5 rounded-full bg-secondary p-1.5",
						"aria-label": "Principal",
						children: nav.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, {
							label: item.label,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: item.to,
								activeOptions: { exact: item.exact },
								className: itemClass,
								activeProps: { className: "bg-accent text-primary" },
								"aria-label": item.label,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "h-5 w-5" })
							})
						}, item.to))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-auto flex flex-col items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, {
								label: "Calendário de conteúdo",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/",
									className: itemClass,
									"aria-label": "Calendário de conteúdo",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "h-5 w-5" })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, {
								label: "Sair",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: leave,
									className: itemClass,
									"aria-label": "Sair",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-5 w-5" })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, {
								label: `${profile.full_name} · ${ROLE_LABEL[profile.role]}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserAvatar, {
									name: profile.full_name,
									src: profile.avatar_url,
									className: "h-10 w-10"
								}) })
							})
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 flex-1 flex-col gap-3 sm:gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					className: "inbox-surface flex shrink-0 items-center justify-between rounded-full px-2 py-1.5 md:hidden",
					"aria-label": "Principal",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Asterisk, {
								className: "h-5 w-5",
								strokeWidth: 2.5
							})
						}),
						nav.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: item.to,
							activeOptions: { exact: item.exact },
							className: cn(itemClass, "h-10 w-10"),
							activeProps: { className: "bg-accent text-primary" },
							"aria-label": item.label,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "h-5 w-5" })
						}, item.to)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: leave,
							className: cn(itemClass, "h-10 w-10"),
							"aria-label": "Sair",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-5 w-5" })
						})
					]
				}), children]
			})]
		})
	});
}
/**
* Área protegida do Inbox: exige login no projeto do Inbox (não no do calendário)
* e um perfil ativo em public.profiles.
*/
function Loading() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "inbox-theme fixed inset-0 flex items-center justify-center bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-primary text-primary-foreground",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Asterisk, {
				className: "h-7 w-7",
				strokeWidth: 2.5
			})
		})
	});
}
/** Liga o Supabase Realtime enquanto o Inbox estiver aberto. */
function RealtimeBridge({ userId }) {
	useInboxRealtime(userId);
	return null;
}
function InboxAppLayout() {
	const { ready, user } = useInboxAuth();
	const navigate = useNavigate();
	const userId = user?.id ?? "";
	(0, import_react.useEffect)(() => {
		if (ready && !user) navigate({
			to: "/inbox/entrar",
			replace: true
		});
	}, [
		ready,
		user,
		navigate
	]);
	const profileQuery = useQuery({
		queryKey: [
			"inbox",
			"profile",
			userId
		],
		queryFn: () => fetchMyProfile(userId),
		enabled: !!userId,
		retry: false
	});
	if (!ready || !user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, {});
	if (profileQuery.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, {});
	if (profileQuery.isError) {
		const missing = isMissingSchemaError(profileQuery.error);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(InboxScreen, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			tone: "error",
			icon: missing ? DatabaseZap : WifiOff,
			title: missing ? "O banco do Inbox não tem as tabelas esperadas" : "Não foi possível conectar",
			children: missing ? "Confira se as variáveis VITE_INBOX_* apontam para o projeto Supabase Astarita Inbox." : "Verifique sua internet e tente de novo."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex justify-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "rounded-full",
				onClick: () => void profileQuery.refetch(),
				children: "Tentar de novo"
			})
		})] });
	}
	const profile = profileQuery.data;
	if (!profile || !profile.active) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(InboxScreen, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(EmptyState, {
		icon: ShieldAlert,
		title: "Acesso restrito",
		children: [
			"O Astarita Inbox é privado. Esta conta (",
			user.email,
			") não está autorizada. Peça acesso a quem administra o sistema."
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "outline",
			className: "rounded-full",
			onClick: () => void inboxSignOut(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "mr-2 h-4 w-4" }), " Sair"]
		})
	})] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(InboxProfileProvider, {
		value: profile,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RealtimeBridge, { userId: profile.id }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InboxShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) })]
	});
}
//#endregion
export { InboxAppLayout as component };
