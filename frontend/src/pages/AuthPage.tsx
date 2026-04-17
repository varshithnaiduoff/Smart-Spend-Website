import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Mail, Lock, UserPlus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type AuthPayload } from "@/lib/api";

interface AuthPageProps {
  onAuthSuccess: (payload: AuthPayload) => void;
}

const AuthPage = ({ onAuthSuccess }: AuthPageProps) => {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: api.register,
    onSuccess: onAuthSuccess,
    onError: () => setError("Could not create account. Try another email."),
  });

  const loginMutation = useMutation({
    mutationFn: api.login,
    onSuccess: onAuthSuccess,
    onError: () => setError("Invalid email or password."),
  });

  const submit = () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Please fill email and password.");
      return;
    }

    if (mode === "register" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (mode === "register") {
      registerMutation.mutate({ email, password });
      return;
    }

    loginMutation.mutate({ email, password });
  };

  const isLoading = registerMutation.isPending || loginMutation.isPending;

  return (
    <div className="min-h-screen px-4 pt-10 pb-8 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <h1 className="text-3xl font-display font-bold">Smart Spend</h1>
        <p className="text-sm text-muted-foreground mt-1">Create your account and start tracking smarter</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-card rounded-2xl p-5 border border-border"
      >
        <div className="grid grid-cols-2 gap-2 mb-5">
          <Button
            variant={mode === "register" ? "default" : "secondary"}
            className={mode === "register" ? "bg-gradient-primary text-primary-foreground" : ""}
            onClick={() => setMode("register")}
          >
            <UserPlus className="h-4 w-4 mr-1" /> Sign up
          </Button>
          <Button
            variant={mode === "login" ? "default" : "secondary"}
            className={mode === "login" ? "bg-gradient-primary text-primary-foreground" : ""}
            onClick={() => setMode("login")}
          >
            <LogIn className="h-4 w-4 mr-1" /> Sign in
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-9 bg-secondary border-border rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 bg-secondary border-border rounded-xl"
              />
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button
            disabled={isLoading}
            onClick={submit}
            className="w-full bg-gradient-primary text-primary-foreground font-semibold rounded-xl"
          >
            {isLoading ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
