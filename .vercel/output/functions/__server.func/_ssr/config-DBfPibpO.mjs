//#region node_modules/.nitro/vite/services/ssr/assets/config-DBfPibpO.js
var INBOX_URL_VAR = "VITE_INBOX_SUPABASE_URL";
var INBOX_KEY_VAR = "VITE_INBOX_SUPABASE_PUBLISHABLE_KEY";
/** Detecta chave de serviço (secreta) para nunca deixá-la chegar ao navegador. */
function looksLikeSecretKey(key) {
	if (key.startsWith("sb_secret_")) return true;
	const parts = key.split(".");
	if (parts.length === 3 && parts[1]) try {
		const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
		return JSON.parse(atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "="))).role === "service_role";
	} catch {
		return false;
	}
	return false;
}
function hostOf(url) {
	try {
		return new URL(url).host.toLowerCase();
	} catch {
		return null;
	}
}
function readInboxConfig(env) {
	const url = env.inboxUrl?.trim() ?? "";
	const key = env.inboxKey?.trim() ?? "";
	const missing = [!url && "VITE_INBOX_SUPABASE_URL", !key && "VITE_INBOX_SUPABASE_PUBLISHABLE_KEY"].filter((v) => !!v);
	if (missing.length) return {
		ok: false,
		reason: "missing",
		missing
	};
	const host = hostOf(url);
	if (!host) return {
		ok: false,
		reason: "invalid",
		message: `${INBOX_URL_VAR} não é uma URL válida.`
	};
	if (!(host.startsWith("127.0.0.1") || host.startsWith("localhost")) && !url.startsWith("https://")) return {
		ok: false,
		reason: "invalid",
		message: `${INBOX_URL_VAR} precisa começar com https://.`
	};
	if (looksLikeSecretKey(key)) return {
		ok: false,
		reason: "invalid",
		message: `${INBOX_KEY_VAR} contém uma chave secreta (service role). Use somente a chave publicável (anon/publishable).`
	};
	const calendarHost = env.calendarUrl ? hostOf(env.calendarUrl) : null;
	if (calendarHost && calendarHost === host) return {
		ok: false,
		reason: "invalid",
		message: `${INBOX_URL_VAR} aponta para o mesmo projeto do calendário. O Inbox usa um projeto Supabase próprio.`
	};
	return {
		ok: true,
		url: url.replace(/\/+$/, ""),
		key
	};
}
/**
* Valores PÚBLICOS do projeto Astarita Inbox. A URL e a chave publicável (sb_publishable_) são feitas para ir no navegador
* de qualquer usuário; quem protege os dados é a RLS. Usados só em build de produção, quando as variáveis não foram definidas.
* Nunca colocar aqui a service role.
*/
var PUBLIC_INBOX_PROJECT = {
	url: "https://yappbzpayqejqpkfebho.supabase.co",
	key: "sb_publishable_hexMlR3tMeRXkupSt8qZrQ_c9RYQbJl"
};
//#endregion
export { readInboxConfig as n, PUBLIC_INBOX_PROJECT as t };
