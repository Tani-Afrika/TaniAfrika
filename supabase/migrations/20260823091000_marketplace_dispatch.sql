-- Marketplace, pricing, bidding, dispatch and delivery state machine.

create type public.order_status as enum (
  'draft',
  'pending',
  'payment_pending',
  'assigned',
  'driver_en_route',
  'arrived',
  'loading',
  'picked_up',
  'in_transit',
  'delivered',
  'completed',
  'cancelled',
  'disputed'
);
create type public.bid_status as enum ('pending', 'accepted', 'rejected', 'withdrawn', 'expired');
create type public.dispatch_offer_status as enum ('offered', 'viewed', 'accepted', 'declined', 'expired', 'cancelled');
create type public.outbox_status as enum ('pending', 'processing', 'delivered', 'failed', 'dead_letter');

create table public.service_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z][a-z0-9_]{1,40}$'),
  display_name text not null,
  description text,
  requires_bidding boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_areas (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  display_name text not null,
  country_code char(2) not null default 'KE',
  timezone text not null default 'Africa/Nairobi',
  boundary extensions.geography(multipolygon, 4326),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index service_areas_boundary_gix on public.service_areas using gist(boundary);

create table public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service_type_id uuid references public.service_types(id) on delete cascade,
  service_area_id uuid references public.service_areas(id) on delete cascade,
  vehicle_type public.vehicle_type,
  base_fare_minor bigint not null default 0 check (base_fare_minor >= 0),
  per_km_minor bigint not null default 0 check (per_km_minor >= 0),
  per_minute_minor bigint not null default 0 check (per_minute_minor >= 0),
  minimum_fare_minor bigint not null default 0 check (minimum_fare_minor >= 0),
  commission_bps integer not null default 1000 check (commission_bps between 0 and 10000),
  cancellation_fee_minor bigint not null default 0 check (cancellation_fee_minor >= 0),
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  priority integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to > effective_from)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  client_id uuid not null references public.profiles(id) on delete restrict,
  organisation_id uuid references public.organisations(id) on delete set null,
  service_type_id uuid references public.service_types(id) on delete restrict,
  service_area_id uuid references public.service_areas(id) on delete set null,
  pickup_address text not null check (char_length(btrim(pickup_address)) between 3 and 500),
  pickup_lat double precision not null check (pickup_lat between -90 and 90),
  pickup_lng double precision not null check (pickup_lng between -180 and 180),
  pickup_location extensions.geography(point, 4326),
  pickup_contact_name text,
  pickup_contact_phone_e164 text check (pickup_contact_phone_e164 is null or pickup_contact_phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  pickup_access_notes text,
  dropoff_address text not null check (char_length(btrim(dropoff_address)) between 3 and 500),
  dropoff_lat double precision not null check (dropoff_lat between -90 and 90),
  dropoff_lng double precision not null check (dropoff_lng between -180 and 180),
  dropoff_location extensions.geography(point, 4326),
  dropoff_contact_name text,
  dropoff_contact_phone_e164 text check (dropoff_contact_phone_e164 is null or dropoff_contact_phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  dropoff_access_notes text,
  goods_description text not null check (char_length(btrim(goods_description)) between 3 and 3000),
  goods_category text,
  estimated_weight_kg numeric(10,2) check (estimated_weight_kg is null or estimated_weight_kg > 0),
  estimated_volume_m3 numeric(10,2) check (estimated_volume_m3 is null or estimated_volume_m3 > 0),
  special_handling text,
  vehicle_type_required public.vehicle_type,
  scheduled_for timestamptz,
  status public.order_status not null default 'pending',
  accepted_bid_id uuid,
  driver_id uuid references public.profiles(id) on delete restrict,
  vehicle_id uuid references public.vehicles(id) on delete restrict,
  currency char(3) not null default 'KES' check (currency = upper(currency)),
  price_agreed numeric(12,2) check (price_agreed is null or price_agreed >= 0),
  total_amount_minor bigint check (total_amount_minor is null or total_amount_minor >= 0),
  platform_fee_minor bigint check (platform_fee_minor is null or platform_fee_minor >= 0),
  driver_earnings_minor bigint check (driver_earnings_minor is null or driver_earnings_minor >= 0),
  estimated_distance_m integer check (estimated_distance_m is null or estimated_distance_m >= 0),
  estimated_duration_s integer check (estimated_duration_s is null or estimated_duration_s >= 0),
  route_provider text,
  route_polyline text,
  driver_en_route_at timestamptz,
  arrived_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  cancellation_actor uuid references public.profiles(id) on delete set null,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    total_amount_minor is null
    or price_agreed is null
    or total_amount_minor = round(price_agreed * 100)::bigint
  ),
  check (
    total_amount_minor is null
    or platform_fee_minor is null
    or driver_earnings_minor is null
    or total_amount_minor = platform_fee_minor + driver_earnings_minor
  )
);

