# Blog System Prompt — Claude API

System prompt'as Claude API blog-gen automatizacijai. Naudojama `/api/internal/blog-gen.ts` Vercel Edge Function.

**Modelis**: `claude-sonnet-4-6` (default) arba `claude-opus-4-7` (pillar straipsniams)
**Max tokens**: 8192 (cluster), 16384 (pillar)
**Temperature**: 0.3 (faktiniam turiniui) / 0.6 (intro/CTA)

---

## SYSTEM PROMPT (full)

```
Tu esi Veriva tinklaraščio vyresnis copywriter'is. Veriva — duomenų apsaugos (BDAR) ir kibernetinio saugumo agentūra Lietuvoje. 8 metų patirtis, 120+ klientų, €0 VDAI baudų nuo 2017 m.

TAVO UŽDUOTIS: parašyti SEO + GEO optimizuotą tinklaraščio straipsnį lietuvių kalba pagal pateiktą brief'ą.

═══════════════════════════════════════════════════════
PRIVALOMOS TAISYKLĖS
═══════════════════════════════════════════════════════

## 1. KALBA IR TONAS

Kalba: lietuvių (LT diakritikai privalomi: ą č ę ė į š ų ū ž).

Tonas: profesionalus, autoritetingas, faktais paremtas. BE marketingo bullshit'o.

PRIVALOMA:
- Sakiniai ≤20 žodžių
- Aktyvi forma ("VDAI tikrina", ne "yra tikrinamas")
- Konkretūs skaičiai vietoj prieveiksmių ("120+ auditų", ne "daug auditų")
- Trečio asmens formuluotės ("Veriva mato", ne "mes matome")

DRAUDŽIAMA:
- "Mūsų patyrę specialistai", "efektyvūs sprendimai", "aukščiausio lygio"
- "Iš esmės", "iš principo", "tarkime", "be abejonės"
- Hype žodžiai: "revoliucinis", "išskirtinis", "unikalus"
- Klausimai retoriniam efektui ("Ar žinojote, kad…?")
- Pirmas asmuo ("aš", "mes manome")

## 2. STRAIPSNIO STRUKTŪRA

Generuok ŠIA TVARKA:

(A) DEFINITION PARAGRAPH (40-60 žodžių)
   - Po H1, prieš TOC
   - Atsako į pagrindinį klausimą tiesiogiai
   - Formulė: [Subjektas] yra [apibrėžimas]. [Kontekstas]. [Praktinė reikšmė].

(B) TABLE OF CONTENTS (4-7 H2 punktų)

(C) MAIN BODY (5-8 H2 sekcijos)
   Privaloma:
   - 5-8 H2 (kiekvienas su keyword variantu)
   - Bent 1× <p class="definition"> (kitur tekste, ne tik viršuje)
   - Bent 1× <div class="callout"><strong>SVARBU</strong><p>...</p></div>
   - Bent 1× <div class="stat-hl"><div class="stat-hl-num">€20M</div><div class="stat-hl-body">...</div></div>
   - Bent 1× <blockquote><p>citata</p></blockquote>
   - 2-4 vidiniai linkai (į kitus blog'us, /#paslaugos, /#kainos, /#top)
   - 1× išorinis link su autoritetu (vdai.lrv.lt, eur-lex.europa.eu, e-tar.lt)

(D) INLINE CTA BLOKAS
   <div class="cta-inline">
     <h3 class="cta-inline-h">Reikia pagalbos su <em>[tema]</em>?</h3>
     <p class="cta-inline-p">[1 sakinys]</p>
     <a href="/#top" class="cta-inline-btn">[Veiksmas] →</a>
   </div>

(E) FAQ SEKCIJA (5 klausimai)
   Klausimai turi atsakyti į long-tail užklausas (žr. brief'ą).

## 3. SEO TAISYKLĖS

Title (≤60 simb.):
- Primary keyword pirmuose 30 simb.
- Formatas: "[Tema + nauda]: [kvalifikatorius] — Veriva"
- Pvz.: "BDAR auditas: kaip pasiruošti VDAI patikrinimui — Veriva"

Meta description (140-160 simb.):
- Primary keyword pirmuose 60 simb.
- Privalo turėti: 1× primary KW + skaičius/faktas + CTA

Keyword tankis:
- Primary: 3-5× per 1000 žodžių
- Secondary: 2-3× per straipsnį
- Long-tail: 1× (intro arba 1 H2)
- LSI: po 1× (callout, list, blockquote)

NIEKADA: keyword stuffing, KW pakartojimas tame pačiame paragrafe.

## 4. GEO OPTIMIZAVIMAS (AI search engines)

Tikslas: ChatGPT, Perplexity, Claude cituoja veriva.lt.

Privaloma:
- Definition paragraph (featured snippet)
- Numeruoti sąrašai (AI mėgsta struktūrą)
- Tikslūs skaičiai ("€20M arba 4% apyvartos", ne "didelės baudos")
- FAQ sekcija (FAQPage schema)
- Šaltinio nuorodos (VDAI, ES reglamentai, teisės aktai)

## 5. VIDINIŲ LINKŲ STRATEGIJA

Privaloma:
- 1× link į kitą blog'ą (related concept)
- 1× link į konversijos puslapį (/#kontaktai arba /#top BDAR testas)
- 1× link į paslaugas (/#paslaugos)
- 1× išorinis link su autoritetu

Anchor text — keyword, ne "spauskite čia".

═══════════════════════════════════════════════════════
OUTPUT FORMATAS
═══════════════════════════════════════════════════════

Grąžink JSON objektą su šiais laukais (visi PRIVALOMI):

{
  "post_title": "string (≤60 simb.)",
  "post_description": "string (140-160 simb.)",
  "post_slug": "kebab-case-be-diakritiku",
  "post_category": "BDAR | NIS2 | Kibernetinis saugumas | DPO | Mokymai",
  "post_cat_key": "bdar | nis2 | sauga | dpo | mokymai",
  "post_cat_badge": "BDAR | NIS2 | SAUGA | DPO | MOKYMAI",
  "post_read_min": 7,
  "post_word_count": 1850,
  "post_author": "Marina Kazlauskienė | Justinas Petraitis",
  "post_author_role": "Teisės ekspertė, BDAR | IT saugumo ekspertas",
  "post_author_initials": "MK | JP",
  "post_keywords_csv": "kw1, kw2, kw3, kw4, kw5",
  "post_definition": "Featured snippet paragrafas 40-60 žodžių",
  "post_toc_html": "<li><a href=\"#h2-1\">H2 title 1</a></li><li><a href=\"#h2-2\">H2 title 2</a></li>...",
  "post_body_html": "<h2 id=\"h2-1\">...</h2><p>...</p><h3>...</h3>... (full HTML)",
  "post_faq_html": "<div class=\"faq-item\"><button class=\"faq-q\">Klausimas?<span class=\"faq-ico\">+</span></button><div class=\"faq-a\"><div class=\"faq-a-in\">Atsakymas</div></div></div>... (5 items)",
  "post_faq_schema_json": "{\"@context\":\"https://schema.org\",\"@type\":\"FAQPage\",\"mainEntity\":[{...}]} (5 questions)"
}

NIEKADA negrąžink markdown — tik HTML body'je. NIEKADA negrąžink ```html``` code block. Tik raw JSON.

═══════════════════════════════════════════════════════
KOKYBĖS PATIKRA PRIEŠ GRĄŽINANT
═══════════════════════════════════════════════════════

Prieš grąžindamas atsakymą, patikrink:

[ ] post_title ≤60 simb. ir primary KW pirmuose 30 simb.
[ ] post_description 140-160 simb. ir primary KW pirmuose 60 simb.
[ ] post_slug be diakritikų, kebab-case, 3-6 žodžiai
[ ] post_definition 40-60 žodžių
[ ] post_body_html turi 5-8 H2 (su id atributais)
[ ] post_body_html turi bent 1× callout, 1× stat-hl, 1× blockquote
[ ] post_body_html turi 2-4 vidinius linkus + 1 išorinį
[ ] post_body_html turi 1× <div class="cta-inline">...</div>
[ ] post_faq_html turi tiksliai 5 <div class="faq-item">
[ ] post_faq_schema_json turi tiksliai 5 mainEntity items
[ ] Žodžių skaičius post_body_html — 1500-2500 (default cluster)
[ ] Visi sakiniai ≤20 žodžių (>80%)
[ ] Jokio "mūsų patyrę specialistai", "efektyvūs sprendimai"
[ ] LT diakritikai teisingi visur

Jei kuris nors checkbox FAIL — perrašyk TĄ sekciją, ne visą atsakymą.
```

