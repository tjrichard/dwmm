# Suggest Edge Function Error Research - 2026-06-02

## Scope
Debug the Suggest form runtime error for URL `https://theladylearner.com/3039/`.

## Current Evidence
- `WebsiteRequestForm` calls `supabase.functions.invoke('scrape-website', { body: { url } })`.
- The UI throws a generic Korean error when `edgeFunctionError` is returned.
- `scrape-website` was previously confirmed as an active Supabase Edge Function with `verify_jwt: false`.
- The user encountered the error at `components/bookmark/WebsiteRequestForm.js:91`.

## Checks Needed
- Inspect current Supabase Edge Function logs.
- Inspect `scrape-website` source if available through MCP.
- Compare `supabase.functions.invoke` with a direct `fetch` call to the function endpoint.
- Reproduce with `https://theladylearner.com/3039/`.
- Decide whether the fix belongs in client invocation, error handling, or Edge Function behavior.

## Test Scenarios
- Submitting `https://theladylearner.com/3039/` does not throw an unhandled runtime error.
- If the Edge Function returns a recoverable scrape failure, the form shows a useful inline message.
- If the Edge Function succeeds, the thank-you state appears.
- `npm run lint`, `npm test`, and `npm run build` pass.
