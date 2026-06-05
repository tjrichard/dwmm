# Main Deploy Status - 2026-06-05

## Result
- Prepared current `main` branch for deployment.
- Created commit:
  - `feat: deploy figma redesign and supabase cleanup`
  - Confirm exact hash with `git rev-parse HEAD`.

## Verification Before Commit
- `npm run lint`: passed.
- `npm test`: passed.
- `npm run build`: passed.

## Build Notes
- Build succeeded.
- Non-blocking warnings observed:
  - Next.js plugin was not detected in ESLint configuration.
  - Notion API request timeout warning during page data collection.

## Commit Scope
- Figma-style public layout and bottom navigation.
- Root bio page.
- Supabase-backed bookmarks with infinite scroll.
- Suggest form proxy and error normalization.
- Supabase public key handling cleanup.
- Realtime cursor and panel interaction fixes.
- Documentation, research, plans, and status records.

## Exclusions
- `.env` and `.env.local` remain ignored.
- `.playwright-cli/` browser artifacts are ignored and not committed.

## Push
- Pushed `main` to `origin/main`.
- Range pushed: `aa380cc..f89bf8b`.
- Push output: `main -> main`.
