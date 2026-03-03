import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, RefreshCw, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend, ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface SectorData {
  name: string;
  growthRate: number;
  saturation: number;
  riskScores: { regulatory: number; financial: number; operational: number };
  quarterlyMomentum: { quarter: string; score: number }[];
}

interface TrendData {
  sectors: SectorData[];
  generatedAt: string;
  summary: string;
}

const SECTOR_COLORS = [
  "hsl(42, 92%, 55%)",   // gold
  "hsl(200, 80%, 55%)",  // blue
  "hsl(160, 70%, 45%)",  // teal
  "hsl(280, 60%, 55%)",  // purple
  "hsl(350, 70%, 55%)",  // rose
  "hsl(30, 85%, 55%)",   // orange
  "hsl(120, 50%, 45%)",  // green
  "hsl(220, 70%, 55%)",  // indigo
];

const Trends = () => {
  const [data, setData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("sg-market-trends");
      if (fnError) throw fnError;
      if (fnData?.error) throw new Error(fnData.error);
      setData(fnData);
    } catch (e: any) {
      console.error("Failed to fetch trends:", e);
      setError(e.message || "Failed to load trend data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrends(); }, []);

  // Prepare chart data
  const growthData = data?.sectors.map((s) => ({ name: s.name, growth: s.growthRate })) ?? [];
  const saturationData = data?.sectors.map((s) => ({ sector: s.name, saturation: s.saturation })) ?? [];
  const riskData = data?.sectors.map((s) => ({
    name: s.name,
    regulatory: s.riskScores.regulatory,
    financial: s.riskScores.financial,
    operational: s.riskScores.operational,
  })) ?? [];

  // Momentum: pivot to {quarter, sector1, sector2, ...}
  const quarters = data?.sectors[0]?.quarterlyMomentum.map((q) => q.quarter) ?? [];
  const momentumData = quarters.map((q) => {
    const row: Record<string, any> = { quarter: q };
    data?.sectors.forEach((s) => {
      const match = s.quarterlyMomentum.find((m) => m.quarter === q);
      row[s.name] = match?.score ?? 0;
    });
    return row;
  });

  const growthConfig = Object.fromEntries(
    (data?.sectors ?? []).map((s, i) => [s.name, { label: s.name, color: SECTOR_COLORS[i % SECTOR_COLORS.length] }])
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-20 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-accent" />
                  Singapore Market Trends
                </h1>
                <p className="text-muted-foreground mt-2 max-w-2xl">
                  AI-powered sector analysis with growth projections, saturation levels, and risk assessments for Singapore's key industries.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={fetchTrends}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
            {data?.summary && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 p-4 rounded-lg bg-accent/10 border border-accent/20"
              >
                <p className="text-sm text-foreground/80">{data.summary}</p>
                {data.generatedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Updated: {new Date(data.generatedAt).toLocaleDateString()}
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Error */}
          {error && (
            <div className="mb-8 p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Sector Growth Bar Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Sector Growth Projections</CardTitle>
                  <p className="text-sm text-muted-foreground">Projected annual growth rate by sector (%)</p>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ChartContainer config={{ growth: { label: "Growth %", color: "hsl(42, 92%, 55%)" } }} className="h-[300px]">
                      <BarChart data={growthData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" unit="%" />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="growth" fill="hsl(42, 92%, 55%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* 2. Market Saturation Radar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Market Saturation</CardTitle>
                  <p className="text-sm text-muted-foreground">Saturation level across sectors (0-100)</p>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ChartContainer config={{ saturation: { label: "Saturation", color: "hsl(200, 80%, 55%)" } }} className="h-[300px]">
                      <RadarChart data={saturationData} outerRadius="70%">
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="sector" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar
                          name="Saturation"
                          dataKey="saturation"
                          stroke="hsl(200, 80%, 55%)"
                          fill="hsl(200, 80%, 55%)"
                          fillOpacity={0.3}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </RadarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* 3. Risk Assessment */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Risk Assessment</CardTitle>
                  <p className="text-sm text-muted-foreground">Risk scores by category (0-10 scale)</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs" style={{ borderColor: "hsl(350, 70%, 55%)" }}>Regulatory</Badge>
                    <Badge variant="outline" className="text-xs" style={{ borderColor: "hsl(42, 92%, 55%)" }}>Financial</Badge>
                    <Badge variant="outline" className="text-xs" style={{ borderColor: "hsl(200, 80%, 55%)" }}>Operational</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ChartContainer
                      config={{
                        regulatory: { label: "Regulatory", color: "hsl(350, 70%, 55%)" },
                        financial: { label: "Financial", color: "hsl(42, 92%, 55%)" },
                        operational: { label: "Operational", color: "hsl(200, 80%, 55%)" },
                      }}
                      className="h-[300px]"
                    >
                      <BarChart data={riskData} margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 10]} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="regulatory" fill="hsl(350, 70%, 55%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="financial" fill="hsl(42, 92%, 55%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="operational" fill="hsl(200, 80%, 55%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* 4. Trend Over Time Line Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Sector Momentum</CardTitle>
                  <p className="text-sm text-muted-foreground">Quarterly momentum score by sector</p>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ChartContainer config={growthConfig} className="h-[300px]">
                      <LineChart data={momentumData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        {data?.sectors.map((s, i) => (
                          <Line
                            key={s.name}
                            type="monotone"
                            dataKey={s.name}
                            stroke={SECTOR_COLORS[i % SECTOR_COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        ))}
                      </LineChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Trends;
