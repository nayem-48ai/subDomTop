
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Main domain configuration
  const mainDomain = 'tnxbd.top';
  
  // 1. Skip all internal paths, assets, and API routes
  if (
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.') || 
    url.pathname.startsWith('/_vercel')
  ) {
    return NextResponse.next();
  }

  // 2. Prevent infinite loops if already rewritten
  if (url.pathname.startsWith('/_sites')) {
    return NextResponse.next();
  }

  // 3. Extract the subdomain
  const currentHost = hostname
    .replace(`.${mainDomain}`, '')
    .replace(`.localhost:3000`, '');

  // 4. Handle root domain vs subdomains
  const isRoot = !currentHost || currentHost === 'www' || hostname === mainDomain || hostname === 'localhost:3000';

  if (isRoot) {
    return NextResponse.next();
  }

  // 5. Rewrite subdomain requests to the dynamic site handler
  // Note: App.tsx or your routing logic should handle the 'site' parameter or path
  const searchParams = new URLSearchParams(url.search);
  searchParams.set('site', currentHost);
  
  // Rewrite internally to the site handler
  return NextResponse.rewrite(new URL(`${url.pathname}?${searchParams.toString()}`, req.url));
}

export const config = {
  matcher: ['/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)'],
};
