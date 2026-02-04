import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Ми вимикаємо всі редіректи на рівні сервера, 
  // щоб керувати ними тільки через клієнт (useAuth)
  return NextResponse.next();
}

export const config = {
  // Виключаємо системні файли Next.js та API з обробки
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};