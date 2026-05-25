import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { anthropicErrorResponse, callAnthropicTool } from "../_shared/anthropic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_HOURS = 6;

const MARKET_NEWS_TOOL = {
  name: "return_market_news",
  description: "Return curated news with predicted SG market impact",
  input_schema: {
    type: "object",
    properties: {
      overview: { type: "string", description: "2-3 sentence summary of the current market climate, personalized to the user's sector if given" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            headline: { type: "string" },
            category: {
              type: "string",
              enum: ["Geopolitics", "Policy", "Technology", "Supply Chain", "Finance", "Energy", "Consumer", "Healthcare", "Real Estate"],
            },
            summary: { type: "string", description: "2-3 sentence neutral summary of what happened" },
            predictedImpact: { type: "string", description: "Predicted impact, personalized to the user's sector when provided" },
            affectedSectors: { type: "array", items: { type: "string" } },
            sentiment: { type: "string", enum: ["positive", "negative", "neutral", "mixed"] },
            severity: { type: "number", description: "1 (minor) to 5 (major)" },
            actionableAdvice: { type: "string", description: "One concrete sector-specific action the SG SME should consider" },
            analystQuestions: {
              type: "array",
              description: "3 sharp follow-up questions the user could ask the analyst about this story",
              items: { type: "string" },
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
            publishedApprox: { type: "string" },
          },
          required: ["headline", "category", "summary", "predictedImpact", "affectedSectors", "sentiment", "severity", "actionableAdvice", "analystQuestions", "sources", "publishedApprox"],
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

    // Force-refresh bypasses cache and triggers an expensive AI call.
    // Require a valid authenticated user to prevent anonymous credit-burn abuse.
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
        });
      }
    }

    let body: { sector?: string } = {};
    try { body = await req.json(); } catch { /* no body */ }
    const sector = (body.sector || "").trim().slice(0, 80);

    const queryKey = `sg-market-news-v2:${sector.toLowerCase() || "general"}`;
    const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();

    if (!force) {
      const { data: cached } = await supabase
        .from("market_news_cache")
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
      ? `The user runs a Singapore business in this sector: "${sector}". PERSONALIZE every item's predictedImpact and actionableAdvice for this sector specifically — use sector-relevant numbers, supply chains, customer behavior, regulators, and grants.`
      : `The user has not specified a sector — keep analysis broadly useful for SG SMEs.`;

    let newsData: Record<string, unknown>;
    try {
      newsData = await callAnthropicTool<Record<string, unknown>>({
        system: `You are a senior Singapore market intelligence analyst writing on ${today}. Your job is to surface the genuinely most consequential CURRENT events that are shifting markets right now — wars, geopolitical conflicts, commodity/oil shocks, central bank moves, supply chain disruptions, tech/AI breakthroughs, MAS/MTI/IMDA policy changes, sector-specific shifts.

CRITICAL RULES:
- Be CURRENT. If there is an active war, major conflict (e.g. US–Iran, Russia–Ukraine, Middle East escalation), trade war, election shock, oil/shipping disruption, AI policy shift — these MUST appear. Do not return only soft policy news while major disruptors are happening.
- COVERAGE: across the 10-12 items, include BOTH global disruptors AND Singapore-specific items. Cover Energy, Geopolitics, Supply Chain, Finance, Technology, Policy at minimum — do NOT leave Energy empty when oil/gas markets are moving.
- Only cite reputable sources: Reuters, Bloomberg, Channel News Asia, The Straits Times, Business Times SG, Financial Times, AP, BBC, MAS, MTI, Enterprise Singapore, IMDA, gov.sg.
- Never fabricate URLs. If unsure, use the publisher's section URL (e.g. https://www.reuters.com/world/) with a realistic article title.
- Predictions must be concrete and quantified where possible (% moves, S$ impact, weeks of lead time).

${sectorLine}`,
        userMessage: `Give me 10-12 of the most consequential news items right now affecting Singapore's business environment. Make sure active conflicts and energy/oil shocks are represented if they exist today. Personalize predicted market shifts ${sector ? `for a Singapore ${sector} business` : "for SG SMEs broadly"}.`,
        tool: MARKET_NEWS_TOOL,
        maxTokens: 4096,
      });
    } catch (aiErr) {
      const status = (aiErr as Error & { status?: number }).status;
      if (status) return anthropicErrorResponse(status, corsHeaders);
      throw aiErr;
    }
    newsData.sector = sector;

    await supabase.from("market_news_cache").insert({ query_key: queryKey, data: newsData });
    await supabase.from("market_news_cache").delete().eq("query_key", queryKey).lt("created_at", cutoff);

    return new Response(JSON.stringify(newsData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sg-market-news error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
