import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const migrationDir = join(root, 'supabase', 'migrations');
const functionDir = join(root, 'supabase', 'functions');
const migrationFiles = readdirSync(migrationDir)
  .filter((name) => name.endsWith('.sql'))
  .sort();
const migrationSources = migrationFiles.map((name) => ({
  name,
  source: readFileSync(join(migrationDir, name), 'utf8'),
}));
const migrations = migrationSources
  .map(({ source }) => source)
  .join('\n');
const config = readFileSync(join(root, 'supabase', 'config.toml'), 'utf8');

const requiredTables = [
  'profiles', 'user_roles', 'driver_profiles', 'organisations', 'organisation_members',
  'vehicles', 'driver_documents', 'vehicle_documents', 'service_types', 'service_areas',
  'pricing_rules', 'orders', 'order_stops', 'order_items', 'bids', 'bid_messages',
  'order_status_history', 'driver_locations', 'driver_location_events', 'dispatch_offers',
  'event_outbox', 'payment_intents', 'payment_provider_events', 'payment_transactions',
  'escrow_holds', 'payout_accounts', 'payouts', 'refunds', 'financial_disputes',
  'ledger_accounts', 'ledger_transactions', 'ledger_entries', 'reconciliation_runs',
  'reconciliation_items', 'reviews', 'support_cases', 'safety_incidents', 'notifications',
  'audit_events', 'consent_records', 'data_subject_requests', 'system_settings', 'feature_flags',
];
const requiredRpc = [
  'accept_bid', 'update_order_status', 'record_payment_success', 'request_escrow_release',
  'record_payout_success', 'queue_order_refund', 'resolve_financial_dispute',
  'record_refund_success', 'open_financial_dispute', 'claim_outbox_events',
];
const requiredFunctions = [
  'payment-initiate', 'mpesa-callback', 'payment-reconcile', 'escrow-release',
  'payout-dispatch', 'mpesa-b2c-callback', 'refund-dispatch',
  'mpesa-refund-callback', 'outbox-dispatch',
];

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

for (const table of requiredTables) {
  check(new RegExp(`create\\s+table\\s+public\\.${table}\\b`, 'i').test(migrations), `missing table: ${table}`);
}
for (const rpc of requiredRpc) {
  check(new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${rpc}\\b`, 'i').test(migrations), `missing RPC: ${rpc}`);
}
for (const name of requiredFunctions) {
  check(existsSync(join(functionDir, name, 'index.ts')), `missing Edge Function: ${name}`);
  check(config.includes(`[functions.${name}]`), `missing config entry: ${name}`);
}
for (const { name, source } of migrationSources) {
  const dollarDelimiters = source.match(/\$\$/g)?.length ?? 0;
  check(dollarDelimiters % 2 === 0, `unbalanced dollar quote in migration: ${name}`);
}

check(/enable row level security/i.test(migrations), 'RLS enablement is missing');
check(/revoke all on all tables in schema public from anon, authenticated/i.test(migrations), 'default table grants are not revoked');
check(/create trigger protect_ledger_entry/i.test(migrations), 'posted ledger entries are not protected');
check(/private\.require_payment_operator\(\)/i.test(migrations), 'money operator guard is missing');
check(/idempotency-key/i.test(readFileSync(join(functionDir, 'payment-initiate', 'index.ts'), 'utf8')), 'payment initiation lacks idempotency handling');

const clientSource = readdirSync(join(root, 'src'), { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.(ts|tsx)$/.test(entry.name))
  .map((entry) => readFileSync(join(entry.parentPath, entry.name), 'utf8'))
  .join('\n');
check(!/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/.test(clientSource), 'service role key is exposed as a public environment variable');
check(!/access-control-allow-origin['"]?\s*:\s*['"]\*/i.test(readFileSync(join(functionDir, '_shared', 'http.ts'), 'utf8')), 'wildcard CORS is enabled');

const allTables = new Set(
  [...migrations.matchAll(/create\s+table\s+public\.([a-z_]+)\b/gi)].map((match) => match[1]),
);
check(allTables.size === 53, `expected 53 public tables, found ${allTables.size}`);

if (failures.length) {
  console.error(`Backend contract audit failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Backend contract audit passed: ${allTables.size} tables, ${requiredRpc.length} critical RPCs, ${requiredFunctions.length} Edge Functions.`);
