# Root Bio and Bookmark Scroll Status - 2026-06-02

## Changes
- Replaced root `/` resource index with the bio/profile layout.
- Removed root resource and Notion fetching from `pages/index.js`, so root no longer triggers bookmark thumbnail requests.
- Added `gridFooter` support to `FigmaResourceLayout` for layout-owned sentinel content.
- Restored `/bookmarks` infinite scroll with an `IntersectionObserver` sentinel.
- Reduced duplicate initial `/bookmarks` page-1 refetches.
- Added image fallback state and failed-image cache in `FigmaCard` so missing Supabase thumbnails settle on fallback images instead of returning to the broken URL on re-render.

## Verification
- `npm run lint`: passed.
- `npm test`: passed.
- `npm run build`: passed.
- Playwright `/`:
  - title `DWMM | Ryan Kim`.
  - profile card count: 1.
  - resource card count: 0.
  - bookmark storage image count: 0.
  - root network requests did not include bookmark thumbnail calls.
- Playwright `/bookmarks`:
  - initial card count: 9.
  - after scrolling to bottom: 18.
  - broken thumbnails switched to fallback image URLs.
  - console errors: 0.

## Notes
- Some `bookmarks.thumbnail` values still point to missing/blocked storage objects in Supabase. The UI now degrades those individual cards to fallback images; fixing the actual storage objects would remove even the first failed image request.
