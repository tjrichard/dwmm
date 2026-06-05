# Goal Continuation Plan - 2026-06-01

## Objective
Make the requested end state true:
- Bookmark list images use `bookmarks.thumbnail`.
- Category and tag filters use full `bookmark_categories` and `bookmark_tags` results.
- `NEXT_PUBLIC_SUPABASE_KEY` remains supported as the public anon key.
- Cursor image rotates on interactive hover using the previous `.cursor-pointer` behavior plus native interactive elements.
- Logo rendering uses `public/logo512.png` or `public/logo.svg`.
- `/works` uses Notion data from the configured data source.

## Steps
1. Inspect current bookmark, cursor, logo, and works implementation. Done.
2. Use Supabase MCP to verify bookmark table thumbnail data and category/tag views. Done.
3. Add `thumbnail` to `bookmarks_public` and verify the view. Done.
4. Fetch Notion data through existing local code paths to verify current access. Done.
5. Edit code for the requested data and UI behavior. Done.
6. Run lint, tests, build, and browser/runtime checks. Done.
7. Update status docs with results and remaining blockers if any. Done.

## Ambiguities Requiring Approval
- If `bookmarks.thumbnail` contains storage paths instead of absolute URLs, I will preserve the existing value as the source of truth and only fall back when empty.
- If Notion returns `object_not_found`, I will keep the live Notion path wired and report the access/config issue rather than fabricating completion.

## Test Scenarios
- Supabase MCP shows `bookmarks.thumbnail` values for rendered rows. Passed.
- Supabase MCP shows `bookmarks_public.thumbnail`. Passed.
- `/bookmarks` renders images whose source comes from bookmark `thumbnail` when present. Passed.
- `/bookmarks` renders full category/tag options from `bookmark_categories` and `bookmark_tags`. Passed.
- Cursor rotates over `.cursor-pointer`, links, buttons, inputs, and role-based interactive elements. Passed for an interactive filter button.
- Header/wordmark uses `/logo.svg` or `/logo512.png`. Passed with `/logo.svg`.
- `/works` fetch path reaches the configured Notion data source. Passed.
- `npm run lint`, `npm test`, and `npm run build` pass. Passed.
