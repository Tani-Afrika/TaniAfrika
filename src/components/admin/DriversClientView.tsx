'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { VEHICLE_TYPE_LABELS, formatDate } from '@/lib/format';
import { verifyVehicleAction } from '@/lib/actions/admin-verification';
import ApprovalActions from '@/components/ApprovalActions';
import RoleSelect from '@/components/RoleSelect';
import DriverVerificationModal, { type DriverVerificationData } from './DriverVerificationModal';
import type { ApprovalStatus, VehicleType } from '@/types/supabase';

const FILTER_TABS: { value: 'all' | ApprovalStatus; label: string }[] = [
  { value: 'all', label: 'All Drivers' },
  { value: 'pending', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

interface DriversClientViewProps {
  allDrivers: DriverVerificationData[];
  activeFilter: 'all' | ApprovalStatus;
}

export default function DriversClientView({
  allDrivers,
  activeFilter,
}: DriversClientViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedDriverForModal, setSelectedDriverForModal] = useState<DriverVerificationData | null>(null);

  const drivers =
    activeFilter === 'all'
      ? allDrivers
      : allDrivers.filter((d) => d.approval_status === activeFilter);

  const onlineDrivers = allDrivers.filter((d) => d.is_online).length;
  const activeDrivers = allDrivers.filter((d) => d.is_active).length;
  const pendingCount = allDrivers.filter((d) => d.approval_status === 'pending').length;

  async function handleQuickVerifyVehicle(vehicleId: string) {
    startTransition(async () => {
      const res = await verifyVehicleAction(vehicleId, true);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error ?? 'Failed to verify vehicle.');
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick KPIs */}
      <div className="grid grid-cols-2 gap-2.5 sm:max-w-2xl sm:grid-cols-3">
        <div className="native-card surface p-3.5 sm:p-4 border border-slate-200/80 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-500 sm:text-xs">Active drivers</p>
          <p className="mt-1 font-display text-xl font-bold text-slate-900 sm:text-2xl">{activeDrivers}</p>
        </div>

        <div className="native-card surface p-3.5 sm:p-4 border border-slate-200/80 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-500 sm:text-xs">Online now</p>
          <p className="mt-1 font-display text-xl font-bold text-trust sm:text-2xl">{onlineDrivers}</p>
        </div>

        <div className="native-card surface p-3.5 sm:p-4 border border-slate-200/80 rounded-2xl col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold text-slate-500 sm:text-xs">Pending approval</p>
          <p className="mt-1 font-display text-xl font-bold text-amber-700 sm:text-2xl">{pendingCount}</p>
        </div>
      </div>

      {/* 2. Filter Tabs (Reliable Neighbour Trust Green) */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === 'all' ? '/admin/drivers' : `/admin/drivers?status=${tab.value}`}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition native-press ${
              activeFilter === tab.value
                ? 'bg-trust text-white shadow-xs'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-trust/30 hover:bg-trust-light/40'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* 3. Driver Cards Grid */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {drivers.map((driver) => {
          const initial = driver.full_name.trim().charAt(0).toUpperCase();
          const primaryVehicle = driver.vehicles[0];
          const extraVehicleCount = driver.vehicles.length - 1;
          const pendingDocs = driver.driverDocuments.filter((d) => d.verification_status === 'pending').length;

          return (
            <article
              key={driver.id}
              className="native-card surface flex flex-col justify-between gap-3.5 p-4 sm:p-5 border border-slate-200/90 rounded-2xl transition hover:shadow-md"
            >
              <div className="space-y-3.5">
                {/* Driver identity + approval status badge/actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1F5F3F]/10 text-base font-bold text-[#1F5F3F]">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-sm font-bold text-slate-950">
                        {driver.full_name}
                      </h2>
                      <p className="truncate text-xs text-slate-500">
                        {driver.phone ?? 'No phone recorded'}
                      </p>
                    </div>
                  </div>

                  <ApprovalActions
                    driverId={driver.id}
                    currentStatus={driver.approval_status}
                  />
                </div>

                {/* Metadata badges row */}
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-xl bg-slate-50 px-3 py-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        (driver as any).is_online ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                    {(driver as any).is_online ? 'Online' : 'Offline'}
                  </span>

                  <span className="text-slate-300">•</span>

                  <span className="text-slate-500 font-medium">
                    Joined {formatDate(driver.created_at)}
                  </span>
                </div>

                {/* Role selector */}
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    System Role
                  </span>
                  <RoleSelect userId={driver.id} currentRole={(driver as any).role} />
                </div>

                {/* Primary Vehicle Section with Quick Verify */}
                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Assigned Vehicle
                    </span>
                    {pendingDocs > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        {pendingDocs} doc{pendingDocs > 1 ? 's' : ''} to review
                      </span>
                    )}
                  </div>

                  {primaryVehicle ? (
                    <div className="rounded-xl border border-slate-200 bg-[#FDFBF7] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-display font-bold text-xs text-slate-900 uppercase truncate">
                            {primaryVehicle.plate_number} • {VEHICLE_TYPE_LABELS[primaryVehicle.vehicle_type as VehicleType]}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                            {[primaryVehicle.make, primaryVehicle.model, primaryVehicle.year].filter(Boolean).join(' ') || 'Standard specs'}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            primaryVehicle.is_verified
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {primaryVehicle.is_verified ? 'VERIFIED' : 'UNVERIFIED'}
                        </span>
                      </div>

                      {/* Quick Verify Button if vehicle is unverified */}
                      {!primaryVehicle.is_verified && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex justify-end">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleQuickVerifyVehicle(primaryVehicle.id)}
                            className="rounded-lg bg-[#1F5F3F] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#184c32] shadow-sm disabled:opacity-50 transition"
                          >
                            Verify Vehicle ✓
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No registered vehicle</p>
                  )}
                </div>
              </div>

              {/* Card Footer: Detailed Review Modal Button */}
              <div className="border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedDriverForModal(driver)}
                  className="w-full inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 hover:border-[#1F5F3F]/40 transition"
                >
                  Review Compliance & Documents ↗
                </button>
              </div>
            </article>
          );
        })}

        {drivers.length === 0 && (
          <div className="col-span-full surface flex flex-col items-center px-4 py-14 text-center rounded-2xl border border-slate-200">
            <p className="font-display font-semibold text-slate-900">No drivers found</p>
            <p className="mt-1 text-sm text-slate-500">
              {activeFilter === 'all'
                ? 'Driver accounts will appear here once registered.'
                : `No drivers currently matching status "${activeFilter}".`}
            </p>
          </div>
        )}
      </section>

      {/* Verification Modal for Document Review & Fleet Verification */}
      {selectedDriverForModal && (
        <DriverVerificationModal
          driver={selectedDriverForModal}
          isOpen={!!selectedDriverForModal}
          onClose={() => setSelectedDriverForModal(null)}
        />
      )}
    </div>
  );
}
