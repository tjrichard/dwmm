# Supabase MCP Plan - 2026-05-31

## Goal
Add a repo-scoped Supabase MCP configuration and verify that Codex can discover it.

## Plan
1. Confirm Codex MCP config syntax for remote HTTP servers.
2. Add a `supabase` MCP server to `.codex/config.toml` using the official hosted endpoint.
3. Avoid committing tokens or PATs to config.
4. Run `codex mcp list` and `codex mcp get supabase` to confirm discovery.
5. If authentication is required, document the required `codex mcp login supabase` follow-up.
6. Run existing repo gates:
   - `npm run lint`
   - `npm test`
   - `npm run build`
7. Update status documentation.

## Ambiguities / Approval-Relevant Notes
- Supabase OAuth login may require a browser flow and user account selection. I can configure the MCP server, but completing OAuth may require the user to run/approve `codex mcp login supabase` in an interactive terminal.
- Project scoping/read-only mode for the hosted MCP appears to be generated through Supabase's MCP UI. Without the authenticated Supabase UI flow, the safest repo-level config is the generic hosted endpoint plus documentation to authenticate/scope it.
- I will not add Supabase service-role keys or PATs to repo config.

## Test Scenarios
- `codex mcp list` shows `supabase` as enabled.
- `codex mcp get supabase` shows the remote URL and authentication state.
- Existing app gates still pass after config/doc changes.
- No service role key or PAT appears in `.codex/config.toml`.
