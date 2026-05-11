# Blog Automation — Deploy Guide

Veriva blog automation pipeline: cron → blog-gen → Telegram approve → blog-approve → merge → live.

**Stack**: Vercel Edge cron + Node serverless functions · OpenAI gpt-4.1 · Pexels · GitHub API · Telegram Bot · Supabase (shared Empirra DB).

---

## Architecture

```
Vercel Cron (antradienis + ketvirtadienis 08:00 UTC = 10:00 LT)
  ↓
POST /api/automations/blog-gen (Authorization: Bearer CRON_SECRET)
  ↓
  1. fetchTopics() from GitHub topics.json
  2. getNextTopic() — picks first { status: "pending" }
  3. expandKeywords() — gpt-4.1, JSON output (primary/secondary/longTail/lsi)
  4. generateBlogJSON() — gpt-4.1, 24-field JSON (matches blog/template.html placeholders)
  5. validatePost() — 10 quality checks (LT, structure, banned phrases, FAQ count, sources)
  6. getImage() — Pexels (LT keyword → EN query translation)
  7. renderTemplate() — inject JSON fields into blog/template.html
  8. createDraftBranch + commitFileToBranch
  9. sendTelegramDraftNotification — Publikuoti / Taisyti / Praleisti buttons
  ↓
Telegram callback → POST /api/automations/telegram-webhook
  ↓
  - Publikuoti → POST /api/automations/blog-approve (x-api-key BLOG_APPROVE_SECRET)
  - Taisyti    → wait for text reply → delete branch + topic.status=pending
  - Praleisti  → delete branch + topic.status=skipped
  ↓
blog-approve (action=POST):
  1. addBlogCardToGrid — extracts meta + inserts .bc card into blog.html .bp-grid
  2. linkInternal — forward (new post) + reverse (old posts) internal links
  3. updateSitemap — regenerate sitemap.xml
  4. topics.status = published (commit to branch)
  5. mergeBranchToMain (triggers Vercel deploy)
  6. deleteBranch
  7. Telegram confirmation
```

---

## Environment Variables (Vercel project)

| Variable | Source | Notes |
|---|---|---|
| `OPENAI_API_KEY` | platform.openai.com | Shared with Empirra (~$4-5 per 100 posts) |
| `PEXELS_API_KEY` | pexels.com/api | Shared with Empirra |
| `GITHUB_TOKEN` | github.com/settings/tokens | Classic, `repo` scope, must access `riko8825/Veriva-geras` |
| `TELEGRAM_BOT_TOKEN` | @BotFather → /newbot | **Veriva-specific** — sukurti naują `@VerivaBlogBot` |
| `TELEGRAM_CHAT_ID` | @RawDataBot or `getUpdates` | Your personal Telegram chat ID |
| `TELEGRAM_WEBHOOK_SECRET` | `openssl rand -hex 32` | New value, NOT shared with Empirra |
| `BLOG_TRIGGER_SECRET` | `openssl rand -hex 32` | Manual trigger auth |
| `BLOG_APPROVE_SECRET` | `openssl rand -hex 32` | Server-to-server auth (telegram-webhook → blog-approve) |
| `CRON_SECRET` | `openssl rand -hex 32` | Vercel cron auth (auto-injected, but used by handler) |
| `SUPABASE_URL` | Empirra Supabase project | Shared — Veriva uses `veriva_*` prefixed tables |
| `SUPABASE_SERVICE_ROLE_KEY` | Empirra Supabase project | Shared |

---

## Step 1: Telegram bot setup

```bash
# 1. Telegram → @BotFather → /newbot
#    Name:     Veriva Blog Bot
#    Username: VerivaBlogBot
# → save TELEGRAM_BOT_TOKEN

# 2. Start chat:
#    Open chat with @VerivaBlogBot → /start

# 3. Get chat ID:
curl https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates
# → find "chat":{"id": NUMBER}  ← TELEGRAM_CHAT_ID

# 4. Generate webhook secret:
openssl rand -hex 32
# → save TELEGRAM_WEBHOOK_SECRET
```

## Step 2: Supabase migration

```bash
# Connect to Empirra Supabase (psql or Supabase SQL Editor)
# Run:
cat migrations/002_blog_automation.sql

# Creates: veriva_telegram_revise_state, veriva_blog_runs
# RLS enabled, service_role only access
```

## Step 3: Generate secrets

```bash
# 3 endpoint secrets
openssl rand -hex 32  # BLOG_TRIGGER_SECRET
openssl rand -hex 32  # BLOG_APPROVE_SECRET
openssl rand -hex 32  # CRON_SECRET
```

## Step 4: Add env vars to Vercel

```bash
vercel env add OPENAI_API_KEY production
# (paste value, repeat for all vars above)

# Or via Vercel UI:
# vercel.com → veriva project → Settings → Environment Variables → Add
```

## Step 5: Deploy

```bash
git add .
git commit -m "feat: blog automation pipeline (blog-gen + telegram-webhook + blog-approve)"
git push origin main

# Verify deploy:
vercel ls
# → look for blog-gen, blog-approve, telegram-webhook in Functions list
```

