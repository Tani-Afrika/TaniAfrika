-- Least-privilege grants, row-level security and private Storage policies.

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant usage on schema public to authenticated;
grant usage on schema private to authenticated;

do $$
declare
  r record;
begin
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
  loop
    execute format('alter table public.%I enable row level security', r.relname);
  end loop;
end;
$$;

grant execute on function private.has_role(public.app_role) to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_staff() to authenticated;
grant execute on function private.is_approved_driver() to authenticated;
grant execute on function private.is_order_client(uuid) to authenticated;
grant execute on function private.is_order_driver(uuid) to authenticated;
grant execute on function private.is_order_party(uuid) to authenticated;
grant execute on function private.is_bid_party(uuid) to authenticated;

-- Identity and organisation data.
grant select on public.profiles to authenticated;
grant update (full_name, phone, phone_e164, avatar_url, locale, timezone, last_seen_at) on public.profiles to authenticated;
grant select on public.profiles_public to authenticated;
grant select on public.user_roles to authenticated;
grant select on public.driver_profiles to authenticated;
grant update (
  national_id_last4, driving_licence_number, driving_licence_expires_on,
  good_conduct_expires_on, years_experience, bio
) on public.driver_profiles to authenticated;

create policy profiles_select_self_staff_or_active_counterparty
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or private.is_staff()
  or exists (
    select 1 from public.orders o
    where o.status in ('assigned', 'driver_en_route', 'arrived', 'loading', 'picked_up', 'in_transit', 'delivered', 'completed', 'disputed')
      and (
        (o.client_id = (select auth.uid()) and o.driver_id = profiles.id)
        or (o.driver_id = (select auth.uid()) and o.client_id = profiles.id)
      )
  )
);

create policy profiles_update_self
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy user_roles_select_self_or_staff
on public.user_roles for select to authenticated
using (user_id = (select auth.uid()) or private.is_staff());

create policy driver_profiles_select_self_or_staff
on public.driver_profiles for select to authenticated
using (user_id = (select auth.uid()) or private.is_staff());

create policy driver_profiles_update_self
on public.driver_profiles for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.organisations, public.organisation_members, public.saved_places to authenticated;

create policy organisations_select_member_or_staff
on public.organisations for select to authenticated
using (
  private.is_staff()
  or exists (
    select 1 from public.organisation_members om
    where om.organisation_id = organisations.id
      and om.user_id = (select auth.uid())
      and om.removed_at is null
  )
);
create policy organisations_insert_owner
on public.organisations for insert to authenticated
with check (created_by = (select auth.uid()));
create policy organisations_update_admin_member
on public.organisations for update to authenticated
using (
  private.is_staff()
  or exists (
    select 1 from public.organisation_members om
    where om.organisation_id = organisations.id
      and om.user_id = (select auth.uid())
      and om.member_role in ('owner', 'admin') and om.removed_at is null
  )
);
create policy organisations_delete_owner
on public.organisations for delete to authenticated
using (
  private.is_staff()
  or exists (
    select 1 from public.organisation_members om
    where om.organisation_id = organisations.id
      and om.user_id = (select auth.uid())
      and om.member_role = 'owner' and om.removed_at is null
  )
);

create policy organisation_members_select_same_organisation
on public.organisation_members for select to authenticated
using (
  private.is_staff()
  or exists (
    select 1 from public.organisation_members mine
    where mine.organisation_id = organisation_members.organisation_id
      and mine.user_id = (select auth.uid()) and mine.removed_at is null
  )
);
create policy organisation_members_manage_by_owner_or_admin
on public.organisation_members for all to authenticated
using (
  private.is_staff()
  or exists (
    select 1 from public.organisation_members mine
    where mine.organisation_id = organisation_members.organisation_id
      and mine.user_id = (select auth.uid())
      and mine.member_role in ('owner', 'admin') and mine.removed_at is null
  )
)
with check (
  private.is_staff()
  or exists (
    select 1 from public.organisation_members mine
    where mine.organisation_id = organisation_members.organisation_id
      and mine.user_id = (select auth.uid())
      and mine.member_role in ('owner', 'admin') and mine.removed_at is null
  )
);

create policy saved_places_owner_all
on public.saved_places for all to authenticated
using (user_id = (select auth.uid()) or private.is_staff())
with check (user_id = (select auth.uid()) or private.is_staff());

