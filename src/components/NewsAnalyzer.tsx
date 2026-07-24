import React, { useState, useEffect } from "react";
import { 
  Newspaper, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  Clock
} from "lucide-react";

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  link?: string;
  time: string;
  summary: string;
  sentiment?: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  sentimentScore?: number;
  
  aiEnriched?: boolean;
  aiSentiment?: "BULLISH" | "BEARISH" | "NEUTRAL";
  aiScore?: number;
  aiAnalysis?: string;
  aiKeyTriggers?: string[];
  aiMarketImpact?: "HIGH" | "MEDIUM" | "LOW";
  loadingAi?: boolean;
}

export default function NewsAnalyzer() {
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Custom news input states
  const [customTitle, setCustomTitle] = useState("");
  const [customSummary, setCustomSummary] = useState("");
  const [analyzingCustom, setAnalyzingCustom] = useState(false);
  const [customResult, setCustomResult] = useState<any | null>(null);

  // Active view filters
  const [sentimentFilter, setSentimentFilter] = useState<"ALL" | "BULLISH" | "BEARISH" | "NEUTRAL">("ALL");

  useEffect(() => {
    fetchLatestNews();
  }, []);

  const fetchLatestNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/news");
      if (!res.ok) {
        throw new Error("Failed to load live financial news feed.");
      }
      const data = await res.json();
      
      const formatted: NewsArticle[] = data.map((item: any, index: number) => ({
        id: item.id || `news-${index}`,
        title: item.title,
        source: item.source || "Google News",
        url: item.link || "#",
        time: item.publishedAt || new Date().toISOString(),
        summary: item.summary || item.description || item.title,
        sentiment: item.sentiment,
        sentimentScore: item.sentimentScore,
        aiSentiment: "NEUTRAL",
        aiScore: 0,
        aiEnriched: false,
        loadingAi: false
      }));
      
      setNewsList(formatted);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while fetching news.");
    } finally {
      setLoading(false);
    }
  };

  // Perform Groq AI Sentiment analysis on a specific article card
  const analyzeArticleSentiment = async (articleId: string) => {
    const article = newsList.find(n => n.id === articleId);
    if (!article) return;

    setNewsList(prev => prev.map(n => n.id === articleId ? { ...n, loadingAi: true } : n));

    try {
      const res = await fetch("/api/news/analyze-sentiment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": (await fetch("/api/auth/csrf-token", { credentials: "include" }).then(r => r.json())).csrfToken
        },
        body: JSON.stringify({
          title: article.title,
          summary: article.summary
        })
      });

      if (!res.ok) {
        throw new Error("Sentiment audit failed.");
      }

      const analysisResult = await res.json();

      setNewsList(prev => prev.map(n => n.id === articleId ? {
        ...n,
        aiEnriched: true,
        aiSentiment: analysisResult.sentiment,
        aiScore: analysisResult.score ?? analysisResult.sentimentScore ?? analysisResult.aiScore ?? 0,
        aiAnalysis: analysisResult.analysis || analysisResult.aiAnalysis || "AI sentiment analysis completed.",
        aiKeyTriggers: analysisResult.keyTriggers,
        aiMarketImpact: analysisResult.marketImpact,
        loadingAi: false
      } : n));

    } catch (err) {
      console.error(err);
      setNewsList(prev => prev.map(n => n.id === articleId ? { ...n, loadingAi: false } : n));
    }
  };

  // Analyze custom-inputted news
  const handleAnalyzeCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    setAnalyzingCustom(true);
    setCustomResult(null);

    try {
      const res = await fetch("/api/news/analyze-sentiment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": (await fetch("/api/auth/csrf-token", { credentials: "include" }).then(r => r.json())).csrfToken
        },
        body: JSON.stringify({
          title: customTitle,
          summary: customSummary
        })
      });

      if (!res.ok) {
        throw new Error("Unable to run sentiment audit on this news sample.");
      }

      const data = await res.json();
      setCustomResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Custom analysis failed.");
    } finally {
      setAnalyzingCustom(false);
    }
  };

  const getSentimentDetails = (sentiment: "BULLISH" | "BEARISH" | "NEUTRAL" | undefined) => {
    switch (sentiment) {
      case "BULLISH":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/20",
          text: "text-emerald-500",
          badge: "bg-emerald-500 text-white",
          icon: <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />,
          label: "Bullish / Positive"
        };
      case "BEARISH":
        return {
          bg: "bg-rose-500/10 border-rose-500/20",
          text: "text-rose-500",
          badge: "bg-rose-500 text-white",
          icon: <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />,
          label: "Bearish / Negative"
        };
      default:
        return {
          bg: "bg-slate-500/10 border-slate-500/20",
          text: "text-slate-500",
          badge: "bg-slate-500 text-white",
          icon: <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />,
          label: "Neutral / Stable"
        };
    }
  };

  const filteredNews = newsList.filter(item => {
    if (sentimentFilter === "ALL") return true;
    return item.aiSentiment === sentimentFilter;
  });

  return (
    <div id="ai-news-analyzer-workspace" className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-1 sm:px-0">
      {/* Header Info Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-border pb-4 sm:pb-5 gap-3 sm:gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-primary/10 text-primary px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-primary/25">
              Live NLP Classifier
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground mt-1.5 sm:mt-2 flex items-center">
            <Newspaper className="h-5 w-5 sm:h-6 sm:w-6 text-primary mr-2 shrink-0" />
            AI Market News Sentiment Analyzer
          </h1>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Track real-time IPO and stock market news updates. Our Groq-powered AI engine audits content semantics to determine market sentiments (Bullish, Bearish, or Neutral).
          </p>
        </div>

        <button
          onClick={fetchLatestNews}
          disabled={loading}
          className="flex items-center justify-center space-x-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-border transition-all cursor-pointer disabled:opacity-50 shrink-0 self-start md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Sync Live News Feed</span>
        </button>
      </div>

      {/* Custom News Sandbox */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h3 className="text-xs font-black text-foreground uppercase tracking-widest font-mono flex items-center">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary mr-1.5 shrink-0" />
            AI Custom News Sentiment Simulator
          </h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
            Test and evaluate the market impact of any news snippet, tweet, or rumors by submitting it to the Groq AI engine.
          </p>

          <form onSubmit={handleAnalyzeCustom} className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">News Headline / Title</label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. SEBI approves NTPC Green Energy massive listing date expansion"
                  className="w-full bg-muted/20 border border-border rounded-xl px-3 sm:px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Detailed Content (Optional)</label>
                <textarea
                  value={customSummary}
                  onChange={(e) => setCustomSummary(e.target.value)}
                  placeholder="Paste details about the market volume, analyst expectations, pricing premium, or direct corporate warnings here..."
                  className="w-full bg-muted/20 border border-border rounded-xl px-3 sm:px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-border pt-3 sm:pt-4 gap-2">
              <span className="text-[10px] text-muted-foreground">Powered by Groq Llama 3.3 Sentiment Engine</span>
              <button
                type="submit"
                disabled={analyzingCustom || !customTitle.trim()}
                className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {analyzingCustom ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                    <span>Analyzing Syntax...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    <span>Run AI Sentiment Audit</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Simulator Result Output card */}
          {customResult && (
            <div className={`mt-4 sm:mt-5 border rounded-xl p-3.5 sm:p-4 relative overflow-hidden transition-all ${
              getSentimentDetails(customResult.sentiment).bg
            }`}>
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[9px] uppercase font-mono tracking-wider font-bold block text-muted-foreground">AI ANALYSIS RESULT</span>
                  <h4 className="text-xs font-black text-foreground mt-1 flex items-center">
                    {getSentimentDetails(customResult.sentiment).icon}
                    <span className="ml-1.5">{getSentimentDetails(customResult.sentiment).label}</span>
                  </h4>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[9px] uppercase font-mono block text-muted-foreground">SENTIMENT SCORE</span>
                  <span className={`text-xs sm:text-sm font-black ${getSentimentDetails(customResult.sentiment).text}`}>
                    {customResult.score > 0 ? `+${customResult.score}` : customResult.score} / 100
                  </span>
                </div>
              </div>

              <p className="text-[10px] sm:text-[11px] text-foreground mt-2 leading-relaxed">
                {customResult.analysis || "AI sentiment analysis completed."}
              </p>

              {customResult.keyTriggers && customResult.keyTriggers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1 sm:gap-1.5 items-center">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase mr-1">Triggers:</span>
                  {customResult.keyTriggers.map((trig: string, idx: number) => (
                    <span key={idx} className="text-[9px] font-mono font-bold bg-foreground/5 border border-foreground/10 text-foreground px-1.5 sm:px-2 py-0.5 rounded">
                      {trig}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Live Articles Stream */}
      <div className="space-y-3 sm:space-y-4">
        {/* Stream Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 border-b border-border pb-2.5 sm:pb-3">
          <h3 className="text-xs font-black text-foreground uppercase tracking-widest font-mono">
            Live Financial News Stream
          </h3>
        </div>

        {loading && (
          <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center">
            <Loader2 className="h-7 w-7 sm:h-8 sm:w-8 text-primary animate-spin mx-auto mb-2 sm:mb-3" />
            <p className="text-xs text-muted-foreground font-semibold">Streaming financial disclosures from SEBI and global broker gateways...</p>
          </div>
        )}

        {error && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center text-xs text-destructive">
            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2" />
            <span>{error}</span>
          </div>
        )}

        {!loading && filteredNews.length === 0 && (
          <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center text-xs text-muted-foreground">
            <Newspaper className="h-7 w-7 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3 text-muted-foreground/50" />
            <p>No articles matching current sentiment filter active.</p>
          </div>
        )}

        {/* List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filteredNews.map((article) => {
            const visual = getSentimentDetails(article.aiSentiment);
            return (
              <div 
                key={article.id} 
                className="bg-card border border-border hover:border-primary/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between space-y-3 sm:space-y-4"
              >
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-muted-foreground">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 shrink-0" />
                      {new Date(article.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-bold text-primary truncate max-w-[120px] text-right">{article.source}</span>
                  </div>

                  <a
                    href={article.url || article.link || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-extrabold text-foreground leading-snug hover:text-primary transition-colors block cursor-pointer"
                  >
                    {article.title}
                  </a>
                  
                  {article.summary && article.summary.replace(/\s-\s[^-]+$/, "").trim() !== article.title.replace(/\s-\s[^-]+$/, "").trim() && (
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                      {article.summary.replace(/\s-\s[^-]+$/, "").length > 220
                        ? `${article.summary.replace(/\s-\s[^-]+$/, "").slice(0, 220)}...`
                        : article.summary.replace(/\s-\s[^-]+$/, "")}
                    </p>
                  )}
                </div>

                {/* Sentiment box */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                  {article.aiEnriched ? (
                    <div className="flex-1">
                      <div className="flex justify-between items-center text-[9px] sm:text-[10px] mb-1">
                        <span className={`font-black flex items-center ${visual.text}`}>
                          {visual.icon}
                          <span className="ml-1 uppercase">{article.aiSentiment}</span>
                        </span>
                        <span className="font-mono font-bold text-muted-foreground">
                          Score: {article.aiScore && article.aiScore > 0 ? `+${article.aiScore}` : article.aiScore}
                        </span>
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-normal bg-muted/30 p-2 rounded-lg border border-border/40">
                        {article.aiAnalysis || "AI sentiment analysis completed."}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-1">
                        <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md border ${visual.bg} ${visual.text}`}>
                          Heuristic: {article.aiSentiment}
                        </span>
                      </div>

                      <button
                        onClick={() => analyzeArticleSentiment(article.id)}
                        disabled={article.loadingAi}
                        className="text-[9px] sm:text-[10px] font-bold text-primary hover:text-primary/80 flex items-center space-x-1 bg-primary/5 px-2.5 py-1.5 rounded-lg border border-primary/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {article.loadingAi ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                            <span>Auditing...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 shrink-0" />
                            <span>Groq AI Audit</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}