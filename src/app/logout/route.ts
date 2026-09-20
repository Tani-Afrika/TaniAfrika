import { NextResponse, type NextRequest } from 'next/server';
import { DEV_ROLE_COOKIE } from '@/lib/auth/constants';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore any signOut errors
  }

  const response = NextResponse.redirect(new URL('/login', request.url));
  
  // Clear dev role cookie
  response.cookies.delete(DEV_ROLE_COOKIE);

  // Clear any Supabase auth cookies
  request.cookies.getAll().forEach((cookie) => {
    if (cookie.name.includes('auth-token') || cookie.name.includes('supabase') || cookie.name === DEV_ROLE_COOKIE) {
      response.cookies.delete(cookie.name);
    }
  });

  return response;
}

export const POST = GET;
