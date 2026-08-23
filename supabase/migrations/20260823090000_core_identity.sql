-- TaniAfrika backend foundation: identity, organisations, driver compliance and fleet.
-- This migration targets a clean Supabase project. Do not run it against an
-- existing production database until the legacy data migration has been rehearsed.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;
create extension if not exists postgis with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.app_role as enum ('client', 'driver', 'support', 'operations', 'finance', 'admin');
create type public.account_status as enum ('pending', 'active', 'suspended', 'closed');
create type public.approval_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.verification_status as enum ('not_submitted', 'pending', 'verified', 'rejected', 'expired');
create type public.document_type as enum (
  'national_id',
  'driving_licence',
  'good_conduct',
  'profile_photo',
  'vehicle_logbook',
  'vehicle_inspection',
  'vehicle_insurance',
  'business_registration',
  'other'
);
create type public.vehicle_type as enum ('motorcycle', 'tuktuk', 'pickup', 'van', 'truck_small', 'truck_large');
create type public.organisation_member_role as enum ('owner', 'admin', 'dispatcher', 'billing', 'member');

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'client',
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  phone text,
  phone_e164 text check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  avatar_url text,
  locale text not null default 'en-KE',
  timezone text not null default 'Africa/Nairobi',
  account_status public.account_status not null default 'pending',
  is_active boolean not null default true,
  is_online boolean not null default false,
  approval_status public.approval_status not null default 'pending',
  current_lat double precision check (current_lat is null or current_lat between -90 and 90),
  current_lng double precision check (current_lng is null or current_lng between -180 and 180),
  location_updated_at timestamptz,
  phone_verified_at timestamptz,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  onboarding_completed_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_phone_e164_key on public.profiles(phone_e164) where phone_e164 is not null;
create index profiles_role_status_idx on public.profiles(role, account_status);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (user_id, role)
);

create table public.driver_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  approval_status public.approval_status not null default 'pending',
  verification_status public.verification_status not null default 'not_submitted',
  national_id_last4 text check (national_id_last4 is null or national_id_last4 ~ '^[0-9A-Za-z]{4}$'),
  driving_licence_number text,
  driving_licence_expires_on date,
  good_conduct_expires_on date,
  years_experience smallint check (years_experience is null or years_experience between 0 and 80),
  bio text check (bio is null or char_length(bio) <= 1000),
  average_rating numeric(3,2) not null default 0 check (average_rating between 0 and 5),
  rating_count integer not null default 0 check (rating_count >= 0),
  completed_orders integer not null default 0 check (completed_orders >= 0),
  acceptance_rate numeric(5,2) check (acceptance_rate is null or acceptance_rate between 0 and 100),
  cancellation_rate numeric(5,2) check (cancellation_rate is null or cancellation_rate between 0 and 100),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trading_name text,
  registration_number text,
  tax_number text,
  billing_email extensions.citext,
  billing_phone_e164 text check (billing_phone_e164 is null or billing_phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  account_status public.account_status not null default 'pending',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organisation_members (
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role public.organisation_member_role not null default 'member',
  invited_by uuid references public.profiles(id) on delete set null,
  joined_at timestamptz not null default now(),
  removed_at timestamptz,
  primary key (organisation_id, user_id)
);

create table public.saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 80),
  address text not null,
  location extensions.geography(point, 4326) not null,
  access_notes text check (access_notes is null or char_length(access_notes) <= 500),
  is_default_pickup boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saved_places_location_gix on public.saved_places using gist(location);

create table public.vehicle_classes (
  code public.vehicle_type primary key,
  display_name text not null,
  description text,
  minimum_capacity_kg integer check (minimum_capacity_kg is null or minimum_capacity_kg >= 0),
  maximum_capacity_kg integer check (maximum_capacity_kg is null or maximum_capacity_kg > 0),
  active boolean not null default true,
  sort_order smallint not null default 0
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete restrict,
  owner_id uuid references public.profiles(id) on delete set null,
  vehicle_type public.vehicle_type not null,
  plate_number text not null,
  make text,
  model text,
  year smallint check (year is null or year between 1950 and 2100),
  colour text,
  capacity_kg integer check (capacity_kg is null or capacity_kg > 0),
  volume_m3 numeric(8,2) check (volume_m3 is null or volume_m3 > 0),
  photo_url text,
  verification_status public.verification_status not null default 'not_submitted',
  is_verified boolean not null default false,
  is_active boolean not null default true,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plate_number)
);

create index vehicles_driver_active_idx on public.vehicles(driver_id, is_active);

