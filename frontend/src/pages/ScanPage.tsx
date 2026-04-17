import { motion } from "framer-motion";
import { ScanLine, Keyboard, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const ScanPage = () => {
  const queryClient = useQueryClient();
  const [showManual, setShowManual] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const addTransactionMutation = useMutation({
    mutationFn: (payload: { name: string; amount: number }) =>
      api.createTransaction({
        name: payload.name,
        amount: -Math.abs(payload.amount),
        source: "scan",
      }),
    onSuccess: () => {
      setAmount("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
  });

  const handleAddTransaction = () => {
    const parsedAmount = Number(amount);
    if (!description.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;
    addTransactionMutation.mutate({ name: description.trim(), amount: parsedAmount });
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold mb-1">Scan & Pay</h1>
        <p className="text-sm text-muted-foreground mb-6">Scan a QR code to pay and earn coins</p>
      </motion.div>

      {/* QR Scanner Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative aspect-square max-w-[300px] mx-auto mb-8 rounded-3xl border-2 border-dashed border-primary/40 bg-gradient-card flex flex-col items-center justify-center gap-4 overflow-hidden"
      >
        {/* Corner markers */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />

        {/* Scanning line animation */}
        <motion.div
          className="absolute left-6 right-6 h-0.5 bg-gradient-primary rounded-full opacity-60"
          animate={{ top: ["15%", "85%", "15%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        <ScanLine className="h-12 w-12 text-primary animate-pulse-glow" />
        <p className="text-sm text-muted-foreground text-center px-6">
          Point your camera at a QR code to scan and pay
        </p>
        <Button className="bg-gradient-primary text-primary-foreground font-semibold rounded-xl shadow-glow-primary">
          Open Camera
        </Button>
      </motion.div>

      {/* Manual Entry Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <button
          onClick={() => setShowManual(!showManual)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <Keyboard className="h-4 w-4" />
          Or enter manually
        </button>
      </motion.div>

      {/* Manual Entry Form */}
      {showManual && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-6 space-y-4"
        >
          <div className="bg-gradient-card rounded-2xl p-5 border border-border space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Grocery shopping"
                className="bg-secondary border-border rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Amount</label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                type="number"
                className="bg-secondary border-border rounded-xl text-xl font-display"
              />
            </div>
            <Button onClick={handleAddTransaction} className="w-full bg-gradient-primary text-primary-foreground font-semibold rounded-xl shadow-glow-primary gap-2">
              Add Transaction <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ScanPage;
