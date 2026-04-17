import { motion } from "framer-motion";

interface CoinBadgeProps {
  amount: number;
  size?: "sm" | "md" | "lg";
}

const CoinBadge = ({ amount, size = "md" }: CoinBadgeProps) => {
  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-lg px-4 py-1.5 font-bold",
  };

  return (
    <motion.div
      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-gold text-accent-foreground font-display font-semibold shadow-glow-gold ${sizes[size]}`}
      whileHover={{ scale: 1.05 }}
    >
      <span className="animate-coin-bounce">🪙</span>
      <span>{amount.toLocaleString()}</span>
    </motion.div>
  );
};

export default CoinBadge;
