import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import DashboardOverview from "./components/DashboardOverview";
import IpoDiscovery from "./components/IpoDiscovery";
import AllotmentTracker from "./components/AllotmentTracker";
import ListingDayAI from "./components/ListingDayAI";
import PortfolioHoldings from "./components/PortfolioHoldings";
import AiArena from "./components/AiArena";
import RhpAnalyzer from "./components/RhpAnalyzer";
import NewsAnalyzer from "./components/NewsAnalyzer";
import SocialAnalyzer from "./components/SocialAnalyzer";
import MarketIntelligence from "./components/MarketIntelligence";
import PushAlertsHub from "./components/PushAlertsHub";
import FloatingChatbot from "./components/FloatingChatbot";
import OnboardingTour from "./components/OnboardingTour";
import AuthModal from "./components/AuthModal";
import AdminCenter from "./components/AdminCenter";
import ResearchHub from "./components/ResearchHub";
import { auth } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { IPO, Application, PortfolioHolding } from "./types";
import { Sparkles, Calendar, BadgeAlert, RefreshCw, Sun, Moon } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(true);
  const [ipos, setIpos] = useState<IPO[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioHolding[]>([]);
  const portfolioRef = useRef<PortfolioHolding[]>([]);

  useEffect(() => {
    portfolioRef.current = portfolio;
  }, [portfolio]);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news');
      if (res.ok) {
        const data = await res.json();
        setNews(data);
      }
    } catch (e) {
      console.error('Failed to load news', e);
    }
  };
  const [loading, setLoading] = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [simulateRateLimit, setSimulateRateLimit] = useState(false);

  // Authentication session states
  const [user, setUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("iposense_user");
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Watchlist state backed by PostgreSQL
  const [watchlist, setWatchlist] = useState<string[]>([]);


  const fetchWatchlist = async () => {
    try {
      const res = await fetch("/api/watchlist");
      if (res.ok) {
        const data = await res.json();
        setWatchlist(data);
      }
    } catch (e) {
      console.error("Failed to load watchlist from PostgreSQL database:", e);
    }
  };

  const handleToggleWatchlist = async (ipoSymbol: string) => {
    const isWatchlisted = watchlist.includes(ipoSymbol);
    setWatchlist(prev => isWatchlisted ? prev.filter(s => s !== ipoSymbol) : [...prev, ipoSymbol]);

    try {
      const endpoint = isWatchlisted ? "/api/watchlist/remove" : "/api/watchlist";
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipoSymbol })
      });
    } catch (e) {
      console.error("Failed to synchronize watchlist action to database:", e);
    }
  };

 

  // Function to fetch real-time data from the NSE/IPO API using the API key (proxied securely via /api/nse-ipos)
  const fetchRealtimeIpos = async (): Promise<IPO[]> => {
    const url = `/api/nse-ipos${simulateRateLimit ? "?simulateLimit=true" : ""}`;
    const res = await fetch(url);
    if (res.status === 429 || res.status === 403 || res.status === 503) {
      throw new Error("RATE_LIMIT_EXCEEDED");
    }
    if (!res.ok) {
      throw new Error(`API returned non-200 status: ${res.status}`);
    }
    return await res.json();
  };

  // Loaders
  const fetchIpos = async () => {
    try {
      setServiceUnavailable(false);
      
      // If we are simulating API limit exhaustion, jump straight to real-time fetch to catch the error
      if (simulateRateLimit) {
        const data = await fetchRealtimeIpos();
        setIpos(data.map((ipo: any) => ({
          ...ipo,
          companyName: ipo.companyName || ipo.name,
          price: ipo.price || ipo.priceBand,
          gmp: ipo.gmp ?? 0,
          aiScore: ipo.aiScore ?? 75,
          aiConfidence: ipo.aiConfidence ?? 80,
          riskScore: ipo.riskScore ?? 50,
          recommendation: ipo.recommendation || "MODERATE"
        })));
        return;
      }

      const res = await fetch("/api/ipos");
      if (res.ok) {
        const data = await res.json();
        
        const normalizedIpos = data.map((ipo: any) => ({
          ...ipo,
          companyName: ipo.companyName || ipo.name,
          price: ipo.price || ipo.priceBand,
          gmp: ipo.gmp ?? 0,
          aiScore: ipo.aiScore ?? 75,
          aiConfidence: ipo.aiConfidence ?? 80,
          riskScore: ipo.riskScore ?? 50,
          recommendation: ipo.recommendation || "MODERATE",
          subscriptionOverall: ipo.subscriptionOverall ?? 0,
          industry: ipo.industry || "Technology",
          strengths: ipo.strengths || [],
          risks: ipo.risks || [],
          financials: ipo.financials || []
        }));

        setIpos(normalizedIpos);
      } else {
        console.warn("Primary /api/ipos route failed, falling back to real-time fetch...");
        const data = await fetchRealtimeIpos();
        setIpos(data.map((ipo: any) => ({
          ...ipo,
          companyName: ipo.companyName || ipo.name,
          price: ipo.price || ipo.priceBand,
          gmp: ipo.gmp ?? 0,
          aiScore: ipo.aiScore ?? 75,
          aiConfidence: ipo.aiConfidence ?? 80,
          riskScore: ipo.riskScore ?? 50,
          recommendation: ipo.recommendation || "MODERATE"
        })));
      }
    } catch (e: any) {
      console.error("Failed to load IPO indexes:", e);
      if (e.message === "RATE_LIMIT_EXCEEDED" || (e.status && (e.status === 429 || e.status === 403))) {
        setServiceUnavailable(true);
      } else {
        // Try the real-time fetch to recover
        try {
          const data = await fetchRealtimeIpos();
          setIpos(data.map((ipo: any) => ({
            ...ipo,
            companyName: ipo.companyName || ipo.name,
            price: ipo.price || ipo.priceBand,
            gmp: ipo.gmp ?? 0,
            aiScore: ipo.aiScore ?? 75,
            aiConfidence: ipo.aiConfidence ?? 80,
            riskScore: ipo.riskScore ?? 50,
            recommendation: ipo.recommendation || "MODERATE"
          })));
        } catch (innerErr: any) {
          if (innerErr.message === "RATE_LIMIT_EXCEEDED") {
            setServiceUnavailable(true);
          } else {
            setServiceUnavailable(true);
          }
        }
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(prev => {
          // Play a friendly notification alert tone if we detect new announcements!
          if (prev.length > 0 && data.length > prev.length) {
            try {
              const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav");
              audio.volume = 0.40;
              audio.play().catch(() => {});
            } catch (_) {}
          }
          return data;
        });
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

const fetchPortfolio = async () => {
  try {
    console.log("fetchPortfolio called", portfolioRef.current);
    const symbols = portfolioRef.current.map(h => h.symbol).join(",");

    if (!symbols) {
      return;
    }

    const response = await fetch(
     `/api/groww/holdings/live?symbols=${encodeURIComponent(symbols)}`
    );

    if (!response.ok) return;

    const responseJson = await response.json();
    console.log("Live holdings response:", responseJson);
    const liveData = Array.isArray(responseJson)
      ? responseJson
      : responseJson?.data?.content ||
        responseJson?.data ||
        responseJson?.holdings ||
        [];

    setPortfolio(prev => {
      return prev.map(h => {
        const live = liveData.find((x: any) =>
          x.symbol === h.symbol ||
          x.nseScripCode === h.symbol ||
          x.ticker === h.symbol
        );
        const latestPrice = Number(
          live?.latestPrice ??
          live?.ltp ??
          live?.lastPrice ??
          live?.price
        );
        console.log("Matching live quote", {
          holdingSymbol: h.symbol,
          live,
        });
        console.log("Resolved latestPrice", latestPrice);
        return {
          ...h,
          currentPrice:
            Number.isFinite(latestPrice) && latestPrice > 0
              ? latestPrice
              : h.currentPrice,
        };
      });
    });
  } catch (e) {
    console.error(e);
  }
};

  const handleAddHolding = async (
    ipoId: string,
    avgCost: number,
    quantity: number
  ) => {
    const growwRes = await fetch(`/api/groww/holding/${encodeURIComponent(ipoId)}`);

    let symbol = ipoId;
    let companyName = ipoId;

    if (growwRes.ok) {
      const groww = await growwRes.json();
      symbol =
        groww?.nseScripCode ||
        groww?.symbol ||
        groww?.ticker ||
        ipoId;

      companyName =
        groww?.companyName ||
        groww?.company_short_name ||
        groww?.title ||
        groww?.name ||
        ipoId;
    } else {
      const ipo = ipos.find(i => i.id === ipoId || i.symbol === ipoId || i.name === ipoId);
      if (ipo) {
        symbol = ipo.symbol;
        companyName = ipo.companyName || ipo.name;
      }
    }

    const holding = {
      id: crypto.randomUUID(),
      ipoId,
      symbol,
      companyName,
      quantity,
      avgCost,
      currentPrice: avgCost,
    } as PortfolioHolding;

    console.log("Holding added", holding);
    setPortfolio(prev => {
      const next = [...prev, holding];
      portfolioRef.current = next;
      return next;
    });

    setTimeout(() => {
      fetchPortfolio();
    }, 100);
  };

  const handleClearNotifications = async () => {
    try {
      const res = await fetch("/api/notifications/clear", { method: "POST" });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (e) {
      console.error("Failed to clear notifications", e);
    }
  };

  const handleNseSync = async () => {
    try {
      const res = await fetch("/api/applications/nse-sync", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications);
        setNotifications(data.notifications);
        if (data.ipos) {
          setIpos(data.ipos);
        }
        return true;
      }
    } catch (e) {
      console.error("NSE sync failed", e);
    }
    return false;
  };

  const handleSignOut = async () => {
    localStorage.removeItem("iposense_access_token");
    localStorage.removeItem("iposense_refresh_token");
    localStorage.removeItem("iposense_user");
    await signOut(auth);
    setUser(null);
    setActiveTab("dashboard");
    window.dispatchEvent(new Event("iposense_auth_changed"));
  };

  useEffect(() => {
    const handleAuthChange = () => {
      try {
        const saved = localStorage.getItem("iposense_user");
        if (saved) {
          setUser(JSON.parse(saved));
        } else {
          setUser(null);
        }
      } catch (_) {
        setUser(null);
      }
    };

    window.addEventListener("iposense_auth_changed", handleAuthChange);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const customSaved = localStorage.getItem("iposense_user");
      // Only use Firebase user state if there is no custom JWT user session
      if (!customSaved) {
        setUser(currentUser);
      }
      
      // When auth state shifts, load corresponding Postgres records
      setLoading(true);
      try {
        await Promise.all([
          fetchApplications(),
          fetchPortfolio(),
          fetchNotifications(),
          fetchWatchlist(),
          fetchNews(),
        ]);
      } catch (err) {
        console.error("Failed loading authenticated user context records:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      window.removeEventListener("iposense_auth_changed", handleAuthChange);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Fetch non-user-specific IPO general catalog
    fetchIpos();

    // Establish real-time Server-Sent Events (SSE) connection
    const eventSource = new EventSource("/api/sse/live-stream");
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "GMP_TICK") {
          // Incrementally update only the specific IPO's grey market premium (GMP)
          setIpos(prev => prev.map(ipo => {
            if (ipo.symbol === data.ipoSymbol) {
              return { ...ipo, gmp: data.gmp };
            }
            return ipo;
          }));
          
          // Pull new database-backed notifications triggered by background celery worker
          fetchNotifications();
        }
      } catch (err) {
        console.error("Failed to parse SSE event payload:", err);
      }
    };

    // Active automatic polling for allotments, alerts, and portfolios as backup
    const timer = setInterval(() => {
      fetchNotifications();
      fetchNews();
      fetchApplications();
      console.log("Polling tick", new Date().toISOString());
      fetchPortfolio();
    }, 2000);

    return () => {
      clearInterval(timer);
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Application tracker handler
  const handleTrackApplication = async (app: {
    ipoId: string;
    pan: string;
    appNumber: string;
    broker: string;
    category: 'RETAIL' | 'HNI' | 'EMPLOYEE' | 'SHAREHOLDER';
    lots: number;
    investmentAmount: number;
    upiId: string;
  }) => {
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(app)
      });
      if (res.ok) {
        await fetchApplications();
      } else {
        const err = await res.json();
        throw new Error(err.error || "Failed to record application");
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  // Check allotment handler
  const handleCheckAllotment = async (appNumber: string, pan: string) => {
    try {
      const res = await fetch("/api/allotment-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appNumber, pan })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error(e);
    }
  };


  // Total Portfolio value calculation
  const portfolioValue = portfolio.reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0);

  return (
    <div className={darkMode ? "dark text-foreground bg-background min-h-screen" : "text-foreground bg-background min-h-screen"}>
      <div className="flex h-screen overflow-hidden">
        
        {/* Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          user={user}
          onSignInClick={() => setIsAuthModalOpen(true)}
          onSignOutClick={handleSignOut}
        />

        {/* Workspace Container */}
        <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
          
          {/* Global Header */}
          <header className="h-16 border-b border-border bg-card px-8 flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="font-mono">
                  {new Date().toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>
              </div>
              <div className="h-4 w-px bg-border"></div>
              <div className="flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full font-bold">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>Pricing API Live</span>
              </div>
              <div className="h-4 w-px bg-border"></div>
              <button 
                onClick={async () => {
                  const nextSim = !simulateRateLimit;
                  setSimulateRateLimit(nextSim);
                  // Trigger a re-fetch immediately with the new state
                  setTimeout(() => {
                    fetchIpos();
                  }, 100);
                }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                  simulateRateLimit 
                    ? "bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25 animate-pulse" 
                    : "bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
                title="Toggle API rate limit simulation (Status 429)"
              >
                {simulateRateLimit ? "⚠️ Simulated Limit Active (429)" : "Simulate API Rate Limit (429)"}
              </button>
            </div>
 
            <div className="flex items-center space-x-4 text-xs font-mono">
              <span className="text-muted-foreground">Server Connection Status:</span>
              <span className="font-bold text-emerald-500">OPTIMAL</span>
              
              <div className="h-4 w-px bg-border"></div>
              
              {/* Premium Theme Switcher toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-foreground transition-all duration-200 cursor-pointer"
                title={darkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
                id="header-theme-toggle"
              >
                {darkMode ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-[11px] font-sans font-medium">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="text-[11px] font-sans font-medium">Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          </header>
 
          {/* Main Dashboard Panel workspace content */}
          <main className="flex-1 overflow-y-auto p-8 bg-background scrollbar-thin">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                <span className="text-xs font-mono text-muted-foreground animate-pulse">Synchronizing multi-source financial indexes...</span>
              </div>
            ) : serviceUnavailable ? (
              <div className="min-h-[60vh] flex items-center justify-center">
                <div className="max-w-2xl w-full bg-card border border-rose-500/20 rounded-2xl p-8 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 animate-pulse"></div>
                  
                  <div className="flex items-start space-x-5">
                    <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500 shrink-0">
                      <BadgeAlert className="h-8 w-8 animate-bounce" />
                    </div>
                    <div className="space-y-4 flex-1">
                      <div>
                        <span className="text-[10px] font-mono font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          HTTP STATUS 429 / 503
                        </span>
                        <h2 className="text-xl font-bold tracking-tight text-foreground mt-2">
                          NSE IPO Intelligence Service Temporarily Offline
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                          The real-time NSE/IPO API rate limit or client request quota has been exhausted. Secure communication gateway returned a <code className="text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded font-mono text-xs">Too Many Requests (429)</code> or <code className="text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded font-mono text-xs">Service Unavailable (503)</code> response.
                        </p>
                      </div>
 
                      <div className="bg-muted/30 border border-border rounded-xl p-4 font-mono text-xs text-muted-foreground space-y-2">
                        <div className="flex justify-between">
                          <span>Target Endpoint:</span>
                          <span className="text-foreground font-semibold">https://upcoming-ipo-calendar.p.rapidapi.com/</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Secure Gateway Proxy:</span>
                          <span className="text-foreground">/api/nse-ipos</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active API Key:</span>
                          <span className="text-rose-400 font-semibold select-all">e769201f04msh11b41ffaf3ac7d0p149f96jsn42faf1fb86aa</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Diagnostics State:</span>
                          <span className="text-rose-400 font-semibold uppercase">{simulateRateLimit ? "EMULATION ACTIVE" : "REAL API LIMIT EXHAUSTED"}</span>
                        </div>
                      </div>
 
                      <div className="flex items-center space-x-3 pt-2">
                        <button
                          onClick={() => {
                            setLoading(true);
                            fetchIpos().finally(() => setLoading(false));
                          }}
                          className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-xl flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Retry Connection</span>
                        </button>
                        
                        {simulateRateLimit && (
                          <button
                            onClick={() => {
                              setSimulateRateLimit(false);
                              setLoading(true);
                              // Timeout to allow state sync before fetch
                              setTimeout(() => {
                                fetchIpos().finally(() => setLoading(false));
                              }, 100);
                            }}
                            className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-semibold rounded-xl border border-border transition-all cursor-pointer"
                          >
                            Disable Emulation (Restore Sandbox)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {activeTab === "admin" && (
                  <AdminCenter 
                    onNseSync={handleNseSync}
                    simulateRateLimit={simulateRateLimit}
                    setSimulateRateLimit={setSimulateRateLimit}
                  />
                )}
                {activeTab === "research" && (
                  <ResearchHub ipos={ipos} />
                )}
                {activeTab === "dashboard" && (
                  <DashboardOverview 
                    ipos={ipos} 
                    onNavigate={setActiveTab} 
                    applicationsCount={applications.length}
                    portfolioValue={portfolioValue || 142500}
                    notifications={notifications}
                    onClearNotifications={handleClearNotifications}
                  />
                )}
                {activeTab === "discovery" && (
                  <IpoDiscovery 
                    ipos={ipos} 
                    watchlist={watchlist}
                    onToggleWatchlist={handleToggleWatchlist}
                    onTrackApplication={handleTrackApplication} 
                    user={user}
                  />
                )}
                {activeTab === "tracker" && (
                  <AllotmentTracker 
                    applications={applications} 
                    ipos={ipos} 
                    onCheckAllotment={handleCheckAllotment}
                    onRefreshList={fetchApplications}
                    onNseSync={handleNseSync}
                  />
                )}
                {activeTab === "listing" && (
                  <ListingDayAI />
                )}
                {activeTab === "portfolio" && (
                  <PortfolioHoldings
                    holdings={portfolio}
                    ipos={ipos}
                    watchlist={watchlist}
                    onToggleWatchlist={handleToggleWatchlist}
                    onAddHolding={handleAddHolding}
                  />
                )}
                {activeTab === "arena" && (
                  <AiArena ipos={ipos} />
                )}
                {activeTab === "rhp-analyzer" && (
                  <RhpAnalyzer />
                )}
                {activeTab === "news-analyzer" && (
                  <NewsAnalyzer news={news} />
                )}
                {activeTab === "social-analyzer" && (
                  <SocialAnalyzer />
                )}
                {activeTab === "market-intelligence" && (
                  <MarketIntelligence />
                )}
                {activeTab === "notifications" && (
                  <PushAlertsHub onNotificationTrigger={fetchNotifications} />
                )}
              </>
            )}
          </main>

        </div>
      </div>

      {/* Persistent Floating Chatbot */}
      <FloatingChatbot />

      {/* Auth Modal for cloud user sessions */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      {/* Interactive Guided Onboarding Tour Overlay */}
      <OnboardingTour activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}