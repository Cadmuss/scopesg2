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

### CRITICAL — Markdown Table Format (STRICT)

Tables MUST be GitHub-Flavoured Markdown. The renderer will NOT parse a table unless EVERY row is on its OWN line with a blank line before the header. NEVER put multiple rows, the separator, or cells on a single line. NEVER inline a table inside a paragraph.

CORRECT (use this exact shape — blank line before, each row on its own line, blank line after):

```
<blank line>
| Competitor | Positioning | Pricing | Weakness |
| --- | --- | --- | --- |
| BYD E6 Rentals | Cost-effective EV | S$80-90/day | Fuel cost, driver autonomy |
| Toyota Prius Rentals | Hybrid reliability | S$75-85/day | Older tech, no EV incentives |
<blank line>
```

WRONG (do not do this — renders as plain text):
`| Competitor | Positioning | Pricing | |---|---|---| | BYD E6 | ... | ... |`

Every `|` row ends with a real newline (`\n`). The `|---|---|` separator row is mandatory and must be on its own line directly under the header. Keep cells short (≤12 words). For longer explanations, put a short label in the cell and expand in a paragraph below the table.

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

## Memory & Continuity — Use Relationally, Not Mechanically

You receive a **User Memory** block with the user's profile and past ideas, pre-classified into:
- **Relevant Past Ideas** (same sector as the current question)
- **Other Past Ideas** (background — do NOT cite unless directly applicable)

**Rules — read carefully:**

1. **Never dump or recite memory.** Do not list past ideas back to the user. Do not say "I see you previously worked on X, Y, Z." That is robotic.
2. **Only invoke a past idea when it actually changes the analysis.** Ask: "Does referencing this change my recommendation, risk score, or next step?" If no — stay silent.
3. **Prefer same-sector lessons.** If the user is exploring a second F&B concept, lean on what was learned the first time:
   - Regulatory friction they already hit (SFA licence, NEA, halal cert, foreign worker quota).
   - Cost assumptions that turned out wrong (rent PSF, manpower under MOM quotas).
   - Risk patterns (low margin, perishables, location dependency).
   - Experience gaps they self-identified.
4. **Compare, don't repeat.** Good: *"Your previous café concept stalled on a 25% rent-to-revenue ratio in Orchard — this new hawker model fixes that but inherits the same manpower-quota issue under MOM's S-Pass framework."* Bad: *"You previously mentioned a café, a tuition centre, and a fintech app."*
5. **Surface recurring weaknesses gently** (max once per response): *"This is your second consumer-subscription idea — last time the churn risk was the killer. Same risk applies here unless you've solved retention."*
6. **Always highlight Singapore policy & regulatory implications** for the current idea — even when memory is empty. Name the agency (ACRA, SFA, NEA, MAS, MOM, IMDA, PDPA, MOH/HCSA, LTA, URA) and the specific licence, quota, or compliance rule. Policy callouts are non-negotiable.
7. **Don't re-ask** info already in profile or relevant past ideas (budget, experience level, target market).
8. **If no relevant past ideas exist**, do not mention memory at all. Just answer.

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

// Lightweight sector tagger — maps free-text snippets to canonical SG sectors
const SECTOR_KEYWORDS: Record<string, string[]> = {
  "F&B": ["f&b", "food", "restaurant", "cafe", "café", "bakery", "hawker", "kitchen", "catering", "bar", "drinks", "bubble tea", "coffee", "dining", "cloud kitchen", "sfa"],
  "Retail / E-commerce": ["retail", "store", "shop", "e-commerce", "ecommerce", "shopify", "lazada", "shopee", "carousell", "dropship", "boutique"],
  "Fintech": ["fintech", "payment", "wallet", "lending", "crypto", "trading", "neobank", "remit", "mas"],
  "Health / Wellness": ["clinic", "health", "wellness", "fitness", "gym", "yoga", "tcm", "moh", "hcsa", "telehealth", "supplement"],
  "Education": ["tuition", "edtech", "education", "coaching", "moe", "course", "tutoring", "kindergarten"],
  "Logistics / Mobility": ["logistics", "delivery", "rental", "car", "ev", "fleet", "lta", "ride", "courier", "last mile"],
  "B2B SaaS / Tech": ["saas", "platform", "ai tool", "b2b", "automation", "api", "developer", "crm", "erp"],
  "Beauty / Personal Care": ["beauty", "salon", "spa", "nail", "skincare", "cosmetic", "hair"],
  "Real Estate / PropTech": ["property", "real estate", "rental flat", "hdb", "proptech", "co-living", "ura"],
  "Events / Creative": ["event", "wedding", "photography", "design studio", "agency", "media", "content"],
};

