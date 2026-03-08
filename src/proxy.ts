import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Proxy — серверний захист маршрутів і заголовки безпеки.
 * 
 * 🔐 SECURITY:
 * - Блокує прямий доступ до /crm/* у production
 * - Перевіряє CRM cookie ЗА ЗНАЧЕННЯМ (не тільки наявність) — VUL-06 FIX
 * - Встановлює Security Headers на ВСІ відповіді — VUL-10 FIX
 */
export function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl;
    const hostname = request.headers.get('host') || '';

    let response = NextResponse.next();

    // --- 1. ЗАХИСТ ДОСТУПУ ДО /crm/* ---
    const isCrmSubdomain = hostname.startsWith('crm.');
    const isDirectCrmAccess = pathname.startsWith('/crm') && !isCrmSubdomain;
    const isDevelopment = hostname.includes('localhost') || hostname.includes('127.0.0.1');

    if (isDirectCrmAccess) {
        // У development (localhost) дозволяємо прямий доступ до /crm/*
        // Перевірка ролі відбувається на клієнті в CrmLayout
        if (!isDevelopment) {
            // У production блокуємо прямий доступ — CRM тільки через субдомен
            response = NextResponse.redirect(new URL('/', request.url));
            addSecurityHeaders(response);
            return response;
        }
        // У development — пропускаємо далі (NextResponse.next())
    } else if (isCrmSubdomain) {
        // 🔐 VUL-06 FIX: Перевіряємо не тільки наявність, а й ЗНАЧЕННЯ cookie
        const adminCookie = request.cookies.get('politografisi_admin_access');
        const expectedSecret = process.env.CRM_ACCESS_SECRET || '';

        const hasValidToken = adminCookie && expectedSecret && adminCookie.value === expectedSecret;

        if (!hasValidToken) {
            if (pathname === '/crm/login' || pathname === '/login') {
                response = NextResponse.rewrite(new URL('/crm/login' + search, request.url));
            } else {
                response = NextResponse.redirect(new URL('/crm/login', request.url));
            }
        } else {
            response = NextResponse.rewrite(new URL(`/crm${pathname}${search}`, request.url));
        }
    }

    // --- 2. SECURITY HEADERS (на ВСІ відповіді) ---
    addSecurityHeaders(response);

    return response;
}

/**
 * Додати заголовки безпеки до відповіді.
 */
function addSecurityHeaders(response: NextResponse) {
    // DNS Prefetch
    response.headers.set("X-DNS-Prefetch-Control", "on");

    // HSTS — примусовий HTTPS
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

    // Permissions Policy — обмеження API браузера
    response.headers.set("Permissions-Policy", "camera=(self), microphone=(self), geolocation=()");

    // 🔐 VUL-10 FIX: XSS Protection (legacy, але не зашкодить)
    response.headers.set("X-XSS-Protection", "1; mode=block");

    // Prevent MIME sniffing
    response.headers.set("X-Content-Type-Options", "nosniff");
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|llms.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|wav|ogg)$).*)",
    ],
};
