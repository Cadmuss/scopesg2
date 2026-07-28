import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAnthropicReportText } from "../_shared/anthropic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { orderId, searchResults = "" } = body;

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

    if (order.report_content) {
      return new Response(JSON.stringify({ done: true, report: order.report_content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.report_part1) {
      return new Response(JSON.stringify({ part1Ready: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const conversation = Array.isArray(order.consultation_data)
      ? order.consultation_data
      : JSON.parse(order.consultation_data || "[]");

      const conversationText = conversation
      .filter((msg: any) => msg.role === "user")
      .map((msg: any) => msg.content)
      .join("\n\n");

    const system = "You are an expert business analyst specialising in the Singapore market.";

    console.log("Generating Part 1...");
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

    await supabase
      .from("report_orders")
      .update({ report_part1: cleanPart1 })
      .eq("id", order.id);

    console.log("Part 1 saved successfully");

    return new Response(JSON.stringify({ part1Ready: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("ERROR:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});