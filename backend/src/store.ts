import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { AuthResponse, AuthUser, DashboardResponse, Reminder, RewardsResponse, Transaction, TransactionCategory } from "./types.js";

const monthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

const monthlyGoal = 2000;

const categoryIcons: Record<TransactionCategory, string> = {
  Food: "🍽️",
  Bills: "⚡",
  Transport: "⛽",
  Entertainment: "📺",
  Health: "💊",
  Income: "💰",
  Other: "📌",
};

type UserData = {
  transactions: Transaction[];
  reminders: Reminder[];
};

const userData = new Map<number, UserData>();

const getUserData = (userId: number): UserData => {
  const existing = userData.get(userId);
  if (existing) return existing;

  const created: UserData = {
    transactions: [],
    reminders: [],
  };

  userData.set(userId, created);
  return created;
};

type StoredUser = AuthUser & {
  passwordHash: string;
};

let users: StoredUser[] = [];
const sessions = new Map<string, number>();

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password: string, stored: string) => {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const candidate = scryptSync(password, salt, 64);
  const original = Buffer.from(hash, "hex");
  if (candidate.length !== original.length) return false;
  return timingSafeEqual(candidate, original);
};

const createSession = (userId: number) => {
  const token = randomBytes(32).toString("hex");
  sessions.set(token, userId);
  return token;
};

const toAuthUser = (user: StoredUser): AuthUser => ({
  id: user.id,
  email: user.email,
  createdAt: user.createdAt,
});