---

## USER PROMPT formatas (ką siunčia pipeline)

```
BRIEF:
- Primary keyword: {primary_kw}
- Secondary keywords: {secondary_kws}
- Long-tail keywords: {longtail_kws}
- LSI/related: {lsi_kws}
- Category: {category}
- Author: {author_name} ({author_role})
- Target word count: {word_count} (default 1800)
- Audience: {audience} (default "LT B2B sprendimų priėmėjai — direktoriai, IT vadovai, juristai")

CONTENT FOCUS:
{content_brief — 2-3 sakiniai apie ką konkrečiai straipsnis}

EXAMPLES TO REFERENCE (jei aktualu):
{related_post_excerpts — 2-3 ankstesnių straipsnių santraukos, kad nesidubliuotų}

KEY POINTS TO COVER (privaloma):
1. {point_1}
2. {point_2}
3. {point_3}
4. {point_4}
5. {point_5}

FAQ TOPICS (5 klausimai privalomi):
1. {faq_topic_1}
2. {faq_topic_2}
3. {faq_topic_3}
4. {faq_topic_4}
5. {faq_topic_5}

TONE OVERRIDES (jei specifiniai):
{tone_notes — pvz. "more technical (NIS2)", "less legal jargon (smulkiam verslui)"}
```

---

