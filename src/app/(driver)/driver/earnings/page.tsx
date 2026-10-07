import { formatCurrency, formatDate } from '@/lib/format';
import { getDriverEarnings } from '@/lib/actions/driver-orders';
import { EmptyState, PageHeading, StatCard } from '@/components/driver/DriverUI';
import { CheckIcon, WalletIcon } from '@/components/driver/DriverIcons';

export const dynamic = 'force-dynamic';

export default async function EarningsPage() {
  const { rows, total, feesTotal, paidTotal } = await getDriverEarnings();

  return (
    <div className="mx-auto max-w-[1300px]">
      <PageHeading
        eyebrow="Income overview"
        title="Earnings"
        description="Track agreed price, platform fee, and payout status for each delivery."
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3.5">
        <StatCard
          icon={WalletIcon}
          value={formatCurrency(total)}
          label="Driver earnings"
          helper="Your share after fees"
        />
        <StatCard
          icon={CheckIcon}
          value={rows.length}
          label="Deliveries"
          helper="Delivered or completed"
        />
        <StatCard
          icon={WalletIcon}
          value={formatCurrency(feesTotal)}
          label="Platform fees"
          helper="Commission withheld"
        />
        <StatCard
          icon={WalletIcon}
          value={formatCurrency(paidTotal)}
          label="Paid to M-Pesa"
          helper="Confirmed payouts only"
        />
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
                className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4 sm:px-5 sm:py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-900 sm:text-sm">
                    {row.pickup_address} → {row.dropoff_address}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Delivered {formatDate(row.delivered_at ?? row.created_at)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <span>Agreed {formatCurrency(row.price_agreed)}</span>
                    <span>Fee {formatCurrency(row.platform_fee)}</span>
                    <span>Your share {formatCurrency(row.driver_earnings)}</span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <p className="text-sm font-bold text-trust sm:text-base">
                    +{formatCurrency(row.driver_earnings)}
                  </p>
                  <p
                    className={`mt-1 text-[11px] font-semibold ${
                      row.paid_to_mpesa ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {row.paid_to_mpesa
                      ? `Paid to M-Pesa · ${formatDate(row.payout_succeeded_at)}`
                      : 'Awaiting payout'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={WalletIcon}
              title="No earnings yet"
              description="Completed deliveries will appear here with agreed price, fees, and payout status."
            />
          </div>
        )}
      </section>
    </div>
  );
}
