import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const RATE_LIMIT_WINDOW_MS = 60000 // 1 minute
const RATE_LIMIT_MAX = 100 // 100 requests per minute
declare global { var __rateStore: Map<string, number[]> | undefined }
const rateStore = globalThis.__rateStore || (globalThis.__rateStore = new Map<string, number[]>())

export function middleware(request: NextRequest) {
  const getClientIp = (req: NextRequest & { ip?: string }): string =>
    (req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
     req.headers.get('x-real-ip') ||
     req.headers.get('cf-connecting-ip') ||
     req.ip ||
     '127.0.0.1')
  const limitByIp = (ip: string) => {
    const now = Date.now()
    let arr = rateStore.get(ip) || []
    arr = arr.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS)
    if (arr.length >= RATE_LIMIT_MAX) {
      const resetMs = RATE_LIMIT_WINDOW_MS - (now - arr[0])
      return { allowed: false, remaining: 0, resetMs: Math.max(0, resetMs) }
    }
    arr.push(now)
    rateStore.set(ip, arr)
    const remaining = Math.max(0, RATE_LIMIT_MAX - arr.length)
    const resetMs = arr.length ? RATE_LIMIT_WINDOW_MS - (now - arr[0]) : RATE_LIMIT_WINDOW_MS
    return { allowed: true, remaining, resetMs }
  }

  const authToken = request.cookies.get('auth-token')?.value
  const isAuthenticated = Boolean(authToken)
  const role = request.cookies.get('role')?.value
  const { pathname } = request.nextUrl
  const roleIsAdmin = role === 'ADMIN' || role === 'SUPPORT'
  const roleIsCustomer = role === 'CUSTOMER'
  const roleKnown = roleIsAdmin || roleIsCustomer

  let rateRemaining: number | null = null
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(request)
    const res = limitByIp(ip)
    if (!res.allowed) {
      return new Response('Too many requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': '0',
          'Retry-After': String(Math.ceil(res.resetMs / 1000)),
        },
      })
    }
    rateRemaining = res.remaining
  }

  if (pathname === '/login' && isAuthenticated && roleKnown) {
    const url = roleIsCustomer ? '/portal/dashboard' : '/admin/dashboard'
    return NextResponse.redirect(new URL(url, request.url))
  }

  // If not authenticated, redirect any protected route to the login page
  if (!isAuthenticated && !pathname.startsWith('/api/') && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthenticated) {
    // Redirect from root based on role
    if (pathname === '/') {
      const url = roleIsCustomer ? '/portal/dashboard' : roleIsAdmin ? '/admin/dashboard' : '/login'
      return NextResponse.redirect(new URL(url, request.url))
    }

    // Role-based access control for admin and portal routes
    if (pathname.startsWith('/admin') && !roleIsAdmin) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (pathname.startsWith('/portal') && !roleIsCustomer) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Default security headers for non-API routes
  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX))
    if (rateRemaining !== null) response.headers.set('X-RateLimit-Remaining', String(rateRemaining))
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
