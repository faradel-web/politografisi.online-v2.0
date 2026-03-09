import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Proxy — серверний захист маршрутів і заголовки безпеки.
 * 
 * 🔐 SECURITY:
 * - CRM доступ: роль перевіряється на клієнті в CrmLayout (тільки ADMIN)
 * - CRM subdomain: перенаправляє на /crm/* маршрути
 * - Встановлює Security Headers на ВСІ відповіді
 */
export function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl;
    const hostname = request.headers.get('host') || '';

    let response = NextResponse.next();

    // --- 1. CRM SUBDOMAIN REWRITE ---
    // Якщо запит через crm.politografisi.online — rewrite на /crm/*
    const isCrmSubdomain = hostname.startsWith('crm.');

    if (isCrmSubdomain) {
        // Rewrite subdomain requests to /crm/* routes
        if (!pathname.startsWith('/crm')) {
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

    // XSS Protection (legacy, але не зашкодить)
    response.headers.set("X-XSS-Protection", "1; mode=block");

    // Prevent MIME sniffing
    response.headers.set("X-Content-Type-Options", "nosniff");
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|llms.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|wav|ogg)$).*)",
    ],
};

