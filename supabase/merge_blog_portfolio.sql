-- Merge Blog + Portfolio into a single unified table: public.entries
-- Safe, idempotent-ish migration using IF NOT EXISTS / DO blocks
-- Run in Supabase SQL Editor

BEGIN;

-- 1) Enum for category
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'entry_category'
  ) THEN
    CREATE TYPE public.entry_category AS ENUM ('Blog', 'Portfolio');
  END IF;
END $$;

-- 2) Helper function for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Unified table
CREATE TABLE IF NOT EXISTS public.entries (
  id               bigserial PRIMARY KEY,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  slug             text UNIQUE,
  title            text,
  excerpt          text,        -- short summary for both types
  content_markdown text,        -- blog body
  content_blocks   jsonb NOT NULL DEFAULT '[]'::jsonb, -- portfolio blocks
  thumbnail        text,
  tags             text[],
  public           boolean NOT NULL DEFAULT false,
  category         public.entry_category NOT NULL,
  meta             jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS entries_public_idx     ON public.entries (public);
CREATE INDEX IF NOT EXISTS entries_category_idx   ON public.entries (category);
CREATE INDEX IF NOT EXISTS entries_created_at_idx ON public.entries (created_at DESC);
CREATE INDEX IF NOT EXISTS entries_tags_gin_idx   ON public.entries USING GIN (tags);

-- Trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'entries_set_updated_at'
  ) THEN
    CREATE TRIGGER entries_set_updated_at
    BEFORE UPDATE ON public.entries
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 4) RLS
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='entries' AND policyname='entries_select_public'
  ) THEN
    CREATE POLICY entries_select_public ON public.entries FOR SELECT USING (public = true);
  END IF;
END $$;
GRANT SELECT ON public.entries TO anon;

-- 5) Data migration
-- Blog -> entries
INSERT INTO public.entries (
  slug, title, excerpt, content_markdown, thumbnail, tags, public, category, created_at
) SELECT
  b.slug,
  b.title,
  COALESCE(b.excerpt, NULL),
  b.content_markdown,
  b.thumbnail,
  b.tags,
  b.public,
  'Blog'::public.entry_category,
  b.created_at
FROM public.blog_posts b
ON CONFLICT (slug) DO NOTHING;

-- Portfolio -> entries
INSERT INTO public.entries (
  slug, title, excerpt, content_blocks, thumbnail, tags, public, category, created_at
) SELECT
  p.slug,
  p.title,
  COALESCE(p.summary, NULL),
  p.content_blocks,
  p.thumbnail,
  p.tags,
  p.public,
  'Portfolio'::public.entry_category,
  p.created_at
FROM public.portfolio_entries p
ON CONFLICT (slug) DO NOTHING;

-- 6) Backward-compat: rename old tables and create views with original names
-- Rename only if real tables (not already views)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname='blog_posts' AND relkind='r') THEN
    ALTER TABLE public.blog_posts RENAME TO blog_posts_legacy;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname='portfolio_entries' AND relkind='r') THEN
    ALTER TABLE public.portfolio_entries RENAME TO portfolio_entries_legacy;
  END IF;
END $$;

-- Create compatibility views
CREATE OR REPLACE VIEW public.blog_posts AS
SELECT
  id,
  created_at,
  updated_at,
  slug,
  title,
  excerpt,
  content_markdown,
  content_markdown AS content, -- alias for old code paths
  thumbnail,
  tags,
  public
FROM public.entries
WHERE category = 'Blog';

CREATE OR REPLACE VIEW public.portfolio_entries AS
SELECT
  id,
  created_at,
  updated_at,
  slug,
  title,
  excerpt AS summary,
  thumbnail,
  tags,
  public,
  content_blocks
FROM public.entries
WHERE category = 'Portfolio';

GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT ON public.portfolio_entries TO anon;

COMMIT;

-- Notes:
-- - If you want to fully drop the legacy tables, review data then DROP TABLE *_legacy.
-- - If any slug collisions occur, adjust slugs or add a migration to de-duplicate.
-- - Application can now read from unified public.entries, or continue using the compatibility views.


