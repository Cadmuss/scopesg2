import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Newspaper, RefreshCw, AlertCircle, ExternalLink, TrendingUp, TrendingDown, Minus, Filter, MessageSquare, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface NewsItem {
  headline: string;
  category: string;
  summary: string;
  predictedImpact: string;
  affectedSectors: string[];
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  severity: number;
  actionableAdvice: string;
  analystQuestions?: string[];
  sources: { name: string; title: string; url: string }[];
  publishedApprox: string;
}

interface NewsData {
  overview: string;
  items: NewsItem[];
  generatedAt: string;
  cachedAt?: string;
  sector?: string;
}

const CATEGORIES = ["All", "Geopolitics", "Policy", "Technology", "Supply Chain", "Finance", "Energy", "Consumer", "Healthcare", "Real Estate"];

const sentimentIcon = (s: NewsItem["sentiment"]) => {
  if (s === "positive") return <TrendingUp className="w-4 h-4" />;
  if (s === "negative") return <TrendingDown className="w-4 h-4" />;
  return <Minus className="w-4 h-4" />;
};

const sentimentClass = (s: NewsItem["sentiment"]) => {
  switch (s) {
    case "positive": return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "negative": return "bg-rose-500/15 text-rose-300 border-rose-500/30";
    case "mixed": return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    default: return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  }
};

const severityBar = (n: number) => {
  const pct = Math.min(100, (n / 5) * 100);
  const color = n >= 4 ? "bg-rose-500" : n >= 3 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="w-full h-1.5 bg-navy-light/30 rounded-full overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
};

