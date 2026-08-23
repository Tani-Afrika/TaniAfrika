-- Safety, trust, customer support, notifications, audit and privacy operations.

create type public.review_status as enum ('published', 'hidden', 'under_review', 'removed');
create type public.case_status as enum ('open', 'waiting_customer', 'waiting_driver', 'in_progress', 'resolved', 'closed');
create type public.case_priority as enum ('low', 'normal', 'high', 'urgent');
create type public.incident_status as enum ('reported', 'triaged', 'investigating', 'resolved', 'closed');
create type public.notification_channel as enum ('in_app', 'push', 'sms', 'email', 'whatsapp');
create type public.notification_status as enum ('queued', 'sending', 'sent', 'delivered', 'failed', 'read');
create type public.data_request_type as enum ('access', 'correction', 'portability', 'restriction', 'objection', 'erasure');
create type public.data_request_status as enum ('received', 'identity_verification', 'in_progress', 'completed', 'rejected', 'cancelled');

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  reviewee_id uuid not null references public.profiles(id) on delete restrict,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 2000),
  status public.review_status not null default 'published',
  moderation_notes text,
  moderated_by uuid references public.profiles(id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reviewer_id <> reviewee_id),
  unique (order_id, reviewer_id)
);

create index reviews_reviewee_status_idx on public.reviews(reviewee_id, status, created_at desc);

