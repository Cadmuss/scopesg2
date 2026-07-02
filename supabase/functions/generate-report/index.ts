import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAnthropicReportText } from "../_shared/anthropic.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function webSearchResearch(apiKey: string, query: string): Promise<string> {
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
        content: query,
      }],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Web search error:", response.status, text);
    return "";
  }

  const result = await response.json();
  const textBlocks = (result.content ?? [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");

  return textBlocks;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return new Response(JSON.stringify({ error: "No orderId provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: fetchError } = await supabase
      .from("report_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.status !== "paid" && order.status !== "completed") {
      return new Response(JSON.stringify({ error: `Order not paid (status: ${order.status})` }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return cached report if it exists
    if (order.report_content) {
      return new Response(JSON.stringify({ report: order.report_content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract conversation
    const conversation = Array.isArray(order.consultation_data)
      ? order.consultation_data
      : JSON.parse(order.consultation_data || "[]");

    const conversationText = conversation
      .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n\n");

    // Extract business type from first user message
    const firstUserMsg = conversation.find((m: any) => m.role === "user");
    const businessContext = firstUserMsg?.content?.slice(0, 200) || "Singapore business";

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY")!;

    // --- STEP 1: Web Search for real competitor data ---
    console.log("Step 1: Running web search...");
    const searchQuery = `Search for the latest 2024-2025 information about:
1. Real companies and competitors in Singapore offering: ${businessContext}
2. Current pricing rates in Singapore for this type of service
3. Latest regulatory requirements in Singapore for this business (NEA, MOM, ACRA, etc)
4. Recent market trends and growth data for this sector in Singapore
5. Any recent news about this industry in Singapore

Provide specific company names, actual prices in SGD, and current regulations. Be specific and factual.`;

    const searchResults = await webSearchResearch(apiKey, searchQuery);
    console.log("Web search complete, length:", searchResults.length);

    const system = "You are an expert business analyst specialising in the Singapore market.";

    const disclaimer = `<div style="background:#fff8e6;border-left:4px solid #c9a84c;padding:15px 20px;margin:20px 0;font-size:0.85em;color:#856404;font-family:sans-serif;">
      <strong>⚠️ Disclaimer:</strong> This report incorporates real-time web search data current as of the report date. All regulatory information, competitor data, and market figures should be independently verified before making business decisions. This does not constitute professional legal, financial, or business advice.
    </div>`;

    // --- STEP 2: Part 1 generation with search context ---
    console.log("Step 2: Generating Part 1...");
    const part1Raw = await callAnthropicReportText({
      system,
      userMessage: `Based on this business consultation:

${conversationText}

AND this real-time market research data gathered from the web:

${searchResults || "No additional search data available — use your training knowledge."}

Generate the FIRST HALF of a premium competitive intelligence HTML report using the REAL competitor names, ACTUAL current prices in SGD, and LATEST regulatory information from the search data above.

Return a COMPLETE valid HTML document starting with <!DOCTYPE html> and including all CSS in a <style> tag in the <head>.

The document should include these sections only:
1. Header with business name, report date, and subtitle
2. Executive Summary (reference specific market data from search results)
3. Competitive Landscape (use REAL company names from search results, with actual pricing)
4. SWOT Analysis (4 points each, reference real market conditions)

CRITICAL: Keep CSS concise — use fewer custom classes if needed. The <style> tag MUST close properly, followed by </head><body> and all content sections, ending with </body></html>. A complete simple report beats an elaborate but cut-off one.

IMPORTANT:
- Use navy (#0a1628) and gold (#c9a84c) color theme
- End the document with </body></html>
- Do NOT include recommendations, KPIs or verdict yet
- Return ONLY raw HTML, no markdown, no code blocks
- Use SPECIFIC data from the search results — no vague statements`,
      maxTokens: 7000,
    });

    // --- STEP 3: Part 2 generation ---
    console.log("Step 3: Generating Part 2...");
    const part2Raw = await callAnthropicReportText({
      system,
      userMessage: `Based on this business consultation:

${conversationText}

AND this real-time market research:

${searchResults || "No additional search data available."}

Generate the SECOND HALF of a premium competitive intelligence HTML report.

Return ONLY the inner HTML sections (no <!DOCTYPE>, no <html>, no <head>, no <style> tags).

Include these sections:
1. Market Positioning Recommendations (6 recommendations, ordered strictly HIGH priority first, then MEDIUM, then LOW — do not mix priorities)
2. Key Performance Indicators — 90-Day Tracking Framework (table with specific SGD targets)
3. Star Ratings Legend (★ Weak to ★★★★★ Market Leader)
4. Verdict Strip — strong, specific conclusion referencing this exact business

IMPORTANT:
- Use navy (#0a1628) and gold (#c9a84c) color theme with inline styles
- Start directly with <div> or <section>
- End with </div> — no </body> or </html>
- Return ONLY raw HTML, no markdown, no code blocks
- Complete ALL sections fully, do not cut off
- Reference specific data points from the market research`,
      maxTokens: 3500,
    });

    // Clean and combine
    let cleanPart1 = part1Raw
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    cleanPart1 = cleanPart1
      .replace(/<\/body>\s*<\/html>\s*$/i, "")
      .trim();

    if (!cleanPart1.toLowerCase().startsWith("<!doctype")) {
      cleanPart1 = "<!DOCTYPE html>\n<html lang='en'>\n" + cleanPart1;
    }

    const cleanPart2 = part2Raw
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const fullReport = `${cleanPart1}
    
    ${disclaimer}
    
    ${cleanPart2}
    
    </body></html>`;

    await supabase
      .from("report_orders")
      .update({
        report_content: fullReport,
        status: "completed",
      })
      .eq("id", order.id);

    console.log("Report saved successfully");

    return new Response(JSON.stringify({ report: fullReport }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("ERROR:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});