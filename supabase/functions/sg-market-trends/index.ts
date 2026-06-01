import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
<<<<<<< HEAD
import { anthropicErrorResponse, callAnthropicTool } from "../_shared/anthropic.ts";
=======
import { callAnthropicTool, anthropicErrorResponse } from "../_shared/anthropic.ts";
>>>>>>> f667d9f (fix profiles table reference)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

<<<<<<< HEAD
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
=======
const CACHE_TTL_HOURS = 24; //once a day

const MARKET_TRENDS_TOOL = {
  name: "return_market_trends",
  description: "Return Singapore market trends for entrepreneurs",
  input_schema: {
    type: "object",
    properties: {
      overview: {
        type: "string",
        description: "2-3 sentence summary of the current Singapore market landscape for entrepreneurs",
      },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            trend: { type: "string", description: "Short trend title" },
            description: { type: "string", description: "2-3 sentence description of the trend" },
            sector: { type: "string", description: "Primary sector affected" },
            opportunity: { type: "string", description: "Specific business opportunity this creates for SG entrepreneurs" },
            threat: { type: "string", description: "Specific threat or risk this poses" },
            timeframe: {
              type: "string",
              enum: ["immediate", "3-6 months", "6-12 months", "1-2 years"],
            },
            relevantGrants: {
              type: "array",
              items: { type: "string" },
              description: "Singapore grants relevant to this trend",
            },
            actionableAdvice: {
              type: "string",
              description: "One concrete action a Singapore entrepreneur should take now",
            },
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
>>>>>>> f667d9f (fix profiles table reference)
        },
      },
      generatedAt: { type: "string" },
    },
<<<<<<< HEAD
    required: ["summary", "sectors", "generatedAt"],
=======
    required: ["overview", "items", "generatedAt"],
>>>>>>> f667d9f (fix profiles table reference)
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
<<<<<<< HEAD
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
=======

    // Require auth for force refresh to prevent credit abuse
    if (force) {
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
      if (!token || token === anonKey) {
        return new Response(JSON.stringify({ error: "Authentication required to force-refresh." }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const authClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        anonKey,
        { global: { headers: { Authorization: `Bearer ${token}` } } },
      );
      const { data: userData, error: userErr } = await authClient.auth.getUser(token);
      if (userErr || !userData?.user) {
        return new Response(JSON.stringify({ error: "Invalid or expired session." }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
>>>>>>> f667d9f (fix profiles table reference)
        });
      }
    }

<<<<<<< HEAD
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
=======
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
      if (cached) {
        return new Response(JSON.stringify({ ...cached.data, cachedAt: cached.created_at, sector }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const today = new Date().toISOString().split("T")[0];
    const sectorLine = sector
      ? `The user runs a Singapore business in: "${sector}". Personalize every trend's opportunity, threat, and actionableAdvice specifically for this sector.`
      : `Keep analysis broadly useful for Singapore entrepreneurs across all sectors.`;

    let trendsData: Record<string, unknown>;
    try {
      trendsData = await callAnthropicTool<Record<string, unknown>>({
        system: `You are a senior Singapore market strategist writing on ${today}. Identify the most impactful emerging trends for Singapore entrepreneurs right now — covering technology adoption, consumer behavior shifts, regulatory changes, funding environment, talent market, and sector-specific disruptions.

RULES:
- Be specific to Singapore's context — reference MAS, MTI, EnterpriseSG, IMDA, URA policies where relevant
- Include relevant Singapore government grants for each trend
- Cite only reputable sources: CNA, Straits Times, Business Times, EnterpriseSG, MAS, MTI, Reuters, Bloomberg
- Never fabricate URLs
- Opportunities and threats must be concrete and actionable, not generic

${sectorLine}`,
        userMessage: `Give me 8-10 of the most important market trends Singapore entrepreneurs should know about right now. ${sector ? `Focus on how these affect a ${sector} business in Singapore.` : "Cover a broad range of sectors."}`,
        tool: MARKET_TRENDS_TOOL,
        maxTokens: 2048,
      });
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

>>>>>>> f667d9f (fix profiles table reference)
  } catch (e) {
    console.error("sg-market-trends error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
