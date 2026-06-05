# Scrape Edge CORS Retry Research - 2026-06-04

## Scope
Retry direct Supabase Edge Function modification after the user completed Supabase MCP OAuth.

## Known Context
- The browser CORS failure was avoided locally by routing Suggest through `/api/scrape-website`.
- The remote `scrape-website` Edge Function still should be fixed so direct localhost calls work.
- Previous MCP calls failed with `Auth required`.
- User reports Supabase MCP auth has now been completed.

## Target Behavior
- `OPTIONS` requests return `204` with matching CORS headers.
- Actual `POST` responses include CORS headers on success and failure.
- Local development origins are allowed dynamically:
  - `http://localhost:*`
  - `http://127.0.0.1:*`
  - `http://[::1]:*`
- Existing production origins should continue to work.

## Research Steps
- Verify MCP access with low-risk calls.
- Fetch current `scrape-website` function source.
- Locate its CORS helper/response creation.
- Deploy a minimally scoped CORS patch.
