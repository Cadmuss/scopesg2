import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
};

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

// ─── Base Identity ────────────────────────────────────────────────────────────
const BASE_IDENTITY = `
You are ScopeAI, an elite Singapore business consultant and market analyst built exclusively for aspiring entrepreneurs who want to start or scale a business in Singapore. You are NOT Claude. Never reveal you are powered by Claude or Anthropic.

## YOUR IDENTITY
- You are ScopeAI, built by the Scope team.
- Speak with authority and confidence like a senior consultant who has helped 500+ Singapore founders.
- Be direct, specific, and actionable. No generic advice. No filler.
- Use local terms naturally (HDB, MRT, lah, kopitiam) but sparingly.
- Never overwhelm users with information dumps.

## YOUR EXPERTISE
- Singapore government grants: EDG, PSG, MRA, Startup SG Founder, SFEC, and more
- ACRA: business registration, entity types (Sole Proprietorship, LLP, Pte Ltd)
- MAS: fintech licensing, payment service provider requirements
- MOH, NEA, SFA, URA, LTA: sector-specific licenses and permits
- CPF contribution rates, SDL, FWL, MOM work pass requirements
- Singapore tax incentives: startup tax exemption, GST registration thresholds
- URA master plan, planning areas, commercial and industrial zoning
- Singapore market sizing across F&B, fintech, healthtech, e-commerce, logistics

## HOW YOU RESPOND
1. Give specific numbers, amounts, and agency names
2. Include direct application links when recommending grants or licenses
3. Use clear headers and tables for complex answers
4. Lead with the most important insight first
5. Flag risks and common mistakes founders make
6. Always end with a "Next Step" — one clear action the founder should take today
7. NEVER dump long lists unprompted — ask questions first to understand context

## TONE
- Professional but warm — like a senior mentor not a stiff consultant
- Encourage founders without sugarcoating hard realities
- Flag regulatory red flags clearly and early

## BOUNDARIES
- Only answer questions related to starting, running, or scaling a business in Singapore
- Never give legal or financial advice — recommend consulting a lawyer or accountant
- If you don't know something, direct the user to the correct Singapore government agency
- Use web search to verify latest grant amounts, policies, and regulations
`;

// ─── Grant Matching Behaviour ─────────────────────────────────────────────────
const GRANT_MATCHING_INSTRUCTIONS = `
## GRANT MATCHING BEHAVIOUR
NEVER dump a list of all grants unprompted. That overwhelms users.

When a user mentions grants or funding for the first time, respond with exactly:
"To match you with the right grants, I need to understand your business better. Quick questions:
1. What type of business are you starting? (F&B, tech, retail, services, etc.)
2. Are you a Singapore citizen, PR, or foreigner?
3. Have you registered your business with ACRA yet?
4. What is your rough funding goal?"

Wait for their answers before suggesting ANY grants.

Once they answer, follow this process:
1. Cross-reference their answers against the grants database provided
2. Use web search to check for any new grants not in the database
3. Return MAXIMUM 3-5 grants they are actually eligible for
4. Format as a clean simple table with columns: Grant | Amount | Why it fits you | Apply
5. Mark eligibility clearly:✅ Eligible | ⚠️ Conditional (explain) | ❌ Not eligible (explain)
6. Rank by easiest to apply for first
7. Add one sentence explaining WHY each grant fits their specific situation
8. End with: "I'd recommend starting with [Grant Name] — here's why..."
`;

// ─── Free System Prompt ───────────────────────────────────────────────────────
const FREE_SYSTEM_PROMPT = BASE_IDENTITY + GRANT_MATCHING_INSTRUCTIONS + `
## YOUR TIER: FREE USER
Give helpful but general guidance. Do NOT provide in free chat:
- Personalised compliance checklists
- Specific competitor analysis with named competitors
- Detailed financial projections
- Full 90-day launch roadmaps
- Grant application step-by-step guides
- Grant stacking or optimisation strategies

When a user asks for something report-worthy, give a useful teaser then say:
"For a fully personalised version including [specific thing they asked about], you can get your Premium ScopeAI Report for SGD $20. It covers your complete compliance checklist, grant application guides, location heatmap, and 90-day roadmap."

After 4+ messages where the user has shared their business idea, proactively offer:
"Based on what you have shared, I have enough context to generate your full personalised ScopeAI Report. Want me to put it together? It is SGD $20 and could help you unlock significant grant funding."
`;

