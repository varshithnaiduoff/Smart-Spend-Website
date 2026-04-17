import type { AuthUser } from "./api";

export interface AuthState {
  token: string;
  user: AuthUser;
}

const AUTH_KEY = "smart-spend-auth";

export const loadAuthState = (): AuthState | null => {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
};

export const saveAuthState = (state: AuthState) => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
};

export const clearAuthState = () => {
  localStorage.removeItem(AUTH_KEY);
};
