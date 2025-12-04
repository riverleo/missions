-- avatars 버킷 생성
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- authenticated 유저는 자신의 아바타를 업로드할 수 있음
create policy "authenticated can upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- authenticated 유저는 자신의 아바타를 업데이트할 수 있음
create policy "authenticated can update their own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- authenticated 유저는 자신의 아바타를 삭제할 수 있음
create policy "authenticated can delete their own avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- 모든 사람이 아바타를 조회할 수 있음 (public bucket)
create policy "anyone can view avatars"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');
