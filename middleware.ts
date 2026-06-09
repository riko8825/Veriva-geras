export const config = {
  // Veikia TIK legacy WordPress / senų permalink pattern'ų keliams.
  // Visi kiti request'ai (normalūs puslapiai, /assets, /api, /seo, /blog)
  // matcher'io nepasiekia → jokios latency norm. trafikui.
  matcher: [
    '/wp-json/:path*',
    '/wp-admin/:path*',
    '/wp-includes/:path*',
    '/wp-content/:path*',
    '/wp-login.php',
    '/xmlrpc.php',
    '/feed/:path*',
    '/feed',
    '/comments/:path*',
    '/author/:path*',
    '/category/:path*',
    '/tag/:path*',
    '/pagrindinis/:path*',
    '/pagrindinis',
    '/kibernetinis-saugumas/:path*',
    '/kibernetinis-saugumas',
    '/mokymai/:path*',
    '/mokymai',
    '/kontaktai/:path*',
    '/kontaktai',
    '/privatumo-politika/:path*',
    '/privatumo-politika',
    '/bdar-atitiktis/:path*',
    '/bdar-atitiktis',
    '/apie-imone/:path*',
    '/apie-imone',
    '/apie',
  ],
};

// Pirmas kelio segmentas → galutinis tikslas (1 hop, jokio trailingSlash tarp-hop'o).
const DEST: Record<string, string> = {
  pagrindinis: '/',
  'kibernetinis-saugumas': '/',
  mokymai: '/',
  'wp-login.php': '/',
  'xmlrpc.php': '/',
  feed: '/',
  comments: '/',
  author: '/',
  category: '/',
  tag: '/',
  'privatumo-politika': '/privatumas',
  'bdar-atitiktis': '/seo/bdar-auditas-lietuvoje',
  kontaktai: '/#kontaktai',
  'apie-imone': '/#apie',
  apie: '/#apie',
};

const WP_PREFIXES = ['wp-json', 'wp-admin', 'wp-includes', 'wp-content'];

export default function middleware(request: Request): Response {
  const url = new URL(request.url);
  // Normalizuojam: nukerpam visus pradinius/galinius slash'us, imam 1-ą segmentą.
  const segments = url.pathname.split('/').filter(Boolean);
  const first = segments[0] ?? '';

  let destination: string | undefined;

  if (WP_PREFIXES.includes(first)) {
    destination = '/';
  } else if (first in DEST) {
    destination = DEST[first];
  }

  if (destination) {
    return new Response(null, {
      status: 308,
      headers: { Location: new URL(destination, url.origin).toString() },
    });
  }

  // Ne legacy pattern (teoriškai matcher to neturėtų praleisti) → tęsiam normaliai.
  return new Response(null, {
    status: 200,
    headers: { 'x-middleware-next': '1' },
  });
}
