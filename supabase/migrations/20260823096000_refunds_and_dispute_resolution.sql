-- Complete the safeguarded-payment lifecycle with staff-controlled refunds and
-- financial dispute resolution. Refund transport is handled by a provider
-- adapter; money custody remains with the contracted PSP/bank arrangement.

alter table public.refunds
  add column provider_conversation_id text,
  add column provider_originator_conversation_id text,
  add column failure_code text,
  add column failure_message text,
  add column attempts integer not null default 0 check (attempts >= 0),
  add column next_attempt_at timestamptz not null default now(),
  add column processing_started_at timestamptz;

create unique index refunds_provider_transaction_key
  on public.refunds(provider, provider_transaction_id)
  where provider_transaction_id is not null;
create index refunds_dispatch_idx on public.refunds(status, next_attempt_at)
  where status in ('pending', 'failed');


create or replace function public.queue_order_refund(
  p_order_id uuid,
  p_reason text
)
returns public.refunds
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_hold public.escrow_holds;
  v_refund public.refunds;
begin
  perform private.require_payment_operator();
  if nullif(btrim(p_reason), '') is null then raise exception 'Refund reason is required'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  select * into v_hold from public.escrow_holds where order_id = p_order_id for update;
  if not found or v_hold.status not in ('funded', 'disputed') then
    raise exception 'The safeguarded funds are not refundable';
  end if;
  if exists (
    select 1 from public.payouts p
    where p.escrow_hold_id = v_hold.id and p.status in ('processing', 'succeeded')
  ) then raise exception 'A payout already blocks this refund'; end if;

  update public.escrow_holds
  set status = 'refund_pending', updated_at = now()
  where id = v_hold.id;

  insert into public.refunds (
    order_id, escrow_hold_id, client_id, provider, amount_minor, currency,
    reason, idempotency_key, requested_by
  ) values (
    v_order.id, v_hold.id, v_order.client_id, 'mpesa', v_hold.amount_minor,
    v_hold.currency, btrim(p_reason), 'order-refund:' || v_order.id, (select auth.uid())
  )
  on conflict (idempotency_key) do update
    set reason = excluded.reason, updated_at = now()
  returning * into v_refund;

  insert into public.event_outbox (aggregate_type, aggregate_id, event_type, payload)
  values ('refund', v_refund.id, 'refund.requested', jsonb_build_object(
    'order_id', v_order.id, 'client_id', v_order.client_id,
    'amount_minor', v_refund.amount_minor
  ));
  return v_refund;
end;
$$;

create or replace function public.resolve_financial_dispute(
  p_dispute_id uuid,
  p_resolution public.financial_dispute_status,
  p_notes text
)
returns public.financial_disputes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dispute public.financial_disputes;
  v_order public.orders;
  v_hold public.escrow_holds;
  v_account uuid;
  v_payout public.payouts;
begin
  perform private.require_payment_operator();
  if p_resolution not in ('resolved_release', 'resolved_refund') then
    raise exception 'Resolution must release or refund the safeguarded funds';
  end if;
  if nullif(btrim(p_notes), '') is null then raise exception 'Resolution notes are required'; end if;

  select * into v_dispute from public.financial_disputes where id = p_dispute_id for update;
  if not found or v_dispute.status not in ('open', 'under_review') then
    raise exception 'Dispute is not open';
  end if;
  select * into v_order from public.orders where id = v_dispute.order_id for update;
  select * into v_hold from public.escrow_holds where id = v_dispute.escrow_hold_id for update;
  if not found or v_hold.status <> 'disputed' then raise exception 'Disputed funds were not found'; end if;

  if p_resolution = 'resolved_refund' then
    perform public.queue_order_refund(v_order.id, p_notes);
    update public.financial_disputes
    set status = 'under_review', resolution_notes = btrim(p_notes),
        resolved_by = (select auth.uid()), updated_at = now()
    where id = p_dispute_id returning * into v_dispute;
  else
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
    on conflict (idempotency_key) do update set payout_account_id = excluded.payout_account_id
    returning * into v_payout;
    update public.financial_disputes
    set status = 'resolved_release', resolution_notes = btrim(p_notes),
        resolved_by = (select auth.uid()), resolved_at = now(), updated_at = now()
    where id = p_dispute_id returning * into v_dispute;
    insert into public.event_outbox (aggregate_type, aggregate_id, event_type, payload)
    values ('dispute', v_dispute.id, 'dispute.resolved_release', jsonb_build_object(
      'order_id', v_order.id, 'payout_id', v_payout.id
    ));
  end if;
  return v_dispute;
end;
$$;

create or replace function public.record_refund_success(
  p_refund_id uuid,
  p_provider_transaction_id text,
  p_provider_payload jsonb default '{}'::jsonb
)
returns public.refunds
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_refund public.refunds;
  v_hold public.escrow_holds;
  v_order public.orders;
  v_ledger_txn uuid;
  v_asset_account uuid;
  v_escrow_account uuid;
