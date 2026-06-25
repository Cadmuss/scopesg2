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
    const { orderId, supplement } = await req.json();

    if (!orderId || !supplement?.trim()) {
      return new Response(JSON.stringify({ error: "Missing orderId or supplement" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the existing order
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

    if (order.status !== "paid") {
      return new Response(JSON.stringify({ error: "Order not paid" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the regeneration prompt
    const prompt = `You previously generated a competitive intelligence report for a Singapore business.

ORIGINAL BUSINESS TYPE: ${order.business_type}
ORIGINAL BUSINESS DETAILS: ${order.business_name} — ${order.report_prompt || ""}

The customer wants to enhance the report with additional information:
"${supplement}"

IMPORTANT GUARD: First, determine if the additional information is about the SAME business type (${order.business_type}). If the customer is clearly describing a completely different type of business, respond with ONLY this exact JSON on the first line:
{"error": "business_mismatch", "message": "The additional info appears to describe a different business. This top-up is locked to your original report for ${order.business_name}."}

If it IS about the same business, regenerate the FULL competitive intelligence report incorporating both the original details AND the new supplemental information. The report should be MORE detailed and comprehensive than the original thanks to the extra context.

${getReportTemplate(order.business_name, order.business_type)}`;

    const reportText = await callAnthropicReportText(prompt);

    // Check if Claude flagged a business mismatch
    const firstLine = reportText.split("\n")[0].trim();
    try {
      const parsed = JSON.parse(firstLine);
      if (parsed.error === "business_mismatch") {
        return new Response(JSON.stringify({ error: parsed.message }), {
          status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch {
      // Not JSON — that's fine, it's the report
    }

    // Strip markdown fences if present
    const cleanReport = reportText
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    // Save updated report
    const { error: updateError } = await supabase
      .from("report_orders")
      .update({
        report_content: cleanReport,
        user_supplement: supplement,
        regenerated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, report: cleanReport }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("regenerate-report error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getReportTemplate(businessName: string, businessType: string): string {
  return `Generate a complete, professional HTML competitive intelligence report (no markdown, pure HTML) with:
- Premium navy (#0a1628) and gold (#c9a84c) styling
- Executive summary
- Competitive landscape with real Singapore competitors (use web search)
- SWOT analysis
- Market positioning recommendations
- A star ratings legend (★ = Weak, ★★ = Below Average, ★★★ = Average, ★★★★ = Strong, ★★★★★ = Market Leader)
- Verdict strip at the bottom
- All data current as of today for Singapore market
Business: ${businessName} | Type: ${businessType}`;
}