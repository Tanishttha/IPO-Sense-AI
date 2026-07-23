import React, { useState } from "react";
import { 
  Search, 
  Sparkles, 
  ArrowRight, 
  ShieldAlert, 
  Briefcase, 
  FileText, 
  Activity, 
  HelpCircle, 
  Plus, 
  Percent, 
  Layers, 
  Compass, 
  BookOpen, 
  Target, 
  Loader2,
  Check,
  TrendingUp,
  X,
  Scale,
  Trash2,
  Info,
  Star,
  RefreshCw,
  Calendar,
  SlidersHorizontal
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  ReferenceLine 
} from "recharts";
import { IPO } from "../types";

interface DiscoveryProps {
  ipos: IPO[];
  watchlist?: string[];
  onToggleWatchlist?: (id: string) => void;
  onTrackApplication: (app: {
    ipoId: string;
    pan: string;
    appNumber: string;
    broker: string;
    category: 'RETAIL' | 'HNI' | 'EMPLOYEE' | 'SHAREHOLDER';
    lots: number;
    investmentAmount: number;
    upiId: string;
  }) => Promise<void>;
  user?: any;
}

function NotificationPreferencesPanel() {
  const [preferences, setPreferences] = React.useState({
    fcm: true,
    email: true,
    sms: true,
    telegram: true,
    whatsapp: false
  });
  const [saving, setSaving] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/user/settings")
      .then(res => res.json())
      .then(data => {
        if (data && data.notificationPreferences) {
          setPreferences(data.notificationPreferences);
        }
      })
      .catch(err => console.error("Failed to load user settings:", err));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences })
      });
      if (res.ok) {
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 2500);
      }
    } catch (e) {
      console.error("Failed to save settings:", e);
    } finally {
      setSaving(false);
    }
  };

  const togglePref = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4 text-left">
      <h4 className="text-xs font-extrabold flex items-center gap-1.5 text-foreground uppercase tracking-wider font-mono">
        <Activity className="h-4 w-4 text-primary" />
        <span>Multichannel Alert Hub</span>
      </h4>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Stay updated with official IPO announcements, subscription updates, allotment results, and listing notifications.
      </p>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs py-1">
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground">Push Notifications</span>
            <span className="text-[10px] text-muted-foreground block">Instant system browser triggers</span>
          </div>
          <input 
            type="checkbox" 
            checked={preferences.fcm}
            onChange={() => togglePref("fcm")}
            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between text-xs py-1">
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground">Email Alerts</span>
            <span className="text-[10px] text-muted-foreground block">Detailed financial summary PDFs</span>
          </div>
          <input 
            type="checkbox" 
            checked={preferences.email}
            onChange={() => togglePref("email")}
            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between text-xs py-1">
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground">SMS Notifications</span>
            <span className="text-[10px] text-muted-foreground block">Mobile urgent delivery alerts</span>
          </div>
          <input 
            type="checkbox" 
            checked={preferences.sms}
            onChange={() => togglePref("sms")}
            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between text-xs py-1">
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground">Telegram Channel</span>
            <span className="text-[10px] text-muted-foreground block">Public and private subscriber lists</span>
          </div>
          <input 
            type="checkbox" 
            checked={preferences.telegram}
            onChange={() => togglePref("telegram")}
            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between text-xs py-1">
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground">WhatsApp Dispatcher</span>
            <span className="text-[10px] text-muted-foreground block">Personalized allotment result maps</span>
          </div>
          <input 
            type="checkbox" 
            checked={preferences.whatsapp}
            onChange={() => togglePref("whatsapp")}
            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
          />
        </div>
      </div>

      <div className="pt-2">
        {savedMsg ? (
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-center rounded-xl text-xs font-bold font-mono">
            Preferences Saved!
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 rounded-xl text-xs flex items-center justify-center space-x-1 cursor-pointer transition-all"
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            <span>Save Channel Preferences</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function IpoDiscovery({ ipos, watchlist = [], onToggleWatchlist, onTrackApplication, user }: DiscoveryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "UPCOMING" | "CLOSED" | "LISTED">("ALL");
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [subscriptionFilter, setSubscriptionFilter] = useState("ALL");
  const [gmpPercentFilter, setGmpPercentFilter] = useState("ALL");
  const [issueSizeFilter, setIssueSizeFilter] = useState("ALL");
  const [sortOption, setSortOption] = useState("default");
  const [directoryTab, setDirectoryTab] = useState<"list" | "gmp-chart" | "subscription-chart" | "timeline">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIpo, setSelectedIpo] = useState<IPO | null>(null);
  const [liveGrowwIpos, setLiveGrowwIpos] = useState<IPO[]>([]);
  const [loadingLiveGroww, setLoadingLiveGroww] = useState(false);

  React.useEffect(() => {
    const loadLiveIpos = async () => {
      setLoadingLiveGroww(true);
      try {
        const res = await fetch("/api/ipo/groww/open");
        if (!res.ok) {
          throw new Error(`IPO API failed: ${res.status}`);
        }

        const data = await res.json();
        console.log("Groww IPO API response:", data);
        const growwIpos = ((data?.ipoList || data || [])).map((ipo: any, index: number) => ({
          ...ipo,
          id: ipo.id || ipo.searchId || ipo.symbol || `groww-${index}`,
          name: ipo.name || ipo.companyName || ipo.company || "Upcoming IPO",
          symbol: ipo.symbol || "IPO",
          status: ipo.status || "UPCOMING",
          priceBand: ipo.priceBand || `₹${ipo.categories?.[0]?.minPrice || ipo.minPrice || "TBA"} - ₹${ipo.categories?.[0]?.maxPrice || ipo.maxPrice || "TBA"}`,
          minPrice: ipo.minPrice || ipo.categories?.[0]?.minPrice || 0,
          maxPrice: ipo.maxPrice || ipo.categories?.[0]?.maxPrice || 0,
          lotSize: ipo.lotSize || ipo.categories?.[0]?.lotSize || 0,
          issueSize: ipo.issueSize || (ipo.maxPrice && ipo.lotSize ? `₹${(ipo.maxPrice * ipo.lotSize).toLocaleString("en-IN")}` : "N/A"),
          gmp: ipo.gmp ?? 0,
          gmpPercent: ipo.gmpPercent ?? 0,
          subscriptionOverall: ipo.subscriptionOverall ?? ipo.overallSubscription ?? 0,
          subscriptionRetail: ipo.subscriptionRetail ?? 0,
          subscriptionQib: ipo.subscriptionQib ?? 0,
          subscriptionHni: ipo.subscriptionHni ?? 0,
          categories: ipo.categories || [],
          companyCode: ipo.companyCode,
          searchId: ipo.searchId,
          isSme: ipo.isSme,
          isPreApply: ipo.isPreApply,
          openDate: ipo.openDate || (ipo.bidStartTimestamp ? new Date(ipo.bidStartTimestamp).toISOString().split("T")[0] : "TBA"),
          closeDate: ipo.closeDate || (ipo.bidEndTimestamp ? new Date(ipo.bidEndTimestamp).toISOString().split("T")[0] : "TBA"),
          listingDate:ipo.listingDate || "TBA",
          industry: ipo.industry || "N/A"
        }));

        if (!Array.isArray(growwIpos)) {
          throw new Error("Invalid IPO response");
        }

        setLiveGrowwIpos(growwIpos as IPO[]);
      } catch (error) {
        console.error("IPO API fetch failed", error);
        setLiveGrowwIpos(ipos || []);
      } finally {
        setLoadingLiveGroww(false);
      }
    };

    loadLiveIpos();
  }, [ipos]);
  
  // IPO Comparison States
  const [activeSubView, setActiveSubView] = useState<"directory" | "comparison" | "historical_listings">("directory");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // RapidAPI integration states removed

  // Historical Listed IPOs from PostgreSQL db
  const [historicalIpos, setHistoricalIpos] = useState<any[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState(false);

  // New historical IPO fields (for Analysts/Admins)
  const [newHistSymbol, setNewHistSymbol] = useState("");
  const [newHistName, setNewHistName] = useState("");
  const [newHistListingDate, setNewHistListingDate] = useState("");
  const [newHistIssuePrice, setNewHistIssuePrice] = useState("");
  const [newHistListingPrice, setNewHistListingPrice] = useState("");
  const [newHistCurrentPrice, setNewHistCurrentPrice] = useState("");
  const [newHistGainPercent, setNewHistGainPercent] = useState("");
  const [newHistSector, setNewHistSector] = useState("");
  const [submittingHist, setSubmittingHist] = useState(false);
  const [histMsg, setHistMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchHistoricalIpos = async () => {
    setLoadingHistorical(true);
    try {
      const res = await fetch("/api/historical-ipos");
      if (res.ok) {
        const data = await res.json();
        setHistoricalIpos(data);
      }
    } catch (e) {
      console.error("Failed to load historical listings", e);
    } finally {
      setLoadingHistorical(false);
    }
  };

  const handleCreateHistoricalIpo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHistSymbol || !newHistName || !newHistListingDate || !newHistIssuePrice || !newHistListingPrice) return;
    setSubmittingHist(true);
    setHistMsg(null);
    try {
      const res = await fetch("/api/historical-ipos", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-Role": user?.role || "INVESTOR"
        },
        body: JSON.stringify({
          symbol: newHistSymbol,
          name: newHistName,
          listingDate: newHistListingDate,
          issuePrice: Number(newHistIssuePrice),
          listingPrice: Number(newHistListingPrice),
          currentPrice: Number(newHistCurrentPrice || newHistListingPrice),
          listingGainPercent: Number(newHistGainPercent || 0),
          sector: newHistSector
        })
      });
      const data = await res.json();
      if (res.ok) {
        setHistMsg({ type: "success", text: "Successfully archived historical listed IPO!" });
        setNewHistSymbol("");
        setNewHistName("");
        setNewHistListingDate("");
        setNewHistIssuePrice("");
        setNewHistListingPrice("");
        setNewHistCurrentPrice("");
        setNewHistGainPercent("");
        setNewHistSector("");
        fetchHistoricalIpos();
      } else {
        throw new Error(data.error || "Failed to submit listing");
      }
    } catch (err: any) {
      setHistMsg({ type: "error", text: err.message });
    } finally {
      setSubmittingHist(false);
    }
  };

  React.useEffect(() => {
    if (activeSubView === "historical_listings") {
      fetchHistoricalIpos();
    }
  }, [activeSubView]);

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  // AI Feature States
  const [activeDetailsTab, setActiveDetailsTab] = useState<"overview" | "financials" | "ai-analysis" | "rhp" | "predict">("overview");
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);
  const [loadingRhp, setLoadingRhp] = useState(false);
  const [rhpResult, setRhpResult] = useState<any | null>(null);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [predictResult, setPredictResult] = useState<any | null>(null);

  // Application tracker modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [pan, setPan] = useState("");
  const [appNumber, setAppNumber] = useState("");
  const [broker, setBroker] = useState("Zerodha");
  const [category, setCategory] = useState<'RETAIL' | 'HNI' | 'EMPLOYEE' | 'SHAREHOLDER'>("RETAIL");
  const [lots, setLots] = useState(1);
  const [upiId, setUpiId] = useState("");
  const [savingApp, setSavingApp] = useState(false);
  const [appSavedSuccess, setAppSavedSuccess] = useState(false);

  // Filters & Sorting logic
  const sourceIpos = (liveGrowwIpos.length > 0 ? liveGrowwIpos : ipos).map((ipo: any) => ({
    ...ipo,
    name: ipo.name || ipo.companyName || "Upcoming IPO",
    symbol: ipo.symbol || "IPO",
    priceBand: ipo.priceBand || `₹${ipo.minPrice ?? "TBA"} - ₹${ipo.maxPrice ?? "TBA"}`,
    issueSize: ipo.issueSize && ipo.issueSize !== "N/A" ? ipo.issueSize : (ipo.maxPrice && ipo.lotSize ? `₹${(ipo.maxPrice * ipo.lotSize).toLocaleString("en-IN")}` : "N/A"),
    gmp: ipo.gmp ?? 0,
    gmpPercent: ipo.gmpPercent ?? 0,
    subscriptionOverall: ipo.subscriptionOverall ?? ipo.overallSubscription ?? 0,
    subscriptionRetail: ipo.subscriptionRetail ?? 0,
    subscriptionQib: ipo.subscriptionQib ?? 0,
    subscriptionHni: ipo.subscriptionHni ?? 0,
    status: ipo.status || "UPCOMING"
  }));

  // Dynamic Industry (Sector) categories
  const sectors = Array.from(new Set(sourceIpos.map((ipo) => ipo.industry).filter(Boolean)));

  // Helper to parse issue size to a numeric Cr value
  const getIssueSizeInCr = (sizeStr: string | number | null | undefined): number => {
    if (sizeStr === null || sizeStr === undefined) return 0;

    const clean = String(sizeStr).replace(/[^0-9.]/g, "");
    const val = parseFloat(clean);
    return Number.isNaN(val) ? 0 : val;
  };

  const filteredIpos = sourceIpos.filter(ipo => {
    const matchesSearch = (ipo.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ipo.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || ipo.status === statusFilter;
    const matchesSector = sectorFilter === "ALL" || ipo.industry === sectorFilter;
    
    let matchesSub = true;
    if (subscriptionFilter === "1x") matchesSub = ipo.subscriptionOverall >= 1;
    else if (subscriptionFilter === "10x") matchesSub = ipo.subscriptionOverall >= 10;
    else if (subscriptionFilter === "50x") matchesSub = ipo.subscriptionOverall >= 50;
    
    let matchesGmp = true;
    if (gmpPercentFilter === "POSITIVE") matchesGmp = ipo.gmpPercent > 0;
    else if (gmpPercentFilter === "HIGH_GAIN") matchesGmp = ipo.gmpPercent >= 30;
    else if (gmpPercentFilter === "PREMIUM") matchesGmp = ipo.gmpPercent >= 50;
    else if (gmpPercentFilter === "NEGATIVE") matchesGmp = ipo.gmpPercent <= 0;
    
    let matchesSize = true;
    const sizeCr = getIssueSizeInCr(ipo.issueSize);
    if (issueSizeFilter === "SMALL") matchesSize = sizeCr < 500;
    else if (issueSizeFilter === "MEDIUM") matchesSize = sizeCr >= 500 && sizeCr <= 2000;
    else if (issueSizeFilter === "LARGE") matchesSize = sizeCr > 2000;
    
    return matchesSearch && matchesStatus && matchesSector && matchesSub && matchesGmp && matchesSize;
  });

  const sortedIpos = [...filteredIpos].sort((a, b) => {
    if (sortOption === "gmp") {
      return b.gmpPercent - a.gmpPercent;
    }
    if (sortOption === "subscription") {
      return b.subscriptionOverall - a.subscriptionOverall;
    }
    if (sortOption === "aiScore") {
      return b.aiScore - a.aiScore;
    }
    if (sortOption === "issueSize") {
      return getIssueSizeInCr(b.issueSize) - getIssueSizeInCr(a.issueSize);
    }
    if (sortOption === "openDate_asc") {
      return new Date(a.openDate).getTime() - new Date(b.openDate).getTime();
    }
    if (sortOption === "openDate_desc") {
      return new Date(b.openDate).getTime() - new Date(a.openDate).getTime();
    }
    return 0; // default (no additional sorting)
  });

  const handleChartClick = (state: any) => {
    if (state && state.activePayload && state.activePayload[0]) {
      const sym = state.activePayload[0].payload.name;
      const origIpo = sourceIpos.find(i => i.symbol === sym);
      if (origIpo) handleSelectIpo(origIpo);
    }
  };

  const renderGmpChart = () => {
    const chartData = [...filteredIpos]
      .filter(ipo => ipo.gmpPercent !== undefined)
      .sort((a, b) => b.gmpPercent - a.gmpPercent)
      .map(ipo => ({
        name: ipo.symbol,
        fullName: ipo.name,
        "GMP %": ipo.gmpPercent,
        "GMP Value (₹)": ipo.gmp,
        industry: ipo.industry,
        status: ipo.status,
      }));

    if (chartData.length === 0) {
      return (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card animate-fadeIn">
          <Activity className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="mt-4 text-lg font-semibold">No data available for GMP chart</h3>
          <p className="text-sm text-muted-foreground mt-1">Try relaxing your search or sector filters to see results.</p>
        </div>
      );
    }

    const avgGmp = Math.round(chartData.reduce((acc, curr) => acc + curr["GMP %"], 0) / chartData.length);
    const highestGmp = Math.max(...chartData.map(d => d["GMP %"]));
    const highestGmpIpo = chartData.find(d => d["GMP %"] === highestGmp)?.fullName || "N/A";

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground">Average GMP Gain</span>
            <p className="text-2xl font-black text-emerald-500 mt-1">{avgGmp}%</p>
            <span className="text-[10px] text-muted-foreground">Expected listing day average gain</span>
          </div>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
            <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground">Peak Expected Premium</span>
            <p className="text-2xl font-black text-primary mt-1">{highestGmp}%</p>
            <span className="text-[10px] text-muted-foreground truncate block">{highestGmpIpo}</span>
          </div>
          <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10">
            <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground">Filtered Assets</span>
            <p className="text-2xl font-black text-violet-500 mt-1">{chartData.length}</p>
            <span className="text-[10px] text-muted-foreground">Under active analysis</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-foreground">Expected Grey Market Gains (%)</h4>
              <p className="text-xs text-muted-foreground">Visualizes expected listing day premium percent based on latest OTC grey market demand. Click on a bar to select that IPO.</p>
            </div>
          </div>

          <div className="h-80 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                onClick={handleChartClick}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                <XAxis dataKey="name" stroke="#888888" tickLine={false} />
                <YAxis stroke="#888888" tickLine={false} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px" }}
                  labelStyle={{ fontWeight: "bold" }}
                  formatter={(value: any, name: any) => {
                    if (name === "GMP %") return [`${value}%`, name];
                    return [`₹${value}`, name];
                  }}
                />
                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                <Bar 
                  dataKey="GMP %" 
                  fill="#6366f1" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={45}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderSubscriptionChart = () => {
    const chartData = [...filteredIpos]
      .filter(ipo => ipo.status !== "UPCOMING" && ipo.subscriptionOverall !== undefined)
      .sort((a, b) => b.subscriptionOverall - a.subscriptionOverall)
      .map(ipo => ({
        name: ipo.symbol,
        fullName: ipo.name,
        "Overall": ipo.subscriptionOverall,
        "Retail": ipo.subscriptionRetail,
        "HNI": ipo.subscriptionHni,
        "QIB": ipo.subscriptionQib,
      }));

    if (chartData.length === 0) {
      return (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card animate-fadeIn">
          <Activity className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="mt-4 text-lg font-semibold">No active subscriptions to plot</h3>
          <p className="text-sm text-muted-foreground mt-1">There are no currently active, closed, or listed IPOs matching the filters.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-foreground">Subscription Times (x) Breakdown</h4>
            <p className="text-xs text-muted-foreground">Compares oversubscription ratios across Retail, High Net-Worth Individuals (HNI), and Qualified Institutional Buyers (QIB). Click on a bar to select that IPO.</p>
          </div>

          <div className="h-80 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                onClick={handleChartClick}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                <XAxis dataKey="name" stroke="#888888" tickLine={false} />
                <YAxis stroke="#888888" tickLine={false} unit="x" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px" }}
                  labelStyle={{ fontWeight: "bold" }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="Overall" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={15} className="cursor-pointer" />
                <Bar dataKey="Retail" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={15} className="cursor-pointer" />
                <Bar dataKey="HNI" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={15} className="cursor-pointer" />
                <Bar dataKey="QIB" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={15} className="cursor-pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderIpoTimeline = () => {
    interface TimelineEvent {
      id: string;
      ipoId: string;
      ipoName: string;
      symbol: string;
      type: "OPEN" | "CLOSE" | "LISTING";
      date: Date;
      dateStr: string;
      status: string;
    }

    const events: TimelineEvent[] = [];

    filteredIpos.forEach(ipo => {
      if (ipo.openDate) {
        events.push({
          id: `${ipo.id}-open`,
          ipoId: ipo.id,
          ipoName: ipo.name,
          symbol: ipo.symbol,
          type: "OPEN",
          date: new Date(ipo.openDate),
          dateStr: ipo.openDate,
          status: ipo.status,
        });
      }
      if (ipo.closeDate) {
        events.push({
          id: `${ipo.id}-close`,
          ipoId: ipo.id,
          ipoName: ipo.name,
          symbol: ipo.symbol,
          type: "CLOSE",
          date: new Date(ipo.closeDate),
          dateStr: ipo.closeDate,
          status: ipo.status,
        });
      }
      if (ipo.listingDate) {
        events.push({
          id: `${ipo.id}-listing`,
          ipoId: ipo.id,
          ipoName: ipo.name,
          symbol: ipo.symbol,
          type: "LISTING",
          date: new Date(ipo.listingDate),
          dateStr: ipo.listingDate,
          status: ipo.status,
        });
      }
    });

    const sortedEvents = events
      .filter(e => !isNaN(e.date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (sortedEvents.length === 0) {
      return (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card animate-fadeIn">
          <Calendar className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="mt-4 text-lg font-semibold">No timeline milestones matching filters</h3>
          <p className="text-sm text-muted-foreground mt-1">Try expanding your search, sector, or status parameters.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/15">
          <h4 className="text-sm font-bold text-foreground">Interactive Capital Allocator & Timeline</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Chronological checklist of funding commitments, bidding windows, and listing days.</p>
        </div>

        <div className="relative border-l border-border pl-6 ml-3 space-y-6 py-2">
          {sortedEvents.map((event) => {
            const isToday = new Date(event.dateStr).toDateString() === new Date().toDateString();
            const isPast = event.date < new Date() && !isToday;

            return (
              <div key={event.id} className="relative">
                <span className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border bg-card flex items-center justify-center ${
                  event.type === "OPEN" ? "border-emerald-500" :
                  event.type === "CLOSE" ? "border-rose-500" : "border-primary"
                } ${isToday ? "ring-4 ring-primary/20 scale-110" : ""}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    event.type === "OPEN" ? "bg-emerald-500" :
                    event.type === "CLOSE" ? "bg-rose-500" : "bg-primary"
                  }`} />
                </span>

                <div 
                  onClick={() => {
                    const origIpo = ipos.find(i => i.id === event.ipoId);
                    if (origIpo) handleSelectIpo(origIpo);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:bg-muted/10 ${
                    selectedIpo?.id === event.ipoId 
                      ? "border-primary bg-primary/5 shadow-sm" 
                      : "border-border hover:border-border-hover bg-card shadow-sm"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded font-bold text-[10px]">
                          {event.symbol}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          event.type === "OPEN" ? "bg-emerald-500/10 text-emerald-500" :
                          event.type === "CLOSE" ? "bg-rose-500/10 text-rose-500" :
                          "bg-primary/10 text-primary"
                        }`}>
                          {event.type === "OPEN" ? "Bidding Opens" :
                           event.type === "CLOSE" ? "Bidding Closes" : "Listing Day"}
                        </span>
                        {isToday && (
                          <span className="bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.2 rounded animate-pulse">
                            TODAY
                          </span>
                        )}
                      </div>
                      <h5 className="font-bold text-foreground text-sm">{event.ipoName}</h5>
                    </div>

                    <div className="text-right text-xs font-mono">
                      <span className="text-muted-foreground block text-[10px]">Date</span>
                      <span className={`font-bold ${isToday ? "text-primary font-black" : isPast ? "text-muted-foreground" : "text-foreground"}`}>
                        {new Date(event.dateStr).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleSelectIpo = (ipo: IPO) => {
    setSelectedIpo(ipo);
    setActiveDetailsTab("overview");
    setAiAnalysisResult(null);
    setRhpResult(null);
    setPredictResult(null);
  };

  // Dynamic Groq Call - AI Deep Analysis
  const runAiAnalysis = async (id: string) => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/groq/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipoId: id })
      });
      const data = await res.json();
      setAiAnalysisResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAi(false);
    }
  };

  // Dynamic Groq Call - RHP 5-Minute Summary
  const runRhpSummary = async (id: string) => {
    setLoadingRhp(true);
    try {
      const res = await fetch("/api/groq/rhp-summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipoId: id })
      });
      const data = await res.json();
      setRhpResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRhp(false);
    }
  };

  // Dynamic Groq Call - Listing Price Target Predictor
  const runListingPredictor = async (id: string) => {
    setLoadingPredict(true);
    try {
      const res = await fetch("/api/groq/listing-predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipoId: id })
      });
      const data = await res.json();
      setPredictResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPredict(false);
    }
  };

  // Save Application Tracker
  const submitApplicationTracker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIpo) return;
    setSavingApp(true);
    try {
      await onTrackApplication({
        ipoId: selectedIpo.id,
        pan,
        appNumber,
        broker,
        category,
        lots,
        investmentAmount: lots * selectedIpo.maxPrice * selectedIpo.lotSize,
        upiId
      });
      setAppSavedSuccess(true);
      setTimeout(() => {
        setAppSavedSuccess(false);
        setShowApplyModal(false);
        // Reset form
        setPan("");
        setAppNumber("");
        setUpiId("");
        setLots(1);
      }, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingApp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">IPO Directory & Intelligence</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Discover live IPO openings, analyze prospectuses, and track IPO insights.
          </p>
        </div>

        {/* Sub View Toggle Tabs */}
        <div id="discovery-compare-tab" className="flex p-1 bg-muted/60 border border-border/50 rounded-xl text-xs font-medium space-x-1 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setActiveSubView("directory")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeSubView === "directory"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Directory Listing
          </button>
          <button
            onClick={() => setActiveSubView("comparison")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeSubView === "comparison"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>IPO Comparison</span>
            {compareIds.length > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] h-4.5 min-w-4.5 px-1.5 rounded-full flex items-center justify-center font-bold">
                {compareIds.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubView("historical_listings")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeSubView === "historical_listings"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Historical Listings (Postgres)</span>
          </button>
        </div>
      </div>

      {activeSubView === "directory" && (
        <>
          {/* CONTROL HUB: Search, Sort & Multi-filters */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by company or symbol..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-muted/40 border border-border pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:border-primary transition-all text-foreground placeholder-muted-foreground"
                />
              </div>

              {/* Quick Tab Selectors for Directory Views */}
              <div className="flex p-1 bg-muted/60 border border-border/50 rounded-xl text-xs font-semibold space-x-1 shrink-0 overflow-x-auto self-start md:self-auto">
                <button
                  onClick={() => setDirectoryTab("list")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                    directoryTab === "list"
                      ? "bg-card text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>List View</span>
                </button>
                {/* Removed GMP Graph button */}
                <button
                  onClick={() => setDirectoryTab("subscription-chart")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                    directoryTab === "subscription-chart"
                      ? "bg-card text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Percent className="h-3.5 w-3.5" />
                  <span>Subscription Graph</span>
                </button>
                <button
                  onClick={() => setDirectoryTab("timeline")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                    directoryTab === "timeline"
                      ? "bg-card text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Timeline Roadmap</span>
                </button>
              </div>

              {/* Advanced Filter Toggle & Reset */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    showFilters || sectorFilter !== "ALL" || subscriptionFilter !== "ALL" || gmpPercentFilter !== "ALL" || issueSizeFilter !== "ALL" || sortOption !== "default"
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-card border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Filters & Sort</span>
                  {(sectorFilter !== "ALL" || subscriptionFilter !== "ALL" || gmpPercentFilter !== "ALL" || issueSizeFilter !== "ALL") && (
                    <span className="bg-primary text-primary-foreground h-2 w-2 rounded-full animate-pulse" />
                  )}
                </button>

                {(searchTerm || statusFilter !== "ALL" || sectorFilter !== "ALL" || subscriptionFilter !== "ALL" || gmpPercentFilter !== "ALL" || issueSizeFilter !== "ALL" || sortOption !== "default") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("ALL");
                      setSectorFilter("ALL");
                      setSubscriptionFilter("ALL");
                      setGmpPercentFilter("ALL");
                      setIssueSizeFilter("ALL");
                      setSortOption("default");
                    }}
                    className="p-2 rounded-xl bg-muted hover:bg-muted-hover text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    title="Clear All Filters"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* EXPANDABLE MULTI-FILTERS & SORTING HUB */}
            {(showFilters || sectorFilter !== "ALL" || subscriptionFilter !== "ALL" || gmpPercentFilter !== "ALL" || issueSizeFilter !== "ALL" || sortOption !== "default") && (
              <div className="pt-3 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 animate-fadeIn text-xs">
                {/* 1. Status Filter */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider font-mono font-bold text-muted-foreground">Lifecycle Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e: any) => setStatusFilter(e.target.value)}
                    className="w-full bg-muted/40 border border-border px-3 py-2 rounded-xl focus:outline-none focus:border-primary text-foreground font-medium"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active (Open)</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="CLOSED">Closed</option>
                    <option value="LISTED">Listed</option>
                  </select>
                </div>

                {/* 2. Sector Filter */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider font-mono font-bold text-muted-foreground">Sector / Industry</label>
                  <select
                    value={sectorFilter}
                    onChange={(e: any) => setSectorFilter(e.target.value)}
                    className="w-full bg-muted/40 border border-border px-3 py-2 rounded-xl focus:outline-none focus:border-primary text-foreground font-medium"
                  >
                    <option value="ALL">All Sectors</option>
                    {sectors.map((sec, idx) => (
                      <option key={idx} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>

                {/* 3. GMP Gain Filter */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider font-mono font-bold text-muted-foreground">GMP Expectations</label>
                  <select
                    value={gmpPercentFilter}
                    onChange={(e: any) => setGmpPercentFilter(e.target.value)}
                    className="w-full bg-muted/40 border border-border px-3 py-2 rounded-xl focus:outline-none focus:border-primary text-foreground font-medium"
                  >
                    <option value="ALL">All GMP %</option>
                    <option value="POSITIVE">Positive Gains (&gt; 0%)</option>
                    <option value="HIGH_GAIN">High Premium (&ge; 30%)</option>
                    <option value="PREMIUM">Premium Surge (&ge; 50%)</option>
                    <option value="NEGATIVE">Flat or Discount (&le; 0%)</option>
                  </select>
                </div>

                {/* 4. Subscription Rate Filter */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider font-mono font-bold text-muted-foreground">Subscription Level</label>
                  <select
                    value={subscriptionFilter}
                    onChange={(e: any) => setSubscriptionFilter(e.target.value)}
                    className="w-full bg-muted/40 border border-border px-3 py-2 rounded-xl focus:outline-none focus:border-primary text-foreground font-medium"
                  >
                    <option value="ALL">All Ratios</option>
                    <option value="1x">Oversubscribed (&ge; 1x)</option>
                    <option value="10x">High Demand (&ge; 10x)</option>
                    <option value="50x">Mega Subscription (&ge; 50x)</option>
                  </select>
                </div>

                {/* 5. Issue Size & Sorting */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase tracking-wider font-mono font-bold text-muted-foreground">Issue Size</label>
                    <select
                      value={issueSizeFilter}
                      onChange={(e: any) => setIssueSizeFilter(e.target.value)}
                      className="w-full bg-muted/40 border border-border px-3 py-2 rounded-xl focus:outline-none focus:border-primary text-foreground font-medium"
                    >
                      <option value="ALL">All Sizes</option>
                      <option value="SMALL">Small Cap (&lt; ₹500Cr)</option>
                      <option value="MEDIUM">Mid Cap (₹500Cr - ₹2kCr)</option>
                      <option value="LARGE">Large Cap (&gt; ₹2kCr)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase tracking-wider font-mono font-bold text-muted-foreground">Sort By</label>
                    <select
                      value={sortOption}
                      onChange={(e: any) => setSortOption(e.target.value)}
                      className="w-full bg-muted/40 border border-border px-3 py-2 rounded-xl focus:outline-none focus:border-primary text-foreground font-medium"
                    >
                      <option value="default">Default</option>
                      <option value="gmp">GMP % (High &rarr; Low)</option>
                      <option value="subscription">Subscription</option>
                      <option value="aiScore">AI Valuation</option>
                      <option value="issueSize">Issue Size</option>
                      <option value="openDate_asc">Open Date (Oldest)</option>
                      <option value="openDate_desc">Open Date (Newest)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Grid View */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* Left side (Col-span 2) */}
            <div className="xl:col-span-2 space-y-4 animate-fadeIn">
              {/* Removed GMP Chart conditional render */}
              {directoryTab === "subscription-chart" && renderSubscriptionChart()}
              {directoryTab === "timeline" && renderIpoTimeline()}
              {directoryTab === "list" && (
                <>
                  {loadingLiveGroww ? (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card">
                      <Loader2 className="h-10 w-10 text-primary mx-auto animate-spin" />
                      <h3 className="mt-4 text-lg font-semibold">Loading Live IPO Data</h3>
                      <p className="text-sm text-muted-foreground mt-1">Fetching current IPO listings...</p>
                    </div>
                  ) : sortedIpos.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card">
                      <Compass className="h-10 w-10 text-muted-foreground mx-auto animate-spin" />
                      <h3 className="mt-4 text-lg font-semibold">No IPOs match your search</h3>
                      <p className="text-sm text-muted-foreground mt-1">Try expanding your search terms or changing filters.</p>
                    </div>
                  ) : (
                    sortedIpos.map((ipo) => {
                      const isGmpPositive = (ipo.gmp ?? 0) >= 0;
                      return (
                        <div
                          key={ipo.id}
                          onClick={() => handleSelectIpo(ipo)}
                          className={`p-5 rounded-2xl border bg-card hover:bg-muted/10 cursor-pointer shadow-sm transition-all duration-200 ${
                            selectedIpo?.id === ipo.id ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-border-hover"
                          }`}
                        >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm font-mono">
                        {ipo.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-base text-foreground">{ipo.name}</h3>
                          <span className="text-[10px] font-mono font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded">
                            {ipo.symbol}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{ipo.industry}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      {onToggleWatchlist && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWatchlist(ipo.id);
                          }}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all duration-200 cursor-pointer flex items-center space-x-1 ${
                            watchlist.includes(ipo.id)
                              ? "bg-amber-500/15 border-amber-500/30 text-amber-500 hover:bg-amber-500/25"
                              : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
                          }`}
                          title={watchlist.includes(ipo.id) ? "Remove from Risk Watchlist" : "Add to Risk Watchlist"}
                        >
                          <Star className={`h-3 w-3 ${watchlist.includes(ipo.id) ? "fill-amber-500 text-amber-500" : ""}`} />
                          <span>{watchlist.includes(ipo.id) ? "Watched" : "Watch"}</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompare(ipo.id);
                        }}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all duration-200 cursor-pointer flex items-center space-x-1 ${
                          compareIds.includes(ipo.id)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        }`}
                      >
                        {compareIds.includes(ipo.id) ? (
                          <>
                            <Check className="h-3 w-3" />
                            <span>Comparing</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3 animate-pulse" />
                            <span>Compare</span>
                          </>
                        )}
                      </button>

                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        ipo.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-500" :
                        ipo.status === "UPCOMING" ? "bg-blue-500/10 text-blue-500" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {ipo.status}
                      </span>
                      {ipo.recommendation && (
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          ipo.recommendation === "APPLY" ? "bg-violet-500/10 text-violet-500" : "bg-amber-500/10 text-amber-500"
                        }`}>
                          AI Recommendation: {ipo.recommendation}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick details strip */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-5 pt-4 border-t border-border">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">Price Band</span>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{ipo.priceBand}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">Issue Size</span>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{ipo.issueSize}</p>
                    </div>
                    {/* Removed Grey Market Premium block */}
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">Overall Subscription</span>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {ipo.status === "UPCOMING" && !ipo.subscriptionOverall ? "Not Open Yet" : `${ipo.subscriptionOverall ?? 0}x`}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">Open Date</span>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{ipo.openDate || "TBA"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">Close Date</span>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{ipo.closeDate || "TBA"}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
                </>
              )}
            </div>

        {/* Detailed Sheet (Right-side 1 col) */}
        <div className="xl:col-span-1 border border-border rounded-2xl bg-card overflow-hidden shadow-sm sticky top-24">
          {selectedIpo ? (
            <div>
              {/* IPO Header Details */}
              <div className="p-5 border-b border-border bg-gradient-to-r from-primary/5 via-violet-500/5 to-transparent">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{selectedIpo.name}</h3>
                    <span className="text-xs font-mono font-medium text-muted-foreground">{selectedIpo.symbol} • {selectedIpo.registrar}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    selectedIpo.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                  }`}>
                    {selectedIpo.status}
                  </span>
                </div>

                {/* Sub Tab headers */}
                <div className="flex space-x-1 mt-4 p-1 bg-muted/40 rounded-lg text-xs overflow-x-auto">
                  <button
                    onClick={() => setActiveDetailsTab("overview")}
                    className={`flex-1 px-2.5 py-1.5 rounded-md font-medium transition-all shrink-0 ${
                      activeDetailsTab === "overview" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveDetailsTab("financials")}
                    className={`flex-1 px-2.5 py-1.5 rounded-md font-medium transition-all shrink-0 ${
                      activeDetailsTab === "financials" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    Financials
                  </button>
                  <button
                    onClick={() => {
                      setActiveDetailsTab("ai-analysis");
                      if (!aiAnalysisResult) runAiAnalysis(selectedIpo.id);
                    }}
                    className={`flex-1 px-2.5 py-1.5 rounded-md font-medium transition-all shrink-0 flex items-center justify-center space-x-1 ${
                      activeDetailsTab === "ai-analysis" ? "bg-background text-primary shadow-sm font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>AI Analysis</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveDetailsTab("rhp");
                      if (!rhpResult) runRhpSummary(selectedIpo.id);
                    }}
                    className={`flex-1 px-2.5 py-1.5 rounded-md font-medium transition-all shrink-0 flex items-center justify-center space-x-1 ${
                      activeDetailsTab === "rhp" ? "bg-background text-primary shadow-sm font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    <FileText className="h-3 w-3" />
                    <span>RHP</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveDetailsTab("predict");
                      if (!predictResult) runListingPredictor(selectedIpo.id);
                    }}
                    className={`flex-1 px-2.5 py-1.5 rounded-md font-medium transition-all shrink-0 flex items-center justify-center space-x-1 ${
                      activeDetailsTab === "predict" ? "bg-background text-primary shadow-sm font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    <Target className="h-3 w-3" />
                    <span>Predict</span>
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <div className="p-5 max-h-[500px] overflow-y-auto space-y-4">
                
                {/* 1. Overview Tab */}
                {activeDetailsTab === "overview" && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/30 border border-border rounded-xl">
                        <span className="text-muted-foreground">Price Band</span>
                        <p className="text-sm font-bold mt-0.5">{selectedIpo.priceBand}</p>
                      </div>
                      <div className="p-3 bg-muted/30 border border-border rounded-xl">
                        <span className="text-muted-foreground">Lot Size</span>
                        <p className="text-sm font-bold mt-0.5">{selectedIpo.lotSize} Shares</p>
                      </div>
                      <div className="p-3 bg-muted/30 border border-border rounded-xl">
                        <span className="text-muted-foreground">Open Date</span>
                        <p className="text-sm font-semibold mt-0.5">{selectedIpo.openDate}</p>
                      </div>
                      <div className="p-3 bg-muted/30 border border-border rounded-xl">
                        <span className="text-muted-foreground">Close Date</span>
                        <p className="text-sm font-semibold mt-0.5">{selectedIpo.closeDate}</p>
                      </div>
                    </div>

                    <div className="border border-border p-3.5 rounded-xl bg-card">
                      <span className="text-muted-foreground uppercase font-mono font-bold tracking-wider">Promoter Holdings</span>
                      <div className="flex justify-between mt-2 pt-1">
                        <div>
                          <p className="text-muted-foreground">Pre-Issue</p>
                          <p className="text-sm font-bold text-foreground">{selectedIpo.promoterHoldingBefore}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground">Post-Issue</p>
                          <p className="text-sm font-bold text-foreground">{selectedIpo.promoterHoldingAfter}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-foreground">Lead Managers</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedIpo.leadManagers.map((m, idx) => (
                          <span key={idx} className="bg-muted px-2 py-1 rounded text-[10px] text-muted-foreground">{m}</span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-foreground">Competitors</h4>
                      <p className="text-muted-foreground mt-0.5">{selectedIpo.competitors.join(", ")}</p>
                    </div>

                    {selectedIpo.status === "ACTIVE" && (
                      <button
                        onClick={() => setShowApplyModal(true)}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 mt-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Track Application & Allotment</span>
                      </button>
                    )}
                  </div>
                )}

                {/* 2. Financials Tab */}
                {activeDetailsTab === "financials" && (
                  <div className="space-y-4 text-xs">
                    <h4 className="font-bold text-foreground text-sm">Key Balance Sheet Metrics (₹ in Cr)</h4>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="py-2">Year</th>
                          <th className="py-2">Revenue</th>
                          <th className="py-2">PAT (Profit)</th>
                          <th className="py-2">Debt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedIpo.financials.map((fin, idx) => (
                          <tr key={idx} className="border-b border-border text-foreground hover:bg-muted/10">
                            <td className="py-2 font-mono font-bold">{fin.year}</td>
                            <td className="py-2">₹{fin.revenue} Cr</td>
                            <td className={`py-2 ${fin.profit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                              ₹{fin.profit} Cr
                            </td>
                            <td className="py-2">₹{fin.debt} Cr</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="border border-border p-3.5 rounded-xl bg-muted/20">
                      <h4 className="font-bold mb-1">Peer Comparison Outlook</h4>
                      <p className="text-muted-foreground">
                        Financial metrics show strong organic expansion CAGR. Net Profit Margin trends demonstrate structural operational leverage, while keeping the gearing (Debt-to-Equity) ratios low.
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. AI Deep Analysis Tab (Interactive Gemini call) */}
                {activeDetailsTab === "ai-analysis" && (
                  <div className="space-y-4 text-xs">
                    {loadingAi ? (
                      <div className="py-12 flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <span className="text-xs text-muted-foreground mt-2 font-mono">Running LLM Quantitative Analysis...</span>
                      </div>
                    ) : aiAnalysisResult ? (
                      <div className="space-y-4">
                        {/* Score Indicator */}
                        <div className="flex items-center justify-between p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                          <div>
                            <span className="text-muted-foreground">IPOSense AI Score</span>
                            <h4 className="text-xl font-bold text-primary">{aiAnalysisResult.aiScore}/100</h4>
                          </div>
                          <div className="text-right">
                            <span className="text-muted-foreground">Confidence</span>
                            <p className="font-semibold text-foreground">{aiAnalysisResult.confidencePercent}%</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-foreground">AI Rating Verdict</h4>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold mt-1 text-[10px] ${
                            aiAnalysisResult.recommendation === "APPLY" ? "bg-emerald-500/10 text-emerald-500" :
                            aiAnalysisResult.recommendation === "AVOID" ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
                          }`}>
                            {aiAnalysisResult.recommendation}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-foreground">Risk Level</h4>
                          <span className="font-bold font-mono text-amber-500">{aiAnalysisResult.riskMeter} Risk</span>
                        </div>

                        <div>
                          <h4 className="font-bold text-foreground">AI Reasoning Summary</h4>
                          <p className="text-muted-foreground mt-1 leading-relaxed border-l-2 border-primary/20 pl-2">
                            {aiAnalysisResult.reasoningSummary}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">Key Merits</h4>
                          <ul className="space-y-1">
                            {aiAnalysisResult.detailedPros.map((pro: string, idx: number) => (
                              <li key={idx} className="text-muted-foreground flex items-start space-x-1">
                                <span className="text-emerald-500 mt-0.5">✓</span>
                                <span>{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">Identified Flags</h4>
                          <ul className="space-y-1">
                            {aiAnalysisResult.detailedCons.map((con: string, idx: number) => (
                              <li key={idx} className="text-muted-foreground flex items-start space-x-1">
                                <span className="text-rose-500 mt-0.5">⚠</span>
                                <span>{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => runAiAnalysis(selectedIpo.id)}
                        className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold flex items-center justify-center space-x-1.5"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Run Full AI Valuation</span>
                      </button>
                    )}
                  </div>
                )}

                {/* 4. RHP 5-Minute summary Tab (Gemini) */}
                {activeDetailsTab === "rhp" && (
                  <div className="space-y-4 text-xs">
                    {loadingRhp ? (
                      <div className="py-12 flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <span className="text-xs text-muted-foreground mt-2 font-mono">Parsing Red Herring Prospectus...</span>
                      </div>
                    ) : rhpResult ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-muted/20 rounded-xl border border-border">
                          <h4 className="font-bold flex items-center text-primary">
                            <BookOpen className="h-4 w-4 mr-1" />
                            Executive RHP Digest
                          </h4>
                          <p className="text-muted-foreground mt-1.5 leading-relaxed">{rhpResult.summary}</p>
                        </div>

                        <div>
                          <h4 className="font-bold text-foreground">Business Model Overview</h4>
                          <p className="text-muted-foreground mt-1">{rhpResult.businessModel}</p>
                        </div>

                        <div>
                          <h4 className="font-bold text-foreground">Use of Proceeds</h4>
                          <p className="text-muted-foreground mt-1">{rhpResult.useOfProceeds}</p>
                        </div>

                        <div>
                          <h4 className="font-bold text-foreground">Competitive peer valuation</h4>
                          <p className="text-muted-foreground mt-1">{rhpResult.peerComparison}</p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => runRhpSummary(selectedIpo.id)}
                        className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold flex items-center justify-center space-x-1.5"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Summarize Prospectus (RHP)</span>
                      </button>
                    )}
                  </div>
                )}

                {/* 5. Predict Targets Tab */}
                {activeDetailsTab === "predict" && (
                  <div className="space-y-4 text-xs">
                    {loadingPredict ? (
                      <div className="py-12 flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <span className="text-xs text-muted-foreground mt-2 font-mono">Estimating listing & market target prices...</span>
                      </div>
                    ) : predictResult ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex justify-between items-center">
                          <div>
                            <span className="text-muted-foreground">Estimated Listing Price</span>
                            <h4 className="text-lg font-bold text-emerald-500 mt-0.5">₹{predictResult.predictedListingPrice}</h4>
                          </div>
                          <span className="bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full text-[10px]">
                            +{predictResult.listingGainsPercent}% Expected
                          </span>
                        </div>

                        {/* Price Target Roadmaps */}
                        <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/10">
                          <h4 className="font-bold text-foreground">AI Target Trajectory Roadmap</h4>
                          <div className="grid grid-cols-3 gap-2 pt-1">
                            <div className="p-2.5 bg-card border border-border rounded-lg text-center">
                              <span className="text-muted-foreground font-mono">1 Day</span>
                              <p className="text-sm font-bold text-foreground mt-0.5">₹{predictResult.target1Day}</p>
                            </div>
                            <div className="p-2.5 bg-card border border-border rounded-lg text-center">
                              <span className="text-muted-foreground font-mono">1 Week</span>
                              <p className="text-sm font-bold text-foreground mt-0.5">₹{predictResult.target1Week}</p>
                            </div>
                            <div className="p-2.5 bg-card border border-border rounded-lg text-center">
                              <span className="text-muted-foreground font-mono">1 Month</span>
                              <p className="text-sm font-bold text-foreground mt-0.5">₹{predictResult.target1Month}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-bold text-foreground flex items-center">
                            <TrendingUp className="h-4 w-4 mr-1 text-emerald-500" />
                            Bull Case Catalyst
                          </h4>
                          <p className="text-muted-foreground">{predictResult.bullCase}</p>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-bold text-foreground flex items-center">
                            <ShieldAlert className="h-4 w-4 mr-1 text-rose-500" />
                            Bear Case Support
                          </h4>
                          <p className="text-muted-foreground">{predictResult.bearCase}</p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => runListingPredictor(selectedIpo.id)}
                        className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold flex items-center justify-center space-x-1.5"
                      >
                        <Target className="h-4 w-4" />
                        <span>Predict Listing Price</span>
                      </button>
                    )}
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <Compass className="h-10 w-10 mx-auto mb-3 text-muted-foreground animate-bounce" />
              <h4 className="font-bold">No IPO Selected</h4>
              <p className="text-xs mt-1">Select an IPO from the listings on the left to review analytics, financials, and run AI deep valuation assessments.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Comparison Tray */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-primary/30 px-6 py-4 rounded-2xl shadow-xl z-40 flex items-center justify-between gap-6 animate-fadeIn max-w-lg w-full">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 text-primary h-8 w-8 rounded-lg flex items-center justify-center font-bold font-mono text-sm">
              {compareIds.length}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Selected for comparison</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Compare and contrast AI scores, financials & Grey Market premiums.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setCompareIds([])}
              className="px-3 py-1.5 rounded-xl text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={() => setActiveSubView("comparison")}
              className="bg-primary text-primary-foreground font-bold px-4 py-1.5 rounded-xl text-[11px] hover:bg-primary/90 transition-all flex items-center space-x-1 shadow-md shadow-primary/10 cursor-pointer"
            >
              <span>Compare Now</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </>
  )}

  {activeSubView === "comparison" && (
    <div className="space-y-6 animate-fadeIn">
      {/* Quick Add/Remove selector bar */}
      <div className="p-5 bg-card border border-border rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center">
              <Scale className="h-5 w-5 text-primary mr-2" />
              Select IPOs to Compare ({compareIds.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Toggle IPOs below to dynamically rebuild the side-by-side comparison matrix.</p>
          </div>
          {compareIds.length > 0 && (
            <button
              onClick={() => setCompareIds([])}
              className="text-xs font-semibold text-rose-500 hover:underline font-mono cursor-pointer"
            >
              Clear Selection
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          {sourceIpos.map(ipo => {
            const isSelected = compareIds.includes(ipo.id);
            return (
              <button
                key={ipo.id}
                onClick={() => toggleCompare(ipo.id)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer flex items-center space-x-1.5 ${
                  isSelected
                    ? "bg-primary/10 border-primary text-primary shadow-sm"
                    : "bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <span className="font-mono">{ipo.symbol}</span>
                {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              </button>
            );
          })}
        </div>
      </div>

      {ipos.filter(ipo => compareIds.includes(ipo.id)).length < 2 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-dashed border-border max-w-xl mx-auto flex flex-col items-center justify-center space-y-4 my-6">
          <div className="bg-primary/5 p-4 rounded-full border border-primary/15 text-primary">
            <Scale className="h-8 w-8 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Add IPOs for Benchmarking</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Please select at least 2 IPOs to generate the side-by-side intelligence matrix. You can use the quick-selection toggles above.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setCompareIds(ipos.slice(0, 2).map(i => i.id))}
              className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
            >
              Quick Match (First 2)
            </button>
            <button
              onClick={() => setActiveSubView("directory")}
              className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl text-xs hover:bg-primary/90 transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-primary/10"
            >
              <span>Browse Directory</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Side-by-Side Comparison Table */
        <div className="overflow-x-auto border border-border rounded-2xl bg-card shadow-sm scrollbar-thin">
          <div className="min-w-[800px] divide-y divide-border">
            {/* Header Row (Names & Tickers) */}
            <div className="grid grid-cols-12 bg-muted/30 p-5 items-center">
              <div className="col-span-3">
                <span className="text-xs uppercase tracking-wider font-mono font-bold text-muted-foreground">Comparison Parameter</span>
              </div>
              <div className="col-span-9 grid gap-4" style={{ gridTemplateColumns: `repeat(${compareIds.length}, minmax(0, 1fr))` }}>
                {ipos.filter(ipo => compareIds.includes(ipo.id)).map((ipo) => (
                  <div key={ipo.id} className="px-4 text-center relative group">
                    <button
                      onClick={() => toggleCompare(ipo.id)}
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Remove from comparison"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs font-mono mx-auto mb-2">
                      {ipo.symbol.slice(0, 2)}
                    </div>
                    <h4 className="text-sm font-bold text-foreground line-clamp-1">{ipo.name}</h4>
                    <span className="text-[10px] font-mono font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded mt-1 inline-block">{ipo.symbol}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* row: Status */}
            <div className="grid grid-cols-12 p-5 items-center">
              <div className="col-span-3">
                <span className="text-xs font-bold text-foreground">Filing Status</span>
              </div>
              <div className="col-span-9 grid gap-4" style={{ gridTemplateColumns: `repeat(${compareIds.length}, minmax(0, 1fr))` }}>
                {ipos.filter(ipo => compareIds.includes(ipo.id)).map((ipo) => (
                  <div key={ipo.id} className="px-4 text-center">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      ipo.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-500" :
                      ipo.status === "UPCOMING" ? "bg-blue-500/10 text-blue-500" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {ipo.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION: AI INTELLIGENCE & EVALUATION */}
            <div className="grid grid-cols-12 bg-primary/5 p-4 items-center font-mono font-bold text-primary text-xs tracking-wider uppercase">
              <div className="col-span-12 flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                <span>AI Evaluation & Recommendation</span>
              </div>
            </div>

            {/* row: AI Score */}
            <div className="grid grid-cols-12 p-5 items-center">
              <div className="col-span-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">AI Score</span>
                  <span className="text-[10px] text-muted-foreground">Overall system rating</span>
                </div>
              </div>
              <div className="col-span-9 grid gap-4" style={{ gridTemplateColumns: `repeat(${compareIds.length}, minmax(0, 1fr))` }}>
                {ipos.filter(ipo => compareIds.includes(ipo.id)).map((ipo) => (
                  <div key={ipo.id} className="px-4 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-violet-500/10 border border-violet-500/20 rounded-2xl">
                      <span className="text-lg font-black text-primary font-mono">{ipo.aiScore}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">/100</span>
                    </div>
                    <div className="w-20 mx-auto mt-2 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${ipo.aiScore}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* row: AI Recommendation */}
            <div className="grid grid-cols-12 p-5 items-center">
              <div className="col-span-3">
                <span className="text-xs font-bold text-foreground">AI Recommendation</span>
              </div>
              <div className="col-span-9 grid gap-4" style={{ gridTemplateColumns: `repeat(${compareIds.length}, minmax(0, 1fr))` }}>
                {ipos.filter(ipo => compareIds.includes(ipo.id)).map((ipo) => (
                  <div key={ipo.id} className="px-4 text-center">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      ipo.recommendation === "APPLY" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                      ipo.recommendation === "AVOID" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                      "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    }`}>
                      {ipo.recommendation}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* row: Confidence Score */}
            <div className="grid grid-cols-12 p-5 items-center">
              <div className="col-span-3">
                <span className="text-xs font-bold text-foreground">AI Confidence Level</span>
              </div>
              <div className="col-span-9 grid gap-4" style={{ gridTemplateColumns: `repeat(${compareIds.length}, minmax(0, 1fr))` }}>
                {ipos.filter(ipo => compareIds.includes(ipo.id)).map((ipo) => (
                  <div key={ipo.id} className="px-4 text-center">
                    <span className="font-mono text-xs font-bold text-foreground">{ipo.aiConfidence}%</span>
                    <div className="w-16 mx-auto mt-1.5 bg-muted rounded-full h-1 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${ipo.aiConfidence}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* row: Risk Meter */}
            <div className="grid grid-cols-12 p-5 items-center">
              <div className="col-span-3">
                <span className="text-xs font-bold text-foreground">Risk Score</span>
              </div>
              <div className="col-span-9 grid gap-4" style={{ gridTemplateColumns: `repeat(${compareIds.length}, minmax(0, 1fr))` }}>
                {ipos.filter(ipo => compareIds.includes(ipo.id)).map((ipo) => (
                  <div key={ipo.id} className="px-4 text-center font-mono text-xs font-bold">
                    <span className={ipo.riskScore > 65 ? "text-rose-500" : ipo.riskScore > 40 ? "text-amber-500" : "text-emerald-500"}>
                      {ipo.riskScore}/100
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION: FINANCIALS METRICS */}
            <div className="grid grid-cols-12 bg-violet-500/5 p-4 items-center font-mono font-bold text-violet-500 text-xs tracking-wider uppercase">
              <div className="col-span-12 flex items-center">
                <Briefcase className="h-4 w-4 mr-2" />
                <span>Financial Metrics & Capital Structure</span>
              </div>
            </div>

            {/* row: Price Band */}
            <div className="grid grid-cols-12 p-5 items-center">
              <div className="col-span-3">
                <span className="text-xs font-bold text-foreground">Price Band</span>
              </div>
              <div className="col-span-9 grid gap-4" style={{ gridTemplateColumns: `repeat(${compareIds.length}, minmax(0, 1fr))` }}>
                {ipos.filter(ipo => compareIds.includes(ipo.id)).map((ipo) => (
                  <div key={ipo.id} className="px-4 text-center text-xs font-semibold text-foreground">
                    {ipo.priceBand}
                  </div>
                ))}
              </div>
            </div>

            {/* row: Issue Size */}
            <div className="grid grid-cols-12 p-5 items-center">
              <div className="col-span-3">
                <span className="text-xs font-bold text-foreground">Issue Size</span>
              </div>
              <div className="col-span-9 grid gap-4" style={{ gridTemplateColumns: `repeat(${compareIds.length}, minmax(0, 1fr))` }}>
                {ipos.filter(ipo => compareIds.includes(ipo.id)).map((ipo) => (
                  <div key={ipo.id} className="px-4 text-center text-xs font-bold text-foreground font-mono">
                    {ipo.issueSize}
                  </div>
                ))}
              </div>
            </div>

            {/* row: Lot Size & Min Bid */}
            <div className="grid grid-cols-12 p-5 items-center">
              <div className="col-span-3">
                <span className="text-xs font-bold text-foreground">Minimum Lot Bid</span>
              </div>
              <div className="col-span-9 grid gap-4" style={{ gridTemplateColumns: `repeat(${compareIds.length}, minmax(0, 1fr))` }}>
                {ipos.filter(ipo => compareIds.includes(ipo.id)).map((ipo) => (
                  <div key={ipo.id} className="px-4 text-center text-xs text-foreground">
                    <span className="font-bold">{ipo.lotSize} Shares</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Min ₹{(ipo.maxPrice * ipo.lotSize).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* row: Promoter Holding Before/After */}
            <div className="grid grid-cols-12 p-5 items-center">
              <div className="col-span-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">Promoter Holding</span>
                  <span className="text-[10px] text-muted-foreground">Pre-Issue → Post-Issue</span>
                </div>
              </div>
              <div className="col-span-9 grid gap-4" style={{ gridTemplateColumns: `repeat(${compareIds.length}, minmax(0, 1fr))` }}>
                {ipos.filter(ipo => compareIds.includes(ipo.id)).map((ipo) => (
                  <div key={ipo.id} className="px-4 text-center text-xs text-foreground">
                    <span className="font-bold">{ipo.promoterHoldingBefore}%</span>
                    <span className="mx-1 text-muted-foreground">→</span>
                    <span className="font-bold text-violet-500">{ipo.promoterHoldingAfter}%</span>
                    <p className="text-[10px] text-rose-500 mt-0.5">
                      ({(ipo.promoterHoldingBefore - ipo.promoterHoldingAfter).toFixed(1)}% Dilution)
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* row: Revenue / PAT Latest */}
            <div className="grid grid-cols-12 p-5 items-center">
              <div className="col-span-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">Latest Annual Profits (PAT)</span>
                  <span className="text-[10px] text-muted-foreground">Latest fiscal year profit</span>
                </div>
              </div>
              <div className="col-span-9 grid gap-4" style={{ gridTemplateColumns: `repeat(${compareIds.length}, minmax(0, 1fr))` }}>
                {ipos.filter(ipo => compareIds.includes(ipo.id)).map((ipo) => {
                  const latestFin = ipo.financials[ipo.financials.length - 1];
                  return (
                    <div key={ipo.id} className="px-4 text-center text-xs">
                      <span className={`font-mono font-bold ${latestFin && latestFin.profit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {latestFin ? `₹${latestFin.profit} Cr` : "N/A"}
                      </span>
                      {latestFin && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">on Revenue of ₹{latestFin.revenue} Cr</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION: GREY MARKET PREMIUMS */}
            <div className="grid grid-cols-12 bg-emerald-500/5 p-4 items-center font-mono font-bold text-emerald-500 text-xs tracking-wider uppercase">
              <div className="col-span-12 flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                <span>Grey Market Premium & Subscription Trends</span>
              </div>
            </div>

            {/* row: GMP Value */}
            <div className="grid grid-cols-12 p-5 items-center">
              <div className="col-span-3">
                <span className="text-xs font-bold text-foreground">Current GMP</span>
              </div>
              <div className="col-span-9 grid gap-4" style={{ gridTemplateColumns: `repeat(${compareIds.length}, minmax(0, 1fr))` }}>
                {ipos.filter(ipo => compareIds.includes(ipo.id)).map((ipo) => {
                  const isGmpPositive = ipo.gmp >= 0;
                  return (
                    <div key={ipo.id} className="px-4 text-center">
                      <span className={`text-sm font-black font-mono ${isGmpPositive ? "text-emerald-500" : "text-rose-500"}`}>
                        ₹{ipo.gmp}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">({ipo.gmpPercent > 0 ? "+" : ""}{ipo.gmpPercent}% listing gain)</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* row: Subscription */}
            <div className="grid grid-cols-12 p-5 items-center">
              <div className="col-span-3">
                <span className="text-xs font-bold text-foreground">Overall Subscription</span>
              </div>
              <div className="col-span-9 grid gap-4" style={{ gridTemplateColumns: `repeat(${compareIds.length}, minmax(0, 1fr))` }}>
                {ipos.filter(ipo => compareIds.includes(ipo.id)).map((ipo) => (
                  <div key={ipo.id} className="px-4 text-center font-mono text-xs text-foreground">
                    {ipo.status === "UPCOMING" ? (
                      <span className="text-muted-foreground text-[11px] font-sans">Upcoming</span>
                    ) : (
                      <>
                        <span className="font-bold text-foreground">{ipo.subscriptionOverall}x</span>
                        <div className="text-[9px] text-muted-foreground mt-1 space-y-0.5">
                          <div>Retail: {ipo.subscriptionRetail}x</div>
                          <div>HNI: {ipo.subscriptionHni}x</div>
                          <div>QIB: {ipo.subscriptionQib}x</div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* row: Strengths & Risks bullet comparison */}
            <div className="grid grid-cols-12 bg-muted/20 p-4 items-center font-mono font-bold text-muted-foreground text-xs tracking-wider uppercase">
              <div className="col-span-12 flex items-center">
                <ShieldAlert className="h-4 w-4 mr-2" />
                <span>Core Strengths vs Identified Risks</span>
              </div>
            </div>

            <div className="grid grid-cols-12 p-5 items-stretch">
              <div className="col-span-3">
                <span className="text-xs font-bold text-foreground">Key Drivers</span>
              </div>
              <div className="col-span-9 grid gap-4" style={{ gridTemplateColumns: `repeat(${compareIds.length}, minmax(0, 1fr))` }}>
                {ipos.filter(ipo => compareIds.includes(ipo.id)).map((ipo) => (
                  <div key={ipo.id} className="px-4 border-r border-border last:border-0 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold text-emerald-500">Strengths:</span>
                      <ul className="list-disc pl-4 text-[10px] text-muted-foreground space-y-1 mt-1.5">
                        {ipo.strengths.slice(0, 3).map((s, idx) => (
                          <li key={idx} className="leading-relaxed">{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold text-rose-500">Risks:</span>
                      <ul className="list-disc pl-4 text-[10px] text-muted-foreground space-y-1 mt-1.5">
                        {ipo.risks.slice(0, 3).map((r, idx) => (
                          <li key={idx} className="leading-relaxed">{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )}

  {activeSubView === "rapid-feeds" && (
    <div className="space-y-6 animate-fadeIn animate-duration-300">
      {/* RapidAPI Integration Header Status */}
      <div className="p-5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute right-6 top-6 opacity-10 pointer-events-none">
          <Compass className="h-28 w-28 text-primary animate-pulse" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="text-[10px] uppercase font-mono font-bold text-emerald-500 tracking-wider">Secure RapidAPI Live Gateway Connected</span>
            </div>
            <h3 className="text-lg font-extrabold text-foreground flex items-center gap-1.5">
              <span>Upcoming IPOs & Global Calendar Feeds</span>
            </h3>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Retrieving live feeds powered by the secure token <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-[10px]">e769...86aa</code>. Tracks global listings, pricing sheets, and subscription indicators.
            </p>
          </div>
          <button
            onClick={() => {
              fetchRapidUpcoming();
              fetchRapidCalendar();
              fetchRapidNews();
            }}
            className="flex items-center space-x-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-primary/10 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${(loadingRapidUpcoming || loadingRapidCalendar || loadingRapidNews) ? "animate-spin" : ""}`} />
            <span>Force Feed Refresh</span>
          </button>
        </div>
      </div>

      {/* Internal Navigation Tabs for RapidAPI */}
      <div className="flex border-b border-border space-x-6 text-sm">
        <button
          onClick={() => setRapidSubTab("upcoming")}
          className={`pb-3 font-semibold transition-all relative cursor-pointer flex items-center space-x-2 ${
            rapidSubTab === "upcoming" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Upcoming IPOs Feed</span>
          <span className="bg-primary/15 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
            {rapidUpcoming.length}
          </span>
          {rapidSubTab === "upcoming" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full animate-fadeIn" />
          )}
        </button>
        <button
          onClick={() => setRapidSubTab("calendar")}
          className={`pb-3 font-semibold transition-all relative cursor-pointer flex items-center space-x-2 ${
            rapidSubTab === "calendar" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>IPO Calendar Timeline</span>
          <span className="bg-muted-foreground/15 text-muted-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
            {rapidCalendar.length}
          </span>
          {rapidSubTab === "calendar" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full animate-fadeIn" />
          )}
        </button>
        <button
          onClick={() => setRapidSubTab("market-news")}
          className={`pb-3 font-semibold transition-all relative cursor-pointer flex items-center space-x-2 ${
            rapidSubTab === "market-news" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Market News & NLP Sentiment</span>
          <span className="bg-violet-500/15 text-violet-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
            Live
          </span>
          {rapidSubTab === "market-news" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full animate-fadeIn" />
          )}
        </button>
      </div>

      {/* Sub Tab View: Upcoming IPOs */}
      {rapidSubTab === "upcoming" && (
        <div className="space-y-4">
          {loadingRapidUpcoming ? (
            <div className="p-16 text-center bg-card border border-border rounded-2xl flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground mt-3 font-mono">Querying upcoming-ipo-calendar.p.rapidapi.com gateway...</p>
            </div>
          ) : rapidUpcoming.length === 0 ? (
            <div className="p-12 text-center bg-card border border-dashed border-border rounded-2xl">
              <ShieldAlert className="h-8 w-8 text-rose-500 mx-auto" />
              <h4 className="font-bold text-foreground mt-3">RapidAPI Feed Empty</h4>
              <p className="text-xs text-muted-foreground mt-1">Unable to load the feed. Verify API subscription limits or retry.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rapidUpcoming.map((ipo, idx) => (
                <div key={ipo.id || idx} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs font-mono">
                        {ipo.symbol ? ipo.symbol.slice(0, 3) : "IPO"}
                      </div>
                      <span className="bg-primary/10 text-primary text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full">
                        {ipo.exchange || "GLOBAL"}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-foreground text-sm truncate">{ipo.name}</h4>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">{ipo.symbol}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Price Band</span>
                        <span className="font-bold text-foreground">{ipo.priceBand || "TBA"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Issue Size</span>
                        <span className="font-bold text-foreground">{ipo.issueSize || "TBA"}</span>
                      </div>
                    </div>

                    <div className="pt-2 text-xs font-mono grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Opens On</span>
                        <span className="font-semibold text-foreground">{ipo.openDate || "TBA"}</span>
                      </div>
                      {ipo.closeDate && ipo.closeDate !== "TBA" && (
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Closes On</span>
                          <span className="font-semibold text-foreground">{ipo.closeDate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground italic truncate">Source: {ipo.source || "RapidAPI Feed"}</span>
                    <span className="h-1.5 w-1.5 bg-primary rounded-full"></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub Tab View: IPO Calendar Timeline */}
      {rapidSubTab === "calendar" && (
        <div className="space-y-6">
          {loadingRapidCalendar ? (
            <div className="p-16 text-center bg-card border border-border rounded-2xl flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground mt-3 font-mono">Querying Finnhub IPO calendar timeline...</p>
            </div>
          ) : rapidCalendar.length === 0 ? (
            <div className="p-12 text-center bg-card border border-dashed border-border rounded-2xl">
              <ShieldAlert className="h-8 w-8 text-rose-500 mx-auto" />
              <h4 className="font-bold text-foreground mt-3">Calendar Timeline Empty</h4>
              <p className="text-xs text-muted-foreground mt-1">No upcoming listing calendar events found.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="space-y-6 relative border-l-2 border-border/80 pl-6 ml-3">
                {rapidCalendar.map((item, idx) => {
                  const isActive = item.status === "ACTIVE" || item.status === "OPEN";
                  const isClosed = item.status === "CLOSED";
                  return (
                    <div key={item.id || idx} className="relative group">
                      {/* Timeline dot marker */}
                      <span className={`absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border bg-card flex items-center justify-center transition-all ${
                        isActive ? "border-emerald-500 ring-4 ring-emerald-500/15" :
                        isClosed ? "border-muted-foreground/60" : "border-primary"
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${
                          isActive ? "bg-emerald-500" :
                          isClosed ? "bg-muted-foreground/60" : "bg-primary"
                        }`} />
                      </span>

                      {/* Content Card */}
                      <div className="bg-muted/10 border border-border rounded-xl p-4 hover:bg-muted/20 transition-all duration-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-mono bg-muted border border-border px-2 py-0.5 rounded text-foreground">
                                {item.symbol}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {item.exchange || "Global Market"}
                              </span>
                            </div>
                            <h4 className="font-bold text-foreground text-sm">{item.name}</h4>
                          </div>

                          <div className="flex items-center space-x-3 text-xs font-mono self-stretch sm:self-auto justify-between border-t border-border/40 sm:border-t-0 pt-2 sm:pt-0">
                            <div className="text-right sm:mr-4">
                              <span className="text-[10px] text-muted-foreground block">IPO Date</span>
                              <span className="font-bold text-foreground">{item.openDate || "TBA"}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              isActive ? "bg-emerald-500/15 text-emerald-500" :
                              isClosed ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                            }`}>
                              {item.status || "UPCOMING"}
                            </span>
                          </div>
                        </div>

                        {item.price && (
                          <div className="mt-3 pt-2.5 border-t border-border/40 flex justify-between items-center text-xs font-mono">
                            <span className="text-muted-foreground">Price Bracket: <strong className="text-foreground">{item.price}</strong></span>
                            <span className="text-[10px] text-muted-foreground italic">Source: {item.source}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub Tab View: Market News & NLP Sentiment */}
      {rapidSubTab === "market-news" && (
        <div className="space-y-6">
          {loadingRapidNews ? (
            <div className="p-16 text-center bg-card border border-border rounded-2xl flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground mt-3 font-mono">Aggregating live news and running NLP sentiment classifier...</p>
            </div>
          ) : rapidNews.length === 0 ? (
            <div className="p-12 text-center bg-card border border-dashed border-border rounded-2xl">
              <ShieldAlert className="h-8 w-8 text-rose-500 mx-auto" />
              <h4 className="font-bold text-foreground mt-3">Sentiment Feed Empty</h4>
              <p className="text-xs text-muted-foreground mt-1">Unable to load the financial news feeds at this time. Verify subscription levels.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              {/* Left 2 columns: News List */}
              <div className="xl:col-span-2 space-y-4">
                {rapidNews.map((article) => {
                  const isPos = article.sentiment === "POSITIVE";
                  const isNeg = article.sentiment === "NEGATIVE";
                  return (
                    <div 
                      key={article.id} 
                      className={`bg-card border rounded-2xl p-5 hover:border-primary/40 hover:shadow-sm transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${
                        isPos ? "border-emerald-500/10" : isNeg ? "border-rose-500/10" : "border-border"
                      }`}
                    >
                      {/* Top ribbon sentiment indicators */}
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-mono bg-muted/60 px-2 py-0.5 rounded">
                            {article.source}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono ml-2">
                            {new Date(article.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono uppercase ${
                            isPos ? "bg-emerald-500/15 text-emerald-500" :
                            isNeg ? "bg-rose-500/15 text-rose-500" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isPos ? "bg-emerald-500" : isNeg ? "bg-rose-500" : "bg-muted-foreground"}`} />
                            <span>{article.sentiment} ({article.sentimentScore > 0 ? "+" : ""}{article.sentimentScore}%)</span>
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-bold text-foreground text-sm hover:text-primary transition-colors">
                          <a href={article.url} target="_blank" rel="noopener noreferrer referrerPolicy=no-referrer">{article.title}</a>
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {article.summary}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/40 flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                        <div className="flex space-x-3">
                          <span>Bullish triggers: <strong className="text-emerald-500">+{article.posKeywordsMatched}</strong></span>
                          <span>Bearish triggers: <strong className="text-rose-500">-{article.negKeywordsMatched}</strong></span>
                        </div>
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer referrerPolicy=no-referrer"
                          className="text-primary hover:underline font-bold"
                        >
                          Read full release &rarr;
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right column: Aggregated Market Mood Meter */}
              <div className="xl:col-span-1 space-y-6">
                <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                  <h4 className="text-sm font-bold flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Live Sentiment Summary</span>
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Our NLP Sentiment Engine scans real-time media feeds to extract investor behavior and market momentum triggers.
                  </p>

                  {/* Computed Aggregate Score */}
                  {(() => {
                    const posCount = rapidNews.filter(a => a.sentiment === "POSITIVE").length;
                    const negCount = rapidNews.filter(a => a.sentiment === "NEGATIVE").length;
                    const total = rapidNews.length;
                    const indexVal = total > 0 ? Math.round((posCount / total) * 100) : 50;

                    return (
                      <div className="space-y-4 pt-2">
                        <div className="p-4 rounded-xl bg-muted/30 text-center space-y-1 border border-border/60">
                          <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground font-mono block">Aggregate Mood Index</span>
                          <span className={`text-3xl font-black font-mono ${indexVal >= 60 ? "text-emerald-500" : indexVal <= 40 ? "text-rose-500" : "text-amber-500"}`}>
                            {indexVal}% Bullish
                          </span>
                          <span className="text-[10px] text-muted-foreground block font-mono">
                            Based on {total} live aggregated articles
                          </span>
                        </div>

                        {/* Visual bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono font-semibold">
                            <span className="text-rose-500">BEARISH</span>
                            <span className="text-muted-foreground">{indexVal}%</span>
                            <span className="text-emerald-500">BULLISH</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                            <div className="bg-rose-500" style={{ width: `${100 - indexVal}%` }} />
                            <div className="bg-emerald-500" style={{ width: `${indexVal}%` }} />
                          </div>
                        </div>

                        {/* Breakdown bullet lists */}
                        <div className="space-y-2 pt-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-border/40 font-mono">
                            <span className="text-muted-foreground">Positive Sentiment Offers:</span>
                            <span className="font-bold text-emerald-500">{posCount} articles</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-border/40 font-mono">
                            <span className="text-muted-foreground">Negative/Risk Warning Offers:</span>
                            <span className="font-bold text-rose-500">{negCount} articles</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-border/40 font-mono">
                            <span className="text-muted-foreground">Neutral/Static Articles:</span>
                            <span className="font-semibold text-muted-foreground">{total - posCount - negCount} articles</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Secure Configuration Preference Panel */}
                <NotificationPreferencesPanel />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )}

  {activeSubView === "historical_listings" && (
    <div className="space-y-6 animate-fadeIn animate-duration-300">
      {/* Postgres Database Status Header */}
      <div className="p-5 bg-gradient-to-r from-violet-500/10 via-primary/5 to-transparent border border-violet-500/20 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute right-6 top-6 opacity-10 pointer-events-none">
          <Calendar className="h-28 w-28 text-primary" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 bg-indigo-500 rounded-full animate-ping"></span>
              <span className="text-[10px] uppercase font-mono font-bold text-indigo-500 tracking-wider">Durable Cloud SQL PostgreSQL Active</span>
            </div>
            <h3 className="text-lg font-extrabold text-foreground flex items-center gap-1.5">
              <span>Historical IPO Allotment & Listing Record Database</span>
            </h3>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Query persistent records of past listings, original issue pricing, listing day openings, and current valuations fetched straight from your PostgreSQL database.
            </p>
          </div>
          <button
            onClick={fetchHistoricalIpos}
            disabled={loadingHistorical}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-card border border-border hover:bg-muted text-foreground rounded-lg transition-all font-semibold"
          >
            <RefreshCw className={`h-3 w-3 ${loadingHistorical ? "animate-spin" : ""}`} />
            <span>Reload Db</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left column: Historical Listing Table */}
        <div className="xl:col-span-2 space-y-4">
          <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
              <h4 className="text-xs font-extrabold uppercase font-mono tracking-wider text-foreground">
                Persistent Listing Catalog ({historicalIpos.length})
              </h4>
            </div>

            {loadingHistorical ? (
              <div className="p-12 text-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground mt-2 font-mono">Loading PostgreSQL registry...</p>
              </div>
            ) : historicalIpos.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground space-y-2">
                <p>No historical records exist in the database.</p>
                {(user?.role === "ADMINISTRATOR" || user?.role === "RESEARCH_ANALYST") && (
                  <p className="text-[10px]">Use the archive console on the right to append your first entry.</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 text-muted-foreground font-mono">
                      <th className="p-3">Asset</th>
                      <th className="p-3">Listing Date</th>
                      <th className="p-3 text-right">Issue Price</th>
                      <th className="p-3 text-right">List Price</th>
                      <th className="p-3 text-right">Current</th>
                      <th className="p-3 text-right">Listing Gain</th>
                      <th className="p-3">Sector</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalIpos.map((hipo) => {
                      const gain = Number(hipo.listingGainPercent || 0);
                      return (
                        <tr key={hipo.id} className="border-b border-border hover:bg-muted/10 transition-all">
                          <td className="p-3">
                            <div className="font-bold text-foreground">{hipo.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{hipo.symbol}</div>
                          </td>
                          <td className="p-3 text-muted-foreground font-mono">
                            {hipo.listingDate ? new Date(hipo.listingDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            }) : "-"}
                          </td>
                          <td className="p-3 text-right font-mono font-medium">₹{Number(hipo.issuePrice || 0).toLocaleString()}</td>
                          <td className="p-3 text-right font-mono font-medium text-foreground">₹{Number(hipo.listingPrice || 0).toLocaleString()}</td>
                          <td className="p-3 text-right font-mono font-medium text-foreground">₹{Number(hipo.currentPrice || hipo.listingPrice || 0).toLocaleString()}</td>
                          <td className={`p-3 text-right font-mono font-bold ${gain >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                            {gain >= 0 ? "+" : ""}{gain.toFixed(2)}%
                          </td>
                          <td className="p-3">
                            <span className="bg-muted px-2 py-0.5 rounded text-[10px] text-muted-foreground uppercase font-mono">
                              {hipo.sector || "General"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Form console for authorized users or informational banner */}
        <div className="xl:col-span-1 space-y-4">
          {user?.role === "ADMINISTRATOR" || user?.role === "RESEARCH_ANALYST" ? (
            <div className="p-5 border border-border rounded-2xl bg-card shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <Plus className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider font-mono text-foreground">
                  Archive Listing Console
                </h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                As an authorized <strong className="text-foreground">{user?.role === "ADMINISTRATOR" ? "Administrator" : "Research Analyst"}</strong>, you can persist new IPO events directly in the Cloud SQL catalog.
              </p>

              {histMsg && (
                <div className={`p-3 rounded-xl text-xs font-mono border ${
                  histMsg.type === "success" 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                    : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                }`}>
                  {histMsg.text}
                </div>
              )}

              <form onSubmit={handleCreateHistoricalIpo} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-muted-foreground font-mono font-bold uppercase mb-1">Company Symbol *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INFY"
                    value={newHistSymbol}
                    onChange={(e) => setNewHistSymbol(e.target.value.toUpperCase())}
                    className="w-full bg-muted/40 border border-border rounded-lg p-2 font-mono text-sm focus:outline-none focus:border-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-mono font-bold uppercase mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Infosys Limited"
                    value={newHistName}
                    onChange={(e) => setNewHistName(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-lg p-2 text-sm focus:outline-none focus:border-primary text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-foreground font-mono font-bold uppercase mb-1">Listing Date *</label>
                    <input
                      type="date"
                      required
                      value={newHistListingDate}
                      onChange={(e) => setNewHistListingDate(e.target.value)}
                      className="w-full bg-muted/40 border border-border rounded-lg p-2 text-sm focus:outline-none focus:border-primary text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-muted-foreground font-mono font-bold uppercase mb-1">Sector</label>
                    <input
                      type="text"
                      placeholder="e.g. Technology"
                      value={newHistSector}
                      onChange={(e) => setNewHistSector(e.target.value)}
                      className="w-full bg-muted/40 border border-border rounded-lg p-2 text-sm focus:outline-none focus:border-primary text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-foreground font-mono font-bold uppercase mb-1">Issue Price *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="e.g. 520"
                      value={newHistIssuePrice}
                      onChange={(e) => setNewHistIssuePrice(e.target.value)}
                      className="w-full bg-muted/40 border border-border rounded-lg p-2 font-mono text-sm focus:outline-none focus:border-primary text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-muted-foreground font-mono font-bold uppercase mb-1">Listing Price *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="e.g. 710"
                      value={newHistListingPrice}
                      onChange={(e) => setNewHistListingPrice(e.target.value)}
                      className="w-full bg-muted/40 border border-border rounded-lg p-2 font-mono text-sm focus:outline-none focus:border-primary text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-foreground font-mono font-bold uppercase mb-1">Current Price</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 1520"
                      value={newHistCurrentPrice}
                      onChange={(e) => setNewHistCurrentPrice(e.target.value)}
                      className="w-full bg-muted/40 border border-border rounded-lg p-2 font-mono text-sm focus:outline-none focus:border-primary text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-muted-foreground font-mono font-bold uppercase mb-1">Listing Gain (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 36.5"
                      value={newHistGainPercent}
                      onChange={(e) => setNewHistGainPercent(e.target.value)}
                      className="w-full bg-muted/40 border border-border rounded-lg p-2 font-mono text-sm focus:outline-none focus:border-primary text-foreground"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingHist}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1"
                >
                  {submittingHist ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      <span>Writing to Database...</span>
                    </>
                  ) : (
                    <span>Archive Entry to Postgres</span>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="p-5 border border-border rounded-2xl bg-card shadow-sm space-y-4">
              <h4 className="text-xs font-extrabold flex items-center gap-1.5 text-foreground uppercase tracking-wider font-mono">
                <Info className="h-4 w-4 text-primary" />
                <span>Analyst Access Profile</span>
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You are currently viewed under an <strong className="text-foreground">Investor</strong> role. Only <strong className="text-foreground">Research Analysts</strong> and <strong className="text-foreground">Administrators</strong> may add or edit persistent listing day histories.
              </p>
              <p className="text-[11px] text-muted-foreground bg-muted/40 p-3 rounded-xl leading-relaxed">
                Tip: You can easily elevate or switch your profile role instantly inside the <strong>Admin Center</strong> or by toggling your profile settings under Sign In options.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )}

      {/* TRACK APPLICATION MODAL */}
      {showApplyModal && selectedIpo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden text-foreground">
            <div className="p-5 border-b border-border flex justify-between items-center bg-gradient-to-r from-primary/5 to-transparent">
              <div>
                <h3 className="font-bold text-base">Track IPO Allotment</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedIpo.name}</p>
              </div>
              <button 
                onClick={() => setShowApplyModal(false)}
                className="p-1.5 hover:bg-muted rounded-lg transition-all text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submitApplicationTracker} className="p-5 space-y-4 text-xs">
              {appSavedSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                    <Check className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-sm">Application Added Successfully</h4>
                  <p className="text-muted-foreground">The background scheduler will now monitor allotment updates.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-muted-foreground mb-1">PAN CARD NUMBER</label>
                      <input
                        type="text"
                        placeholder="ABCDE1234F"
                        required
                        pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                        title="PAN must be in standard Indian Income Tax format: 5 letters, 4 numbers, and 1 letter (e.g. ABCDE1234F)"
                        value={pan}
                        onChange={(e) => setPan(e.target.value.toUpperCase())}
                        maxLength={10}
                        className="w-full bg-muted/40 border border-border rounded-lg p-2.5 font-mono text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-muted-foreground mb-1">APPLICATION NUMBER</label>
                      <input
                        type="text"
                        placeholder="78945123"
                        required
                        value={appNumber}
                        onChange={(e) => setAppNumber(e.target.value)}
                        className="w-full bg-muted/40 border border-border rounded-lg p-2.5 font-mono text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-muted-foreground mb-1">UPI ID</label>
                      <input
                        type="text"
                        placeholder="yourname@okaxis"
                        required
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full bg-muted/40 border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-muted-foreground mb-1">BROKER</label>
                      <select
                        value={broker}
                        onChange={(e) => setBroker(e.target.value)}
                        className="w-full bg-muted/40 border border-border rounded-lg p-2.5 text-sm focus:outline-none"
                      >
                        <option value="Zerodha">Zerodha Kite</option>
                        <option value="Groww">Groww</option>
                        <option value="AngelOne">AngelOne</option>
                        <option value="INDmoney">INDmoney</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-muted-foreground mb-1">CATEGORY</label>
                      <select
                        value={category}
                        onChange={(e: any) => setCategory(e.target.value)}
                        className="w-full bg-muted/40 border border-border rounded-lg p-2.5 text-sm focus:outline-none"
                      >
                        <option value="RETAIL">Retail Investor</option>
                        <option value="HNI">High Net-Worth (HNI)</option>
                        <option value="EMPLOYEE">Company Employee</option>
                        <option value="SHAREHOLDER">Existing Shareholder</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-muted-foreground mb-1">LOTS TO APPLY</label>
                      <input
                        type="number"
                        min={1}
                        max={15}
                        required
                        value={lots}
                        onChange={(e) => setLots(Number(e.target.value))}
                        className="w-full bg-muted/40 border border-border rounded-lg p-2.5 text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Summary of investments */}
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <div className="flex justify-between font-mono font-medium">
                      <span>Total Share Quantity:</span>
                      <span className="font-bold text-foreground">{lots * selectedIpo.lotSize} Shares</span>
                    </div>
                    <div className="flex justify-between font-mono font-medium mt-1">
                      <span>Total Amount Blocked:</span>
                      <span className="font-bold text-primary">₹{(lots * selectedIpo.maxPrice * selectedIpo.lotSize).toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingApp}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-xl flex items-center justify-center space-x-1"
                  >
                    {savingApp ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Securing credentials...</span>
                      </>
                    ) : (
                      <span>Submit Application to Allotment Tracker</span>
                    )}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
