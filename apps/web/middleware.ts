import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════
// MIDDLEWARE — Route protection
// Admin routes require role check via cookie/header.
// For now: simple session-based guard.
// ═══════════════════════════════════════════

const ADMIN_ROLES = ['moderator', 'admin', 'superadmin'];

// Routes moderators can access (read-only)
const MODERATOR_ROUTES = ['/admin', '/admin/users', '/admin/equipment', '/admin/content', '/admin/characters'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // TODO: Read role from JWT session cookie
  // For development: allow all admin access.
  // In production, uncomment the guard below:
  //
  // const role = request.cookies.get('user_role')?.value;
  // if (!role || !ADMIN_ROLES.includes(role)) {
  //   return NextResponse.redirect(new URL('/home', request.url));
  // }
  //
  // // Moderator route restriction
  // if (role === 'moderator') {
  //   const allowed = MODERATOR_ROUTES.some(r =>
  //     pathname === r || pathname.startsWith(r + '/')
  //   );
  //   if (!allowed) {
  //     return NextResponse.redirect(new URL('/admin', request.url));
  //   }
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
