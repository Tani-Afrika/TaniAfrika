import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Matches the base path itself or a sub-path of it (e.g. '/driver' or
// '/driver/123'), but NOT a sibling route that merely shares the same
// prefix string (e.g. '/drivers'). Plain startsWith() can't tell '/driver'
// apart from '/drivers', which is what let admin's '/drivers' and
// '/clients' management pages get misclassified as the driver/client app
// sections below.
const isPathOrSubpath = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(base + '/');

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const isPublicAuthPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/reset-password');

  const redirectWithCookies = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

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

    console.log('MIDDLEWARE PROFILE CHECK (auth page)', {
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
    // this exact branch on the next request — if the profile fetch fails
    // or the role is unmapped every time (stale/missing profile row, RLS
    // still blocking the read, null role, etc.), that's an infinite
    // redirect loop (ERR_TOO_MANY_REDIRECTS). If we can't resolve a
    // destination, just let the request through and render /login as-is
    // instead of looping.
    if (!destination) {
      return supabaseResponse;
    }

    return redirectWithCookies(destination);
  }

  // Cross-role guard: prevent a client from hitting /driver/* and vice versa,
  // and keep both out of the admin dashboard root. Each (group)/layout.tsx
  // still does its own authoritative check server-side — this is a fast
  // early bounce so users don't even reach a page that will just redirect.
  //
  // NOTE: these checks use isPathOrSubpath(), not startsWith(), so that the
  // admin-only management pages '/drivers' and '/clients' (plural) are not
  // mistaken for the driver/client app sections '/driver' and '/client'
  // (singular).
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

      console.log('MIDDLEWARE PROFILE CHECK (route guard)', {
        pathname,
        userId: user.id,
        profile,
        profileError,
      });

      // Same principle as above: if the role can't be resolved, don't
      // send the user to /login here either while they're already
      // authenticated on a protected route — that risks re-entering the
      // auth-page branch and looping if the profile fetch keeps failing.
      // Let them through to the route; that route's own layout.tsx does
      // the authoritative check and will redirect just once if needed.
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

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};