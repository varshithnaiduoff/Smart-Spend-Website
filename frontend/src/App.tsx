import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import Dashboard from "./pages/Dashboard";
import ScanPage from "./pages/ScanPage";
import TransactionsPage from "./pages/TransactionsPage";
import RewardsPage from "./pages/RewardsPage";
import RemindersPage from "./pages/RemindersPage";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import { api, type AuthPayload } from "./lib/api";
import { clearAuthState, loadAuthState, saveAuthState, type AuthState } from "./lib/auth";

const queryClient = new QueryClient();

const App = () => {
  const [auth, setAuth] = useState<AuthState | null>(() => loadAuthState());
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!auth?.token) {
        setIsCheckingSession(false);
        return;
      }

      try {
        const me = await api.me(auth.token);
        const next: AuthState = { token: auth.token, user: me.user };
        saveAuthState(next);
        setAuth(next);
      } catch {
        clearAuthState();
        setAuth(null);
      } finally {
        setIsCheckingSession(false);
      }
    };

    run();
  }, []);

  const onAuthSuccess = (payload: AuthPayload) => {
    const next: AuthState = { token: payload.token, user: payload.user };
    saveAuthState(next);
    setAuth(next);
  };

  const logout = async () => {
    if (auth?.token) {
      try {
        await api.logout(auth.token);
      } catch {
        // ignore network errors on logout
      }
    }

    clearAuthState();
    setAuth(null);
  };

  if (isCheckingSession) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={auth ? <Navigate to="/" replace /> : <AuthPage onAuthSuccess={onAuthSuccess} />} />
            <Route path="/" element={auth ? <Dashboard onLogout={logout} userEmail={auth.user.email} /> : <Navigate to="/auth" replace />} />
            <Route path="/scan" element={auth ? <ScanPage /> : <Navigate to="/auth" replace />} />
            <Route path="/transactions" element={auth ? <TransactionsPage /> : <Navigate to="/auth" replace />} />
            <Route path="/rewards" element={auth ? <RewardsPage /> : <Navigate to="/auth" replace />} />
            <Route path="/reminders" element={auth ? <RemindersPage /> : <Navigate to="/auth" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          {auth && <BottomNav />}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
