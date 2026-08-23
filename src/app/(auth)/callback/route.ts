import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

function getSafeRedirectPath(value: string | null) {
  if (!value?.startsWith('/') || value.startsWith('//')) {
    return '/reset-password';
  }

  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const code = searchParams.get('code');
  const next = getSafeRedirectPath(searchParams.get('next'));

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = next;
  redirectUrl.search = '';

  if (!code) {
    redirectUrl.pathname = '/reset-password';
    redirectUrl.searchParams.set(
      'error',
      'invalid_recovery_link',
    );

    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createClient();

  const { error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirectUrl.pathname = '/reset-password';
    redirectUrl.searchParams.set(
      'error',
      'invalid_recovery_link',
    );

    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.redirect(redirectUrl);
}