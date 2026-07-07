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
      if (cached?.data?.items) {
        return new Response(JSON.stringify({ ...cached.data, cachedAt: cached.created_at, sector }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY")!;
    const today = new Date().toISOString().split("T")[0];
    const sectorLine = sector
      ? `Focus on how these news items affect a ${sector} business in Singapore.`
      : `Keep analysis broadly useful for Singapore SMEs.`;

    console.log("Calling Anthropic for news...");

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
        system: `You are a Singapore market intelligence analyst. Today is ${today}. Return ONLY valid JSON, no markdown, no explanation. The JSON must match this exact structure:
{
  "overview": "2-3 sentence market summary",
  "generatedAt": "${today}",
  "items": [
    {
      "headline": "news headline",
      "category": "Technology",
      "summary": "2 sentence summary",
      "predictedImpact": "specific impact on Singapore businesses",
      "affectedSectors": ["sector1", "sector2"],
      "sentiment": "positive",
      "severity": 3,
      "actionableAdvice": "one concrete action",
      "analystQuestions": ["question1", "question2", "question3"],
      "sources": [{"name": "CNA", "title": "article title", "url": "https://www.channelnewsasia.com"}],
      "publishedApprox": "${today}"
    }
  ]
}
Category must be one of: Geopolitics, Policy, Technology, Supply Chain, Finance, Energy, Consumer, Healthcare, Real Estate.
Sentiment must be one of: positive, negative, neutral, mixed.
Severity must be a number from 1 to 5.`,
messages: [{
  role: "user",
  content: `Give me 5 important news items affecting Singapore's business environment right now. ${sectorLine} 

IMPORTANT: Your response must be ONLY the JSON object. Start your response with { and end with }. No text before or after. No markdown. No explanation.`,
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

    let newsData;
try {
  let clean = text.trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error("No JSON object found");
  clean = clean.slice(start, end + 1);
  newsData = JSON.parse(clean);
} catch (e) {
  console.error("JSON parse error:", e, "Raw:", text.slice(0, 300));
  throw new Error("Failed to parse AI response as JSON");
}

    newsData.sector = sector;

    await supabase.from("market_news_cache").insert({ query_key: queryKey, data: newsData });
    await supabase.from("market_news_cache").delete().eq("query_key", queryKey).lt("created_at", cutoff);

    console.log("News saved to cache successfully");

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