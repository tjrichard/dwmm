# Suggest CORS Research - 2026-06-02

## Scope
Fix `scrape-website` Edge Function CORS errors from local development.

## Evidence
- Browser network panel shows `scrape-website` preflight succeeds with `204`, but the actual `fetch` request fails with a CORS error.
- `WebsiteRequestForm.js` now calls the Edge Function directly from the browser.
- The fix likely belongs in the Edge Function response headers, not only the client.
- Supabase MCP calls for `list_edge_functions`, `get_logs`, and `get_edge_function` currently fail with `Auth required`, so the remote function source cannot be retrieved or redeployed from this session.

## Required CORS Behavior
- Allow local development origins dynamically:
  - `http://localhost:*`
  - `http://127.0.0.1:*`
  - `http://[::1]:*`
- Preserve production-safe behavior by allowing configured/known origins or falling back conservatively.
- Apply CORS headers to both preflight and actual responses, including error responses.

## Checks
- Retrieve current `scrape-website` Edge Function source through Supabase MCP.
- Patch the function CORS helper and redeploy through Supabase MCP.
- Verify browser submit no longer fails at CORS.

## Local App Fallback
- Add a same-origin Next API route at `/api/scrape-website`.
- Browser requests call the local API route, avoiding browser CORS entirely for all localhost ports.
- The API route validates the URL, forwards it server-side to the Supabase Edge Function, and returns normalized JSON errors.
