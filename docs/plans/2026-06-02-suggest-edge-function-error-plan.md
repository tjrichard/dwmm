# Suggest Edge Function Error Plan - 2026-06-02

## Objective
Fix the Suggest form failure for `https://theladylearner.com/3039/` and prevent generic runtime crashes.

## Steps
1. Gather local form/Supabase client context and write research/plan docs.
2. Use Supabase MCP logs/source to understand the Edge Function failure.
3. Reproduce the request directly from local tooling.
4. Patch the client or function invocation with the smallest correct change.
5. Run lint/test/build and runtime submit verification.
6. Update status docs.

## Ambiguities
- If the remote site blocks scraping, the app should surface a clear recoverable message rather than crashing.
- If the Edge Function requires a different payload shape or CORS/auth behavior, the client should call it accordingly.
