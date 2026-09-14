create policy "Sellers create auctions for their own items"
  on public.auctions for insert to authenticated
  with check (
    exists (
      select 1
      from public.items
      where items.id = item_id and items.seller_id = (select auth.uid())
    )
  );

update storage.buckets
set file_size_limit = 15728640
where id = 'item-images';