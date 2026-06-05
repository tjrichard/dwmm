# Figma Redesign Status - 2026-05-30

## Completed This Pass
- Used Figma MCP screenshot for `ryaYNH95WFKzU3543LFv50`, node `597:12770`.
- Added Figma redesign research and plan docs:
  - `docs/research/2026-05-30-figma-redesign-research.md`
  - `docs/plans/2026-05-30-figma-redesign-plan.md`
- Added shared Figma-inspired components:
  - `components/figma/FigmaResourceLayout.js`
  - `styles/components/_figmaRedesign.scss`
- Reworked major routes to use the new shared visual system:
  - `/`
  - `/works`
  - `/works/[slug]`
  - `/bookmarks`
- Removed visible Google login/sign-out controls from the bookmark header.
- Kept website submission reachable through the shared `Suggest` panel.
- Kept realtime cursor component mounted as an overlay so it no longer disrupts page layout.
- Kept Notion CMS data flow for works routes.
- Added mocked Ask behavior in the shared command panel.

## Validation
- `npm run build`: passed.
- `npm run lint`: unavailable, `package.json` has no `lint` script.
- `npm test`: unavailable, `package.json` has no `test` script.
- Local dev server: running at `http://localhost:3002` because port `3000` was already occupied.
- Playwright visual checks:
  - `/`: verified Figma-like left rail + right card grid after fixing cursor overlay layout.
  - `/works`: verified Figma-like shell and empty Notion state.
  - Suggest panel: verified it opens and contains the website submission form.

## Remaining Risks / Next Pass
- Figma MCP metadata and design-context calls timed out on the full node, so implementation is screenshot-driven rather than exact layer-driven.
- Realtime Supabase websocket currently logs authentication failures in local dev. The cursor remains visually mounted, but live multi-user presence depends on valid realtime credentials/config.
- `/works` showed no Notion posts in the current local data state, so detail-page visual verification needs either live Notion content or a fixture slug.
- `.playwright-cli/` contains prior and current local verification artifacts and remains untracked.

## Second Pass Update
- Added generated persona-backed essays in `data/workspace/generatedEssays.js`.
- `/works` now falls back to generated essays when Notion returns no posts.
- `/works/[slug]` now supports generated fallback essay detail pages.
- `/?node=about-ryan` now renders a Figma-like profile/about surface instead of the resource grid.
- Removed public Google login remnants:
  - deleted `components/GoogleSignIn.js`
  - deleted `contexts/AuthContext.js`
  - changed `/auth/callback` into a no-op public redirect page
- Realtime cursor now skips Supabase websocket subscription when the public Supabase URL/key pair is mismatched or not an anon project pair, while keeping the visual cursor layer mounted. With a valid anon config, it still subscribes to realtime presence.
- `/bookmarks` now avoids client Supabase refetch when the local public Supabase URL/key pair is unusable and falls back to curated resources, preserving the page and submit flow in local/dev.
- `/side-hustle` now uses the same Figma-inspired common layout and a local-first emoji translator prototype instead of the old header/footer page.
- Legacy `/works-portfolio-backup` routes now render through the same Figma-inspired components and generated essay content.
- Removed remaining unused Google/auth helper files and auth-dependent utilities:
  - `components/GoogleScript.js`
  - `components/SubscribeForm.js`
  - `lib/auth.js`
  - `lib/voteUtils.js`
- Legacy click/vote helper components no longer request Supabase auth user state.
- Removed old Google fallback button styling from `styles/components/_button.scss`.

## Second Pass Validation
- `npm run build`: passed.
- `npm run lint`: unavailable, `package.json` has no `lint` script.
- `npm test`: unavailable, `package.json` has no `test` script.
- Final build after backup-route/auth cleanup: passed.
- Search audit for public auth implementation: no remaining `supabase.auth`, Google sign-in component, auth context, or sign-in helper references in active source. `/auth/callback` remains only as a no-op compatibility page saying sign-in was removed.
- Playwright checks:
  - `/works`: generated essay cards render.
  - `/works/workflow-ui-operating-system`: generated detail article renders with right context labels.
  - `/?node=about-ryan`: profile/about view renders.
  - `/bookmarks`: Figma-like bookmark grid renders with curated fallback resources under the current invalid local Supabase env pair.
  - `/side-hustle`: Figma-like side-project page and local emoji translator render.
  - Ask panel opens and shows mocked answer text.

