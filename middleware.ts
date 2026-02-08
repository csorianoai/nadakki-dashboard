import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const redirects = {
    '/google-ads': '/advertising/google-ads',
    '/meta-ads': '/advertising/meta-ads',
    '/linkedin-ads': '/advertising/linkedin-ads',
    '/tiktok-ads': '/advertising/tiktok-ads',
    '/unified': '/advertising/unified',
  }

  for (const [oldPath, newPath] of Object.entries(redirects)) {
    if (path === oldPath || path.startsWith(oldPath + '/')) {
      const newUrl = new URL(newPath + path.slice(oldPath.length), request.url)
      return NextResponse.redirect(newUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/google-ads/:path*',
    '/meta-ads/:path*', 
    '/linkedin-ads/:path*',
    '/tiktok-ads/:path*',
    '/unified/:path*',
  ],
}
