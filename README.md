# TaniAfrika platform foundation

TaniAfrika is a two-sided Kenyan moving and delivery marketplace for clients,
verified drivers, operations staff, support and finance. This repository now
contains the existing Next.js application plus a backend-first Supabase
foundation designed for controlled growth.

## What is implemented

- 53 PostgreSQL tables covering identity, driver compliance, fleets,
  organisations, marketplace orders, bidding, dispatch, location, payments,
  safeguarded-funds state, payouts, refunds, double-entry accounting, support,
  safety, notifications, consent, audit and operations.
- Row-level security, least-privilege grants and private Storage policies.
- Atomic order/bid state transitions and driver reservation.
- M-Pesa collection, status reconciliation, driver payout and refund adapters.
- Idempotent provider callbacks, immutable posted ledger entries and a
  transactional event outbox.
- A draft green/amber “Reliable Neighbour” theme record that can be replaced by
  the final design tokens without changing the database model.

This is a deployable foundation, not a production launch approval. Complete the
provider certification, migration rehearsal, load/security testing and Kenyan
regulatory review in the launch gates below.

## Architecture decision

Start as a modular Supabase/Postgres application, not dozens of independently
deployed microservices. Strong domain boundaries, database transactions and the
outbox keep the first system understandable. Payment/notification/dispatch
workers can be extracted later when observed scale or ownership requires it.

See:

- [Backend architecture](docs/BACKEND_ARCHITECTURE.md)
- [Deployment and operations](docs/DEPLOYMENT_AND_OPERATIONS.md)
- [Legacy migration plan](docs/LEGACY_MIGRATION_PLAN.md)
- [Supabase implementation](supabase/README.md)

## Local start

Requirements: Node.js 20+, Docker and the Supabase CLI.

```bash
cp .env.example .env.local
cp supabase/functions/.env.example supabase/functions/.env.local
npm install
supabase start
supabase db reset
npm run audit:backend
npm run dev
```

Populate local public/secret keys printed by `supabase start`. Use Safaricom's
sandbox only for local integration testing.

## Validation

```bash
npm run audit:backend
supabase test db
npm run lint
npm run build
```

The static backend audit does not replace executing migrations against a local
Supabase database. Do not push these clean-baseline migrations directly into a
database that already contains the legacy tables; follow the migration plan.

## Launch blockers

1. Contract with Safaricom and/or a CBK-authorised payment provider or bank for
   collection, safeguarding, payout and refund responsibility.
2. Have Kenyan counsel review payment wording, marketplace terms, privacy,
   retention, driver onboarding and Transport Network Company obligations.
3. Rehearse legacy data conversion and rollback on a production-like branch.
4. Run integration, RLS, callback replay, ledger reconciliation, load, backup
   restore and incident-response tests.
5. Keep `mpesa_payments` and `automatic_escrow_release` feature flags disabled
   until the relevant launch gates are signed off.
