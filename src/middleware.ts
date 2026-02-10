import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Визначаємо, чи ми на піддомені CRM
  const isCrmSubdomain = hostname.startsWith('crm.');

  // --- ЛОГІКА "ПОДВІЙНОГО ШЛЮЗУ" ---
  if (isCrmSubdomain) {
    
    // 1. Перевірка наявності кукі
    const hasAdminToken = request.cookies.has('politografisi_admin_access');
    
    // 2. Перевірка наявності "пропуску" в URL (для першого входу та localhost)
    const hasUrlToken = url.searchParams.get('crm_access') === 'true';

    // СЦЕНАРІЙ А: У нас немає ні кукі, ні пропуску в URL -> БАН
    if (!hasAdminToken && !hasUrlToken) {
      // Формуємо URL для редіректу на основний сайт
      // Для localhost прибираємо 'crm.' і 'www.', залишаємо чистий хост
      const mainDomain = hostname.replace('crm.', '').replace('www.', ''); 
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      
      // Якщо це localhost, повертаємо на localhost:3000
      // Якщо прод, повертаємо на politografisi.online
      return NextResponse.redirect(`${protocol}://${mainDomain}`);
    }

    // СЦЕНАРІЙ Б: Доступ дозволено (є кукі або URL-токен)
    
    // Формуємо відповідь (Rewrite на папку CRM)
    const response = NextResponse.rewrite(new URL(`/crm${url.pathname}`, request.url));

    // ЯКЩО це був вхід через URL-токен -> Встановлюємо кукі, щоб далі працювало без токена
    if (hasUrlToken && !hasAdminToken) {
       response.cookies.set('politografisi_admin_access', 'true', {
           path: '/',
           maxAge: 3600, // 1 година
           sameSite: 'lax'
       });
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};