-- Fleet and compliance.
grant select on public.vehicle_classes to authenticated;
grant select, insert on public.vehicles to authenticated;
grant update (make, model, year, colour, capacity_kg, volume_m3, photo_url, is_active) on public.vehicles to authenticated;
grant select, insert, update, delete on public.driver_vehicle_assignments to authenticated;
grant select, insert on public.driver_documents, public.vehicle_documents to authenticated;

create policy vehicle_classes_read
on public.vehicle_classes for select to authenticated using (active or private.is_staff());

create policy vehicles_select_owner_counterparty_or_staff
on public.vehicles for select to authenticated
using (
  driver_id = (select auth.uid())
  or owner_id = (select auth.uid())
  or private.is_staff()
  or exists (
    select 1 from public.orders o
    where o.vehicle_id = vehicles.id and private.is_order_party(o.id)
  )
);
create policy vehicles_insert_driver
on public.vehicles for insert to authenticated
with check (driver_id = (select auth.uid()) and not is_verified and verification_status <> 'verified');
create policy vehicles_update_owner
on public.vehicles for update to authenticated
using (driver_id = (select auth.uid()) or owner_id = (select auth.uid()))
with check (driver_id = (select auth.uid()) or owner_id = (select auth.uid()));

create policy driver_vehicle_assignments_select_involved_or_staff
on public.driver_vehicle_assignments for select to authenticated
using (
  driver_id = (select auth.uid())
  or private.is_staff()
  or exists (select 1 from public.vehicles v where v.id = vehicle_id and v.owner_id = (select auth.uid()))
);
create policy driver_vehicle_assignments_manage_owner_or_staff
on public.driver_vehicle_assignments for all to authenticated
using (
  private.is_staff()
  or exists (select 1 from public.vehicles v where v.id = vehicle_id and v.owner_id = (select auth.uid()))
)
with check (
  private.is_staff()
  or exists (select 1 from public.vehicles v where v.id = vehicle_id and v.owner_id = (select auth.uid()))
);

create policy driver_documents_select_owner_or_staff
on public.driver_documents for select to authenticated
using (driver_id = (select auth.uid()) or private.is_staff());
create policy driver_documents_insert_owner
on public.driver_documents for insert to authenticated
with check (driver_id = (select auth.uid()) and verification_status = 'pending');
create policy vehicle_documents_select_owner_or_staff
on public.vehicle_documents for select to authenticated
using (
  private.is_staff()
  or exists (select 1 from public.vehicles v where v.id = vehicle_id and v.driver_id = (select auth.uid()))
);
create policy vehicle_documents_insert_owner
on public.vehicle_documents for insert to authenticated
with check (
  verification_status = 'pending'
  and exists (select 1 from public.vehicles v where v.id = vehicle_id and v.driver_id = (select auth.uid()))
);

-- Marketplace reference data and orders.
grant select on public.service_types, public.service_areas, public.pricing_rules to authenticated;
create policy service_types_read on public.service_types for select to authenticated using (active or private.is_staff());
create policy service_areas_read on public.service_areas for select to authenticated using (active or private.is_staff());
create policy pricing_rules_read on public.pricing_rules for select to authenticated using (active or private.is_staff());

grant select, insert on public.orders to authenticated;
grant select, insert, update, delete on public.order_stops, public.order_items to authenticated;
grant select, insert on public.order_attachments to authenticated;

create policy orders_select_participant_open_driver_or_staff
on public.orders for select to authenticated
using (
  client_id = (select auth.uid())
  or driver_id = (select auth.uid())
  or private.is_staff()
  or (status = 'pending' and private.is_approved_driver())
);
create policy orders_insert_client
on public.orders for insert to authenticated
with check (
  client_id = (select auth.uid())
  and status = 'pending'
  and driver_id is null
  and vehicle_id is null
  and accepted_bid_id is null
  and price_agreed is null
  and total_amount_minor is null
  and platform_fee_minor is null
  and driver_earnings_minor is null
  and (
    organisation_id is null
    or exists (
      select 1 from public.organisation_members om
      where om.organisation_id = orders.organisation_id
        and om.user_id = (select auth.uid()) and om.removed_at is null
    )
  )
);

