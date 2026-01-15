create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid not null,
  email text,
  is_pro boolean default false,
  daily_usage_count int default 0,
  last_reset_time timestamp with time zone default now(),
  primary key (id)
);

create table if not exists public.pro_wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text not null,
  note text,
  lang text default 'en',
  variant text,
  created_at timestamp with time zone default now()
);

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

-- safe alters for existing deployments
alter table public.pro_wishlist add column if not exists lang text default 'en';
alter table public.pro_wishlist add column if not exists variant text;
alter table public.feedback add column if not exists variant text;
