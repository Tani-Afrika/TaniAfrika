begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

select has_table('public', 'orders', 'orders table exists');
select has_table('public', 'driver_profiles', 'driver compliance table exists');
select has_table('public', 'payment_intents', 'payment intents table exists');
select has_table('public', 'escrow_holds', 'safeguarded-funds table exists');
select has_table('public', 'ledger_entries', 'double-entry ledger exists');
select has_table('public', 'event_outbox', 'transactional outbox exists');

select has_function('public', 'accept_bid', array['uuid', 'uuid'], 'atomic bid acceptance exists');
select has_function('public', 'record_payment_success', array['uuid', 'text', 'bigint', 'timestamp with time zone', 'jsonb'], 'payment posting RPC exists');
select has_function('public', 'record_payout_success', array['uuid', 'text', 'jsonb'], 'payout posting RPC exists');
select has_function('public', 'record_refund_success', array['uuid', 'text', 'jsonb'], 'refund posting RPC exists');

select ok((select relrowsecurity from pg_class where oid = 'public.orders'::regclass), 'orders RLS is enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.payment_intents'::regclass), 'payment intents RLS is enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.ledger_entries'::regclass), 'ledger entries RLS is enabled');
select ok(not has_table_privilege('anon', 'public.payment_intents', 'select'), 'anonymous users cannot read payment intents');
select ok(not has_table_privilege('authenticated', 'public.ledger_entries', 'insert'), 'users cannot write ledger entries');

select has_trigger('public', 'ledger_entries', 'protect_ledger_entry', 'posted ledger entries are immutable');
select has_trigger('public', 'orders', 'orders_status_audit', 'order state changes are audited');

select * from finish();
rollback;