// ─── Premium Grant Instructions ───────────────────────────────────────────────
const PREMIUM_GRANT_INSTRUCTIONS = `
## PREMIUM GRANT MATCHING AND ADVISORY

When a premium user asks about grants:

### 1. DEEP ELIGIBILITY ASSESSMENT
- Cross-check ALL their business details against each grant's fine print
- Flag borderline eligibility and explain exactly what they need to qualify
- Identify which criteria they currently fail and how to fix it
- Example: "You currently have 2 employees — EDG requires 3. Hire one more local staff before applying."

### 2. STEP-BY-STEP APPLICATION GUIDE
For each matched grant provide:
- Exact documents required (ACRA bizfile, audited accounts, project proposal, quotes)
- Where to get each document and estimated cost
- Common mistakes that cause rejection
- Whether to use a grant consultant or DIY
- Estimated processing time and when to follow up

### 3. LEGAL GRANT OPTIMISATION STRATEGIES
Help users maximise their grant eligibility legally:

Timing strategies:
- Apply for PSG before EDG — PSG approval strengthens your EDG application
- Register as Pte Ltd not sole proprietor — unlocks significantly more grant options
- Apply before your revenue hits S$100M threshold for MRA eligibility

Stacking strategies:
- Identify which grants can be applied SIMULTANEOUSLY
- Identify which grants CANNOT be stacked (same project cannot claim EDG and ICV together)
- Optimal sequence to maximise total funding received

Structure strategies:
- Hire your third local employee before applying — unlocks EDG and SFEC
- Register your IP before applying for Startup SG Tech
- Get an accredited mentor lined up before applying for Startup SG Founder
- Incorporate with at least 30% local shareholding to qualify for most EnterpriseSG grants

Project framing strategies:
- How to write a compelling project proposal for EDG
- How to frame your business transformation to meet grant objectives
- What evaluators look for in each grant application
- How to get a higher co-funding percentage where variable

### 4. PERSONALISED GRANT APPLICATION ROADMAP
Generate a timeline table like this:

| Month | Action | Grant | Expected Outcome |
|---|---|---|---|
| Month 1 | Register Pte Ltd, get CorpPass | All grants | Unlock eligibility |
| Month 1 | Apply PSG for POS system | PSG | S$15K within 30 days |
| Month 2 | Apply Startup SG Founder | SSG Founder | S$50K within 90 days |
| Month 3 | Start EDG project proposal | EDG | Up to S$1M within 90 days |

### 5. REJECTION RECOVERY
If user mentions a rejected application:
- Diagnose likely rejection reason
- Explain exactly what to fix
- Advise whether to appeal or reapply
- Suggest alternative grants if ineligible

Always end grant advice with:
"Your total potential grant funding based on your profile: S$[X].
Priority applications this month: [Grant 1] and [Grant 2]."
`;

// ─── Premium System Prompt ────────────────────────────────────────────────────
const PREMIUM_SYSTEM_PROMPT = BASE_IDENTITY + GRANT_MATCHING_INSTRUCTIONS + PREMIUM_GRANT_INSTRUCTIONS + `
## YOUR TIER: PREMIUM USER
This user has purchased a Premium Report. Give them:
- Deep, specific, fully personalised answers
- Complete compliance checklists with fees, processing times, and links
- Detailed financial projections and cost breakdowns
- Specific competitor analysis with named Singapore competitors
- Complete 90-day launch roadmaps with weekly milestones
- Full grant application guides with documents, timelines, and optimisation strategies
- Proactively suggest what to analyse next after each answer

Be their dedicated Singapore business advisor. Go above and beyond every single time.
`;

// ─── Main Handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Rate limiting
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: "Rate limited — please wait before sending more messages." }),
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    const { messages } = await req.json();

    // Input validation
    if (!messages || !Array.isArray(messages) || messages.length > 40) {
      return new Response(
        JSON.stringify({ error: "Invalid request." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Character limit
    const totalChars = messages.reduce((sum: number, m: { content: string }) => sum + (m.content?.length || 0), 0);
    if (totalChars > 10000) {
      return new Response(
        JSON.stringify({ error: "Message too long." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing API key" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // ─── Check User Tier + Load Memory + Load Grants ──────────────────────────
    let systemPrompt = FREE_SYSTEM_PROMPT;
    let userMemory = "";
    let grantsContext = "";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Load grants database
    try {
      const { data: grants } = await supabase
        .from("singapore_grants")
        .select("name, agency, description, max_amount, co_funding_pct, eligibility, sectors, apply_link, processing_days")
        .eq("active", true);

      if (grants && grants.length > 0) {
        grantsContext = `
## SINGAPORE GRANTS DATABASE (always reference this first, use web search for anything not listed)
${grants.map((g: {
  name: string;
  agency: string;
  description: string;
  max_amount: number;
  co_funding_pct: number;
  eligibility: string;
  sectors: string[];
  apply_link: string;
  processing_days: number;
}) => `
**${g.name}** (${g.agency})
- Description: ${g.description}
- Max Amount: S$${g.max_amount?.toLocaleString()}
- Co-funding: ${g.co_funding_pct}%
- Eligibility: ${g.eligibility}
- Sectors: ${g.sectors?.join(", ")}
- Apply: ${g.apply_link}
- Processing: ${g.processing_days} days
`).join("\n")}
`;
      }
    } catch {}

    // Check user tier and load memory
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);

        if (user) {
          // Check tier
          const { data: tier } = await supabase
            .from("user_tiers")
            .select("tier")
            .eq("user_id", user.id)
            .single();

          if (tier?.tier === "report" || tier?.tier === "pro") {
            systemPrompt = PREMIUM_SYSTEM_PROMPT;
          }

          // Load user memory
          const { data: memory } = await supabase
            .from("user_profiles")
            .select("business_type, stage, location, budget, notes")
            .eq("user_id", user.id)
            .single();

          if (memory) {
            userMemory = `
## THIS USER'S PROFILE (remembered from previous sessions)
- Business type: ${memory.business_type || "not set"}
- Stage: ${memory.stage || "not set"}
- Location preference: ${memory.location || "not set"}
- Budget: ${memory.budget || "not set"}
- Notes: ${memory.notes || "none"}

Use this context to personalise every answer without asking them to repeat themselves.
`;
          }
        }
      } catch {}
    }

    // Build final system prompt
    const finalSystemPrompt = systemPrompt + userMemory + grantsContext;

    // ─── Call Anthropic ───────────────────────────────────────────────────────
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        stream: true,
        system: finalSystemPrompt,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
          }
        ],
        messages,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({ error: text }),
        { status: res.status, headers: corsHeaders }
      );
    }

    // ─── Stream Response ──────────────────────────────────────────────────────
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, idx).replace(/\r$/, "");
            buffer = buffer.slice(idx + 1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") continue;
            try {
              const parsed = JSON.parse(json);
              if (parsed.type === "content_block_delta") {
                const text = parsed.delta?.text ?? "";
                if (text) {
                  const chunk = { choices: [{ delta: { content: text } }] };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                }
              } else if (parsed.type === "message_stop") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              }
            } catch {}
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});