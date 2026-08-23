'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
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