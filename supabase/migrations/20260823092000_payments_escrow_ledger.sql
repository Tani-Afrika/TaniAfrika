-- Payment orchestration, safeguarded-funds state, reconciliation and ledger.
-- Monetary values are stored in minor units (cents) and all provider callbacks
-- are idempotent. TaniAfrika must contract with an authorised PSP for actual
-- custody/safeguarding of customer funds; this schema is not a banking licence.

create type public.payment_provider as enum ('mpesa', 'card', 'bank', 'cash', 'manual');
create type public.payment_intent_status as enum (
  'created', 'pending_customer', 'processing', 'succeeded', 'failed', 'cancelled', 'expired', 'requires_review'
);
create type public.payment_transaction_type as enum ('collection', 'payout', 'refund', 'reversal', 'adjustment');
create type public.payment_transaction_status as enum ('pending', 'processing', 'succeeded', 'failed', 'reversed', 'requires_review');
create type public.escrow_status as enum (
  'pending_funding', 'funded', 'release_pending', 'released', 'refund_pending', 'refunded', 'disputed', 'cancelled'
);
create type public.payout_status as enum ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'requires_review');
create type public.refund_status as enum ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'requires_review');
create type public.financial_dispute_status as enum ('open', 'under_review', 'resolved_release', 'resolved_refund', 'closed');
create type public.ledger_account_type as enum ('asset', 'liability', 'revenue', 'expense');
create type public.ledger_entry_side as enum ('debit', 'credit');
create type public.reconciliation_status as enum ('running', 'matched', 'mismatched', 'failed', 'completed');

create table public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  client_id uuid not null references public.profiles(id) on delete restrict,
  provider public.payment_provider not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null default 'KES' check (currency = upper(currency)),
  status public.payment_intent_status not null default 'created',
  idempotency_key text not null,
  payer_phone_e164 text check (payer_phone_e164 is null or payer_phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  provider_merchant_request_id text,
  provider_checkout_request_id text,
  provider_reference text,
  provider_response jsonb not null default '{}'::jsonb,
  failure_code text,
  failure_message text,
  expires_at timestamptz,
  initiated_at timestamptz,
  succeeded_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, idempotency_key)
);

create unique index payment_intents_one_success_per_order_idx
  on public.payment_intents(order_id)
  where status = 'succeeded';
create unique index payment_intents_checkout_request_key
  on public.payment_intents(provider, provider_checkout_request_id)
  where provider_checkout_request_id is not null;
create index payment_intents_pending_idx on public.payment_intents(status, created_at)
  where status in ('created', 'pending_customer', 'processing');

create table public.payment_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider public.payment_provider not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  payload_sha256 text not null check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  processed boolean not null default false,
  processing_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, provider_event_id)
);

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  payment_intent_id uuid references public.payment_intents(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  provider public.payment_provider not null,
  transaction_type public.payment_transaction_type not null,
  status public.payment_transaction_status not null default 'pending',
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null default 'KES',
  provider_transaction_id text,
  provider_conversation_id text,
  provider_occurred_at timestamptz,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index payment_transactions_provider_key
  on public.payment_transactions(provider, provider_transaction_id, transaction_type)
  where provider_transaction_id is not null;
create index payment_transactions_order_idx on public.payment_transactions(order_id, created_at desc);

create table public.escrow_holds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete restrict,
  payment_intent_id uuid not null unique references public.payment_intents(id) on delete restrict,
  client_id uuid not null references public.profiles(id) on delete restrict,
  driver_id uuid not null references public.profiles(id) on delete restrict,
  amount_minor bigint not null check (amount_minor > 0),
  platform_fee_minor bigint not null check (platform_fee_minor >= 0),
  driver_amount_minor bigint not null check (driver_amount_minor >= 0),
  currency char(3) not null default 'KES',
  status public.escrow_status not null default 'pending_funding',
  funded_at timestamptz,
  release_requested_at timestamptz,
  released_at timestamptz,
  refunded_at timestamptz,
  release_due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (amount_minor = platform_fee_minor + driver_amount_minor)
);

