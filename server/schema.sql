-- Postgres schema (optional, for STORE=PG)

create table if not exists trends (
  id text primary key,
  term text not null,
  region text not null,
  category text not null,
  momentum int not null,
  velocity text not null,
  sources jsonb not null,
  summary text,
  ai jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists reports (
  slug text primary key,
  title text not null,
  body_md text not null,
  published_at timestamptz default now()
);

create table if not exists alert_rules (
  id text primary key,
  user_id text not null,
  keyword text,
  category text not null,
  region text not null,
  min_momentum int not null default 0,
  channels jsonb not null,
  created_at timestamptz default now()
);

create table if not exists users (
  id text primary key,
  email text,
  plan text not null default 'free',
  created_at timestamptz default now()
);
