# Figma Redesign Plan - 2026-05-30

## Goal
Reconstruct the repo's major pages to match the provided Figma design direction while preserving existing data-backed behavior.

## Plan
1. Establish Figma-derived tokens and common components:
   - editorial shell/layout
   - side rail
   - card grid
   - detail article layout
   - command/submit/ask panel
2. Replace `/` with the Figma-like resource/workspace landing grid.
3. Replace `/works` with the same design system tuned for essays.
4. Replace `/works/[slug]` with the detail/article layout while keeping Notion body rendering.
5. Rework `/bookmarks` to use the new common components while keeping:
   - Supabase bookmark loading
   - website submission
   - realtime cursor
   - click tracking/vote affordance where safe
6. Remove visible login UI from major pages; keep non-visible anonymous mechanisms only when required by existing Supabase actions.
7. Keep LLM/answer behavior mocked.
8. Run validation:
   - `npm run build`
   - report lint unavailable because no `lint` script exists
   - report test unavailable because no `test` script exists
9. Repair failures and update status docs.

## Approval-Relevant Notes
- Full Figma design-context metadata timed out, so implementation will be based on the successful screenshot plus repo content. This is the best available evidence without blocking progress.
- Existing local changes are present and will be preserved.
- The older IDE workspace components may remain in the repo if no route uses them; removing them can be a later cleanup after visual parity is verified.

## Test Matrix
- Home: page loads, cards show images/title/meta, submit panel opens, realtime cursor mounts.
- Works list: page loads with essay cards and routes to detail pages.
- Work detail: article header/body and right-side context panels render without login.
- Bookmarks: filters/search keep working at the page level, and submission remains available.
- Responsive: desktop uses left editorial rail + right content; mobile stacks without text overlap.
- Build: Next production build succeeds.

## Second Pass Plan
1. Add generated persona-backed fallback essays so `/works` is not empty when Notion has no local data.
2. Make fallback essays routeable through `/works/[slug]` with full detail content.
3. Add a Figma-like profile/about surface for `/?node=about-ryan`.
4. Verify homepage, works list, fallback detail, about/profile, and submit/ask panels in browser.
5. Re-run build plus lint/test availability checks and update status.

## Third Pass Plan
1. Replace top navigation plus floating action bar with one fixed bottom header.
2. Put primary navigation in the bottom header: Visiting, Sharing, About.
3. Put Ask and Suggest actions in the same bottom header.
4. Put right-panel open/close at the far right behind a divider.
5. Remove the unclear command menu action from the UI.
6. Raise realtime cursor overlay above the bottom header.
7. Restore Supabase-driven bookmark/category/tag data by deriving the effective Supabase URL from the public JWT ref when the shell-provided URL is mismatched.
8. Re-run build, lint/test availability checks, and browser verification for `/`, `/bookmarks`, and panel/cursor behavior.
