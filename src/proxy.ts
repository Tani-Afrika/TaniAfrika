import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getDevRoleFromRequest, MOCK_USERS } from '@/lib/auth/constants';

// Matches the base path itself or a sub-path of it (e.g. '/driver' or
// '/driver/123'), but NOT a sibling route that merely shares the same
// prefix string (e.g. '/drivers'). Plain startsWith() can't tell '/driver'
// apart from '/drivers', which is what let admin's '/drivers' and
// '/clients' management pages get misclassified as the driver/client app
// sections below.
const isPathOrSubpath = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(base + '/');

// -----------------------------------------------------------------------
// Route model — mirrors how Uber/Bolt split their surface:
//
//   Public (no auth required)   Anyone can land here and browse freely.
//                                 The marketing homepage ("/") — hero,
//                                 how-it-works, and the guest delivery
//                                 quote widget — plus the auth pages
//                                 themselves. Auth is only requested at
//                                 the moment of a real transaction (e.g.
//                                 the guest quote's "Book this delivery"
//                                 button), not to look around the site.
//
//   Protected (auth required)   Everything that reads/writes a specific
//                                 person's data: the client app, the
//                                 driver app, and the admin console.
//
// A route that isn't explicitly one of the three protected prefixes is
// public by default — this is the opposite of the old logic, which
// treated "not /client and not /driver and not an auth page" as admin,
// silently sweeping the homepage and any future public page behind the
// admin login wall.
// -----------------------------------------------------------------------
const CLIENT_PREFIX = '/client';
const DRIVER_PREFIX = '/driver';
const ADMIN_PREFIX = '/admin';

function classifyRoute(pathname: string) {
  const isClientAppRoute = isPathOrSubpath(pathname, CLIENT_PREFIX);
  const isDriverAppRoute = isPathOrSubpath(pathname, DRIVER_PREFIX);
  const isAdminAppRoute = isPathOrSubpath(pathname, ADMIN_PREFIX);
  const isProtectedRoute = isClientAppRoute || isDriverAppRoute || isAdminAppRoute;

  return { isClientAppRoute, isDriverAppRoute, isAdminAppRoute, isProtectedRoute };
}

const HOME_BY_ROLE: Record<string, string> = {
  admin: ADMIN_PREFIX,
  client: CLIENT_PREFIX,
  driver: DRIVER_PREFIX,
};

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

  const pathname = request.nextUrl.pathname;

  const isPublicAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/reset-password');

  const { isClientAppRoute, isDriverAppRoute, isAdminAppRoute, isProtectedRoute } =
    classifyRoute(pathname);

  // Redirect an unauthenticated visitor hitting a protected route to
  // /login, remembering where they were headed so we can send them
  // straight back after they sign in — the same "continue where you left
  // off" pattern Uber/Bolt use when a guest tries to confirm a booking.
  const redirectToLogin = () => {
    const url = request.nextUrl.clone();
    const target = pathname + (request.nextUrl.search || '');
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('redirectTo', target);
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

  const redirectWithCookies = (destinationPath: string) => {
    const url = request.nextUrl.clone();
    url.pathname = destinationPath;
    url.search = '';
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

  // Dev Session Check: Instant 1-click test access
  const devRole = getDevRoleFromRequest(request);
  if (devRole) {
    const mockUser = MOCK_USERS[devRole];

    if (isPublicAuthPage) {
      return NextResponse.redirect(new URL(mockUser.redirectUrl, request.url));
    }

    if (isClientAppRoute && (mockUser.role as string) !== 'client') {
      return NextResponse.redirect(new URL(mockUser.redirectUrl, request.url));
    }
    if (isDriverAppRoute && (mockUser.role as string) !== 'driver') {
      return NextResponse.redirect(new URL(mockUser.redirectUrl, request.url));
    }
    if (isAdminAppRoute && (mockUser.role as string) !== 'admin') {
      return NextResponse.redirect(new URL(mockUser.redirectUrl, request.url));
    }

    // Public marketing pages and anything else outside the three app
    // sections are unaffected by the dev override.
    return NextResponse.next({ request });
  }

  // Public routes (marketing homepage, and anything not explicitly gated)
  // never need a session lookup for unauthenticated visitors — let them
  // straight through.
  if (!isProtectedRoute && !isPublicAuthPage) {
    return supabaseResponse;
  }

  // Optimization 2: Guard against empty session cookies to prevent useless database roundtrips for unauthenticated users
  const hasSessionCookie = request.cookies.getAll().some((cookie) =>
    cookie.name.includes('auth-token')
  );

  if (!hasSessionCookie) {
    if (isPublicAuthPage) {
      return supabaseResponse;
    }
    return redirectToLogin();
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
    return redirectToLogin();
  }

  if (user && isPublicAuthPage) {
    // Logged in but sitting on an auth page — send to their home route.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // A redirectTo carried over from a guest transaction (e.g. "confirm
    // this delivery") takes priority over the generic role home, so the
    // person lands back exactly where they left off.
    const requestedRedirect = request.nextUrl.searchParams.get('redirectTo');
    const isSafeRedirect =
      requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('//');

    const destination = isSafeRedirect
      ? requestedRedirect
      : HOME_BY_ROLE[profile?.role ?? ''];

    // IMPORTANT: never redirect an authenticated user back to /login from
    // here. /login is a public auth page, so a redirect to it re-enters
    // this exact branch on the next request.
    if (!destination) {
      return supabaseResponse;
    }

    return redirectWithCookies(destination);
  }

  if (user && isProtectedRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return supabaseResponse;
    }

    if (isClientAppRoute && profile.role !== 'client') {
      return redirectWithCookies(HOME_BY_ROLE[profile.role] ?? '/login');
    }
    if (isDriverAppRoute && profile.role !== 'driver') {
      return redirectWithCookies(HOME_BY_ROLE[profile.role] ?? '/login');
    }
    if (isAdminAppRoute && profile.role !== 'admin') {
      return redirectWithCookies(HOME_BY_ROLE[profile.role] ?? '/login');
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
