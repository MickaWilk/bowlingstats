-- Table sessions
create table if not exists sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  scores      integer[] not null,
  location    text,
  created_at  timestamptz default now()
);

-- Row Level Security : chaque user ne voit que ses données
alter table sessions enable row level security;

create policy "sessions_select" on sessions for select using (auth.uid() = user_id);
create policy "sessions_insert" on sessions for insert with check (auth.uid() = user_id);
create policy "sessions_update" on sessions for update using (auth.uid() = user_id);
create policy "sessions_delete" on sessions for delete using (auth.uid() = user_id);

-- Index pour les requêtes triées par date
create index if not exists sessions_user_date on sessions(user_id, date);
