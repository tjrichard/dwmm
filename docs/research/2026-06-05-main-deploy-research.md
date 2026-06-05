# Main Deploy Research - 2026-06-05

## Scope
Deploy the current DWMM work to `main`.

## Current Git State
- Current branch: `main`.
- Remote: `origin https://github.com/tjrichard/dwmm.git`.
- Local `main` is ahead of `origin/main` by existing local commits.
- Worktree includes a broad redesign and cleanup set, including:
  - bottom header / Figma layout work
  - Supabase public config and Suggest fixes
  - Edge Function proxy route
  - bookmarks infinite scroll and thumbnail handling
  - docs/research/plan/status artifacts

## Deployment Interpretation
- User asked to deploy to `main`; for this repo this means commit local changes on the `main` branch and push to `origin/main`.

## Exclusions
- Do not commit `.playwright-cli/` browser artifacts.
- Do not commit runtime secrets from `.env` / `.env.local`; they are not shown in git status and appear ignored.

## Risk Notes
- The worktree has many pending changes from previous steps. Since the user asked to deploy to `main`, the safest interpretation is to push the completed current state rather than cherry-pick only the latest narrow change.
- Before pushing, rerun `npm run lint`, `npm test`, and `npm run build`.
