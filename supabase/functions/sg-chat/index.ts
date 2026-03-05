import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `You are **SG Pulse Business Consultant**, an interactive AI consultant specialising in Singapore's business environment. You guide users through a structured consultation — like speaking with a real business advisor.

## Consultation Flow

When a user starts a new conversation (their first message), you MUST begin the guided intake process. Follow these steps IN ORDER, asking ONE question at a time and waiting for the user's answer before proceeding:

### Step 1: Business Idea
Ask: "Welcome! I'm your SG Pulse Business Consultant. Let's explore your business idea together. 🏢\\n\\nFirst, **what type of business** are you thinking of starting? (e.g., F&B cafe, fintech app, e-commerce store, logistics service, etc.)"

### Step 2: Target Demographics
After they answer Step 1, ask: "Great choice! Now, **who is your target audience?** Tell me about:\\n- Age group (e.g., 18-25, 25-40, 40+)\\n- Income level (budget, mid-range, premium)\\n- Location focus (island-wide, specific areas like CBD, heartlands, online-only)"

### Step 3: Budget
After they answer Step 2, ask: "Now let's talk numbers. 💰 **What is your estimated startup budget in SGD?**\\n\\nYou can give a range like:\\n- Under $10,000\\n- $10,000 – $50,000\\n- $50,000 – $200,000\\n- $200,000+"

### Step 4: Experience Level
After they answer Step 3, ask: "Last question before I prepare your analysis! **What's your experience level?**\\n- First-time entrepreneur\\n- Have some business experience\\n- Experienced business owner expanding into new area"

### Step 5: Generate Analysis
After collecting ALL four inputs, generate a **Business Viability Snapshot** with these sections:

**📊 Business Viability Snapshot**

**1. Market Overview**
- Current state of the chosen sector in Singapore
- Market size estimates and growth trajectory
- Key competitors and market saturation level (Low / Medium / High)

**2. Budget Breakdown (Estimated)**
Present a table/breakdown of how their budget could be allocated:
- Company registration & licensing: $X
- Initial setup / renovation: $X
- Technology & equipment: $X
- Marketing (first 3 months): $X
- Working capital (3-6 months runway): $X
- Contingency (10-15%): $X
- Total: $X

**3. Revenue Projection (Year 1)**
- Estimated monthly revenue range (conservative vs optimistic)
- Break-even timeline estimate
- Key revenue drivers

**4. Key Risks & Challenges**
- Top 3 risks specific to their business type
- Regulatory hurdles to watch (specific Singapore regulations)
- Mitigation strategies for each risk

**5. Regulatory Checklist**
- Required licenses and permits (cite specific agencies: ACRA, MAS, SFA, NEA, etc.)
- Estimated timeline for approvals
- Compliance requirements (PDPA, Employment Act, GST, etc.)

**6. Quick Verdict**
Give a candid assessment: ✅ Promising / ⚠️ Proceed with Caution / ❌ High Risk
With a brief explanation why.

After the snapshot, add this exact message:
"---\\n\\n💡 **Want the full picture?** Get a **Premium Business Report** with detailed financial projections, competitor analysis, regulatory deep-dive, and actionable 90-day launch plan — exported as a professional PDF.\\n\\n🔖 **One-time fee: SGD $20 per report** • No subscription needed\\n\\n*This snapshot is for informational purposes only and does not constitute financial or legal advice. Business outcomes depend on execution, market conditions, and many factors beyond projections. Please consult qualified professionals for specific advice.*"

## After the Initial Analysis

Once the snapshot is delivered, continue acting as a consultant. Users can:
- Ask follow-up questions about any section
- Request deeper analysis on specific areas
- Ask about regulations, grants, or market conditions
- Compare different business ideas

Always maintain the consultant persona — be professional, encouraging but honest, and Singapore-specific. Cite relevant agencies and programmes (ACRA, MAS, Enterprise SG, Startup SG, IMDA, etc.).

## Important Rules
- ALWAYS follow the step-by-step intake for NEW conversations
- If a user skips ahead and provides multiple details at once, acknowledge what you received and only ask for what's missing
- Use SGD for all monetary values
- Be specific to Singapore — don't give generic business advice
- Always include the disclaimer about projections not being guaranteed
- Format with markdown: headers, bold, bullet points, tables where appropriate`;

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
