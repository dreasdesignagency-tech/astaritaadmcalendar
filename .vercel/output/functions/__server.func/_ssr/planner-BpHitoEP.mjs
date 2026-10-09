import { t as supabase } from "./client-Bxc8_G9k.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/planner-BpHitoEP.js
var FUNNEL_STAGES = [
	"topo",
	"meio",
	"fundo"
];
var FUNNEL_LABEL = {
	topo: "Topo",
	meio: "Meio",
	fundo: "Fundo"
};
var FUNNEL_CLASSES = {
	topo: {
		dot: "bg-topo",
		block: "bg-topo-soft border-topo/40 text-topo",
		bar: "bg-topo"
	},
	meio: {
		dot: "bg-meio",
		block: "bg-meio-soft border-meio/40 text-meio",
		bar: "bg-meio"
	},
	fundo: {
		dot: "bg-fundo",
		block: "bg-fundo-soft border-fundo/40 text-fundo",
		bar: "bg-fundo"
	}
};
var FORMATS = [
	"Reel",
	"Carrossel",
	"Post estático",
	"Stories",
	"Vídeo",
	"Outro"
];
var STATUSES = [
	"Ideia",
	"Planejado",
	"Em produção",
	"Aguardando aprovação",
	"Aprovado",
	"Agendado",
	"Publicado"
];
/** Cores disponíveis para marcar um conteúdo no calendário. */
var CONTENT_COLORS = [
	"#0805f1",
	"#2563eb",
	"#0ea5e9",
	"#10b981",
	"#f59e0b",
	"#ef4444",
	"#ec4899",
	"#8b5cf6",
	"#64748b",
	"#111827"
];
async function fetchClients() {
	const { data, error } = await supabase.from("clients").select("*").order("name");
	if (error) throw error;
	return data ?? [];
}
async function fetchContents(monthStart, monthEnd) {
	const { data, error } = await supabase.from("contents").select("id, client_id, title, publication_date, funnel_stage, format, status, color").gte("publication_date", monthStart).lte("publication_date", monthEnd).order("publication_date");
	if (error) throw error;
	return data ?? [];
}
var MONTHS = [
	"Janeiro",
	"Fevereiro",
	"Março",
	"Abril",
	"Maio",
	"Junho",
	"Julho",
	"Agosto",
	"Setembro",
	"Outubro",
	"Novembro",
	"Dezembro"
];
var WEEKDAYS = [
	"SEG",
	"TER",
	"QUA",
	"QUI",
	"SEX",
	"SÁB",
	"DOM"
];
function iso(year, month, day) {
	return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
/** Data de hoje no fuso horário do Brasil (America/Sao_Paulo). */
function todaySaoPaulo() {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: "America/Sao_Paulo",
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).formatToParts(/* @__PURE__ */ new Date());
	const get = (type) => Number(parts.find((p) => p.type === type)?.value);
	return {
		year: get("year"),
		month: get("month") - 1,
		day: get("day")
	};
}
/** Escolhe texto claro ou escuro conforme o contraste com a cor de fundo. */
function contrastText(hex) {
	const clean = hex.replace("#", "");
	const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
	const r = parseInt(full.slice(0, 2), 16) || 0;
	const g = parseInt(full.slice(2, 4), 16) || 0;
	const b = parseInt(full.slice(4, 6), 16) || 0;
	return (.299 * r + .587 * g + .114 * b) / 255 > .6 ? "#1f2937" : "#ffffff";
}
/** Days of the grid, starting on Monday, with nulls for padding. */
function monthGrid(year, month) {
	const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
	const total = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
	const cells = Array.from({ length: offset }, () => null);
	for (let d = 1; d <= total; d++) cells.push(d);
	while (cells.length % 7 !== 0) cells.push(null);
	return cells;
}
//#endregion
export { FUNNEL_STAGES as a, WEEKDAYS as c, fetchContents as d, iso as f, FUNNEL_LABEL as i, contrastText as l, todaySaoPaulo as m, FORMATS as n, MONTHS as o, monthGrid as p, FUNNEL_CLASSES as r, STATUSES as s, CONTENT_COLORS as t, fetchClients as u };
