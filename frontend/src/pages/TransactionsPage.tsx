import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const TransactionsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: api.getTransactions,
  });

  const transactions = data?.items ?? [];
  const totalSpent = transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const totalCoins = transactions.reduce((s, t) => s + t.coins, 0);

  if (isLoading) {
    return <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">Loading...</div>;
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">This month's activity</p>
        </div>
        <button className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Filter className="h-4 w-4" />
        </button>
      </motion.div>

      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gradient-card rounded-2xl p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
          <p className="text-xl font-display font-bold text-destructive">₹{Math.abs(totalSpent).toFixed(2)}</p>
        </div>
        <div className="bg-gradient-card rounded-2xl p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Coins Earned</p>
          <p className="text-xl font-display font-bold text-coin">{totalCoins} 🪙</p>
        </div>
      </motion.div>

      {/* Transaction List */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
        {transactions.map((tx, i) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
            className="flex items-center gap-3 bg-gradient-card rounded-xl p-3.5 border border-border"
          >
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-lg shrink-0">
              {tx.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{tx.name}</p>
              <p className="text-xs text-muted-foreground">{tx.date} · {tx.category}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-semibold flex items-center gap-1 ${tx.amount > 0 ? "text-primary" : ""}`}>
                {tx.amount > 0 ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                ₹{Math.abs(tx.amount).toFixed(2)}
              </p>
              {tx.coins > 0 && <p className="text-xs text-coin font-medium">+{tx.coins} 🪙</p>}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default TransactionsPage;
