export type TransactionCategory =
  | "Food"
  | "Bills"
  | "Transport"
  | "Entertainment"
  | "Health"
  | "Income"
  | "Other";

export interface Transaction {
  id: number;
  name: string;
  amount: number;
  category: TransactionCategory;
  icon: string;
  coins: number;
  source: "manual" | "scan" | "seed";
  createdAt: string;
}

export interface Reminder {
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

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface DashboardResponse {
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

export interface RewardsResponse {
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
