-- ==============================================================================
-- TaniAfrika — Fix Auth Triggers & Seed Test Accounts
-- Run this entire script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/xnhnqbgpezfcvjptufao/sql/new
-- ==============================================================================

-- 1. Ensure required extensions exist
create extension if not exists pgcrypto with schema extensions;

-- 2. Grant permissions to supabase_auth_admin so GoTrue can execute triggers
grant usage on schema private to supabase_auth_admin, postgres, service_role, authenticated, anon;
grant all on all functions in schema private to supabase_auth_admin, postgres, service_role, authenticated, anon;
grant all on schema public to supabase_auth_admin, postgres, service_role;

-- 3. Fix handle_new_user trigger function to be idempotent (prevents "Database error checking email")
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
    when new.raw_user_meta_data ->> 'role' = 'admin' then 'admin'::public.app_role
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
  ) on conflict (id) do update set
    role = excluded.role,
    full_name = excluded.full_name,
    account_status = excluded.account_status,
    approval_status = excluded.approval_status,
    is_active = true;

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

-- 4. Insert or Update all 4 test accounts directly into auth.users and profiles
do $$
declare
  v_admin_id uuid := 'a0000000-0000-0000-0000-000000000001'::uuid;
  v_driver_appr_id uuid := 'd0000000-0000-0000-0000-000000000001'::uuid;
  v_driver_pend_id uuid := 'd0000000-0000-0000-0000-000000000002'::uuid;
  v_client_id uuid := 'c0000000-0000-0000-0000-000000000001'::uuid;
  v_encrypted_pw text := extensions.crypt('TestPassword123!', extensions.gen_salt('bf'));
  v_veh_id uuid := 'e0000000-0000-0000-0000-000000000001'::uuid;
begin

  -- A. ADMIN: admin@taniafrika.com
  insert into auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
  ) values (
    v_admin_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@taniafrika.com',
    v_encrypted_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Wilfred Admin","role":"admin"}'::jsonb,
    'authenticated',
    'authenticated',
    now(),
    now()
  ) on conflict (id) do update set
    encrypted_password = v_encrypted_pw,
    email_confirmed_at = now();

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) values (
    v_admin_id,
    v_admin_id,
    json_build_object('sub', v_admin_id::text, 'email', 'admin@taniafrika.com'),
    'email',
    'admin@taniafrika.com',
    now(),
    now(),
    now()
  ) on conflict (provider, provider_id) do nothing;

  -- B. DRIVER (APPROVED): driver@taniafrika.com
  insert into auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
  ) values (
    v_driver_appr_id,
    '00000000-0000-0000-0000-000000000000',
    'driver@taniafrika.com',
    v_encrypted_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"John Driver (Approved)","role":"driver"}'::jsonb,
    'authenticated',
    'authenticated',
    now(),
    now()
  ) on conflict (id) do update set
    encrypted_password = v_encrypted_pw,
    email_confirmed_at = now();

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) values (
    v_driver_appr_id,
    v_driver_appr_id,
    json_build_object('sub', v_driver_appr_id::text, 'email', 'driver@taniafrika.com'),
    'email',
    'driver@taniafrika.com',
    now(),
    now(),
    now()
  ) on conflict (provider, provider_id) do nothing;

  -- C. DRIVER (PENDING): pending.driver@taniafrika.com
  insert into auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
  ) values (
    v_driver_pend_id,
    '00000000-0000-0000-0000-000000000000',
    'pending.driver@taniafrika.com',
    v_encrypted_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Sam Driver (Pending)","role":"driver"}'::jsonb,
    'authenticated',
    'authenticated',
    now(),
    now()
  ) on conflict (id) do update set
    encrypted_password = v_encrypted_pw,
    email_confirmed_at = now();

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) values (
    v_driver_pend_id,
    v_driver_pend_id,
    json_build_object('sub', v_driver_pend_id::text, 'email', 'pending.driver@taniafrika.com'),
    'email',
    'pending.driver@taniafrika.com',
    now(),
    now(),
    now()
  ) on conflict (provider, provider_id) do nothing;

  -- D. CLIENT: client@taniafrika.com
  insert into auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
  ) values (
    v_client_id,
    '00000000-0000-0000-0000-000000000000',
    'client@taniafrika.com',
    v_encrypted_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Nicholas Client","role":"client"}'::jsonb,
    'authenticated',
    'authenticated',
    now(),
    now()
  ) on conflict (id) do update set
    encrypted_password = v_encrypted_pw,
    email_confirmed_at = now();

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) values (
    v_client_id,
    v_client_id,
    json_build_object('sub', v_client_id::text, 'email', 'client@taniafrika.com'),
    'email',
    'client@taniafrika.com',
    now(),
    now(),
    now()
  ) on conflict (provider, provider_id) do nothing;

  -- E. PROFILES & ROLES SYNC
  insert into public.profiles (id, role, full_name, account_status, approval_status, is_active)
  values
    (v_admin_id, 'admin', 'Wilfred Admin', 'active', 'approved', true),
    (v_driver_appr_id, 'driver', 'John Driver (Approved)', 'active', 'approved', true),
    (v_driver_pend_id, 'driver', 'Sam Driver (Pending)', 'active', 'pending', true),
    (v_client_id, 'client', 'Nicholas Client', 'active', 'approved', true)
  on conflict (id) do update set
    role = excluded.role,
    full_name = excluded.full_name,
    account_status = excluded.account_status,
    approval_status = excluded.approval_status,
    is_active = true;

  insert into public.user_roles (user_id, role)
  values
    (v_admin_id, 'admin'),
    (v_driver_appr_id, 'driver'),
    (v_driver_pend_id, 'driver'),
    (v_client_id, 'client')
  on conflict (user_id, role) do nothing;

  insert into public.driver_profiles (user_id, approval_status, verification_status)
  values
    (v_driver_appr_id, 'approved', 'verified'),
    (v_driver_pend_id, 'pending', 'pending')
  on conflict (user_id) do update set
    approval_status = excluded.approval_status,
    verification_status = excluded.verification_status;

  -- F. ATTACH VERIFIED VEHICLE FOR APPROVED DRIVER (W4 BIDDING READY)
  insert into public.vehicles (
    id, driver_id, vehicle_type, plate_number, make, model, capacity_kg, is_verified, is_active, verification_status
  ) values (
    v_veh_id, v_driver_appr_id, 'truck_small', 'KDA 888X', 'Isuzu', 'NPR Box Truck', 3500, true, true, 'verified'
  ) on conflict (plate_number) do update set
    driver_id = v_driver_appr_id,
    is_verified = true,
    is_active = true;

  insert into public.driver_vehicle_assignments (driver_id, vehicle_id)
  values (v_driver_appr_id, v_veh_id)
  on conflict do nothing;

end $$;
