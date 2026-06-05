# Supabase MCP Status - 2026-05-31

## Completed
- Added research doc:
  - `docs/research/2026-05-31-supabase-mcp-research.md`
- Added plan doc:
  - `docs/plans/2026-05-31-supabase-mcp-plan.md`
- Added repo-scoped Supabase MCP server config:
  - `.codex/config.toml`
  - server name: `supabase`
  - transport: streamable HTTP
  - URL: `https://mcp.supabase.com/mcp`
- Confirmed Codex discovers the server with:
  - `codex mcp list`
  - `codex mcp get supabase`
- Completed OAuth login with:
  - `codex mcp login supabase`
  - result: `Successfully logged in to MCP server 'supabase'.`

## Verification
- `codex mcp get supabase` reports:
  - `enabled: true`
  - `transport: streamable_http`
  - `url: https://mcp.supabase.com/mcp`
- The current assistant tool list does not hot-reload newly added MCP tools mid-session. A new Codex session/reload is likely required before Supabase MCP tools appear as callable tools in this chat.

## Security Notes
- No Supabase PAT, service-role key, or OAuth token was committed to repo config.
- OAuth state is managed by Codex outside the repo.
- `.env` and `.env.local` still contain sensitive-looking Supabase keys from the existing project state; this task did not add or expose new secrets there.
