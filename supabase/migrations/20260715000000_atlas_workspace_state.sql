create table if not exists public.atlas_workspace_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.atlas_workspace_state enable row level security;

drop policy if exists "Users can read their own Atlas state" on public.atlas_workspace_state;
create policy "Users can read their own Atlas state"
  on public.atlas_workspace_state
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own Atlas state" on public.atlas_workspace_state;
create policy "Users can insert their own Atlas state"
  on public.atlas_workspace_state
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own Atlas state" on public.atlas_workspace_state;
create policy "Users can update their own Atlas state"
  on public.atlas_workspace_state
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own Atlas state" on public.atlas_workspace_state;
create policy "Users can delete their own Atlas state"
  on public.atlas_workspace_state
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
