import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_HOURS = 24;

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

    // Return cached data if available and has items
    if (!force) {
      const { data: cached } = await supabase
        .from("market_trends_cache")
        .select("data, created_at")
        .eq("query_key", queryKey)
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cached?.data?.items) {
        return new Response(JSON.stringify({ ...cached.data, cachedAt: cached.created_at, sector }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY")!;
    const today = new Date().toISOString().split("T")[0];
    const sectorLine = sector
      ? `Focus on how these trends affect a ${sector} business in Singapore.`
      : `Cover a broad range of sectors relevant to Singapore entrepreneurs.`;

    console.log("Calling Anthropic...");

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        system: `You are a Singapore market strategist. Today is ${today}. Return ONLY valid JSON, no markdown, no explanation. The JSON must match this exact structure:
{
  "overview": "2-3 sentence market summary",
  "generatedAt": "${today}",
  "items": [
    {
      "trend": "trend title",
      "description": "2 sentence description",
      "sector": "sector name",
      "opportunity": "specific opportunity",
      "threat": "specific threat",
      "timeframe": "immediate",
      "relevantGrants": ["grant1", "grant2"],
      "actionableAdvice": "one concrete action",
      "sources": [{"name": "CNA", "title": "article title", "url": "https://www.channelnewsasia.com"}]
    }
  ]
}`,
        messages: [{
          role: "user",
          content: `Give me 4 important Singapore market trends for entrepreneurs right now. ${sectorLine} Return only the JSON, no other text.`,
        }],
      }),
    });

    console.log("Anthropic response status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error("Anthropic error:", text);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || "";
    console.log("Response length:", text.length);

    let trendsData;
    try {
      const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      trendsData = JSON.parse(clean);
    } catch (e) {
      console.error("JSON parse error:", e, "Raw:", text.slice(0, 200));
      throw new Error("Failed to parse AI response as JSON");
    }

    trendsData.sector = sector;

    // Cache the results
    await supabase.from("market_trends_cache").insert({ query_key: queryKey, data: trendsData });
    await supabase.from("market_trends_cache").delete().eq("query_key", queryKey).lt("created_at", cutoff);

    console.log("Saved to cache successfully");

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