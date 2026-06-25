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

    if (order.status !== "paid") {
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

    // Generate and await directly
    console.log("Starting generation...");
    const prompt = buildPrompt(order);
    const reportText = await callAnthropicReportText({
      system: "You are an expert business analyst specialising in the Singapore market.",
      userMessage: prompt,
      maxTokens: 8192,
    });
    console.log("Generation complete, length:", reportText.length);

    const cleanReport = reportText
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    await supabase
      .from("report_orders")
      .update({
        report_content: cleanReport,
        status: "completed",
      })
      .eq("id", order.id);

    return new Response(JSON.stringify({ report: cleanReport }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("ERROR:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildPrompt(order: any): string {
  // Extract conversation history from consultation_data
  const conversation = Array.isArray(order.consultation_data) 
    ? order.consultation_data 
    : JSON.parse(order.consultation_data || "[]");
  
  const conversationText = conversation
    .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join("\n\n");

  return `You are an expert business analyst specialising in the Singapore market.

A customer had the following consultation conversation about their business idea:

${conversationText}

Based on this consultation, generate a complete professional HTML competitive intelligence report tailored specifically to this business. The report must reference the actual business details discussed (disinfection service, residential post-illness cleaning, S$1K budget, solo operator etc).

Generate a complete, professional HTML report (no markdown, pure HTML) with:
- Premium navy (#0a1628) and gold (#c9a84c) styling
- Executive summary specific to this business
- Competitive landscape with real Singapore competitors in this exact niche (use web search)
- SWOT analysis for this specific business
- Market positioning recommendations tailored to this business
- Star ratings legend (★ = Weak, ★★★ = Average, ★★★★★ = Market Leader)
- Verdict strip at the bottom
- All data current as of today for Singapore market`;
}