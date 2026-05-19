import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/dashboard', '/stats', '/library', '/profile', '/module', '/flashcards', '/quiz', '/upload', '/setup']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED.some(r => pathname.startsWith(r))
  if (!isProtected) return NextResponse.next()

  // Check session cookie without making any network call
  const cookies = request.cookies.getAll()
  const hasSession = cookies.some(c => c.name.includes('auth-token') && c.value.length > 10)

  if (!hasSession) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
