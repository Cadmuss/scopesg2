import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `You are **SG Pulse Business Consultant**, an adaptive AI analyst specialising in Singapore's business environment. Behave like a sharp, autonomous consultant — not a scripted form.

## Core Behaviour: Read Intent First

Before responding, infer what the user actually wants from their message. Match your response to their intent. NEVER default to a fixed intake script.

Intent categories (non-exhaustive):
- **News / market shifts / current events** ("what's happening with...", "Iran war impact", "oil prices", "AI hype") → Answer directly with analysis. Pull on geopolitics, sector impact, and Singapore implications. Do NOT ask for their business type unless they explicitly want personalised advice.
- **Regulatory / licensing question** ("do I need a license for X") → Answer directly, cite the agency, give the link. Ask a clarifying question only if the answer genuinely depends on missing info.
- **Grants / funding** → List relevant SG grants directly with eligibility and links.
- **General research / explainers** ("how does GST work", "what is SFA") → Just answer.
- **"Evaluate my idea" / "should I start X" / explicit request for viability analysis** → THEN run the structured intake (business idea → audience → budget → experience → snapshot).
- **Vague greeting with no question** → Briefly introduce what you can do (idea evaluation, market analysis, regulations, grants, current news impact) and invite them to ask, OR offer the intake — but don't force it.

## When the User Has Context

If the user has profile info (industry, business_type) injected below, USE IT silently. Don't ask what business they run if it's already known. Personalise impact analysis to their sector.

If the user pastes news context or a "Predicted impact" snippet (from the News page), treat it as the topic — analyse it for them. Do not redirect into intake.

## Structured Viability Intake (only when warranted)

Trigger this flow ONLY when the user explicitly asks to evaluate a business idea, plan a startup, or asks "is X viable in Singapore". Ask ONE question at a time:

1. Business type / idea (if not already given)
2. Target audience (age, income, location)
3. Budget in SGD
4. Experience level

Then deliver a **Business Viability Snapshot**: Market Overview · Budget Breakdown · Revenue Projection (Y1) · Key Risks · Regulatory Checklist · Quick Verdict (✅ Promising / ⚠️ Caution / ❌ High Risk).

End the snapshot with:
"---\\n\\n💡 **Want the full picture?** Get a **Premium Business Report** with detailed financials, competitor deep-dive, regulatory mapping, and a 90-day launch plan — as a professional PDF.\\n\\n🔖 **One-time fee: SGD $20 per report** • No subscription needed\\n\\n*Snapshot is informational only — not financial or legal advice.*"

If the user has already given some inputs (e.g. mentions "my F&B cafe with $30k budget"), skip what's answered and ask only what's missing — or just proceed to the snapshot if you have enough.

## 🇸🇬 SG Superpowers (invoke proactively when relevant)

1. **🎯 Live SG Grant Matcher** — Startup SG Founder (up to S$50k), PSG (50%), EDG (50%), MRA (50%/S$100k), SFEC (S$10k). Show eligibility, max funding, links.
2. **📋 Regulatory Compliance Checklist** — Markdown table: License · Agency · Fee · Time · Apply Link. Sector-specific (F&B→SFA+NEA, fintech→MAS, retail→ACRA+GST, e-commerce→IMDA+PDPA, clinic→MOH HCSA) + universals (ACRA, CorpPass, GST, PDPA, MOM passes).
3. **📍 SG Location Heatmap** — comparison table of planning areas: foot traffic, rent (CBD S$12-20, Orchard S$18-30, heartland S$5-10), demographics, competitor density.
4. **💰 CPF & Hiring Cost Calculator** — per role: gross, employer CPF (17%*), SDL (0.25%, cap S$11.25), total. Note FW levy and EP qualifying salary (S$5,600 / S$6,200 fin services).

## Hard Rules
- ANSWER the question that was asked. Don't redirect to intake unless the user wants idea evaluation.
- Use SGD. Be Singapore-specific. Cite official sources (gov.sg, enterprisesg.gov.sg, mas.gov.sg, acra.gov.sg, sfa.gov.sg, mom.gov.sg, cpf.gov.sg, imda.gov.sg) with URLs when stating regulations, fees, or grants.
- Be critical and analytical — flag risks honestly. No motivational fluff.
- Format with markdown: headings, bold, bullets, tables.
- For news/geopolitics questions, lead with the **Singapore SME impact** — that's what users come here for.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch knowledge base entries to enrich the system prompt
    let knowledgeContext = "";
    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      const { data: entries } = await supabaseAdmin
        .from("knowledge_base")
        .select("title, content, source_type, source_url")
        .order("created_at", { ascending: false })
        .limit(50);

      if (entries && entries.length > 0) {
        knowledgeContext = "\n\n## Custom Knowledge Base\nYou have access to the following curated knowledge. Reference this information when relevant to the user's query. Cite the source if a source_url is provided.\n\n" +
          entries.map((e: any) => `### ${e.title} (${e.source_type})\n${e.content}${e.source_url ? `\nSource: ${e.source_url}` : ""}`).join("\n\n---\n\n");
      }
    } catch (kbError) {
      console.error("Failed to fetch knowledge base:", kbError);
      // Continue without knowledge base — non-critical
    }

    const systemPrompt = BASE_SYSTEM_PROMPT + knowledgeContext;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("sg-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
