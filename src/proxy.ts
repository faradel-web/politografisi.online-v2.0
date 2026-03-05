import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl;
    const hostname = request.headers.get('host') || '';

    let response = NextResponse.next();

    // --- ЗАХИСТ ПРЯМОГО ДОСТУПУ ДО /crm/* ---
    const isCrmSubdomain = hostname.startsWith('crm.');
    const isDirectCrmAccess = pathname.startsWith('/crm') && !isCrmSubdomain;

    if (isDirectCrmAccess) {
        response = NextResponse.redirect(new URL('/', request.url));
    } else if (isCrmSubdomain) {
        const hasAdminToken = request.cookies.has('politografisi_admin_access');

        if (!hasAdminToken) {
            if (pathname === '/crm/login' || pathname === '/login') {
                response = NextResponse.rewrite(new URL('/crm/login' + search, request.url));
            } else {
                response = NextResponse.redirect(new URL('/crm/login', request.url));
            }
        } else {
            response = NextResponse.rewrite(new URL(`/crm${pathname}${search}`, request.url));
        }
    }

    // 🔐 Content-Security-Policy
    const cspHeader = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.googletagmanager.com https://connect.facebook.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com https://*.google-analytics.com",
        "connect-src 'self' https://*.googleapis.com https://*.google-analytics.com https://*.analytics.google.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.facebook.com https://connect.facebook.net",
        "media-src 'self' blob: https://firebasestorage.googleapis.com",
        "frame-src 'self' https://accounts.google.com https://www.facebook.com https://politografisi-online.firebaseapp.com",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
    ].join("; ");

    response.headers.set("Content-Security-Policy", cspHeader);
    response.headers.set("X-DNS-Prefetch-Control", "on");
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    response.headers.set("Permissions-Policy", "camera=(self), microphone=(self), geolocation=()");

    return response;
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|llms.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|wav|ogg)$).*)",
    ],
};
