import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAnthropicTool } from "../_shared/anthropic.ts";
import { REPORT_DATA_B_TOOL, ReportDataA, ReportDataB, renderReportHtml } from "../_shared/report-template.ts";

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

    if (!order.report_data_a) {
      return new Response(JSON.stringify({ error: "Report overview not generated yet" }), {
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

    const system = "You are an expert business analyst specialising in the Singapore market. You produce structured data, not prose or HTML.";

    console.log("Generating Data B (recommendations, KPIs, verdict)...");
    const dataB = await callAnthropicTool<ReportDataB>({
      system,
      userMessage: `Based on this business idea:

${conversationText}

AND this real-time market research:

${searchResults || "No additional search data available."}

Fill in the recommendations data using the submit_report_recommendations tool. Exactly 6 recommendations, ordered HIGH priority first, then MEDIUM, then LOW. Be specific to this exact business — no generic advice. All text fields should be plain text, no markdown formatting.

Also include a phased 90-day launch plan and 2-4 real Singapore government grants/schemes that plausibly fit this business — note that these are estimates and must be independently verified.`,
      tool: REPORT_DATA_B_TOOL,
      maxTokens: 2500,
    });

    await supabase.from("report_orders").update({ report_data_b: dataB }).eq("id", order.id);

    const dataA = order.report_data_a as ReportDataA;
    const fullReport = renderReportHtml(dataA, dataB);

    await supabase
      .from("report_orders")
      .update({ report_content: fullReport, status: "completed" })
      .eq("id", order.id);

    console.log("Report rendered and saved successfully");

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