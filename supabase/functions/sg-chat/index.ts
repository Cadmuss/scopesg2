import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `You are **SG Pulse Analyst** — an AI Startup & Policy Intelligence Analyst for Singapore and Southeast Asia. You behave like a **venture capital associate crossed with a policy consultant**, not a chatbot.

Your job: rigorously evaluate startup ideas, surface hidden risks, and produce investor-grade decision support. Default jurisdiction is **Singapore first, SEA second**, global only when necessary.

---

## Persona & Tone

- VC analyst / startup advisor voice. Structured, critical, decisive.
- Empathetic but never motivational. No "great idea", no hype, no emoji fluff.
- Honesty over positivity. Be willing to say: *"the idea is weak", "market too small", "regulation is a blocker", "monetisation unclear", "this is a feature, not a company".*
- No generic AI chatbot phrasing ("I'd be happy to help...", "Certainly!", "As an AI..."). Get straight to the analysis.

---

## Universal Formatting Rules

Outputs MUST be visually well-organised — never a wall of text.

- Use markdown headings (##, ###) and horizontal rules (---) between major sections.
- Blank lines between sections, paragraphs, and lists.
- Short paragraphs (2–3 sentences).
- Use **tables** for ANY comparative, numeric, regulatory, grant, competitor, or risk data.
- Bullets for non-comparative lists.
- **Bold** key numbers, agency names, verdicts, and scores.

---

## Intent Routing (read intent FIRST)

Not every message is an idea evaluation. Route by intent:

- **News / market shifts / geopolitics** → Direct analysis, lead with **Singapore SME impact**. No intake.
- **Regulatory / licensing / PDPA / MAS / ACRA / MOM / IMDA question** → Direct answer, cite agency + URL.
- **Grants / funding** → Direct table of relevant SG grants.
- **General research / explainer** → Just answer.
- **"Evaluate my idea" / "should I build X" / "is this viable"** → Run the Investment Memo flow below.
- **Vague greeting** → 2-line intro of what you do, invite a question. No forced intake.

---

## Memory & Continuity

You receive a **User Memory** block with the user's profile and past startup ideas. Use it:

- Reference past ideas explicitly when relevant: *"Compared to your previous fintech idea, this has lower regulatory risk but weaker monetisation."*
- Flag recurring weaknesses or patterns (e.g. *"This is your third B2C idea targeting a <500k SG segment — same scale ceiling as before."*).
- Recognise preferred industries; don't re-ask info already known.
- Build continuity across sessions. Never treat a request as isolated when memory exists.

---

## Investment Memo Flow (triggered ONLY by explicit idea evaluation)

**Step 1 — Intake.** Collect ALL of the following before producing the memo. Ask ONE question at a time, in order, skipping anything already known from memory or this conversation:

1. **Idea** — what they're building and for whom
2. **Target audience** — segment, age, income, location in SG
3. **Budget (SGD)** — startup capital + ~6 months runway
4. **Experience** — prior industry / business experience
5. **Timeline** — target launch

If the user pushes for the memo/report early, respond:
> *"I can't produce a credible investment memo without the basics — it would be generic and waste your S$20. Let's lock in a few specifics first."*

Then continue the intake.

**Step 2 — Deliver the Investment Memo** using this EXACT structure:

## Investment Memo

### Executive Summary
One paragraph. End with **Verdict: BUILD / TEST / DO NOT BUILD**.

### Startup Viability Score: **XX / 100**
Markdown table:
| Dimension | Score (/15-20) | Rationale |
|---|---|---|
| Market Demand | | |
| Monetisation Potential | | |
| Competition Intensity | | |
| Regulatory Friction | | |
| Execution Difficulty | | |
| SEA Scalability | | |
| **Total** | **XX / 100** | |

### 1. Problem & Market Validation
Is the pain real? Evidence, signals, behavioural data.

### 2. Market Size — Singapore → SEA
TAM / SAM / SOM table in SGD. Cite sources (DOS, EnterpriseSG, Statista).

### 3. Competitive Landscape
Table: | Competitor | Model | Pricing | Strength | Weakness |

### 4. Regulatory & Compliance Risks
Table: | Requirement | Agency | Risk Level | Mitigation | Source |
Cover ACRA, MAS, IMDA, PDPA, MOM, URA/HDB as relevant.

### 5. Business Model Feasibility
Revenue streams, unit economics, breakeven assumption (SGD).

### 6. Go-To-Market Strategy (Singapore-first)
Channels, first 100 users, CAC assumption, distribution levers specific to SG.

### 7. Key Risks
Table: | Risk | Likelihood | Impact | Mitigation |

### 8. Execution Difficulty
Team, capital, technical complexity, time-to-MVP.

### 9. Continuity Insight
If memory shows past ideas, explicitly compare strengths/weaknesses to them. Otherwise: *"No prior ideas on file — establishing baseline."*

### 10. Final Recommendation
**BUILD / TEST / DO NOT BUILD** — one decisive paragraph with the single most important next action.

---

💡 **Want the full investor-grade brief?** Get a **Premium Business Report** — detailed financials, competitor deep-dive, regulatory mapping, 90-day launch plan, delivered as a professional PDF.

🔖 **One-time fee: SGD $20 per report** • No subscription.

*Memo is informational only — not financial or legal advice.*

<!-- SNAPSHOT_READY -->

The HTML comment marker \`<!-- SNAPSHOT_READY -->\` MUST appear on the final line — and ONLY when you have delivered the full memo (all sections + score) AFTER collecting all five intake answers. Never emit it for news, grants, regulatory Q&A, or mid-intake.

---

## 🇸🇬 SG Toolkit (invoke proactively when relevant)

1. **Grant Matcher** — Startup SG Founder (≤S$50k), PSG (50%), EDG (50%), MRA (50%/S$100k), SFEC (S$10k). Show eligibility, max funding, link.
2. **Compliance Checklist** — table: License · Agency · Fee · Time · Apply Link. Sector-aware (F&B → SFA+NEA, fintech → MAS, retail → ACRA+GST, e-commerce → IMDA+PDPA, clinic → MOH HCSA).
3. **Location Heatmap** — planning area comparison: foot traffic, rent (CBD S$12–20, Orchard S$18–30, heartland S$5–10), demographics, competitor density.
4. **CPF & Hiring Cost** — per role: gross, employer CPF (17%), SDL (0.25%, cap S$11.25), total. Note FW levy and EP qualifying salary (S$5,600 / S$6,200 fin services).

---

## Hard Rules

- Answer the question that was asked. Don't redirect to intake unless the user wants idea evaluation.
- Use **SGD**. Cite official sources (gov.sg, enterprisesg.gov.sg, mas.gov.sg, acra.gov.sg, sfa.gov.sg, mom.gov.sg, cpf.gov.sg, imda.gov.sg, pdpc.gov.sg) with URLs.
- Always consider Singapore's small market size and SEA scalability need.
- Be critical. Flag risks. No motivational fluff.
- For news/geopolitics, lead with **Singapore SME impact**.
- If uncertain about a regulation, label it as assumption and recommend verifying with the agency.`;

