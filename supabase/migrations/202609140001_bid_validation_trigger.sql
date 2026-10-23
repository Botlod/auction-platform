create function public.validate_and_apply_bid()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  locked_auction public.auctions%rowtype;
begin
  select *
  into locked_auction
  from public.auctions
  where id = new.auction_id
  for update;

  if not found then
    raise exception 'Auction not found.';
  end if;

  if locked_auction.status <> 'active' then
    raise exception 'Bidding is unavailable because this auction is not active.';
  end if;

  if now() >= locked_auction.ends_at then
    raise exception 'Bidding is unavailable because this auction has ended.';
  end if;

  if new.amount <= locked_auction.current_price then
    raise exception 'Your bid must be higher than the current price.';
  end if;

  update public.auctions
  set current_price = new.amount
  where id = locked_auction.id;

  return new;
end;
$$;

create trigger before_bid_insert
  before insert on public.bids
  for each row execute procedure public.validate_and_apply_bid();

alter publication supabase_realtime add table public.bids;