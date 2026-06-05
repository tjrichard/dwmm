# Goal Cleanup Plan - 2026-06-04

## Objective
Complete remaining cleanup items 1, 2, 4, 5, and 6.

## Plan
1. Document research and plan.
2. Replace public `NEXT_PUBLIC_SUPABASE_KEY` service-role values in `.env` and `.env.local` with `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Update `lib/supabase.js` to reject service-role keys for public client selection.
4. Refactor `FigmaResourceLayout` panel state to a single `panelMode`.
5. Redeploy `scrape-website` with URL validation, source fetch timeout, Gemini timeout, and retry handling.
6. Run `npm run lint`, `npm test`, and `npm run build`.
7. Run browser regression for:
   - `/` root bio page.
   - `/bookmarks` initial data.
   - infinite scroll loads more bookmarks.
   - Suggest opens/closes correctly.
   - Suggest submit does not CORS fail.
   - bottom header panel toggle opens/closes.
   - realtime cursor layer stays mounted over bottom header.
   - thumbnail fallback does not create repeated failing requests.
8. Update status docs and goal status.

## Ambiguities / Approval-Relevant Notes
- The exposed service-role key cannot be rotated from code. After local removal, the user should rotate it in Supabase Dashboard.
- Advisor findings are broader than this goal. I will list them and fix only the public env exposure unless a small, clearly safe change is necessary for this goal.
- The app can keep `/api/scrape-website` even after Edge Function CORS is fixed because it centralizes error normalization.

## Test Scenarios
- Build output no longer prints Supabase URL/key mismatch warnings from repo env values.
- `canUseSupabaseRealtime()` does not allow service-role keys.
- Suggest panel cannot have Ask/Suggest both open or stale active state.
- Invalid direct Edge Function payload returns a readable validation error.
- A transient Gemini error returns a normalized message after retries instead of generic runtime failure.
- Browser regression completes without CORS console errors.
