# Goal Cleanup Status - 2026-06-04

## Completed Scope
- Item 1: Improved `scrape-website` Edge Function failure handling.
- Item 2: Fixed Suggest/right panel state and bottom-header toggle interaction.
- Item 4: Removed Supabase URL/key mismatch from repo env path.
- Item 5: Removed public service-role key exposure from repo env files and documented remaining security work.
- Item 6: Ran browser regression for root, bookmarks, infinite scroll, Suggest, panel toggle, realtime cursor layer, and thumbnail request behavior.

## Edge Function
- Function: `scrape-website`
- Project: `lqrkuvemtnnnjgvptnlo`
- Latest deployed version: `77`
- Preserved `verify_jwt: false`.
- Added:
  - early URL validation
  - readable validation errors
  - HTML fetch timeout
  - Gemini timeout
  - Gemini retry for transient `429`, `500`, `502`, `503`, `504`
  - CORS headers on every response path
  - thumbnail DB update only after screenshot upload succeeds
- Remote invalid payload verification:
  - HTTP `400`
  - `access-control-allow-origin: http://localhost:5173`
  - body: `{"error":{"message":"URL is required.","name":"BookmarkError","step":"validateUrl"}}`

## Supabase Env / Security
- Replaced public service-role env usage with anon key values:
  - `NEXT_PUBLIC_DWMM_SUPABASE_URL`
  - `NEXT_PUBLIC_DWMM_SUPABASE_ANON_KEY`
  - matching generic `NEXT_PUBLIC_SUPABASE_URL`
  - matching generic `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Updated `lib/supabase.js` so service-role JWTs are rejected for public client selection.
- Added `NEXT_PUBLIC_DWMM_SUPABASE_*` precedence to prevent unrelated shell env from overriding this app's Supabase project.
- Confirmed no `service_role` / `NEXT_PUBLIC_SUPABASE_KEY=` remains in `.env`, `.env.local`, or `lib/supabase.js`.
- Remaining manual security action: rotate the previously exposed service-role key in Supabase Dashboard.

## Database Cleanup
- Cleared broken thumbnail URLs for bookmark IDs `336` and `340`.
- Removed frontend id-based thumbnail URL guessing; cards now use DB `thumbnail` only when present, otherwise fallback images.

## UI Fixes
- Refactored `FigmaResourceLayout` panel state to a single `panelMode`.
- Raised bottom header z-index above scrim so `Close panel` remains clickable.
- Updated `scripts/verify-figma-redesign.mjs` to assert the corrected bottom-header layer.

## Browser Regression
- `/`: title `DWMM | Ryan Kim`, profile layout present, no cards on root bio page, cursor layer present.
- `/bookmarks`: 9 initial cards.
- Infinite scroll: 9 -> 18 cards.
- Suggest panel: opens one dialog and bottom toggle shows `Close panel`.
- Bottom toggle: closes Suggest, opens Ask, closes Ask.
- Suggest submit mock: `/api/scrape-website` returned `200`, thank-you state displayed.
- Console errors: `0`.
- Thumbnail failed requests after fix: `0` observed in request list.
- Supabase project request now goes to `lqrkuvemtnnnjgvptnlo`, not the previous shell-env project.

## Local Gates
- `npm run lint`: passed.
- `npm test`: passed.
- `npm run build`: passed.
- Build no longer prints `Supabase URL/key project mismatch detected`.
- Build still has existing non-blocking warnings:
  - Next.js ESLint plugin not detected.
  - Large page data warning for `/works/8-things-keep-in-mind-as-b2b-product-designer_2`.

## Remaining Security Advisor Findings
- `bookmarks_public` is flagged as a security definer view.
- Several DB functions have mutable `search_path`.
- `vector` extension is installed in `public`.
- Some INSERT policies are permissive.
- `handle_new_user()` is callable by anon/authenticated as a SECURITY DEFINER function.
- Leaked password protection is disabled.
