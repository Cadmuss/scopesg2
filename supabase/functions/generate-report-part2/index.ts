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

    if (order.report_content) {
      return new Response(JSON.stringify({ report: order.report_content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!order.report_part1) {
      return new Response(JSON.stringify({ error: "Part 1 not generated yet" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const conversation = Array.isArray(order.consultation_data)
      ? order.consultation_data
      : JSON.parse(order.consultation_data || "[]");

    const conversationText = conversation
      .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n\n");

    const system = "You are an expert business analyst specialising in the Singapore market.";

    const disclaimer = `<div style="background:#fff8e6;border-left:4px solid #c9a84c;padding:15px 20px;margin:20px 0;font-size:0.85em;color:#856404;font-family:sans-serif;">
      <strong>⚠️ Disclaimer:</strong> This report incorporates real-time web search data current as of the report date. All regulatory information, competitor data, and market figures should be independently verified before making business decisions. This does not constitute professional legal, financial, or business advice.
    </div>`;

    console.log("Generating Part 2...");
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

    const cleanPart2 = part2Raw
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const fullReport = `${order.report_part1}
    
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