## Completion Audit
- Figma MCP used: yes, screenshot obtained for provided file/node; metadata/design-context timed out on the large node and is documented.
- Main route `/`: rebuilt with Figma-like editorial rail, card grid, tokens, submit, Ask mock, and realtime cursor overlay.
- Works route `/works`: rebuilt with common layout and generated fallback content when Notion is empty.
- Detail route `/works/[slug]`: rebuilt with centered article and right-side context labels; supports Notion and generated fallback detail.
- Bookmarks route `/bookmarks`: rebuilt with common layout, website submission preserved, and live Supabase path retained when config is usable.
- Side-hustle route `/side-hustle`: rebuilt with common layout.
- Backup portfolio routes: rebuilt with common layout for compatibility.
- About/profile route `/?node=about-ryan`: rebuilt as a profile/detail surface matching the Figma profile-frame direction.
- Design tokens: implemented in `styles/components/_figmaRedesign.scss` and shared by all rebuilt routes.
- Common components: implemented in `components/figma/FigmaResourceLayout.js`.
- Login removal: visible login removed, public auth helpers deleted, auth callback converted to a no-op public redirect.
- LLM response: mocked in the shared Ask panel without model calls.
- Missing content: generated persona-backed essays/profile/side-project content added.
- Existing functions preserved:
  - website submission remains available through `WebsiteRequestForm` in `Suggest`
  - realtime cursor visual layer remains mounted and uses Supabase realtime when public config is valid
  - Notion CMS fetch paths remain in `/works`, `/works/[slug]`, and works APIs

## Current Remaining Risks
- Exact Figma layer metadata remains unavailable due MCP timeout on the provided large node.
- Local Notion access currently returns `object_not_found`; generated content keeps the designed route usable until the Notion integration/database sharing is fixed.
- Live Supabase-backed bookmarks/realtime require a matching public Supabase URL and anon key. The current shell environment overrides `NEXT_PUBLIC_SUPABASE_URL` to a different project than the key.

## Third Pass Update
- Replaced the previous top navigation/floating command action pattern with a fixed bottom navigation header.
- Bottom header now owns primary navigation:
  - `Visiting` -> `/`
  - `Sharing` -> `/works`
  - `About` -> `/?node=about-ryan`
- Bottom header now owns `Ask` and `Suggest` actions.
- Right panel open/close now sits at the far right of the bottom header behind a divider.
- Removed the unclear command menu from active Figma-layout pages.
- Raised the realtime cursor overlay above the bottom header:
  - `.figma-cursors` z-index: `90`
  - `.figma-bottom-header` z-index: `50`
  - cursor overlay keeps `pointer-events: none`
- Restored live Supabase bookmark/category/tag loading:
  - `getStaticProps` queries `bookmarks_public`, `bookmark_categories`, and `bookmark_tags`
  - initial bookmark payload is limited to the first page with `.range(0, ITEMS_PER_PAGE - 1)`
  - shared Figma layout now accepts externally provided category/tag lists so `/bookmarks` can show Supabase category/tag tables instead of only first-page-derived filters
- Added Supabase URL/key mismatch handling in `lib/supabase.js` so local shell URL conflicts use the project ref encoded in `NEXT_PUBLIC_SUPABASE_KEY`.

## Third Pass Validation
- `npm run build`: passed.
- `npm run lint`: failed because `package.json` has no `lint` script.
- `npm test`: failed because `package.json` has no `test` script.
- Playwright `/bookmarks` at `http://localhost:3003/bookmarks`:
  - page loaded with 0 console errors and 1 warning
  - warning is the expected Supabase URL/key mismatch warning
  - rendered real Supabase bookmark items including `HeroUI: Modern React UI Library`, `Claude Code at Intercom`, and `Gumloop`
  - rendered Supabase-backed topic buttons: `AI`, `Article`, `Website`, `Collection`, `Service`
  - rendered 18 Supabase-backed tag buttons in the current UI limit
  - bottom header rendered `DWMM`, `Visiting`, `Sharing`, `About`, `Ask`, `Suggest`, and `Open panel`
  - clicking `Open panel` opened the mocked Ask panel and changed the far-right control to `Close panel`
  - computed browser styles confirmed cursor overlay above header: cursor z-index `90`, header z-index `50`, cursor pointer-events `none`, and one local cursor mounted

## Fourth Pass Update
- Removed unused legacy workspace shell and command menu implementation from active source:
  - `components/workspace/FloatingCommandBar.js`
  - `components/workspace/WorkspaceCanvas.js`
  - `components/workspace/WorkspaceInspector.js`
  - `components/workspace/WorkspaceShell.js`
  - `components/workspace/WorkspaceTree.js`
  - `styles/components/_workspace.scss`
- Removed unused legacy top header/bookmark header implementation:
  - `components/header.js`
  - `components/bookmark/Header.js`
  - `styles/layout/_header.scss`
  - `styles/layout/_bookmarkHeader.scss`
  - `styles/components/_tab.scss`
