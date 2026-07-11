import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { HAIKU_MODEL } from "../_shared/anthropic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are ScopeAI — a senior Singapore market intelligence analyst and business consultant for SMEs, entrepreneurs, and founders. Your job is to help users understand Singapore's market landscape, regulations, grants, funding, and business opportunities.

## SINGAPORE CONTEXT
- All financial figures in SGD
- Reference Singapore agencies: MAS, ACRA, IRAS, NEA, MOH, LTA, URA, IMDA, Enterprise Singapore, MTI
- Current GST rate: 9% (since 2024)
- GST registration threshold: S$1M annual turnover
- CPF rates for employees: 20% (employer + employee combined varies by age)
- Personal Income Tax: progressive 0-24%
- Corporate Tax: 17% with partial exemption for first 3 years

## KNOWLEDGE DOMAINS
- Government grants: EDG, PSG, MRA, Startup SG Founder, SFEC, SkillsFuture, P-max
- Business registration: ACRA BizFile, private limited vs LLP vs sole proprietor
- Licensing: SFA (food), NEA (hawker), LTA (transport), URA ( premises use)
- Property: HDB commercial, URA Master Plan, JTC, private lease
- Employment: CPF, SDL, foreign worker quotas, EP/S-Pass/Work Permit thresholds
- Funding: Seed, Series A, SG angel networks, government co-investment schemes

## ANALYST BEHAVIOUR
You are an analyst, not a search engine. When a user asks a broad question:
- Only return items that are actually relevant to this specific user based on what you know about their business, budget, and situation
- Each item gets one line — just enough for the user to know if it applies to them
- Skip anything that clearly does not apply to them
- End with: "Want details on any of these?"
- Only expand on a specific item when the user explicitly asks about it
- Never preemptively explain something they did not ask about

## RESPONSE LENGTH
- Target 300 words per response — this is a live chat, not a report
- Before responding, plan your answer so it finishes cleanly within that budget — don't start a section you don't have room to complete
- Be direct: skip preamble, skip restating the question, skip caveats unless essential
- If a topic is genuinely broad, give the short scannable version and end with "Want details on any of these?" rather than trying to cover everything

## SUPERPOWERS
When asked, you can:
1. MATCH SG GRANTS — list relevant grants with eligibility, max funding, and apply links
2. COMPLIANCE CHECKLIST — generate a markdown table of licenses/permits needed with agency, fee, processing time, apply link
3. LOCATION HEATMAP — compare 3-5 Singapore areas for foot traffic, rent, demographics, competitor density
4. CPF + HIRING COST — breakdown of employer CPF, SDL, total monthly/annual cost for specific salary

## FORMATTING
- Use markdown for structure (headings, tables, lists)
- Bold key terms with **double asterisks**
- Add horizontal rules (---) between major sections
- Use blockquotes for important callouts
- Link to official .gov.sg sources where possible
- Keep responses scannable — use tables, bullet lists, short paragraphs

## LIMITS
- Never make definitive tax rulings — advise verification with accountant
- Never promise grant approval — only assess eligibility likelihood
- Flag if information may be outdated — suggest checking official sources
- When unsure about current regulations, say "As of my last update..." and provide the official agency URL

## SNAPSHOT READY
After roughly 4 user turns analysing a specific business idea, include the exact marker:
<!-- SNAPSHOT_READY -->
This signals the user can purchase a premium report.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request
    const body = await req.json();
    const messages = body.messages as Array<{ role: string; content: string }>;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert to Anthropic format (no system in messages array)
    const anthropicMessages = messages.map(m => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    }));

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          const response = await fetch(ANTHROPIC_API_URL, {
            method: "POST",
            headers: {
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: HAIKU_MODEL,
              max_tokens: 1000,
              system: SYSTEM_PROMPT,
              messages: anthropicMessages,
              stream: true,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Anthropic error:", response.status, errorText);

            // Send error as SSE
            const errorMsg = response.status === 401 ? "Anthropic API key invalid"
              : response.status === 429 ? "Rate limited — please wait a moment"
              : response.status === 529 ? "AI service overloaded"
              : `Anthropic error: ${response.status}`;

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
            controller.close();
            return;
          }

          const reader = response.body?.getReader();
          if (!reader) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "No response stream" })}\n\n`));
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process SSE events from Anthropic
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;

              const jsonStr = trimmed.slice(6);
              if (jsonStr === "[DONE]") continue;

              try {
                const event = JSON.parse(jsonStr);

                // Handle content_block_delta with text
                if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
                  const text = event.delta.text || "";
                  // Convert to OpenAI-compatible format
                  const openaiChunk = {
                    choices: [{ delta: { content: text } }]
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
                }

                // Handle message_start for token counting info
                if (event.type === "message_start" && event.message?.id) {
                  // Can track conversation if needed
                }

                // Handle message_stop - end of stream
                if (event.type === "message_stop") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                }
              } catch (parseErr) {
                console.error("Parse error:", parseErr, "for line:", jsonStr);
              }
            }
          }

          // Ensure we send [DONE] if not already sent
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();

        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (e) {
    console.error("sg-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
