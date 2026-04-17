import { NavLink, useLocation } from "react-router-dom";
import { Home, ScanLine, Receipt, Trophy, Bell } from "lucide-react";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/scan", icon: ScanLine, label: "Scan" },
  { path: "/transactions", icon: Receipt, label: "History" },
  { path: "/rewards", icon: Trophy, label: "Rewards" },
  { path: "/reminders", icon: Bell, label: "Remind" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/90 backdrop-blur-xl safe-area-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors"
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? "bg-gradient-primary shadow-glow-primary" : ""}`}>
                <Icon className={`h-5 w-5 transition-colors ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
