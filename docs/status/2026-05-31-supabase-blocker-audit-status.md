# Supabase Blocker Audit Status - 2026-05-31

## MCP Findings
- Supabase MCP is active and authenticated.
- Active DWMM project: `lqrkuvemtnnnjgvptnlo`.
- The shell-referenced `cmuyqdfqowzfbwpgrunh` project is not present in the authenticated Supabase project list.
- Bookmark data sources are public views, not missing tables:
  - `bookmarks_public`: 224 rows
  - `bookmark_categories`: 5 rows
  - `bookmark_tags`: 83 rows
  - `bookmark_clicks`: 93 rows
- API logs confirm 200 responses for bookmark item/category/tag/click REST calls.
- Storage logs confirmed many malformed `resource-*` thumbnail paths returning 400.
- `scrape-website` Edge Function is active.

## Repairs
- `lib/supabase.js`
  - Selects Supabase keys by preserving the existing backend project ref.
  - Supports anon/publishable env names when they match the active project.
  - Keeps realtime disabled unless the selected public key is anon or publishable.
  - Provides a shared numeric-only bookmark thumbnail URL helper.
- `components/realtime-cursors.tsx`
  - Uses the shared realtime capability check.
- `components/figma/FigmaResourceLayout.js`
  - Stops generating Supabase storage URLs for non-numeric resource ids.
- `components/ContentCard.js`
  - Uses the shared numeric-only thumbnail helper and a string fallback image.
- `components/bookmark/WebsiteRequestForm.js`
  - Uses `supabase.functions.invoke('scrape-website')` instead of a hardcoded function URL.

## Remaining Blockers
- `.env` and `.env.local` still contain a service-role-looking key under `NEXT_PUBLIC_SUPABASE_KEY`.
- The shell environment can still inject a mismatched `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` pair for `cmuyqdfqowzfbwpgrunh`.
- The correct long-term fix is to rotate/remove the exposed service-role key and set a matching `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for `lqrkuvemtnnnjgvptnlo`.
- Supabase advisor checks were not run because the current exposed MCP tool list did not include `get_advisors`.

## Verification
- `npm run lint`: passed.
- `npm test`: passed.
- `npm run build`: passed.
- Playwright `/bookmarks`:
  - title `DWMM | Bookmarks`
  - realtime cursor mounted
  - `HeroUI: Modern React UI Library` rendered
  - categories `AI`, `Article`, `Website`, `Collection`, `Service` rendered
  - console errors: 0
  - malformed `resource-*` storage image URLs: 0
- Playwright `/`:
  - title `DWMM | Things Worth Visiting`
  - realtime cursor mounted
  - console errors: 0
  - malformed `resource-*` storage image URLs: 0
