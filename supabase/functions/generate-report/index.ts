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

    const system = "You are an expert business analyst specialising in the Singapore market. Return ONLY raw HTML. No markdown, no code blocks. First character must be < and last must be >.";

    // --- CALL 1: First half of report ---
    console.log("Generating part 1...");
    const part1 = await callAnthropicReportText({
      system,
      userMessage: `Based on this business consultation:

${conversationText}

Generate the FIRST HALF of a premium competitive intelligence report as raw HTML (no <!DOCTYPE> or <html> tags yet, just the inner sections). Include:

1. A full HTML <head> with all CSS styles (navy #0a1628 and gold #c9a84c theme)
2. A header section with business name and report date
3. Executive Summary section
4. Competitive Landscape section with 4-5 real Singapore competitors, star ratings table
5. SWOT Analysis section (4 points each)

End your response with </section> after the SWOT section. Do not close the body or html tags.`,
      maxTokens: 5000,
    });

    // --- CALL 2: Second half of report ---
    console.log("Generating part 2...");
    const part2 = await callAnthropicReportText({
      system,
      userMessage: `Based on this business consultation:

${conversationText}

Generate the SECOND HALF of a premium competitive intelligence report as raw HTML. Include:

1. Market Positioning Recommendations section (5-6 actionable recommendations)
2. Key Performance Indicators section with a data table
3. Star Ratings Legend section (★ Weak to ★★★★★ Market Leader)
4. A verdict strip div at the bottom with overall assessment
5. Close with </div></body></html>

Important: Start directly with <section> or <div>, no HTML head or opening tags.`,
      maxTokens: 5000,
    });

    // Combine both parts into a full HTML document
    let cleanPart1 = part1
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  
  // Ensure it starts with <!DOCTYPE html>
  if (!cleanPart1.startsWith("<!DOCTYPE") && !cleanPart1.startsWith("<html")) {
    cleanPart1 = "<!DOCTYPE html>\n<html lang='en'>\n" + cleanPart1;
  }

    const cleanPart2 = part2
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    // Add disclaimer
    const disclaimer = `<div style="background:#fff3cd;border-left:4px solid #ffc107;padding:15px 20px;margin:20px 0;font-size:0.85em;color:#856404;">
      <strong>⚠️ Disclaimer:</strong> This report is AI-generated for informational purposes only. All regulatory information, competitor data, and market figures should be independently verified. This does not constitute professional legal, financial, or business advice.
    </div>`;

    const fullReport = cleanPart1 + disclaimer + cleanPart2;

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