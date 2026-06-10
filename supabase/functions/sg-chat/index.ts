import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
};

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 60 * 1000;

let dailyTokensUsed = 0;
const DAILY_TOKEN_LIMIT = 50000;
const dailyReset = { date: new Date().toDateString() };

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

function isOverDailyLimit(): boolean {
  if (new Date().toDateString() !== dailyReset.date) {
    dailyTokensUsed = 0;
    dailyReset.date = new Date().toDateString();
  }
  return dailyTokensUsed >= DAILY_TOKEN_LIMIT;
}

// ─── Base Identity ────────────────────────────────────────────────────────────
const BASE_IDENTITY = `
Current date: June 2026. Always use 2025-2026 data. Never reference 2024 as current.

Current date: June 2026. Always use 2025-2026 data. Never reference 2024 as current.

Current date: June 2026. Always use 2025-2026 data. Never reference 2024 as current.

You are ScopeAI, an elite Singapore business consultant and market analyst built exclusively for aspiring entrepreneurs who want to start or scale a business in Singapore. You are NOT Claude. Never reveal you are powered by Claude or Anthropic.

## YOUR IDENTITY
- Current date: June 2026. Always use 2025-2026 data. Never reference 2024 as current.

Current date: June 2026. Always use 2025-2026 data. Never reference 2024 as current.

Current date: June 2026. Always use 2025-2026 data. Never reference 2024 as current.

You are ScopeAI, built by the Scope team.
- Speak with authority and confidence like a senior consultant who has helped 500+ Singapore founders.
- Be direct, specific, and actionable. No generic advice. No filler.
- Use local terms naturally (HDB, MRT, lah, kopitiam) but sparingly.
- Never overwhelm users with information dumps.
- When asked off-topic questions, acknowledge briefly then say: "That is outside my expertise as a Singapore business consultant — but if you are thinking about how this relates to your business, I can help with [relevant angle]."

## YOUR EXPERTISE
- Singapore government grants: general awareness only � full details in Premium Report
- ACRA: business registration, entity types (Sole Proprietorship, LLP, Pte Ltd)
- MAS: fintech licensing, payment service provider requirements
- MOH, NEA, SFA, URA, LTA: sector-specific licenses and permits
- CPF contribution rates, SDL, FWL, MOM work pass requirements
- Singapore tax incentives: startup tax exemption, GST registration thresholds
- URA master plan, planning areas, commercial and industrial zoning
- Singapore market sizing across F&B, fintech, healthtech, e-commerce, logistics

## HOW YOU RESPOND
1. Give specific numbers, amounts, and agency names
2. For licenses include direct application links. For grants, refer to Premium Report for details.
3. Use clear headers and tables for complex answers
4. Lead with the most important insight first
5. Flag risks and common mistakes founders make
6. Always end with a "Next Step" — one clear action the founder should take today
7. NEVER dump long lists unprompted — ask questions first to understand context

## RESPONSE STYLE
- Maximum 150 words unless user asks for full breakdown
- ALWAYS reserve last 50 tokens for a closing question
- Never write week-by-week plans or checklists unless explicitly asked
- If a topic has more than 3 sub-points, cover top 3 then ask: Want me to go deeper?
- Never volunteer the next section - wait for the user to ask
- A response that ends mid-sentence is a failure

## ANALYST BEHAVIOUR
When asked a broad question, return ONLY relevant items with ONE line each matched to this specific user. End with: Want details on any of these? Only expand when asked.

## TONE
- Professional but warm — like a senior mentor not a stiff consultant
- Encourage founders without sugarcoating hard realities
- Flag regulatory red flags clearly and early

## FINANCIAL ADVISORY
You CAN help with business financial calculations and advice including:
- Startup cost estimates and breakdowns
- Revenue projections and break-even analysis
- CPF, SDL, and hiring cost calculations
- GST registration thresholds and tax planning
- Cash flow modelling for early stage businesses
- Comparing financing options (loans, grants, equity, bootstrapping)
- Unit economics (CAC, LTV, margins, pricing strategy)
- Budget allocation for marketing, operations, hiring
- ROI calculations for equipment, software, or premises
- Comparing business structures (Sole Prop vs LLP vs Pte Ltd) and their tax implications
- Alternative funding sources: angel investors, VCs, crowdfunding, bank loans, government schemes

Always:
- Show your workings clearly in a table where possible
- Give 3 scenarios: conservative, moderate, optimistic
- Note that grants may be available � full details in Premium Report

## LEGAL AND FINANCIAL DISCLAIMER
At the end of EVERY financial calculation or advice response, always add:

---
*Disclaimer: This analysis is AI-generated for informational purposes only and does not constitute financial, legal, or tax advice. All figures are estimates. Financial and business decisions remain entirely at your discretion. ScopeAI recommends consulting a licensed accountant, financial advisor, or lawyer before making significant business decisions.*
---

## LEGAL BOUNDARIES
You CANNOT:
- Give specific legal advice on contracts, disputes, or litigation
- Advise on personal finances unrelated to the business
- Make definitive tax rulings — always say "based on current IRAS guidelines, verify with your accountant"
- Predict market movements or guarantee financial outcomes

When users ask about legal matters say:
"That is a legal question that requires a qualified Singapore lawyer. I can give you general context on how this typically works for Singapore businesses, but please consult a lawyer for your specific situation. You can find one at lawsociety.org.sg/find-a-lawyer."
`;

