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
      return new Response(JSON.stringify({ error: "Order not paid" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const conversation = Array.isArray(order.consultation_data)
      ? order.consultation_data
      : JSON.parse(order.consultation_data || "[]");

    const conversationText = conversation
      .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n\n");

    const prompt = `You previously generated a competitive intelligence report for a Singapore business based on this consultation:

${conversationText}

The customer wants to enhance the report with this additional information:
"${supplement}"

Regenerate the FULL competitive intelligence report incorporating both the original consultation details AND the new supplemental information.

CRITICAL: Return ONLY raw HTML starting with <!DOCTYPE html>. No markdown, no code blocks, no text before or after the HTML.

IMPORTANT: Write concisely. Complete every section fully. Do not cut off mid-sentence or mid-section. Prioritise completion over detail. Maximum 3 competitors, maximum 4 SWOT points each.

Generate a complete, professional HTML report with:
- Premium navy (#0a1628) and gold (#c9a84c) styling
- Executive summary
- Competitive landscape with real Singapore competitors
- SWOT analysis
- Market positioning recommendations
- Star ratings legend (★ = Weak, ★★★ = Average, ★★★★★ = Market Leader)
- Verdict strip at the bottom`;

    const reportText = await callAnthropicReportText({
      system: "You are an expert business analyst specialising in the Singapore market.",
      userMessage: prompt,
      maxTokens: 6000,
    });

    const cleanReport = reportText
      .replace(/^[\s\S]*?(?=<!DOCTYPE|<html)/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const { error: updateError } = await supabase
      .from("report_orders")
      .update({
        report_content: cleanReport,
        user_supplement: supplement,
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