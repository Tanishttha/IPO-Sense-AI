import React, { useState, useEffect } from "react";
import { Search, Image, Loader2, Cpu } from "lucide-react";

export default function ListingDayAI() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

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

  const filtered = companies.filter(c => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (c.companyName || "").toLowerCase().includes(q) || (c.symbol || "").toLowerCase().includes(q);
  });

  const analyze = async () => {
    if (!selected) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/listing-day/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: selected.symbol })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      <div>
        <h2 className="text-2xl font-bold">Listing Day AI</h2>
        <p className="text-sm text-muted-foreground">Select a company and click Analyze to get an AI estimate or actual listing summary.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search company or symbol" className="w-full bg-transparent outline-none text-sm" />
          </div>

          <div className="max-h-72 overflow-auto space-y-2">
            {filtered.map(c => (
              <button key={c.symbol} onClick={() => setSelected(c)} className={`w-full text-left p-2 rounded hover:bg-muted ${selected?.symbol === c.symbol ? 'bg-primary/10 border border-primary' : ''}`}>
                <div className="flex items-center space-x-3">
                  {c.logoUrl ? <img src={c.logoUrl} alt="logo" className="h-7 w-7 rounded-md object-cover" /> : <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center"><Image className="h-4 w-4 text-muted-foreground" /></div>}
                  <div className="flex-1">
                    <div className="text-sm font-bold">{c.companyName}</div>
                    <div className="text-[11px] text-muted-foreground">{c.symbol}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg">{selected ? selected.companyName : 'No company selected'}</h3>
              <div className="text-xs text-muted-foreground">{selected ? selected.symbol : 'Please pick a company from the list'}</div>
            </div>
            <div>
              <button disabled={!selected || loading} onClick={analyze} className={`px-4 py-2 rounded bg-primary text-primary-foreground font-bold ${!selected || loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Analyze'}
              </button>
            </div>
          </div>

          <div>
            {!result && !loading && (
              <div className="text-sm text-muted-foreground">No analysis yet. Select a company and click Analyze.</div>
            )}

            {loading && (
              <div className="py-10 flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-xs text-muted-foreground mt-2">Analyzing — this may take a few seconds</div>
              </div>
            )}

            {result && result.status === 'listed' && (
              <div className="space-y-3">
                <h4 className="font-bold">Actual Listing</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>Listing Price</div><div className="font-mono">₹{result.listingPrice}</div>
                  <div>Listing Return</div><div className="font-mono">{result.listingReturn}%</div>
                  <div>Issue Price</div><div className="font-mono">₹{result.issuePrice}</div>
                  <div>Subscription</div><div className="font-mono">{result.subscription}x</div>
                </div>
                <div className="pt-3 text-sm">
                  <strong className="block mb-1">AI Summary</strong>
                  <p className="text-muted-foreground">{result.summary}</p>
                </div>
              </div>
            )}

            {result && result.status === 'predicted' && (
              <div className="space-y-3">
                <h4 className="font-bold">AI Estimate</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>Estimated Listing Price</div><div className="font-mono">₹{result.estimatedListingPrice}</div>
                  <div>Expected Return</div><div className="font-mono">{result.expectedReturn}%</div>
                  <div>Confidence</div><div className="font-mono">{result.confidence}</div>
                  <div>Subscription</div><div className="font-mono">{result.subscription}x</div>
                </div>
                <div className="pt-3 text-sm">
                  <strong className="block mb-1">AI Summary</strong>
                  <p className="text-muted-foreground">{result.summary}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