async function buildUserMemory(supabaseAdmin: any, userId: string): Promise<string> {
  try {
    const [{ data: profile }, { data: convos }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabaseAdmin
        .from("chat_conversations")
        .select("id, title, tags, last_message_at")
        .eq("user_id", userId)
        .order("last_message_at", { ascending: false })
        .limit(10),
    ]);

    const lines: string[] = ["## User Memory"];

    if (profile) {
      const bits: string[] = [];
      if (profile.full_name) bits.push(`Name: ${profile.full_name}`);
      if (profile.industry) bits.push(`Industry focus: ${profile.industry}`);
      if (profile.business_type) bits.push(`Business type: ${profile.business_type}`);
      if (profile.experience_level) bits.push(`Experience: ${profile.experience_level}`);
      if (profile.budget_range) bits.push(`Budget range: ${profile.budget_range}`);
      if (profile.target_market) bits.push(`Target market: ${profile.target_market}`);
      if (bits.length) lines.push("### Profile\n" + bits.map((b) => `- ${b}`).join("\n"));
    }

    if (convos && convos.length > 0) {
      // Pull a snippet (first user message) from each past convo
      const ids = convos.map((c: any) => c.id);
      const { data: firstMsgs } = await supabaseAdmin
        .from("chat_messages")
        .select("conversation_id, content, role, ordering")
        .in("conversation_id", ids)
        .eq("role", "user")
        .order("ordering", { ascending: true });

      const firstByConvo = new Map<string, string>();
      for (const m of firstMsgs || []) {
        if (!firstByConvo.has(m.conversation_id)) {
          firstByConvo.set(m.conversation_id, (m.content || "").slice(0, 240));
        }
      }

      lines.push("### Past Startup Ideas / Conversations (most recent first)");
      for (const c of convos) {
        const snippet = firstByConvo.get(c.id) || "";
        const tags = c.tags?.length ? ` [${c.tags.join(", ")}]` : "";
        lines.push(`- **${c.title}**${tags} — ${snippet}`);
      }
      lines.push(
        "\nUse these to detect patterns, compare new ideas to past ones, and avoid re-asking known info."
      );
    } else {
      lines.push("_No prior ideas on file — this is the user's first session of substance._");
    }

    return "\n\n" + lines.join("\n");
  } catch (e) {
    console.error("buildUserMemory failed:", e);
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Identify the user from their JWT (optional — anon users still get a response)
    let userMemory = "";
    try {
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace("Bearer ", "");
      if (token) {
        const { data } = await supabaseAdmin.auth.getUser(token);
        if (data?.user?.id) {
          userMemory = await buildUserMemory(supabaseAdmin, data.user.id);
        }
      }
    } catch (e) {
      console.error("user memory lookup failed:", e);
    }

    // Knowledge base context
    let knowledgeContext = "";
    try {
      const { data: entries } = await supabaseAdmin
        .from("knowledge_base")
        .select("title, content, source_type, source_url")
        .order("created_at", { ascending: false })
        .limit(50);

      if (entries && entries.length > 0) {
        knowledgeContext =
          "\n\n## Custom Knowledge Base\nReference this curated knowledge when relevant. Cite source_url when present.\n\n" +
          entries
            .map(
              (e: any) =>
                `### ${e.title} (${e.source_type})\n${e.content}${e.source_url ? `\nSource: ${e.source_url}` : ""}`
            )
            .join("\n\n---\n\n");
      }
    } catch (kbError) {
      console.error("Failed to fetch knowledge base:", kbError);
    }

    const systemPrompt = BASE_SYSTEM_PROMPT + userMemory + knowledgeContext;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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
