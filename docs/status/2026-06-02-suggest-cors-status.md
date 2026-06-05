# Suggest CORS Status - 2026-06-02

## Result
- Added `pages/api/scrape-website.js` as a same-origin Next API proxy for the Supabase `scrape-website` Edge Function.
- Updated `components/bookmark/WebsiteRequestForm.js` to call `/api/scrape-website` instead of calling the Supabase function directly from the browser.
- Normalized nested Edge Function error payloads so the UI receives a readable string instead of `[object Object]`.
- Updated the CORS research and plan docs with the MCP auth blocker and fallback implementation.

## Supabase MCP
- Attempted `list_edge_functions`, `get_logs`, and `get_edge_function` for project `lqrkuvemtnnnjgvptnlo`.
- All three MCP calls failed with `Auth required`, so the remote Edge Function could not be read or redeployed in this session.

## Verification
- `npm run lint`: passed.
- `npm test`: passed.
- `npm run build`: passed.
- Playwright browser submit observed a single `POST http://localhost:3000/api/scrape-website` request.
- Playwright observed no `scrape-website` request failures and no CORS console messages.
- Direct local API call returned structured JSON: `{"error":"Gemini API 호출 실패: 503 Service Unavailable"}` with HTTP 400.

## Remaining Issue
- The original scrape request now reaches the Edge Function, but the Edge Function can still fail because its Gemini API call returns `503 Service Unavailable`.
- In one Playwright session, the Suggest button appeared active while the submit panel stayed closed after reload; this is a separate panel state issue and not part of the CORS request path.
