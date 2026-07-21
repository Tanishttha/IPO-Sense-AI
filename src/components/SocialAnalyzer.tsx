import React, { useState } from "react";
import { 
  Twitter, 
  Youtube, 
  MessageSquare, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  Share2,
  Users,
  MessageCircle,
  ThumbsUp,
  Award
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from "recharts";

interface SocialPost {
  id: string;
  platform: "twitter" | "reddit" | "youtube";
  author: string;
  handle: string;
  content: string;
  timestamp: string;
  metrics: { engagement: number; likes: number };
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  score: number;
  explanation: string;
}

interface PlatformStat {
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  score: number;
}

interface AnalysisResult {
  overallSentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  overallScore: number;
  consensusSummary: string;
  platformStats: {
    twitter: PlatformStat;
    reddit: PlatformStat;
    youtube: PlatformStat;
  };
  posts: SocialPost[];
}

export default function SocialAnalyzer() {
  const [keyword, setKeyword] = useState("NTPC Green Energy");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["twitter", "reddit", "youtube"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "twitter" | "reddit" | "youtube">("ALL");

  const togglePlatform = (p: string) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter(item => item !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/social/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim(),
          platforms: selectedPlatforms
        })
      });

      if (!res.ok) {
        throw new Error("Social stream analysis failed. Please try again.");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during semantic calculation.");
    } finally {
      setLoading(false);
    }
  };

  const getSentimentDetails = (sentiment: "BULLISH" | "BEARISH" | "NEUTRAL" | undefined) => {
    switch (sentiment) {
      case "BULLISH":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/20",
          text: "text-emerald-500",
          progressBg: "bg-emerald-500",
          icon: <TrendingUp className="h-4 w-4" />,
          label: "Bullish Consensus"
        };
      case "BEARISH":
        return {
          bg: "bg-rose-500/10 border-rose-500/20",
          text: "text-rose-500",
          progressBg: "bg-rose-500",
          icon: <TrendingDown className="h-4 w-4" />,
          label: "Bearish Consensus"
        };
      default:
        return {
          bg: "bg-slate-500/10 border-slate-500/20",
          text: "text-slate-400",
          progressBg: "bg-slate-400",
          icon: <Minus className="h-4 w-4" />,
          label: "Neutral Momentum"
        };
    }
  };

  const getPlatformIcon = (platform: "twitter" | "reddit" | "youtube") => {
    switch (platform) {
      case "twitter":
        return <Twitter className="h-4 w-4 text-sky-400" />;
      case "reddit":
        return <MessageSquare className="h-4 w-4 text-orange-500" />;
      case "youtube":
        return <Youtube className="h-4 w-4 text-red-500" />;
    }
  };

  // Prepare chart data if result exists
  const getChartData = () => {
    if (!result) return [];
    return [
      { name: "Twitter", Score: result.platformStats.twitter?.score || 0, color: "#38BDF8" },
      { name: "Reddit", Score: result.platformStats.reddit?.score || 0, color: "#F97316" },
      { name: "YouTube", Score: result.platformStats.youtube?.score || 0, color: "#EF4444" }
    ].filter(item => selectedPlatforms.includes(item.name.toLowerCase()));
  };

  const chartData = getChartData();
  const filteredPosts = result?.posts.filter(p => {
    if (activeTab === "ALL") return true;
    return p.platform === activeTab;
  }) || [];

  return (
    <div id="social-media-analyzer-workspace" className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="border-b border-border pb-5">
        <span className="text-xs font-bold uppercase tracking-widest bg-violet-500/10 text-violet-500 px-3 py-1 rounded-full border border-violet-500/20">
          NLP Sentiment Engine
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground mt-2 flex items-center">
          <Share2 className="h-6 w-6 text-violet-500 mr-2" />
          AI Social Media Analyzer
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Scan social networks and calculate retail investor consensus. Gemini analyzes public vocabulary on Twitter, Reddit, and YouTube to extract real-time emotional vectors.
        </p>
      </div>

      {/* Input Parameters panel */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <form onSubmit={handleAnalyze} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search Ticker */}
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                Analyze Ticker or Keyword
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. NTPC Green, Waaree Energies, Tata Tech"
                  className="w-full bg-muted/20 border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Platform Selectors */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                Target Platform Streams
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "twitter", label: "Twitter", icon: <Twitter className="h-3 w-3" /> },
                  { id: "reddit", label: "Reddit", icon: <MessageSquare className="h-3 w-3" /> },
                  { id: "youtube", label: "YouTube", icon: <Youtube className="h-3 w-3" /> }
                ].map(plat => {
                  const active = selectedPlatforms.includes(plat.id);
                  return (
                    <button
                      key={plat.id}
                      type="button"
                      onClick={() => togglePlatform(plat.id)}
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        active 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-muted/20 text-muted-foreground border-border hover:bg-muted/40"
                      }`}
                    >
                      {plat.icon}
                      <span>{plat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-[10px] text-muted-foreground flex items-center font-mono">
              <Sparkles className="h-3.5 w-3.5 text-violet-500 mr-1" />
              Calculates direct sentiment coefficients (-100 to +100)
            </span>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-xl flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Scanning Live Streams...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Execute AI Social Audit</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 flex items-center space-x-3 text-xs text-rose-500">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Analysis Results Display */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Main Score Cards & Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Consolidated Verdict */}
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-widest font-mono">
                  Calculated Consensus
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Consolidated sentiment index extracted across platforms.
                </p>

                <div className="mt-6 flex items-center space-x-4">
                  <div className={`p-4 rounded-2xl border ${getSentimentDetails(result.overallSentiment).bg}`}>
                    {getSentimentDetails(result.overallSentiment).icon}
                  </div>
                  <div>
                    <span className="text-2xl font-black text-foreground">
                      {result.overallScore > 0 ? `+${result.overallScore}` : result.overallScore}
                    </span>
                    <span className={`text-xs font-black block uppercase tracking-wide ${getSentimentDetails(result.overallSentiment).text}`}>
                      {result.overallSentiment}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-foreground mt-5 leading-relaxed bg-muted/20 border border-border/40 p-3.5 rounded-xl">
                  {result.consensusSummary}
                </p>
              </div>

              <div className="border-t border-border pt-4 mt-6 flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                <span>Total Channels: {selectedPlatforms.length}</span>
                <span className="flex items-center">
                  <Award className="h-3.5 w-3.5 text-violet-500 mr-1" />
                  Active Bias Rating
                </span>
              </div>
            </div>

            {/* Platform Comparison Chart */}
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-widest font-mono">
                  Sentiment Index by Channel
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Weighted channel sentiment values (Positive values denote bullish bias, negative denotes bearish).
                </p>

                <div className="h-[180px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#888" }} />
                      <YAxis domain={[-100, 100]} tick={{ fontSize: 10, fill: "#888" }} />
                      <Tooltip 
                        contentStyle={{ background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px" }}
                        labelStyle={{ color: "#fff", fontWeight: "bold", fontSize: "10px" }}
                        itemStyle={{ color: "#a78bfa", fontSize: "11px" }}
                      />
                      <Bar dataKey="Score" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick platform badges */}
              <div className="grid grid-cols-3 gap-2 border-t border-border pt-4 text-center mt-3">
                {Object.entries(result.platformStats).map(([key, stat]) => {
                  if (!selectedPlatforms.includes(key)) return null;
                  const platformStat = stat as any;
                  const details = getSentimentDetails(platformStat.sentiment);
                  return (
                    <div key={key} className="p-2 bg-muted/10 border border-border/40 rounded-xl">
                      <span className="text-[9px] uppercase text-muted-foreground block font-mono">{key}</span>
                      <span className={`text-xs font-bold ${details.text}`}>
                        {platformStat.score > 0 ? `+${platformStat.score}` : platformStat.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Social Posts Stream */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-widest font-mono flex items-center">
                <Users className="h-4 w-4 mr-2 text-primary" />
                Raw Semantic Stream Feed
              </h3>

              {/* Feed tabs */}
              <div className="flex bg-muted/40 p-1 rounded-xl border border-border text-xs self-start">
                {(["ALL", "twitter", "reddit", "youtube"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      activeTab === tab
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "ALL" ? "All Channels" : tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPosts.map((post) => {
                const details = getSentimentDetails(post.sentiment);
                return (
                  <div 
                    key={post.id} 
                    className="bg-card border border-border hover:border-primary/20 rounded-2xl p-5 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="p-1.5 bg-muted/30 border border-border rounded-lg">
                            {getPlatformIcon(post.platform)}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-foreground block">{post.author}</span>
                            <span className="text-[10px] text-muted-foreground block">{post.handle}</span>
                          </div>
                        </div>

                        <span className="text-[9px] font-mono text-muted-foreground">
                          {post.timestamp}
                        </span>
                      </div>

                      <p className="text-[11px] text-foreground leading-relaxed italic bg-muted/20 p-3 rounded-xl border border-border/30">
                        "{post.content}"
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-[10px] font-mono text-muted-foreground">
                        <span className="flex items-center">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {post.metrics.likes.toLocaleString()}
                        </span>
                        <span>•</span>
                        <span>Engagement: {post.metrics.engagement.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${details.bg} ${details.text}`}>
                          Score: {post.score > 0 ? `+${post.score}` : post.score}
                        </span>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="text-[10px] text-muted-foreground bg-muted/10 p-2 rounded-lg border border-border/20 flex items-start space-x-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-violet-500 shrink-0 mt-0.5" />
                      <span>{post.explanation}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Initial Landing State */}
      {!result && !loading && (
        <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-xl mx-auto">
          <div className="inline-flex bg-violet-500/10 p-4 rounded-full text-violet-500 mb-4 border border-violet-500/20">
            <Sparkles className="h-8 w-8 animate-pulse" />
          </div>
          <h3 className="text-sm font-black text-foreground">Launch Public Sentiment Audit</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Specify a stock name or IPO ticker, check your preferred social platform feeds, and click "Execute AI Social Audit" to see live sentiment modeling.
          </p>
        </div>
      )}
    </div>
  );
}