function tagSectors(text: string): string[] {
  const lc = (text || "").toLowerCase();
  const hits: string[] = [];
  for (const [sector, kws] of Object.entries(SECTOR_KEYWORDS)) {
    if (kws.some((k) => lc.includes(k))) hits.push(sector);
  }
  return hits;
}

async function buildUserMemory(
  supabaseAdmin: any,
  userId: string,
  currentUserText: string
): Promise<string> {
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

    const currentSectors = tagSectors(currentUserText);

    if (convos && convos.length > 0) {
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
          firstByConvo.set(m.conversation_id, (m.content || "").slice(0, 320));
        }
      }

      type Past = { title: string; tags: string; snippet: string; sectors: string[]; relevant: boolean };
      const past: Past[] = convos.map((c: any) => {
        const snippet = firstByConvo.get(c.id) || "";
        const sectors = Array.from(new Set([...tagSectors(c.title || ""), ...tagSectors(snippet)]));
        const relevant =
          currentSectors.length > 0 && sectors.some((s) => currentSectors.includes(s));
        return {
          title: c.title,
          tags: c.tags?.length ? ` [${c.tags.join(", ")}]` : "",
          snippet,
          sectors,
          relevant,
        };
      });

      const relevant = past.filter((p) => p.relevant);
      const background = past.filter((p) => !p.relevant);

      if (currentSectors.length) {
        lines.push(`### Current message sectors: ${currentSectors.join(", ")}`);
      }

      if (relevant.length) {
        lines.push("### Relevant Past Ideas (same sector — USE these for comparison, risk lessons, regulatory patterns)");
        for (const p of relevant) {
          lines.push(`- **${p.title}**${p.tags} _(sectors: ${p.sectors.join(", ")})_ — ${p.snippet}`);
        }
      }

      if (background.length) {
        lines.push("### Other Past Ideas (background only — DO NOT cite unless directly applicable)");
        for (const p of background.slice(0, 6)) {
          const s = p.sectors.length ? ` _(${p.sectors.join(", ")})_` : "";
          lines.push(`- ${p.title}${s}`);
        }
      }
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

    // --- Input validation: prevent unbounded LLM payloads ---
    const MAX_MESSAGES = 100;
    const MAX_TOTAL_CHARS = 200_000;
    const MAX_MSG_CHARS = 20_000;
    const FREE_USER_MSG_LIMIT = 5; // anon users: 5 user-turn messages then must sign up

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages must be a non-empty array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: `Too many messages (max ${MAX_MESSAGES}). Start a new conversation.` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let totalChars = 0;
    for (const m of messages) {
      if (!m || typeof m !== "object" || typeof m.content !== "string" ||
          (m.role !== "user" && m.role !== "assistant" && m.role !== "system")) {
        return new Response(JSON.stringify({ error: "Invalid message shape" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (m.content.length > MAX_MSG_CHARS) {
        return new Response(JSON.stringify({ error: `Message exceeds ${MAX_MSG_CHARS} chars` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      totalChars += m.content.length;
    }
    if (totalChars > MAX_TOTAL_CHARS) {
      return new Response(JSON.stringify({ error: "Conversation too long. Start a new chat." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Identify the user from their JWT (optional — anon users get a limited free tier)
    let userMemory = "";
    let isAuthenticated = false;
    try {
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace("Bearer ", "");
      if (token) {
        const { data } = await supabaseAdmin.auth.getUser(token);
        if (data?.user?.id) {
          isAuthenticated = true;
          const lastUserMsg = [...(messages || [])].reverse().find((m: any) => m.role === "user")?.content || "";
          userMemory = await buildUserMemory(supabaseAdmin, data.user.id, lastUserMsg);
        }
      }
    } catch (e) {
      console.error("user memory lookup failed:", e);
    }

    // Enforce free-tier message cap for unauthenticated users
    if (!isAuthenticated) {
      const userTurns = messages.filter((m: any) => m.role === "user").length;
      if (userTurns > FREE_USER_MSG_LIMIT) {
        return new Response(JSON.stringify({
          error: "free_limit_reached",
          message: `You've used your ${FREE_USER_MSG_LIMIT} free messages. Create a free account to continue — it takes 30 seconds and your chat history will be saved.`,
        }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
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