create table public.payout_accounts (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete cascade,
  provider public.payment_provider not null,
  destination_token text not null,
  display_hint text not null,
  verified boolean not null default false,
  verified_at timestamptz,
  is_default boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index payout_accounts_one_default_idx
  on public.payout_accounts(driver_id)
  where is_default and active;

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  escrow_hold_id uuid not null references public.escrow_holds(id) on delete restrict,
  driver_id uuid not null references public.profiles(id) on delete restrict,
  payout_account_id uuid references public.payout_accounts(id) on delete restrict,
  provider public.payment_provider not null default 'mpesa',
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null default 'KES',
  status public.payout_status not null default 'pending',
  idempotency_key text not null unique,
  provider_conversation_id text,
  provider_originator_conversation_id text,
  provider_transaction_id text,
  provider_response jsonb not null default '{}'::jsonb,
  failure_code text,
  failure_message text,
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  processing_started_at timestamptz,
  succeeded_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index payouts_one_live_per_hold_idx
  on public.payouts(escrow_hold_id)
  where status in ('pending', 'processing', 'succeeded');
create index payouts_dispatch_idx on public.payouts(status, next_attempt_at)
  where status in ('pending', 'failed');

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  escrow_hold_id uuid not null references public.escrow_holds(id) on delete restrict,
  client_id uuid not null references public.profiles(id) on delete restrict,
  provider public.payment_provider not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null default 'KES',
  reason text not null,
  status public.refund_status not null default 'pending',
  idempotency_key text not null unique,
  provider_transaction_id text,
  provider_response jsonb not null default '{}'::jsonb,
  requested_by uuid references public.profiles(id) on delete set null,
  succeeded_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.financial_disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  escrow_hold_id uuid references public.escrow_holds(id) on delete restrict,
  opened_by uuid not null references public.profiles(id) on delete restrict,
  reason_code text not null,
  description text not null check (char_length(btrim(description)) between 10 and 5000),
  status public.financial_dispute_status not null default 'open',
  assigned_to uuid references public.profiles(id) on delete set null,
  resolution_notes text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index financial_disputes_one_open_per_order_idx
  on public.financial_disputes(order_id)
  where status in ('open', 'under_review');

create table public.ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  account_code text not null unique,
  account_name text not null,
  account_type public.ledger_account_type not null,
  owner_user_id uuid references public.profiles(id) on delete restrict,
  order_id uuid references public.orders(id) on delete restrict,
  currency char(3) not null default 'KES',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.ledger_transactions (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  source_type text not null,
  source_id uuid,
  idempotency_key text not null unique,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  posted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.ledger_transactions(id) on delete restrict,
  account_id uuid not null references public.ledger_accounts(id) on delete restrict,
  side public.ledger_entry_side not null,
  amount_minor bigint not null check (amount_minor > 0),
  created_at timestamptz not null default now()
);

create index ledger_entries_transaction_idx on public.ledger_entries(transaction_id);
create index ledger_entries_account_idx on public.ledger_entries(account_id, created_at);

create table public.reconciliation_runs (
  id uuid primary key default gen_random_uuid(),
  provider public.payment_provider not null,
  status public.reconciliation_status not null default 'running',
  period_start timestamptz not null,
  period_end timestamptz not null,
  matched_count integer not null default 0,
  mismatch_count integer not null default 0,
  report_storage_path text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  check (period_end > period_start)
);

create table public.reconciliation_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.reconciliation_runs(id) on delete cascade,
  provider_reference text not null,
  internal_transaction_id uuid references public.payment_transactions(id) on delete set null,
  provider_amount_minor bigint,
  internal_amount_minor bigint,
  status public.reconciliation_status not null,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function private.require_payment_operator()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if coalesce((select auth.role()), '') <> 'service_role'
     and not private.has_role('finance'::public.app_role)
     and not private.has_role('admin'::public.app_role) then
    raise exception 'Payment operator role required';
  end if;
end;
$$;

create or replace function private.get_or_create_ledger_account(
  p_code text,
  p_name text,
  p_type public.ledger_account_type,
  p_currency char(3),
  p_owner_user_id uuid default null,
  p_order_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.ledger_accounts (
    account_code, account_name, account_type, currency, owner_user_id, order_id
  ) values (
    p_code, p_name, p_type, p_currency, p_owner_user_id, p_order_id
  )
  on conflict (account_code) do update set account_name = excluded.account_name
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function private.assert_ledger_transaction_balanced(p_transaction_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_unbalanced integer;
  v_entry_count integer;
begin
  select count(*) into v_entry_count
  from public.ledger_entries e
  where e.transaction_id = p_transaction_id;

  if v_entry_count < 2 then
    raise exception 'A posted ledger transaction requires at least two entries';
  end if;

  select count(*) into v_unbalanced
  from (
    select a.currency,
      sum(case when e.side = 'debit' then e.amount_minor else -e.amount_minor end) as balance
    from public.ledger_entries e
    join public.ledger_accounts a on a.id = e.account_id
    where e.transaction_id = p_transaction_id
    group by a.currency
    having sum(case when e.side = 'debit' then e.amount_minor else -e.amount_minor end) <> 0
  ) x;

  if v_unbalanced > 0 then
    raise exception 'Ledger transaction is not balanced';
  end if;
end;
$$;

create or replace function private.protect_and_post_ledger_transaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and old.posted_at is not null then
    raise exception 'Posted ledger transactions are immutable';
  end if;
  if tg_op = 'UPDATE' and old.posted_at is not null then
    raise exception 'Posted ledger transactions are immutable';
  end if;
  if tg_op = 'UPDATE' and new.posted_at is not null and old.posted_at is null then
    perform private.assert_ledger_transaction_balanced(new.id);
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function private.protect_posted_ledger_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_transaction_id uuid := case when tg_op = 'DELETE' then old.transaction_id else new.transaction_id end;
begin
  if exists (
    select 1 from public.ledger_transactions t
    where t.id = v_transaction_id and t.posted_at is not null
  ) then
    raise exception 'Entries of a posted ledger transaction are immutable';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger protect_ledger_transaction
  before update or delete on public.ledger_transactions
  for each row execute function private.protect_and_post_ledger_transaction();
create trigger protect_ledger_entry
  before update or delete on public.ledger_entries
  for each row execute function private.protect_posted_ledger_entry();

create or replace function public.record_payment_success(
  p_payment_intent_id uuid,
  p_provider_transaction_id text,
  p_amount_minor bigint,
  p_provider_occurred_at timestamptz default now(),
  p_provider_payload jsonb default '{}'::jsonb
)
returns public.payment_intents
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_intent public.payment_intents;
  v_order public.orders;
  v_hold public.escrow_holds;
  v_ledger_txn uuid;
  v_asset_account uuid;
  v_escrow_account uuid;
begin
  perform private.require_payment_operator();

  select * into v_intent from public.payment_intents where id = p_payment_intent_id for update;
  if not found then raise exception 'Payment intent not found'; end if;
  if v_intent.status = 'succeeded'::public.payment_intent_status then return v_intent; end if;
  if nullif(btrim(p_provider_transaction_id), '') is null then
    raise exception 'Provider transaction reference is required';
  end if;
  if v_intent.amount_minor <> p_amount_minor then
    update public.payment_intents
      set status = 'requires_review', failure_code = 'AMOUNT_MISMATCH', updated_at = now()
      where id = p_payment_intent_id
      returning * into v_intent;
    insert into public.event_outbox (aggregate_type, aggregate_id, event_type, payload)
    values ('payment', v_intent.id, 'payment.requires_review', jsonb_build_object(
      'order_id', v_intent.order_id, 'client_id', v_intent.client_id, 'reason', 'amount_mismatch',
      'expected_amount_minor', v_intent.amount_minor, 'received_amount_minor', p_amount_minor
    ));
    return v_intent;
  end if;
  if exists (
    select 1 from public.payment_transactions pt
    where pt.provider = v_intent.provider
      and pt.provider_transaction_id = p_provider_transaction_id
      and pt.transaction_type = 'collection'
      and pt.payment_intent_id is distinct from v_intent.id
  ) then
    update public.payment_intents
      set status = 'requires_review', failure_code = 'PROVIDER_REFERENCE_REUSED', updated_at = now()
      where id = p_payment_intent_id
      returning * into v_intent;
    insert into public.event_outbox (aggregate_type, aggregate_id, event_type, payload)
    values ('payment', v_intent.id, 'payment.requires_review', jsonb_build_object(
      'order_id', v_intent.order_id, 'client_id', v_intent.client_id, 'reason', 'provider_reference_reused'
    ));
    return v_intent;
  end if;

  select * into v_order from public.orders where id = v_intent.order_id for update;
  if v_order.status <> 'payment_pending'::public.order_status then
    update public.payment_intents
      set status = 'requires_review', failure_code = 'ORDER_NOT_AWAITING_PAYMENT', updated_at = now()
      where id = p_payment_intent_id
      returning * into v_intent;
    insert into public.event_outbox (aggregate_type, aggregate_id, event_type, payload)
    values ('payment', v_intent.id, 'payment.requires_review', jsonb_build_object(
      'order_id', v_intent.order_id, 'client_id', v_intent.client_id, 'reason', 'order_not_awaiting_payment',
      'order_status', v_order.status
    ));
    return v_intent;
  end if;

  insert into public.payment_transactions (
    payment_intent_id, order_id, provider, transaction_type, status,
    amount_minor, currency, provider_transaction_id, provider_occurred_at, provider_payload
  ) values (
    v_intent.id, v_intent.order_id, v_intent.provider, 'collection', 'succeeded',
    p_amount_minor, v_intent.currency, p_provider_transaction_id, p_provider_occurred_at, p_provider_payload
  ) on conflict (provider, provider_transaction_id, transaction_type) where provider_transaction_id is not null
    do nothing;

  insert into public.escrow_holds (
    order_id, payment_intent_id, client_id, driver_id, amount_minor,
    platform_fee_minor, driver_amount_minor, currency, status, funded_at
  ) values (
    v_order.id, v_intent.id, v_order.client_id, v_order.driver_id, p_amount_minor,
    v_order.platform_fee_minor, v_order.driver_earnings_minor, v_intent.currency, 'funded', now()
  )
  on conflict (order_id) do update
    set status = 'funded', funded_at = coalesce(public.escrow_holds.funded_at, now()), updated_at = now()
  returning * into v_hold;

  insert into public.ledger_transactions (
    reference, source_type, source_id, idempotency_key, description, metadata
  ) values (
    'PAYMENT-' || v_intent.id,
    'payment_intent', v_intent.id, 'payment:' || v_intent.id,
    'Customer payment received into safeguarded provider funds',
    jsonb_build_object('order_id', v_order.id, 'provider', v_intent.provider)
  ) on conflict (idempotency_key) do nothing
  returning id into v_ledger_txn;

  if v_ledger_txn is not null then
    v_asset_account := private.get_or_create_ledger_account(
      'asset:provider_clearing:' || lower(v_intent.provider::text) || ':' || v_intent.currency,
      'Provider clearing asset', 'asset', v_intent.currency
    );
    v_escrow_account := private.get_or_create_ledger_account(
      'liability:escrow:' || v_order.id,
      'Customer funds held for order ' || v_order.order_number,
      'liability', v_intent.currency, v_order.client_id, v_order.id
    );

    insert into public.ledger_entries (transaction_id, account_id, side, amount_minor) values
      (v_ledger_txn, v_asset_account, 'debit', p_amount_minor),
      (v_ledger_txn, v_escrow_account, 'credit', p_amount_minor);
    update public.ledger_transactions set posted_at = now() where id = v_ledger_txn;
  end if;

  update public.payment_intents
  set status = 'succeeded', provider_reference = p_provider_transaction_id,
      provider_response = provider_response || p_provider_payload,
      succeeded_at = now(), updated_at = now()
  where id = v_intent.id
  returning * into v_intent;

  update public.orders
  set status = 'assigned', updated_at = now()
  where id = v_order.id;

  insert into public.event_outbox (aggregate_type, aggregate_id, event_type, payload)
  values ('payment', v_intent.id, 'payment.succeeded', jsonb_build_object(
    'payment_intent_id', v_intent.id, 'order_id', v_order.id, 'client_id', v_order.client_id, 'driver_id', v_order.driver_id
  ));

  return v_intent;
end;
$$;

create or replace function public.request_escrow_release(p_order_id uuid)
returns public.payouts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_hold public.escrow_holds;
  v_payout public.payouts;
  v_account uuid;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.client_id <> (select auth.uid()) and not private.is_staff() then raise exception 'Not authorised'; end if;
  if v_order.status <> 'delivered'::public.order_status then raise exception 'Delivery has not been marked complete'; end if;

  select * into v_hold from public.escrow_holds where order_id = p_order_id for update;
  if not found or v_hold.status <> 'funded'::public.escrow_status then
    raise exception 'Escrow hold is not releasable';
  end if;
  if exists (
    select 1 from public.financial_disputes d
    where d.order_id = p_order_id and d.status in ('open', 'under_review')
  ) then raise exception 'A dispute blocks release'; end if;

  select pa.id into v_account
  from public.payout_accounts pa
  where pa.driver_id = v_order.driver_id and pa.active and pa.verified
  order by pa.is_default desc, pa.created_at desc
  limit 1;
  if v_account is null then raise exception 'Driver has no verified payout account'; end if;

  update public.escrow_holds
  set status = 'release_pending', release_requested_at = now(), updated_at = now()
  where id = v_hold.id;

  insert into public.payouts (
    order_id, escrow_hold_id, driver_id, payout_account_id, provider,
    amount_minor, currency, idempotency_key
  ) values (
    v_order.id, v_hold.id, v_order.driver_id, v_account, 'mpesa',
    v_hold.driver_amount_minor, v_hold.currency, 'order-release:' || v_order.id
  )
  on conflict (idempotency_key) do update set idempotency_key = excluded.idempotency_key
  returning * into v_payout;

  insert into public.event_outbox (aggregate_type, aggregate_id, event_type, payload)
  values ('escrow', v_hold.id, 'escrow.release_requested', jsonb_build_object(
    'order_id', v_order.id, 'payout_id', v_payout.id, 'driver_id', v_order.driver_id
  ));

  return v_payout;
end;
$$;

create or replace function public.record_payout_success(
  p_payout_id uuid,
  p_provider_transaction_id text,
  p_provider_payload jsonb default '{}'::jsonb
)
returns public.payouts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payout public.payouts;
  v_hold public.escrow_holds;
  v_order public.orders;
  v_ledger_txn uuid;
  v_asset_account uuid;
  v_escrow_account uuid;
  v_revenue_account uuid;
begin
  perform private.require_payment_operator();
  select * into v_payout from public.payouts where id = p_payout_id for update;
  if not found then raise exception 'Payout not found'; end if;
  if v_payout.status = 'succeeded'::public.payout_status then return v_payout; end if;
  if nullif(btrim(p_provider_transaction_id), '') is null then
    raise exception 'Provider transaction reference is required';
  end if;
  if exists (
    select 1 from public.payment_transactions pt
    where pt.provider = v_payout.provider
      and pt.provider_transaction_id = p_provider_transaction_id
      and pt.transaction_type = 'payout'
      and pt.order_id is distinct from v_payout.order_id
  ) then
    update public.payouts
    set status = 'requires_review', failure_code = 'PROVIDER_REFERENCE_REUSED', updated_at = now()
    where id = p_payout_id returning * into v_payout;
    return v_payout;
  end if;

  select * into v_hold from public.escrow_holds where id = v_payout.escrow_hold_id for update;
  select * into v_order from public.orders where id = v_payout.order_id for update;
  if v_hold.status <> 'release_pending'::public.escrow_status then raise exception 'Escrow is not pending release'; end if;

  insert into public.payment_transactions (
    order_id, provider, transaction_type, status, amount_minor, currency,
    provider_transaction_id, provider_payload
  ) values (
    v_order.id, v_payout.provider, 'payout', 'succeeded', v_payout.amount_minor, v_payout.currency,
    p_provider_transaction_id, p_provider_payload
  ) on conflict (provider, provider_transaction_id, transaction_type) where provider_transaction_id is not null
    do nothing;

  insert into public.ledger_transactions (
    reference, source_type, source_id, idempotency_key, description, metadata
  ) values (
    'PAYOUT-' || v_payout.id, 'payout', v_payout.id, 'payout:' || v_payout.id,
    'Release safeguarded funds and recognise platform fee', jsonb_build_object('order_id', v_order.id)
  ) on conflict (idempotency_key) do nothing returning id into v_ledger_txn;

  if v_ledger_txn is not null then
    v_asset_account := private.get_or_create_ledger_account(
      'asset:provider_clearing:' || lower(v_payout.provider::text) || ':' || v_payout.currency,
      'Provider clearing asset', 'asset', v_payout.currency
    );
    v_escrow_account := private.get_or_create_ledger_account(
      'liability:escrow:' || v_order.id,
      'Customer funds held for order ' || v_order.order_number,
      'liability', v_payout.currency, v_order.client_id, v_order.id
    );
    v_revenue_account := private.get_or_create_ledger_account(
      'revenue:platform_fee:' || v_payout.currency,
      'Marketplace commission revenue', 'revenue', v_payout.currency
    );

    insert into public.ledger_entries (transaction_id, account_id, side, amount_minor) values
      (v_ledger_txn, v_escrow_account, 'debit', v_hold.amount_minor),
      (v_ledger_txn, v_asset_account, 'credit', v_hold.driver_amount_minor),
      (v_ledger_txn, v_revenue_account, 'credit', v_hold.platform_fee_minor);
    update public.ledger_transactions set posted_at = now() where id = v_ledger_txn;
  end if;

  update public.payouts
  set status = 'succeeded', provider_transaction_id = p_provider_transaction_id,
      provider_response = provider_response || p_provider_payload,
      succeeded_at = now(), updated_at = now()
  where id = v_payout.id returning * into v_payout;

  update public.escrow_holds set status = 'released', released_at = now(), updated_at = now()
  where id = v_hold.id;
  update public.orders set status = 'completed', completed_at = now(), updated_at = now()
  where id = v_order.id;
  update public.driver_profiles
  set completed_orders = completed_orders + 1, updated_at = now()
  where user_id = v_order.driver_id;

  insert into public.event_outbox (aggregate_type, aggregate_id, event_type, payload)
  values ('payout', v_payout.id, 'payout.succeeded', jsonb_build_object(
    'order_id', v_order.id, 'driver_id', v_order.driver_id, 'amount_minor', v_payout.amount_minor
  ));
  return v_payout;
end;
$$;

create trigger payment_intents_touch_updated_at before update on public.payment_intents
  for each row execute function private.touch_updated_at();
create trigger payment_transactions_touch_updated_at before update on public.payment_transactions
  for each row execute function private.touch_updated_at();
create trigger escrow_holds_touch_updated_at before update on public.escrow_holds
  for each row execute function private.touch_updated_at();
create trigger payout_accounts_touch_updated_at before update on public.payout_accounts
  for each row execute function private.touch_updated_at();
create trigger payouts_touch_updated_at before update on public.payouts
  for each row execute function private.touch_updated_at();
create trigger refunds_touch_updated_at before update on public.refunds
  for each row execute function private.touch_updated_at();
create trigger financial_disputes_touch_updated_at before update on public.financial_disputes
  for each row execute function private.touch_updated_at();

comment on table public.ledger_entries is
  'Immutable double-entry financial journal. Never calculate balances from order status alone.';
comment on table public.escrow_holds is
  'Application hold/release state. Actual customer funds must be safeguarded by an authorised PSP or bank arrangement.';