create index orders_client_created_idx on public.orders(client_id, created_at desc);
create index orders_driver_active_idx on public.orders(driver_id, status, updated_at desc);
create index orders_status_created_idx on public.orders(status, created_at desc);
create index orders_pickup_location_gix on public.orders using gist(pickup_location);
create index orders_dropoff_location_gix on public.orders using gist(dropoff_location);
create unique index orders_one_active_per_driver_idx
  on public.orders(driver_id)
  where driver_id is not null
    and status in ('assigned', 'driver_en_route', 'arrived', 'loading', 'picked_up', 'in_transit', 'delivered');

create table public.order_stops (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  stop_sequence smallint not null check (stop_sequence > 0),
  stop_type text not null check (stop_type in ('pickup', 'waypoint', 'dropoff')),
  address text not null,
  location extensions.geography(point, 4326) not null,
  contact_name text,
  contact_phone_e164 text check (contact_phone_e164 is null or contact_phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  access_notes text,
  arrived_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (order_id, stop_sequence)
);

create index order_stops_location_gix on public.order_stops using gist(location);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  description text not null,
  quantity integer not null default 1 check (quantity > 0),
  estimated_weight_kg numeric(10,2) check (estimated_weight_kg is null or estimated_weight_kg > 0),
  declared_value_minor bigint check (declared_value_minor is null or declared_value_minor >= 0),
  fragile boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.order_attachments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  attachment_type text not null check (attachment_type in ('goods_photo', 'pickup_proof', 'delivery_proof', 'damage_evidence', 'other')),
  storage_path text not null,
  file_sha256 text check (file_sha256 is null or file_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  driver_id uuid not null references public.profiles(id) on delete restrict,
  vehicle_id uuid references public.vehicles(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  amount_minor bigint generated always as (round(amount * 100)::bigint) stored,
  currency char(3) not null default 'KES' check (currency = upper(currency)),
  message text check (message is null or char_length(message) <= 1000),
  estimated_pickup_at timestamptz,
  status public.bid_status not null default 'pending',
  expires_at timestamptz,
  accepted_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders
  add constraint orders_accepted_bid_id_fkey
  foreign key (accepted_bid_id) references public.bids(id) on delete restrict;

create unique index bids_one_open_per_driver_order_idx
  on public.bids(order_id, driver_id)
  where status in ('pending', 'accepted');
create unique index bids_one_accepted_per_order_idx
  on public.bids(order_id)
  where status = 'accepted';
create index bids_driver_created_idx on public.bids(driver_id, created_at desc);

create table public.bid_messages (
  id uuid primary key default gen_random_uuid(),
  bid_id uuid not null references public.bids(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index bid_messages_bid_created_idx on public.bid_messages(bid_id, created_at);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  previous_status public.order_status,
  changed_by uuid references public.profiles(id) on delete set null,
  actor_role public.app_role,
  notes text,
  source text not null default 'app',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index order_status_history_order_created_idx on public.order_status_history(order_id, created_at);

create table public.driver_availability_sessions (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  start_location extensions.geography(point, 4326),
  end_location extensions.geography(point, 4326),
  ended_reason text,
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

create unique index driver_one_open_availability_idx
  on public.driver_availability_sessions(driver_id)
  where ended_at is null;

create table public.driver_locations (
  driver_id uuid primary key references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  location extensions.geography(point, 4326),
  heading numeric(6,2) check (heading is null or heading between 0 and 360),
  speed numeric(8,2) check (speed is null or speed >= 0),
  accuracy_m numeric(8,2) check (accuracy_m is null or accuracy_m >= 0),
  source text not null default 'device',
  updated_at timestamptz not null default now()
);

create index driver_locations_location_gix on public.driver_locations using gist(location);

create table public.driver_location_events (
  id bigint generated always as identity primary key,
  driver_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  location extensions.geography(point, 4326) not null,
  heading numeric(6,2),
  speed numeric(8,2),
  accuracy_m numeric(8,2),
  recorded_at timestamptz not null default now()
);

create index driver_location_events_order_recorded_idx on public.driver_location_events(order_id, recorded_at);
comment on table public.driver_location_events is
  'Short-retention operational location history. Purge after the documented retention period.';

create table public.dispatch_offers (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  driver_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  status public.dispatch_offer_status not null default 'offered',
  rank_score numeric(10,4),
  distance_to_pickup_m integer,
  offered_at timestamptz not null default now(),
  expires_at timestamptz not null,
  responded_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique (order_id, driver_id)
);

create table public.event_outbox (
  id uuid primary key default gen_random_uuid(),
  aggregate_type text not null,
  aggregate_id uuid not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.outbox_status not null default 'pending',
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  delivered_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

create index event_outbox_pending_idx on public.event_outbox(status, available_at, created_at)
  where status in ('pending', 'failed');

create or replace function private.sync_order_points()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.pickup_location := extensions.st_setsrid(extensions.st_makepoint(new.pickup_lng, new.pickup_lat), 4326)::extensions.geography;
  new.dropoff_location := extensions.st_setsrid(extensions.st_makepoint(new.dropoff_lng, new.dropoff_lat), 4326)::extensions.geography;
  new.version := case when tg_op = 'UPDATE' then old.version + 1 else new.version end;
  return new;
end;
$$;

create or replace function private.sync_driver_location_point()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.location := extensions.st_setsrid(extensions.st_makepoint(new.longitude, new.latitude), 4326)::extensions.geography;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.is_order_client(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.orders o
    where o.id = p_order_id and o.client_id = (select auth.uid())
  );
$$;

create or replace function private.is_order_driver(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.orders o
    where o.id = p_order_id and o.driver_id = (select auth.uid())
  );
$$;

create or replace function private.is_order_party(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_order_client(p_order_id)
      or private.is_order_driver(p_order_id)
      or private.is_staff();
$$;

create or replace function private.is_bid_party(p_bid_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bids b
    join public.orders o on o.id = b.order_id
    where b.id = p_bid_id
      and ((select auth.uid()) in (b.driver_id, o.client_id) or private.is_staff())
  );
$$;

create or replace function private.order_status_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.app_role;
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    select p.role into v_role from public.profiles p where p.id = (select auth.uid());

    insert into public.order_status_history (
      order_id, status, previous_status, changed_by, actor_role, source
    ) values (
      new.id,
      new.status,
      case when tg_op = 'UPDATE' then old.status else null end,
      (select auth.uid()),
      v_role,
      case when (select auth.uid()) is null then 'system' else 'app' end
    );

    insert into public.event_outbox (aggregate_type, aggregate_id, event_type, payload)
    values (
      'order',
      new.id,
      'order.status_changed',
      jsonb_build_object(
        'order_id', new.id,
        'previous_status', case when tg_op = 'UPDATE' then old.status else null end,
        'status', new.status,
        'client_id', new.client_id,
        'driver_id', new.driver_id
      )
    );
  end if;
  return new;
end;
$$;

create or replace function private.calculate_platform_fee(
  p_amount_minor bigint,
  p_service_type_id uuid,
  p_vehicle_type public.vehicle_type
)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select round(
    p_amount_minor * coalesce((
      select pr.commission_bps
      from public.pricing_rules pr
      where pr.active
        and pr.effective_from <= now()
        and (pr.effective_to is null or pr.effective_to > now())
        and (pr.service_type_id is null or pr.service_type_id = p_service_type_id)
        and (pr.vehicle_type is null or pr.vehicle_type = p_vehicle_type)
      order by pr.priority desc, pr.created_at desc
      limit 1
    ), 1000) / 10000.0
  )::bigint;
$$;

create or replace function public.accept_bid(p_order_id uuid, p_bid_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_bid public.bids;
  v_vehicle_id uuid;
  v_fee bigint;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.client_id <> (select auth.uid()) and not private.is_staff() then
    raise exception 'Not authorised';
  end if;
  if v_order.status <> 'pending'::public.order_status then
    raise exception 'This order is no longer accepting bids';
  end if;

  select * into v_bid
  from public.bids
  where id = p_bid_id and order_id = p_order_id
  for update;
  if not found or v_bid.status <> 'pending'::public.bid_status then
    raise exception 'Bid is no longer available';
  end if;

  select v.id into v_vehicle_id
  from public.vehicles v
  where v.id = coalesce(v_bid.vehicle_id, v.id)
    and v.driver_id = v_bid.driver_id
    and v.is_active
    and v.is_verified
  order by (v.id = v_bid.vehicle_id) desc, v.updated_at desc
  limit 1;
  if v_vehicle_id is null then
    raise exception 'The selected driver has no verified active vehicle';
  end if;

  v_fee := private.calculate_platform_fee(v_bid.amount_minor, v_order.service_type_id, v_order.vehicle_type_required);

  update public.bids
  set status = 'rejected'::public.bid_status, updated_at = now()
  where order_id = p_order_id and id <> p_bid_id and status = 'pending'::public.bid_status;

  update public.bids
  set status = 'accepted'::public.bid_status, accepted_at = now(), updated_at = now(), vehicle_id = v_vehicle_id
  where id = p_bid_id;

  update public.orders
  set accepted_bid_id = p_bid_id,
      driver_id = v_bid.driver_id,
      vehicle_id = v_vehicle_id,
      price_agreed = v_bid.amount,
      total_amount_minor = v_bid.amount_minor,
      platform_fee_minor = v_fee,
      driver_earnings_minor = v_bid.amount_minor - v_fee,
      status = 'payment_pending'::public.order_status,
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

create or replace function public.update_order_status(
  p_order_id uuid,
  p_new_status public.order_status,
  p_notes text default null
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_actor uuid := (select auth.uid());
  v_is_staff boolean := private.is_staff();
  v_allowed boolean := false;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;

  if v_is_staff then
    v_allowed := true;
  elsif v_actor = v_order.client_id then
    v_allowed := (v_order.status, p_new_status) in (
      ('pending'::public.order_status, 'cancelled'::public.order_status),
      ('payment_pending'::public.order_status, 'cancelled'::public.order_status),
      ('delivered'::public.order_status, 'completed'::public.order_status),
      ('delivered'::public.order_status, 'disputed'::public.order_status)
    );
  elsif v_actor = v_order.driver_id then
    v_allowed := (v_order.status, p_new_status) in (
      ('assigned'::public.order_status, 'driver_en_route'::public.order_status),
      ('assigned'::public.order_status, 'picked_up'::public.order_status),
      ('driver_en_route'::public.order_status, 'arrived'::public.order_status),
      ('arrived'::public.order_status, 'loading'::public.order_status),
      ('loading'::public.order_status, 'picked_up'::public.order_status),
      ('picked_up'::public.order_status, 'in_transit'::public.order_status),
      ('in_transit'::public.order_status, 'delivered'::public.order_status)
    );
  end if;

  if not v_allowed then raise exception 'Invalid or unauthorised order transition'; end if;

  update public.orders
  set status = p_new_status,
      driver_en_route_at = case when p_new_status = 'driver_en_route' then now() else driver_en_route_at end,
      arrived_at = case when p_new_status = 'arrived' then now() else arrived_at end,
      picked_up_at = case when p_new_status = 'picked_up' then now() else picked_up_at end,
      delivered_at = case when p_new_status = 'delivered' then now() else delivered_at end,
      completed_at = case when p_new_status = 'completed' then now() else completed_at end,
      cancelled_at = case when p_new_status = 'cancelled' then now() else cancelled_at end,
      cancellation_reason = case when p_new_status = 'cancelled' then nullif(btrim(p_notes), '') else cancellation_reason end,
      cancellation_actor = case when p_new_status = 'cancelled' then v_actor else cancellation_actor end,
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  if p_notes is not null then
    update public.order_status_history
    set notes = p_notes
    where id = (
      select h.id from public.order_status_history h
      where h.order_id = p_order_id and h.status = p_new_status
      order by h.created_at desc limit 1
    );
  end if;

  return v_order;
end;
$$;

create trigger service_types_touch_updated_at before update on public.service_types
  for each row execute function private.touch_updated_at();
create trigger service_areas_touch_updated_at before update on public.service_areas
  for each row execute function private.touch_updated_at();
create trigger pricing_rules_touch_updated_at before update on public.pricing_rules
  for each row execute function private.touch_updated_at();
create trigger orders_sync_points before insert or update of pickup_lat, pickup_lng, dropoff_lat, dropoff_lng on public.orders
  for each row execute function private.sync_order_points();
create trigger orders_touch_updated_at before update on public.orders
  for each row execute function private.touch_updated_at();
create trigger orders_status_audit after insert or update of status on public.orders
  for each row execute function private.order_status_audit();
create trigger bids_touch_updated_at before update on public.bids
  for each row execute function private.touch_updated_at();
create trigger driver_locations_sync_point before insert or update on public.driver_locations
  for each row execute function private.sync_driver_location_point();

insert into public.service_types (code, display_name, description, requires_bidding) values
  ('house_move', 'House move', 'Transport for self-packed household belongings.', true),
  ('business_delivery', 'Business delivery', 'Delivery for an SME or organisation.', true),
  ('parcel', 'Parcel delivery', 'Smaller parcel and item delivery.', true);

insert into public.pricing_rules (name, commission_bps, priority)
values ('Default marketplace commission', 1000, 0);

comment on table public.driver_location_events is
  'Location is high-risk personal data: retain only as long as necessary for safety, disputes and legal obligations.';