create policy order_stops_select_party on public.order_stops for select to authenticated
using (private.is_order_party(order_id));
create policy order_stops_client_manage_draft on public.order_stops for all to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and o.client_id = (select auth.uid()) and o.status in ('draft', 'pending')))
with check (exists (select 1 from public.orders o where o.id = order_id and o.client_id = (select auth.uid()) and o.status in ('draft', 'pending')));
create policy order_items_select_party on public.order_items for select to authenticated
using (private.is_order_party(order_id));
create policy order_items_client_manage_draft on public.order_items for all to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and o.client_id = (select auth.uid()) and o.status in ('draft', 'pending')))
with check (exists (select 1 from public.orders o where o.id = order_id and o.client_id = (select auth.uid()) and o.status in ('draft', 'pending')));
create policy order_attachments_select_party on public.order_attachments for select to authenticated
using (private.is_order_party(order_id));
create policy order_attachments_insert_party on public.order_attachments for insert to authenticated
with check (uploaded_by = (select auth.uid()) and private.is_order_party(order_id));

-- Bids and messages.
grant select, insert on public.bids to authenticated;
grant update (status, withdrawn_at) on public.bids to authenticated;
grant select, insert, update (read_at) on public.bid_messages to authenticated;

create policy bids_select_parties
on public.bids for select to authenticated
using (
  driver_id = (select auth.uid())
  or private.is_staff()
  or exists (select 1 from public.orders o where o.id = order_id and o.client_id = (select auth.uid()))
);
create policy bids_insert_approved_driver
on public.bids for insert to authenticated
with check (
  driver_id = (select auth.uid())
  and status = 'pending'
  and private.is_approved_driver()
  and exists (select 1 from public.orders o where o.id = order_id and o.status = 'pending')
  and (
    vehicle_id is null
    or exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and v.driver_id = (select auth.uid()) and v.is_active and v.is_verified
    )
  )
  and exists (
    select 1 from public.vehicles v
    where v.driver_id = (select auth.uid()) and v.is_active and v.is_verified
  )
);
create policy bids_driver_withdraw
on public.bids for update to authenticated
using (driver_id = (select auth.uid()) and status = 'pending')
with check (driver_id = (select auth.uid()) and status = 'withdrawn');

create policy bid_messages_select_parties on public.bid_messages for select to authenticated
using (private.is_bid_party(bid_id));
create policy bid_messages_insert_parties on public.bid_messages for insert to authenticated
with check (sender_id = (select auth.uid()) and private.is_bid_party(bid_id));
create policy bid_messages_mark_read on public.bid_messages for update to authenticated
using (private.is_bid_party(bid_id))
with check (private.is_bid_party(bid_id));

grant select on public.order_status_history to authenticated;
create policy order_status_history_select_parties on public.order_status_history for select to authenticated
using (
  private.is_order_party(order_id)
  or exists (select 1 from public.bids b where b.order_id = order_status_history.order_id and b.driver_id = (select auth.uid()))
);

-- Driver availability, live locations and dispatch.
grant select, insert, update on public.driver_availability_sessions, public.driver_locations to authenticated;
grant select on public.dispatch_offers to authenticated;
grant update (status, responded_at) on public.dispatch_offers to authenticated;

create policy availability_owner_or_staff_select on public.driver_availability_sessions for select to authenticated
using (driver_id = (select auth.uid()) or private.is_staff());
create policy availability_owner_insert on public.driver_availability_sessions for insert to authenticated
with check (driver_id = (select auth.uid()) and private.is_approved_driver());
create policy availability_owner_update on public.driver_availability_sessions for update to authenticated
using (driver_id = (select auth.uid())) with check (driver_id = (select auth.uid()));

create policy driver_locations_select_owner_assigned_client_or_staff
on public.driver_locations for select to authenticated
using (
  driver_id = (select auth.uid())
  or private.is_staff()
  or exists (
    select 1 from public.orders o
    where o.client_id = (select auth.uid()) and o.driver_id = driver_locations.driver_id
      and o.status in ('assigned', 'driver_en_route', 'arrived', 'loading', 'picked_up', 'in_transit', 'delivered')
  )
);
create policy driver_locations_owner_insert on public.driver_locations for insert to authenticated
with check (driver_id = (select auth.uid()) and (order_id is null or private.is_order_driver(order_id)));
create policy driver_locations_owner_update on public.driver_locations for update to authenticated
using (driver_id = (select auth.uid()))
with check (driver_id = (select auth.uid()) and (order_id is null or private.is_order_driver(order_id)));

create policy dispatch_offers_select_recipient_or_staff on public.dispatch_offers for select to authenticated
using (driver_id = (select auth.uid()) or private.is_staff());
create policy dispatch_offers_driver_respond on public.dispatch_offers for update to authenticated
using (driver_id = (select auth.uid()) and status in ('offered', 'viewed'))
with check (driver_id = (select auth.uid()) and status in ('viewed', 'accepted', 'declined'));

