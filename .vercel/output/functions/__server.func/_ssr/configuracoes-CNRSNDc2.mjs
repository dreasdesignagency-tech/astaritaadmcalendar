import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-CeGigu7E.mjs";
import { R as Check, j as Circle } from "../_libs/lucide-react.mjs";
import { t as db } from "./client-Ba0sJm8H.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { o as UserAvatar, p as useInboxProfile, u as fetchTeam } from "./profile-context-xvvqmyQ6.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { k as useChannelStatus, n as PageHeader } from "./PageHeader-tdFIi3k3.mjs";
import { t as Textarea } from "./textarea-kko37XEX.mjs";
import { n as ROLE_LABEL } from "./types-QwviL-wI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/configuracoes-CNRSNDc2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Dicas do que escrever em cada seção. Nada é preenchido por nós: valores e condições vêm da Astarita. */
var KNOWLEDGE_HINTS = {
	apresentacao: "Quem é a Astarita, em poucas linhas.",
	servicos: "O que a Astarita faz, um serviço por linha, com uma frase de explicação.",
	diferenciais: "O que torna o trabalho da Astarita diferente.",
	metodologia: "Como o trabalho acontece, do primeiro contato à entrega.",
	tom_de_voz: "Como a Astarita fala com clientes. Pode incluir o que evitar.",
	faq: "Perguntas frequentes e as respostas aprovadas. Uma por bloco.",
	condicoes_comerciais: "Prazos, formas de pagamento, o que está incluído. A IA só cita o que estiver aqui.",
	respostas_aprovadas: "Textos prontos que a equipe já aprovou e quer ver reaproveitados."
};
var ORDER = Object.keys(KNOWLEDGE_HINTS);
async function fetchKnowledge() {
	const { data, error } = await db.from("knowledge_base").select("id, section, title, content, updated_at");
	if (error) throw error;
	return [...data].sort((a, b) => ORDER.indexOf(a.section) - ORDER.indexOf(b.section));
}
async function saveKnowledge(id, content, userId) {
	const { error } = await db.from("knowledge_base").update({
		content,
		updated_by: userId
	}).eq("id", id);
	if (error) throw error;
}
function Section({ row }) {
	const me = useInboxProfile();
	const qc = useQueryClient();
	const [text, setText] = (0, import_react.useState)(row.content);
	(0, import_react.useEffect)(() => setText(row.content), [row.content]);
	const dirty = text !== row.content;
	const save = useMutation({
		mutationFn: () => saveKnowledge(row.id, text, me.id),
		onSuccess: async () => {
			await qc.invalidateQueries({ queryKey: ["inbox", "knowledge"] });
			toast.success(`${row.title} salvo.`);
		},
		onError: () => toast.error("Não foi possível salvar. Tente de novo.")
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				htmlFor: `kb-${row.section}`,
				className: "block text-sm font-medium",
				children: row.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: KNOWLEDGE_HINTS[row.section]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				id: `kb-${row.section}`,
				value: text,
				onChange: (e) => setText(e.target.value),
				maxLength: 8e3,
				className: "min-h-24 rounded-2xl text-sm",
				placeholder: "Ainda vazio. A IA não inventa o que não estiver escrito aqui."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-end",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					className: "rounded-full",
					"aria-label": `Salvar ${row.title}`,
					disabled: !dirty || save.isPending,
					onClick: () => save.mutate(),
					children: save.isPending ? "Salvando…" : "Salvar"
				})
			})
		]
	});
}
/** Base de conhecimento que o Assistente Astarita usa. Quem escreve é a equipe; nada vem preenchido por nós. */
function KnowledgeEditor() {
	const q = useQuery({
		queryKey: ["inbox", "knowledge"],
		queryFn: fetchKnowledge
	});
	if (q.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted-foreground",
		children: "Carregando…"
	});
	if (q.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-destructive",
			children: "Não foi possível carregar a base de conhecimento."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "outline",
			size: "sm",
			className: "mt-2 rounded-full",
			onClick: () => void q.refetch(),
			children: "Tentar de novo"
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-5",
		children: q.data.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, { row }, row.id))
	});
}
function Status({ ok, label, detail }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex items-start gap-3 rounded-2xl bg-secondary px-4 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${ok ? "bg-primary text-primary-foreground" : "bg-highlight ring-1 ring-black/10"}`,
			children: ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3 w-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "h-2 w-2 fill-current" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-sm font-medium",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-xs text-muted-foreground",
			children: detail
		})] })]
	});
}
function SettingsPage() {
	const team = useQuery({
		queryKey: ["inbox", "team"],
		queryFn: fetchTeam
	});
	const channel = useChannelStatus();
	const wa = channel.data?.whatsapp;
	const ai = channel.data?.ai;
	const waDetail = channel.isPending ? "Verificando…" : channel.isError || !wa ? "Não foi possível verificar agora." : !wa.configured ? `Não conectado. Falta configurar no servidor: ${wa.missing.join(", ")}.` : wa.reachable === true ? `Conectado${wa.phone ? ` ao número ${wa.phone}` : ""}${wa.verifiedName ? ` (${wa.verifiedName})` : ""}.` : `Configurado, mas a Meta não respondeu com essas credenciais${wa.error ? `: ${wa.error}` : "."}`;
	const aiDetail = channel.isPending ? "Verificando…" : channel.isError || !ai ? "Não foi possível verificar agora." : ai.configured ? `Ligado (${ai.provider}, modelo ${ai.model}). A IA só sugere; você revisa e envia.` : `Não ligado. Falta configurar no servidor: ${ai.missing.join(", ")}.`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		title: "Configurações",
		subtitle: "Equipe, conexões e conhecimento"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid min-h-0 flex-1 gap-3 overflow-y-auto sm:gap-4 lg:grid-cols-2 lg:overflow-visible",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "inbox-surface rounded-[2rem] p-5 sm:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-3 font-display text-base font-semibold",
						children: "Equipe com acesso"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "space-y-2",
						children: [
							team.data?.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserAvatar, {
										name: p.full_name,
										src: p.avatar_url
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-sm font-medium",
											children: p.full_name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-xs text-muted-foreground",
											children: ROLE_LABEL[p.role]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-muted-foreground",
										children: p.active ? "Ativo" : "Inativo"
									})
								]
							}, p.id)),
							team.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "text-sm text-muted-foreground",
								children: "Carregando…"
							}),
							team.isError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "text-sm text-destructive",
								children: "Não foi possível carregar a equipe."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs text-muted-foreground",
						children: "Não há cadastro público. Novos acessos são criados só por quem administra o projeto."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "inbox-surface rounded-[2rem] p-5 sm:p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-3 font-display text-base font-semibold",
					children: "Conexões"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Status, {
						ok: !!wa?.configured && wa.reachable === true,
						label: "WhatsApp Business Platform",
						detail: waDetail
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Status, {
						ok: !!ai?.configured,
						label: "Assistente de IA",
						detail: aiDetail
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "inbox-surface rounded-[2rem] p-5 sm:p-6 lg:col-span-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-1 font-display text-base font-semibold",
						children: "Conhecimento da Astarita"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-4 text-xs text-muted-foreground",
						children: "É daqui que o Assistente tira as informações. O que ficar em branco, ele não inventa."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KnowledgeEditor, {})
				]
			})
		]
	})] });
}
//#endregion
export { SettingsPage as component };
