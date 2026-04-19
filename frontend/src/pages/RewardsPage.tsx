import { motion } from "framer-motion";
import { Trophy, Check, Flame, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const RewardsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["rewards"],
    queryFn: api.getRewards,
    refetchOnMount: "always",
  });

  if (isLoading || !data) {
    return <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">Loading...</div>;
  }

  const { rewards, monthlyGoals, streak } = data;

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold mb-1">Rewards</h1>
        <p className="text-sm text-muted-foreground mb-6">Earn coins, unlock achievements</p>
      </motion.div>

      {/* Streak Warning */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-card rounded-2xl p-4 border border-border mb-6 flex items-center gap-4"
      >
        <div className="h-12 w-12 rounded-2xl bg-streak/20 flex items-center justify-center">
          <Flame className="h-6 w-6 text-streak animate-flame-flicker" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Don't break your streak!</p>
          <p className="text-xs text-muted-foreground">Log a transaction today to keep your {streak}-day streak. Missing a day costs 50 coins!</p>
        </div>
      </motion.div>

      {/* Monthly Goals */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
        <h2 className="text-lg font-display font-semibold flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-primary" /> Monthly Goals
        </h2>
        <div className="space-y-3">
          {monthlyGoals.map((goal) => {
            const pct = Math.round((goal.current / goal.target) * 100);
            return (
              <div key={goal.id} className="bg-gradient-card rounded-xl p-4 border border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{goal.label}</span>
                  <span className="text-xs text-coin font-medium">{goal.reward} 🪙</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(pct, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{goal.current} / {goal.target} ({pct}%)</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-lg font-display font-semibold flex items-center gap-2 mb-3">
          <Trophy className="h-5 w-5 text-coin" /> Achievements
        </h2>
        <div className="space-y-2">
          {rewards.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`flex items-center gap-3 rounded-xl p-3.5 border ${r.unlocked ? "bg-primary/10 border-primary/30" : "bg-gradient-card border-border"}`}
            >
              <div className="text-2xl">{r.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  {r.name}
                  {r.unlocked && <Check className="h-3.5 w-3.5 text-primary" />}
                </p>
                <p className="text-xs text-muted-foreground">{r.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-coin font-semibold">{r.coins} 🪙</p>
                {!r.unlocked && (
                  <div className="h-1.5 w-14 rounded-full bg-muted mt-1.5 overflow-hidden">
                    <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${r.progress}%` }} />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default RewardsPage;