-- Payments: users can read only their own marketplace-facing records. Provider
-- events, ledger and reconciliation remain server/finance-only.
grant select on public.payment_intents, public.payment_transactions, public.escrow_holds, public.payouts, public.refunds, public.financial_disputes to authenticated;
grant select, insert on public.payout_accounts to authenticated;
grant update (destination_token, display_hint, is_default, active) on public.payout_accounts to authenticated;
grant insert on public.financial_disputes to authenticated;

create policy payment_intents_client_or_staff_read on public.payment_intents for select to authenticated
using (client_id = (select auth.uid()) or private.is_staff());
create policy payment_transactions_order_party_or_staff_read on public.payment_transactions for select to authenticated
using (private.is_order_party(order_id));
create policy escrow_holds_party_or_staff_read on public.escrow_holds for select to authenticated
using (client_id = (select auth.uid()) or driver_id = (select auth.uid()) or private.is_staff());
create policy payouts_party_or_staff_read on public.payouts for select to authenticated
using (driver_id = (select auth.uid()) or private.is_order_client(order_id) or private.is_staff());
create policy refunds_party_or_staff_read on public.refunds for select to authenticated
using (client_id = (select auth.uid()) or private.is_order_driver(order_id) or private.is_staff());
create policy payout_accounts_owner_or_staff_read on public.payout_accounts for select to authenticated
using (driver_id = (select auth.uid()) or private.is_staff());
create policy payout_accounts_owner_insert on public.payout_accounts for insert to authenticated
with check (driver_id = (select auth.uid()) and not verified);
create policy payout_accounts_owner_update on public.payout_accounts for update to authenticated
using (driver_id = (select auth.uid())) with check (driver_id = (select auth.uid()));
create policy financial_disputes_party_or_staff_read on public.financial_disputes for select to authenticated
using (private.is_order_party(order_id));
create policy financial_disputes_party_insert on public.financial_disputes for insert to authenticated
with check (opened_by = (select auth.uid()) and private.is_order_party(order_id) and status = 'open');

-- Reviews, support, safety, notifications and privacy.
grant select on public.reviews to authenticated;
grant select, insert on public.support_cases, public.support_case_messages, public.emergency_contacts, public.safety_incidents, public.safety_incident_evidence to authenticated;
grant update, delete on public.emergency_contacts to authenticated;
grant select, insert, update, delete on public.notification_preferences, public.device_tokens to authenticated;
grant select on public.notifications to authenticated;
grant update (read_at, status) on public.notifications to authenticated;
grant select, insert on public.consent_records, public.data_subject_requests to authenticated;
grant select on public.system_settings, public.feature_flags to authenticated;

create policy reviews_published_or_involved_read on public.reviews for select to authenticated
using (status = 'published' or reviewer_id = (select auth.uid()) or reviewee_id = (select auth.uid()) or private.is_staff());

create policy support_cases_owner_or_staff_read on public.support_cases for select to authenticated
using (opened_by = (select auth.uid()) or private.is_staff());
create policy support_cases_owner_insert on public.support_cases for insert to authenticated
with check (opened_by = (select auth.uid()) and status = 'open');
create policy support_messages_case_participant_read on public.support_case_messages for select to authenticated
using (
  private.is_staff()
  or exists (select 1 from public.support_cases sc where sc.id = case_id and sc.opened_by = (select auth.uid()) and not internal_note)
);
create policy support_messages_case_participant_insert on public.support_case_messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and (
    private.is_staff()
    or (not internal_note and exists (select 1 from public.support_cases sc where sc.id = case_id and sc.opened_by = (select auth.uid())))
  )
);

create policy emergency_contacts_owner_all on public.emergency_contacts for all to authenticated
using (user_id = (select auth.uid()) or private.is_staff())
with check (user_id = (select auth.uid()) or private.is_staff());
create policy safety_incidents_reporter_or_staff_read on public.safety_incidents for select to authenticated
using (reported_by = (select auth.uid()) or private.is_staff());
create policy safety_incidents_reporter_insert on public.safety_incidents for insert to authenticated
with check (reported_by = (select auth.uid()) and status = 'reported');
create policy safety_evidence_reporter_or_staff_read on public.safety_incident_evidence for select to authenticated
using (
  private.is_staff()
  or exists (select 1 from public.safety_incidents si where si.id = incident_id and si.reported_by = (select auth.uid()))
);
create policy safety_evidence_reporter_insert on public.safety_incident_evidence for insert to authenticated
with check (
  uploaded_by = (select auth.uid())
  and exists (select 1 from public.safety_incidents si where si.id = incident_id and si.reported_by = (select auth.uid()))
);

