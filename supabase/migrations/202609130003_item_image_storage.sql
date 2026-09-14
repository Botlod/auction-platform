insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'item-images',
  'item-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Authenticated users upload their own item images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users update their own item images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'item-images'
    and owner_id = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'item-images'
    and owner_id = (select auth.uid()::text)
  );

create policy "Users delete their own item images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'item-images'
    and owner_id = (select auth.uid()::text)
  );