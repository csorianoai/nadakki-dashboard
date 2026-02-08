import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const redirects = {
    "/google-ads": "/advertising/google-ads",
    "/meta-ads": "/advertising/meta-ads",
    "/linkedin-ads": "/advertising/linkedin-ads",
    "/tiktok-ads": "/advertising/tiktok-ads",
    "/unified": "/advertising/unified",
  };
  
  for (const [oldP, newP] of Object.entries(redirects)) {
    if (path === oldP || path.startsWith(oldP + "/")) {
      const newUrl = new URL(newP + path.slice(oldP.length), request.url);
      return new Response(null, { status: 307, headers: { location: newUrl.toString() } });
    }
  }
  return undefined;
}

export const config = { 
  matcher: [
    "/google-ads/:path*", 
    "/meta-ads/:path*", 
    "/linkedin-ads/:path*", 
    "/tiktok-ads/:path*", 
    "/unified/:path*"
  ] 
};
