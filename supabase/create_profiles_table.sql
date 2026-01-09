-- Create a table for public profiles
create table public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/database/postgres/row-level-security for more details.
alter table profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check ((select auth.uid()) = id);

create policy "Users can update own profile." on profiles
  for update using ((select auth.uid()) = id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
create function public.handle_new_user()
returns trigger
set search_path = ''
as $$
begin
  -- Google OAuth에서 제공하는 사용자 정보를 처리
  -- Google ID 토큰에서 추출된 정보를 raw_user_meta_data에서 가져옴
  insert into public.profiles (
    id, 
    full_name, 
    avatar_url,
    username
  )
  values (
    new.id, 
    -- Google에서 제공하는 이름 정보 (여러 필드에서 시도)
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'given_name',
      split_part(new.email, '@', 1) -- 이메일에서 사용자명 추출
    ),
    -- Google에서 제공하는 아바타 URL
    coalesce(
      new.raw_user_meta_data->>'picture',
      new.raw_user_meta_data->>'avatar_url'
    ),
    -- 사용자명 생성 (이메일 기반 또는 Google 이름 기반)
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1),
      lower(replace(
        coalesce(
          new.raw_user_meta_data->>'name',
          new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'given_name'
        ), ' ', '_'
      ))
    )
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
