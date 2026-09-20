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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3.5">
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
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            icon={WalletIcon}
            value={formatCurrency(avg)}
            label="Average delivery"
            helper="Mean earning per order"
          />
        </div>
      </div>

      <section className="native-card mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs sm:mt-5">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-3.5">
          <h2 className="text-xs font-bold uppercase tracking-[0.06em] text-slate-500 sm:text-sm">
            Payment history
          </h2>
        </div>

        {rows.length ? (
          <div className="divide-y divide-slate-100">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-1 items-center gap-1.5 px-4 py-3 sm:grid-cols-[1fr_auto] sm:gap-4 sm:px-5 sm:py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-900 sm:text-sm">
                    {row.pickup_address} → {row.dropoff_address}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Delivered {formatDate(row.delivered_at ?? row.created_at)}
                  </p>
                </div>

                <p className="text-sm font-bold text-trust sm:text-right sm:text-base">
                  +{formatCurrency(row.price_agreed)}
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