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

    const system = "You are an expert business analyst specialising in the Singapore market.";

    const disclaimer = `<div style="background:#fff8e6;border-left:4px solid #c9a84c;padding:15px 20px;margin:20px 0;font-size:0.85em;color:#856404;font-family:sans-serif;">
      <strong>⚠️ Disclaimer:</strong> This report is AI-generated for informational purposes only. All regulatory information, competitor data, and market figures should be independently verified. This does not constitute professional legal, financial, or business advice.
    </div>`;

    // --- CALL 1: First half ---
    const part1Raw = await callAnthropicReportText({
      system,
      userMessage: `Based on this business consultation:
    
    ${conversationText}
    
    Generate the FIRST HALF of a premium competitive intelligence HTML report. 
    
    Return a COMPLETE valid HTML document starting with <!DOCTYPE html> and including all CSS in a <style> tag in the <head>.
    
    The document should include these sections only:
    1. Header with business name, report date, and subtitle
    2. Executive Summary
    3. Competitive Landscape (4-5 real Singapore competitors with star ratings table)
    4. SWOT Analysis (4 points each: Strengths, Weaknesses, Opportunities, Threats)
    
    CRITICAL: Keep CSS concise — use fewer custom classes if needed. The <style> tag MUST close properly, followed by </head><body> and all content sections, ending with </body></html>. A complete simple report beats an elaborate but cut-off one. Prioritise finishing the full document over visual complexity.
    
    IMPORTANT:
    - Use navy (#0a1628) and gold (#c9a84c) color theme
    - End the document with </body></html> 
    - Do NOT include recommendations, KPIs or verdict yet
    - Return ONLY raw HTML, no markdown, no code blocks`,
      maxTokens: 7000,
    });

    // --- CALL 2: Second half ---
    console.log("Generating part 2...");
    const part2Raw = await callAnthropicReportText({
      system,
      userMessage: `Based on this business consultation:

${conversationText}

Generate the SECOND HALF of a premium competitive intelligence HTML report.

Return ONLY the inner HTML sections (no <!DOCTYPE>, no <html>, no <head>, no <style> tags).

Include these sections:
1. Market Positioning Recommendations (6 recommendations, ordered strictly HIGH priority first, then MEDIUM, then LOW — do not mix)
2. Key Performance Indicators — 90-Day Tracking Framework (table with metrics)
3. Star Ratings Legend (★ Weak to ★★★★★ Market Leader)
4. Verdict Strip — overall assessment with strong conclusion

IMPORTANT:
- Use navy (#0a1628) and gold (#c9a84c) color theme inline styles
- Start directly with <div> or <section>
- End with </div> (no </body> or </html>)
- Return ONLY raw HTML, no markdown, no code blocks
- Complete ALL sections fully, do not cut off`,
      maxTokens: 7000,
    });

    // Clean part 1 — ensure valid HTML document
    let cleanPart1 = part1Raw
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    // Remove closing body/html from part1 so we can inject part2
    cleanPart1 = cleanPart1
      .replace(/<\/body>\s*<\/html>\s*$/i, "")
      .trim();

    // Ensure starts with <!DOCTYPE html>
    if (!cleanPart1.toLowerCase().startsWith("<!doctype")) {
      cleanPart1 = "<!DOCTYPE html>\n<html lang='en'>\n" + cleanPart1;
    }

    // Clean part 2
    const cleanPart2 = part2Raw
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    // Combine into full document
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