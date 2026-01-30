import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Проверяем, если это админский маршрут (кроме страницы логина)
  if (request.nextUrl.pathname.startsWith('/admin') && 
      !request.nextUrl.pathname.startsWith('/admin/login')) {
    
    // Проверяем наличие токена аутентификации
    const token = request.cookies.get('admin-token')
    
    // Проверяем, что токен существует и не пустой
    if (!token || !token.value || token.value.trim() === '') {
      // Перенаправляем на страницу логина
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*'
}