create policy notification_preferences_owner_all on public.notification_preferences for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy device_tokens_owner_all on public.device_tokens for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy notifications_owner_read on public.notifications for select to authenticated
using (user_id = (select auth.uid()) or private.is_staff());
create policy notifications_owner_mark_read on public.notifications for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy consent_records_owner_read on public.consent_records for select to authenticated
using (user_id = (select auth.uid()) or private.is_staff());
create policy consent_records_owner_insert on public.consent_records for insert to authenticated
with check (user_id = (select auth.uid()));
create policy data_requests_owner_read on public.data_subject_requests for select to authenticated
using (user_id = (select auth.uid()) or private.is_staff());
create policy data_requests_owner_insert on public.data_subject_requests for insert to authenticated
with check (user_id = (select auth.uid()) and status = 'received');
create policy system_settings_authenticated_read on public.system_settings for select to authenticated using (true);
create policy feature_flags_authenticated_read on public.feature_flags for select to authenticated using (true);

-- Explicit RPC surface.
revoke execute on function public.accept_bid(uuid, uuid) from public, anon;
revoke execute on function public.update_order_status(uuid, public.order_status, text) from public, anon;
revoke execute on function public.request_escrow_release(uuid) from public, anon;
revoke execute on function public.submit_review(uuid, smallint, text) from public, anon;
grant execute on function public.accept_bid(uuid, uuid) to authenticated;
grant execute on function public.update_order_status(uuid, public.order_status, text) to authenticated;
grant execute on function public.request_escrow_release(uuid) to authenticated;
grant execute on function public.submit_review(uuid, smallint, text) to authenticated;

revoke execute on function public.record_payment_success(uuid, text, bigint, timestamptz, jsonb) from public, anon, authenticated;
revoke execute on function public.record_payout_success(uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function public.claim_outbox_events(text, integer) from public, anon, authenticated;
revoke execute on function public.complete_outbox_event(uuid, boolean, text) from public, anon, authenticated;
revoke execute on function public.purge_expired_operational_data() from public, anon, authenticated;
grant execute on function public.record_payment_success(uuid, text, bigint, timestamptz, jsonb) to service_role;
grant execute on function public.record_payout_success(uuid, text, jsonb) to service_role;
grant execute on function public.claim_outbox_events(text, integer) to service_role;
grant execute on function public.complete_outbox_event(uuid, boolean, text) to service_role;
grant execute on function public.purge_expired_operational_data() to service_role;

-- Storage buckets and path-based access. Private buckets require signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('driver-documents', 'driver-documents', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf']),
  ('vehicle-documents', 'vehicle-documents', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf']),
  ('order-evidence', 'order-evidence', false, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy avatars_public_read on storage.objects for select to public
using (bucket_id = 'avatars');
create policy avatars_owner_insert on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_owner_update on storage.objects for update to authenticated
using (bucket_id = 'avatars' and owner_id = (select auth.uid()::text))
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_owner_delete on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and owner_id = (select auth.uid()::text));

create policy driver_documents_owner_or_staff_read on storage.objects for select to authenticated
using (
  bucket_id = 'driver-documents'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or private.is_staff())
);
create policy driver_documents_owner_insert on storage.objects for insert to authenticated
with check (bucket_id = 'driver-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy driver_documents_owner_delete_unverified on storage.objects for delete to authenticated
using (bucket_id = 'driver-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy vehicle_documents_owner_or_staff_read on storage.objects for select to authenticated
using (
  bucket_id = 'vehicle-documents'
  and (
    private.is_staff()
    or exists (
      select 1 from public.vehicles v
      where v.id::text = (storage.foldername(name))[1] and v.driver_id = (select auth.uid())
    )
  )
);
create policy vehicle_documents_owner_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'vehicle-documents'
  and exists (
    select 1 from public.vehicles v
    where v.id::text = (storage.foldername(name))[1] and v.driver_id = (select auth.uid())
  )
);

create policy order_evidence_participant_read on storage.objects for select to authenticated
using (
  bucket_id = 'order-evidence'
  and private.is_order_party(((storage.foldername(name))[1])::uuid)
);
create policy order_evidence_participant_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'order-evidence'
  and private.is_order_party(((storage.foldername(name))[1])::uuid)
);

comment on schema private is 'Security-definer helpers only. Never expose private tables through the Data API.';
