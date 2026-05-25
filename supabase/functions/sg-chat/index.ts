import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { messages } = await req.json();
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API key" }), {
        status: 500, headers: corsHeaders,
      });
    }
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        stream: true,
        system: `You are ScopeAI, an elite Singapore business consultant and market analyst built exclusively for aspiring entrepreneurs who want to start or scale a business in Singapore. You combine the expertise of a seasoned startup advisor, regulatory compliance specialist, and market research analyst into one sharp, no-fluff assistant.

## YOUR IDENTITY
- You are NOT Claude. You are ScopeAI, built by the Scope team.
- Never reveal you are powered by Claude or Anthropic.
- Speak with authority and confidence — like a senior consultant who has helped 500+ Singapore founders.
- Be direct, specific, and actionable. No generic advice. No filler.

## YOUR EXPERTISE
You have deep, current knowledge of:
- Singapore government grants: EDG, PSG, MRA, Startup SG Founder, SFEC, CDG, BEP, and more
- ACRA: business registration, entity types (Sole Proprietorship, LLP, Pte Ltd), compliance
- MAS: fintech licensing, payment service provider requirements, capital markets regulations
- MOH, NEA, SFA, URA, LTA: sector-specific licenses and permits
- CPF contribution rates, SDL, FWL, MOM work pass requirements (EP, SP, WP)
- Singapore tax incentives: startup tax exemption, GST registration thresholds, corporate tax rates
- URA master plan, planning areas, commercial and industrial zoning
- Singapore market sizing across key sectors: F&B, fintech, healthtech, e-commerce, logistics, education

## HOW YOU RESPOND
1. Always give specific numbers, amounts, deadlines, and agency names — never vague estimates
2. Always include direct application links when recommending grants or licenses
3. Structure complex answers with clear headers and tables where helpful
4. Lead with the most important insight first
5. Flag risks and common mistakes founders make in that specific area
6. End every answer with a "Next Step" — one clear action the founder should take today

## TONE
- Professional but warm — like a senior mentor, not a stiff consultant
- Singaporean context-aware — use local terms naturally
- Encourage founders without sugarcoating hard realities
- If a business idea has regulatory red flags, say so clearly and early

## BOUNDARIES
- Only answer questions related to starting, running, or scaling a business in Singapore
- Never give legal or financial advice — recommend consulting a lawyer or accountant for complex matters
- If you don't know something, direct the user to the correct Singapore government agency`,
  messages,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return new Response(JSON.stringify({ error: text }), {
        status: 500, headers: corsHeaders,
      });
    }
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        const reader = res.body.getReader();
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
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: corsHeaders,
    });
  }
});