const coinsFromAmount = (amount: number) => {
  if (amount >= 0) return 0;
  return Math.max(1, Math.floor(Math.abs(amount) / 100));
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatRelativeDay = (value: string) => {
  const date = new Date(value);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, now)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const monthlyExpenses = (transactions: Transaction[]) => {
  const start = monthStart();
  return transactions
    .filter((tx) => new Date(tx.createdAt) >= start && tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
};

const totalCoins = (transactions: Transaction[]) => transactions.reduce((sum, tx) => sum + tx.coins, 0);

const todayCoins = (transactions: Transaction[]) => {
  const now = new Date();
  return transactions
    .filter((tx) => isSameDay(new Date(tx.createdAt), now))
    .reduce((sum, tx) => sum + tx.coins, 0);
};

const streakDays = (transactions: Transaction[]) => {
  const daysWithEntries = new Set(
    transactions.map((tx) => {
      const d = new Date(tx.createdAt);
      return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }),
  );

  let streak = 0;
  const probe = new Date();

  while (true) {
    const key = `${probe.getFullYear()}-${probe.getMonth() + 1}-${probe.getDate()}`;
    if (!daysWithEntries.has(key)) break;
    streak += 1;
    probe.setDate(probe.getDate() - 1);
  }

  return streak;
};

export const getDashboard = (userId: number): DashboardResponse => {
  const { transactions } = getUserData(userId);
  const currentSpend = monthlyExpenses(transactions);
  const progress = Math.round((currentSpend / monthlyGoal) * 100);

  return {
    monthlyGoal,
    currentSpend,
    goalProgress: progress,
    streak: streakDays(transactions),
    totalCoins: totalCoins(transactions),
    todayCoins: todayCoins(transactions),
    recentTransactions: [...transactions]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 4)
      .map((tx) => ({
        id: tx.id,
        name: tx.name,
        amount: tx.amount,
        coins: tx.coins,
        date: formatRelativeDay(tx.createdAt),
        icon: tx.icon,
      })),
  };
};

export const getTransactions = (userId: number) => {
  const { transactions } = getUserData(userId);
  return [...transactions]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map((tx) => ({
      ...tx,
      date: new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    }));
};

export const addTransaction = (userId: number, input: { name: string; amount: number; category?: TransactionCategory; source?: "manual" | "scan" }) => {
  const data = getUserData(userId);
  const normalizedCategory = input.amount > 0 ? "Income" : input.category ?? "Other";
  const tx: Transaction = {
    id: Date.now(),
    name: input.name,
    amount: input.amount,
    category: normalizedCategory,
    icon: categoryIcons[normalizedCategory],
    coins: coinsFromAmount(input.amount),
    createdAt: new Date().toISOString(),
    source: input.source ?? "manual",
  };

  data.transactions = [tx, ...data.transactions];
  return tx;
};

export const getReminders = (userId: number) => getUserData(userId).reminders;

export const addReminder = (userId: number, input: { title: string; amount: number; dueDate?: string }) => {
  const data = getUserData(userId);
  const reminder: Reminder = {
    id: Date.now(),
    title: input.title,
    amount: input.amount,
    dueDate: input.dueDate ?? "Monthly",
    icon: "📌",
    enabled: true,
  };

  data.reminders = [...data.reminders, reminder];
  return reminder;
};

export const toggleReminder = (userId: number, id: number) => {
  const data = getUserData(userId);
  data.reminders = data.reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
  return data.reminders.find((r) => r.id === id) ?? null;
};

export const deleteReminder = (userId: number, id: number) => {
  const data = getUserData(userId);
  const before = data.reminders.length;
  data.reminders = data.reminders.filter((r) => r.id !== id);
  return data.reminders.length !== before;
};

export const getRewards = (userId: number): RewardsResponse => {
  const { transactions } = getUserData(userId);
  const txCount = transactions.length;
  const streak = streakDays(transactions);
  const currentSpend = monthlyExpenses(transactions);
  const scans = transactions.filter((t) => t.source === "scan").length;
  const saved = Math.max(monthlyGoal - currentSpend, 0);

  return {
    streak,
    monthlyGoals: [
      { id: 1, label: "Track every day", current: streak, target: 28, reward: 200 },
      { id: 2, label: "Stay under ₹2,000", current: Math.round(currentSpend), target: monthlyGoal, reward: 300 },
      { id: 3, label: "Scan 15 QR codes", current: scans, target: 15, reward: 100 },
    ],
    rewards: [
      {
        id: 1,
        name: "Budget Beginner",
        description: "Track 10 transactions",
        coins: 50,
        progress: Math.min(Math.round((txCount / 10) * 100), 100),
        unlocked: txCount >= 10,
        icon: "🎯",
      },
      {
        id: 2,
        name: "Streak Master",
        description: "7-day tracking streak",
        coins: 100,
        progress: Math.min(Math.round((streak / 7) * 100), 100),
        unlocked: streak >= 7,
        icon: "🔥",
      },
      {
        id: 3,
        name: "Saver Star",
        description: "Stay under budget for a month",
        coins: 250,
        progress: Math.max(0, Math.min(Math.round((monthlyGoal / Math.max(currentSpend, 1)) * 100), 100)),
        unlocked: currentSpend <= monthlyGoal,
        icon: "⭐",
      },
      {
        id: 4,
        name: "QR Champion",
        description: "Scan 20 QR payments",
        coins: 75,
        progress: Math.min(Math.round((scans / 20) * 100), 100),
        unlocked: scans >= 20,
        icon: "📱",
      },
      {
        id: 5,
        name: "Penny Pincher",
        description: "Save ₹500 in a month",
        coins: 500,
        progress: Math.min(Math.round((saved / 500) * 100), 100),
        unlocked: saved >= 500,
        icon: "💎",
      },
    ],
  };
};

export const registerUser = (input: { email: string; password: string }): AuthResponse | null => {
  const email = normalizeEmail(input.email);
  if (users.some((u) => u.email === email)) return null;

  const user: StoredUser = {
    id: Date.now(),
    email,
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };

  users = [...users, user];
  getUserData(user.id);

  const token = createSession(user.id);
  return {
    token,
    user: toAuthUser(user),
  };
};

export const loginUser = (input: { email: string; password: string }): AuthResponse | null => {
  const email = normalizeEmail(input.email);
  const user = users.find((u) => u.email === email);
  if (!user) return null;
  if (!verifyPassword(input.password, user.passwordHash)) return null;

  const token = createSession(user.id);
  return {
    token,
    user: toAuthUser(user),
  };
};

export const getUserFromToken = (token: string): AuthUser | null => {
  const userId = sessions.get(token);
  if (!userId) return null;

  const user = users.find((u) => u.id === userId);
  if (!user) return null;
  return toAuthUser(user);
};

export const logoutSession = (token: string) => sessions.delete(token);
