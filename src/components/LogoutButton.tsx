'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logoutDevUser } from '@/lib/actions/dev-auth';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutDevUser();
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Safe to ignore in dev session mode
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-left text-sm font-medium text-ink-600 transition hover:bg-ink-200/40 disabled:opacity-60"
    >
      {loading ? 'Signing out...' : 'Log out'}
    </button>
  );
}