const News = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [sector, setSector] = useState("");
  const [sectorInput, setSectorInput] = useState("");

  // Fetch profile to personalize
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("business_type")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.business_type) {
          setSector(data.business_type);
          setSectorInput(data.business_type);
        }
      });
  }, [user]);

  const load = async (refresh = false, sectorOverride?: string) => {
    setLoading(true);
    setError(null);
    const useSector = sectorOverride ?? sector;
    try {
      const baseUrl = "https://yvjtsimarksygwcizpcy.supabase.co/functions/v1/sg-market-news";
      const url = refresh ? `${baseUrl}?refresh=1` : baseUrl;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const { data: sessionRes } = await supabase.auth.getSession();
      const token = sessionRes.session?.access_token;
      if (refresh && !token) {
        throw new Error("Please sign in to force a refresh. Cached news updates automatically every 6 hours.");
      }
      if (refresh && token) headers.Authorization = `Bearer ${token}`;
      const r = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ sector: useSector }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to load news");
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load news");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(false, sector);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sector]);

  const askAnalyst = (item: NewsItem, question?: string) => {
    const sectorCtx = sector ? ` for my ${sector} business in Singapore` : "";
    const q = question
      ? `About this news — "${item.headline}" (${item.category}, ${item.publishedApprox}):\n\n${question}${sectorCtx}.`
      : `I want to dig into this news story${sectorCtx}.\n\n**Headline:** ${item.headline}\n**Category:** ${item.category}\n**Summary:** ${item.summary}\n**Predicted impact:** ${item.predictedImpact}\n\nGive me a deeper, Singapore-specific analysis: which sectors will move first, concrete numbers, what I should do in the next 30/60/90 days, and which government grants or schemes could offset the risk. Cite sources.`;
    navigate("/chat", { state: { initialPrompt: q } });
  };

  const items = (data?.items || []).filter(i => filter === "All" || i.category === filter);
  const updatedAt = data?.cachedAt || data?.generatedAt;

  return (
    <div className="min-h-screen bg-navy-deep">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Newspaper className="w-6 h-6 text-accent" />
                  <span className="text-accent text-sm uppercase tracking-wider font-semibold">Market Pulse</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-3">
                  News & Predicted Market Shifts
                </h1>
                <p className="text-primary-foreground/70 max-w-2xl">
                  AI-curated global and Singapore news from reputable sources, with predicted impact tailored to your sector. Auto-refreshed every 6 hours.
                </p>
                {updatedAt && (
                  <p className="text-primary-foreground/40 text-xs mt-2">
                    Last updated: {new Date(updatedAt).toLocaleString("en-SG")}
                    {data?.sector && <> · personalized for <span className="text-accent">{data.sector}</span></>}
                  </p>
                )}
              </div>
              <Button variant="gold" onClick={() => {
                if (!user) {
                  setError("Please sign in to force a refresh. Cached news updates automatically every 6 hours.");
                  return;
                }
                load(true);
              }} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </motion.div>

          {/* Sector personalization */}
          <Card className="bg-navy-light/20 border-accent/20 mb-6">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3 flex-wrap">
                <Sparkles className="w-4 h-4 text-accent shrink-0" />
                <span className="text-sm text-primary-foreground/80">Personalize for sector:</span>
                <Input
                  value={sectorInput}
                  onChange={(e) => setSectorInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && setSector(sectorInput.trim())}
                  placeholder="e.g. F&B, fintech, logistics, e-commerce"
                  className="max-w-xs bg-navy-deep/40 border-navy-light/40 text-primary-foreground"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSector(sectorInput.trim())}
                  disabled={loading || sectorInput.trim() === sector}
                >
                  Apply
                </Button>
                {sector && (
                  <button
                    onClick={() => { setSector(""); setSectorInput(""); }}
                    className="text-xs text-primary-foreground/50 hover:text-primary-foreground underline"
                  >
                    clear
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Overview */}
          {data?.overview && (
            <Card className="bg-navy-light/20 border-accent/20 mb-6">
              <CardContent className="pt-6">
                <p className="text-primary-foreground/80 leading-relaxed italic">{data.overview}</p>
              </CardContent>
            </Card>
          )}

          {/* Filter chips */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <Filter className="w-4 h-4 text-primary-foreground/60" />
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                  filter === c
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-navy-light/20 text-primary-foreground/70 border-navy-light/40 hover:border-accent/50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {error && (
            <Card className="bg-rose-500/10 border-rose-500/30 mb-6">
              <CardContent className="pt-6 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-300" />
                <p className="text-rose-200 text-sm">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* News grid */}
          {loading && !data ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 bg-navy-light/20" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="bg-navy-light/20 border-navy-light/40 hover:border-accent/40 transition-colors h-full flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="outline" className="text-accent border-accent/40 text-[10px]">
                          {item.category}
                        </Badge>
                        <Badge className={`${sentimentClass(item.sentiment)} text-[10px] gap-1 border`}>
                          {sentimentIcon(item.sentiment)}
                          {item.sentiment}
                        </Badge>
                      </div>
                      <CardTitle className="text-base text-primary-foreground leading-snug">
                        {item.headline}
                      </CardTitle>
                      <p className="text-xs text-primary-foreground/40 mt-1">{item.publishedApprox}</p>
                    </CardHeader>
                    <CardContent className="space-y-3 flex-1 flex flex-col">
                      <p className="text-sm text-primary-foreground/70 leading-relaxed">{item.summary}</p>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase tracking-wider text-primary-foreground/50">Severity</span>
                          <span className="text-xs text-primary-foreground/70">{item.severity}/5</span>
                        </div>
                        {severityBar(item.severity)}
                      </div>

                      <div className="border-l-2 border-accent/50 pl-3 py-1">
                        <p className="text-[10px] uppercase tracking-wider text-accent mb-1">
                          {sector ? `Impact on ${sector}` : "Predicted Market Shift"}
                        </p>
                        <p className="text-sm text-primary-foreground/80">{item.predictedImpact}</p>
                      </div>

                      <div className="bg-navy-deep/40 rounded p-3">
                        <p className="text-[10px] uppercase tracking-wider text-accent mb-1">
                          Action {sector ? `for your ${sector} business` : "for SG SMEs"}
                        </p>
                        <p className="text-sm text-primary-foreground/80">{item.actionableAdvice}</p>
                      </div>

                      {item.affectedSectors?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.affectedSectors.map(s => (
                            <Badge key={s} variant="outline" className="text-[10px] border-navy-light/50 text-primary-foreground/60">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Ask the analyst */}
                      <div className="pt-2 border-t border-navy-light/30 space-y-2">
                        <p className="text-[10px] uppercase tracking-wider text-accent flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Ask the analyst
                        </p>
                        {item.analystQuestions && item.analystQuestions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {item.analystQuestions.slice(0, 3).map((q, k) => (
                              <button
                                key={k}
                                onClick={() => askAnalyst(item, q)}
                                className="text-[11px] text-left px-2 py-1 rounded-md bg-accent/10 hover:bg-accent/20 text-primary-foreground/80 border border-accent/20 transition-colors"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-accent/40 text-accent hover:bg-accent/10 hover:text-accent"
                          onClick={() => askAnalyst(item)}
                        >
                          <MessageSquare className="w-3 h-3 mr-1.5" />
                          Open in analyst chat
                        </Button>
                      </div>

                      {item.sources?.length > 0 && (
                        <div className="pt-2 border-t border-navy-light/30 mt-auto">
                          <p className="text-[10px] uppercase tracking-wider text-primary-foreground/50 mb-1.5">Sources</p>
                          <ul className="space-y-1">
                            {item.sources.map((s, k) => (
                              <li key={k}>
                                <a
                                  href={s.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-accent hover:underline flex items-start gap-1 group"
                                >
                                  <ExternalLink className="w-3 h-3 mt-0.5 shrink-0" />
                                  <span><strong>{s.name}:</strong> {s.title}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          <p className="text-xs text-primary-foreground/40 mt-8 text-center max-w-2xl mx-auto">
            Disclaimer: AI-generated analysis based on reputable news sources. Predictions are not guarantees — always verify with primary sources and consult professionals before making business decisions.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default News;
