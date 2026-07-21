import React, { useState } from "react";
import { 
  BarChart2, 
  Cpu, 
  TrendingUp, 
  Search, 
  ArrowUpRight, 
  Sparkles, 
  BookOpen, 
  ChevronRight, 
  Loader2,
  FileText,
  BadgeAlert
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface ResearchHubProps {
  ipos: any[];
}

export default function ResearchHub({ ipos }: ResearchHubProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(ipos[0]?.symbol || "ZOMATO");
  const [reportPrompt, setReportPrompt] = useState("Generate an in-depth macro valuation analysis and listing day projection.");
  const [drafting, setDrafting] = useState(false);
  const [reportDraft, setReportDraft] = useState<string | null>(null);

  // Industry concentrations for research stats
  const industryData = [
    { name: "Fintech", value: 3 },
    { name: "SaaS", value: 2 },
    { name: "E-Commerce", value: 4 },
    { name: "Deep Tech", value: 2 },
    { name: "Green Energy", value: 3 },
  ];

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

  const gmpTrendData = ipos.slice(0, 5).map(ipo => ({
    name: ipo.symbol,
    gmp: ipo.gmp || 0,
    gmpPercent: ipo.gmpPercent || 0,
    subscription: ipo.subscriptionOverall || 1.2
  }));

  const handleGenerateResearchReport = async () => {
    setDrafting(true);
    setReportDraft(null);

    try {
      const res = await fetch("/api/groq/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: selectedSymbol,
          prompt: reportPrompt
        })
      });

      if (!res.ok) throw new Error("Drafting engine failed");
      const data = await res.json();
      setReportDraft(data.text || data.report || data.analysis || "Analysis completed successfully.");
    } catch (err) {
      console.error(err);
      setReportDraft("Failed to generate custom research draft from the Groq Llama 3 models. Please verify API key settings.");
    } finally {
      setDrafting(false);
    }
  };

  return (
    <div className="space-y-6" id="research-hub-root">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[10px] font-semibold uppercase tracking-wider">
            <TrendingUp className="h-3 w-3 mr-1" /> Research Hub Active
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Analyst Workstation</h2>
          <p className="text-sm text-gray-400">Perform deep-dive valuations, run peer analyses, and generate formal research briefings with Groq Llama 3.</p>
        </div>
      </div>

      {/* Grid Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Core Stats and Concentration */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Pie Chart: Industry Concentration */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-200">Industry Concentrations</h3>
            <div className="h-[200px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={industryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {industryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }}
                    itemStyle={{ color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {industryData.map((ind, i) => (
                <div key={ind.name} className="flex items-center space-x-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-gray-400 truncate">{ind.name} ({ind.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-200">Sector Benchmarks</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2.5 bg-muted rounded-xl">
                <div>
                  <div className="text-[10px] uppercase font-mono text-gray-500">Avg PE Ratio</div>
                  <div className="text-sm font-bold text-white">42.8x</div>
                </div>
                <div className="text-xs text-red-400 font-semibold">-2.4% MoM</div>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-muted rounded-xl">
                <div>
                  <div className="text-[10px] uppercase font-mono text-gray-500">Average GMP Premium</div>
                  <div className="text-sm font-bold text-white">41.6%</div>
                </div>
                <div className="text-xs text-emerald-400 font-semibold">+8.9% MoM</div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Col: Progression Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-gray-200">GMP Premium vs Subscriber Demand</h3>
                <p className="text-xs text-gray-400">Co-relating GMP premiums with overall book-building ratios.</p>
              </div>
              <BarChart2 className="h-4 w-4 text-emerald-400" />
            </div>
            
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gmpTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="gmpPercent" name="GMP Gain %" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="subscription" name="Subscription (x)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* Report Generator Engine */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center space-x-2">
          <Cpu className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">Groq AI Peer & Valuation Briefing Engine</h3>
        </div>
        <p className="text-xs text-gray-400">Select an active catalog asset, specify your analyst briefing directions, and draft a structured professional review instantly.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 block">Select Target IPO</label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {ipos.map(ipo => (
                <option key={ipo.id} value={ipo.symbol}>
                  {ipo.symbol} - {ipo.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 block">Analyst Directives / Focus areas</label>
            <input
              type="text"
              value={reportPrompt}
              onChange={(e) => setReportPrompt(e.target.value)}
              placeholder="e.g., Focus on debt consolidation, listing premium and competitive margins"
              className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <button
          onClick={handleGenerateResearchReport}
          disabled={drafting || !selectedSymbol}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
        >
          {drafting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Drafting Comprehensive Valuations...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Generate Llama 3 Briefing Report</span>
            </>
          )}
        </button>

        {reportDraft && (
          <div className="mt-6 bg-[#0f172a] border border-border rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-gray-200 uppercase tracking-wide">
                  IPOSENSE AI RESEARCH BRIEF: {selectedSymbol}
                </span>
              </div>
              <span className="text-[10px] font-mono text-gray-400">Draft version 1.0</span>
            </div>

            <div className="text-xs leading-relaxed text-gray-300 whitespace-pre-line font-mono max-h-[400px] overflow-y-auto pr-2">
              {reportDraft}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