begin
  perform private.require_payment_operator();
  if nullif(btrim(p_provider_transaction_id), '') is null then
    raise exception 'Provider transaction reference is required';
  end if;
  select * into v_refund from public.refunds where id = p_refund_id for update;
  if not found then raise exception 'Refund not found'; end if;
  if v_refund.status = 'succeeded' then return v_refund; end if;
  if exists (
    select 1 from public.payment_transactions pt
    where pt.provider = v_refund.provider
      and pt.provider_transaction_id = p_provider_transaction_id
      and pt.transaction_type = 'refund'
      and pt.order_id is distinct from v_refund.order_id
  ) then
    update public.refunds
    set status = 'requires_review', failure_code = 'PROVIDER_REFERENCE_REUSED', updated_at = now()
    where id = p_refund_id returning * into v_refund;
    return v_refund;
  end if;

  select * into v_hold from public.escrow_holds where id = v_refund.escrow_hold_id for update;
  select * into v_order from public.orders where id = v_refund.order_id for update;
  if v_hold.status <> 'refund_pending' then raise exception 'Refund is not pending'; end if;
  if v_refund.amount_minor <> v_hold.amount_minor then raise exception 'Partial refunds are not enabled'; end if;

  insert into public.payment_transactions (
    order_id, provider, transaction_type, status, amount_minor, currency,
    provider_transaction_id, provider_payload
  ) values (
    v_order.id, v_refund.provider, 'refund', 'succeeded', v_refund.amount_minor,
    v_refund.currency, p_provider_transaction_id, p_provider_payload
  ) on conflict (provider, provider_transaction_id, transaction_type) where provider_transaction_id is not null
    do nothing;

  insert into public.ledger_transactions (
    reference, source_type, source_id, idempotency_key, description, metadata
  ) values (
    'REFUND-' || v_refund.id, 'refund', v_refund.id, 'refund:' || v_refund.id,
    'Return safeguarded customer funds', jsonb_build_object('order_id', v_order.id)
  ) on conflict (idempotency_key) do nothing returning id into v_ledger_txn;

  if v_ledger_txn is not null then
    v_asset_account := private.get_or_create_ledger_account(
      'asset:provider_clearing:' || lower(v_refund.provider::text) || ':' || v_refund.currency,
      'Provider clearing asset', 'asset', v_refund.currency
    );
    v_escrow_account := private.get_or_create_ledger_account(
      'liability:escrow:' || v_order.id,
      'Customer funds held for order ' || v_order.order_number,
      'liability', v_refund.currency, v_order.client_id, v_order.id
    );
    insert into public.ledger_entries (transaction_id, account_id, side, amount_minor) values
      (v_ledger_txn, v_escrow_account, 'debit', v_refund.amount_minor),
      (v_ledger_txn, v_asset_account, 'credit', v_refund.amount_minor);
    update public.ledger_transactions set posted_at = now() where id = v_ledger_txn;
  end if;

  update public.refunds
  set status = 'succeeded', provider_transaction_id = p_provider_transaction_id,
      provider_response = provider_response || p_provider_payload,
      succeeded_at = now(), updated_at = now()
  where id = v_refund.id returning * into v_refund;
  update public.escrow_holds
  set status = 'refunded', refunded_at = now(), updated_at = now()
  where id = v_hold.id;
  update public.financial_disputes
  set status = 'resolved_refund', resolved_at = now(), updated_at = now()
  where order_id = v_order.id and status in ('open', 'under_review');
  update public.orders
  set status = 'cancelled', cancelled_at = coalesce(cancelled_at, now()),
      cancellation_reason = 'Payment refunded after review', updated_at = now()
  where id = v_order.id;
  insert into public.event_outbox (aggregate_type, aggregate_id, event_type, payload)
  values ('refund', v_refund.id, 'refund.succeeded', jsonb_build_object(
    'order_id', v_order.id, 'client_id', v_order.client_id,
    'amount_minor', v_refund.amount_minor
  ));
  return v_refund;
end;
$$;

revoke execute on function public.queue_order_refund(uuid, text) from public, anon, authenticated;
revoke execute on function public.resolve_financial_dispute(uuid, public.financial_dispute_status, text) from public, anon, authenticated;
revoke execute on function public.record_refund_success(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.queue_order_refund(uuid, text) to service_role;
grant execute on function public.queue_order_refund(uuid, text) to authenticated;
grant execute on function public.resolve_financial_dispute(uuid, public.financial_dispute_status, text) to authenticated;
grant execute on function public.record_refund_success(uuid, text, jsonb) to service_role;

comment on function public.queue_order_refund(uuid, text) is
  'Queues a full safeguarded-funds refund. Runtime role checks restrict use to finance/admin/service operators.';
