# TaniAfrika — Changelog & Milestone Architecture Record

> **Document Status:** Active Team Ledger  
> **Current Milestone:** Staging Runtime Enablement & Driver Vertical Delivery  
> **Baseline Date:** 14 September 2026  
> **Lead Engineers:** Wilfred Osozi (Driver & Platform), Nicholas Obonyo (Client)

---

## 1. Executive Snapshot & Current Baseline

TaniAfrika is transitioning from backend foundation validation into runtime enablement and UI implementation. The PostgreSQL system of record has been validated in hosted staging (`TaniAfrika-Staging`), establishing:
* **53 Public Database Tables:** Covering identity, compliance, fleet, marketplace, dispatch, escrow, immutable ledger, and safety operations.
* **14 Public & Private RPCs:** Enforcing atomic state transitions, money calculation, and verification preconditions.
* **4 Private Storage Buckets:** `avatars`, `driver-documents`, `vehicle-documents`, and `order-evidence` with strict row-level security.
* **9 Supabase Edge Functions:** Adapters for payments, dispatch, payouts, and reconciliation.
* **Figma Synchronization:** Complete extraction of 353 screen frames, typography, and color tokens from file `zQPq6p4mfaPpbXAB1D3sZ2`.

---

## 2. Sprint Roadmap & Deliverables Tracking (25 Aug – 4 Sep)

### Wilfred Osozi — Driver Vertical + Platform & Staging

| ID | Deliverable | Target Files | Key Acceptance Criteria | Status |
|---|---|---|---|---|
| **W1** | **Edge Functions & Test Users** | `supabase/functions/**` | Deploy 9 functions to staging; schedule 4 cron jobs; seed 1 client, 1 pending driver, 1 approved driver, 1 admin. | 🟡 Ready for Staging Deploy |
| **W2** | **Driver Profile & Uploads** | `src/app/(driver)/driver/profile/**` | Upload `national_id`, `driving_licence`, `profile_photo` to `driver-documents`; register vehicle + logbook/insurance; pending drivers view `/driver` but cannot bid. | ✅ Completed |
| **W3** | **Admin Driver Verification** | `src/app/(dashboard)/drivers/**` | Admin sets `vehicles.is_verified = true`, reviews `driver_documents.verification_status`, and provides `rejection_reason` on reject. | ✅ Completed |
| **W4** | **Job Feed & Bidding** | `src/app/(driver)/driver/orders/**` | Filter pending orders matching driver's active vehicle; `BidForm` attaches `vehicle_id`, integer KES, and `estimated_pickup_at`. | ⚪ Queued |
| **W5** | **Admin Test Payment Action** | `src/app/(dashboard)/orders/[id]/**` | Admin-only "Confirm test payment" invoking `record_payment_success` via service-role to advance order from `payment_pending` $\rightarrow$ `assigned`. | 🟢 Next Up (Handshake Blocker) |
| **W6** | **Active Job & Status Chain** | `src/app/(driver)/driver/active/**` | Strict driver status sequence: `assigned` $\rightarrow$ `driver_en_route` $\rightarrow$ `arrived` $\rightarrow$ `loading` $\rightarrow$ `picked_up` $\rightarrow$ `in_transit` $\rightarrow$ `delivered`. Photo proof to `order-evidence`. | ⚪ Queued |
| **W7** | **Driver Earnings Breakdown** | `src/app/(driver)/driver/earnings/**` | Display `price_agreed`, `platform_fee_minor`, `driver_earnings_minor` (divided by 100 KES). Show "Paid to M-Pesa" only when payout record exists. | ⚪ Queued |
| **W8** | **Reliable Neighbour Styling** | `src/app/(driver)/**`, `src/app/(dashboard)/**` | Remove legacy orange (`#ef4d16`) and maroon. Apply Trust Green (`#1F5F3F`), Cream (`#F7F1E5`), and Amber (`#D4A244`). | 🟢 In Progress |

### Nicholas Obonyo — Client Vertical (Reference Only — Do Not Edit)

| ID | Deliverable | Scope | Status |
|---|---|---|---|
| **N1** | **Client Order Creation** | Landmark, access notes, vehicle selector, fragile items, photos to `order-evidence`. | External Ownership |
| **N2** | **Bid Comparison & Accept** | Bid cards showing driver photo, name, amount, ETA; accept calls `accept_bid`. | External Ownership |
| **N3** | **Payment-Pending State** | Display held-funds notice; initiate staging payment; no fake client completion. | External Ownership |
| **N4** | **Live Trip Tracking** | Map, status timeline, click-to-call driver, hide bid list once assigned. | External Ownership |
| **N5** | **Dispute, Rate & Receipt** | Dispute order, submit review, in-app receipt showing breakdown. | External Ownership |
| **N6** | **Client Reliable Neighbour** | Brand tokens on all `/client` routes; handle loading/empty/error states. | External Ownership |

