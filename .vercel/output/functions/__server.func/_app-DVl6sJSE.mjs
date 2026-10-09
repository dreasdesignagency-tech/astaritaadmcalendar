import { f as lazyRouteComponent, p as createFileRoute } from "./_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_app-DVl6sJSE.js
/**
* Janela de atendimento da Meta (WhatsApp Business Platform): mensagens livres só podem ser enviadas
* até 24 horas depois da última mensagem RECEBIDA do cliente. Depois disso, só modelos aprovados.
* Sem imports, para ser testada sozinha. O servidor aplica a mesma regra (a tela só avisa).
*/
var SERVICE_WINDOW_MS = 864e5;
function windowState(lastInboundAt, now = Date.now()) {
	if (!lastInboundAt) return {
		open: false,
		closesAt: null,
		msLeft: 0
	};
	const start = Date.parse(lastInboundAt);
	if (Number.isNaN(start)) return {
		open: false,
		closesAt: null,
		msLeft: 0
	};
	const closes = start + SERVICE_WINDOW_MS;
	return {
		open: now < closes,
		closesAt: new Date(closes),
		msLeft: Math.max(0, closes - now)
	};
}
/** "faltam 3 h 20 min" / "faltam 12 min" */
function formatTimeLeft(msLeft) {
	const totalMin = Math.floor(msLeft / 6e4);
	if (totalMin <= 0) return "menos de 1 min";
	const h = Math.floor(totalMin / 60);
	const m = totalMin % 60;
	return h > 0 ? `${h} h ${m} min` : `${m} min`;
}
var $$splitComponentImporter = () => import("./_app-D4sb3I7D.mjs");
var Route = createFileRoute("/inbox/_app/")({
	validateSearch: (search) => {
		const c = search["c"];
		return typeof c === "string" && c.length > 0 ? { c } : {};
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { formatTimeLeft as n, windowState as r, Route as t };