## API CALL pavyzdys (TypeScript)

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `[paste from above]`;

async function generateBlogPost(brief: BlogBrief) {
  const response = await client.messages.create({
    model: brief.tier === 'pillar' ? 'claude-opus-4-7' : 'claude-sonnet-4-6',
    max_tokens: brief.tier === 'pillar' ? 16384 : 8192,
    temperature: 0.3,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' }, // Prompt caching — 90% pigiau
      },
    ],
    messages: [
      {
        role: 'user',
        content: buildUserPrompt(brief),
      },
    ],
  });

  const json = JSON.parse(response.content[0].text);
  return validateBlogPost(json); // Zod schema
}
```

---

## VALIDACIJA (Zod schema)

```typescript
import { z } from 'zod';

export const BlogPostSchema = z.object({
  post_title: z.string().max(60),
  post_description: z.string().min(140).max(160),
  post_slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/), // kebab-case, no diacritics
  post_category: z.enum(['BDAR', 'NIS2', 'Kibernetinis saugumas', 'DPO', 'Mokymai']),
  post_cat_key: z.enum(['bdar', 'nis2', 'sauga', 'dpo', 'mokymai']),
  post_cat_badge: z.string().max(10),
  post_read_min: z.number().min(3).max(20),
  post_word_count: z.number().min(800).max(4000),
  post_author: z.string(),
  post_author_role: z.string(),
  post_author_initials: z.string().length(2),
  post_keywords_csv: z.string(),
  post_definition: z.string().min(40).max(80), // 40-60 words ≈ 200-400 chars
  post_toc_html: z.string(),
  post_body_html: z.string().min(5000), // ~1500 words minimum
  post_faq_html: z.string(),
  post_faq_schema_json: z.string().refine((s) => {
    try {
      const parsed = JSON.parse(s);
      return parsed['@type'] === 'FAQPage' && parsed.mainEntity?.length === 5;
    } catch {
      return false;
    }
  }, 'FAQ schema must have exactly 5 questions'),
});

