import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-3-5-haiku-latest";

/**
 * Clean message formatting for Anthropic
 */
function formatMessages(messages: any[]) {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role,
      content: String(m.content || "").trim(),
    }));
}

/**
 * Memory builder (lightweight version)
 */
async function buildMemory(supabase: any, userId: string) {
  try {
    const { data: conversations } = await supabase
      .from("chat_conversations")
      .select("title")
      .eq("user_id", userId)
      .order("last_message_at", { ascending: false })
      .limit(5);

    if (!conversations?.length) return "";

    return `
## User Memory (Recent Context)
${conversations.map((c: any) => `- ${c.title}`).join("\n")}
`;
  } catch {
    return "";
  }
}

/**
 * Stream converter (Anthropic → SSE)
 */
function stream(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let split;
        while ((split = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, split);
          buffer = buffer.slice(split + 2);

          const lines = chunk.split("\n");
          let data = "";

          for (const line of lines) {
            if (line.startsWith("data:")) {
              data = line.replace("data:", "").trim();
            }
          }

          if (!data || data === "[DONE]") continue;

          try {
            const json = JSON.parse(data);
            const text = json?.delta?.text;

            if (text) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    choices: [{ delta: { content: text } }],
                  })}\n\n`
                )
              );
            }
          } catch {}
        }
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- Auth (optional memory) ---
    let memory = "";
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (token) {
      const { data } = await supabase.auth.getUser(token);

      if (data?.user?.id) {
        memory = await buildMemory(supabase, data.user.id);
      }
    }

    // --- System prompt (clean analyst) ---
    const system = `
You are SG Pulse Analyst.

You are a critical Singapore-focused startup and policy analyst.
Be structured, honest, and concise.

Rules:
- No emojis
- No fluff
- No tables unless explicitly requested
- Focus on Singapore + SEA relevance
- Be direct about risks and feasibility
${memory}
`;

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system,
        messages: formatMessages(messages),
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      const err = await response.text();
      console.error(err);
      return new Response("AI error", { status: 500 });
    }

    return new Response(stream(response.body), {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});