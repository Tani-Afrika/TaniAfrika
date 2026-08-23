'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/orders', label: 'Orders' },
  { href: '/drivers', label: 'Drivers' },
  { href: '/clients', label: 'Clients' },
  { href: '/bids', label: 'Bids' },
];

export default function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {links.map((link) => {
        const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`relative rounded-lg px-4 py-2.5 text-sm transition-colors ${
              isActive
                ? 'bg-maroon-50 font-semibold text-maroon-600'
                : 'font-medium text-ink-600 hover:bg-ink-200/40'
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-maroon-600" />
            )}
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
