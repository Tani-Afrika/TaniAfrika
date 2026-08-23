import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import { ChevronRightIcon } from './DriverIcons';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">{eyebrow}</p> : null}
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ icon: Icon, value, label, helper }: { icon: Icon; value: string | number; label: string; helper: string }) {
  return (
    <article className="rounded-2xl border border-orange-100 bg-white p-5 shadow-[0_12px_34px_rgba(249,115,22,0.06)]">
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-600"><Icon className="h-6 w-6" /></span>
        <div>
          <p className="text-2xl font-bold tracking-tight text-slate-950">{value}</p>
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          <p className="mt-0.5 text-xs text-slate-500">{helper}</p>
        </div>
      </div>
    </article>
  );
}

export function EmptyState({ icon: Icon, title, description, href, actionLabel }: { icon: Icon; title: string; description: string; href?: string; actionLabel?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-orange-200 bg-white px-6 py-12 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-orange-50 text-orange-600"><Icon className="h-7 w-7" /></span>
      <h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {href && actionLabel ? <Link href={href} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700">{actionLabel}</Link> : null}
    </div>
  );
}

export function ActionCard({ icon: Icon, title, description, href }: { icon: Icon; title: string; description: string; href: string }) {
  return (
    <Link href={href} className="group flex min-h-[108px] items-center gap-4 rounded-2xl border border-orange-100 bg-white p-5 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/70">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-600"><Icon className="h-6 w-6" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-950">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-orange-50 text-orange-600 transition group-hover:bg-orange-600 group-hover:text-white"><ChevronRightIcon className="h-4 w-4" /></span>
    </Link>
  );
}
