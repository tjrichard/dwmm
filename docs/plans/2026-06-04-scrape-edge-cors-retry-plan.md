# Scrape Edge CORS Retry Plan - 2026-06-04

## Objective
Patch and redeploy the Supabase `scrape-website` Edge Function so localhost origins receive CORS headers consistently.

## Plan
1. Confirm Supabase MCP auth now works.
2. Retrieve `scrape-website` source and recent Edge Function logs.
3. Add or update a dynamic CORS origin helper.
4. Ensure all `Response` paths include the computed CORS headers.
5. Redeploy through Supabase MCP with the previous JWT verification setting preserved.
6. Verify with direct `OPTIONS` and `POST` calls from local tooling where possible.
7. Run repo lint/test/build and update status docs.

## Ambiguities / Approval-Relevant Notes
- If the function has multiple files, all returned files must be redeployed together.
- If MCP auth still fails, the remaining blocker is outside app code and requires Codex/Supabase OAuth session repair.
- I will preserve the existing `verify_jwt` setting unless the retrieved function metadata indicates otherwise.

## Test Scenarios
- MCP `list_edge_functions` succeeds.
- `scrape-website` deploy succeeds.
- `OPTIONS /functions/v1/scrape-website` with `Origin: http://localhost:3000` returns `Access-Control-Allow-Origin: http://localhost:3000`.
- `POST` with the same origin returns an app-level response rather than browser-style CORS failure.
- `npm run lint`, `npm test`, and `npm run build` pass.
