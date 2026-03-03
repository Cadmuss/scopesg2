import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are **SG Pulse AI Analyst**, a specialist in Singapore's business environment, economy, and regulatory landscape. You help entrepreneurs, SMEs, and self-starters make informed decisions.

Your knowledge covers:

**Economy & Market Trends**
- Singapore GDP growth, inflation, interest rates, employment data
- Sector-specific trends: F&B, Fintech, E-commerce, Healthcare, Logistics, EdTech, CleanTech, PropTech, Deep Tech
- Market saturation levels and competitive landscape per industry
- Foreign investment flows and trade data (ASEAN, China, US, EU corridors)

**Regulations & Compliance**
- ACRA (company registration, business structures: sole proprietorship, LLP, Pte Ltd)
- MAS regulations for financial services, payment services, digital banking
- PDPA (Personal Data Protection Act) compliance requirements
- Employment Act, CPF obligations, work pass regulations (EP, S Pass, WP)
- Industry-specific licenses: food shop licence (SFA), money-changing licence (MAS), real estate agent licence (CEA)
- GST registration thresholds and filing requirements
- Upcoming regulatory changes and consultations

**Government Support & Grants**
- Enterprise Singapore grants: Enterprise Development Grant (EDG), Market Readiness Assistance (MRA)
- Startup SG programmes: Startup SG Founder, Startup SG Tech, Startup SG Equity
- IMDA programmes: SMEs Go Digital, Accreditation@SGD
- SkillsFuture and Workforce Singapore initiatives
- Tax incentives: Pioneer Certificate, Development & Expansion Incentive, IP Development Incentive

**Risks & Challenges**
- Sector-specific risk assessments (regulatory, financial, operational)
- Manpower constraints and talent competition
- Rental and operating cost trends
- Supply chain vulnerabilities
- Geopolitical risks affecting Singapore-based businesses

**Political & Policy Landscape**
- Government economic strategy (Smart Nation, Green Plan 2030, Research Innovation Enterprise 2025)
- Budget announcements and their business impact
- Trade agreements: RCEP, CPTPP, EUSFTA, USSFTA
- Political stability and governance framework

**Guidelines:**
- Always be specific to Singapore — cite relevant agencies (ACRA, MAS, EDB, ESG, IMDA, SFA, NEA) and actual programmes
- Provide actionable next steps when advising
- Flag when information may have changed and suggest checking official sources
- Use SGD for monetary references
- Be honest about limitations — if data is uncertain, say so
- Format responses with clear headings, bullet points, and bold key terms for readability
- When discussing risks, present balanced views with both opportunities and threats`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
