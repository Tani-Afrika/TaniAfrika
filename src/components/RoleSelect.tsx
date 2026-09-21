'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { updateUserRole } from '@/lib/actions/users';
import type { UserRole } from '@/types/supabase';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'client', label: 'Client' },
  { value: 'driver', label: 'Driver' },
  { value: 'admin', label: 'Admin' },
];

export default function RoleSelect({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: UserRole;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState<UserRole>(currentRole);
  const [errorMessage, setErrorMessage] = useState('');

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = event.target.value as UserRole;
    const previousRole = role;

    setRole(newRole);
    setErrorMessage('');

    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);

      if (!result.success) {
        setRole(previousRole);
        setErrorMessage(result.error ?? 'Failed to update role.');
        return;
      }

      // The row will likely disappear from the current filtered list
      // (e.g. a client promoted to driver no longer belongs on /clients),
      // so refresh the page data.
      router.refresh();
    });
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <select
        value={role}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-900 outline-none transition focus:border-trust focus:ring-2 focus:ring-trust/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {ROLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {errorMessage && (
        <p className="text-xs text-red-700">{errorMessage}</p>
      )}
    </div>
  );
}