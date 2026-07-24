import React from "react";
import { 
  TrendingUp, 
  Search, 
  FileCheck, 
  BarChart2, 
  Briefcase, 
  Cpu, 
  Sparkles,
  LogIn,
  LogOut,
  FileText,
  Newspaper,
  Gauge,
  ShieldCheck
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  user: any;
  onSignInClick: () => void;
  onSignOutClick: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  darkMode, 
  setDarkMode,
  user,
  onSignInClick,
  onSignOutClick
}: SidebarProps) {
  const userRole = user?.role || "INVESTOR";

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "discovery", label: "IPO Discovery", icon: Search },
    ...(userRole === "ADMINISTRATOR" ? [{ id: "admin", label: "Admin Center", icon: ShieldCheck }] : []),
    ...(userRole === "RESEARCH_ANALYST" ? [{ id: "research", label: "Research Hub", icon: BarChart2 }] : []),
    { id: "tracker", label: "Allotment Tracker", icon: FileCheck },
    { id: "listing", label: "Listing Prediction AI", icon: BarChart2 },
    { id: "portfolio", label: "My Portfolio", icon: Briefcase },
    { id: "arena", label: "AI Arena", icon: Cpu },
    { id: "rhp-analyzer", label: "AI RHP Analyzer", icon: FileText },
    { id: "news-analyzer", label: "AI News Analyzer", icon: Newspaper },
    { id: "market-intelligence", label: "AI Market Intelligence", icon: Gauge },
  ];

  return (
    <aside className="w-16 md:w-64 shrink-0 border-r flex flex-col justify-between h-screen sticky top-0 bg-card transition-colors duration-300 border-border overflow-hidden">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Branding */}
        <div className="p-3 md:p-6 border-b border-border flex items-center justify-center md:justify-start space-x-0 md:space-x-3 shrink-0">
          <div className="bg-primary/10 p-2 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
            <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary animate-pulse" />
          </div>
          <div className="hidden md:block min-w-0">
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent truncate">
              IPOSense AI
            </h1>
            <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground block truncate">
              IPO Intelligence Hub
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-2 md:p-4 space-y-1 overflow-y-auto flex-1 no-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-item-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`w-full flex items-center justify-center md:justify-start space-x-0 md:space-x-3 px-2 md:px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10 font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                <span className="hidden md:inline truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls */}
      <div className="p-2 md:p-4 border-t border-border space-y-3 shrink-0">
        {user ? (
          <div className="flex items-center justify-center md:justify-between">
            <div className="hidden md:flex items-center space-x-2 min-w-0">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || "User"} 
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full border border-primary/20 shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                  {(user.displayName || user.email || "U").substring(0, 2)}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-foreground truncate max-w-[120px]" title={user.displayName || user.email}>
                  {user.displayName || user.email?.split("@")[0] || "User"}
                </span>
              </div>
            </div>

            <button
              onClick={onSignOutClick}
              className="p-2 rounded-xl border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer flex items-center justify-center"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4 shrink-0" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center md:justify-between">
            <div className="hidden md:flex items-center space-x-2 min-w-0">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border shrink-0 font-bold text-xs">
                G
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-muted-foreground truncate">
                  Guest Mode
                </span>
                <span className="text-[9px] font-mono text-amber-500/80 truncate">
                  Local Sandbox
                </span>
              </div>
            </div>

            <button
              onClick={onSignInClick}
              className="p-2 md:p-1.5 rounded-xl md:rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer flex items-center justify-center"
              title="Sign In Securely"
            >
              <LogIn className="h-4 w-4 md:h-3.5 md:w-3.5 shrink-0" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}