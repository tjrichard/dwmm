# Supabase Blocker Audit Research - 2026-05-31

## Scope
List current Supabase-related goal blockers and re-check them with the installed Supabase MCP.

## Local Evidence To Reconcile
- Repo MCP config includes `supabase` at `https://mcp.supabase.com/mcp`.
- `.env` and `.env.local` point to project ref `lqrkuvemtnnnjgvptnlo`.
- `.env` and `.env.local` expose a service-role-looking JWT through `NEXT_PUBLIC_SUPABASE_KEY`.
- Prior shell environment evidence showed `NEXT_PUBLIC_SUPABASE_URL` pointing to `cmuyqdfqowzfbwpgrunh`, which conflicted with the key/project used by repo files.
- App code currently reads only `NEXT_PUBLIC_SUPABASE_KEY`, not `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `components/realtime-cursors.tsx` only enables realtime presence when the public key JWT role is `anon`.
- Bookmark data paths query `bookmarks_public`, `bookmark_categories`, `bookmark_tags`, and `bookmark_clicks`.
- Some UI code hardcodes Supabase storage/function URLs for `lqrkuvemtnnnjgvptnlo`.

## MCP Checks
- List authenticated Supabase projects: `lqrkuvemtnnnjgvptnlo` is active DWMM; `paciwppbxvkfycvatnng` is inactive; `cmuyqdfqowzfbwpgrunh` is not in the authenticated project list.
- Confirm public schema tables/views for bookmark data: `bookmarks_public`, `bookmark_categories`, `bookmark_tags`, and `bookmark_clicks` are public views.
- Count bookmark view records:
  - `bookmarks_public`: 224
  - `bookmark_categories`: 5
  - `bookmark_tags`: 83
  - `bookmark_clicks`: 93
- Sample recent records include `HeroUI: Modern React UI Library`, `Claude Code at Intercom`, and `Gumloop`.
- API logs show successful REST reads for `bookmarks_public`, `bookmark_categories`, `bookmark_tags`, and `bookmark_clicks`.
- Storage/API logs showed repeated 400s for malformed paths like `/assets/bookmarks/resource-342/thumbnail.webp` and `/assets/bookmarks/resource-service-blueprints/thumbnail.webp`.
- Realtime logs returned no recent errors.
- Edge Functions include active `scrape-website` and `fetch-bookmark-sample`; `scrape-website` currently has `verify_jwt: false`.
- The current callable Supabase MCP tool set in this session did not expose `get_advisors`, so advisor findings were not fetched in this audit.

## Preliminary Blocker Hypotheses
1. Local/public env keys are inconsistent and unsafe for browser use.
2. Realtime cursor subscription is disabled when only a service-role key is available in `NEXT_PUBLIC_SUPABASE_KEY`.
3. Bookmark/category/tag backend objects may be views rather than tables, so table-only inspection can look falsely missing.
4. Storage thumbnail URL fallback may generate invalid Supabase paths for non-numeric curated resource ids.
5. Website submission hardcodes the project URL instead of using the configured Supabase client/function endpoint.

## Confirmed Blocker Status
- Still blocking: public Supabase environment configuration is inconsistent. The shell can inject `cmuyqdfqowzfbwpgrunh`, while the active MCP-backed DWMM project is `lqrkuvemtnnnjgvptnlo`.
- Still blocking: `.env` and `.env.local` contain a service-role-looking key under a `NEXT_PUBLIC_` name. Code now preserves the existing backend path, but the secret should be rotated/replaced with an anon or publishable key.
- Resolved in code: local pages no longer generate Supabase storage URLs for `resource-*` ids.
- Resolved by MCP evidence: bookmark item/category/tag/click views exist and have data.
- Resolved in code: website submission now invokes the configured Supabase Edge Function through the Supabase client instead of a hardcoded function URL.
