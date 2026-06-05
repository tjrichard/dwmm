# Scrape Edge CORS Retry Status - 2026-06-04

## Result
- Supabase MCP auth is working again.
- Retrieved `scrape-website` Edge Function through MCP.
- Confirmed previous function version had `Access-Control-Allow-Origin` hardcoded to `http://localhost:3000`.
- Redeployed `scrape-website` with dynamic CORS handling.

## Deployment
- Project: `lqrkuvemtnnnjgvptnlo`
- Function: `scrape-website`
- Previous version observed: `74`
- Deployed version: `75`
- `verify_jwt`: preserved as `false`
- Entrypoint: `index.ts`

## CORS Behavior
- Allowed production origins:
  - `https://dwmm.site`
  - `https://www.dwmm.site`
  - `https://dwmm.vercel.app`
- Dynamically allowed local origins:
  - `http://localhost:*`
  - `https://localhost:*`
  - `http://127.0.0.1:*`
  - `https://127.0.0.1:*`
  - `http://[::1]:*`
  - `https://[::1]:*`
- CORS headers are applied to:
  - `OPTIONS` preflight responses
  - successful `POST` responses
  - error `POST` responses
  - method-not-allowed responses

## Remote Verification
- `OPTIONS` with `Origin: http://localhost:5173` returned:
  - HTTP `204`
  - `access-control-allow-origin: http://localhost:5173`
  - `access-control-allow-methods: GET, POST, OPTIONS`
  - `access-control-allow-headers: Content-Type, Authorization, apikey, x-client-info`
- `POST` error case with `Origin: http://localhost:5173` returned:
  - HTTP `400`
  - `content-type: application/json`
  - `access-control-allow-origin: http://localhost:5173`

## Local Verification
- `npm run lint`: passed.
- `npm test`: passed.
- `npm run build`: passed.

## Notes
- The app still uses `/api/scrape-website` as a same-origin proxy, which remains useful for consistent local and production client behavior.
- The Edge Function can still return app-level errors such as invalid input or Gemini API failures, but those responses now include CORS headers for localhost origins.
