import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl;
    const hostname = request.headers.get('host') || '';

    let response = NextResponse.next();

    // --- ЗАХИСТ ДОСТУПУ ДО /crm/* ---
    const isCrmSubdomain = hostname.startsWith('crm.');
    const isDirectCrmAccess = pathname.startsWith('/crm') && !isCrmSubdomain;
    const isDevelopment = hostname.includes('localhost') || hostname.includes('127.0.0.1');

    if (isDirectCrmAccess) {
        // У development (localhost) дозволяємо прямий доступ до /crm/*
        // Перевірка ролі відбувається на клієнті в CrmLayout
        if (!isDevelopment) {
            // У production блокуємо прямий доступ — CRM тільки через субдомен
            response = NextResponse.redirect(new URL('/', request.url));
        }
        // У development — пропускаємо далі (NextResponse.next())
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

    // 🔐 Security Headers (without CSP — CSP is too restrictive for Firebase Auth)
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
