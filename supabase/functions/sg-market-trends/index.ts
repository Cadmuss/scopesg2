import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_HOURS = 24;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const queryKey = "sg-market-trends-v1";

    // Check cache
    const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();
    const { data: cached } = await supabase
      .from("market_trends_cache")
      .select("data")
      .eq("query_key", queryKey)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (cached) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Lovable AI with tool calling for structured output
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are a Singapore market intelligence analyst. The current date is ${new Date().toISOString().split('T')[0]}. Provide current, realistic market trend data for Singapore's key business sectors as of TODAY. Base your analysis on the latest real market conditions, government policies (like Smart Nation initiatives, Budget 2026), and the most recent economic data. All quarterly momentum data MUST use the most recent 4 quarters leading up to the current date. Be specific to Singapore's context.`,
          },
          {
            role: "user",
            content: `Analyze Singapore's current market trends as of today (${new Date().toISOString().split('T')[0]}) across these sectors: F&B, Fintech, E-commerce, Healthcare, Logistics, EdTech, CleanTech, and PropTech. Provide growth rates, saturation levels, risk scores, and quarterly momentum data for the most recent 4 quarters.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_market_trends",
              description: "Return structured Singapore market trend data for visualization",
              parameters: {
                type: "object",
                properties: {
                  sectors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Sector name" },
                        growthRate: { type: "number", description: "Projected annual growth rate %" },
                        saturation: { type: "number", description: "Market saturation level 0-100" },
                        riskScores: {
                          type: "object",
                          properties: {
                            regulatory: { type: "number", description: "Regulatory risk 0-10" },
                            financial: { type: "number", description: "Financial risk 0-10" },
                            operational: { type: "number", description: "Operational risk 0-10" },
                          },
                          required: ["regulatory", "financial", "operational"],
                        },
                        quarterlyMomentum: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              quarter: { type: "string", description: "e.g. Q1 2025" },
                              score: { type: "number", description: "Momentum score 0-100" },
                            },
                            required: ["quarter", "score"],
                          },
                          description: "Last 4 quarters of momentum data",
                        },
                      },
                      required: ["name", "growthRate", "saturation", "riskScores", "quarterlyMomentum"],
                    },
                  },
                  generatedAt: { type: "string", description: "ISO timestamp of generation" },
                  summary: { type: "string", description: "Brief 2-3 sentence market overview" },
                },
                required: ["sectors", "generatedAt", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_market_trends" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const trendData = JSON.parse(toolCall.function.arguments);

    // Cache the result
    await supabase.from("market_trends_cache").insert({
      query_key: queryKey,
      data: trendData,
    });

    // Clean old cache entries
    await supabase
      .from("market_trends_cache")
      .delete()
      .eq("query_key", queryKey)
      .lt("created_at", cutoff);

    return new Response(JSON.stringify(trendData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sg-market-trends error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
