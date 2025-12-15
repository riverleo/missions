-- game-assets 버킷 생성
insert into storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
values (
  'game-assets',
  'game-assets',
  true,
  array['image/svg+xml'],
  1048576  -- 1MB
)
on conflict (id) do nothing;

-- 모든 사람이 game-assets 파일을 조회할 수 있음 (public bucket)
drop policy if exists "anyone can view game-assets" on storage.objects;
create policy "anyone can view game-assets"
  on storage.objects
  for select
  to public
  using (bucket_id = 'game-assets');

-- 어드민만 game-assets 파일을 업로드할 수 있음
drop policy if exists "admins can upload game-assets" on storage.objects;
create policy "admins can upload game-assets"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'game-assets'
    and is_admin()
  );

-- 어드민만 game-assets 파일을 삭제할 수 있음
drop policy if exists "admins can delete game-assets" on storage.objects;
create policy "admins can delete game-assets"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'game-assets'
    and is_admin()
  );
