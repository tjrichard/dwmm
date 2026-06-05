# Goal Cleanup Research - 2026-06-04

## Scope
Handle remaining items 1, 2, 4, 5, and 6:
- Improve `scrape-website` failure handling.
- Fix Suggest panel state mismatch.
- Remove Supabase env mismatch warning.
- Check public Supabase key exposure.
- Run final browser regression.

## Findings
- Supabase MCP auth is working.
- `scrape-website` is active at version 75 and logs show recent `OPTIONS 204` and `POST 400`.
- Public project URL from MCP:
  - `https://lqrkuvemtnnnjgvptnlo.supabase.co`
- Publishable keys from MCP include an enabled legacy anon key for project `lqrkuvemtnnnjgvptnlo`.
- `.env` and `.env.local` currently expose a `service_role` JWT under `NEXT_PUBLIC_SUPABASE_KEY`.
- `lib/supabase.js` supports `NEXT_PUBLIC_SUPABASE_ANON_KEY` and prefers it over publishable/legacy keys when it matches the project.
- The build warning appears when shell or file env supplies mismatched URL/key combinations; replacing the public service-role key with the matching anon key should remove the repo-file source of the warning.
- `FigmaResourceLayout` currently stores `submitOpen` and `askOpen` separately. A single panel mode state is less error-prone.

## Supabase Security Advisors
- `public.bookmarks_public` is flagged as a security definer view.
- Several functions have mutable `search_path`.
- The `vector` extension is installed in `public`.
- Some INSERT policies are permissive.
- `handle_new_user()` is callable by anon/authenticated as a SECURITY DEFINER function.
- Leaked password protection is disabled.

## Edge Function Failure Handling Target
- Validate URL before remote fetch.
- Return a readable `400` for invalid input without trying to fetch `undefined`.
- Add fetch timeouts for source HTML and Gemini calls.
- Retry Gemini transient failures such as `429`, `500`, `502`, `503`, and `504`.
- Keep CORS headers on all responses.
