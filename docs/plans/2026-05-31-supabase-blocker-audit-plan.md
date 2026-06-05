# Supabase Blocker Audit Plan - 2026-05-31

## Objective
Use Supabase MCP to list and verify current Supabase-related goal blockers, then repair local code issues that can be fixed without backend schema changes.

## Steps
1. Gather local evidence from docs, env references, and Supabase-related source files. Done.
2. Use Supabase MCP to confirm project identity, bookmark data objects, logs, edge functions, and advisors. Done except advisors, because the current callable tool set did not include `get_advisors`.
3. Classify blockers as backend-confirmed, local-config/code, or no-longer-blocking. Done.
4. Apply narrow code fixes for local blockers that do not require schema or production data changes. Done.
5. Run lint, tests, and build. Done.
6. Update status docs with MCP findings, repairs, and remaining actions. Done.

## Ambiguities Requiring User Approval
- Whether `.env` and `.env.local` should be edited now to remove the public service-role key. This is a secret-handling change; I will report the issue and avoid changing secrets unless explicitly approved.
- Whether Supabase security/performance advisor findings should be fixed immediately. Advisor fixes may include schema/RLS/index changes and should be reviewed before applying migrations.

## Test Scenarios
- `npm run lint` passes.
- `npm test` passes.
- `npm run build` passes.
- MCP confirms the active Supabase project and the existence/counts of bookmark data sources.
- Realtime cursor remains visually mounted locally and only attempts live subscription when a safe public key is available.
- Resource cards no longer generate Supabase thumbnail URLs for non-numeric local curated ids.
- Playwright verifies `/bookmarks` renders live Supabase bookmark/category data with no console errors.
- Playwright verifies `/` and `/bookmarks` have zero `resource-*` Supabase storage image URLs.
