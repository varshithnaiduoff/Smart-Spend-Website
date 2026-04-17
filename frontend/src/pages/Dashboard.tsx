import { motion } from "framer-motion";
import { Flame, TrendingUp, Target, Coins } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import CoinBadge from "../components/CoinBadge";
import ProgressRing from "../components/ProgressRing";
import { api } from "@/lib/api";

interface DashboardProps {
  onLogout: () => void;
  userEmail: string;
}

const Dashboard = ({ onLogout, userEmail }: DashboardProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.getDashboard,
  });

  if (isLoading || !data) {
    return <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">Loading...</div>;
  }

  const { monthlyGoal, currentSpend, goalProgress, streak, totalCoins, todayCoins, recentTransactions } = data;

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <p className="text-muted-foreground text-sm truncate max-w-[220px]">{userEmail}</p>
          <h1 className="text-2xl font-display font-bold">Smart Spend</h1>
        </div>
        <div className="text-right">
          <CoinBadge amount={totalCoins} />
          <button onClick={onLogout} className="text-xs text-muted-foreground hover:text-primary mt-1">
            Sign out
          </button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3 mb-6"
      >
        {/* Streak Card */}
        <div className="bg-gradient-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-5 w-5 text-streak animate-flame-flicker" />
            <span className="text-xs text-muted-foreground font-medium">Streak</span>
          </div>
          <p className="text-3xl font-display font-bold">{streak}</p>
          <p className="text-xs text-muted-foreground">days tracking</p>
        </div>

        {/* Coins Earned Today */}
        <div className="bg-gradient-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="h-5 w-5 text-coin" />
            <span className="text-xs text-muted-foreground font-medium">Today</span>
          </div>
          <p className="text-3xl font-display font-bold">+{todayCoins}</p>
          <p className="text-xs text-muted-foreground">coins earned</p>
        </div>
      </motion.div>

      {/* Monthly Goal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-card rounded-2xl p-5 border border-border mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Monthly Budget Goal</span>
        </div>
        <div className="flex items-center gap-5">
          <ProgressRing progress={Math.min(goalProgress, 100)} size={100} strokeWidth={8}>
            <div className="text-center">
              <p className="text-xl font-display font-bold">{goalProgress}%</p>
            </div>
          </ProgressRing>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Spent</span>
              <span className="font-semibold">₹{currentSpend.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Budget</span>
              <span className="font-semibold">₹{monthlyGoal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-semibold text-primary">₹{(monthlyGoal - currentSpend).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Recent
          </h2>
          <span className="text-xs text-muted-foreground">View all →</span>
        </div>
        <div className="space-y-2">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 bg-gradient-card rounded-xl p-3 border border-border">
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-lg">
                {tx.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tx.name}</p>
                <p className="text-xs text-muted-foreground">{tx.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">₹{Math.abs(tx.amount).toFixed(2)}</p>
                <p className="text-xs text-coin font-medium">+{tx.coins} 🪙</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
