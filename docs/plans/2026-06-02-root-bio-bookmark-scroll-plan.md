# Root Bio and Bookmark Scroll Plan - 2026-06-02

## Objective
- Make root `/` a bio page.
- Stop root `/` from requesting bookmark thumbnails.
- Restore `/bookmarks` infinite scroll beyond the first fetched bookmarks.

## Steps
1. Replace root resource grid/data fetching with `FigmaProfileLayout`. Done.
2. Add an optional footer/sentinel slot to `FigmaResourceLayout`. Done.
3. Wire `/bookmarks` IntersectionObserver to that sentinel and increment pages while `hasMore` is true. Done.
4. Ensure image fallback does not repeatedly request broken Supabase thumbnail URLs. Done.
5. Run lint/test/build and browser checks for `/` and `/bookmarks`. Done.

## Test Scenarios
- `/` title is Ryan bio/profile and card count is 0. Passed.
- `/` has no `/storage/v1/object/public/assets/bookmarks/` image URLs. Passed.
- `/bookmarks` starts with 9 cards and grows after scrolling to the sentinel. Passed: 9 to 18.
- `/bookmarks` console errors remain 0 after scrolling. Passed.
- `npm run lint`, `npm test`, and `npm run build` pass. Passed.