create table public.driver_vehicle_assignments (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create unique index driver_vehicle_one_active_vehicle_idx
  on public.driver_vehicle_assignments(driver_id)
  where ends_at is null;

create table public.driver_documents (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete cascade,
  document_type public.document_type not null,
  storage_path text not null,
  file_sha256 text check (file_sha256 is null or file_sha256 ~ '^[0-9a-f]{64}$'),
  verification_status public.verification_status not null default 'pending',
  document_number_masked text,
  issued_on date,
  expires_on date,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_on is null or issued_on is null or expires_on >= issued_on)
);

create table public.vehicle_documents (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  document_type public.document_type not null,
  storage_path text not null,
  file_sha256 text check (file_sha256 is null or file_sha256 ~ '^[0-9a-f]{64}$'),
  verification_status public.verification_status not null default 'pending',
  issued_on date,
  expires_on date,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_on is null or issued_on is null or expires_on >= issued_on)
);

create or replace function private.has_role(p_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = p_role
      and ur.revoked_at is null
  );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('admin'::public.app_role);
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('admin'::public.app_role)
      or private.has_role('operations'::public.app_role)
      or private.has_role('support'::public.app_role)
      or private.has_role('finance'::public.app_role);
$$;

create or replace function private.is_approved_driver()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.driver_profiles dp
    join public.profiles p on p.id = dp.user_id
    where dp.user_id = (select auth.uid())
      and p.role = 'driver'::public.app_role
      and dp.approval_status = 'approved'::public.approval_status
      and p.account_status = 'active'::public.account_status
      and p.is_active
  );
$$;

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

  insert into public.user_roles (user_id, role) values (new.id, requested_role);

  if requested_role = 'driver' then
    insert into public.driver_profiles (user_id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.sync_profile_primary_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.role is distinct from new.role then
    update public.user_roles
    set revoked_at = now()
    where user_id = new.id and role = old.role and revoked_at is null;
  end if;

  insert into public.user_roles (user_id, role, granted_by)
  values (new.id, new.role, (select auth.uid()))
  on conflict (user_id, role) do update set revoked_at = null;

  if new.role = 'driver'::public.app_role then
    insert into public.driver_profiles (user_id)
    values (new.id)
    on conflict (user_id) do nothing;

    if tg_op = 'UPDATE' and old.role is distinct from new.role then
      update public.profiles
      set approval_status = 'pending', is_online = false
      where id = new.id;
    end if;
  elsif tg_op = 'UPDATE' and old.role is distinct from new.role then
    update public.profiles
    set approval_status = 'approved', is_online = false
    where id = new.id;
  end if;

  return new;
end;
$$;

create trigger sync_profile_primary_role
  after insert or update of role on public.profiles
  for each row execute function private.sync_profile_primary_role();

create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function private.touch_updated_at();
create trigger driver_profiles_touch_updated_at before update on public.driver_profiles
  for each row execute function private.touch_updated_at();
create trigger organisations_touch_updated_at before update on public.organisations
  for each row execute function private.touch_updated_at();
create trigger saved_places_touch_updated_at before update on public.saved_places
  for each row execute function private.touch_updated_at();
create trigger vehicles_touch_updated_at before update on public.vehicles
  for each row execute function private.touch_updated_at();
create trigger driver_documents_touch_updated_at before update on public.driver_documents
  for each row execute function private.touch_updated_at();
create trigger vehicle_documents_touch_updated_at before update on public.vehicle_documents
  for each row execute function private.touch_updated_at();

create view public.profiles_public
with (security_barrier = true)
as
select
  p.id,
  p.full_name,
  p.avatar_url,
  p.role,
  coalesce(dp.average_rating, 0) as average_rating,
  coalesce(dp.rating_count, 0) as rating_count,
  coalesce(dp.completed_orders, 0) as completed_orders
from public.profiles p
left join public.driver_profiles dp on dp.user_id = p.id
where p.is_active
  and p.account_status = 'active'::public.account_status
  and (
    p.role <> 'driver'::public.app_role
    or dp.approval_status = 'approved'::public.approval_status
  );

comment on view public.profiles_public is
  'Deliberately limited marketplace identity. Never add phone, email, document or location fields.';

insert into public.vehicle_classes (code, display_name, sort_order) values
  ('motorcycle', 'Motorcycle', 10),
  ('tuktuk', 'Tuk-tuk', 20),
  ('pickup', 'Pickup', 30),
  ('van', 'Van', 40),
  ('truck_small', 'Small truck', 50),
  ('truck_large', 'Large truck', 60);
