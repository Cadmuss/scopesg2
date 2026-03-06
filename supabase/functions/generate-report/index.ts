import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REPORT_PROMPT = `You are a senior business consultant preparing a PREMIUM Business Viability Report for a client looking to start a business in Singapore. The current date is ${new Date().toISOString().split('T')[0]}.

Based on the consultation conversation provided, generate a comprehensive, professional report in **Markdown format**. 

FORMATTING RULES:
- Use clear, well-spaced Markdown with proper hierarchy
- Use horizontal rules (---) between major sections
- Use tables for all comparative/financial data
- Use blockquotes (>) for key insights or callouts
- Use bold for emphasis on critical numbers and recommendations
- Each section must have a clear numbered heading
- Keep paragraphs short (3-4 sentences max) for readability
- Use bullet points liberally for easy scanning

Generate the report with this EXACT structure:

# Premium Business Viability Report
## [Business Name/Type]
### Prepared by ScopeSG • ${new Date().toISOString().split('T')[0]}

---

## Table of Contents

1. Executive Summary
2. Market Analysis
3. Competitive Landscape
4. Financial Projections
5. Regulatory & Compliance Guide
6. Risk Assessment & Mitigation
7. Government Grants, Initiatives & Support
8. 90-Day Launch Roadmap
9. Key Success Factors
10. Useful Resources & Next Steps

---

## 1. Executive Summary

A concise 3-4 paragraph overview of the business opportunity, key findings, and overall recommendation.

> **Overall Viability Rating:** [High/Medium/Low] — [One sentence explanation]

---

## 2. Market Analysis

- Market size and growth rate (cite sources like DOS, MTI, or Statista)
- Key market drivers and trends in Singapore
- Target market segmentation and sizing
- Consumer behaviour patterns relevant to this business

> **Key Insight:** [Summarise the single most important market finding]

---

## 3. Competitive Landscape

- Top 5-10 existing competitors in Singapore with brief descriptions
- Competitive advantages and differentiators needed
- Market positioning strategy recommendation

### SWOT Analysis

| | **Positive** | **Negative** |
|---|---|---|
| **Internal** | **Strengths:** [List] | **Weaknesses:** [List] |
| **External** | **Opportunities:** [List] | **Threats:** [List] |

---

## 4. Financial Projections

### Startup Costs Breakdown

| Category | Estimated Cost (SGD) |
|----------|---------------------|
| Registration & Licensing | $X |
| Premises / Setup | $X |
| Equipment & Technology | $X |
| Initial Inventory | $X |
| Marketing Budget (3 months) | $X |
| Working Capital (6 months) | $X |
| Contingency (15%) | $X |
| **Total Estimated Investment** | **$X** |

### Revenue Projections

| Metric | 🔴 Conservative | 🟡 Moderate | 🟢 Optimistic |
|--------|-----------------|------------|--------------|
| Monthly Revenue (Month 6) | $X | $X | $X |
| Monthly Revenue (Month 12) | $X | $X | $X |
| Break-even Timeline | X months | X months | X months |
| Year 1 Profit/Loss | $X | $X | $X |

> **Bottom Line:** [One sentence summary of the financial outlook]

---

## 5. Regulatory & Compliance Guide

- Complete list of required licences and permits
- Step-by-step registration process with ACRA
- Industry-specific regulations (SFA, NEA, MAS, etc.)
- PDPA compliance requirements
- Employment regulations if hiring staff
- GST registration requirements and thresholds
- Estimated timeline for all approvals

### Compliance Checklist

| Requirement | Agency | Est. Timeline | Est. Cost |
|-------------|--------|---------------|-----------|
| [Item] | [Agency] | [Time] | [Cost] |

---

## 6. Risk Assessment & Mitigation

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|-------------------|
| [Risk 1] | 🔴 High / 🟡 Medium / 🟢 Low | 🔴 High / 🟡 Medium / 🟢 Low | [Strategy] |
| [Risk 2] | ... | ... | ... |
| [Risk 3] | ... | ... | ... |
| [Risk 4] | ... | ... | ... |
| [Risk 5] | ... | ... | ... |

---

## 7. Government Grants, Initiatives & Support

This section MUST be detailed and actionable. For EACH applicable programme:

### 7.1 Enterprise Development Grant (EDG)
- **What:** [Brief description]
- **Eligibility:** [Key criteria]
- **Funding:** Up to [X]% of qualifying costs
- **Apply:** [Enterprise Singapore website — https://www.enterprisesg.gov.sg/financial-support/enterprise-development-grant]

### 7.2 Startup SG Founder
- **What:** [Brief description]
- **Eligibility:** [Key criteria]
- **Funding:** [Amount]
- **Apply:** [https://www.startupsg.gov.sg/programmes/founder]

### 7.3 Productivity Solutions Grant (PSG)
- **What:** [Brief description]
- **Eligibility:** [Key criteria]
- **Funding:** Up to [X]% of qualifying costs
- **Apply:** [https://www.enterprisesg.gov.sg/financial-support/productivity-solutions-grant]

### 7.4 Market Readiness Assistance (MRA) Grant
- **What:** [Brief description]
- **Apply:** [https://www.enterprisesg.gov.sg/financial-support/market-readiness-assistance-grant]

### 7.5 Other Relevant Programmes
Include any industry-specific grants, SPRING Singapore programmes, SkillsFuture for Business, or SME Go Digital programme as applicable.

> **Pro Tip:** Subscribe to these newsletters/portals for the latest updates:
> - [GoBusiness](https://www.gobusiness.gov.sg/) — One-stop portal for business grants & licences
> - [Enterprise Singapore Alerts](https://www.enterprisesg.gov.sg/subscribe) — Grant updates
> - [Startup SG](https://www.startupsg.gov.sg/) — Startup ecosystem resources
> - [ACRA BizFile+](https://www.bizfile.gov.sg/) — Company registration & filings

---

## 8. 90-Day Launch Roadmap

Present the roadmap as a clear visual timeline:

### 📅 Phase 1: Foundation (Week 1–2)
| Day | Action Item | Owner | Status |
|-----|------------|-------|--------|
| 1-3 | [Action] | Founder | ⬜ |
| 4-7 | [Action] | Founder | ⬜ |
| 8-14 | [Action] | Founder | ⬜ |

### 📅 Phase 2: Setup & Registration (Week 3–4)
| Day | Action Item | Owner | Status |
|-----|------------|-------|--------|
| 15-18 | [Action] | Founder | ⬜ |
| 19-21 | [Action] | Founder | ⬜ |
| 22-28 | [Action] | Founder | ⬜ |

### 📅 Phase 3: Pre-Launch (Month 2)
| Week | Action Item | Owner | Status |
|------|------------|-------|--------|
| Week 5-6 | [Action] | Founder | ⬜ |
| Week 7-8 | [Action] | Founder | ⬜ |

### 📅 Phase 4: Launch & Growth (Month 3)
| Week | Action Item | Owner | Status |
|------|------------|-------|--------|
| Week 9-10 | [Action] | Founder | ⬜ |
| Week 11-12 | [Action] | Founder | ⬜ |

### 🎯 Key Milestones
- **Week 2:** [Milestone]
- **Week 4:** [Milestone]
- **Month 2:** [Milestone]
- **Month 3:** [Milestone]

---

## 9. Key Success Factors

Top 5 critical success factors, each with:
1. **[Factor Name]** — [Actionable recommendation with specific steps]
2. **[Factor Name]** — [Actionable recommendation]
3. **[Factor Name]** — [Actionable recommendation]
4. **[Factor Name]** — [Actionable recommendation]
5. **[Factor Name]** — [Actionable recommendation]

---

## 10. Useful Resources & Next Steps

### Government Portals
- [GoBusiness](https://www.gobusiness.gov.sg/) — Licences, grants, and business guides
- [ACRA](https://www.acra.gov.sg/) — Company registration
- [IRAS](https://www.iras.gov.sg/) — Tax registration and GST
- [MOM](https://www.mom.gov.sg/) — Employment regulations and work passes
- [Enterprise Singapore](https://www.enterprisesg.gov.sg/) — Grants and internationalisation

### Recommended Next Steps
1. [Specific actionable step]
2. [Specific actionable step]
3. [Specific actionable step]

---

> **Disclaimer:** This report is generated using AI-powered analysis and publicly available data. It is for informational purposes only and does not constitute financial, legal, or professional advice. Business outcomes depend on execution, market conditions, and factors beyond projections. Consult qualified professionals before making business decisions. Sources cited are indicative; verify all regulatory requirements with the relevant Singapore government agencies.

---

*Report generated by ScopeSG • www.scopesg.com*

IMPORTANT:
- All monetary values must be in SGD
- Be specific to Singapore's context, laws, and market conditions
- Cite relevant Singapore government agencies and programmes with REAL, WORKING URLs
- Use realistic, data-grounded estimates
- Format as clean, professional Markdown with proper spacing
- Use emoji sparingly for visual clarity in the roadmap and risk sections
- Ensure every government programme includes a direct link to apply/learn more`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { orderId } = await req.json();
    if (!orderId) throw new Error("orderId is required");

    // Fetch order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("report_orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) throw new Error("Order not found");
    if (order.status === "completed" && order.report_content) {
      return new Response(JSON.stringify({ report: order.report_content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build conversation context from consultation data
    const consultationMessages = order.consultation_data as Array<{ role: string; content: string }>;
    const conversationSummary = consultationMessages
      .map((m: { role: string; content: string }) => `${m.role === "user" ? "Client" : "Consultant"}: ${m.content}`)
      .join("\n\n");

    // Generate report via AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: REPORT_PROMPT },
          {
            role: "user",
            content: `Here is the consultation conversation with the client:\n\n${conversationSummary}\n\nGenerate the full Premium Business Viability Report based on this consultation.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("Failed to generate report");
    }

    const aiResult = await response.json();
    const reportContent = aiResult.choices?.[0]?.message?.content;
    if (!reportContent) throw new Error("No report content generated");

    // Save report
    await supabaseAdmin
      .from("report_orders")
      .update({ status: "completed", report_content: reportContent })
      .eq("id", orderId);

    return new Response(JSON.stringify({ report: reportContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-report error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
