-- 기존 트리거 함수를 업데이트하여 Google OAuth 정보를 더 포괄적으로 처리
-- 이 스크립트는 기존 profiles 테이블이 있을 때 사용

-- 기존 트리거와 함수 삭제 (의존성 순서대로)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 개선된 트리거 함수 생성
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
    username,
    email
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
    ),
    -- 이메일 주소
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- 새로운 트리거 생성
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 기존 사용자들의 프로필을 업데이트 (raw_user_meta_data가 있는 경우)
update public.profiles 
set 
  full_name = coalesce(
    (select raw_user_meta_data->>'name' from auth.users where auth.users.id = profiles.id),
    (select raw_user_meta_data->>'full_name' from auth.users where auth.users.id = profiles.id),
    (select raw_user_meta_data->>'given_name' from auth.users where auth.users.id = profiles.id),
    split_part((select email from auth.users where auth.users.id = profiles.id), '@', 1)
  ),
  avatar_url = coalesce(
    (select raw_user_meta_data->>'picture' from auth.users where auth.users.id = profiles.id),
    (select raw_user_meta_data->>'avatar_url' from auth.users where auth.users.id = profiles.id)
  ),
  username = coalesce(
    profiles.username,
    (select raw_user_meta_data->>'username' from auth.users where auth.users.id = profiles.id),
    split_part((select email from auth.users where auth.users.id = profiles.id), '@', 1),
    lower(replace(
      coalesce(
        (select raw_user_meta_data->>'name' from auth.users where auth.users.id = profiles.id),
        (select raw_user_meta_data->>'full_name' from auth.users where auth.users.id = profiles.id),
        (select raw_user_meta_data->>'given_name' from auth.users where auth.users.id = profiles.id)
      ), ' ', '_'
    ))
  ),
  email = coalesce(
    profiles.email,
    (select email from auth.users where auth.users.id = profiles.id)
  )
where profiles.id in (
  select id from auth.users 
  where raw_user_meta_data is not null 
  and raw_user_meta_data != '{}'::jsonb
);
