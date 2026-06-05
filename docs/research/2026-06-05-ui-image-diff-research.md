# UI Image Diff Research - 2026-06-05

## Scope
Continue the active goal:
1. Update UI component design from screenshot-based diffs.
2. Resolve header component diffs and realtime cursor z-index over header hover.
3. Add `/about` as a page, using a reusable badge component and leaving the profile image empty for a future asset.

## Current Evidence
- Current worktree is clean after main deploy.
- The repo has no accessible files corresponding to prompt references `[Image #1]` through `[Image #6]`.
- Available image files are unrelated generated/reference screenshots under `output/`, public logos, or package images.
- Current shared public layout is implemented in `components/figma/FigmaResourceLayout.js`.
- Current header component is `BottomHeader` inside `FigmaResourceLayout.js`.
- Current cursor layer CSS:
  - `.figma-cursors { z-index: 90; pointer-events: none; }`
  - `.figma-bottom-header { z-index: 90; }`
- Equal z-index can allow stacking-order ambiguity; cursor visibility over header hover should be fixed by raising `.figma-cursors` above header/panel layers while retaining `pointer-events: none`.
- There is no `/about` page file yet. Home uses `FigmaProfileLayout` with `profileNotes`.

## Image Diff Limitation
- The user-provided image references are not available as filesystem artifacts or accessible attachments in the current tool context.
- I can capture current as-is screenshots with Playwright, but cannot compute a faithful pixel diff against the unavailable to-be screenshots.
- Work will proceed on verifiable requirements and produce a diff/status document noting missing to-be image evidence.

## About Page Direction
- Add a dedicated `/about` page.
- Reuse profile content from `data/workspace/generatedEssays.js` where possible.
- Add a reusable badge component for role/skill/status labels.
- Leave profile image area empty as a designed placeholder for a future asset.
