-- Veriva — BDAR audito klausimyno atsakymai + įvertinimas
-- Run: Supabase Dashboard → SQL Editor → New query
-- Priklauso nuo 001_init.sql (leads lentelė)

-- ─── bdar_audit_responses ───
create table if not exists public.bdar_audit_responses (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),

  -- Lead identity (iš Q1, Q2)
  org_name        text not null,
  contact_raw     text not null,        -- pilnas Q2 tekstas
  email           text not null,        -- ištrauktas iš Q2
  consent         boolean not null default false,
  consent_version text,                 -- sutikimo teksto versija (data), pvz. "2026-06-07"

  -- Atsakymai (pilnas JSON: { questionId: value|[values] })
  answers         jsonb not null,
  comments        jsonb,                -- komentaro laukų reikšmės

  -- Scoring rezultatai (iš lib/bdar-scoring.ts)
  compliance_pct  smallint,             -- 0–100
  risk_level      text,                 -- "low" | "medium" | "high" | "critical"
  earned_points   smallint,
  max_points      smallint,
  gaps            jsonb,                -- spragų masyvas
  risk_flags      jsonb,               -- rizikos žymeklių masyvas
  section_scores  jsonb,

  -- AI išvada
  ai_conclusion   text,                 -- HTML/tekstas išsiųstas klientui
  ai_model        text,                 -- pvz. "gpt-4.1"

  -- Meta
  duration_ms     integer,              -- kiek užtruko pildymas
  ip_hash         text,                 -- SHA256(ip + salt)
  user_agent      text,
  source          text default 'bdar-auditas',
  status          text not null default 'new'  -- "new" | "contacted" | "qualified" | "lost" | "won"
);

create index if not exists idx_bdar_audit_created_at on public.bdar_audit_responses(created_at desc);
create index if not exists idx_bdar_audit_email on public.bdar_audit_responses(email);
create index if not exists idx_bdar_audit_risk on public.bdar_audit_responses(risk_level);
create index if not exists idx_bdar_audit_status on public.bdar_audit_responses(status);

-- ─── RLS ───
-- SĄMONINGA: jokių policy. RLS ON + 0 policy = anon/authenticated VISIŠKAI blokuoti.
-- service_role (Node Functions naudoja SUPABASE_SERVICE_ROLE_KEY) apeina RLS pagal nutylėjimą.
-- Tai service_role-only lentelė: jokia naršyklės/anon prieiga negalima.
-- Jei ateityje reikės skaityti iš frontend — pridėti EXPLICIT select policy (NE anon write).
alter table public.bdar_audit_responses enable row level security;
