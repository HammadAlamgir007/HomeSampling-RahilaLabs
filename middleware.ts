import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Extract custom cookies
    const token = request.cookies.get('rahila_token')?.value
    const role = request.cookies.get('rahila_role')?.value

    const isAuth = !!token

    // 1. Secure Admin Routes
    // Allow access to /admin/login without a token, but protect all other /admin/* routes
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        if (!isAuth) {
            // Not logged in -> Redirect to Admin Login
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }

        if (role !== 'admin') {
            // Logged in, but NOT an admin -> Kick to general Unauthorized or Home
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    // 2. Secure Patient Routes
    // Protect all /patient/* routes (like dashboard, book-test)
    if (pathname.startsWith('/patient')) {
        if (!isAuth) {
            // Not logged in -> Redirect to Standard Login
            return NextResponse.redirect(new URL('/login', request.url))
        }

        if (role !== 'patient') {
            // Logged in as Admin trying to access patient Dashboard -> Redirect to Admin Dashboard
            if (role === 'admin') {
                return NextResponse.redirect(new URL('/admin', request.url))
            }
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    // 3. Prevent logged-in users from seeing Auth pages
    if (isAuth && (pathname === '/login' || pathname === '/register' || pathname === '/portal')) {
        if (role === 'admin') {
            return NextResponse.redirect(new URL('/admin', request.url))
        }
        if (role === 'patient') {
            return NextResponse.redirect(new URL('/patient/dashboard', request.url))
        }
    }

    // 4. Prevent Admin logged-in users from seeing Admin Login page
    if (isAuth && pathname === '/admin/login') {
        if (role === 'admin') {
            return NextResponse.redirect(new URL('/admin', request.url))
        }
    }

    return NextResponse.next()
}

// Config blocks Next.js from running middleware on static images, css, and public api routes.
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
