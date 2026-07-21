import React, { useState, useEffect } from "react";
import { 
  BarChart2, 
  Activity, 
  TrendingUp, 
  ChevronRight, 
  RefreshCw, 
  TrendingDown, 
  AlertCircle, 
  Sliders, 
  Cpu, 
  DollarSign, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Gauge,
  Sparkles,
  Loader2
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  ReferenceLine 
} from "recharts";
import { ListingDayData } from "../types";

export default function ListingDayAI() {
  const [selectedSymbol, setSelectedSymbol] = useState("ACMEAI");
  const [data, setData] = useState<ListingDayData | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [simulationSpeed, setSimulationSpeed] = useState<"NORMAL" | "FAST">("NORMAL");

  // Fetch / update listing day details
  const fetchListingDetails = async () => {
    try {
      const res = await fetch(`/api/listing-day/${selectedSymbol.toLowerCase()}`);
      const latestData: ListingDayData = await res.json();
      setData(latestData);

      // Append data point to chart feed, keeping max 15 points
      setChartData(prev => {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        const newPoint = {
          time: timeStr,
          Price: latestData.currentPrice,
          VWAP: latestData.vwap,
          Support: latestData.support,
          Resistance: latestData.resistance
        };
        const updated = [...prev, newPoint];
        if (updated.length > 15) {
          return updated.slice(1);
        }
        return updated;
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Reset chart when symbol changes
  useEffect(() => {
    setChartData([]);
    setLoading(true);
    fetchListingDetails().then(() => setLoading(false));
  }, [selectedSymbol]);

  // Periodic polling to simulate live ticker price feed
  useEffect(() => {
    const intervalTime = simulationSpeed === "FAST" ? 1500 : 4000;
    const timer = setInterval(() => {
      fetchListingDetails();
    }, intervalTime);

    return () => clearInterval(timer);
  }, [selectedSymbol, simulationSpeed]);

  // Custom order book simulation (Live bid-ask)
  const [orderBook, setOrderBook] = useState<{ bids: any[], asks: any[] }>({ bids: [], asks: [] });
  useEffect(() => {
    if (!data) return;
    const basePrice = data.currentPrice;
    
    const generateOrderBook = () => {
      const bids = Array.from({ length: 5 }, (_, i) => ({
        price: Number((basePrice - (i + 1) * 0.15).toFixed(2)),
        volume: Math.floor(2000 + Math.random() * 8000),
      }));
      const asks = Array.from({ length: 5 }, (_, i) => ({
        price: Number((basePrice + (i + 1) * 0.15).toFixed(2)),
        volume: Math.floor(2000 + Math.random() * 8000),
      }));
      setOrderBook({ bids, asks });
    };

    generateOrderBook();
    const bookTimer = setInterval(generateOrderBook, 3000);
    return () => clearInterval(bookTimer);
  }, [data]);

  return (
    <div className="space-y-6 text-foreground">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Listing Day AI Trading Advisor</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Streaming real-time pricing ticks & indicators. AI advises entry/exit strategies every few seconds.
          </p>
        </div>

        {/* Ticker Selector */}
        <div className="flex items-center space-x-2 bg-muted p-1 rounded-xl">
          {["ACMEAI", "APEXLOGI"].map((sym) => (
            <button
              key={sym}
              onClick={() => setSelectedSymbol(sym)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                selectedSymbol === sym ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <LoaderSpinner />
          <span className="text-xs text-muted-foreground mt-2 font-mono">Connecting to real-time exchange pricing pipeline...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          
          {/* Main Visualizer: Live Price Chart */}
          <div className="xl:col-span-3 space-y-6">
            
            {/* Real-time ticker banner */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-5 rounded-2xl border border-border bg-card">
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Live Current Price</span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <h3 className="text-lg font-bold font-mono">₹{data.currentPrice}</h3>
                  <span className="text-[10px] font-bold text-emerald-500 font-mono">
                    +{Math.round(((data.currentPrice - data.openPrice)/data.openPrice)*1000)/10}%
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">VWAP Value</span>
                <p className="text-sm font-semibold font-mono text-foreground mt-0.5">₹{data.vwap}</p>
              </div>
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">RSI (14)</span>
                <p className={`text-sm font-bold font-mono mt-0.5 ${
                  data.rsi > 70 ? "text-amber-500" : (data.rsi < 30 ? "text-rose-500" : "text-emerald-500")
                }`}>
                  {data.rsi} ({data.rsi > 70 ? "Overbought" : (data.rsi < 30 ? "Oversold" : "Stable")})
                </p>
              </div>
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Total Volume</span>
                <p className="text-sm font-semibold font-mono text-foreground mt-0.5">
                  {(data.volume / 100000).toFixed(1)} L
                </p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Simulation Speed</span>
                <div className="flex items-center space-x-1 mt-1">
                  <button
                    onClick={() => setSimulationSpeed("NORMAL")}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                      simulationSpeed === "NORMAL" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    1x
                  </button>
                  <button
                    onClick={() => setSimulationSpeed("FAST")}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                      simulationSpeed === "FAST" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    Turbine
                  </button>
                </div>
              </div>
            </div>

            {/* Price Line chart */}
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold">Exchange Trading Tick Graph (TradingView Line Feed)</h3>
                <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold flex items-center">
                  <Activity className="h-3 w-3 mr-1 animate-pulse" /> Live Pricing
                </span>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="time" stroke="#888888" fontSize={10} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} stroke="#888888" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", fontSize: "11px" }} />
                    <Line type="monotone" dataKey="Price" stroke="#a78bfa" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} name="Live Price" />
                    <Line type="monotone" dataKey="VWAP" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="VWAP Line" />
                    <ReferenceLine y={data.support} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Support', fill: '#ef4444', fontSize: 9, position: 'insideBottomRight' }} />
                    <ReferenceLine y={data.resistance} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Resistance', fill: '#10b981', fontSize: 9, position: 'insideTopRight' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Custom order book (Market Depth) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bid Ask Orders */}
              <div className="p-5 rounded-2xl border border-border bg-card text-xs">
                <h4 className="font-bold mb-3 flex items-center text-primary">
                  <Sliders className="h-4 w-4 mr-1.5" /> Order Market Depth
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Bids - Buyers */}
                  <div className="space-y-1.5 font-mono">
                    <span className="text-[10px] text-emerald-500 font-bold">Bids (Buy)</span>
                    {orderBook.bids.map((b, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] p-1 bg-emerald-500/5 rounded">
                        <span className="text-emerald-500">₹{b.price}</span>
                        <span className="text-muted-foreground">{b.volume} Sh</span>
                      </div>
                    ))}
                  </div>

                  {/* Asks - Sellers */}
                  <div className="space-y-1.5 font-mono">
                    <span className="text-[10px] text-rose-500 font-bold">Asks (Sell)</span>
                    {orderBook.asks.map((a, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] p-1 bg-rose-500/5 rounded">
                        <span className="text-rose-500">₹{a.price}</span>
                        <span className="text-muted-foreground">{a.volume} Sh</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Technical Indicator Gauges */}
              <div className="p-5 rounded-2xl border border-border bg-card text-xs space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold flex items-center text-primary">
                    <Gauge className="h-4 w-4 mr-1.5" /> Technical Momentum Checkers
                  </h4>
                  <p className="text-muted-foreground text-[11px]">Dynamic algorithmic calculations comparing MACD, Exponential Averages, and Volume patterns.</p>
                </div>
                
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                    <span className="text-muted-foreground">MACD Status</span>
                    <span className="font-bold font-mono text-emerald-500">{data.macd}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                    <span className="text-muted-foreground">Institutional Volume</span>
                    <span className={`font-bold font-mono ${data.institutionalBuying === 'HIGH' ? "text-emerald-500" : "text-muted-foreground"}`}>
                      {data.institutionalBuying} BUYING
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                    <span className="text-muted-foreground">Retail Liquidation</span>
                    <span className="font-bold font-mono text-amber-500">{data.retailSelling} SELLING</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Sidebar Col: AI Recommendation Engine */}
          <div className="xl:col-span-1 border border-primary/20 rounded-2xl bg-gradient-to-b from-primary/10 to-transparent overflow-hidden shadow-sm sticky top-24">
            <div className="p-5 border-b border-border bg-card flex items-center space-x-2">
              <Cpu className="h-5 w-5 text-primary animate-pulse" />
              <div>
                <h3 className="font-bold text-sm">Listing Day AI Core</h3>
                <p className="text-[10px] text-muted-foreground font-mono">Real-time Trading Directives</p>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Direct Recommendation Card */}
              <div className="p-4 bg-card border border-border rounded-xl text-center shadow-sm">
                <span className="text-muted-foreground uppercase font-mono font-bold tracking-wider">AI RECOMMENDATION</span>
                <h4 className={`text-xl font-bold mt-2 ${
                  data.aiRecommendation === "SELL NOW" || data.aiRecommendation === "EXIT" ? "text-rose-500" :
                  data.aiRecommendation === "BUY MORE" ? "text-primary" : "text-emerald-500"
                }`}>
                  {data.aiRecommendation}
                </h4>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-border font-mono text-[10px]">
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className="font-bold text-foreground">{data.aiConfidence}%</span>
                </div>
              </div>

              {/* reasoning summary */}
              <div className="p-4 bg-card border border-border rounded-xl space-y-2 shadow-sm">
                <h4 className="font-bold text-foreground flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 text-primary mr-1" />
                  AI Logic Reasoning
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  {data.reasoning}
                </p>
              </div>

              <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-2">
                <h5 className="font-bold">Algorithmic Safe Limits</h5>
                <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                  <div className="p-1.5 bg-card border border-border rounded">
                    <span className="text-muted-foreground">Stop Loss:</span>
                    <p className="font-bold text-rose-500 mt-0.5">₹{Math.round(data.support * 0.98)}</p>
                  </div>
                  <div className="p-1.5 bg-card border border-border rounded">
                    <span className="text-muted-foreground">Target limit:</span>
                    <p className="font-bold text-emerald-500 mt-0.5">₹{Math.round(data.resistance * 1.05)}</p>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-muted-foreground text-center pt-2">
                Last ticker evaluated: {new Date(data.lastUpdated).toLocaleTimeString()}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

function LoaderSpinner() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <Sparkles className="h-5 w-5 text-primary absolute animate-ping" />
    </div>
  );
}
