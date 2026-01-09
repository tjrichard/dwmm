-- Run this SQL in Supabase SQL Editor as a one-time setup.
-- Requires a role with privileges to create tables/policies in schema public.

-- Helper function to auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- BLOG POSTS
create table if not exists public.blog_posts (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  slug text unique,
  title text,
  excerpt text,
  content_markdown text,
  thumbnail text,
  tags text[],
  public boolean not null default false
);

create index if not exists blog_posts_public_idx on public.blog_posts (public);
create index if not exists blog_posts_created_at_idx on public.blog_posts (created_at desc);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'blog_posts_set_updated_at') then
    create trigger blog_posts_set_updated_at
    before update on public.blog_posts
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.blog_posts enable row level security;

-- drops throw if already exist, so ignore if you re-run
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'blog_posts' and policyname = 'blog_posts_select_public'
  ) then
    create policy blog_posts_select_public on public.blog_posts for select using (public = true);
  end if;
end $$;

grant select on table public.blog_posts to anon;

-- PORTFOLIO ENTRIES
create table if not exists public.portfolio_entries (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  slug text unique,
  title text,
  summary text,
  thumbnail text,
  tags text[],
  public boolean not null default false,
  content_blocks jsonb not null default '[]'::jsonb
);

create index if not exists portfolio_entries_public_idx on public.portfolio_entries (public);
create index if not exists portfolio_entries_created_at_idx on public.portfolio_entries (created_at desc);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'portfolio_entries_set_updated_at') then
    create trigger portfolio_entries_set_updated_at
    before update on public.portfolio_entries
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.portfolio_entries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'portfolio_entries' and policyname = 'portfolio_entries_select_public'
  ) then
    create policy portfolio_entries_select_public on public.portfolio_entries for select using (public = true);
  end if;
end $$;

grant select on table public.portfolio_entries to anon;

-- Seed demo data (idempotent)
insert into public.blog_posts (slug, title, excerpt, content_markdown, thumbnail, tags, public)
select * from (
  values
    ('blog-demo-1', '블로그 데모 포스트 1', '이 글은 블로그 데모 1의 요약입니다.', '# 블로그 데모 1\n\n이것은 마크다운 본문 예시입니다.\n\n- 포인트 1\n- 포인트 2\n\n```js\nconsole.log("Hello Blog 1")\n```', 'https://picsum.photos/seed/blog1/800/400', array['design','process'], true),
    ('blog-demo-2', '블로그 데모 포스트 2', '이 글은 블로그 데모 2의 요약입니다.', '# 블로그 데모 2\n\n더 많은 예시 내용과 **강조** 텍스트.\n\n1. 단계 1\n2. 단계 2\n\n> 인용문 예시', 'https://picsum.photos/seed/blog2/800/400', array['b2b','saas'], true)
) as v(slug,title,excerpt,content_markdown,thumbnail,tags,public)
where not exists (select 1 from public.blog_posts p where p.slug = v.slug);

insert into public.portfolio_entries (slug, title, summary, thumbnail, tags, public, content_blocks)
select * from (
  values
    (
      'portfolio-demo-1',
      '포트폴리오 데모 1',
      '다양한 레이아웃과 인터랙션을 시연합니다.',
      'https://picsum.photos/seed/port1/1200/630',
      array['ux','prototype'],
      true,
      jsonb_build_array(
        jsonb_build_object('type','intro','text','이 프로젝트는 복잡한 사용자 흐름을 단순화한 사례입니다.'),
        jsonb_build_object('type','image','src','https://picsum.photos/seed/port1img/900/600','alt','샘플 이미지'),
        jsonb_build_object('type','full_width_image','src','https://picsum.photos/seed/port1full/1600/800','alt','풀폭 이미지'),
        jsonb_build_object(
          'type','tabs',
          'tabs', jsonb_build_array(
            jsonb_build_object('label','Design','content','디자인 의사결정과 와이어프레임.'),
            jsonb_build_object('label','Tech','content','기술 스택과 컴포넌트 구조.')
          )
        ),
        jsonb_build_object('type','demo','embed_html','<div>인터랙티브 데모 Placeholder</div>'),
        jsonb_build_object('type','ascii_image','src','https://picsum.photos/seed/ascii1/400/300','ascii_text', E'@@@@@@\n@@  @@\n@    @\n@@  @@\n@@@@@@'),
        jsonb_build_object(
          'type','scroll_interaction',
          'steps', jsonb_build_array(
            jsonb_build_object('heading','문제 정의','text','핵심 문제를 정의합니다.'),
            jsonb_build_object('heading','가설 수립','text','가설을 세우고 실험을 설계합니다.'),
            jsonb_build_object('heading','결과','text','정량적/정성적 결과를 공유합니다.')
          )
        )
      )
    ),
    (
      'portfolio-demo-2',
      '포트폴리오 데모 2',
      '이미지 to ASCII 토글과 탭 전환 데모.',
      'https://picsum.photos/seed/port2/1200/630',
      array['interaction','ascii'],
      true,
      jsonb_build_array(
        jsonb_build_object('type','intro','text','이미지/ASCII 토글과 레이아웃 실험.'),
        jsonb_build_object('type','ascii_image','src','https://picsum.photos/seed/ascii2/500/375','ascii_text', E'##@@**\n#@* @*\n*  **\n#@**@#'),
        jsonb_build_object(
          'type','tabs',
          'tabs', jsonb_build_array(
            jsonb_build_object('label','Overview','content','요약과 목표'),
            jsonb_build_object('label','Details','content','세부 구현과 피봇 이야기')
          )
        ),
        jsonb_build_object('type','image','src','https://picsum.photos/seed/port2img/900/600','alt','세부 이미지')
      )
    )
) as v(slug,title,summary,thumbnail,tags,public,content_blocks)
where not exists (select 1 from public.portfolio_entries p where p.slug = v.slug);


