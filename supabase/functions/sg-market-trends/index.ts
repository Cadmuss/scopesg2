import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAnthropicTool, anthropicErrorResponse } from "../_shared/anthropic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_HOURS = 24;

const MARKET_TRENDS_TOOL = {
  name: "return_market_trends",
  description: "Return Singapore market trends for entrepreneurs",
  input_schema: {
    type: "object",
    properties: {
      overview: {
        type: "string",
        description: "2-3 sentence summary of the current Singapore market landscape",
      },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            trend: { type: "string" },
            description: { type: "string" },
            sector: { type: "string" },
            opportunity: { type: "string" },
            threat: { type: "string" },
            timeframe: {
              type: "string",
              enum: ["immediate", "3-6 months", "6-12 months", "1-2 years"],
            },
            relevantGrants: {
              type: "array",
              items: { type: "string" },
            },
            actionableAdvice: { type: "string" },
            sources: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  title: { type: "string" },
                  url: { type: "string" },
                },
                required: ["name", "title", "url"],
              },
            },
          },
          required: ["trend", "description", "sector", "opportunity", "threat", "timeframe", "relevantGrants", "actionableAdvice", "sources"],
        },
      },
      generatedAt: { type: "string" },
    },
    required: ["overview", "items", "generatedAt"],
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

    let body: { sector?: string } = {};
    try { body = await req.json(); } catch { /* no body */ }
    const sector = (body.sector || "").trim().slice(0, 80);

    const queryKey = `sg-market-trends-v1:${sector.toLowerCase() || "general"}`;
    const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();

    // Return cached data if available
    if (!force) {
      const { data: cached } = await supabase
        .from("market_trends_cache")
        .select("data, created_at")
        .eq("query_key", queryKey)
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cached && cached.data?.items) {
        return new Response(JSON.stringify({ ...cached.data, cachedAt: cached.created_at, sector }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const today = new Date().toISOString().split("T")[0];
    const sectorLine = sector
      ? `Focus on how these trends affect a ${sector} business in Singapore.`
      : `Cover a broad range of sectors relevant to Singapore entrepreneurs.`;

    let trendsData: Record<string, unknown>;
    try {
      trendsData = await callAnthropicTool<Record<string, unknown>>({
        system: `You are a Singapore market strategist writing on ${today}. Be specific to Singapore — reference MAS, EnterpriseSG, IMDA policies. Include relevant Singapore grants. Keep responses concise.`,
        userMessage: `Give me exactly 4 important market trends Singapore entrepreneurs should know about right now. ${sectorLine}`,
        tool: MARKET_TRENDS_TOOL,
        maxTokens: 1500,
      });
      console.log("trendsData keys:", Object.keys(trendsData));
      console.log("items count:", Array.isArray(trendsData.items) ? trendsData.items.length : "not array");
    } catch (aiErr) {
      const status = (aiErr as Error & { status?: number }).status;
      if (status) return anthropicErrorResponse(status, corsHeaders);
      throw aiErr;
    }

    trendsData.sector = sector;

    // Cache the results
    await supabase.from("market_trends_cache").insert({ query_key: queryKey, data: trendsData });
    await supabase.from("market_trends_cache").delete().eq("query_key", queryKey).lt("created_at", cutoff);

    return new Response(JSON.stringify(trendsData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("sg-market-trends error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});