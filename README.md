# Veriva — Duomenų apsauga ir kibernetinis saugumas

Veriva svetainės source kodas. BDAR atitiktis + IT saugumas vienoje komandoje.

🌐 **Live**: [veriva.lt](https://veriva.lt)

---

## Stack

- **Frontend**: HTML/CSS/JS (multi-page, mobile-first)
- **Backend**: Vercel Edge Functions (TypeScript)
- **DB**: Supabase (Postgres + RLS)
- **Email**: Resend
- **Hosting**: Vercel

## Lokalus development

```bash
# 1. Įdiegti dependencies
npm install

# 2. Sukurti .env.local pagal .env.example
cp .env.example .env.local
# ... užpildyti reikšmes

# 3. Paleisti dev server
npm run dev
```

Atsidaro `http://localhost:3000`.

## Folder struktūra

```
├── *.html                # Puslapiai
├── assets/               # CSS, JS, paveikslėliai
├── api/                  # Vercel Edge Functions (backend)
├── lib/                  # Reusable wrapperiai (Supabase, Resend, auth)
├── docs/                 # Projekto dokumentacija
└── migrations/           # Supabase SQL migrations
```

## Deploy

```bash
npm run deploy
```

Production deploy'us — TIK po PR review.

## Dokumentacija

- [`CLAUDE.md`](./CLAUDE.md) — pagrindinis projekto autoritetas
- [`docs/structure.md`](./docs/structure.md) — puslapių struktūra
- [`docs/brand-guidelines.md`](./docs/brand-guidelines.md) — brand spalvos, fontai, tonas
- [`docs/seo-strategy.md`](./docs/seo-strategy.md) — SEO strategija
- [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) — dabartinis statusas
- [`DECISION_LOG.md`](./DECISION_LOG.md) — architektūriniai sprendimai

## Licencija

Visos teisės saugomos © Veriva UAB.
