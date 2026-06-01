import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { anthropicErrorResponse, callAnthropicTool } from "../_shared/anthropic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_HOURS = 24;
const CACHE_KEY = "sg-market-trends-v1";

const TRENDS_TOOL = {
  name: "return_market_trends",
  description: "Return structured Singapore sector trend analysis",
  input_schema: {
    type: "object",
    properties: {
      summary: { type: "string", description: "2-3 sentence summary of the overall SG market trend landscape" },
      sectors: {
        type: "array",
        description: "6-8 key Singapore sectors",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Sector name e.g. Fintech, F&B, Logistics" },
            growthRate: { type: "number", description: "Projected annual growth rate %, can be negative" },
            saturation: { type: "number", description: "Market saturation 0-100" },
            riskScores: {
              type: "object",
              properties: {
                regulatory: { type: "number", description: "0-10" },
                financial: { type: "number", description: "0-10" },
                operational: { type: "number", description: "0-10" },
              },
              required: ["regulatory", "financial", "operational"],
            },
            quarterlyMomentum: {
              type: "array",
              description: "Last 4 quarters momentum scores",
              items: {
                type: "object",
                properties: {
                  quarter: { type: "string", description: "e.g. Q3 2025" },
                  score: { type: "number", description: "0-100" },
                },
                required: ["quarter", "score"],
              },
            },
          },
          required: ["name", "growthRate", "saturation", "riskScores", "quarterlyMomentum"],
        },
      },
      generatedAt: { type: "string" },
    },
    required: ["summary", "sectors", "generatedAt"],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const url = new URL(req.url);
    const force = url.searchParams.get("refresh") === "1";
    const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();

    if (!force) {
      const { data: cached } = await supabase
        .from("market_news_cache")
        .select("data, created_at")
        .eq("query_key", CACHE_KEY)
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cached && Array.isArray((cached.data as { sectors?: unknown[] })?.sectors)) {
        return new Response(JSON.stringify({ ...cached.data, cachedAt: cached.created_at }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const today = new Date().toISOString().split("T")[0];

    let trends: Record<string, unknown>;
    try {
      trends = await callAnthropicTool<Record<string, unknown>>({
        system: `You are a Singapore market intelligence analyst writing on ${today}. Produce sober, quantitative sector trend analysis for Singapore SMEs. Cover 6-8 sectors including Fintech, F&B, Logistics, E-commerce, Healthcare, Real Estate, Manufacturing, and Tourism. Use realistic numbers reflecting current SG market conditions.`,
        userMessage: `Return structured sector trend data for Singapore: growth rates (%), saturation (0-100), risk scores (regulatory/financial/operational each 0-10), and 4 quarters of momentum scores (0-100). Include a 2-3 sentence overall summary.`,
        tool: TRENDS_TOOL,
        maxTokens: 3000,
      });
    } catch (aiErr) {
      const status = (aiErr as Error & { status?: number }).status;
      if (status) return anthropicErrorResponse(status, corsHeaders);
      throw aiErr;
    }

    if (!Array.isArray((trends as { sectors?: unknown[] }).sectors) || (trends as { sectors: unknown[] }).sectors.length === 0) {
      throw new Error("AI returned no sectors");
    }

    await supabase.from("market_news_cache").insert({ query_key: CACHE_KEY, data: trends });
    await supabase.from("market_news_cache").delete().eq("query_key", CACHE_KEY).lt("created_at", cutoff);

    return new Response(JSON.stringify(trends), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sg-market-trends error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
