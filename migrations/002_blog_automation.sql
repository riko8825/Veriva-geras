-- migrations/002_blog_automation.sql
-- Blog automation pipeline tables
-- Prefix: veriva_ (shared Empirra Supabase project — namespace isolation)
--
-- Tables:
--   veriva_telegram_revise_state — Telegram /revise multi-turn state (chat_id → branch + slug + keyword)
--   veriva_blog_runs            — log of blog-gen runs (success/fail, timing, cost)

-- ───────────────────────────────────────────────────────────
-- 1. Telegram /revise state
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS veriva_telegram_revise_state (
  chat_id    TEXT PRIMARY KEY,
  branch     TEXT NOT NULL,
  slug       TEXT NOT NULL,
  keyword    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS veriva_telegram_revise_state_created_idx
  ON veriva_telegram_revise_state(created_at);

ALTER TABLE veriva_telegram_revise_state ENABLE ROW LEVEL SECURITY;

-- Service role only (server-side via SUPABASE_SERVICE_ROLE_KEY)
DROP POLICY IF EXISTS "veriva_telegram_revise_state_service_role" ON veriva_telegram_revise_state;
CREATE POLICY "veriva_telegram_revise_state_service_role" ON veriva_telegram_revise_state
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ───────────────────────────────────────────────────────────
-- 2. Blog run log
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS veriva_blog_runs (
  id              BIGSERIAL PRIMARY KEY,
  keyword         TEXT NOT NULL,
  slug            TEXT,
  branch          TEXT,
  status          TEXT NOT NULL,  -- 'generated' | 'published' | 'skipped' | 'failed'
  error_message   TEXT,
  duration_ms     INTEGER,
  word_count      INTEGER,
  author_key      TEXT,           -- 'marina' | 'justinas' | 'veriva'
  post_type       TEXT,           -- 'pillar' | 'cluster' | 'standalone'
  pillar          TEXT,
  trigger_source  TEXT,           -- 'cron' | 'manual'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS veriva_blog_runs_status_idx ON veriva_blog_runs(status);
CREATE INDEX IF NOT EXISTS veriva_blog_runs_created_idx ON veriva_blog_runs(created_at);
CREATE INDEX IF NOT EXISTS veriva_blog_runs_slug_idx ON veriva_blog_runs(slug);

ALTER TABLE veriva_blog_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "veriva_blog_runs_service_role" ON veriva_blog_runs;
CREATE POLICY "veriva_blog_runs_service_role" ON veriva_blog_runs
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ───────────────────────────────────────────────────────────
-- 3. Cleanup helper (run manually or via pg_cron)
-- ───────────────────────────────────────────────────────────
-- Delete revise state older than 7 days (stale callback state)
-- DELETE FROM veriva_telegram_revise_state WHERE created_at < NOW() - INTERVAL '7 days';

-- Delete blog_runs older than 6 months (keep for analytics)
-- DELETE FROM veriva_blog_runs WHERE created_at < NOW() - INTERVAL '6 months';

-- ───────────────────────────────────────────────────────────
-- Grants: service_role already has full access via Supabase default.
-- anon/authenticated have NO access (no public policy created).
-- ───────────────────────────────────────────────────────────

COMMENT ON TABLE veriva_telegram_revise_state IS 'Veriva: Telegram /revise multi-turn state per chat';
COMMENT ON TABLE veriva_blog_runs IS 'Veriva: blog-gen automation run log (analytics + cost tracking)';
