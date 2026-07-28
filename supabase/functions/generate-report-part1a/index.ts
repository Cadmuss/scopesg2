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

    if (order.report_part1a) {
      return new Response(JSON.stringify({ part1aReady: true }), {
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

    console.log("Generating Part 1a (Header + Executive Summary)...");
    const raw = await callAnthropicReportText({
      system,
      userMessage: `Based on this business idea:

${conversationText}

AND this real-time market research data:

${searchResults || "No additional search data available — use your training knowledge."}

Generate ONLY the opening section of a premium competitive intelligence HTML report — nothing else.

Return a COMPLETE valid HTML document starting with <!DOCTYPE html>, with all CSS in a <style> tag in <head>.

Include ONLY:
1. Header with business name, report date, subtitle
2. Executive Summary with 4 key stats (market size, projected size, CAGR, number of competitors) and a short paragraph

IMPORTANT:
- Use navy (#0a1628) and gold (#c9a84c) color theme
- End the document with </body></html>
- Do NOT include competitive landscape, SWOT, recommendations, or anything else
- Return ONLY raw HTML, no markdown, no code blocks
- Be concise — this is only the opening section, keep it tight`,
      maxTokens: 2200,
    });

    let clean = raw
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim()
      .replace(/<\/body>\s*<\/html>\s*$/i, "")
      .trim();

    if (!clean.toLowerCase().startsWith("<!doctype")) {
      clean = "<!DOCTYPE html>\n<html lang='en'>\n" + clean;
    }

    await supabase.from("report_orders").update({ report_part1a: clean }).eq("id", order.id);

    console.log("Part 1a saved successfully");

    return new Response(JSON.stringify({ part1aReady: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("ERROR:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});