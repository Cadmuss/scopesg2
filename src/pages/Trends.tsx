import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, RefreshCw, CircleAlert as AlertCircle, ExternalLink, Lightbulb, TriangleAlert as AlertTriangle, Target, Clock, Building2, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface TrendSource {
  name: string;
  title: string;
  url: string;
}

interface TrendItem {
  trend: string;
  description: string;
  sector: string;
  opportunity: string;
  threat: string;
  timeframe: string;
  relevantGrants: string[];
  actionableAdvice: string;
  sources: TrendSource[];
}

interface TrendsData {
  overview: string;
  items: TrendItem[];
  generatedAt: string;
  sector?: string;
  cachedAt?: string;
}

const TIMEFRAME_COLORS: Record<string, string> = {
  immediate: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
  "3-6 months": "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  "6-12 months": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  "1-2 years": "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
};

const TREND_COLORS = [
  "from-blue-500/10 via-blue-500/5 to-transparent",
  "from-emerald-500/10 via-emerald-500/5 to-transparent",
  "from-amber-500/10 via-amber-500/5 to-transparent",
  "from-purple-500/10 via-purple-500/5 to-transparent",
  "from-rose-500/10 via-rose-500/5 to-transparent",
  "from-cyan-500/10 via-cyan-500/5 to-transparent",
  "from-indigo-500/10 via-indigo-500/5 to-transparent",
  "from-teal-500/10 via-teal-500/5 to-transparent",
];

const Trends = () => {
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = force ? "?refresh=1" : "";
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        `sg-market-trends${url}`
      );
      if (fnError) throw fnError;
      if (fnData?.error) throw new Error(fnData.error);
      setData(fnData);
    } catch (e: any) {
      console.error("Failed to fetch trends:", e);
      setError(e.message || "Failed to load market trends. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("en-SG", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-20 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-navy to-navy-light shadow-lg">
                  <TrendingUp className="w-8 h-8 text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                    Singapore Market Trends
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    AI-powered insights for Singapore entrepreneurs
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => fetchTrends(true)}
                disabled={loading}
                className="gap-2 border-gold/30 hover:border-gold hover:bg-gold/10"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </motion.div>

          {/* Error State */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State - Skeleton */}
          {loading && !data && (
            <div className="space-y-6">
              {/* Overview Skeleton */}
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-4" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
              {/* Cards Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-8 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <AnimatePresence mode="wait">
            {data && !loading && (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Overview Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="border-gold/20 bg-gradient-to-br from-navy/5 via-gold/5 to-transparent shadow-md overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-gold/10 shrink-0">
                          <Sparkles className="w-5 h-5 text-gold" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-lg font-display font-semibold text-foreground mb-2">
                            Market Overview
                          </h2>
                          <p className="text-muted-foreground leading-relaxed">
                            {data.overview}
                          </p>
                          {data.sector && (
                            <Badge
                              variant="outline"
                              className="mt-3 border-navy/30 text-navy dark:text-gold"
                            >
                              <Building2 className="w-3 h-3 mr-1" />
                              {data.sector}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Last Updated */}
                {(data.generatedAt || data.cachedAt) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Clock className="w-4 h-4" />
                    <span>
                      Last updated: {formatDate(data.cachedAt || data.generatedAt)}
                    </span>
                  </motion.div>
                )}

                {/* Trends Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(data.items ?? []).map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * (index + 1) }}
                    >
                      <Card className="border-border/50 hover:border-gold/30 transition-all duration-300 hover:shadow-lg group relative overflow-hidden h-full">
                        {/* Gradient accent */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${TREND_COLORS[index % TREND_COLORS.length]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                        />

                        <div className="relative">
                          <CardHeader className="pb-3">
                            {/* Title */}
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="font-display font-semibold text-lg text-foreground leading-tight">
                                {item.trend}
                              </h3>
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge
                                variant="secondary"
                                className="bg-navy/10 text-navy dark:bg-navy/20 dark:text-gold border-0"
                              >
                                {item.sector}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={TIMEFRAME_COLORS[item.timeframe] || ""}
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {item.timeframe}
                              </Badge>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            {/* Description */}
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {item.description}
                            </p>

                            {/* Opportunity */}
                            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                              <div className="flex items-start gap-2">
                                <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1">
                                    Opportunity
                                  </p>
                                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                                    {item.opportunity}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Threat */}
                            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-medium text-rose-700 dark:text-rose-300 mb-1">
                                    Threat
                                  </p>
                                  <p className="text-sm text-rose-800 dark:text-rose-200">
                                    {item.threat}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Actionable Advice */}
                            <div className="p-3 rounded-lg bg-gradient-to-r from-gold/10 via-gold/5 to-transparent border border-gold/30">
                              <div className="flex items-start gap-2">
                                <Target className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-medium text-gold-dark dark:text-gold mb-1">
                                    Actionable Advice
                                  </p>
                                  <p className="text-sm text-foreground/90">
                                    {item.actionableAdvice}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Relevant Grants */}
                            {item.relevantGrants?.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  Relevant Grants
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {item.relevantGrants.map((grant, gIndex) => (
                                    <Badge
                                      key={gIndex}
                                      variant="outline"
                                      className="text-xs bg-background/50 border-border hover:border-gold transition-colors"
                                    >
                                      {grant}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Sources */}
                            {item.sources?.length > 0 && (
                              <div className="pt-3 border-t border-border/50">
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  Sources
                                </p>
                                <div className="space-y-1.5">
                                  {item.sources.map((source, sIndex) => (
                                    <a
                                      key={sIndex}
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition-colors group/link"
                                    >
                                      <ExternalLink className="w-3 h-3 group-hover/link:text-gold" />
                                      <span className="truncate">{source.name}</span>
                                      {source.title && (
                                        <>
                                          <span className="text-border">-</span>
                                          <span className="truncate text-foreground/70">
                                            {source.title}
                                          </span>
                                        </>
                                      )}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading overlay when refreshing */}
          {loading && data && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <Card className="border-gold/30">
                <CardContent className="p-6 flex items-center gap-4">
                  <RefreshCw className="w-6 h-6 text-gold animate-spin" />
                  <p className="text-foreground font-medium">
                    Refreshing market trends...
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Trends;
