-- Rode DEPOIS do 0001, no SQL Editor do Supabase. Adapta o banco para a Cakto.

alter table public.assinaturas add column if not exists valid_until timestamptz;
alter table public.assinaturas add column if not exists cakto_subscription_id text;
alter table public.assinaturas add column if not exists email_cakto text;
alter table public.assinaturas drop column if exists mp_preapproval_id;

create index if not exists assinaturas_cakto_sub_idx on public.assinaturas (cakto_subscription_id);
create index if not exists assinaturas_email_cakto_idx on public.assinaturas (email_cakto);

-- Cada clique em "Assinar" gera um token opaco, que vai no link da Cakto (?callback=...)
-- e volta no webhook. É assim que o app sabe qual aluno pagou.
create table if not exists public.checkouts (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  criado_em timestamptz not null default now()
);

create index if not exists checkouts_email_idx on public.checkouts (email, criado_em desc);
create index if not exists checkouts_user_idx on public.checkouts (user_id, criado_em desc);

alter table public.checkouts enable row level security;
-- Sem policies: só o servidor (service role) acessa.