- Removed those legacy stylesheet imports from `styles/main.scss`.
- Source audit now finds no active occurrences of:
  - `FloatingCommand`
  - `Command Menu`
  - `command-palette`
  - `workspace-status-command`
  - `WorkspaceShell`
  - `BookmarkHeader`
  - `header-container`
  - `tab-container`
  - `supabase.auth`
  - `GoogleSignIn`
  - `AuthContext`
  - `ensureAuthenticated`
  - `Sign in`
  - `로그인`

## Fourth Pass Validation
- `npm run build`: passed after deleting legacy command/header code.
- `npm run lint`: failed because `package.json` has no `lint` script.
- `npm test`: failed because `package.json` has no `test` script.
- Playwright smoke checks after cleanup:
  - `/`: title `DWMM | Things Worth Visiting`, bottom header present, old top/header/command selectors absent, 230 cards, one cursor mounted
  - `/works`: title `DWMM | Essays`, bottom header present, old top/header/command selectors absent, 3 generated/Notion-backed cards
  - `/bookmarks`: title `DWMM | Bookmarks`, bottom header present, old top/header/command selectors absent, 9 live Supabase cards, topics `AI|Article|Website|Collection|Service`, 18 visible tag buttons
  - `/side-hustle`: title `DWMM | Side Hustle`, bottom header present, old top/header/command selectors absent, local side-tool UI present
- Each Playwright check showed 0 console errors and 1 expected Supabase URL/key mismatch warning.

## Fifth Pass Update
- Reduced unnecessary page-data payload after dev validation surfaced Next.js page-data warnings on `/` and `/works`.
- `lib/publicResources.js` now accepts an optional `{ limit }` argument and applies a Supabase `.range(0, limit - 1)` when provided.
- `/` now requests the first 36 live public resources plus curated in-repo resources, keeping the Figma grid useful while sending users to `/bookmarks` for the full Supabase-backed index.
- `/works` no longer fetches or serializes public resources because that route only renders essays.

## Fifth Pass Validation
- `npm run build`: passed.
- `npm run lint`: failed because `package.json` has no `lint` script.
- `npm test`: failed because `package.json` has no `test` script.
- Playwright/dev smoke checks:
  - `/`: 0 console errors, 1 expected warning, bottom header present, old top/header/command selectors absent, 42 cards after payload limiting
  - `/works`: 0 console errors, 1 expected warning, bottom header present, old top/header/command selectors absent, 3 cards
- Dev server logs for `/` and `/works` no longer show the previous Next.js `data for page ... exceeds the threshold of 128 kB` warnings.

## Sixth Pass Update
- Reduced `/works/[slug]` props payload:
  - removed unused `essays` prop
  - replaced full `resources` prop with `relatedResourceCount`
  - limited related resource lookup to 12 public resources
  - removed an unnecessary `getPublishedPosts()` call from detail `getStaticProps`
- Removed external font stylesheet imports from `styles/base/_typography.scss`:
  - `https://static.toss.im/tps/main.css`
  - `https://static.toss.im/tps/others.css`
  - `https://fonts.googleapis.com/...Instrument+Serif`
- Typography now uses local/system font fallbacks so local validation does not depend on external font CSS availability.
- Source audit now finds no active occurrences of the removed external font imports or old command/header/auth implementation terms.

## Sixth Pass Validation
- `npm run build`: passed.
- `npm run lint`: failed because `package.json` has no `lint` script.
- `npm test`: failed because `package.json` has no `test` script.
- Playwright checks at `http://localhost:3004`:
  - `/works/workflow-ui-operating-system`: 0 console errors, 1 expected Supabase warning, detail article present, right notes present, bottom header present, old top/header/command selectors absent, cursor mounted, source label `Generated workspace note`, related resource count `12`
  - `/?node=about-ryan`: 0 console errors, 1 expected Supabase warning, profile card present, right notes present, bottom header present, old top/header/command selectors absent, cursor mounted
  - `/`: 0 console errors, 1 expected Supabase warning, `Suggest` opens `WebsiteRequestForm` with URL input and far-right header control changes to `Close panel`
  - `/`: `Ask` opens the mocked `Ask archive` panel with mocked answer text and no model call
  - `/auth/callback`: loads the sign-in removed compatibility page and redirects to `/`; no Google sign-in UI is present after redirect
- Dev server logs still show local Notion `object_not_found` warnings because the configured Notion database is not shared with the integration. The generated fallback keeps the route usable, and Notion CMS fetch paths remain in place.

## Seventh Pass Update
- Added executable verification gates:
  - `npm run lint` -> `eslint .`
  - `npm test` -> `node scripts/verify-figma-redesign.mjs`
