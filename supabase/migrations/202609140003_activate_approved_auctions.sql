create function public.activate_approved_auction()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.status = 'approved' and old.status <> 'approved' then
    update public.auctions
    set status = 'active'
    where item_id = new.id
      and status = 'scheduled'
      and starts_at <= now()
      and ends_at > now();
  end if;

  return new;
end;
$$;

create trigger after_item_approved
  after update of status on public.items
  for each row execute procedure public.activate_approved_auction();