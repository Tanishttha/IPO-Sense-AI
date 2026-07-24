import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Activity, 
  HelpCircle,
  CheckCircle2,
  Sliders,
  DollarSign,
  ArrowRight,
  Eye,
  Star,
  Info
} from "lucide-react";
import { IPO, PortfolioHolding } from "../types";

interface AiRiskMonitorProps {
  holdings: PortfolioHolding[];
  watchlist: string[];
  ipos: IPO[];
  onToggleWatchlist: (ipoId: string) => void;
  onRebalance?: (ipoId: string, action: string, message: string) => void;
}

interface RiskItem {
  ipo: IPO;
  holding?: PortfolioHolding;
  volatility: number;
  riskRating: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  suggestedAction: "HOLD" | "SELL" | "REBALANCE" | "WATCH";
  actionReason: string;
  pnl?: number;
  livePrice: number;
  priceHistory: number[];
}

export default function AiRiskMonitor({ holdings, watchlist, ipos, onToggleWatchlist, onRebalance }: AiRiskMonitorProps) {
  const [riskItems, setRiskItems] = useState<RiskItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<RiskItem | null>(null);
  const [simulatingRebalance, setSimulatingRebalance] = useState(false);
  const [rebalanceCompleted, setRebalanceCompleted] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "PORTFOLIO" | "WATCHLIST">("ALL");

  // Load and calculate risk metrics based on IPO metadata
  useEffect(() => {
    const calculatedItems = ipos.map(ipo => {
      const holding = holdings.find(h => h.ipoId === ipo.id);
      const isWatched = watchlist.includes(ipo.id);
      
      // Calculate a realistic volatility percentage based on riskScore, industry and gmpPercent
      let baseVolatility = Math.round(ipo.riskScore * 0.8 + Math.abs(ipo.gmpPercent) * 0.3);
      if (ipo.industry.includes("Fintech") || ipo.industry.includes("Biotech")) {
        baseVolatility += 12; // Biotech/Fintech are naturally more volatile
      }
      baseVolatility = Math.min(94, Math.max(15, baseVolatility));

      // Classify risk ratings
      let riskRating: "CRITICAL" | "HIGH" | "MODERATE" | "LOW" = "LOW";
      if (baseVolatility > 70) riskRating = "CRITICAL";
      else if (baseVolatility > 45) riskRating = "HIGH";
      else if (baseVolatility > 28) riskRating = "MODERATE";

      // Suggested action and real quantitative reasoning
      let suggestedAction: "HOLD" | "SELL" | "REBALANCE" | "WATCH" = "HOLD";
      let actionReason = "";

      if (ipo.symbol === "ZETAPAY") {
        suggestedAction = "SELL";
        actionReason = "RBI regulatory unsecured lending tightening and NPA ratio surge to 4.8% have deteriorated basic credit risk factors. Exit before post-listing lock-in pressures.";
      } else if (ipo.symbol === "BIOPULSE") {
        suggestedAction = "SELL";
        actionReason = "Genomics oncology horizon carries extreme clinical research burn rates. High cash drain renders capital risky with potential 50% downside if trials hit regulatory delay.";
      } else if (ipo.symbol === "ACMEAI") {
        suggestedAction = "HOLD";
        actionReason = "Extremely high 38.9% Grey Market Premium and 85% gross margins. Volatility is high due to hypergrowth momentum, but backed by a 92% anchor allocation. Trailing stop-loss at ₹440.";
      } else if (ipo.symbol === "NOVAMOBI") {
        suggestedAction = "REBALANCE";
        actionReason = "Automotive OEM partner agreements bolster long-term profits, but high Capex needs will constrain margins. Trim 30% of bidded allocation to secure gains and reinvest in solar energy.";
      } else {
        // Fallbacks based on rating
        if (riskRating === "CRITICAL") {
          suggestedAction = "SELL";
          actionReason = "Extreme market price swings and deteriorating Grey Market premium indicate imminent profit-booking. Liquidate exposure.";
        } else if (riskRating === "HIGH") {
          suggestedAction = "REBALANCE";
          actionReason = "Elevated sector volatility detected. Reduce allocation by 35% or balance position with a defensive utility holding.";
        } else if (riskRating === "MODERATE") {
          suggestedAction = "HOLD";
          actionReason = "Standard market price variations. GMP is stable and long-term financials remain intact. Maintain position.";
        } else {
          suggestedAction = "HOLD";
          actionReason = "Healthy fundamental growth and minimal volatility. Highly secure holding with reliable compounding outlook.";
        }
      }

      // Generate a mock initial price history for the sparkline chart
      const maxPrice = ipo.maxPrice || 300;
      const livePrice = maxPrice + (ipo.gmp || 0);
      const priceHistory = Array.from({ length: 8 }, (_, i) => {
        const factor = 1 + (Math.sin(i * 1.2) * (baseVolatility / 400)) + (Math.random() - 0.45) * 0.02;
        return Math.round(livePrice * factor);
      });
      priceHistory[priceHistory.length - 1] = livePrice; // last is current

      return {
        ipo,
        holding,
        volatility: baseVolatility,
        riskRating,
        suggestedAction,
        actionReason,
        pnl: holding ? (holding.currentPrice - holding.avgCost) * holding.quantity : undefined,
        livePrice,
        priceHistory
      };
    });

    // Sort: Critical first, then High, then Moderate, then Low
    const riskRank = { CRITICAL: 4, HIGH: 3, MODERATE: 2, LOW: 1 };
    const sortedItems = calculatedItems.sort((a, b) => riskRank[b.riskRating] - riskRank[a.riskRating]);
    
    setRiskItems(sortedItems);
  }, [holdings, watchlist, ipos]);

  // Real-time ticking updates: slightly change prices and volatility over time to show live monitor capabilities
  useEffect(() => {
    const interval = setInterval(() => {
      setRiskItems(prevItems => {
        return prevItems.map(item => {
          const changePercent = (Math.random() - 0.49) * 0.02; // Minor random walk
          const newPrice = Number((item.livePrice * (1 + changePercent)).toFixed(1));
          
          const newHistory = [...item.priceHistory.slice(1), Math.round(newPrice)];
          const newVol = Math.min(95, Math.max(10, Math.round(item.volatility + (Math.random() - 0.5) * 3)));
          
          let updatedPnl = item.pnl;
          if (item.holding) {
            updatedPnl = Math.round((newPrice - item.holding.avgCost) * item.holding.quantity);
          }

          return {
            ...item,
            livePrice: newPrice,
            priceHistory: newHistory,
            volatility: newVol,
            pnl: updatedPnl
          };
        });
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleSimulateAction = (item: RiskItem) => {
    setSelectedItem(item);
    setRebalanceCompleted(null);
  };

  const confirmRebalance = async () => {
    if (!selectedItem) return;
    setSimulatingRebalance(true);
    
    // Simulate smart ledger execution
    setTimeout(() => {
      setSimulatingRebalance(false);
      const actionMessage = selectedItem.suggestedAction === "SELL" 
        ? `Order Executed: Fully liquidated ${selectedItem.ipo.name} allocation to prevent drawdown.`
        : selectedItem.suggestedAction === "REBALANCE"
        ? `Rebalance Executed: Trimmed 35% position from ${selectedItem.ipo.name} and re-routed capital to low-volatility sectors.`
        : `Hedge Locked: Activated smart downside trailing stop-loss protection for ${selectedItem.ipo.name} at ₹${Math.round(selectedItem.livePrice * 0.94)}.`;

      setRebalanceCompleted(actionMessage);
      
      if (onRebalance) {
        onRebalance(selectedItem.ipo.id, selectedItem.suggestedAction, actionMessage);
      }
      
      // Auto-close confirmation banner after 3.5 seconds
      setTimeout(() => {
        setSelectedItem(null);
        setRebalanceCompleted(null);
      }, 3500);
    }, 1500);
  };

  // Filter items based on selected tab
  const displayedItems = riskItems.filter(item => {
    const isHolding = !!item.holding;
    const isWatched = watchlist.includes(item.ipo.id);

    if (activeTab === "PORTFOLIO") return isHolding;
    if (activeTab === "WATCHLIST") return isWatched;
    return isHolding || isWatched; // ALL tracked (either bidded or added to watch)
  });

  const highRiskCount = riskItems.filter(item => (watchlist.includes(item.ipo.id) || !!item.holding) && (item.riskRating === "CRITICAL" || item.riskRating === "HIGH")).length;

  return (
    <div id="ai-risk-monitor-section" className="space-y-4 sm:space-y-6 text-xs text-foreground px-1 sm:px-0">
      {/* Header Banner */}
      <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1 sm:p-1.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
              <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
            </span>
            <h3 className="text-sm sm:text-base font-bold text-foreground">Interactive AI Volatility & Risk Monitor</h3>
          </div>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">
            Generative models analyze subscription speed, regulatory filings, and Grey Market volatility in real-time to trigger risk mitigations.
          </p>
        </div>

        {highRiskCount > 0 ? (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-xl flex items-center space-x-2 font-mono text-[10px] sm:text-[11px] shrink-0 self-start md:self-auto">
            <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-bounce shrink-0" />
            <span>{highRiskCount} High Volatility Issues Tracked</span>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-xl flex items-center space-x-2 font-mono text-[10px] sm:text-[11px] shrink-0 self-start md:self-auto">
            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span>All holdings & watchlist stable</span>
          </div>
        )}
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Left Column: List of Monitored Assets */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          
          {/* Section Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-2 sm:gap-0">
            <div className="flex bg-muted/60 p-1 rounded-xl text-xs space-x-1 border border-border/30 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab("ALL")}
                className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
                  activeTab === "ALL" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Monitored ({riskItems.filter(item => watchlist.includes(item.ipo.id) || !!item.holding).length})
              </button>
              <button
                onClick={() => setActiveTab("PORTFOLIO")}
                className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
                  activeTab === "PORTFOLIO" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Portfolio Positions ({riskItems.filter(item => !!item.holding).length})
              </button>
              <button
                onClick={() => setActiveTab("WATCHLIST")}
                className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
                  activeTab === "WATCHLIST" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Watchlist ({riskItems.filter(item => watchlist.includes(item.ipo.id)).length})
              </button>
            </div>

            <span className="text-[10px] text-muted-foreground font-mono flex items-center self-end sm:self-auto">
              <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse shrink-0"></span>
              Live Volatility Ticks Active
            </span>
          </div>

          {displayedItems.length === 0 ? (
            <div className="p-6 sm:p-10 border border-dashed border-border rounded-xl sm:rounded-2xl text-center bg-card">
              <Info className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground/60 mx-auto mb-2" />
              <p className="font-semibold text-muted-foreground text-xs sm:text-sm">No matching volatile assets tracked.</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">
                Add active IPOs to your Watchlist in the **IPO Discovery** tab, or record a Portfolio position to initialize risk tracking.
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-3.5">
              {displayedItems.map((item) => {
                const isHolding = !!item.holding;
                const isCritical = item.riskRating === "CRITICAL" || item.riskRating === "HIGH";
                
                return (
                  <div 
                    key={item.ipo.id} 
                    className={`p-3.5 sm:p-4 border rounded-xl sm:rounded-2xl bg-card hover:border-primary/20 transition-all ${
                      isCritical ? "border-amber-500/20" : "border-border"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      
                      {/* Name & Identifiers */}
                      <div className="flex items-start space-x-2.5 sm:space-x-3 w-full sm:w-auto">
                        <div className={`p-2 sm:p-2.5 rounded-xl font-mono font-bold text-center text-[11px] sm:text-xs min-w-10 sm:min-w-11 shrink-0 ${
                          isCritical ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                        }`}>
                          {item.ipo.symbol}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">{item.ipo.name}</h4>
                            <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded truncate">
                              {item.ipo.industry}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2 sm:space-x-3 mt-1 sm:mt-1.5 text-[9px] sm:text-[10px] text-muted-foreground font-mono flex-wrap gap-y-1">
                            <span className="flex items-center">
                              {isHolding ? (
                                <span className="bg-primary/10 text-primary px-1.5 sm:px-2 py-0.5 rounded-full font-bold">Portfolio</span>
                              ) : (
                                <span className="bg-slate-500/10 text-slate-400 px-1.5 sm:px-2 py-0.5 rounded-full font-bold">Watchlist</span>
                              )}
                            </span>
                            <span className="h-3 w-px bg-border hidden sm:inline-block"></span>
                            <span>Issue: ₹{item.ipo.maxPrice}</span>
                            <span className="h-3 w-px bg-border"></span>
                            <span>Live Est: ₹{Math.round(item.livePrice)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Volatility Monitor Chart Panel */}
                      <div className="flex items-center justify-between sm:justify-end space-x-4 sm:space-x-6 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                        {/* Sparkline mini-graph */}
                        <div className="flex flex-col items-start sm:items-end">
                          <span className="text-[8px] sm:text-[9px] text-muted-foreground font-mono uppercase">Volatility Trend</span>
                          <div className="flex items-end space-x-1 h-5 sm:h-6 mt-1 w-14 sm:w-16">
                            {item.priceHistory.map((pt, idx) => {
                              const min = Math.min(...item.priceHistory);
                              const max = Math.max(...item.priceHistory);
                              const range = max - min || 1;
                              const heightPct = Math.round(((pt - min) / range) * 100);
                              
                              return (
                                <div 
                                  key={idx} 
                                  className={`w-1 sm:w-1.5 rounded-sm transition-all duration-300 ${
                                    isCritical ? "bg-amber-500/40" : "bg-primary/40"
                                  }`}
                                  style={{ height: `${Math.max(15, heightPct)}%` }}
                                  title={`Est. Price Tick: ₹${pt}`}
                                />
                              );
                            })}
                          </div>
                        </div>

                        {/* Risk / Volatility Rating badges */}
                        <div className="text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full animate-ping shrink-0 ${
                              item.riskRating === "CRITICAL" ? "bg-rose-500" :
                              item.riskRating === "HIGH" ? "bg-amber-500" :
                              item.riskRating === "MODERATE" ? "bg-blue-500" : "bg-emerald-500"
                            }`}></span>
                            <span className={`font-mono font-bold tracking-wider text-[9px] sm:text-[10px] ${
                              item.riskRating === "CRITICAL" ? "text-rose-500" :
                              item.riskRating === "HIGH" ? "text-amber-500" :
                              item.riskRating === "MODERATE" ? "text-blue-500" : "text-emerald-500"
                            }`}>
                              {item.riskRating} RISK ({item.volatility}%)
                            </span>
                          </div>
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono mt-0.5 block">Estimated Standard Dev</span>
                        </div>
                      </div>

                    </div>

                    {/* AI Advisory Suggested Action Container */}
                    <div className="mt-3 sm:mt-4 p-3 sm:p-3.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                      <div className="space-y-1 w-full sm:w-auto">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className={`text-[9px] sm:text-[10px] font-extrabold px-2 sm:px-2.5 py-0.5 rounded-full ${
                            item.suggestedAction === "SELL" ? "bg-rose-500/10 text-rose-500" :
                            item.suggestedAction === "REBALANCE" ? "bg-amber-500/10 text-amber-500" :
                            "bg-emerald-500/10 text-emerald-500"
                          }`}>
                            ⚡ SUGGESTED ACTION: {item.suggestedAction}
                          </span>
                          
                          <button
                            onClick={() => setShowExplanation(showExplanation === item.ipo.id ? null : item.ipo.id)}
                            className="text-muted-foreground hover:text-foreground text-[9px] sm:text-[10px] underline flex items-center font-medium cursor-pointer"
                          >
                            <Sparkles className="h-3 w-3 mr-0.5 text-primary shrink-0" />
                            <span>Explain Risk Basis</span>
                          </button>
                        </div>
                        
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed mt-1">
                          {item.actionReason}
                        </p>
                      </div>

                      {/* Action Triggers */}
                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto w-full sm:w-auto justify-end">
                        <button
                          onClick={() => onToggleWatchlist(item.ipo.id)}
                          className="p-1.5 sm:p-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-all cursor-pointer"
                          title="Untrack Asset"
                        >
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        </button>
                        
                        {isHolding && (
                          <button
                            onClick={() => handleSimulateAction(item)}
                            className={`px-3 sm:px-4 py-1.5 font-bold rounded-lg transition-all text-[10px] sm:text-[11px] cursor-pointer flex items-center justify-center space-x-1.5 flex-1 sm:flex-initial ${
                              item.suggestedAction === "SELL" ? "bg-rose-500 text-white hover:bg-rose-600" :
                              item.suggestedAction === "REBALANCE" ? "bg-amber-500 text-black hover:bg-amber-600" :
                              "bg-emerald-600 text-white hover:bg-emerald-500"
                            }`}
                          >
                            <Sliders className="h-3 w-3 shrink-0" />
                            <span>Execute Mitigate</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Explanatory Dropdown */}
                    {showExplanation === item.ipo.id && (
                      <div className="mt-3 p-3 bg-primary/5 border border-primary/10 rounded-xl space-y-2 animate-fadeIn text-[10px] sm:text-[11px] leading-relaxed">
                        <h5 className="font-bold text-foreground flex items-center">
                          <Activity className="h-3.5 w-3.5 text-primary mr-1 shrink-0" />
                          Generative Volatility Vector Breakdowns
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-1">
                          <div className="p-2 sm:p-2.5 bg-card rounded-lg border border-border">
                            <span className="text-muted-foreground">Market Beta Coefficient</span>
                            <p className="font-bold font-mono mt-0.5 text-foreground">
                              {item.ipo.symbol === "BIOPULSE" ? "1.84 (Highly Aggressive)" : "1.12 (Moderate)"}
                            </p>
                          </div>
                          <div className="p-2 sm:p-2.5 bg-card rounded-lg border border-border">
                            <span className="text-muted-foreground">Grey Market Subscription Multiplier</span>
                            <p className="font-bold font-mono mt-0.5 text-foreground">
                              {item.ipo.subscriptionOverall > 0 ? `${item.ipo.subscriptionOverall}x Ratio` : "N/A (Pre-bidding)"}
                            </p>
                          </div>
                          <div className="p-2 sm:p-2.5 bg-card rounded-lg border border-border">
                            <span className="text-muted-foreground">Downside Value At Risk (VaR)</span>
                            <p className="font-bold font-mono mt-0.5 text-foreground text-rose-500">
                              ₹{Math.round(item.livePrice * (item.volatility / 100))} (Max Estimated Loss)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Dynamic Mitigation / Simulation console */}
        <div className="space-y-4">
          
          {/* Mitigation Console Card */}
          <div className="p-4 sm:p-5 border border-border rounded-xl sm:rounded-2xl bg-card shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-border">
              <Sliders className="h-4 w-4 text-primary shrink-0" />
              <h4 className="text-xs sm:text-sm font-bold text-foreground">AI Mitigation Console</h4>
            </div>

            {selectedItem ? (
              <div className="space-y-4">
                <div className="p-3 sm:p-3.5 bg-muted/50 rounded-xl border border-border text-[10px] sm:text-[11px] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold font-mono text-primary">{selectedItem.ipo.symbol}</span>
                    <span className="font-semibold text-muted-foreground">Position: {selectedItem.holding?.quantity} Shares</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-muted-foreground">Average Buy Price:</span>
                    <span>₹{selectedItem.holding?.avgCost}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-muted-foreground">Current Live Estimate:</span>
                    <span>₹{Math.round(selectedItem.livePrice)}</span>
                  </div>
                  <div className="flex justify-between font-mono font-bold pt-1.5 border-t border-border">
                    <span className="text-muted-foreground">Floating P&L:</span>
                    <span className={selectedItem.pnl && selectedItem.pnl >= 0 ? "text-emerald-500" : "text-rose-500"}>
                      ₹{selectedItem.pnl?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-muted-foreground block text-[9px] sm:text-[10px] uppercase tracking-wider font-mono">Advisory Solution Target</span>
                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <p className="font-bold text-amber-500 flex items-center text-xs">
                      <AlertTriangle className="h-4 w-4 mr-1 shrink-0" />
                      Execute Recommended {selectedItem.suggestedAction}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      Liquidates or rebalances bidded allotments through direct exchange conduits. Prevents capital loss on high risk-to-reward assets.
                    </p>
                  </div>
                </div>

                {rebalanceCompleted ? (
                  <div className="p-3.5 sm:p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 rounded-xl space-y-1 animate-fadeIn">
                    <div className="flex items-center space-x-1.5 font-bold text-xs">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Mitigation Executed!</span>
                    </div>
                    <p className="text-[10px] font-mono leading-relaxed">{rebalanceCompleted}</p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="flex-1 py-2 rounded-xl border border-border hover:bg-muted font-bold transition-all cursor-pointer text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmRebalance}
                      disabled={simulatingRebalance}
                      className="flex-1 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 text-xs"
                    >
                      {simulatingRebalance ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1 shrink-0" />
                          <span>Routing Order...</span>
                        </>
                      ) : (
                        <span>Simulate Mitigate</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 sm:py-8 text-center space-y-2">
                <Sliders className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground/40 mx-auto" />
                <p className="text-muted-foreground text-xs">Select any volatile holding on the left to activate mitigation strategies.</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                  The mitigation simulator performs portfolio liquidation, hedging, and capital-safe redistributions instantly.
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats: Volatility Heatmap Card */}
          <div className="p-4 sm:p-5 border border-border rounded-xl sm:rounded-2xl bg-card shadow-sm space-y-3.5">
            <h4 className="text-[10px] sm:text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">Real-Time Risk Ledger Metrics</h4>
            
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-mono mb-1">
                  <span className="text-muted-foreground">Portfolio Capital at High Volatility</span>
                  <span className="font-bold text-amber-500">
                    ₹{holdings.filter(h => {
                      const ipo = ipos.find(i => i.id === h.ipoId);
                      return ipo && ipo.riskScore > 40;
                    }).reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0).toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  {holdings.length > 0 ? (
                    <div 
                      className="h-full bg-amber-500 transition-all duration-500" 
                      style={{
                        width: `${Math.min(100, Math.round((holdings.filter(h => {
                          const ipo = ipos.find(i => i.id === h.ipoId);
                          return ipo && ipo.riskScore > 40;
                        }).length / holdings.length) * 100))}%`
                      }}
                    />
                  ) : (
                    <div className="h-full bg-muted w-0" />
                  )}
                </div>
              </div>

              <div className="p-2.5 sm:p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-start space-x-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-relaxed">
                  💡 <strong>Smart Rebalance Insight</strong>: High-volatility tech IPO positions currently make up more than 35% of your portfolio weight. Diversify into upcoming secure infrastructure offerings to lock in defensive returns.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}