## No changes required

`supabase/functions/sg-chat/index.ts` already satisfies every requirement:

- Reads the key via `Deno.env.get("ANTHROPIC_API_KEY")` (line 14) and 500s if missing.
- Calls `https://api.anthropic.com/v1/messages` directly — no Lovable AI gateway involved, so no Lovable AI credits are consumed.
- Uses model `claude-haiku-4-5-20251001` (line 29).
- Sends `stream: true` (line 31).
- Translates Anthropic SSE events into OpenAI-compatible chunks: each `content_block_delta` is re-emitted as `data: {"choices":[{"delta":{"content":"..."}}]}\n\n`, and the stream terminates with `data: [DONE]\n\n` (lines 63–75).
- Response is returned with `Content-Type: text/event-stream` and CORS headers (lines 80–86).

The `ANTHROPIC_API_KEY` secret is already configured in the project.

### Verdict
No-Go on edits. The function is already in the requested state. If you'd like, I can instead:
1. Add input validation (cap message count / total characters) for hardening, or
2. Add a quick smoke test against the deployed function to confirm streaming end-to-end.

Let me know if you want either, otherwise nothing to ship here.