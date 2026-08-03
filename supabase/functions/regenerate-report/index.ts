import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAnthropicTool } from "../_shared/anthropic.ts";
import { REPORT_ENHANCEMENT_TOOL, ReportEnhancement, ReportDataA, ReportDataB, renderReportHtml } from "../_shared/report-template.ts";

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

    if (!order.report_data_a || !order.report_data_b) {
      return new Response(JSON.stringify({ error: "Original report data not found — cannot enhance" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dataA = order.report_data_a as ReportDataA;
    const dataB = order.report_data_b as ReportDataB;

    const system = "You are an expert business analyst specialising in the Singapore market. You produce structured data, not prose or HTML. You add ONLY new information — you never repeat what's already in the existing report.";

    console.log("Generating enhancement based on supplement...");
    const enhancement = await callAnthropicTool<ReportEnhancement>({
      system,
      userMessage: `Here is the EXISTING report data — do not repeat any of this:

COMPETITORS: ${JSON.stringify(dataA.competitors)}
RISKS: ${JSON.stringify(dataA.risks)}
GRANTS: ${JSON.stringify(dataB.grants)}
CURRENT NARRATIVE: ${dataA.narrative}
CURRENT UNIT ECONOMICS: ${JSON.stringify(dataA.unit_economics)}

The customer has provided this NEW information to enhance the report:
"${supplement}"

Using the submit_report_enhancement tool, provide ONLY what's genuinely new based on this supplement:
- New competitors NOT already listed above (empty array if none)
- New risks NOT already listed above (empty array if none)
- New grants NOT already listed above (empty array if none)
- A short narrative addendum reflecting this new info (empty string if the supplement doesn't add narrative-worthy insight)
- Updated unit economics ONLY if the supplement specifically relates to costs or pricing (empty strings otherwise)`,
      tool: REPORT_ENHANCEMENT_TOOL,
      maxTokens: 1500,
    });

    // Merge: append new items to existing arrays, never replace
    const updatedDataA: ReportDataA = {
      ...dataA,
      narrative: enhancement.narrative_addendum
        ? `${dataA.narrative} ${enhancement.narrative_addendum}`
        : dataA.narrative,
      competitors: [...dataA.competitors, ...enhancement.additional_competitors],
      risks: [...dataA.risks, ...enhancement.additional_risks],
      unit_economics: {
        cost_per_cup: enhancement.updated_cost_per_cup || dataA.unit_economics.cost_per_cup,
        price_per_cup: enhancement.updated_price_per_cup || dataA.unit_economics.price_per_cup,
        margin_per_cup: enhancement.updated_margin_per_cup || dataA.unit_economics.margin_per_cup,
        margin_percentage: enhancement.updated_margin_percentage || dataA.unit_economics.margin_percentage,
        breakeven_cups_per_day: enhancement.updated_breakeven_cups_per_day || dataA.unit_economics.breakeven_cups_per_day,
      },
    };

    const updatedDataB: ReportDataB = {
      ...dataB,
      grants: [...dataB.grants, ...enhancement.additional_grants],
    };

    const fullReport = renderReportHtml(updatedDataA, updatedDataB);

    const { error: updateError } = await supabase
      .from("report_orders")
      .update({
        report_data_a: updatedDataA,
        report_data_b: updatedDataB,
        report_content: fullReport,
        user_supplement: supplement,
      })
      .eq("id", orderId);

    if (updateError) throw updateError;

    console.log("Report enhanced and saved successfully — old content preserved, new content appended");

    return new Response(JSON.stringify({ success: true, report: fullReport }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("regenerate-report error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});