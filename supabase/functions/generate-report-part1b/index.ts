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
      return new Response(JSON.stringify({ done: true, report: order.report_content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.report_part1b) {
      return new Response(JSON.stringify({ part1bReady: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!order.report_part1a) {
      return new Response(JSON.stringify({ error: "Part 1a not generated yet" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    console.log("Generating Part 1b (Competitive Landscape + SWOT)...");
    const raw = await callAnthropicReportText({
      system,
      userMessage: `Based on this business idea:

${conversationText}

AND this real-time market research data:

${searchResults || "No additional search data available — use your training knowledge."}

Generate ONLY these two sections of a premium competitive intelligence report. Return ONLY the inner HTML (no <!DOCTYPE>, no <html>, no <head>, no <style> tags — inline styles only).

Include ONLY:
1. Competitive Landscape — table with REAL competitor names, actual SGD pricing, key positioning, presence (use specific data from search results)
2. SWOT Analysis — 4 points each (Strengths, Weaknesses, Opportunities, Threats)

IMPORTANT:
- Use navy (#0a1628) and gold (#c9a84c) color theme with inline styles
- Start directly with <div> or <section>
- End with </div> — no </body> or </html>
- Return ONLY raw HTML, no markdown, no code blocks, no pipe tables
- Do NOT include recommendations, KPIs, or verdict
- Use SPECIFIC data from search results — real names, real prices`,
      maxTokens: 3000,
    });

    const clean = raw
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    await supabase.from("report_orders").update({ report_part1b: clean }).eq("id", order.id);

    console.log("Part 1b saved successfully");

    return new Response(JSON.stringify({ part1bReady: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("ERROR:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});