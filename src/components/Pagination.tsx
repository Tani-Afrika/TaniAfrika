import Link from 'next/link';

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Current query params to preserve (status, search, dateFrom, dateTo, etc.) */
  baseParams: Record<string, string | undefined>;
  basePath: string;
}

function buildHref(basePath: string, params: Record<string, string | undefined>, page: number) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });

  if (page > 1) {
    searchParams.set('page', String(page));
  } else {
    searchParams.delete('page');
  }

  const query = searchParams.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export default function Pagination({ page, totalPages, baseParams, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  // Show a compact window of page numbers around the current page.
  const windowSize = 2;
  const pages: number[] = [];
  for (
    let p = Math.max(1, page - windowSize);
    p <= Math.min(totalPages, page + windowSize);
    p++
  ) {
    pages.push(p);
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 px-5 py-4">
      <p className="text-xs text-ink-400">
        Page {page} of {totalPages}
      </p>

      <div className="flex items-center gap-1.5">
        <Link
          href={buildHref(basePath, baseParams, Math.max(1, page - 1))}
          aria-disabled={page === 1}
          tabIndex={page === 1 ? -1 : undefined}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            page === 1
              ? 'pointer-events-none border-ink-200/60 text-ink-400/60'
              : 'border-ink-200 text-ink-600 hover:bg-ink-200/40'
          }`}
        >
          Previous
        </Link>

        {pages[0] > 1 && (
          <>
            <Link
              href={buildHref(basePath, baseParams, 1)}
              className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:bg-ink-200/40"
            >
              1
            </Link>
            {pages[0] > 2 && <span className="px-1 text-xs text-ink-400">…</span>}
          </>
        )}

        {pages.map((p) => (
          <Link
            key={p}
            href={buildHref(basePath, baseParams, p)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              p === page
                ? 'border-trust bg-trust text-white shadow-xs'
                : 'border-ink-200 text-ink-600 hover:bg-ink-200/40'
            }`}
          >
            {p}
          </Link>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="px-1 text-xs text-ink-400">…</span>
            )}
            <Link
              href={buildHref(basePath, baseParams, totalPages)}
              className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:bg-ink-200/40"
            >
              {totalPages}
            </Link>
          </>
        )}

        <Link
          href={buildHref(basePath, baseParams, Math.min(totalPages, page + 1))}
          aria-disabled={page === totalPages}
          tabIndex={page === totalPages ? -1 : undefined}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            page === totalPages
              ? 'pointer-events-none border-ink-200/60 text-ink-400/60'
              : 'border-ink-200 text-ink-600 hover:bg-ink-200/40'
          }`}
        >
          Next
        </Link>
      </div>
    </nav>
  );
}