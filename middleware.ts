import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Extract custom cookies for different portals independently
    const patientToken = request.cookies.get('patient_token')?.value
    const adminToken = request.cookies.get('admin_token')?.value

    const isPatientAuth = !!patientToken
    const isAdminAuth = !!adminToken

    // 1. Secure Admin Routes
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        if (!isAdminAuth) {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }
    }

    // 2. Secure Patient Routes
    if (pathname.startsWith('/patient')) {
        if (!isPatientAuth) {
            const loginUrl = new URL('/login', request.url)
            loginUrl.searchParams.set('redirect', pathname)
            return NextResponse.redirect(loginUrl)
        }
    }

    // 3. Prevent logged-in Patients from seeing Patient Auth pages
    if (isPatientAuth && (pathname === '/login' || pathname === '/register' || pathname === '/portal')) {
        return NextResponse.redirect(new URL('/patient/dashboard', request.url))
    }

    // 4. Prevent logged-in Admins from seeing Admin Login page
    if (isAdminAuth && pathname === '/admin/login') {
        return NextResponse.redirect(new URL('/admin', request.url))
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
