import React from "react";
import { 
  TrendingUp, 
  Search, 
  FileCheck, 
  BarChart2, 
  Briefcase, 
  Cpu, 
  Sun, 
  Moon, 
  MessageSquare,
  Sparkles,
  LogIn,
  LogOut,
  Cloud,
  UserCheck,
  FileText,
  Newspaper,
  Share2,
  Gauge,
  Bell,
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
    { id: "listing", label: "Listing Day AI", icon: BarChart2 },
    { id: "portfolio", label: "My Portfolio", icon: Briefcase },
    { id: "arena", label: "Premium AI Arena", icon: Cpu },
    { id: "rhp-analyzer", label: "AI RHP Analyzer", icon: FileText },
    { id: "news-analyzer", label: "AI News Analyzer", icon: Newspaper },
    // { id: "social-analyzer", label: "AI Social Analyzer", icon: Share2 },
    { id: "market-intelligence", label: "AI Market Intelligence", icon: Gauge },
    // { id: "notifications", label: "Push Alerts Hub", icon: Bell },
  ];


  return (
    <aside className="w-64 max-md:w-16 shrink-0 border-r flex flex-col justify-between h-screen sticky top-0 bg-card transition-colors duration-300 border-border overflow-hidden">
      <div>
        {/* Branding */}
        <div className="p-6 max-md:p-3 border-b border-border flex items-center space-x-3 max-md:justify-center">
          <div className="bg-primary/10 p-2 rounded-xl flex items-center justify-center border border-primary/20">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <div className="max-md:hidden">
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              IPOSense AI
            </h1>
            <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
              IPO Intelligence Hub
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 max-md:p-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-item-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-start max-md:justify-center space-x-3 max-md:space-x-0 px-4 max-md:px-2 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10 font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                <span className="max-md:hidden">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls */}
      <div className="p-4 max-md:p-2 border-t border-border space-y-3">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 max-md:hidden">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || "User"} 
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full border border-primary/20"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase">
                  {(user.displayName || user.email || "U").substring(0, 2)}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground truncate max-w-[100px]" title={user.displayName || user.email}>
                  {user.displayName || user.email?.split("@")[0] || "User"}
                </span>
              </div>
            </div>

            <button
              onClick={onSignOutClick}
              className="p-2 rounded-xl border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between max-md:hidden">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border">
                G
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-muted-foreground">
                  Guest Mode
                </span>
                <span className="text-[9px] font-mono text-amber-500/80">
                  Local Sandbox
                </span>
              </div>
            </div>

            <button
              onClick={onSignInClick}
              className="p-1.5 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
              title="Sign In Securely"
            >
              <LogIn className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        
        <div className="md:hidden flex justify-center">
          {user ? (
            <button
              onClick={onSignOutClick}
              className="flex items-center justify-center p-2 rounded-xl border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onSignInClick}
              className="flex items-center justify-center p-2 rounded-xl border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
              title="Sign In"
            >
              <LogIn className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
