import { t as db } from "./client-Ba0sJm8H.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/templates-BjyxYjwj.js
async function fetchQuickReplies() {
	const { data, error } = await db.from("quick_replies").select("id, category, title, body, updated_at").order("category").order("title");
	if (error) throw error;
	return data ?? [];
}
async function saveQuickReply(input, userId, id) {
	const title = input.title.trim();
	const body = input.body.trim();
	if (!title || !body) throw new Error("Preencha título e texto.");
	if (id) {
		const { error } = await db.from("quick_replies").update({
			category: input.category,
			title,
			body
		}).eq("id", id);
		if (error) throw error;
	} else {
		const { error } = await db.from("quick_replies").insert({
			category: input.category,
			title,
			body,
			created_by: userId
		});
		if (error) throw error;
	}
}
async function deleteQuickReply(id) {
	const { error } = await db.from("quick_replies").delete().eq("id", id);
	if (error) throw error;
}
/**
* Respostas rápidas aceitam {nome} (primeiro nome do contato). O texto continua editável antes de enviar.
* Sem imports, para ser testada sozinha.
*/
function firstName(fullName) {
	const t = (fullName ?? "").trim();
	if (!t || t.startsWith("+") || /^\d/.test(t)) return "";
	return t.split(/\s+/)[0] ?? "";
}
function renderQuickReply(body, contactName) {
	const name = firstName(contactName);
	const withName = body.replace(/\{nome\}/gi, name);
	if (name) return withName;
	return withName.replace(/\s*,\s*(?=[!.?]|$)/g, "").replace(/[ \t]+([!.?,])/g, "$1").replace(/[ \t]{2,}/g, " ").replace(/[ \t]+$/gm, "").trim();
}
var QUICK_REPLY_CATEGORIES = [
	"primeiro_contato",
	"apresentacao",
	"servicos",
	"google_meet",
	"propostas",
	"acompanhamento",
	"agradecimento"
];
var QUICK_REPLY_LABEL = {
	primeiro_contato: "Primeiro contato",
	apresentacao: "Apresentação",
	servicos: "Serviços",
	google_meet: "Google Meet",
	propostas: "Propostas",
	acompanhamento: "Acompanhamento",
	agradecimento: "Agradecimento"
};
//#endregion
export { renderQuickReply as a, fetchQuickReplies as i, QUICK_REPLY_LABEL as n, saveQuickReply as o, deleteQuickReply as r, QUICK_REPLY_CATEGORIES as t };
