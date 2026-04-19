import { buildApiUrl, env } from "./env";

export type TransactionCategory =
  | "Food"
  | "Bills"
  | "Transport"
  | "Entertainment"
  | "Health"
  | "Income"
  | "Other";

export interface DashboardData {
  monthlyGoal: number;
  currentSpend: number;
  goalProgress: number;
  streak: number;
  totalCoins: number;
  todayCoins: number;
  recentTransactions: Array<{
    id: number;
    name: string;
    amount: number;
    coins: number;
    date: string;
    icon: string;
  }>;
}

export interface TransactionItem {
  id: number;
  name: string;
  amount: number;
  coins: number;
  category: TransactionCategory;
  icon: string;
  date: string;
  createdAt: string;
}

export interface RewardsData {
  streak: number;
  rewards: Array<{
    id: number;
    name: string;
    description: string;
    coins: number;
    progress: number;
    unlocked: boolean;
    icon: string;
  }>;
  monthlyGoals: Array<{
    id: number;
    label: string;
    current: number;
    target: number;
    reward: number;
  }>;
}

export interface ReminderItem {
  id: number;
  title: string;
  amount: number;
  dueDate: string;
  icon: string;
  enabled: boolean;
}

export interface AuthUser {
  id: number;
  email: string;
  createdAt: string;
}

export interface AuthPayload {
  token: string;
  user: AuthUser;
}

const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = (() => {
    try {
      const raw = localStorage.getItem(env.authStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { token?: string };
      return parsed.token ?? null;
    } catch {
      return null;
    }
  })();

  const res = await fetch(buildApiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!res.ok) {
    const data = await res.text();
    throw new Error(data || `Request failed with ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
};

export const api = {
  getDashboard: () => apiFetch<DashboardData>("/api/dashboard"),
  getTransactions: () => apiFetch<{ items: TransactionItem[] }>("/api/transactions"),
  createTransaction: (payload: { name: string; amount: number; category?: TransactionCategory; source?: "manual" | "scan" }) =>
    apiFetch<TransactionItem>("/api/transactions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getRewards: () => apiFetch<RewardsData>("/api/rewards"),
  getReminders: () => apiFetch<{ items: ReminderItem[] }>("/api/reminders"),
  createReminder: (payload: { title: string; amount: number; dueDate?: string }) =>
    apiFetch<ReminderItem>("/api/reminders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  register: (payload: { email: string; password: string }) =>
    apiFetch<AuthPayload>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    apiFetch<AuthPayload>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: (token: string) =>
    apiFetch<{ user: AuthUser }>("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  logout: (token: string) =>
    apiFetch<void>("/api/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  toggleReminder: (id: number) => apiFetch<ReminderItem>(`/api/reminders/${id}/toggle`, { method: "PATCH" }),
  deleteReminder: (id: number) => apiFetch<void>(`/api/reminders/${id}`, { method: "DELETE" }),
};