create table public.support_cases (
  id uuid primary key default gen_random_uuid(),
  case_number bigint generated always as identity unique,
  order_id uuid references public.orders(id) on delete set null,
  opened_by uuid not null references public.profiles(id) on delete restrict,
  assigned_to uuid references public.profiles(id) on delete set null,
  category text not null,
  subject text not null check (char_length(btrim(subject)) between 3 and 200),
  description text not null check (char_length(btrim(description)) between 10 and 5000),
  priority public.case_priority not null default 'normal',
  status public.case_status not null default 'open',
  first_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index support_cases_open_idx on public.support_cases(status, priority, created_at)
  where status not in ('resolved', 'closed');

create table public.support_case_messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.support_cases(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  message text not null check (char_length(btrim(message)) between 1 and 5000),
  internal_note boolean not null default false,
  attachment_paths text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index support_case_messages_case_idx on public.support_case_messages(case_id, created_at);

create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  relationship text not null,
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index emergency_contacts_one_primary_idx
  on public.emergency_contacts(user_id)
  where is_primary;

create table public.safety_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_number bigint generated always as identity unique,
  order_id uuid references public.orders(id) on delete restrict,
  reported_by uuid not null references public.profiles(id) on delete restrict,
  incident_type text not null,
  description text not null check (char_length(btrim(description)) between 10 and 10000),
  occurred_at timestamptz,
  location extensions.geography(point, 4326),
  immediate_assistance_requested boolean not null default false,
  status public.incident_status not null default 'reported',
  assigned_to uuid references public.profiles(id) on delete set null,
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index safety_incidents_order_idx on public.safety_incidents(order_id, created_at desc);
create index safety_incidents_location_gix on public.safety_incidents using gist(location);

create table public.safety_incident_evidence (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.safety_incidents(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  storage_path text not null,
  file_sha256 text check (file_sha256 is null or file_sha256 ~ '^[0-9a-f]{64}$'),
  description text,
  created_at timestamptz not null default now()
);

create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  order_updates boolean not null default true,
  bid_updates boolean not null default true,
  payment_updates boolean not null default true,
  promotions boolean not null default false,
  safety_updates boolean not null default true,
  preferred_channels public.notification_channel[] not null default array['in_app'::public.notification_channel, 'push'::public.notification_channel],
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz not null default now()
);

create table public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('web', 'android', 'ios')),
  token text not null unique,
  device_id text,
  active boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel public.notification_channel not null,
  template_key text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  status public.notification_status not null default 'queued',
  provider_message_id text,
  attempts integer not null default 0 check (attempts >= 0),
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index notifications_queue_idx on public.notifications(status, scheduled_at)
  where status in ('queued', 'failed');

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role public.app_role,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  request_id text,
  ip_hash text,
  user_agent_hash text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index audit_events_resource_idx on public.audit_events(resource_type, resource_id, occurred_at desc);
create index audit_events_actor_idx on public.audit_events(actor_id, occurred_at desc);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consent_type text not null,
  policy_version text not null,
  granted boolean not null,
  source text not null,
  ip_hash text,
  user_agent_hash text,
  recorded_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

create index consent_records_user_type_idx on public.consent_records(user_id, consent_type, recorded_at desc);

create table public.data_subject_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  request_type public.data_request_type not null,
  status public.data_request_status not null default 'received',
  details text,
  identity_verified_at timestamptz,
  assigned_to uuid references public.profiles(id) on delete set null,
  due_at timestamptz,
  completed_at timestamptz,
  rejection_reason text,
  export_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.system_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.feature_flags (
  key text primary key,
  description text,
  enabled boolean not null default false,
  rollout_percentage smallint not null default 0 check (rollout_percentage between 0 and 100),
  targeting jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create or replace function private.recalculate_driver_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reviewee uuid := case when tg_op = 'DELETE' then old.reviewee_id else new.reviewee_id end;
begin
  if exists (select 1 from public.driver_profiles where user_id = v_reviewee) then
    update public.driver_profiles dp
    set average_rating = coalesce(s.average_rating, 0),
        rating_count = coalesce(s.rating_count, 0),
        updated_at = now()
    from (
      select r.reviewee_id,
             round(avg(r.rating)::numeric, 2) as average_rating,
             count(*)::integer as rating_count
      from public.reviews r
      where r.reviewee_id = v_reviewee and r.status = 'published'
      group by r.reviewee_id
    ) s
    where dp.user_id = v_reviewee;

    if not found then
      update public.driver_profiles
      set average_rating = 0, rating_count = 0, updated_at = now()
      where user_id = v_reviewee;
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.submit_review(
  p_order_id uuid,
  p_rating smallint,
  p_comment text default null
)
returns public.reviews
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_reviewee uuid;
  v_review public.reviews;
begin
  if p_rating < 1 or p_rating > 5 then raise exception 'Rating must be between 1 and 5'; end if;
  select * into v_order from public.orders where id = p_order_id;
  if not found or v_order.status <> 'completed'::public.order_status then raise exception 'Only completed orders can be reviewed'; end if;

  if (select auth.uid()) = v_order.client_id then v_reviewee := v_order.driver_id;
  elsif (select auth.uid()) = v_order.driver_id then v_reviewee := v_order.client_id;
  else raise exception 'Not an order participant';
  end if;

  insert into public.reviews (order_id, reviewer_id, reviewee_id, rating, comment)
  values (p_order_id, (select auth.uid()), v_reviewee, p_rating, nullif(btrim(p_comment), ''))
  on conflict (order_id, reviewer_id) do update
    set rating = excluded.rating, comment = excluded.comment, updated_at = now()
  returning * into v_review;
  return v_review;
end;
$$;

create or replace function private.audit_sensitive_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_role public.app_role;
begin
  select p.role into v_actor_role from public.profiles p where p.id = (select auth.uid());
  insert into public.audit_events (
    actor_id, actor_role, action, resource_type, resource_id, before_data, after_data
  ) values (
    (select auth.uid()),
    v_actor_role,
    lower(tg_op),
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.claim_outbox_events(
  p_worker_id text,
  p_limit integer default 50
)
returns setof public.event_outbox
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_payment_operator();
  return query
  with candidates as (
    select eo.id
    from public.event_outbox eo
    where eo.status in ('pending', 'failed')
      and eo.available_at <= now()
      and (eo.locked_at is null or eo.locked_at < now() - interval '5 minutes')
      and eo.attempts < 10
    order by eo.created_at
    for update skip locked
    limit greatest(1, least(p_limit, 200))
  )
  update public.event_outbox eo
  set status = 'processing', locked_at = now(), locked_by = p_worker_id, attempts = eo.attempts + 1
  from candidates c
  where eo.id = c.id
  returning eo.*;
end;
$$;

create or replace function public.complete_outbox_event(
  p_event_id uuid,
  p_delivered boolean,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_payment_operator();
  update public.event_outbox
  set status = case
        when p_delivered then 'delivered'::public.outbox_status
        when attempts >= 10 then 'dead_letter'::public.outbox_status
        else 'failed'::public.outbox_status
      end,
      delivered_at = case when p_delivered then now() else null end,
      available_at = case when p_delivered then available_at else now() + make_interval(secs => least(3600, 30 * (2 ^ least(attempts, 7)))) end,
      locked_at = null,
      locked_by = null,
      last_error = p_error
  where id = p_event_id;
end;
$$;

create or replace function public.purge_expired_operational_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_locations integer;
  v_outbox integer;
  v_notifications integer;
begin
  perform private.require_payment_operator();

  delete from public.driver_location_events
  where recorded_at < now() - interval '30 days';
  get diagnostics v_locations = row_count;

  delete from public.event_outbox
  where status = 'delivered' and delivered_at < now() - interval '90 days';
  get diagnostics v_outbox = row_count;

  delete from public.notifications
  where status in ('delivered', 'read') and created_at < now() - interval '365 days';
  get diagnostics v_notifications = row_count;

  return jsonb_build_object(
    'driver_location_events', v_locations,
    'event_outbox', v_outbox,
    'notifications', v_notifications
  );
end;
$$;

create trigger reviews_touch_updated_at before update on public.reviews
  for each row execute function private.touch_updated_at();
create trigger reviews_recalculate_rating after insert or update or delete on public.reviews
  for each row execute function private.recalculate_driver_rating();
create trigger support_cases_touch_updated_at before update on public.support_cases
  for each row execute function private.touch_updated_at();
create trigger emergency_contacts_touch_updated_at before update on public.emergency_contacts
  for each row execute function private.touch_updated_at();
create trigger safety_incidents_touch_updated_at before update on public.safety_incidents
  for each row execute function private.touch_updated_at();
create trigger notification_preferences_touch_updated_at before update on public.notification_preferences
  for each row execute function private.touch_updated_at();
create trigger device_tokens_touch_updated_at before update on public.device_tokens
  for each row execute function private.touch_updated_at();
create trigger notifications_touch_updated_at before update on public.notifications
  for each row execute function private.touch_updated_at();
create trigger data_subject_requests_touch_updated_at before update on public.data_subject_requests
  for each row execute function private.touch_updated_at();

create trigger audit_driver_profile_changes after update on public.driver_profiles
  for each row execute function private.audit_sensitive_change();
create trigger audit_vehicle_changes after update on public.vehicles
  for each row execute function private.audit_sensitive_change();
create trigger audit_payment_intent_changes after update on public.payment_intents
  for each row execute function private.audit_sensitive_change();
create trigger audit_escrow_changes after update on public.escrow_holds
  for each row execute function private.audit_sensitive_change();
create trigger audit_payout_changes after update on public.payouts
  for each row execute function private.audit_sensitive_change();

insert into public.system_settings (key, value, description) values
  ('location_event_retention_days', '30'::jsonb, 'Maximum routine retention for driver route points.'),
  ('delivery_confirmation_hours', '24'::jsonb, 'Time before a completed delivery is eligible for automated review/release.'),
  ('default_currency', '"KES"'::jsonb, 'Launch settlement currency.'),
  ('escrow_provider_mode', '"licensed_psp"'::jsonb, 'Customer funds must be held by an authorised provider arrangement.');

insert into public.feature_flags (key, description, enabled, rollout_percentage) values
  ('mpesa_payments', 'M-Pesa customer collection flow.', false, 0),
  ('automatic_escrow_release', 'Release eligible holds after the configured confirmation window.', false, 0),
  ('dispatch_ranking', 'Rank nearby verified drivers for an order.', false, 0),
  ('full_kiswahili', 'Full Kiswahili interface and templates.', false, 0);
