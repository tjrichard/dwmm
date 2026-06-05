# Main Deploy Plan - 2026-06-05

## Objective
Commit the current completed DWMM state and push it to `origin/main`.

## Plan
1. Create deployment research and plan docs.
2. Verify git branch, remote, and dirty state.
3. Exclude generated browser artifacts from commit.
4. Run:
   - `npm run lint`
   - `npm test`
   - `npm run build`
5. Stage the intended source and documentation changes.
6. Commit with a deployment-oriented message.
7. Push `main` to `origin/main`.
8. Update deployment status documentation.

## Ambiguities
- There is no separate deployment command configured in this request. I will treat `main` push as the deployment trigger.
- If Vercel/GitHub deployment is connected to `origin/main`, the push should trigger it.

## Test Scenarios
- Lint passes.
- Test script passes.
- Build passes.
- `git push origin main` succeeds.
- Final status records commit hash and any build warnings.
