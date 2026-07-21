import React, { useState } from "react";
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Sparkles, 
  HelpCircle,
  Clock,
  Award,
  Play,
  GripVertical,
  Sliders,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Layers,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Legend,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis
} from "recharts";
import { IPO } from "../types";

interface DashboardProps {
  ipos: IPO[];
  onNavigate: (tab: string) => void;
  applicationsCount: number;
  portfolioValue: number;
  notifications: any[];
  onClearNotifications: () => void;
}

export default function DashboardOverview({ 
  ipos, 
  onNavigate, 
  applicationsCount, 
  portfolioValue,
  notifications,
  onClearNotifications
}: DashboardProps) {
  // Heatmap State
  const [heatmapMetric, setHeatmapMetric] = useState<"subscription" | "gmp">("subscription");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  // Customization & Presets States
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [activePreset, setActivePreset] = useState<string>("balanced");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fallback sector data in case ipos are empty
  const FALLBACK_SECTORS = [
    { sector: "Enterprise AI & Tech", subscription: 38.5, gmp: 44.2, count: 4, topIpo: "Acme CloudTech AI", baseColor: "139, 92, 246" },
    { sector: "Clean Energy & Grid", subscription: 28.2, gmp: 31.8, count: 3, topIpo: "Solaris Renewable", baseColor: "16, 185, 129" },
    { sector: "Electric Mobility", subscription: 21.4, gmp: 19.5, count: 2, topIpo: "NovaCharge Mobility", baseColor: "59, 130, 246" },
    { sector: "Fintech & Payments", subscription: 14.8, gmp: 12.0, count: 3, topIpo: "ZetaPay Fintech", baseColor: "245, 158, 11" },
    { sector: "Logistics & Supply", subscription: 11.2, gmp: 8.5, count: 2, topIpo: "Apex LogiChain", baseColor: "236, 72, 153" },
    { sector: "Healthcare & Biotech", subscription: 9.6, gmp: 6.2, count: 2, topIpo: "BioPharma Lab", baseColor: "99, 102, 241" },
  ];

  // Dynamically compute sectors from IPOs
  const sectorData = React.useMemo(() => {
    if (!ipos || ipos.length === 0) return FALLBACK_SECTORS;
    
    const sectorsMap: Record<string, { subscription: number[], gmp: number[], ipos: IPO[] }> = {};
    ipos.forEach(ipo => {
      const sector = ipo.industry || "General Industry";
      if (!sectorsMap[sector]) {
        sectorsMap[sector] = { subscription: [], gmp: [], ipos: [] };
      }
      sectorsMap[sector].subscription.push(ipo.subscriptionOverall || 0);
      sectorsMap[sector].gmp.push(ipo.gmpPercent || 0);
      sectorsMap[sector].ipos.push(ipo);
    });

    const colors = [
      "139, 92, 246", // violet
      "16, 185, 129", // emerald
      "59, 130, 246", // blue
      "245, 158, 11",  // amber
      "236, 72, 153", // pink
      "99, 102, 241"  // indigo
    ];

    return Object.entries(sectorsMap).map(([sector, data], idx) => {
      const avgSub = data.subscription.reduce((a, b) => a + b, 0) / data.subscription.length;
      const avgGmp = data.gmp.reduce((a, b) => a + b, 0) / data.gmp.length;
      const sortedByGmp = [...data.ipos].sort((a, b) => b.gmpPercent - a.gmpPercent);
      return {
        sector,
        subscription: Number(avgSub.toFixed(1)) || 0,
        gmp: Number(avgGmp.toFixed(1)) || 0,
        count: data.ipos.length,
        topIpo: sortedByGmp[0]?.name || "N/A",
        baseColor: colors[idx % colors.length]
      };
    });
  }, [ipos]);

  // Extract top IPOs to draw a dynamic trend chart
  const topIposForTrend = React.useMemo(() => {
    return [...ipos]
      .sort((a, b) => (b.gmp || 0) - (a.gmp || 0))
      .slice(0, 3);
  }, [ipos]);

  // Dynamically build GMP historical trend data for the AreaChart
  const trendData = React.useMemo(() => {
    const days = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"];
    return days.map((day, idx) => {
      const obj: any = { day };
      topIposForTrend.forEach(ipo => {
        const finalGmp = ipo.gmp || 10;
        const factor = (idx + 1) / 5;
        const factorWithFluctuation = factor * (0.88 + Math.sin(idx + ipo.symbol.charCodeAt(0)) * 0.08);
        obj[ipo.symbol] = Math.max(0, Math.round(finalGmp * factorWithFluctuation));
      });
      return obj;
    });
  }, [topIposForTrend]);

  // Active recommendations
  const activeIpos = ipos.filter(i => i.status === "ACTIVE" || i.status === "UPCOMING").slice(0, 3);

  // Widget Layout states with LocalStorage persistence
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem("iposense_widget_order_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      "stats_overview",
      "gmp_trend",
      "subscription_distribution",
      "demand_heatmap",
      "active_tracker",
      "notifications_hub",
      "analytics_scatter"
    ];
  });

  const [widgetVisibility, setWidgetVisibility] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("iposense_widget_visibility_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      stats_overview: true,
      gmp_trend: true,
      subscription_distribution: true,
      demand_heatmap: true,
      active_tracker: true,
      notifications_hub: true,
      analytics_scatter: true
    };
  });

  const [widgetWidths, setWidgetWidths] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("iposense_widget_widths_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      stats_overview: "lg:col-span-3",
      gmp_trend: "lg:col-span-2",
      subscription_distribution: "lg:col-span-1",
      demand_heatmap: "lg:col-span-2",
      active_tracker: "lg:col-span-1",
      notifications_hub: "lg:col-span-1",
      analytics_scatter: "lg:col-span-3"
    };
  });

  // Drag and Drop States
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedId === null || draggedId === targetId) return;
    
    const currentIdx = widgetOrder.indexOf(draggedId);
    const targetIdx = widgetOrder.indexOf(targetId);
    if (currentIdx !== -1 && targetIdx !== -1) {
      const newOrder = [...widgetOrder];
      newOrder.splice(currentIdx, 1);
      newOrder.splice(targetIdx, 0, draggedId);
      setWidgetOrder(newOrder);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  // Button base re-ordering
  const moveWidget = (id: string, direction: "up" | "down") => {
    const index = widgetOrder.indexOf(id);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= widgetOrder.length) return;
    
    const newOrder = [...widgetOrder];
    const [removed] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, removed);
    setWidgetOrder(newOrder);
  };

  // Layout presets logic
  const applyPreset = (presetName: string) => {
    setActivePreset(presetName);
    if (presetName === "balanced") {
      setWidgetOrder([
        "stats_overview",
        "gmp_trend",
        "subscription_distribution",
        "demand_heatmap",
        "active_tracker",
        "notifications_hub",
        "analytics_scatter"
      ]);
      setWidgetVisibility({
        stats_overview: true,
        gmp_trend: true,
        subscription_distribution: true,
        demand_heatmap: true,
        active_tracker: true,
        notifications_hub: true,
        analytics_scatter: true
      });
      setWidgetWidths({
        stats_overview: "lg:col-span-3",
        gmp_trend: "lg:col-span-2",
        subscription_distribution: "lg:col-span-1",
        demand_heatmap: "lg:col-span-2",
        active_tracker: "lg:col-span-1",
        notifications_hub: "lg:col-span-1",
        analytics_scatter: "lg:col-span-3"
      });
    } else if (presetName === "analytical") {
      setWidgetOrder([
        "analytics_scatter",
        "gmp_trend",
        "subscription_distribution",
        "demand_heatmap",
        "stats_overview",
        "active_tracker",
        "notifications_hub"
      ]);
      setWidgetVisibility({
        stats_overview: true,
        gmp_trend: true,
        subscription_distribution: true,
        demand_heatmap: true,
        active_tracker: true,
        notifications_hub: true,
        analytics_scatter: true
      });
      setWidgetWidths({
        stats_overview: "lg:col-span-1",
        gmp_trend: "lg:col-span-2",
        subscription_distribution: "lg:col-span-1",
        demand_heatmap: "lg:col-span-2",
        active_tracker: "lg:col-span-1",
        notifications_hub: "lg:col-span-1",
        analytics_scatter: "lg:col-span-3"
      });
    } else if (presetName === "compact") {
      setWidgetOrder([
        "stats_overview",
        "active_tracker",
        "notifications_hub",
        "gmp_trend",
        "subscription_distribution",
        "demand_heatmap",
        "analytics_scatter"
      ]);
      setWidgetVisibility({
        stats_overview: true,
        gmp_trend: false,
        subscription_distribution: false,
        demand_heatmap: false,
        active_tracker: true,
        notifications_hub: true,
        analytics_scatter: false
      });
      setWidgetWidths({
        stats_overview: "lg:col-span-3",
        active_tracker: "lg:col-span-2",
        notifications_hub: "lg:col-span-1",
        gmp_trend: "lg:col-span-2",
        subscription_distribution: "lg:col-span-1",
        demand_heatmap: "lg:col-span-2",
        analytics_scatter: "lg:col-span-3"
      });
    }
  };

  const saveCustomLayout = () => {
    localStorage.setItem("iposense_widget_order_v2", JSON.stringify(widgetOrder));
    localStorage.setItem("iposense_widget_visibility_v2", JSON.stringify(widgetVisibility));
    localStorage.setItem("iposense_widget_widths_v2", JSON.stringify(widgetWidths));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const resetLayout = () => {
    localStorage.removeItem("iposense_widget_order_v2");
    localStorage.removeItem("iposense_widget_visibility_v2");
    localStorage.removeItem("iposense_widget_widths_v2");
    applyPreset("balanced");
  };

  // Scatter Chart data computation
  const scatterData = React.useMemo(() => {
    const source = ipos.length > 0 ? ipos : [
      { name: "Acme CloudTech AI", subscriptionOverall: 38.5, gmpPercent: 44.2, aiScore: 92, industry: "Enterprise AI & Tech", symbol: "ACT" },
      { name: "Solaris Renewable", subscriptionOverall: 28.2, gmpPercent: 31.8, aiScore: 85, industry: "Clean Energy & Grid", symbol: "SOL" },
      { name: "NovaCharge Mobility", subscriptionOverall: 21.4, gmpPercent: 19.5, aiScore: 78, industry: "Electric Mobility", symbol: "NCM" },
      { name: "ZetaPay Fintech", subscriptionOverall: 14.8, gmpPercent: 12.0, aiScore: 70, industry: "Fintech & Payments", symbol: "ZPF" },
      { name: "Apex LogiChain", subscriptionOverall: 11.2, gmpPercent: 8.5, aiScore: 64, industry: "Logistics & Supply", symbol: "ALC" },
      { name: "BioPharma Lab", subscriptionOverall: 9.6, gmpPercent: 6.2, aiScore: 58, industry: "Healthcare & Biotech", symbol: "BPL" },
    ];
    
    return source.map((ipo, idx) => ({
      name: ipo.name,
      symbol: ipo.symbol || ipo.name.split(' ')[0],
      sub: ipo.subscriptionOverall || ipo.subscriptionRetail || (5 + idx * 8),
      gmp: ipo.gmpPercent || (2 + idx * 7),
      score: ipo.aiScore || (50 + idx * 7),
      industry: ipo.industry || "General Tech",
      color: ["#8b5cf6", "#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#6366f1"][idx % 6]
    }));
  }, [ipos]);

  // Scatter spotlight selected IPO
  const [selectedScatterIpo, setSelectedScatterIpo] = useState<any>(null);

  React.useEffect(() => {
    if (scatterData.length > 0 && !selectedScatterIpo) {
      setSelectedScatterIpo(scatterData[0]);
    }
  }, [scatterData]);

  // Allotment chance estimator states
  const [estimatorIpoSymbol, setEstimatorIpoSymbol] = useState<string>("");
  const [estimatorCategory, setEstimatorCategory] = useState<"retail" | "hni" | "qib">("retail");

  React.useEffect(() => {
    if (scatterData.length > 0 && !estimatorIpoSymbol) {
      setEstimatorIpoSymbol(scatterData[0].symbol);
    }
  }, [scatterData]);

  const estimatedChance = React.useMemo(() => {
    const currentSymbol = estimatorIpoSymbol || (scatterData[0]?.symbol);
    if (!currentSymbol) return 100;
    
    const match = scatterData.find(s => s.symbol === currentSymbol);
    if (!match) return 100;
    
    let demandFactor = match.sub;
    if (estimatorCategory === "hni") {
      demandFactor = match.sub * 1.8;
    } else if (estimatorCategory === "qib") {
      demandFactor = match.sub * 2.5;
    }
    
    if (demandFactor <= 1) return 100;
    return Math.max(0.5, Math.min(100, (1 / demandFactor) * 100));
  }, [estimatorIpoSymbol, estimatorCategory, scatterData]);

  // Content Renderer for customizable widgets
  const renderWidgetContent = (id: string) => {
    switch (id) {
      case "stats_overview":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div>
                <h4 className="font-bold text-sm text-foreground">Key Portfolio & Performance Stats</h4>
                <p className="text-[10px] text-muted-foreground">Portfolio metrics, subscriptions applied, and live market sentiment.</p>
              </div>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <div className="p-4 rounded-xl border border-border bg-muted/25 flex flex-col justify-between hover:border-primary/20 transition-all">
                <div className="flex justify-between items-start text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Portfolio Value</span>
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="mt-2">
                  <h3 className="text-xl font-extrabold text-foreground">₹{portfolioValue.toLocaleString()}</h3>
                  <span className="text-[10px] text-emerald-500 font-medium flex items-center mt-0.5">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    +₹32,450 (+24.1%) gains
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/25 flex flex-col justify-between hover:border-primary/20 transition-all">
                <div className="flex justify-between items-start text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Applied IPOs</span>
                  <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div className="mt-2">
                  <h3 className="text-xl font-extrabold text-foreground">{applicationsCount}</h3>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    1 Pending Allotment • 2 Listed
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/25 flex flex-col justify-between hover:border-primary/20 transition-all">
                <div className="flex justify-between items-start text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono">AI Smart Score</span>
                  <Award className="h-3.5 w-3.5 text-violet-500" />
                </div>
                <div className="mt-2">
                  <h3 className="text-xl font-extrabold text-foreground">82<span className="text-xs text-muted-foreground font-normal">/100</span></h3>
                  <span className="text-[10px] text-violet-400 font-medium flex items-center mt-0.5">
                    <Sparkles className="h-3 w-3 mr-0.5 text-violet-500" />
                    Strong subscription outlook
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/25 flex flex-col justify-between hover:border-primary/20 transition-all">
                <div className="flex justify-between items-start text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Market Heat</span>
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="mt-2">
                  <h3 className="text-xl font-extrabold text-foreground">Very Active</h3>
                  <span className="text-[10px] text-amber-500 font-medium flex items-center mt-0.5">
                    3 active issues this week
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case "gmp_trend":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border/40 pb-2">
              <div>
                <h3 className="text-base font-bold text-foreground">Grey Market Premium (GMP) Analytics</h3>
                <p className="text-[11px] text-muted-foreground">Track premia momentum across leading subscriptions (past 5 sessions)</p>
              </div>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-mono text-muted-foreground shrink-0">Live Trajectory</span>
            </div>
            
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    {topIposForTrend.map((ipo, idx) => {
                      const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"];
                      const color = colors[idx % colors.length];
                      return (
                        <linearGradient id={`color-${ipo.symbol}`} x1="0" y1="0" x2="0" y2="1" key={ipo.symbol}>
                          <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={color} stopOpacity={0}/>
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <XAxis dataKey="day" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "12px", fontSize: "12px" }}
                    itemStyle={{ color: "var(--color-foreground)" }}
                  />
                  {topIposForTrend.map((ipo, idx) => {
                    const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"];
                    const color = colors[idx % colors.length];
                    return (
                      <Area 
                        key={ipo.symbol}
                        type="monotone" 
                        dataKey={ipo.symbol} 
                        stroke={color} 
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill={`url(#color-${ipo.symbol})`} 
                        name={`${ipo.name} (+${ipo.gmpPercent}%)`} 
                      />
                    );
                  })}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case "subscription_distribution":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div>
                <h4 className="text-base font-bold text-foreground">Subscription & Core Picks</h4>
                <p className="text-[11px] text-muted-foreground">Category-wise quota subscription multiples and AI recommendations.</p>
              </div>
              <Award className="h-4 w-4 text-violet-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="bg-muted/10 border border-border/40 rounded-xl p-3">
                <h5 className="text-xs font-bold mb-2">Category Demand Distribution</h5>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ipos.slice(0, 3).map(ipo => ({
                      name: ipo.symbol,
                      QIB: ipo.subscriptionQib || 0,
                      Retail: ipo.subscriptionRetail || 0,
                      HNI: ipo.subscriptionHni || 0
                    }))} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <XAxis dataKey="name" fontSize={10} stroke="#888888" tickLine={false} />
                      <YAxis fontSize={10} stroke="#888888" tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '9px' }} />
                      <Bar dataKey="QIB" fill="#8b5cf6" name="QIB Quota" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Retail" fill="#10b981" name="Retail" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="HNI" fill="#f59e0b" name="HNI" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-muted/10 border border-border/40 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <h5 className="text-xs font-bold mb-1">AI Recommendation Picks</h5>
                  <p className="text-[10px] text-muted-foreground font-medium">Actionable subscription picks curated by your AI analyst.</p>
                </div>
                <div className="space-y-2 mt-3">
                  {activeIpos.length > 0 ? (
                    activeIpos.slice(0, 2).map((ipo) => {
                      const isApply = ipo.recommendation === "APPLY" || ipo.aiScore >= 75;
                      const bg = isApply ? "bg-violet-500/5 border-violet-500/10" : "bg-emerald-500/5 border-emerald-500/10";
                      const btnBg = isApply ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-emerald-600 hover:bg-emerald-500 text-white";
                      return (
                        <div key={ipo.id} className={`flex justify-between items-center p-2.5 rounded-lg border ${bg}`}>
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-xs font-bold truncate">{ipo.name}</span>
                            <span className="text-[9px] text-muted-foreground">Score: {ipo.aiScore} • GMP: +{ipo.gmpPercent}%</span>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onNavigate("discovery"); }}
                            className={`font-bold px-2.5 py-1 rounded-md text-[10px] shrink-0 cursor-pointer ${btnBg}`}
                          >
                            {isApply ? "View & Apply" : "Analyze"}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground italic text-center py-4">No active issues.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "demand_heatmap":
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-2">
              <div>
                <h3 className="text-base font-bold text-foreground">Sector Demand Heatmap</h3>
                <p className="text-[11px] text-muted-foreground">Multi-source subscription multiples and grey market premiums.</p>
              </div>

              <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setHeatmapMetric("subscription"); }}
                  className={`px-2.5 py-0.5 text-[10px] rounded-md font-semibold transition-all cursor-pointer ${
                    heatmapMetric === "subscription"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Subscription
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setHeatmapMetric("gmp"); }}
                  className={`px-2.5 py-0.5 text-[10px] rounded-md font-semibold transition-all cursor-pointer ${
                    heatmapMetric === "gmp"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  GMP Heat
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch pt-1">
              <div className="grid grid-cols-2 gap-2">
                {sectorData.slice(0, 4).map((sec) => {
                  const val = heatmapMetric === "subscription" ? sec.subscription : sec.gmp;
                  const unit = heatmapMetric === "subscription" ? "x" : "%";
                  const maxVal = heatmapMetric === "subscription" ? 40 : 50;
                  const intensity = Math.min(val / maxVal, 1);
                  const isSelected = selectedSector === sec.sector;

                  return (
                    <button
                      key={sec.sector}
                      onClick={(e) => { e.stopPropagation(); setSelectedSector(isSelected ? null : sec.sector); }}
                      className={`p-2.5 rounded-lg border text-left transition-all relative overflow-hidden group flex flex-col justify-between h-20 cursor-pointer ${
                        isSelected 
                          ? "border-primary ring-1 ring-primary/20 bg-muted/60" 
                          : "border-border hover:border-primary/25 hover:bg-muted/10 bg-card"
                      }`}
                      style={{
                        backgroundColor: `rgba(${sec.baseColor}, ${0.05 + intensity * 0.15})`
                      }}
                    >
                      <div 
                        className="absolute top-0 left-0 right-0 h-1" 
                        style={{ backgroundColor: `rgb(${sec.baseColor})` }}
                      />
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-muted-foreground font-semibold uppercase tracking-wider block">
                          {sec.count} Offers
                        </span>
                        <h4 className="font-bold text-[11px] leading-tight group-hover:text-primary transition-colors truncate max-w-full">
                          {sec.sector}
                        </h4>
                      </div>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-[8px] text-muted-foreground font-mono">
                          {heatmapMetric === "subscription" ? "Avg Sub" : "Avg GMP"}
                        </span>
                        <span 
                          className="font-bold font-mono text-[11px]"
                          style={{ color: `rgb(${sec.baseColor})` }}
                        >
                          {heatmapMetric === "subscription" ? "" : "+"}{val}{unit}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/25 flex flex-col justify-between min-h-[170px]">
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                      {selectedSector ? `${selectedSector} Overview` : "Domain Interest Benchmark"}
                    </h4>
                    {selectedSector && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedSector(null); }}
                        className="text-[9px] text-primary hover:underline font-semibold cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  
                  {selectedSector ? (
                    <div className="mt-2 space-y-1 font-mono text-[10px]">
                      {(() => {
                        const s = sectorData.find(sec => sec.sector === selectedSector)!;
                        return (
                          <>
                            <div className="flex justify-between py-0.5 border-b border-border/40">
                              <span className="text-muted-foreground">Sector:</span>
                              <span className="font-bold text-foreground truncate max-w-[120px]">{s.sector}</span>
                            </div>
                            <div className="flex justify-between py-0.5 border-b border-border/40">
                              <span className="text-muted-foreground">Top IPO:</span>
                              <span className="font-bold text-primary truncate max-w-[120px]">{s.topIpo}</span>
                            </div>
                            <div className="flex justify-between py-0.5 border-b border-border/40">
                              <span className="text-muted-foreground">Subscribers:</span>
                              <span className="font-bold text-emerald-500">{s.subscription}x</span>
                            </div>
                            <div className="flex justify-between py-0.5 border-b border-border/40">
                              <span className="text-muted-foreground">Avg GMP:</span>
                              <span className="font-bold text-emerald-500">+{s.gmp}%</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="mt-1 h-32 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={sectorData.slice(0, 4)} 
                          layout="vertical"
                          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                        >
                          <XAxis type="number" stroke="#888888" fontSize={8} tickLine={false} axisLine={false} />
                          <YAxis 
                            type="category" 
                            dataKey="sector" 
                            stroke="#888888" 
                            fontSize={8} 
                            tickLine={false} 
                            axisLine={false} 
                            width={70}
                          />
                          <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", fontSize: "9px" }} />
                          <Bar 
                            dataKey={heatmapMetric === "subscription" ? "subscription" : "gmp"} 
                            radius={[0, 4, 4, 0]}
                          >
                            {sectorData.slice(0, 4).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`rgb(${entry.baseColor})`} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "active_tracker":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div>
                <h3 className="text-base font-bold text-foreground">Active Listings Tracker</h3>
                <p className="text-[11px] text-muted-foreground">Live tracking of ongoing and upcoming public offers.</p>
              </div>
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
              {activeIpos.length > 0 ? (
                activeIpos.map((ipo) => (
                  <div key={ipo.id} className="flex justify-between items-center p-2.5 rounded-lg bg-muted/30 border border-border hover:border-primary/20 transition-all text-xs">
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] font-mono font-bold text-primary">{ipo.symbol}</span>
                      <h4 className="font-bold mt-0.5 truncate">{ipo.name}</h4>
                      <span className="text-[9px] text-muted-foreground">Price: {ipo.priceBand}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                        ipo.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {ipo.status}
                      </span>
                      <div className="text-[11px] font-black text-foreground mt-1 font-mono">
                        GMP: +{ipo.gmpPercent}%
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-6">No active offers currently tracked.</p>
              )}
            </div>
          </div>
        );

      case "notifications_hub":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border/40 pb-2">
              <div>
                <h3 className="text-base font-bold text-foreground">Alerts & System Notifications</h3>
                <p className="text-[11px] text-muted-foreground">Real-time allotment results and GMP fluctuations.</p>
              </div>
              {notifications.length > 0 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onClearNotifications(); }}
                  className="text-[9px] hover:text-rose-500 hover:underline transition-all font-mono font-semibold cursor-pointer text-muted-foreground"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10">
                  <CheckCircle className="h-7 w-7 text-emerald-500/30 mb-1" />
                  <span className="text-xs font-semibold">Fully Synchronized</span>
                </div>
              ) : (
                notifications.slice(0, 4).map((notif) => {
                  const isSuccess = notif.type === "allotment_success";
                  const isFail = notif.type === "allotment_fail";
                  const isGmp = notif.type === "gmp_alert";
                  const dateText = notif.timestamp ? new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "";
                  
                  return (
                    <div 
                      key={notif.id} 
                      className={`flex items-start space-x-2.5 p-2 rounded-lg border text-xs ${
                        isSuccess 
                          ? "bg-emerald-500/5 border-emerald-500/10" 
                          : isFail 
                          ? "bg-rose-500/5 border-rose-500/10" 
                          : isGmp
                          ? "bg-amber-500/5 border-amber-500/10"
                          : "bg-violet-500/5 border-violet-500/10"
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : isFail ? (
                        <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-violet-500 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-foreground truncate">{notif.title}</h4>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{notif.message}</p>
                        <span className="text-[8px] text-muted-foreground mt-0.5 block font-mono">Today, {dateText}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      case "analytics_scatter":
        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div>
                <h4 className="text-base font-extrabold text-foreground flex items-center">
                  <Sparkles className="h-4 w-4 text-violet-500 mr-2 animate-pulse" />
                  AI Analytics Dashboard Matrix
                </h4>
                <p className="text-[11px] text-muted-foreground">Advanced correlation mapping, Grey Market Premium vs demand multiples, and Allotment Estimator.</p>
              </div>
              <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-mono font-bold shrink-0">Quantitative Desk</span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-1">
              {/* Scatter Graph */}
              <div className="xl:col-span-2 bg-muted/10 border border-border/40 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h5 className="text-xs font-bold text-foreground">GMP % vs. Subscription Intensity Correlation</h5>
                    <p className="text-[10px] text-muted-foreground">Click any bubble/node below to trigger active AI diagnostics.</p>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[9px] text-muted-foreground font-mono">
                    <span className="inline-block w-2 h-2 rounded-full bg-violet-500 animate-ping" />
                    <span>Size proportional to AI score</span>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: -25 }}>
                      <XAxis 
                        type="number" 
                        dataKey="sub" 
                        name="Subscription" 
                        unit="x" 
                        stroke="#888888" 
                        fontSize={9} 
                        tickLine={false}
                        label={{ value: 'Subscription Multiple (x)', position: 'bottom', offset: 0, style: { fill: '#888', fontSize: 9 } }} 
                      />
                      <YAxis 
                        type="number" 
                        dataKey="gmp" 
                        name="GMP" 
                        unit="%" 
                        stroke="#888888" 
                        fontSize={9} 
                        tickLine={false}
                        label={{ value: 'GMP Premium (%)', angle: -90, position: 'insideLeft', offset: 10, style: { fill: '#888', fontSize: 9 } }} 
                      />
                      <ZAxis type="number" dataKey="score" range={[60, 400]} />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }} 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-card border border-border p-2.5 rounded-lg shadow-lg space-y-0.5 text-[11px] z-50">
                                <p className="font-bold text-foreground">{data.name}</p>
                                <p className="text-[9px] text-muted-foreground font-mono">{data.industry}</p>
                                <div className="grid grid-cols-2 gap-x-2 pt-1 border-t border-border/30 text-[10px] font-mono">
                                  <span className="text-muted-foreground">Subscription:</span>
                                  <span className="font-bold text-foreground text-right">{data.sub}x</span>
                                  <span className="text-muted-foreground">GMP Premium:</span>
                                  <span className="font-bold text-emerald-500 text-right">+{data.gmp}%</span>
                                  <span className="text-muted-foreground">AI Score:</span>
                                  <span className="font-bold text-primary text-right">{data.score}/100</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter name="IPOs" data={scatterData}>
                        {scatterData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            onClick={() => setSelectedScatterIpo(entry)} 
                            className="cursor-pointer hover:opacity-80 transition-opacity" 
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Analytical Spotlight Panel */}
              <div className="space-y-4 flex flex-col justify-between">
                {/* Spot 1: Selected Spotlight Deep-Dive */}
                {selectedScatterIpo && (
                  <div className="bg-muted/15 border border-border/40 rounded-xl p-4 space-y-3 flex-1 flex flex-col justify-between min-h-[160px]">
                    <div>
                      <div className="flex items-center justify-between border-b border-border/20 pb-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Spotlight Audit</span>
                        <span className="text-[9px] font-mono font-semibold text-primary px-1.5 py-0.5 bg-primary/5 rounded-full shrink-0">
                          {selectedScatterIpo.symbol}
                        </span>
                      </div>
                      
                      <div className="mt-2">
                        <h5 className="text-xs font-bold text-foreground">{selectedScatterIpo.name}</h5>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{selectedScatterIpo.industry}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 font-mono text-[9px]">
                        <div className="bg-background/40 p-1.5 rounded border border-border/40">
                          <span className="text-[8px] text-muted-foreground block uppercase font-bold">Valuation Rating</span>
                          <span className={`font-bold block mt-0.5 ${
                            selectedScatterIpo.score >= 80 ? "text-emerald-400" : selectedScatterIpo.score >= 65 ? "text-amber-400" : "text-rose-400"
                          }`}>
                            {selectedScatterIpo.score >= 80 ? "Premium Value" : selectedScatterIpo.score >= 65 ? "Fair Value" : "Aggressive Price"}
                          </span>
                        </div>
                        
                        <div className="bg-background/40 p-1.5 rounded border border-border/40">
                          <span className="text-[8px] text-muted-foreground block uppercase font-bold">Risk Matrix</span>
                          <span className="text-foreground font-bold block mt-0.5">
                            {selectedScatterIpo.gmp >= 25 && selectedScatterIpo.sub >= 15 ? "High Gain Safe" :
                             selectedScatterIpo.gmp >= 25 ? "Speculative High" :
                             selectedScatterIpo.sub >= 15 ? "Moderate Flow" : "Conservative Play"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/20 text-[10px] text-muted-foreground italic flex items-center space-x-1.5 leading-tight">
                      <Sparkles className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                      <span>
                        AI Advice: {selectedScatterIpo.score >= 80 ? "Strong buy on listing dips. Multi-quota applications suggested." : "Monitor subscription trend on closing day to secure quick premium exit."}
                      </span>
                    </div>
                  </div>
                )}

                {/* Spot 2: Allotment Chance Estimator */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-primary/10 pb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Allotment Chance Estimator</span>
                    <HelpCircle className="h-3.5 w-3.5 text-primary cursor-help" title="Based on actual subscription multiples and mathematical probability rules." />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <label className="block text-[8px] text-muted-foreground font-bold uppercase mb-1">Target IPO</label>
                      <select
                        value={estimatorIpoSymbol}
                        onChange={(e) => setEstimatorIpoSymbol(e.target.value)}
                        className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                      >
                        {scatterData.map(ipo => (
                          <option key={ipo.symbol} value={ipo.symbol}>{ipo.symbol} ({ipo.sub}x)</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[8px] text-muted-foreground font-bold uppercase mb-1">Category</label>
                      <select
                        value={estimatorCategory}
                        onChange={(e) => setEstimatorCategory(e.target.value as any)}
                        className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                      >
                        <option value="retail">Retail (Indiv)</option>
                        <option value="hni">HNI (Non-Inst)</option>
                        <option value="qib">QIB (Institutional)</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-background/80 border border-border/60 p-2.5 rounded-lg flex items-center justify-between space-x-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500 block">Probability Gauge</span>
                      <span className="text-base font-black text-white block mt-0.5">{estimatedChance.toFixed(1)}% Chance</span>
                      <p className="text-[9px] text-muted-foreground leading-tight mt-1 truncate">
                        {estimatedChance >= 100 
                          ? "Full allotment guaranteed!" 
                          : `Odds: ~1 in ${Math.ceil(100 / estimatedChance)} applicants.`}
                      </p>
                    </div>
                    
                    <div className="w-11 h-11 shrink-0 rounded-full border border-border bg-muted/30 flex items-center justify-center relative">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="22" cy="22" r="18" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="3" fill="none" />
                        <circle cx="22" cy="22" r="18" stroke="var(--color-primary)" strokeWidth="3" fill="none" 
                          strokeDasharray={113}
                          strokeDashoffset={113 - (113 * Math.min(estimatedChance, 100)) / 100}
                        />
                      </svg>
                      <span className="absolute text-[8px] font-black font-mono">{Math.round(estimatedChance)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      {/* Top Banner / Welcome */}
      <div id="welcome-banner" className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-violet-500/5 to-transparent shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome to IPOSense AI Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time quantitative and generative AI intelligence across active, upcoming, and listed public offerings.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2.5 items-center shrink-0">
          {/* Customizer settings trigger */}
          <button
            onClick={() => setIsCustomizing(prev => !prev)}
            className={`flex items-center space-x-1.5 bg-card hover:bg-muted border font-bold px-3.5 py-2 rounded-xl text-xs shadow-sm transition-all duration-200 cursor-pointer ${
              isCustomizing ? "border-primary ring-1 ring-primary/20 text-primary" : "border-border text-foreground"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>{isCustomizing ? "Lock Layout" : "Customize Layout"}</span>
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent("start-onboarding-tour"))}
            className="flex items-center space-x-1.5 bg-card hover:bg-muted text-foreground border border-border font-bold px-3.5 py-2 rounded-xl text-xs shadow-sm transition-all duration-200 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 text-primary fill-primary/10 animate-pulse" />
            <span>Interactive AI Tour</span>
          </button>
          
          <div className="flex items-center space-x-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl text-xs shadow-md shadow-primary/20 animate-pulse">
            <Sparkles className="h-4 w-4" />
            <span>78% Bullish Market Mood</span>
          </div>
        </div>
      </div>

      {/* Dynamic customizable layout drawer/panel */}
      {isCustomizing && (
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-border/40 pb-2">
            <h3 className="text-sm font-bold text-foreground flex items-center">
              <Sliders className="h-4.5 w-4.5 text-primary mr-1.5" />
              Dashboard Customizer & Layout Settings
            </h3>
            <button 
              onClick={() => setIsCustomizing(false)}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Close Setup
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Presets and Actions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-300">Layout Presets</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => applyPreset("balanced")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePreset === "balanced" 
                      ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20" 
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                >
                  Balanced Overview
                </button>
                <button
                  onClick={() => applyPreset("analytical")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePreset === "analytical" 
                      ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20" 
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                >
                  Analytical Focus
                </button>
                <button
                  onClick={() => applyPreset("compact")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePreset === "compact" 
                      ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20" 
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                >
                  Watchlist Compact
                </button>
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  onClick={saveCustomLayout}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{saveSuccess ? "Layout Saved!" : "Save Current Layout"}</span>
                </button>
                <button
                  onClick={resetLayout}
                  className="px-3.5 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Reset Default</span>
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed pt-1.5">
                💡 **Interactive arrangement**: You can drag and drop widgets by grabbing their custom **Grip handle** (visible on hover) to reorder. You can also resize widgets dynamically using their inline width controls.
              </p>
            </div>

            {/* Column 2: Visibility switches */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-300">Toggle Visible Widgets</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries({
                  stats_overview: "Performance Stats Bar",
                  gmp_trend: "GMP Premium Momentum",
                  subscription_distribution: "Subscription & Picks",
                  demand_heatmap: "Sector Demand Heatmap",
                  active_tracker: "Active Listings Tracker",
                  notifications_hub: "System Alerts Center",
                  analytics_scatter: "AI Analytics Matrix"
                }).map(([id, label]) => {
                  const isVisible = widgetVisibility[id];
                  return (
                    <label 
                      key={id} 
                      className="flex items-center space-x-2 bg-muted/40 px-3 py-2 rounded-xl border border-border/50 hover:bg-muted/80 transition-all cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => setWidgetVisibility(prev => ({ ...prev, [id]: !prev[id] }))}
                        className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                      />
                      <span className="text-foreground truncate">{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Customizable Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {widgetOrder.map((widgetId, index) => {
          const isVisible = widgetVisibility[widgetId];
          if (!isVisible) return null;
          
          const colSpan = widgetWidths[widgetId] || "lg:col-span-1";
          
          return (
            <div
              key={widgetId}
              draggable
              onDragStart={(e) => handleDragStart(e, widgetId)}
              onDragOver={(e) => handleDragOver(e, widgetId)}
              onDrop={(e) => handleDrop(e)}
              onDragEnd={handleDragEnd}
              className={`${colSpan} relative rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 group/widget ${
                draggedId === widgetId 
                  ? "opacity-40 border-primary border-dashed scale-[0.98] ring-2 ring-primary/20" 
                  : "hover:border-primary/20"
              }`}
            >
              {/* Drag and customizer bar overlay on hover */}
              <div className="absolute top-4 right-4 flex items-center space-x-2 z-20 opacity-0 group-hover/widget:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm p-1 rounded-lg border border-border">
                {/* Reordering indicators */}
                <div className="flex items-center space-x-1 border-r border-border/60 pr-1.5 mr-0.5">
                  <button
                    onClick={() => moveWidget(widgetId, "up")}
                    disabled={index === 0}
                    title="Move up"
                    className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => moveWidget(widgetId, "down")}
                    disabled={index === widgetOrder.length - 1}
                    title="Move down"
                    className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>

                {/* Width adjustment button */}
                <button
                  onClick={() => {
                    setWidgetWidths(prev => {
                      const current = prev[widgetId] || "lg:col-span-1";
                      const nextMap: Record<string, string> = {
                        "lg:col-span-1": "lg:col-span-2",
                        "lg:col-span-2": "lg:col-span-3",
                        "lg:col-span-3": "lg:col-span-1",
                      };
                      return { ...prev, [widgetId]: nextMap[current] };
                    });
                  }}
                  title="Resize Widget"
                  className="p-1 rounded hover:bg-muted text-xs text-muted-foreground font-mono flex items-center space-x-1 cursor-pointer"
                >
                  <Layers className="h-3 w-3" />
                  <span>
                    {colSpan === "lg:col-span-1" ? "1/3" : colSpan === "lg:col-span-2" ? "2/3" : "Full"}
                  </span>
                </button>

                {/* Hide button */}
                <button
                  onClick={() => setWidgetVisibility(prev => ({ ...prev, [widgetId]: false }))}
                  title="Hide Widget"
                  className="p-1 rounded hover:bg-muted text-rose-500 cursor-pointer"
                >
                  <EyeOff className="h-3 w-3" />
                </button>

                {/* Drag Handle indicator */}
                <div className="p-1 text-muted-foreground cursor-grab active:cursor-grabbing hover:bg-muted rounded" title="Drag to reorder">
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Dynamic widget content based on ID */}
              {renderWidgetContent(widgetId)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
