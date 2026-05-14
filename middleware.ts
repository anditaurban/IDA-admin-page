import { NextResponse, type NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'auth_session';

const protectedRoutes = [
  '/',
  '/course-editor',
];

const authRoutes = [
  '/login',
];

function isProtectedPath(pathname: string) {
  return protectedRoutes.some((route) => {
    if (route === '/') return pathname === '/';
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

function isAuthPath(pathname: string) {
  return authRoutes.includes(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const protectedPath = isProtectedPath(pathname);
  const authPath = isAuthPath(pathname);

  if (protectedPath && !sessionToken) {
    const loginUrl = new URL('/login', request.url);

    const callbackUrl = `${pathname}${search}`;
    loginUrl.searchParams.set('callbackUrl', callbackUrl);

    return NextResponse.redirect(loginUrl);
  }

  if (authPath && sessionToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/course-editor/:path*',
  ],
};