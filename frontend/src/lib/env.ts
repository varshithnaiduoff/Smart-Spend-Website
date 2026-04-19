const trimSlash = (value: string) => value.replace(/\/+$/, "");

const rawApiPrefix = import.meta.env.VITE_API_PREFIX?.trim() || "/api";

export const env = {
  appName: import.meta.env.VITE_APP_NAME?.trim() || "Smart Spend",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL?.trim() || "",
  apiPrefix: rawApiPrefix.startsWith("/") ? rawApiPrefix : `/${rawApiPrefix}`,
  healthPath: import.meta.env.VITE_HEALTH_PATH?.trim() || "/health",
  authStorageKey: import.meta.env.VITE_AUTH_STORAGE_KEY?.trim() || "smart-spend-auth",
};

export const buildApiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;

  if (!env.apiBaseUrl) {
    return path;
  }

  const base = trimSlash(env.apiBaseUrl);
  const next = path.startsWith("/") ? path : `/${path}`;
  return `${base}${next}`;
};
