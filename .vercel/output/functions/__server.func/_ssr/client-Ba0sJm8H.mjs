import { n as readInboxConfig, t as PUBLIC_INBOX_PROJECT } from "./config-DBfPibpO.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client-Ba0sJm8H.js
/**
* Cliente Supabase exclusivo do Inbox.
*
* - Variáveis próprias (VITE_INBOX_*), lidas só aqui.
* - Criado sob demanda, na primeira vez que o Inbox é usado. Quem abre só o calendário nunca o cria,
*   então a falta destas variáveis não afeta o calendário.
* - Sessão guardada em localStorage com chave própria. Não usa o armazenamento intermediado do
*   calendário (que repassa a sessão ao editor do Lovable) e nunca lê a sessão do calendário.
* - Não importa nada de @/integrations/supabase: os dois mundos ficam separados.
*/
var INBOX_STORAGE_KEY = "astarita-inbox-auth";
function getInboxConfig() {
	return readInboxConfig({
		inboxUrl: {
			"BASE_URL": "/",
			"DEV": false,
			"MODE": "production",
			"PROD": true,
			"SSR": true,
			"TSS_DEV_SERVER": "false",
			"TSS_DEV_SSR_STYLES_BASEPATH": "/",
			"TSS_DEV_SSR_STYLES_ENABLED": "true",
			"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
			"TSS_INLINE_CSS_ENABLED": "false",
			"TSS_ROUTER_BASEPATH": "",
			"TSS_SERVER_FN_BASE": "/_serverFn/"
		}["VITE_INBOX_SUPABASE_URL"] || PUBLIC_INBOX_PROJECT.url,
		inboxKey: {
			"BASE_URL": "/",
			"DEV": false,
			"MODE": "production",
			"PROD": true,
			"SSR": true,
			"TSS_DEV_SERVER": "false",
			"TSS_DEV_SSR_STYLES_BASEPATH": "/",
			"TSS_DEV_SSR_STYLES_ENABLED": "true",
			"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
			"TSS_INLINE_CSS_ENABLED": "false",
			"TSS_ROUTER_BASEPATH": "",
			"TSS_SERVER_FN_BASE": "/_serverFn/"
		}["VITE_INBOX_SUPABASE_PUBLISHABLE_KEY"] || PUBLIC_INBOX_PROJECT.key,
		calendarUrl: {
			"BASE_URL": "/",
			"DEV": false,
			"MODE": "production",
			"PROD": true,
			"SSR": true,
			"TSS_DEV_SERVER": "false",
			"TSS_DEV_SSR_STYLES_BASEPATH": "/",
			"TSS_DEV_SSR_STYLES_ENABLED": "true",
			"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
			"TSS_INLINE_CSS_ENABLED": "false",
			"TSS_ROUTER_BASEPATH": "",
			"TSS_SERVER_FN_BASE": "/_serverFn/"
		}["VITE_SUPABASE_URL"]
	});
}
var InboxNotConfiguredError = class extends Error {
	config;
	constructor(config) {
		super("Inbox não configurado");
		this.config = config;
	}
};
var client;
function getInboxClient() {
	if (client) return client;
	const config = getInboxConfig();
	if (!config.ok) throw new InboxNotConfiguredError(config);
	client = createClient(config.url, config.key, { auth: {
		storageKey: INBOX_STORAGE_KEY,
		storage: typeof window === "undefined" ? void 0 : window.localStorage,
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: true
	} });
	return client;
}
/** Atalho para consultas: resolve o cliente só quando alguma consulta de fato roda. */
var db = new Proxy({}, { get(_, prop, receiver) {
	return Reflect.get(getInboxClient(), prop, receiver);
} });
//#endregion
export { getInboxClient as n, getInboxConfig as r, db as t };
