# Repo Refresh Plan - 2026-05-30

## Objective
Update the local repository with the latest remote state, install dependencies cleanly, and run available validation while preserving existing local work.

## Plan
1. Record baseline repository state and package tooling.
2. Fetch the latest remote refs.
3. Re-check branch divergence after fetch.
4. Integrate `origin/main` into local `main` only if needed and only in a way that preserves local commits and working tree changes.
5. Install dependencies using `pnpm install`, because `pnpm-lock.yaml` is present.
6. Run available validation:
   - Build: `pnpm run build`
   - Lint: report unavailable unless a `lint` script exists.
   - Tests: report unavailable unless a `test` script exists.
7. Repair any failures that are safe and in scope.
8. Update status documentation with commands, results, and remaining risks.

## Test Scenarios
- Dependency install completes without lockfile or peer dependency errors.
- Production build completes successfully.
- Existing local changes remain present after refresh.
- Git status clearly shows any remaining local modifications and generated lockfile changes.

## Approval-Relevant Notes
- Local `main` is currently ahead of `origin/main` by 3 commits, so the safe path is fetch first and avoid reset/rebase unless explicitly requested.
- Both `package-lock.json` and `pnpm-lock.yaml` exist. The selected default is `pnpm`; this can be changed if the user prefers npm.
