create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'bidder' check (role in ('bidder', 'seller', 'admin')),
  created_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete restrict,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  image_urls text[] not null default '{}',
  starting_price numeric(10, 2) not null check (starting_price >= 0),
  reserve_price numeric(10, 2) check (reserve_price is null or reserve_price >= starting_price),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.auctions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null unique references public.items (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  current_price numeric(10, 2) not null check (current_price >= 0),
  status text not null default 'scheduled' check (status in ('scheduled', 'active', 'closed', 'cancelled')),
  winning_bid_id uuid,
  check (ends_at > starts_at)
);

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions (id) on delete cascade,
  bidder_id uuid not null references public.profiles (id) on delete restrict,
  amount numeric(10, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

alter table public.auctions
  add constraint auctions_winning_bid_id_fkey
  foreign key (winning_bid_id) references public.bids (id) on delete set null;

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null unique references public.auctions (id) on delete restrict,
  buyer_id uuid not null references public.profiles (id) on delete restrict,
  seller_id uuid not null references public.profiles (id) on delete restrict,
  amount numeric(10, 2) not null check (amount > 0),
  stripe_session_id text unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('outbid', 'won', 'sold', 'payment_confirmed')),
  payload jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index bids_auction_id_idx on public.bids (auction_id);
create index auctions_status_idx on public.auctions (status);
create index notifications_user_id_read_idx on public.notifications (user_id, read);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.auctions enable row level security;
alter table public.bids enable row level security;
alter table public.transactions enable row level security;
alter table public.notifications enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select using (true);
create policy "Users update their own profile"
  on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Approved items are publicly readable"
  on public.items for select using (status = 'approved' or seller_id = auth.uid() or public.is_admin());
create policy "Sellers create their own items"
  on public.items for insert with check (seller_id = auth.uid());
create policy "Sellers and admins update items"
  on public.items for update using (seller_id = auth.uid() or public.is_admin()) with check (seller_id = auth.uid() or public.is_admin());
create policy "Sellers and admins delete items"
  on public.items for delete using (seller_id = auth.uid() or public.is_admin());

create policy "Approved-item auctions are publicly readable"
  on public.auctions for select using (
    exists (select 1 from public.items where items.id = item_id and items.status = 'approved')
    or public.is_admin()
  );

create policy "Visible auction bids are readable"
  on public.bids for select using (
    exists (
      select 1
      from public.auctions join public.items on items.id = auctions.item_id
      where auctions.id = auction_id and items.status = 'approved'
    )
    or public.is_admin()
  );
create policy "Users place bids for themselves"
  on public.bids for insert with check (bidder_id = auth.uid());

create policy "Transaction participants can read"
  on public.transactions for select using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

create policy "Users read their own notifications"
  on public.notifications for select using (user_id = auth.uid());
create policy "Users mark their own notifications read"
  on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());