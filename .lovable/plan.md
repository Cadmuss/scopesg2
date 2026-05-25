## Smoke test plan for `sg-chat`

Use `supabase--curl_edge_functions` to POST a minimal payload to the deployed `sg-chat` function and confirm the SSE stream comes back in OpenAI-compatible format.

### Request
- Path: `/sg-chat`
- Method: `POST`
- Body: `{"messages":[{"role":"user","content":"Say hello in 5 words."}]}`

### Pass criteria
1. HTTP 200 with `Content-Type: text/event-stream`.
2. Response body contains multiple `data: {"choices":[{"delta":{"content":"..."}}]}` chunks.
3. Stream terminates with `data: [DONE]`.
4. Concatenated `delta.content` values form a coherent short reply (proves Anthropic actually streamed tokens, not just an error).

### If it fails
- Non-200 / JSON error body → check `supabase--edge_function_logs` for `sg-chat` and report the Anthropic error (bad key, model name, rate limit).
- 200 but no `data:` chunks → SSE translation bug; re-read `index.ts`.
- Report the outcome back; no code changes unless a failure is found.