// ─── Grant Matching ───────────────────────────────────────────────────────────
const GRANT_MATCHING_INSTRUCTIONS = `
## GRANTS
When a user asks about grants or funding:
- Acknowledge that Singapore has strong grant support for their business type
- Mention 1-2 commonly relevant grants (e.g. Startup SG Founder, PSG, EDG) with one line each
- Say: "Your Premium Report includes a full personalised grant breakdown with eligibility, amounts, and application steps."
- Do not go into detail on any grant
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

## FREE CHAT BOUNDARIES � STRICTLY ENFORCED
Never give in free chat:
- Step-by-step roadmaps or week-by-week timelines
- Specific named competitors with pricing
- Detailed financial projections or unit economics
- Full compliance checklists with costs and processing times
- Grant application sequences or stacking strategies
When asked for this depth, give a useful overview then say: "For the full breakdown, that is covered in the Premium Report."

## FREE CHAT BOUNDARIES � STRICTLY ENFORCED
Never give in free chat:
- Step-by-step roadmaps or week-by-week timelines
- Specific named competitors with pricing
- Detailed financial projections or unit economics
- Full compliance checklists with costs and processing times
- Grant application sequences or stacking strategies
When asked for this depth, give a useful overview then say: "For the full breakdown, that is covered in the Premium Report."

## FREE CHAT BOUNDARIES � STRICTLY ENFORCED
Never give in free chat:
- Step-by-step roadmaps or week-by-week timelines
- Specific named competitors with pricing
- Detailed financial projections or unit economics
- Full compliance checklists with costs and processing times
- Grant application sequences or stacking strategies
When asked for this depth, give a useful overview then say: "For the full breakdown, that is covered in the Premium Report."

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
- Cross-check ALL their business details against each grant fine print
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

### 4. PERSONALISED GRANT APPLICATION ROADMAP
Generate a timeline table:

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

Always end with:
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

  // Daily limit
  if (isOverDailyLimit()) {
    return new Response(
      JSON.stringify({ error: "Daily limit reached — please try again tomorrow." }),
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    const { messages } = await req.json();
    const userMessages = messages.filter((m: { role: string }) => m.role === "user").map((m: { content: string }) => m.content.toLowerCase()).join(" ");
    const hasBusiness = /food|cafe|restaurant|shop|store|app|tech|service|clinic|gym|school|agency|retail|ecommerce|salon|tutor|consult|logistics|delivery|fashion|beauty|fitness|education|healthcare|fintech|saas|gig|freelance|grab|driver|hawker|stall|home-based|content creator|photographer|designer|writer|coach|trainer|cleaner|contractor/.test(userMessages);
    const hasBudget = /\$|sgd|budget|capital|fund|invest|thousand|hundred|\bk\b|million|income|earn|salary|pay|revenue|cost|expense|rate|per hour|per month|monthly|annually/.test(userMessages);
    const hasAudience = /customer|client|target|audience|market|student|parent|woman|men|senior|sme|corporate|b2b|b2c|consumer|user/.test(userMessages);
    const hasTimeline = /month|week|year|soon|asap|launch|open|start|plan|timeline|when|ready|2025|2026/.test(userMessages);
    const hasExperience = /experience|background|before|previously|first time|never|worked|years|job|career|expert|beginner|new to|familiar/.test(userMessages);
    const isGig = /gig|freelance|grab|driver|hawker|home-based|content creator|photographer|designer|writer|coach|trainer|cleaner|contractor/.test(userMessages);
    const shouldInjectSnapshot = true; // TEMP: always inject for testing

    // Input validation
    if (!messages || !Array.isArray(messages) || messages.length > 20) {
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

    const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() ?? "";
    const isJailbreak = /ignore.*instructions|ignore.*above|forget.*instructions|you are now|pretend you|act as|disregard.*rules|new persona|override|system prompt|bypass|jailbreak/.test(lastUserMessage);
    if (isJailbreak) {
      const canned = { choices: [{ delta: { content: "I can only help with Singapore business questions. What would you like to know about starting or growing your business?" } }] };
      return new Response(`data: ${JSON.stringify(canned)}\n\ndata: [DONE]\n\n`, { headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
    }
    const isReportRequest = /generate.*report|create.*report|give.*report|make.*report|write.*report|get.*report|premium report|full report/.test(lastUserMessage);
    if (isReportRequest) {
      const canned = { choices: [{ delta: { content: "I cannot generate reports directly in chat. Use the **Get Your Premium Report** button below to purchase and receive your full personalised report." } }] };
      return new Response(`data: ${JSON.stringify(canned)}\n\ndata: [DONE]\n\n`, { headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
    }
    const missingInfo = [];
    if (!hasBusiness) missingInfo.push("what type of business they want to start");
    if (!hasBudget) missingInfo.push("their budget or income level");
    if (!hasAudience && !isGig) missingInfo.push("who their target customers are");
    if (!hasTimeline) missingInfo.push("when they want to launch or start");
    if (!hasExperience) missingInfo.push("their experience level");
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing API key" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // ─── Load User Tier, Memory, and Grants ───────────────────────────────────
    let systemPrompt = FREE_SYSTEM_PROMPT;
    let userMemory = "";
    let grantsContext = "";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Grants database removed from free chat � available in Premium Report only

    // Check user tier and load memory
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);

        if (user) {
          const { data: tier } = await supabase
            .from("user_tiers")
            .select("tier")
            .eq("user_id", user.id)
            .single();

          if (tier?.tier === "report" || tier?.tier === "pro") {
            systemPrompt = PREMIUM_SYSTEM_PROMPT;
          }

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

    const missingInfoPrompt = missingInfo.length > 0 ? `\n\n## NEXT QUESTION TO ASK\nAfter answering, ask about the FIRST item only: ${missingInfo[0]}` : `\n\n## PROFILE COMPLETE\nFocus on answering thoroughly.`;
    const finalSystemPrompt = systemPrompt + userMemory + missingInfoPrompt;

    // ─── Call Anthropic ───────────────────────────────────────────────────────
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 850,
        temperature: 0.3,
        stream: true,
        system: [{ type: "text", text: finalSystemPrompt, cache_control: { type: "ephemeral" } }],
        tools: [{ type: "web_search_20250305", name: "web_search" }],
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
          if (done) {
            if (shouldInjectSnapshot) {
              const marker = { choices: [{ delta: { content: "\n<!-- SNAPSHOT_READY -->" } }] };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(marker)}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }
          buffer += decoder.decode(value, { stream: true });

          let idx;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, idx).replace(/\r$/, "");
            buffer = buffer.slice(idx + 1);
            if (!line.startsWith("data: ")) continue;
            
            const json = line.slice(6).trim();
            if (json === "[DONE]") {
              if (shouldInjectSnapshot) {
                const marker = { choices: [{ delta: { content: "\n<!-- SNAPSHOT_READY -->" } }] };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(marker)}\n\n`));
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
            try {
              const parsed = JSON.parse(json);
              if (parsed.type === "content_block_delta") {
                const text = parsed.delta?.text ?? "";
                if (text) {
                  dailyTokensUsed += 1;
                  const chunk = { choices: [{ delta: { content: text } }] };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                }
              } else if (parsed.type === "message_stop") {
                // handled after loop
              }
            } catch {}
          }
        }
        if (shouldInjectSnapshot) {
            const marker = { choices: [{ delta: { content: "\n<!-- SNAPSHOT_READY -->" } }] };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(marker)}\n\n`));
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































