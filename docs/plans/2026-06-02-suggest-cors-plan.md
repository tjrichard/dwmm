# Suggest CORS Plan - 2026-06-02

## Objective
Update the Supabase `scrape-website` Edge Function so localhost origins work during development.

## Steps
1. Create research/plan docs.
2. Fetch current function source/logs with Supabase MCP.
3. If MCP auth is available, add dynamic CORS origin logic for localhost, 127.0.0.1, and ::1.
4. If MCP auth is unavailable, route browser requests through a same-origin Next API proxy.
5. Ensure all app-visible responses return structured JSON errors.
6. Verify Suggest from local browser.
7. Run local lint/test/build and update status.

## Test Scenarios
- Preflight returns CORS headers for `http://localhost:3000`.
- Actual function response includes matching `Access-Control-Allow-Origin`.
- Suggest form no longer reports a browser CORS error.
- Browser network shows `/api/scrape-website` instead of direct Supabase function calls.
- `npm run lint`, `npm test`, and `npm run build` pass.
