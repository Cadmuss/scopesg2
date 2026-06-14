const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

/** Claude Haiku 4.5 — fast, cost-efficient for news, trends, and chat */
export const HAIKU_MODEL = "claude-haiku-4-5-20251001";

/** Claude Sonnet 4 — premium report generation only */
export const PREMIUM_REPORT_MODEL = "claude-sonnet-4-5-20250929";

/** @deprecated Use HAIKU_MODEL */
export const DEFAULT_ANTHROPIC_MODEL = HAIKU_MODEL;

export type AnthropicTool = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

// ─── Standard Tool Call (no web search) ──────────────────────────────────────
export async function callAnthropicTool<T>(opts: {
  system: string;
  userMessage: string;
  tool: AnthropicTool;
  maxTokens?: number;
}): Promise<T> {
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
      model: HAIKU_MODEL,
      max_tokens: opts.maxTokens ?? 2048,
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

// ─── Two-Step: Web Search then Format ────────────────────────────────────────
export async function callAnthropicWithSearch<T>(opts: {
  system: string;
  userMessage: string;
  tool: AnthropicTool;
  maxTokens?: number;
}): Promise<T> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  // Step 1 — web search to get raw current data
  console.log("Step 1: Running web search...");
  const searchResponse = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: HAIKU_MODEL,
      max_tokens: 1500,
      system: opts.system,
      messages: [{ role: "user", content: opts.userMessage }],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });

  if (!searchResponse.ok) {
    const text = await searchResponse.text();
    console.error("Search step error:", searchResponse.status, text);
    const err = new Error(`Anthropic search error: ${searchResponse.status}`);
    (err as Error & { status?: number }).status = searchResponse.status;
    throw err;
  }

  const searchResult = await searchResponse.json();
  const rawText = searchResult.content
    ?.filter((b: { type: string }) => b.type === "text")
    ?.map((b: { text: string }) => b.text)
    ?.join("") ?? "";

  console.log("Step 1 complete. Raw text length:", rawText.length);

  // If no text returned fall back to userMessage as context
  const context = rawText.length > 50 ? rawText : opts.userMessage;

  // Step 2 — format into structured tool output
  console.log("Step 2: Formatting into structured output...");
  const formatResponse = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: HAIKU_MODEL,
      max_tokens: opts.maxTokens ?? 2048,
      system: opts.system,
      messages: [{
        role: "user",
        content: `Based on this research:\n\n${context}\n\nNow format this into the ${opts.tool.name} tool with 5 items maximum.`
      }],
      tools: [opts.tool],
      tool_choice: { type: "tool", name: opts.tool.name },
    }),
  });

  if (!formatResponse.ok) {
    const text = await formatResponse.text();
    console.error("Format step error:", formatResponse.status, text);
    const err = new Error(`Anthropic format error: ${formatResponse.status}`);
    (err as Error & { status?: number }).status = formatResponse.status;
    throw err;
  }

  const formatResult = await formatResponse.json();
  console.log("Step 2 complete. Content types:", formatResult.content?.map((b: { type: string }) => b.type));

  const toolUse = formatResult.content?.find((block: { type: string }) => block.type === "tool_use");
  if (!toolUse?.input) {
    console.error("No tool_use block. Full response:", JSON.stringify(formatResult));
    throw new Error("No tool_use block in Anthropic response");
  }

  return toolUse.input as T;
}

// ─── Premium Report (Sonnet, plain text) ─────────────────────────────────────
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
    console.error("Anthropic report error:", response.status, text);
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

// ─── Error Response Helper ────────────────────────────────────────────────────
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