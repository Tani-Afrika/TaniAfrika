import { formatDate } from '@/lib/format';
import { getClients } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const clients = await getClients();

  const activeClients = clients.filter(
    (client) => client.is_active
  ).length;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Clients
        </h1>

        <p className="text-sm text-ink-600">
          Customer accounts using the TaniAfrika delivery
          marketplace.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2.5 sm:max-w-lg">
        <div className="native-card surface p-3.5 sm:p-4 rounded-2xl">
          <p className="text-[11px] font-medium text-ink-400 sm:text-xs">
            Total clients
          </p>

          <p className="mt-1 font-display text-xl font-bold text-ink-900 sm:text-2xl">
            {clients.length}
          </p>
        </div>

        <div className="native-card surface p-3.5 sm:p-4 rounded-2xl">
          <p className="text-[11px] font-medium text-ink-400 sm:text-xs">
            Active clients
          </p>

          <p className="mt-1 font-display text-xl font-bold text-trust sm:text-2xl">
            {activeClients}
          </p>
        </div>
      </div>

      <section className="overflow-hidden surface rounded-2xl">
        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-ink-900/[0.02] text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-5 py-3 font-semibold">
                  Client
                </th>
                <th className="px-5 py-3 font-semibold">
                  Phone number
                </th>
                <th className="px-5 py-3 font-semibold">
                  Status
                </th>
                <th className="px-5 py-3 font-semibold">
                  Date joined
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-ink-400/15">
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="transition hover:bg-trust-light/30"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-ink-900">
                      {client.full_name}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm text-ink-600">
                    {client.phone ?? 'Not provided'}
                  </td>

                  <td className="px-5 py-4">
                    <ClientStatus
                      active={client.is_active}
                    />
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-ink-600">
                    {formatDate(client.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile 2-column card grid */}
        <div className="grid grid-cols-1 gap-2.5 p-3 sm:grid-cols-2 md:hidden">
          {clients.map((client) => (
            <article
              key={client.id}
              className="native-card flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0">
                    <h2 className="truncate text-xs font-semibold text-ink-900 sm:text-sm">
                      {client.full_name}
                    </h2>

                    <p className="mt-0.5 truncate text-[11px] text-ink-600">
                      {client.phone ?? 'No phone number'}
                    </p>
                  </div>

                  <ClientStatus
                    active={client.is_active}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-ink-400/10 pt-2 text-[10px] text-ink-400">
                <span>Joined</span>
                <span>{formatDate(client.created_at)}</span>
              </div>
            </article>
          ))}
        </div>

        {clients.length === 0 && (
          <div className="flex flex-col items-center px-4 py-12 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-trust-light/60 text-trust sm:h-11 sm:w-11">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87m5-4.13a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6-1a4 4 0 1 0-3-6.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <p className="font-semibold text-ink-700">
              No clients found
            </p>

            <p className="mt-1 text-sm text-ink-400">
              Client accounts will appear here once they
              register.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function ClientStatus({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}