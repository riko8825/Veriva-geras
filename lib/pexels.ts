// lib/pexels.ts — hero image search for Veriva blog posts
// LT keyword → EN query mapping (Pexels search is EN-only for best results)

const TIMEOUT_MS = 8000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// LT BDAR/IT sauga keyword → EN Pexels query (Veriva tematika)
function buildSearchQuery(keyword: string): string {
  const kw = keyword.toLowerCase();

  // BDAR / duomenų apsauga
  if (kw.includes('bdar') || kw.includes('gdpr') || kw.includes('duomenų apsaug')) return 'data protection privacy compliance office';
  if (kw.includes('vdai') || kw.includes('inspekcij') || kw.includes('baud')) return 'legal compliance audit document office';
  if (kw.includes('dpo') || kw.includes('duomenų apsaugos pareigūn')) return 'data protection officer business meeting';
  if (kw.includes('dpia') || kw.includes('rizikos vertinim')) return 'risk assessment business analytics professional';
  if (kw.includes('privatumo politik') || kw.includes('sutikim')) return 'privacy policy document business legal';
  if (kw.includes('slapuk') || kw.includes('cookie')) return 'cookie consent website browser laptop';
  if (kw.includes('darbuotoj') || kw.includes('hr')) return 'employee office professional team meeting';
  if (kw.includes('sutarti') || kw.includes('dpa')) return 'contract signing business agreement professional';

  // Kibernetinis saugumas / NIS2 / DORA
  if (kw.includes('nis2') || kw.includes('kibernetin')) return 'cybersecurity technology network protection';
  if (kw.includes('dora') || kw.includes('finansin')) return 'financial technology security banking professional';
  if (kw.includes('iso 27001') || kw.includes('iso27001')) return 'cybersecurity certification compliance professional';
  if (kw.includes('incident') || kw.includes('pažeidim')) return 'cybersecurity incident response team monitoring';
  if (kw.includes('phishing') || kw.includes('mokym')) return 'cybersecurity training workshop laptop professional';
  if (kw.includes('audit') || kw.includes('patikrinim')) return 'business audit compliance checklist professional';
  if (kw.includes('saugum') || kw.includes('apsaug')) return 'cybersecurity protection network technology';

  // Fallback — generic LT B2B professional
  return `${keyword} business professional`;
}

export async function getImage(keyword: string): Promise<string> {
  const token = process.env.PEXELS_API_KEY;
  if (!token) throw new Error('[pexels] PEXELS_API_KEY is not set');

  const query = buildSearchQuery(keyword);
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`;
  console.log(`[pexels] GET ${url}`);

  let lastErr: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { Authorization: token },
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[pexels] attempt ${attempt}/${MAX_RETRIES} fetch failed: ${msg}`);
      lastErr = new Error(`[pexels] fetch failed: ${msg}`);
      if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
      continue;
    }
    clearTimeout(timer);

    console.log(`[pexels] attempt ${attempt}/${MAX_RETRIES} status: ${res.status}`);

    if (res.status === 429 || res.status >= 500) {
      const retryAfter = res.headers.get('Retry-After');
      const wait = retryAfter ? parseInt(retryAfter, 10) * 1000 : RETRY_DELAY_MS * attempt;
      console.warn(`[pexels] attempt ${attempt}/${MAX_RETRIES} → ${res.status}, retry in ${wait}ms`);
      lastErr = new Error(`[pexels] API ${res.status}`);
      if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, wait));
      continue;
    }

    if (!res.ok) {
      const body = await res.text();
      console.error(`[pexels] API ${res.status}: ${body.slice(0, 200)}`);
      throw new Error(`[pexels] API ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json() as { photos: Array<{ src: { landscape: string } }> };
    const photos = data.photos ?? [];
    if (photos.length === 0) throw new Error(`[pexels] no results for keyword: "${keyword}"`);
    const pick = photos[Math.floor(Math.random() * photos.length)];
    const imageUrl = pick?.src?.landscape;
    if (!imageUrl) throw new Error(`[pexels] no landscape src for keyword: "${keyword}"`);

    console.log(`[pexels] image: ${imageUrl}`);
    return imageUrl;
  }

  throw lastErr ?? new Error('[pexels] all retries failed');
}
