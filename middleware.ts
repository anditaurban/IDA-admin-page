import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Ambil token dari cookies browser
  const sessionToken = request.cookies.get('auth_session')?.value || request.cookies.get('token')?.value;

  // Tentukan path mana saja yang membutuhkan perlindungan (hanya user login yang bisa akses)
  const isProtectedRoute = request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/course-editor');

  // Jika mencoba akses halaman terproteksi TANPA token, alihkan ke /login
  if (isProtectedRoute && !sessionToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika mencoba buka /login TAPI SUDAH punya token, alihkan ke Dashboard (/)
  if (request.nextUrl.pathname === '/login' && sessionToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Konfigurasi ini memastikan middleware hanya berjalan di rute-rute penting, mengabaikan file statis seperti CSS/Gambar
export const config = {
  matcher: [
    '/',
    '/login',
    '/course-editor/:path*',
  ],
};