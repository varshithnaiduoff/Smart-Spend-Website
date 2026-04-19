import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import mongoose, { Schema, model } from "mongoose";
import type { AuthResponse, AuthUser, DashboardResponse, Reminder, RewardsResponse, Transaction, TransactionCategory } from "./types.js";

const monthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
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

interface UserDoc {
  id: number;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface SessionDoc {
  token: string;
  userId: number;
  createdAt: string;
}

interface TransactionDoc extends Transaction {
  userId: number;
}

interface ReminderDoc extends Reminder {
  userId: number;
}

const UserSchema = new Schema<UserDoc>(
  {
    id: { type: Number, required: true, unique: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { versionKey: false },
);

const SessionSchema = new Schema<SessionDoc>(
  {
    token: { type: String, required: true, unique: true, index: true },
    userId: { type: Number, required: true, index: true },
    createdAt: { type: String, required: true },
  },
  { versionKey: false },
);

const TransactionSchema = new Schema<TransactionDoc>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    userId: { type: Number, required: true, index: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    icon: { type: String, required: true },
    coins: { type: Number, required: true },
    source: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { versionKey: false },
);

const ReminderSchema = new Schema<ReminderDoc>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    userId: { type: Number, required: true, index: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: String, required: true },
    icon: { type: String, required: true },
    enabled: { type: Boolean, required: true },
  },
  { versionKey: false },
);

const UserModel = (mongoose.models.User as mongoose.Model<UserDoc>) || model<UserDoc>("User", UserSchema);
const SessionModel = (mongoose.models.Session as mongoose.Model<SessionDoc>) || model<SessionDoc>("Session", SessionSchema);
const TransactionModel =
  (mongoose.models.Transaction as mongoose.Model<TransactionDoc>) || model<TransactionDoc>("Transaction", TransactionSchema);
const ReminderModel = (mongoose.models.Reminder as mongoose.Model<ReminderDoc>) || model<ReminderDoc>("Reminder", ReminderSchema);

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

const createSession = async (userId: number) => {
  const token = randomBytes(32).toString("hex");
  await SessionModel.create({ token, userId, createdAt: new Date().toISOString() });
  return token;
};

const toAuthUser = (user: Pick<UserDoc, "id" | "email" | "createdAt">): AuthUser => ({
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

const loadUserTransactions = async (userId: number): Promise<Transaction[]> => {
  const rows = await TransactionModel.find({ userId }).sort({ createdAt: -1 }).lean();
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    amount: row.amount,
    category: row.category,
    icon: row.icon,
    coins: row.coins,
    source: row.source,
    createdAt: row.createdAt,
  }));
};

export const getDashboard = async (userId: number): Promise<DashboardResponse> => {
  const transactions = await loadUserTransactions(userId);
  const currentSpend = monthlyExpenses(transactions);
  const progress = Math.round((currentSpend / monthlyGoal) * 100);

  return {
    monthlyGoal,
    currentSpend,
    goalProgress: progress,
    streak: streakDays(transactions),
    totalCoins: totalCoins(transactions),
    todayCoins: todayCoins(transactions),
    recentTransactions: transactions.slice(0, 4).map((tx) => ({
      id: tx.id,
      name: tx.name,
      amount: tx.amount,
      coins: tx.coins,
      date: formatRelativeDay(tx.createdAt),
      icon: tx.icon,
    })),
  };
};

export const getTransactions = async (userId: number) => {
  const transactions = await loadUserTransactions(userId);
  return transactions.map((tx) => ({
    ...tx,
    date: new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  }));
};

export const addTransaction = async (
  userId: number,
  input: { name: string; amount: number; category?: TransactionCategory; source?: "manual" | "scan" },
) => {
  const normalizedCategory = input.amount > 0 ? "Income" : input.category ?? "Other";
  const tx: TransactionDoc = {
    id: Date.now(),
    userId,
    name: input.name,
    amount: input.amount,
    category: normalizedCategory,
    icon: categoryIcons[normalizedCategory],
    coins: coinsFromAmount(input.amount),
    createdAt: new Date().toISOString(),
    source: input.source ?? "manual",
  };

  await TransactionModel.create(tx);
  return tx;
};

export const getReminders = async (userId: number): Promise<Reminder[]> => {
  const rows = await ReminderModel.find({ userId }).sort({ id: -1 }).lean();
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    amount: row.amount,
    dueDate: row.dueDate,
    icon: row.icon,
    enabled: row.enabled,
  }));
};

export const addReminder = async (userId: number, input: { title: string; amount: number; dueDate?: string }) => {
  const reminder: ReminderDoc = {
    id: Date.now(),
    userId,
    title: input.title,
    amount: input.amount,
    dueDate: input.dueDate ?? "Monthly",
    icon: "📌",
    enabled: true,
  };

  await ReminderModel.create(reminder);
  return reminder;
};

export const toggleReminder = async (userId: number, id: number) => {
  const reminder = await ReminderModel.findOne({ userId, id });
  if (!reminder) return null;

  reminder.enabled = !reminder.enabled;
  await reminder.save();

  return {
    id: reminder.id,
    title: reminder.title,
    amount: reminder.amount,
    dueDate: reminder.dueDate,
    icon: reminder.icon,
    enabled: reminder.enabled,
  };
};

export const deleteReminder = async (userId: number, id: number) => {
  const result = await ReminderModel.deleteOne({ userId, id });
  return result.deletedCount > 0;
};

export const getRewards = async (userId: number): Promise<RewardsResponse> => {
  const transactions = await loadUserTransactions(userId);
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

export const registerUser = async (input: { email: string; password: string }): Promise<AuthResponse | null> => {
  const email = normalizeEmail(input.email);
  const existing = await UserModel.findOne({ email }).lean();
  if (existing) return null;

  const user: UserDoc = {
    id: Date.now(),
    email,
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };

  await UserModel.create(user);
  const token = await createSession(user.id);

  return {
    token,
    user: toAuthUser(user),
  };
};

export const loginUser = async (input: { email: string; password: string }): Promise<AuthResponse | null> => {
  const email = normalizeEmail(input.email);
  const user = await UserModel.findOne({ email }).lean();
  if (!user) return null;
  if (!verifyPassword(input.password, user.passwordHash)) return null;

  const token = await createSession(user.id);
  return {
    token,
    user: toAuthUser(user),
  };
};

export const getUserFromToken = async (token: string): Promise<AuthUser | null> => {
  const session = await SessionModel.findOne({ token }).lean();
  if (!session) return null;

  const user = await UserModel.findOne({ id: session.userId }).lean();
  if (!user) return null;
  return toAuthUser(user);
};

export const logoutSession = async (token: string) => {
  const result = await SessionModel.deleteOne({ token });
  return result.deletedCount > 0;
};
