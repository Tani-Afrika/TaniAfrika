-- Cross-domain hardening identified during static review.

-- The profile trigger already creates the primary role. Keep auth provisioning
-- idempotent when both triggers run in the same transaction.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role public.app_role;
  requested_name text;
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'role' = 'driver' then 'driver'::public.app_role
    else 'client'::public.app_role
  end;
  requested_name := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 'TaniAfrika User');

  insert into public.profiles (
    id, role, full_name, account_status, approval_status, is_active
  ) values (
    new.id,
    requested_role,
    requested_name,
    case when new.email_confirmed_at is null then 'pending'::public.account_status else 'active'::public.account_status end,
    case when requested_role = 'driver' then 'pending'::public.approval_status else 'approved'::public.approval_status end,
    true
  );

  insert into public.user_roles (user_id, role)
  values (new.id, requested_role)
  on conflict (user_id, role) do nothing;

  if requested_role = 'driver' then
    insert into public.driver_profiles (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

-- Promote a pending account after Supabase confirms the email address.
create or replace function private.activate_confirmed_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.profiles
    set account_status = 'active', updated_at = now()
    where id = new.id and account_status = 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function private.activate_confirmed_user();

-- Users may edit ordinary profile fields, but role, account and verification
-- state are server-managed. RLS alone does not provide column-level security.
revoke update on public.profiles from authenticated;
grant update (
  full_name, phone, phone_e164, avatar_url, locale, timezone, is_online,
  current_lat, current_lng, location_updated_at, terms_accepted_at,
  privacy_accepted_at, onboarding_completed_at, last_seen_at
) on public.profiles to authenticated;

revoke update on public.driver_profiles from authenticated;
grant update (
  driving_licence_number, driving_licence_expires_on, good_conduct_expires_on,
  years_experience, bio
) on public.driver_profiles to authenticated;

-- Keep the legacy profiles.approval_status field and the canonical driver
-- compliance record consistent while the application is migrated.
create or replace function private.sync_driver_approval_from_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'driver' and new.approval_status is distinct from old.approval_status then
    update public.driver_profiles
    set
      approval_status = new.approval_status,
      approved_by = case when new.approval_status = 'approved' then (select auth.uid()) else approved_by end,
      approved_at = case when new.approval_status = 'approved' then now() else null end,
      updated_at = now()
    where user_id = new.id and approval_status is distinct from new.approval_status;
  end if;
  return new;
end;
$$;

create or replace function private.sync_profile_approval_from_driver()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set approval_status = new.approval_status, updated_at = now()
  where id = new.user_id and approval_status is distinct from new.approval_status;
  return new;
end;
$$;

create trigger profiles_sync_driver_approval
  after update of approval_status on public.profiles
  for each row execute function private.sync_driver_approval_from_profile();
create trigger driver_profiles_sync_profile_approval
  after update of approval_status on public.driver_profiles
  for each row execute function private.sync_profile_approval_from_driver();

-- Finance and administrators need read-only access to the accounting evidence;
-- support and ordinary operations roles do not.
create or replace function private.is_finance_operator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('finance'::public.app_role)
      or private.has_role('admin'::public.app_role);
$$;
grant execute on function private.is_finance_operator() to authenticated;

grant select on public.payment_provider_events, public.ledger_accounts,
  public.ledger_transactions, public.ledger_entries, public.reconciliation_runs,
  public.reconciliation_items to authenticated;
grant select on public.audit_events to authenticated;

create policy payment_provider_events_finance_read on public.payment_provider_events
  for select to authenticated using (private.is_finance_operator());
create policy ledger_accounts_finance_read on public.ledger_accounts
  for select to authenticated using (private.is_finance_operator());
create policy ledger_transactions_finance_read on public.ledger_transactions
  for select to authenticated using (private.is_finance_operator());
create policy ledger_entries_finance_read on public.ledger_entries
  for select to authenticated using (private.is_finance_operator());
create policy reconciliation_runs_finance_read on public.reconciliation_runs
  for select to authenticated using (private.is_finance_operator());
create policy reconciliation_items_finance_read on public.reconciliation_items
  for select to authenticated using (private.is_finance_operator());
create policy audit_events_staff_read on public.audit_events
  for select to authenticated using (private.is_admin());

-- Avoid recursive RLS evaluation when organisation membership policies inspect
-- the organisation_members table itself.
create or replace function private.is_organisation_member(
  p_organisation_id uuid,
  p_roles public.organisation_member_role[] default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organisation_members om
    where om.organisation_id = p_organisation_id
      and om.user_id = (select auth.uid())
      and om.removed_at is null
      and (p_roles is null or om.member_role = any(p_roles))
  );
$$;
grant execute on function private.is_organisation_member(uuid, public.organisation_member_role[]) to authenticated;

drop policy if exists organisations_select_member_or_staff on public.organisations;
drop policy if exists organisations_update_admin_member on public.organisations;
drop policy if exists organisations_delete_owner on public.organisations;
drop policy if exists organisation_members_select_same_organisation on public.organisation_members;
drop policy if exists organisation_members_manage_by_owner_or_admin on public.organisation_members;

create policy organisations_select_member_or_staff on public.organisations for select to authenticated
using (private.is_staff() or private.is_organisation_member(id));
create policy organisations_update_admin_member on public.organisations for update to authenticated
using (private.is_staff() or private.is_organisation_member(id, array['owner', 'admin']::public.organisation_member_role[]))
with check (private.is_staff() or private.is_organisation_member(id, array['owner', 'admin']::public.organisation_member_role[]));
create policy organisations_delete_owner on public.organisations for delete to authenticated
using (private.is_staff() or private.is_organisation_member(id, array['owner']::public.organisation_member_role[]));
create policy organisation_members_select_same_organisation on public.organisation_members for select to authenticated
using (private.is_staff() or private.is_organisation_member(organisation_id));
create policy organisation_members_manage_by_owner_or_admin on public.organisation_members for all to authenticated
using (private.is_staff() or private.is_organisation_member(organisation_id, array['owner', 'admin']::public.organisation_member_role[]))
with check (private.is_staff() or private.is_organisation_member(organisation_id, array['owner', 'admin']::public.organisation_member_role[]));

-- The creator becomes the first owner atomically, so a newly inserted
-- organisation is immediately visible and manageable to its creator.
create or replace function private.create_organisation_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.organisation_members (
    organisation_id, user_id, member_role, invited_by
  ) values (
    new.id, new.created_by, 'owner', new.created_by
  ) on conflict (organisation_id, user_id) do update
    set member_role = 'owner', removed_at = null;
  return new;
end;
$$;

create trigger organisations_create_owner
  after insert on public.organisations
  for each row execute function private.create_organisation_owner_membership();

-- Version every order mutation, not only coordinate edits.
create or replace function private.sync_order_points()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.pickup_location := extensions.st_setsrid(extensions.st_makepoint(new.pickup_lng, new.pickup_lat), 4326)::extensions.geography;
  new.dropoff_location := extensions.st_setsrid(extensions.st_makepoint(new.dropoff_lng, new.dropoff_lat), 4326)::extensions.geography;
  return new;
end;
$$;

create or replace function private.bump_order_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.version := old.version + 1;
  return new;
end;
$$;

create trigger orders_bump_version before update on public.orders
  for each row execute function private.bump_order_version();

drop index if exists public.orders_one_active_per_driver_idx;
create unique index orders_one_active_per_driver_idx
  on public.orders(driver_id)
  where driver_id is not null
    and status in ('payment_pending', 'assigned', 'driver_en_route', 'arrived', 'loading', 'picked_up', 'in_transit', 'delivered');

-- Make the audit trigger work for both ordinary UUID `id` keys and the
-- driver_profiles UUID `user_id` key.
create or replace function private.audit_sensitive_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_role public.app_role;
  v_before jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  v_after jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  v_resource_id uuid;
begin
  select p.role into v_actor_role from public.profiles p where p.id = (select auth.uid());
  v_resource_id := coalesce(
    nullif(v_after ->> 'id', '')::uuid,
    nullif(v_after ->> 'user_id', '')::uuid,
    nullif(v_before ->> 'id', '')::uuid,
    nullif(v_before ->> 'user_id', '')::uuid
  );
  insert into public.audit_events (
    actor_id, actor_role, action, resource_type, resource_id, before_data, after_data
  ) values (
    (select auth.uid()), v_actor_role, lower(tg_op), tg_table_name,
    v_resource_id, v_before, v_after
  );
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

-- Tie generated notifications to their source event for retry safety.
alter table public.notifications
  add column outbox_event_id uuid references public.event_outbox(id) on delete set null;
create unique index notifications_outbox_recipient_channel_idx
  on public.notifications(outbox_event_id, user_id, channel);

-- Reserve a driver while the selected client completes payment.
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
  if v_order.client_id <> (select auth.uid()) and not private.is_staff() then raise exception 'Not authorised'; end if;
  if v_order.status <> 'pending'::public.order_status then raise exception 'This order is no longer accepting bids'; end if;

  select * into v_bid from public.bids where id = p_bid_id and order_id = p_order_id for update;
  if not found or v_bid.status <> 'pending'::public.bid_status then raise exception 'Bid is no longer available'; end if;
  if exists (
    select 1 from public.orders active_order
    where active_order.driver_id = v_bid.driver_id
      and active_order.id <> p_order_id
      and active_order.status in ('payment_pending', 'assigned', 'driver_en_route', 'arrived', 'loading', 'picked_up', 'in_transit', 'delivered')
  ) then raise exception 'The driver is no longer available'; end if;

  select v.id into v_vehicle_id
  from public.vehicles v
  where (v_bid.vehicle_id is null or v.id = v_bid.vehicle_id)
    and v.driver_id = v_bid.driver_id and v.is_active and v.is_verified
  order by (v.id = v_bid.vehicle_id) desc, v.updated_at desc
  limit 1;
  if v_vehicle_id is null then raise exception 'The selected driver has no verified active vehicle'; end if;

  v_fee := private.calculate_platform_fee(v_bid.amount_minor, v_order.service_type_id, v_order.vehicle_type_required);
  update public.bids set status = 'rejected', updated_at = now()
    where order_id = p_order_id and id <> p_bid_id and status = 'pending';
  update public.bids set status = 'accepted', accepted_at = now(), updated_at = now(), vehicle_id = v_vehicle_id
    where id = p_bid_id;

  update public.orders set
    accepted_bid_id = p_bid_id,
    driver_id = v_bid.driver_id,
    vehicle_id = v_vehicle_id,
    price_agreed = v_bid.amount,
    total_amount_minor = v_bid.amount_minor,
    platform_fee_minor = v_fee,
    driver_earnings_minor = v_bid.amount_minor - v_fee,
    status = 'payment_pending',
    updated_at = now()
  where id = p_order_id returning * into v_order;
  return v_order;
end;
$$;

-- Completion is controlled by successful payout. Clients may confirm delivery
-- through request_escrow_release or open a dispute; they cannot bypass money.
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
  v_allowed boolean := false;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if private.is_staff() then
    v_allowed := true;
  elsif v_actor = v_order.client_id then
    v_allowed := (v_order.status, p_new_status) in (
      ('pending'::public.order_status, 'cancelled'::public.order_status),
      ('payment_pending'::public.order_status, 'cancelled'::public.order_status),
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

  update public.orders set
    status = p_new_status,
    driver_en_route_at = case when p_new_status = 'driver_en_route' then now() else driver_en_route_at end,
    arrived_at = case when p_new_status = 'arrived' then now() else arrived_at end,
    picked_up_at = case when p_new_status = 'picked_up' then now() else picked_up_at end,
    delivered_at = case when p_new_status = 'delivered' then now() else delivered_at end,
    cancelled_at = case when p_new_status = 'cancelled' then now() else cancelled_at end,
    cancellation_reason = case when p_new_status = 'cancelled' then nullif(btrim(p_notes), '') else cancellation_reason end,
    cancellation_actor = case when p_new_status = 'cancelled' then v_actor else cancellation_actor end,
    updated_at = now()
  where id = p_order_id returning * into v_order;
  return v_order;
end;
$$;

create or replace function public.open_financial_dispute(
  p_order_id uuid,
  p_reason_code text,
  p_description text
)
returns public.financial_disputes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_dispute public.financial_disputes;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or not private.is_order_party(p_order_id) then raise exception 'Order not found'; end if;
  if v_order.status not in ('assigned', 'driver_en_route', 'arrived', 'loading', 'picked_up', 'in_transit', 'delivered') then
    raise exception 'This order cannot be disputed in its current state';
  end if;
  insert into public.financial_disputes (
    order_id, escrow_hold_id, opened_by, reason_code, description
  ) values (
    p_order_id,
    (select eh.id from public.escrow_holds eh where eh.order_id = p_order_id),
    (select auth.uid()),
    nullif(btrim(p_reason_code), ''),
    nullif(btrim(p_description), '')
  ) returning * into v_dispute;
  update public.escrow_holds set status = 'disputed', updated_at = now() where order_id = p_order_id and status in ('funded', 'release_pending');
  update public.orders set status = 'disputed', updated_at = now() where id = p_order_id;
  return v_dispute;
end;
$$;

revoke insert on public.financial_disputes from authenticated;
revoke execute on function public.open_financial_dispute(uuid, text, text) from public, anon;
grant execute on function public.open_financial_dispute(uuid, text, text) to authenticated;

create or replace function public.expire_payment_reservations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  perform private.require_payment_operator();
  update public.orders o set
    status = 'cancelled',
    cancelled_at = now(),
    cancellation_reason = 'Payment window expired',
    updated_at = now()
  where o.status = 'payment_pending'
    and o.updated_at < now() - interval '15 minutes'
    and not exists (
      select 1 from public.payment_intents pi
      where pi.order_id = o.id and pi.status = 'succeeded'
    );
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.expire_payment_reservations() from public, anon, authenticated;
grant execute on function public.expire_payment_reservations() to service_role;

create or replace view public.profiles_public
with (security_barrier = true)
as
select
  p.id, p.full_name, p.avatar_url, p.role,
  coalesce(dp.average_rating, 0) as average_rating,
  coalesce(dp.rating_count, 0) as rating_count,
  coalesce(dp.completed_orders, 0) as completed_orders
from public.profiles p
left join public.driver_profiles dp on dp.user_id = p.id
where p.is_active and p.account_status = 'active'
  and p.role in ('client', 'driver')
  and (p.role <> 'driver' or dp.approval_status = 'approved');

insert into public.system_settings (key, value, description)
values (
  'brand_theme',
  jsonb_build_object(
    'version', 'draft-1',
    'direction', 'reliable_neighbour',
    'primary_family', 'green',
    'accent_family', 'amber',
    'locale', 'en-KE'
  ),
  'Non-secret, adjustable brand tokens. Exact design tokens are supplied by the design team.'
)
on conflict (key) do update
set value = excluded.value, description = excluded.description, updated_at = now();

comment on table public.system_settings is
  'Non-secret operational settings only. Credentials belong in Edge Function secrets, never this table.';