## Step 6: Setup Telegram webhook

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"https://veriva.lt/api/automations/telegram-webhook\",
    \"secret_token\": \"<TELEGRAM_WEBHOOK_SECRET>\",
    \"allowed_updates\": [\"message\", \"callback_query\"]
  }"

# Verify:
curl https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo
# → url should match, pending_update_count: 0
```

## Step 7: Smoke test

```bash
# Manual trigger (bypass cron + force flag)
curl -X POST "https://veriva.lt/api/automations/blog-gen" \
  -H "x-api-key: <BLOG_TRIGGER_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"force":true}'

# Expected response (success):
# {
#   "success": true,
#   "slug": "bdar-auditas-imonems-2026",
#   "branch": "draft-blog-bdar-auditas-imonems-2026",
#   "keyword": "BDAR auditas įmonėms 2026",
#   "word_count": 1850,
#   "telegram": true,
#   "duration_ms": 45123
# }

# Check Telegram — you should receive:
# - Photo (Pexels hero image)
# - Message with H1 + H2 plan + 3 buttons (Publikuoti / Taisyti / Praleisti)

# Test SKIP button:
# Click "⏭ Praleisti" → branch deleted, topic marked skipped, Telegram confirmation.

# Test POST button (different topic):
# Click "✅ Publikuoti" → blog-approve runs:
#   - blog.html card added
#   - sitemap.xml regenerated
#   - branch merged to main
#   - Vercel deploy triggered
#   - https://veriva.lt/blog/<slug>.html live in ~30s
```

---

## Cron schedule

`vercel.json`:
```json
"crons": [
  { "path": "/api/automations/blog-gen", "schedule": "0 8 * * 2,4" }
]
```

**Cron**: `0 8 * * 2,4` = antradienis + ketvirtadienis 08:00 UTC = 10:00 LT vasarą / 11:00 LT žiemą.

Adjust in `vercel.json` if needed:
- `0 8 * * 2` — once weekly (Tuesday only)
- `0 8 * * *` — daily

---

## Troubleshooting

### "Unauthorized" on blog-gen manual trigger

```bash
# Check x-api-key matches BLOG_TRIGGER_SECRET in Vercel env vars
vercel env ls | grep BLOG_TRIGGER_SECRET
```

### Telegram callback fails ("Unauthorized webhook call")

```bash
# Verify webhook secret matches:
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
# → check `url` field, NOT secret_token (Telegram doesn't return it)

# Re-set webhook if needed:
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://veriva.lt/api/automations/telegram-webhook" \
  -d "secret_token=<NEW_SECRET>"
# Then update TELEGRAM_WEBHOOK_SECRET in Vercel env
```

### AI generation timeout (>75s)

Vercel maxDuration: 90s. Budget: 75s AI + ~15s GitHub commits.

If timeouts persist:
1. Reduce `maxTokens` in `lib/claude.ts` (default 1024 → try 800 for keyword expansion)
2. Switch from `gpt-4.1` to `gpt-4o-mini` (cheaper, faster, slight quality drop)
3. Move to Anthropic Claude Sonnet 4.6 with prompt caching (90% cheaper on cached tokens)

### Validation failures ("BANNED LT phrases" etc.)

System prompt + validators in `api/automations/blog-gen/route.ts` enforce quality. If retry fails 2x:
- Check `lib/blog-prompts.ts` system prompt strictness
- Inspect failed JSON output in Vercel logs: `vercel logs --since 1h | grep blog-gen`

### Internal linking: 0 forward links

Most common cause: `link-constraints.ts` skip ranges too aggressive. Debug:
```bash
# Check anchor density in template.html — body must have ≥600 chars before first KW match
grep -c "callout\|cta-inline\|stat-hl\|faq-" blog/template.html
```

---

## Cost estimate (per post)

| Component | Cost | Notes |
|---|---|---|
| OpenAI gpt-4.1 — keyword expansion | $0.001 | ~400 tokens |
| OpenAI gpt-4.1 — article gen | $0.05–0.08 | ~4500 tokens output, ~2000 input |
| Pexels image | $0 | Free tier (200 req/h) |
| GitHub API | $0 | Free tier (5000 req/h) |
| Telegram | $0 | Free |
| Vercel function | $0 | Hobby tier (90s × 1/day × 4/mo = 6 min/mo, well within free tier) |
| Vercel deploy | $0 | Hobby tier |
| Supabase | $0 | Shared with Empirra |
| **Total per post** | **~$0.05–0.08** | |
| **8 posts/month** (2/week) | **~$0.40–0.64/mo** | |

---

## Operational notes

- **Topics queue**: `topics.json` has 15 pending topics → 2 months at 2/week pace. Refill when count <5.
- **Author rotation**: Marina (BDAR/DPO) + Justinas (NIS2/IT/Mokymai) + Veriva komanda (fallback) — set per topic via `author_key` field.
- **Quality bar**: 5-phase blog publish workflow (see PROJECT_STATUS.md). Automation handles phase 1-3; manual review (audit + polish) recommended for first 5 generated posts to calibrate prompt.
- **Rollback**: If a published post breaks production, `git revert <merge-sha>` on main + `vercel --prod` to redeploy clean state.