---

## 3. Architectural Decision Records (ADRs)

### ADR 001: Modular Monolith Architecture
* **Context:** Need for strong data consistency, auditable financial transactions, and rapid product velocity.
* **Decision:** Retain a single Supabase PostgreSQL database as the system of record rather than premature microservices.
* **Consequence:** Business domains are partitioned via tables, RLS, transactional RPCs, and an outbox queue. Clean seams are preserved for future extraction when transaction volume warrants it.

### ADR 002: Staging Test Payment via Service Role (W5)
* **Context:** Safaricom M-Pesa STK push (`mpesa_payments`) is deliberately disabled in staging until regulatory certification. Orders naturally pause at `payment_pending`.
* **Decision:** Build an Admin-only "Confirm test payment" action in [`src/app/(dashboard)/orders/[id]`](file:///c:/Users/sozi/Desktop/taniafrika/src/app/(dashboard)/orders/[id]) that creates/validates a `payment_intents` entry and calls `public.record_payment_success` using the Supabase `service_role` client.
* **Consequence:** Preserves the complete financial ledger and escrow hold pipeline without requiring mock third-party PSP webhooks or faking state in the client.

### ADR 003: Strict File Ownership Division
* **Context:** Two engineers working concurrently on fullstack features. High risk of merge conflicts and broken state machine contracts.
* **Decision:** Strict ownership by vertical: Wilfred owns Driver + Admin + Platform; Nicholas owns Client. Shared files (`globals.css`, `format.ts`, `middleware.ts`) require mutual PR review.
* **Consequence:** Parallel velocity without merge friction.

### ADR 004: Minor-Unit Financial Integrity
* **Context:** Floating point rounding errors in financial transactions and currency conversions.
* **Decision:** Store all amounts in integer minor units (cents) as `bigint`. Major unit display conversions happen only at the presentation layer (`minor / 100`).
* **Consequence:** Zero precision loss across pricing, bidding, fee deductions, and ledger balances.

---

## 4. Chronological Change Log

### [2026-09-14] — Design System & Engineering Alignment
* **Added `AGENT.md`:** Standardized operational directive and constraints for all AI models working on the repository.
* **Added `CHANGES.md`:** Comprehensive project ledger, ADR documentation, and milestone tracking.
* **Created `scripts/scrape-figma.mjs`:** Automated Figma REST API extractor targeting file `zQPq6p4mfaPpbXAB1D3sZ2`.
* **Extracted Figma Specifications:**
  * Analyzed 353 screens across Mover and Driver flows.
  * Mapped 122 design colors to the Reliable Neighbour palette.
  * Generated [`docs/designs/FIGMA_SPECS.md`](file:///c:/Users/sozi/Desktop/taniafrika/docs/designs/FIGMA_SPECS.md), `palette.json`, and `screens-catalog.json`.
* **Added `npm run scrape:figma`:** Integrated npm script for ongoing design synchronization.
* **Database vs. Figma Audit:** Verified that current 53 PostgreSQL tables fully support all active sprint requirements without requiring schema migrations.
* **Completed W3 (Admin Driver & Fleet Verification Flow):**
  * Created `src/lib/actions/admin-verification.ts`: Implemented `verifyVehicleAction`, `verifyDocumentAction`, `updateDriverApprovalWithReason`, and `getDocumentSignedUrl`.
  * Created `src/components/admin/DriverVerificationModal.tsx`: Complete admin compliance drawer for reviewing KYC documents (National ID, Driving Licence) and vehicle documents (Logbook, Insurance) with instant verify/reject actions and mandatory rejection reason.
  * Created `src/components/admin/DriversClientView.tsx`: Real-time driver fleet table with KPI statistics, status filter tabs, and direct one-click vehicle verification.
  * Restructured `src/app/(dashboard)/drivers/page.tsx` using Reliable Neighbour Trust Green tokens.
* **Fast Dev Access (Pure React Server Component & Wilfred Scope):**
  * Created `src/lib/auth/dev-session.ts`: Dedicated server session helper for Driver and Admin roles only.
  * Reverted `src/app/(client)/**` to preserve Nicholas Obonyo's Client vertical boundary.
  * Converted `src/app/(auth)/login/page.tsx` into a **100% pure React Server Component** (no `'use client'`) using native Next.js form Server Actions.
  * Instant 1-click access exclusively for Wilfred's deliverables: Admin Dashboard (`/`), Driver Approved (`/driver`), and Driver Pending (`/driver/profile`).
