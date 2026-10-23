create or replace function public.process_auction_lifecycle()
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  expired_auction record;
  winning_bid record;
begin
  update public.auctions
  set status = 'active'
  where status = 'scheduled'
    and starts_at <= now()
    and ends_at > now();

  for expired_auction in
    select auctions.id, items.seller_id, items.title
    from public.auctions
    join public.items on items.id = auctions.item_id
    where auctions.status = 'active'
      and auctions.ends_at <= now()
    for update of auctions
  loop
    select id, bidder_id, amount
    into winning_bid
    from public.bids
    where auction_id = expired_auction.id
    order by amount desc, created_at asc
    limit 1;

    update public.auctions
    set status = 'closed',
        winning_bid_id = winning_bid.id
    where id = expired_auction.id;

    if winning_bid.id is not null then
      insert into public.transactions (auction_id, buyer_id, seller_id, amount)
      values (expired_auction.id, winning_bid.bidder_id, expired_auction.seller_id, winning_bid.amount)
      on conflict (auction_id) do nothing;

      insert into public.notifications (user_id, type, payload)
      values
        (winning_bid.bidder_id, 'won', jsonb_build_object('auction_id', expired_auction.id, 'title', expired_auction.title, 'amount', winning_bid.amount)),
        (expired_auction.seller_id, 'sold', jsonb_build_object('auction_id', expired_auction.id, 'title', expired_auction.title, 'amount', winning_bid.amount));
    end if;
  end loop;
end;
$$;