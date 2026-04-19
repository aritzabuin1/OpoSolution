-- PlanSEO F6.T2 — Ritual manual semanal de citas LLM
-- PlanSEO F6.T4 — Monitor de Google algorithm updates
-- Creado: 2026-04-19

create table if not exists llm_citations (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  platform text not null check (platform in ('chatgpt', 'perplexity', 'claude', 'google_ai_overview', 'bing_copilot', 'web_search')),
  cited boolean not null default false,
  position integer,
  source_url text,
  snippet text,
  checked_at timestamptz not null default now(),
  notes text
);

create index if not exists idx_llm_citations_checked_at on llm_citations (checked_at desc);
create index if not exists idx_llm_citations_query on llm_citations (query);
create index if not exists idx_llm_citations_cited on llm_citations (cited) where cited = true;

alter table llm_citations enable row level security;

-- Solo admins leen/escriben (no expuesto a usuarios finales)
create policy "llm_citations_admin_all" on llm_citations
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- Eventos SEO detectados por el monitor de algo updates (F6.T4)
create table if not exists seo_algo_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  title text not null,
  url text,
  published_at timestamptz,
  keywords_matched text[] not null default '{}',
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  detected_at timestamptz not null default now(),
  notified boolean not null default false
);

create unique index if not exists idx_seo_algo_events_url on seo_algo_events (url) where url is not null;
create index if not exists idx_seo_algo_events_detected_at on seo_algo_events (detected_at desc);

alter table seo_algo_events enable row level security;

create policy "seo_algo_events_admin_all" on seo_algo_events
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

comment on table llm_citations is 'PlanSEO F6.T2 — tracking manual semanal de citas LLM en queries branded/non-branded';
comment on table seo_algo_events is 'PlanSEO F6.T4 — eventos de algorithm updates detectados en feeds RSS de Search Engine Roundtable y similares';
