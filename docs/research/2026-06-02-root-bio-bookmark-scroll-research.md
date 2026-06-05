# Root Bio and Bookmark Scroll Research - 2026-06-02

## Scope
Fix root page repeated Supabase thumbnail 400s by changing `/` to bio, and restore `/bookmarks` infinite scroll after the initial page.

## Findings
- `pages/index.js` currently fetches `getPublicResources({ limit: 36 })`, merges those resources with curated resources, and renders `FigmaResourceLayout`.
- That root resource grid is the source of bookmark thumbnail image requests on `/`.
- The user requested root to become bio, so `/` should render `FigmaProfileLayout` directly and avoid resource fetching.
- `/bookmarks` fetches initial 9 rows and has `observer`/`loadingRef` refs, but the previous `IntersectionObserver` callback is no longer wired to the rendered layout.
- `FigmaResourceLayout` does not currently expose a sentinel slot/ref after the grid.
- `FigmaCard` falls back to Supabase storage URL when `thumbnail` is missing. This is acceptable for numeric bookmark ids, but repeated missing files should be avoided by preferring `bookmarks_public.thumbnail`.
- Runtime verification showed some `bookmarks.thumbnail` values point to missing/blocked storage objects. The UI should settle those cards on fallback images and cache failed src values during the browser session.

## Checks Needed
- `/` renders profile/bio and does not render resource cards or bookmark thumbnail requests.
- `/bookmarks` renders initial 9, then loads more when the sentinel enters view.
- Missing Supabase thumbnail files do not loop indefinitely; failed images should settle on a fallback image.

## Results
- `/` now renders `FigmaProfileLayout` directly and does not fetch public resources.
- `/` runtime check: title `DWMM | Ryan Kim`, profile card count 1, resource card count 0, bookmark image count 0.
- `/bookmarks` runtime check: initial card count 9; after scroll, card count 18.
- Broken Supabase thumbnail image elements switch to Unsplash fallback URLs.
- `FigmaCard` now caches failed image sources in a module-level set so re-renders do not restore the known failed src during the same browser session.
