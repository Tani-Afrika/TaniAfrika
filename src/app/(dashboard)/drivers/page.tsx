import Link from 'next/link';

import {
  formatDate,
  VEHICLE_TYPE_LABELS,
} from '@/lib/format';
import { getDrivers } from '@/lib/queries';
import RoleSelect from '@/components/RoleSelect';
import ApprovalActions from '@/components/ApprovalActions';
import type { ApprovalStatus } from '@/types/supabase';

export const dynamic = 'force-dynamic';

interface DriversPageProps {
  searchParams: Promise<{ status?: string }>;
}

const FILTER_TABS: { value: 'all' | ApprovalStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default async function DriversPage({ searchParams }: DriversPageProps) {
  const { status } = await searchParams;
  const activeFilter = (status ?? 'all') as 'all' | ApprovalStatus;

  const allDrivers = await getDrivers();

  const drivers =
    activeFilter === 'all'
      ? allDrivers
      : allDrivers.filter((d) => d.approval_status === activeFilter);

  const onlineDrivers = allDrivers.filter((driver) => driver.is_online).length;
  const activeDrivers = allDrivers.filter((driver) => driver.is_active).length;
  const pendingCount = allDrivers.filter((d) => d.approval_status === 'pending').length;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Drivers
        </h1>

        <p className="text-sm text-ink-600">
          Driver accounts, availability, approvals and registered vehicles.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:max-w-2xl sm:grid-cols-3">
        <div className="surface p-4">
          <p className="text-xs font-medium text-ink-400">
            Active drivers
          </p>

          <p className="mt-1 font-display text-2xl font-semibold text-ink-900">
            {activeDrivers}
          </p>
        </div>

        <div className="surface p-4">
          <p className="text-xs font-medium text-ink-400">
            Online now
          </p>

          <p className="mt-1 font-display text-2xl font-semibold text-green-700">
            {onlineDrivers}
          </p>
        </div>

        <div className="surface p-4">
          <p className="text-xs font-medium text-ink-400">
            Pending approval
          </p>

          <p className="mt-1 font-display text-2xl font-semibold text-amber-700">
            {pendingCount}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === 'all' ? '/drivers' : `/drivers?status=${tab.value}`}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-200 ${
              activeFilter === tab.value
                ? 'bg-maroon-600 text-white'
                : 'border border-ink-200 bg-white text-ink-600 hover:border-maroon-100 hover:bg-maroon-50 hover:text-maroon-700'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <section className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {drivers.map((driver) => {
          const initial = driver.full_name.trim().charAt(0).toUpperCase();
          const primaryVehicle = driver.vehicles[0];
          const extraVehicleCount = driver.vehicles.length - 1;

          return (
            <article
              key={driver.id}
              className="surface surface-interactive flex flex-col gap-3.5 p-4"
            >
              {/* Identity + approval actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-maroon-100 text-sm font-semibold text-maroon-600">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-sm font-semibold text-ink-900">
                      {driver.full_name}
                    </h2>
                    <p className="truncate text-xs text-ink-600">
                      {driver.phone ?? 'No phone provided'}
                    </p>
                  </div>
                </div>

                <ApprovalActions
                  driverId={driver.id}
                  currentStatus={driver.approval_status}
                />
              </div>

              {/* Compact meta row: online status, account status, joined date */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg bg-ink-900/[0.02] px-3 py-2 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-ink-700">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      driver.is_online ? 'bg-green-600' : 'bg-ink-400'
                    }`}
                  />
                  {driver.is_online ? 'Online' : 'Offline'}
                </span>

                <span className="text-ink-200">•</span>

                <span
                  className={`font-medium ${
                    driver.is_active ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {driver.is_active ? 'Active account' : 'Inactive account'}
                </span>

                <span className="text-ink-200">•</span>

                <span className="text-ink-500">
                  Joined {formatDate(driver.created_at)}
                </span>
              </div>

              {/* Role + primary vehicle, side by side */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-ink-400">
                    Role
                  </span>
                  <RoleSelect
                    userId={driver.id}
                    currentRole={driver.role}
                  />
                </div>
              </div>

              <div className="border-t border-ink-200 pt-3.5">
                {primaryVehicle ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-900/[0.03] text-ink-600">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M3 13l1.5-5A2 2 0 0 1 6.4 6.5h11.2a2 2 0 0 1 1.9 1.5L21 13m-18 0v5a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-5m-18 0h18" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-ink-900">
                          {VEHICLE_TYPE_LABELS[primaryVehicle.vehicle_type]}
                          {' · '}
                          {primaryVehicle.plate_number}
                        </p>
                        <p className="truncate text-xs text-ink-500">
                          {primaryVehicle.is_verified ? 'Verified' : 'Unverified'}
                          {extraVehicleCount > 0 &&
                            ` · +${extraVehicleCount} more vehicle${extraVehicleCount === 1 ? '' : 's'}`}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 h-1.5 w-1.5 rounded-full ${
                        primaryVehicle.is_verified ? 'bg-green-600' : 'bg-amber-500'
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-ink-400">No registered vehicle</p>
                )}
              </div>
            </article>
          );
        })}

        {drivers.length === 0 && (
          <div className="col-span-full surface flex flex-col items-center px-4 py-14 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-maroon-50 text-maroon-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 17h14M7 17V9a5 5 0 0 1 10 0v8m-11 0a2 2 0 1 0 4 0m3 0a2 2 0 1 0 4 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <p className="font-medium text-ink-600">
              No drivers found
            </p>

            <p className="mt-1 text-sm text-ink-400">
              {activeFilter === 'all'
                ? 'Driver accounts will appear here once registered.'
                : `No drivers with "${activeFilter}" status.`}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}