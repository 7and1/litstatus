create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid not null,
  email text,
  is_pro boolean default false,
  daily_usage_count int default 0,
  last_reset_time timestamp with time zone default now(),
  primary key (id)
);

-- Indexes for performance optimization
create index if not exists profiles_is_pro_idx on public.profiles(is_pro);
create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists profiles_last_reset_idx on public.profiles(last_reset_time);

create table if not exists public.pro_wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text not null,
  note text,
  lang text default 'en',
  variant text,
  created_at timestamp with time zone default now()
);

-- Indexes for performance optimization
create index if not exists pro_wishlist_user_id_idx on public.pro_wishlist(user_id);
create index if not exists pro_wishlist_email_idx on public.pro_wishlist(email);
create index if not exists pro_wishlist_lang_idx on public.pro_wishlist(lang);
create index if not exists pro_wishlist_created_at_idx on public.pro_wishlist(created_at);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  rating int not null,
  mode text,
  caption text,
  hashtags text,
  detected_object text,
  lang text default 'en',
  variant text,
  created_at timestamp with time zone default now()
);

-- Indexes for performance optimization
create index if not exists feedback_user_id_idx on public.feedback(user_id);
create index if not exists feedback_created_at_idx on public.feedback(created_at);
create index if not exists feedback_rating_idx on public.feedback(rating);
create index if not exists feedback_lang_idx on public.feedback(lang);

create table if not exists public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  session_id text,
  event text not null,
  source text,
  medium text,
  campaign text,
  content text,
  term text,
  referrer text,
  path text,
  landing_path text,
  lang text default 'en',
  variant text,
  mode text,
  has_image boolean default false,
  created_at timestamp with time zone default now()
);

-- Indexes for performance optimization
create index if not exists funnel_events_user_id_idx on public.funnel_events(user_id);
create index if not exists funnel_events_session_id_idx on public.funnel_events(session_id);
create index if not exists funnel_events_event_idx on public.funnel_events(event);
create index if not exists funnel_events_created_at_idx on public.funnel_events(created_at);
create index if not exists funnel_events_lang_idx on public.funnel_events(lang);
create index if not exists funnel_events_source_idx on public.funnel_events(source);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  severity text default 'info',
  user_id uuid,
  ip text,
  path text,
  user_agent text,
  meta jsonb,
  created_at timestamp with time zone default now()
);

-- Indexes for performance optimization
create index if not exists security_events_event_type_idx on public.security_events(event_type);
create index if not exists security_events_severity_idx on public.security_events(severity);
create index if not exists security_events_user_id_idx on public.security_events(user_id);
create index if not exists security_events_ip_idx on public.security_events(ip);
create index if not exists security_events_created_at_idx on public.security_events(created_at);

-- safe alters for existing deployments
alter table public.pro_wishlist add column if not exists lang text default 'en';
alter table public.pro_wishlist add column if not exists variant text;
alter table public.feedback add column if not exists variant text;
alter table public.funnel_events add column if not exists source text;
alter table public.funnel_events add column if not exists medium text;
alter table public.funnel_events add column if not exists campaign text;
alter table public.funnel_events add column if not exists content text;
alter table public.funnel_events add column if not exists term text;
alter table public.funnel_events add column if not exists referrer text;
alter table public.funnel_events add column if not exists path text;
alter table public.funnel_events add column if not exists landing_path text;
alter table public.funnel_events add column if not exists lang text default 'en';
alter table public.funnel_events add column if not exists variant text;
alter table public.funnel_events add column if not exists mode text;
alter table public.funnel_events add column if not exists has_image boolean default false;
alter table public.security_events add column if not exists event_type text;
alter table public.security_events add column if not exists severity text;
alter table public.security_events add column if not exists user_id uuid;
alter table public.security_events add column if not exists ip text;
alter table public.security_events add column if not exists path text;
alter table public.security_events add column if not exists user_agent text;
alter table public.security_events add column if not exists meta jsonb;
