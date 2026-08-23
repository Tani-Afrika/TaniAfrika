# Deployment and operations runbook

## Environments

Use separate Supabase projects for development, staging and production. Payment
provider sandboxes must never share credentials, callbacks or data with
production. Apply production changes from CI with a reviewed migration commit;
do not edit production schema manually in the dashboard.

## 1. Validate the clean baseline

```bash
npm install
supabase start
supabase db reset
npm run audit:backend
supabase test db
npm run lint
npm run build
```

`supabase db reset` is destructive and is only appropriate for a local disposable
database. The SQL contract tests require the local pgtap extension.

## 2. Configure application environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable key when the app is migrated)
- `SUPABASE_SERVICE_ROLE_KEY` for server-only administrator actions

The service key must not be bundled into browser code, logged or stored in a
public deployment setting.

## 3. Configure Edge Function secrets

Create a populated file outside source control from
`supabase/functions/.env.example`, then run:

```bash
supabase secrets set --env-file /secure/path/taniafrika-functions.env
```

Use independent random callback tokens and a scheduler secret of at least 32
characters. Restrict `APP_ORIGINS` to exact HTTPS application origins. Configure
Safaricom/PSP production credentials only after commercial and security approval.

Required provider callback URLs:

| Purpose | Edge Function |
|---|---|
| STK collection result | `mpesa-callback` |
| Driver payout result/timeout | `mpesa-b2c-callback` |
| Customer refund result/timeout | `mpesa-refund-callback` |

Callback secrets are query tokens because the reference provider interface does
not supply an application JWT. Use provider-side IP allowlisting, mutual TLS or
signed requests if the contracted production API supports them.

## 4. Deploy migrations and functions

For a new environment:

```bash
supabase link --project-ref PROJECT_REF
supabase db push --dry-run
supabase db push
supabase functions deploy payment-initiate
supabase functions deploy mpesa-callback
supabase functions deploy payment-reconcile
supabase functions deploy escrow-release
supabase functions deploy payout-dispatch
supabase functions deploy mpesa-b2c-callback
supabase functions deploy refund-dispatch
supabase functions deploy mpesa-refund-callback
supabase functions deploy outbox-dispatch
```

For an existing database, stop and follow `LEGACY_MIGRATION_PLAN.md`. The first
migration creates types/tables and is not an in-place legacy upgrade.

## 5. Schedule workers

Use the Supabase scheduler or the team's infrastructure scheduler to call the
following POST endpoints with `x-cron-secret`:

| Function | Suggested starting interval | Purpose |
|---|---:|---|
| `payment-reconcile` | 2 minutes | Query stale STK requests and expire abandoned reservations |
| `payout-dispatch` | 1 minute | Claim and submit driver payouts |
| `refund-dispatch` | 1 minute | Claim and submit approved refunds |
| `outbox-dispatch` | 15 seconds | Create/deliver idempotent notifications |

Adjust intervals from measured traffic and provider rate limits. Never put the
scheduler secret in a client bundle or URL.

## 6. Feature activation

The migrations seed payment and automation flags disabled. Activate in stages:

1. internal users with provider sandbox;
2. staff-only live penny/small-value validation approved by finance;
3. a limited service area and small customer cohort;
4. broader rollout after reconciliation and support metrics are healthy.

Keep `automatic_escrow_release` off until policy, dispute window and provider
settlement behaviour are approved. Exact green/amber visual tokens live in the
`brand_theme` system setting only as a draft; UI deployment should use the final
designer-supplied token package.

## 7. Observability and alerts

Create dashboards and alerts for:

- provider callback failures, unknown references and callback lag;
- `requires_review` payment, payout and refund rows;
- outbox dead letters and retry age;
- pending payments older than the configured window;
- funded/release-pending/refund-pending holds beyond their service-level target;
- daily provider-versus-ledger mismatches;
- database connection, CPU, storage, replication and slow-query thresholds;
- authentication anomalies, staff role changes and document access failures.

Never log access tokens, full national identifiers, security credentials, raw
payment secrets or unnecessary phone/address data. Attach a correlation ID—not a
provider secret—to every operational incident.

## 8. Backup and recovery

- Confirm the Supabase plan's point-in-time recovery and retention.
- Export provider settlement/reconciliation evidence to approved private storage.
- Test a restore into an isolated project at least quarterly and before a major
  financial schema change.
- Record recovery time and recovery point objectives with accountable owners.
- Keep a tested procedure for disabling new payments while retaining read-only
  order/support access.

## 9. Production launch gates

| Gate | Evidence | Owner |
|---|---|---|
| Data migration | Rehearsal report, row counts, checksums, rollback timing | Engineering/data |
| Access control | Cross-role RLS suite and security review | Security/engineering |
| Money | Provider certification, replay tests, balanced ledger, reconciliation | Finance/engineering |
| Legal/privacy | Terms, privacy notice, DPIA decision, retention schedule | Counsel/privacy |
| Transport | Driver/vehicle onboarding and licence/insurance process | Operations/counsel |
| Reliability | Load test, restore test, alerts and incident runbook | Engineering/operations |
| Support | Dispute, refund, incident and account recovery procedures | Support/finance |

No single migration or code review satisfies these gates; each requires recorded
evidence from the named function.
