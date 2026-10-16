-- Rode este arquivo no SQL Editor do seu projeto Supabase.

create table if not exists public.assinaturas (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'pending',        -- status do Mercado Pago: pending | authorized | paused | cancelled
  mp_preapproval_id text,
  atualizado_em timestamptz not null default now()
);

alter table public.assinaturas enable row level security;

drop policy if exists "ler propria assinatura" on public.assinaturas;
create policy "ler propria assinatura" on public.assinaturas
  for select to authenticated using (auth.uid() = user_id);
-- Sem policy de escrita: só o servidor (service role) grava.

create table if not exists public.correcoes (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);

create index if not exists correcoes_user_data_idx on public.correcoes (user_id, criado_em desc);

alter table public.correcoes enable row level security;
-- Sem policies: acesso apenas pelo servidor (service role).
