import { motion } from "framer-motion";
import { Plus, Clock, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";

const RemindersPage = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["reminders"],
    queryFn: api.getReminders,
  });

  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["reminders"] });
  };

  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.toggleReminder(id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteReminder(id),
    onSuccess: invalidate,
  });

  const addMutation = useMutation({
    mutationFn: (payload: { title: string; amount: number }) => api.createReminder(payload),
    onSuccess: () => {
      invalidate();
      setNewTitle("");
      setNewAmount("");
      setShowAdd(false);
    },
  });

  const deleteReminder = (id: number) => {
    deleteMutation.mutate(id);
  };

  const addReminder = () => {
    if (!newTitle || !newAmount) return;
    addMutation.mutate({ title: newTitle, amount: parseFloat(newAmount) });
  };

  const reminders = data?.items ?? [];

  if (isLoading) {
    return <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">Loading...</div>;
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Reminders</h1>
          <p className="text-sm text-muted-foreground">Never miss a payment</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground shadow-glow-primary"
        >
          <Plus className="h-5 w-5" />
        </button>
      </motion.div>

      {/* Upcoming */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-gradient-card rounded-2xl p-4 border border-border mb-6 flex items-center gap-4"
      >
        <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">Next due: Rent Payment</p>
          <p className="text-xs text-muted-foreground">March 1, 2026 · ₹1,200.00</p>
        </div>
      </motion.div>

      {/* Add Form */}
      {showAdd && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6">
          <div className="bg-gradient-card rounded-2xl p-5 border border-border space-y-3">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Reminder name"
              className="bg-secondary border-border rounded-xl"
            />
            <Input
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="Amount"
              type="number"
              className="bg-secondary border-border rounded-xl"
            />
            <Button onClick={addReminder} className="w-full bg-gradient-primary text-primary-foreground font-semibold rounded-xl">
              Add Reminder
            </Button>
          </div>
        </motion.div>
      )}

      {/* Reminders List */}
      <div className="space-y-2">
        {reminders.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
            className="flex items-center gap-3 bg-gradient-card rounded-xl p-3.5 border border-border"
          >
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-lg shrink-0">
              {r.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground">{r.dueDate} · ₹{r.amount.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Switch checked={r.enabled} onCheckedChange={() => toggleMutation.mutate(r.id)} />
              <button onClick={() => deleteReminder(r.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RemindersPage;
