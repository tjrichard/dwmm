-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store Notion pages for context and backlinking
create table if not exists notion_pages (
  id uuid primary key default gen_random_uuid(),
  notion_id text not null unique,
  url text,
  title text,
  summary text,
  embedding vector(768), -- Gemini embedding dimension is usually 768
  para_category text, -- Project, Area, Resource, Archive
  tags text[],
  last_updated timestamp with time zone default now()
);

-- Create a function to search for similar pages
create or replace function match_notion_pages (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  notion_id text,
  title text,
  summary text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    notion_pages.id,
    notion_pages.notion_id,
    notion_pages.title,
    notion_pages.summary,
    1 - (notion_pages.embedding <=> query_embedding) as similarity
  from notion_pages
  where 1 - (notion_pages.embedding <=> query_embedding) > match_threshold
  order by notion_pages.embedding <=> query_embedding
  limit match_count;
end;
$$;
