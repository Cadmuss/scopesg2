import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_HOURS = 6;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const url = new URL(req.url);
    const force = url.searchParams.get("refresh") === "1";
    const queryKey = "sg-market-news-v1";
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
        return new Response(JSON.stringify({ ...cached.data, cachedAt: cached.created_at }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const today = new Date().toISOString().split("T")[0];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a senior Singapore market intelligence analyst. Today is ${today}. Curate the most recent and impactful global and Singapore news events that could shift SME markets — wars/geopolitics, supply chain disruptions, commodity shocks, tech/AI shifts, MAS or government policy, sector trends. ONLY cite reputable sources (Reuters, Bloomberg, Channel News Asia, The Straits Times, Business Times SG, Financial Times, MAS, MTI, Enterprise Singapore, IMDA, gov.sg). Provide concrete, actionable predicted market impact for Singapore SMEs. Never fabricate URLs — only cite source names with realistic article titles if exact URLs are not known.`,
          },
          {
            role: "user",
            content: `Give me 6-8 of the most consequential news items right now affecting Singapore's business environment, with predicted market shifts for SMEs.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_market_news",
              description: "Return curated news with predicted SG market impact",
              parameters: {
                type: "object",
                properties: {
                  overview: { type: "string", description: "2-3 sentence summary of the current market climate for SG SMEs" },
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
                        predictedImpact: { type: "string", description: "Predicted impact on Singapore SMEs/sectors" },
                        affectedSectors: { type: "array", items: { type: "string" } },
                        sentiment: { type: "string", enum: ["positive", "negative", "neutral", "mixed"] },
                        severity: { type: "number", description: "1 (minor) to 5 (major)" },
                        actionableAdvice: { type: "string", description: "One concrete action a SG SME should consider" },
                        sources: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string", description: "Publisher name e.g. Reuters" },
                              title: { type: "string", description: "Article title" },
                              url: { type: "string", description: "URL if known, otherwise homepage of publisher" },
                            },
                            required: ["name", "title", "url"],
                          },
                        },
                        publishedApprox: { type: "string", description: "Approximate date e.g. 'This week', '2026-05-14'" },
                      },
                      required: ["headline", "category", "summary", "predictedImpact", "affectedSectors", "sentiment", "severity", "actionableAdvice", "sources", "publishedApprox"],
                    },
                  },
                  generatedAt: { type: "string" },
                },
                required: ["overview", "items", "generatedAt"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_market_news" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await aiRes.text();
      console.error("AI gateway error", aiRes.status, text);
      throw new Error("AI gateway error");
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned");
    const newsData = JSON.parse(toolCall.function.arguments);

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
