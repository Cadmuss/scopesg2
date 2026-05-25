const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

/** Claude Haiku 4.5 — AI analyst, market news, and market trends. */
export const HAIKU_MODEL = "claude-haiku-4-5-20251001";

/** @deprecated Use HAIKU_MODEL */
export const DEFAULT_ANTHROPIC_MODEL = HAIKU_MODEL;

/** Claude Sonnet 4 — premium report generation only (`generate-report`). */
export const PREMIUM_REPORT_MODEL = "claude-sonnet-4-20250514";

export type AnthropicTool = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

export async function callAnthropicTool<T>(opts: {
  system: string;
  userMessage: string;
  tool: AnthropicTool;
  maxTokens?: number;
}): Promise<T> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const model = HAIKU_MODEL;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 4096,
      system: opts.system,
      messages: [{ role: "user", content: opts.userMessage }],
      tools: [opts.tool],
      tool_choice: { type: "tool", name: opts.tool.name },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Anthropic API error:", response.status, text);
    const err = new Error(`Anthropic API error: ${response.status}`);
    (err as Error & { status?: number }).status = response.status;
    throw err;
  }

  const result = await response.json();
  const toolUse = result.content?.find((block: { type: string }) => block.type === "tool_use");
  if (!toolUse?.input) throw new Error("No tool_use block in Anthropic response");
  return toolUse.input as T;
}

/** Premium report only — always Claude Sonnet 4. */
export async function callAnthropicReportText(opts: {
  system: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: PREMIUM_REPORT_MODEL,
      max_tokens: opts.maxTokens ?? 8192,
      system: opts.system,
      messages: [{ role: "user", content: opts.userMessage }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Anthropic API error:", response.status, text);
    const err = new Error(`Anthropic API error: ${response.status}`);
    (err as Error & { status?: number }).status = response.status;
    throw err;
  }

  const result = await response.json();
  const parts = (result.content ?? [])
    .filter((block: { type: string }) => block.type === "text")
    .map((block: { text: string }) => block.text);
  const combined = parts.join("");
  if (!combined) throw new Error("No text content in Anthropic response");
  return combined;
}

export function anthropicErrorResponse(
  status: number,
  corsHeaders: Record<string, string>,
): Response {
  if (status === 429) {
    return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (status === 529) {
    return new Response(JSON.stringify({ error: "AI service is temporarily overloaded." }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ error: "AI service error" }), {
    status: 500,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
