# UI Image Diff Plan - 2026-06-05

## Objective
Move toward the requested screenshot-based UI/header/about update despite unavailable image attachments.

## Plan
1. Create research/plan docs.
2. Capture current as-is screenshots for `/`, `/bookmarks`, and header hover state.
3. Record screenshot-diff limitations because `[Image #1]` through `[Image #6]` are not accessible in the current workspace/tool context.
4. Fix header/realtime cursor z-index deterministically.
5. Create a reusable badge component.
6. Add `/about` page using the badge component and an empty profile image placeholder.
7. Update header About navigation to `/about`.
8. Run lint/test/build.
9. Verify with Playwright screenshots and console checks.
10. Update status docs.

## Ambiguities / Approval-Relevant Notes
- Exact visual matching to Image #1-#6 requires those screenshots to be reattached or added to the repo.
- Without the images, I will not claim pixel-diff completion.
- I will implement the concrete requirements that can be verified now: `/about`, reusable badge, and cursor/header layering.

## Test Scenarios
- `/about` loads as its own page.
- `/about` includes an empty profile image placeholder.
- `/about` uses the reusable badge component.
- Bottom header `About` link points to `/about`.
- Cursor layer remains visually above bottom header controls.
- `npm run lint`, `npm test`, and `npm run build` pass.
