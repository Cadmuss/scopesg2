import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { businessContext } = await req.json();

    if (!businessContext) {
      return new Response(JSON.stringify({ error: "No businessContext provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY")!;

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: `Search for the latest 2025 information about:
1. Real companies and competitors in Singapore offering: ${businessContext}
2. Current pricing rates in Singapore for this type of service in SGD
3. Latest regulatory requirements in Singapore (NEA, MOM, ACRA, etc)
4. Recent market trends for this sector in Singapore

Provide specific company names, actual SGD prices, and current regulations. Be specific and factual.`,
        }],
        tools: [{ type: "web_search_20250305", name: "web_search" }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Web search error:", response.status, text);
      return new Response(JSON.stringify({ searchResults: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const searchResults = (result.content ?? [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");

    console.log("Search complete, length:", searchResults.length);

    return new Response(JSON.stringify({ searchResults }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("web-search error:", err.message);
    return new Response(JSON.stringify({ searchResults: "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});