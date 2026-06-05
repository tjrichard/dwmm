# Figma Redesign Research - 2026-05-30

## Objective
- Rebuild the major DWMM pages to follow the provided Figma design.
- Use Figma MCP as the design source.
- Remove visible login flows.
- Keep website submission, realtime cursors, and Notion CMS content paths available.
- Mock LLM answer behavior for now.

## Figma Evidence
- File key: `ryaYNH95WFKzU3543LFv50`
- Node: `597:12770`
- Figma MCP metadata and design-context calls timed out on the full node after 120 seconds.
- Figma MCP screenshot succeeded at `1024x438` from original `4585x1912`.
- Screenshot observations:
  - Main/list page uses a very light off-white background with restrained black text.
  - Left column is editorial and typographic: `Things, Worth Visiting` / `Things, Worth Sharing`, search input, small tags, and category labels.
  - Content is a masonry-like card grid with compact black pill labels, rounded image thumbnails, serif display numbering, title, and tiny meta/action labels.
  - Detail/profile view uses a centered Korean profile/article block and narrow right-side note panels.
  - Overall style is minimal, spacious, text-led, and editorial rather than IDE/dashboard-like.

## Current Repo Evidence
- Next.js pages router is used.
- Major public routes currently include `/`, `/works`, `/works/[slug]`, and `/bookmarks`.
- `/` and `/works` currently render `WorkspaceShell`, an IDE-like three-panel workspace that diverges from the Figma screenshot.
- `pages/bookmarks/index.js` still renders the older bookmark UI with a bookmark header/LNB/content grid and anonymous auth initialization.
- `_app.js` does not wrap the app with `AuthProvider`, so visible auth state is already mostly isolated to bookmark components.
- `WorkspaceInspector` calls `/api/ask-workspace`; that API can be kept as a mock for LLM-style answers.
- Supabase/Notion integrations exist and should remain in data-fetching paths:
  - `getPublishedPosts` for Notion essays.
  - `getPublicResources` for submitted/public resources.
  - `WebsiteRequestForm` for website submission.
  - `RealtimeCursors` for realtime cursor presence.

## Design Direction
- Replace the IDE shell visual language with Figma-like editorial surfaces.
- Create common design primitives under `components/figma/`.
- Add design tokens in a dedicated SCSS module and use those tokens across common components.
- Keep data source behavior conservative: no destructive changes to Supabase/Notion APIs.

## Ambiguities
- The Figma node contains several frames, but full metadata timed out, so exact layer names and token values are unavailable.
- The portfolio owner name in the screenshot appears Korean; current repo content identifies the profile as Ryan Kim. Use the current repo persona while adopting Figma layout.
- Exact image assets from Figma are not available through the screenshot alone. Use existing bookmark thumbnails where available and curated fallback image URLs for mock/static content.

## Test Scenarios
- `/` renders a Figma-like editorial resource grid and uses public resource data.
- `/works` renders a Figma-like editorial essay grid with Notion-sourced essays.
- `/works/[slug]` renders detail content with a centered article body and right-side context panels.
- Website submission remains reachable from the command/submit panel.
- Realtime cursor component remains mounted on the main public surfaces.
- Login/sign-in buttons are not visible on redesigned major pages.
- LLM-style Ask UI returns deterministic mocked answers without requiring external model calls.
- `npm run build` completes.
- Lint/test are reported unavailable unless scripts exist.

## Second Pass Findings
- `/works` can be empty when Notion returns no posts in local/dev state. The user explicitly allowed generating missing content from the provided persona, so fallback essays should be treated as design/content scaffolding.
- The provided Figma screenshot includes a profile/detail frame; current `/ ?node=about-ryan` navigation still lands on the resource grid because the home route ignores `node`.
- A stronger completion state needs routeable fallback detail pages and a profile view using the same tokens/components.

## Third Pass Findings
- User clarified the navigation header should live at the bottom, not at the top.
- The floating action bar should become the bottom header/nav. The current `Menu` command action is unclear and should be removed.
- The right-side panel open/close control should live at the far right of the bottom header, separated by a divider.
- Realtime cursor is hidden when hovering over the bottom header because the cursor overlay z-index is lower than the floating action/header layer.
- Bookmarks, categories, and tags must continue to come from Supabase as before. Current local shell env has a Supabase URL/key mismatch, but the public key itself encodes the intended project ref, so the client can derive the effective project URL from the key when needed instead of falling back to static curated data.
