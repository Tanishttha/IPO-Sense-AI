import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Loader2, 
  Sparkles, 
  RefreshCw, 
  Building2, 
  CheckCircle2, 
  Clock,
  BarChart2
} from "lucide-react";

export default function ListingPredictionAI() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/listing-day/companies");
        const list = await res.json();
        setCompanies(list || []);
      } catch (err) {
        console.error("Failed to load companies:", err);
      }
    })();
  }, []);

  const filtered = companies.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (c.companyName || "").toLowerCase().includes(q) ||
      (c.symbol || "").toLowerCase().includes(q)
    );
  });

  const analyze = async (sym?: string) => {
    const symbolToUse = sym ?? selected?.symbol;
    if (!symbolToUse) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/listing-day/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbolToUse }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selected) return;
    const t = setTimeout(() => {
      analyze(selected.symbol);
    }, 250);
    return () => clearTimeout(t);
  }, [selected]);

  useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  }, [result]);

  // Helper function to safely format numbers to 2 decimal places
  const format2Digits = (val: any) => {
    const num = Number(val);
    return isNaN(num) ? val : num.toFixed(2);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6 text-foreground">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:p-8 border border-border/50">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          {/* Title Updated */}
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Listing Prediction AI</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar: Search & Company List */}
        <aside className="lg:col-span-4 bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col h-[600px]">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by company or symbol..."
              className="w-full pl-9 pr-4 py-2.5 bg-muted/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/70"
            />
          </div>

          {/* List Container */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                No companies found.
              </div>
            ) : (
              filtered.map((c) => {
                const isSelected = selected?.symbol === c.symbol;
                return (
                  <button
                    key={c.symbol}
                    onClick={() => {
                      setSelected(c);
                      setQuery("");
                    }}
                    className={`w-full text-left p-3 rounded-xl flex items-center space-x-3 transition-all duration-200 border ${
                      isSelected
                        ? "bg-primary/10 border-primary/40 shadow-sm"
                        : "border-transparent hover:bg-muted/60"
                    }`}
                  >
                    <div className="h-11 w-11 rounded-lg border border-border/50 flex-shrink-0 overflow-hidden bg-background flex items-center justify-center p-1">
                      {c.logoUrl ? (
                        <img
                          src={c.logoUrl}
                          alt={c.companyName}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Building2 className="h-5 w-5 text-muted-foreground/70" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate text-foreground">
                        {c.companyName}
                      </div>
                      <div className="flex items-center space-x-2 text-[12px] text-muted-foreground mt-0.5">
                        <span className="font-mono font-medium">{c.symbol}</span>
                        <span>•</span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          c.isListed ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}>
                          {c.isListed ? 'Listed' : 'Upcoming'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-semibold text-foreground">
                        {c.subscription ? `${format2Digits(c.subscription)}x` : '—'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Subscribed</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main
          ref={resultRef}
          className="lg:col-span-8 bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[600px] flex flex-col"
        >
          {/* Main Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border/60 gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-xl border border-border flex-shrink-0 bg-muted/30 flex items-center justify-center">
                {selected?.logoUrl ? (
                  <img src={selected.logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
                ) : (
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <h2 className="font-bold text-xl leading-tight">
                  {selected ? selected.companyName : "No Company Selected"}
                </h2>
                <span className="text-xs font-mono text-muted-foreground">
                  {selected ? selected.symbol : "Select a company from the list to view detailed prediction"}
                </span>
              </div>
            </div>

            {selected && (
              <button
                onClick={() => analyze(selected.symbol)}
                disabled={loading}
                className="self-start sm:self-auto inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Re-analyze</span>
              </button>
            )}
          </div>

          {/* Analysis Results View */}
          <div className="flex-1 flex flex-col justify-center">
            {!result && !loading && (
              <div className="text-center py-16 space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <BarChart2 className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-base">Ready for Prediction</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Click on any listed or upcoming company on the left panel to fetch AI predictions and market summaries.
                </p>
              </div>
            )}

            {loading && (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full blur-md bg-primary/20 animate-pulse" />
                  <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold">Generating Prediction...</div>
                  <div className="text-xs text-muted-foreground mt-1">Evaluating market sentiment & demand metrics</div>
                </div>
              </div>
            )}

            {/* Actual Listing View */}
            {result && result.status === "listed" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Actual Listing Report</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <MetricCard label="Listing Price" value={`₹${format2Digits(result.listingPrice)}`} highlight />
                  <MetricCard 
                    label="Listing Return" 
                    value={`${format2Digits(result.listingReturn)}%`} 
                    badge={Number(result.listingReturn) >= 0 ? "Gain" : "Loss"}
                    positive={Number(result.listingReturn) >= 0}
                  />
                  <MetricCard label="Issue Price" value={`₹${format2Digits(result.issuePrice)}`} />
                  <MetricCard label="Subscription" value={`${format2Digits(result.subscription)}x`} />
                </div>

                <div className="bg-muted/30 border border-border/60 rounded-xl p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-sm font-semibold text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>AI Insights Summary</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {result.summary}
                  </p>
                </div>
              </div>
            )}

            {/* Predicted View */}
            {result && result.status === "predicted" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    <Clock className="h-3.5 w-3.5" />
                    <span>AI Prediction Forecast</span>
                  </span>
                </div>

                {/* 2-Digit precision applied to estimates and return */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <MetricCard 
                    label="Est. Listing Price" 
                    value={`₹${format2Digits(result.estimatedListingPrice)}`} 
                    highlight 
                  />
                  <MetricCard 
                    label="Expected Return" 
                    value={`${format2Digits(result.expectedReturn)}%`} 
                    badge={Number(result.expectedReturn) >= 0 ? "Profit" : "Loss"}
                    positive={Number(result.expectedReturn) >= 0}
                  />
                  <MetricCard label="Confidence" value={result.confidence} />
                  <MetricCard label="Subscription" value={`${format2Digits(result.subscription)}x`} />
                </div>

                <div className="bg-muted/30 border border-border/60 rounded-xl p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-sm font-semibold text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>AI Intelligence Summary</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {result.summary}
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  badge,
  positive,
  highlight = false,
}: {
  label: string;
  value: string | number;
  badge?: string;
  positive?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
        highlight
          ? "bg-primary/5 border-primary/30"
          : "bg-background border-border/70"
      }`}
    >
      <div className="text-xs text-muted-foreground font-medium mb-1">{label}</div>
      <div className="flex items-baseline justify-between gap-1">
        <div className="text-lg font-mono font-bold text-foreground">{value}</div>
        {badge && (
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              positive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}