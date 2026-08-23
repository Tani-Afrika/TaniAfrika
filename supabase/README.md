# Supabase backend

## Migration order

| Migration | Module |
|---|---|
| `20260823090000_core_identity.sql` | Identity, organisations, fleet and compliance |
| `20260823091000_marketplace_dispatch.sql` | Marketplace, bidding, dispatch, PostGIS and outbox |
| `20260823092000_payments_escrow_ledger.sql` | Payment orchestration, safeguarded-funds state and ledger |
| `20260823093000_safety_support_operations.sql` | Safety, support, notifications, privacy and operations |
| `20260823094000_rls_and_storage.sql` | Grants, RLS policies and Storage buckets |
| `20260823095000_hardening_fixes.sql` | Cross-domain constraints and legacy compatibility |
| `20260823096000_refunds_and_dispute_resolution.sql` | Refund dispatch state and finance resolution RPCs |

These files target a clean project and must run in filename order.

## Edge Functions

| Function | Authentication | Responsibility |
|---|---|---|
| `payment-initiate` | User JWT | Validate an owned order and create/reuse an idempotent STK request |
| `mpesa-callback` | Callback secret | Persist/de-duplicate collection results and post payment success |
| `payment-reconcile` | Scheduler secret | Query stale STK requests and expire unpaid reservations |
| `escrow-release` | User JWT | Ask to release a delivered order's safeguarded funds |
| `payout-dispatch` | Scheduler secret | Atomically claim and submit driver payouts |
| `mpesa-b2c-callback` | Callback secret | Post driver payout results |
| `refund-dispatch` | Scheduler secret | Atomically claim and submit approved customer refunds |
| `mpesa-refund-callback` | Callback secret | Post refund results |
| `outbox-dispatch` | Scheduler secret | Turn durable events into idempotent notifications/integrations |

Shared helpers live in `_shared`. Keep provider credentials in Supabase Edge
Function secrets. `system_settings` is explicitly for non-secret settings.

## Transactional RPCs

- `accept_bid` — locks order and bid, reserves the driver and prices the order.
- `update_order_status` — enforces actor-specific delivery transitions.
- `record_payment_success` — posts collection, hold and balanced ledger entries.
- `request_escrow_release` — queues the verified driver's payout.
- `record_payout_success` — posts payout, completes order and updates earnings.
- `open_financial_dispute` / `resolve_financial_dispute` — freezes and resolves
  held funds under role checks.
- `queue_order_refund` / `record_refund_success` — return safeguarded funds and
  post the refund ledger transaction.
- `claim_outbox_events` / `complete_outbox_event` — retry-safe integration work.

All money-posting RPCs are security-definer functions with internal role checks.
Do not grant direct write access to the ledger or provider-event tables.

## Tests

```bash
supabase db reset
supabase test db
node scripts/static-backend-audit.mjs
```

Add integration tests for each actor and every denial case before production:
client A cannot read client B's order, drivers cannot see unassigned private
details, users cannot self-approve, support cannot post money, callbacks are
idempotent, and posted ledger entries cannot be updated or deleted.
