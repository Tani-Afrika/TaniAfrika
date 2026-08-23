import { formatCurrency, formatDate } from '@/lib/format';
import { getDriverEarnings } from '@/lib/actions/driver-orders';
import { EmptyState, PageHeading, StatCard } from '@/components/driver/DriverUI';
import { CheckIcon, WalletIcon } from '@/components/driver/DriverIcons';

export const dynamic = 'force-dynamic';

export default async function EarningsPage() {
  const { rows, total } = await getDriverEarnings();
  const avg = rows.length ? total / rows.length : 0;

  return (
    <div className="mx-auto max-w-[1300px]">
      <PageHeading
        eyebrow="Income overview"
        title="Earnings"
        description="Track income from completed TaniAfrika deliveries."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={WalletIcon}
          value={formatCurrency(total)}
          label="Total earnings"
          helper="All completed deliveries"
        />
        <StatCard
          icon={CheckIcon}
          value={rows.length}
          label="Completed"
          helper="Successfully delivered"
        />
        <StatCard
          icon={WalletIcon}
          value={formatCurrency(avg)}
          label="Average delivery"
          helper="Mean earning per order"
        />
      </div>

      <section className="mt-5 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
        <div className="border-b border-orange-100 px-5 py-3.5">
          <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-slate-500">
            Payment history
          </h2>
        </div>

        {rows.length ? (
          <div className="divide-y divide-orange-100">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-1 items-center gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {row.pickup_address} → {row.dropoff_address}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Delivered {formatDate(row.delivered_at ?? row.created_at)}
                  </p>
                </div>

                <p className="text-base font-bold text-emerald-600 sm:text-right sm:text-lg">
                  {formatCurrency(row.price_agreed)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={WalletIcon}
              title="No earnings yet"
              description="Completed deliveries will appear here with the agreed delivery amount."
            />
          </div>
        )}
      </section>
    </div>
  );
}