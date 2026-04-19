/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_APP_NAME?: string;
	readonly VITE_API_BASE_URL?: string;
	readonly VITE_API_PREFIX?: string;
	readonly VITE_HEALTH_PATH?: string;
	readonly VITE_AUTH_STORAGE_KEY?: string;
	readonly VITE_DEV_SERVER_PORT?: string;
	readonly VITE_API_PROXY_TARGET?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
