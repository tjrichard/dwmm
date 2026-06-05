# Goal Continuation Status - 2026-06-01

## Supabase
- Applied Supabase migration `add_thumbnail_to_bookmarks_public`.
- `public.bookmarks_public` now exposes `thumbnail` from `public.bookmarks.thumbnail`.
- MCP verification:
  - `bookmarks_public.thumbnail` exists as column 10.
  - recent rows return thumbnail URLs for ids 342, 341, 340, 339, and 338.
  - `bookmark_categories`: 5 rows.
  - `bookmark_tags`: 83 rows.
  - public bookmarks with thumbnails: 222.

## Code Changes
- `pages/bookmarks/index.js`
  - selects `thumbnail` in initial SSG and client pagination queries.
  - continues using `bookmark_categories` and `bookmark_tags` as the full filter source.
- `lib/publicResources.js`
  - selects `thumbnail` from `bookmarks_public`.
- `lib/workspace.js`
  - preserves `thumbnail` during bookmark/resource normalization.
- `components/figma/FigmaResourceLayout.js`
  - no longer truncates provided category/tag lists.
  - uses `/logo.svg` through the shared logo mark.
- `components/realtime-cursors.tsx`
  - rotates on `.cursor-pointer`, links, buttons, inputs, selects, textareas, summaries, role-based controls, and focusable elements.
- `lib/supabase.js`
  - keeps `NEXT_PUBLIC_SUPABASE_KEY` supported as the public key path.

## Notion
- Existing configured Notion works fetch succeeded.
- Fetch returned 5 pages from the works datasource.
- First fetched page properties included `thumbnail`, `meta`, `createdAt`, `category`, `summary`, `slug`, `status`, `publishedAt`, `tags`, and `title`.
- Runtime `/works` rendered 4 Notion-sourced cards, not generated fallback cards.

## Verification
- `npm run lint`: passed.
- `npm test`: passed.
- `npm run build`: passed.
- Playwright `/bookmarks`:
  - title `DWMM | Bookmarks`.
  - rendered `HeroUI: Modern React UI Library`.
  - card image URLs came from Supabase Storage thumbnail URLs.
  - malformed `resource-*` storage image URLs: 0.
  - topic buttons: 5.
  - tag buttons: 83.
  - logo image srcs: `/logo.svg`.
  - cursor transform over an interactive filter button: `translate(-100%, 0px) rotate(90deg)`.
  - console errors: 0.
- Playwright `/works`:
  - title `DWMM | Essays`.
  - rendered 4 Notion-sourced cards.
  - logo image srcs: `/logo.svg`.
  - console errors: 0.

## Notes
- Build still prints server-side Supabase URL/key mismatch warnings because the shell environment can override the repo `.env` URL. The app continues using the project URL encoded in the selected Supabase key.
