# Supabase MCP Auth Plan - 2026-06-04

## Objective
Restore Supabase MCP access so Codex can call Supabase tools such as logs, migrations, SQL, and Edge Function deploys.

## Plan
1. Confirm MCP server discovery with `codex mcp list` and `codex mcp get supabase`.
2. Re-run OAuth login with `codex mcp login supabase`.
3. Complete the browser authorization flow with a Supabase account that has access to project `lqrkuvemtnnnjgvptnlo`.
4. Restart the active Codex session or app so MCP tools reload with the fresh OAuth credential.
5. Verify by calling a low-risk Supabase MCP tool:
   - `get_project`
   - `list_edge_functions`
   - `get_logs`
6. If OAuth still fails, remove and re-add the MCP server, then repeat login:
   - `codex mcp remove supabase`
   - `codex mcp add --transport streamable-http supabase https://mcp.supabase.com/mcp`
   - `codex mcp login supabase`

## Ambiguities / User Approval Needed
- OAuth opens an interactive browser/account-selection flow. The user should choose the Supabase account and organization that owns `lqrkuvemtnnnjgvptnlo`.
- If the account lacks project access, an organization owner/admin must grant access in Supabase.
- I should not store long-lived secrets in repo files as a workaround.

## Test Scenarios
- `codex mcp list` still shows `supabase` enabled with OAuth.
- Supabase MCP `get_project` succeeds for `lqrkuvemtnnnjgvptnlo`.
- Supabase MCP `list_edge_functions` succeeds and includes `scrape-website`.
- Supabase MCP `get_logs` no longer returns `Auth required`.