- Added `eslint.config.mjs` for local syntax linting without adding new dependencies.
- Added `scripts/verify-figma-redesign.mjs`, a focused redesign invariant test that checks:
  - legacy login/header/workspace-command files remain removed
  - Figma common layout, bottom header, Suggest form, realtime cursor, and mocked Ask panel remain wired
  - `/bookmarks` still queries Supabase bookmark/category/tag tables
  - Notion detail rendering paths remain wired
  - old command/header/auth strings do not return in active redesigned sources
  - external font CSS imports stay removed
- Removed the obsolete `react-hooks/exhaustive-deps` disable comment from `components/SearchBar.js` so lint can run without the React Hooks ESLint plugin.
- Limited Supabase config mismatch warnings to server-side execution. Browser console validation no longer receives the Supabase URL/key mismatch warning.

## Seventh Pass Validation
- `npm run lint`: passed.
- `npm test`: passed with `Figma redesign verification passed.`
- `npm run build`: passed.
  - Build still reports a Next.js ESLint plugin detection warning because `eslint-config-next` is not installed in the current dependency tree.
  - Build still logs server-side Supabase URL/key mismatch warnings under the current shell env; the effective URL fallback remains active.
- Playwright `/` at `http://localhost:3004`:
  - browser console errors: 0
  - browser console warnings: 0
  - bottom header present
  - old top/header/command selectors absent
  - 42 cards rendered
  - one realtime cursor mounted
- Dev server logs still show local Notion `object_not_found`; this remains an external database-sharing/config issue rather than a removed Notion path.

## Eighth Pass Update
- Expanded `scripts/verify-figma-redesign.mjs` to cover:
  - bottom header navigation targets
  - right-panel toggle icons and divider styling
  - home/profile route wiring
  - works/generated fallback wiring
  - side-hustle and backup route Figma layout wiring
- Removed temporary bookmark debug logging from `pages/bookmarks/index.js`, keeping error logging only.
- Kept Supabase mismatch warnings server-side only. Build workers still print the warning because each worker has its own process/global state, but browser console validation is clean.

## Eighth Pass Validation
- `npm run lint`: passed.
- `npm test`: passed with `Figma redesign verification passed.`
- `npm run build`: passed.
  - Build still reports the Next.js ESLint plugin detection warning because `eslint-config-next` is not installed.
  - Build still logs server-side Supabase URL/key mismatch warnings under the current shell env, while using the key-derived effective URL.
- Playwright `/bookmarks` at `http://localhost:3005`:
  - browser console errors: 0
  - browser console warnings: 0
  - bottom header present
  - old top/header/command selectors absent
  - 9 live Supabase cards rendered
  - topics: `AI|Article|Website|Collection|Service`
  - 18 visible tag buttons
  - one realtime cursor mounted

## Current Completion Audit - 2026-05-31
- Proven complete in current worktree:
  - Figma MCP was used and a screenshot from the provided file/node was obtained.
  - `/`, `/works`, `/works/[slug]`, `/bookmarks`, `/side-hustle`, backup works routes, and `/?node=about-ryan` use the Figma-inspired shared components/tokens.
  - Bottom header owns primary navigation and panel actions; old top/header/command UI is removed from active source.
  - Right panel toggle sits in the bottom header and is divider-separated.
  - Realtime cursor overlay renders above the bottom header and remains pointer-transparent.
  - `/bookmarks` loads bookmark items, categories, and tags from Supabase tables and renders real current data in local validation.
  - Website submission remains available through `WebsiteRequestForm` in `Suggest`.
  - Ask/LLM behavior is deterministic mock UI with no model call in the Figma layout.
  - Login UI and auth helper implementation are removed; `/auth/callback` is a public compatibility redirect.
  - Generated fallback essays/profile content preserve the intended persona when Notion returns no local data.
  - Executable gates now pass: `npm run lint`, `npm test`, and `npm run build`.
- Not fully externally proven:
  - Exact Figma layer metadata/design-context remains unavailable because the full node timed out through Figma MCP; current implementation is screenshot-driven.
  - Local Notion live data cannot be proven because the configured Notion database currently returns `object_not_found`; code paths for Notion CMS remain wired and generated fallback keeps the redesigned pages usable.
  - The current shell has a Supabase URL/key project mismatch; the app derives the effective URL from the public key and live bookmark validation succeeds, but the env should still be corrected to remove server warnings.

## Ninth Pass External Evidence Check
- Re-tried Figma MCP metadata at the file level to reduce the earlier full-node timeout risk.
- Result: Figma MCP returned a Starter plan tool-call limit error, so additional metadata/layer extraction is currently blocked by the external Figma MCP plan limit.
- The implementation remains based on the successful earlier Figma screenshot plus repo content and browser validation.
- This does not invalidate the local implementation evidence, but it prevents stronger exact-layer proof until the MCP limit resets or the Figma plan/tool access changes.
