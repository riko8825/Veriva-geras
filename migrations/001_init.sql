-- Veriva — initial schema
-- Run: Supabase Dashboard → SQL Editor → New query

-- ─── leads (kontakto formos) ───
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  email       text not null,
  phone       text,
  company     text,
  message     text,
  service     text,                -- "bdar" | "dpo" | "it-auditas" | "kita"
  source      text,                -- "kontaktai" | "kainos" | "blog" ...
  ip_hash     text,                -- SHA256(ip + salt) — GDPR compliant
  user_agent  text,
  status      text not null default 'new',  -- "new" | "contacted" | "qualified" | "lost" | "won"
  notes       text
);

create index if not exists idx_leads_created_at on public.leads(created_at desc);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_email on public.leads(email);

-- ─── audit_requests (BDAR audito užklausos) ───
create table if not exists public.audit_requests (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  company_name    text not null,
  contact_name    text not null,
  email           text not null,
  phone           text,
  company_size    text,            -- "1-10" | "11-50" | "51-200" | "200+"
  industry        text,
  current_state   text,            -- "no-bdar" | "partial" | "full" | "not-sure"
  audit_type      text not null,   -- "bdar" | "nis2" | "iso27001" | "dora"
  urgency         text,            -- "asap" | "1-3-mo" | "planning"
  notes           text,
  ip_hash         text,
  user_agent      text,
  status          text not null default 'new'
);

create index if not exists idx_audit_requests_created_at on public.audit_requests(created_at desc);
create index if not exists idx_audit_requests_status on public.audit_requests(status);

-- ─── newsletter_subscribers ───
create table if not exists public.newsletter_subscribers (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  email           text not null unique,
  source          text,
  confirmed       boolean not null default false,
  confirmed_at    timestamptz,
  unsubscribed_at timestamptz
);

create index if not exists idx_newsletter_email on public.newsletter_subscribers(email);

-- ─── RLS politikos ───
-- Visoms lentelėms RLS ON, tik service_role gali rašyti/skaityti
-- (Edge Functions naudoja service_role key)

alter table public.leads enable row level security;
alter table public.audit_requests enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- Default deny: anon ir authenticated rolės be politikų — neturi prieigos
-- service_role apeina RLS pagal nutylėjimą