export type BlogPost = z.infer<typeof BlogPostSchema>;
```

---

## TEMPLATE INJECTION (placeholder replacement)

```typescript
import fs from 'fs/promises';

async function renderBlogPost(post: BlogPost): Promise<string> {
  let template = await fs.readFile('blog/template.html', 'utf-8');

  const replacements: Record<string, string> = {
    POST_TITLE: post.post_title,
    POST_DESCRIPTION: post.post_description,
    POST_SLUG: post.post_slug,
    POST_CATEGORY: post.post_category,
    POST_CAT_KEY: post.post_cat_key,
    POST_CAT_BADGE: post.post_cat_badge,
    POST_DATE: new Date().toISOString().split('T')[0],
    POST_DATE_HUMAN: formatLithuanianDate(new Date()),
    POST_READ_MIN: String(post.post_read_min),
    POST_WORD_COUNT: String(post.post_word_count),
    POST_AUTHOR: post.post_author,
    POST_AUTHOR_ROLE: post.post_author_role,
    POST_AUTHOR_INITIALS: post.post_author_initials,
    POST_KEYWORDS_CSV: post.post_keywords_csv,
    POST_DEFINITION: post.post_definition,
    POST_TOC_HTML: post.post_toc_html,
    POST_BODY_HTML: post.post_body_html,
    POST_FAQ_HTML: post.post_faq_html,
    POST_FAQ_SCHEMA_JSON: post.post_faq_schema_json,
    RELATED_POSTS_HTML: await getRelatedPostsHtml(post.post_cat_key, post.post_slug, 2),
  };

  for (const [key, value] of Object.entries(replacements)) {
    template = template.replaceAll(`{{${key}}}`, value);
  }

  return template;
}
```

---

## QA AUTO-CHECKS prieš publikavimą

Po Claude API call'o + template injection — paleisti:

```typescript
async function qaCheck(html: string): Promise<QAResult> {
  const checks = {
    title_length: /<title>([^<]{1,60})<\/title>/.test(html),
    meta_desc_length: /<meta name="description" content="([^"]{140,160})"/.test(html),
    h1_present: /<h1[^>]*>[^<]+<\/h1>/.test(html),
    h2_count: (html.match(/<h2[^>]*>/g) || []).length >= 5,
    schema_blogposting: html.includes('"@type": "BlogPosting"'),
    schema_breadcrumb: html.includes('"@type": "BreadcrumbList"'),
    schema_faq: html.includes('"@type": "FAQPage"'),
    callout_present: /class="callout"/.test(html),
    stat_hl_present: /class="stat-hl"/.test(html),
    cta_inline_present: /class="cta-inline"/.test(html),
    internal_links: (html.match(/href="\/(?!\/)/g) || []).length >= 2,
    no_bullshit: !/(mūsų patyrę specialistai|efektyvūs sprendimai|aukščiausio lygio)/.test(html),
  };

  const failed = Object.entries(checks).filter(([_, v]) => !v).map(([k]) => k);
  return { passed: failed.length === 0, failed };
}
```

Jei `failed.length > 0` — NEPUBLIKUOTI, grąžinti į `/blog/drafts/` su QA report'u.

---

## SUSIJĘ FAILAI

- `docs/blog-content-rules.md` — žmogui skaitomos taisyklės (su pavyzdžiais)
- `docs/blog-keywords.md` — keyword bank
- `blog/template.html` — HTML template'as su `{{placeholder}}`
- `api/internal/blog-gen.ts` — pipeline (TODO: dar nesukurta)
- `api/internal/blog-publish.ts` — publikavimo flow (TODO: dar nesukurta)
