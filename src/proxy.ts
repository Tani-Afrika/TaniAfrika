import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getDevRoleFromRequest, MOCK_USERS } from '@/lib/auth/dev-session';

// Matches the base path itself or a sub-path of it (e.g. '/driver' or
// '/driver/123'), but NOT a sibling route that merely shares the same
// prefix string (e.g. '/drivers'). Plain startsWith() can't tell '/driver'
// apart from '/drivers', which is what let admin's '/drivers' and
// '/clients' management pages get misclassified as the driver/client app
// sections below.
const isPathOrSubpath = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(base + '/');

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Optimization 1: Bypass background prefetch requests entirely to prevent unnecessary proxy executions on Vercel
  const isPrefetch =
    request.headers.get('x-middleware-prefetch') === '1' ||
    request.headers.get('purpose') === 'prefetch';

  if (isPrefetch) {
    return supabaseResponse;
  }

  const isPublicAuthPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/reset-password');

  // Dev Session Check: Instant 1-click test access
  const devRole = getDevRoleFromRequest(request);
  if (devRole) {
    const mockUser = MOCK_USERS[devRole];
    const pathname = request.nextUrl.pathname;
    const isClientAppRoute = isPathOrSubpath(pathname, '/client');
    const isDriverAppRoute = isPathOrSubpath(pathname, '/driver');
    const isAdminRoute = !isClientAppRoute && !isDriverAppRoute && !isPublicAuthPage;

    if (isPublicAuthPage) {
      return NextResponse.redirect(new URL(mockUser.redirectUrl, request.url));
    }

    if (isClientAppRoute && (mockUser.role as string) !== 'client') {
      return NextResponse.redirect(new URL(mockUser.redirectUrl, request.url));
    }
    if (isDriverAppRoute && (mockUser.role as string) !== 'driver') {
      return NextResponse.redirect(new URL(mockUser.redirectUrl, request.url));
    }
    if (isAdminRoute && (mockUser.role as string) !== 'admin') {
      return NextResponse.redirect(new URL(mockUser.redirectUrl, request.url));
    }

    return NextResponse.next({ request });
  }

  const redirectWithCookies = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

  // Optimization 2: Guard against empty session cookies to prevent useless database roundtrips for unauthenticated users
  const hasSessionCookie = request.cookies.getAll().some((cookie) =>
    cookie.name.includes('auth-token')
  );

  if (!hasSessionCookie) {
    if (isPublicAuthPage) {
      return supabaseResponse;
    }
    return redirectWithCookies('/login');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicAuthPage) {
    return redirectWithCookies('/login');
  }

  if (user && isPublicAuthPage) {
    // Logged in but sitting on the login page — send to their home route.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('PROXY PROFILE CHECK (auth page)', {
      pathname: request.nextUrl.pathname,
      userId: user.id,
      profile,
      profileError,
    });

    const homeByRole: Record<string, string> = {
      admin: '/',
      client: '/client',
      driver: '/driver',
    };

    const destination = homeByRole[profile?.role ?? ''];

    // IMPORTANT: never redirect an authenticated user back to /login from
    // here. /login is a public auth page, so a redirect to it re-enters
    // this exact branch on the next request.
    if (!destination) {
      return supabaseResponse;
    }

    return redirectWithCookies(destination);
  }

  if (user) {
    const pathname = request.nextUrl.pathname;
    const isClientAppRoute = isPathOrSubpath(pathname, '/client');
    const isDriverAppRoute = isPathOrSubpath(pathname, '/driver');
    const isAdminRoute = !isClientAppRoute && !isDriverAppRoute && !isPublicAuthPage;

    if (isClientAppRoute || isDriverAppRoute || isAdminRoute) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      console.log('PROXY PROFILE CHECK (route guard)', {
        pathname,
        userId: user.id,
        profile,
        profileError,
      });

      if (!profile) {
        return supabaseResponse;
      }

      if (isClientAppRoute && profile.role !== 'client') {
        return redirectWithCookies(
          profile.role === 'admin'
            ? '/'
            : profile.role === 'driver'
            ? '/driver'
            : '/login'
        );
      }
      if (isDriverAppRoute && profile.role !== 'driver') {
        return redirectWithCookies(
          profile.role === 'admin'
            ? '/'
            : profile.role === 'client'
            ? '/client'
            : '/login'
        );
      }
      if (isAdminRoute && profile.role !== 'admin') {
        return redirectWithCookies(
          profile.role === 'client'
            ? '/client'
            : profile.role === 'driver'
            ? '/driver'
            : '/login'
        );
      }
    }
  }

  return supabaseResponse;
}

// Backward compatibility export
export { proxy as middleware };

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
