import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import { ChevronRightIcon } from './DriverIcons';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1F5F3F] sm:text-xs">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-0.5 font-display text-xl font-bold tracking-tight text-[#1C1D20] sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-xs text-[#5F5E5E] sm:text-sm">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  value,
  label,
  helper,
}: {
  icon: Icon;
  value: string | number;
  label: string;
  helper: string;
}) {
  return (
    <article className="native-card native-press p-3 transition hover:border-[#74C67A]/50 sm:p-4">
      <div className="flex items-center justify-between">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#EBF8ED] border border-[#74C67A]/30 text-[#1F5F3F] sm:h-9 sm:w-9">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
        <span className="text-[10px] font-medium text-slate-400 sm:text-xs truncate max-w-[90px] sm:max-w-none text-right">
          {helper}
        </span>
      </div>
      <div className="mt-2.5">
        <p className="font-display text-lg font-bold tracking-tight text-[#14422B] sm:text-2xl">
          {value}
        </p>
        <p className="text-[11px] font-semibold text-slate-600 sm:text-xs truncate">
          {label}
        </p>
      </div>
    </article>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  href,
  actionLabel,
}: {
  icon: Icon;
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="native-card border-dashed p-6 text-center sm:p-10">
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#EBF8ED] border border-[#74C67A]/30 text-[#1F5F3F] sm:h-12 sm:w-12">
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </span>
      <h3 className="mt-3 text-sm font-bold text-[#14422B] sm:text-base">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-xs text-[#5F5E5E] sm:text-sm">{description}</p>
      {href && actionLabel ? (
        <Link
          href={href}
          className="native-press mt-4 inline-flex h-9 items-center rounded-lg bg-[#1F5F3F] px-3.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#14422B] border border-[#14422B]"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function ActionCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: Icon;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="native-card native-press group flex items-center gap-3 p-3 transition hover:border-[#1F5F3F]/35 hover:shadow-xs sm:p-4"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#EBF8ED] border border-[#74C67A]/30 text-[#1F5F3F] sm:h-10 sm:w-10">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold text-[#14422B] sm:text-sm">{title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-[#5F5E5E] sm:text-xs">{description}</span>
      </span>
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition group-hover:bg-[#1F5F3F] group-hover:text-white sm:h-7 sm:w-7">
        <ChevronRightIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      </span>
    </Link>
  );
}
