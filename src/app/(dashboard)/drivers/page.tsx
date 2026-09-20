import { getDrivers } from '@/lib/queries';
import DriversClientView from '@/components/admin/DriversClientView';
import type { ApprovalStatus } from '@/types/supabase';

export const dynamic = 'force-dynamic';

interface DriversPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function DriversPage({ searchParams }: DriversPageProps) {
  const { status } = await searchParams;
  const activeFilter = (status ?? 'all') as 'all' | ApprovalStatus;

  const allDrivers = await getDrivers();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1F5F3F]">
          Fleet & Driver Operations
        </p>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Driver Approvals & Fleet Compliance
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review KYC identification, verify driver vehicles, inspect compliance documents, and manage approval status.
        </p>
      </header>

      <DriversClientView
        allDrivers={allDrivers as any}
        activeFilter={activeFilter}
      />
    </div>
  );
}