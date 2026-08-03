import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAnthropicTool } from "../_shared/anthropic.ts";
import { REPORT_DATA_A_TOOL, ReportDataA } from "../_shared/report-template.ts";

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

    if (order.report_data_a) {
      return new Response(JSON.stringify({ dataAReady: true }), {
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

    const system = "You are an expert business analyst specialising in the Singapore market. You produce structured data, not prose or HTML.";

    console.log("Generating Data A (overview, competitors, SWOT)...");
    const dataA = await callAnthropicTool<ReportDataA>({
      system,
      userMessage: `Based on this business idea:

${conversationText}

AND this real-time market research:

${searchResults || "No additional search data available — use your training knowledge."}

Fill in the report overview data using the submit_report_overview tool. Use REAL competitor names, ACTUAL current SGD prices, and LATEST information from the search data above. Be specific — no vague statements. All text fields should be plain text, no markdown formatting.

Also include realistic unit economics (cost per cup, price, margin, breakeven volume) and a risk register of 4-5 specific risks with mitigations, based on the business details given.',

      tool: REPORT_DATA_A_TOOL,
      maxTokens: 3000,
    });

    await supabase.from("report_orders").update({ report_data_a: dataA }).eq("id", order.id);

    console.log("Data A saved successfully");

    return new Response(JSON.stringify({ dataAReady: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("ERROR:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});