# Supabase MCP Auth Research - 2026-06-04

## Scope
Explain how to resolve Supabase MCP `Auth required` errors in Codex.

## Current Findings
- `.codex/config.toml` contains a repo-scoped Supabase MCP server:
  - `url = "https://mcp.supabase.com/mcp"`
- `codex mcp list` shows Supabase as:
  - `Status: enabled`
  - `Auth: OAuth`
- `codex mcp get supabase` confirms the remote HTTP MCP server is configured.
- Previous successful setup documentation says OAuth login was completed with:
  - `codex mcp login supabase`
- Later MCP tool calls failed with `Auth required`, which indicates the configured server is discovered but the active OAuth session is unavailable, expired, revoked, or not loaded into the current Codex session.

## Likely Causes
- Supabase OAuth token expired or was revoked.
- Codex session started before/without the authenticated MCP state.
- The desktop app or CLI process needs a restart after login.
- Supabase account used for OAuth does not have access to project `lqrkuvemtnnnjgvptnlo`.
- The hosted MCP server is configured generically; project scoping and permissions depend on the authenticated Supabase account.

## Safety Notes
- Do not put Supabase service role keys, PATs, or OAuth tokens into `.codex/config.toml`.
- Keep MCP auth in Codex's external credential store via OAuth.
- App runtime Supabase env vars are separate from MCP OAuth and do not fix MCP `Auth required`.
