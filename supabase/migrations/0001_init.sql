-- Jornada da Palavra — schema inicial
-- Toda pontuação, progresso e presença é calculada no servidor.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- roles
create table if not exists public.roles (
  name text primary key
);
insert into public.roles (name) values
  ('USER'),('MODERATOR'),('CONTENT_ADMIN'),('GROUP_ADMIN'),('ADMIN'),('SUPER_ADMIN')
on conflict do nothing;

-- -------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 3 and 120),
  avatar_path text,
  bio text check (char_length(coalesce(bio,'')) <= 500),
  public_profile boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null references public.roles(name),
  granted_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'USER') on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.my_roles()
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(role), array['USER'::text]) from public.user_roles where user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('ADMIN','SUPER_ADMIN')
  );
$$;

-- ----------------------------------------------------------- content
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  statement text not null,
  reference text not null,
  book text,
  chapter integer,
  verse integer,
  difficulty text not null default 'medio' check (difficulty in ('facil','medio','dificil')),
  category_id uuid references public.categories(id),
  explanation text not null,
  translation text not null default 'Referência bíblica',
  status text not null default 'DRAFT' check (status in ('DRAFT','REVIEW','APPROVED','PUBLISHED','ARCHIVED')),
  created_by uuid references public.profiles(id),
  reviewed_by uuid references public.profiles(id),
  published_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  position smallint not null default 0,
  unique (question_id, position)
);

create or replace function public.check_single_correct(p_question uuid)
returns boolean language sql stable as $$
  select count(*) = 1 from public.question_options where question_id = p_question and is_correct;
$$;

create table if not exists public.study_tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'DRAFT' check (status in ('DRAFT','REVIEW','APPROVED','PUBLISHED','ARCHIVED')),
  created_at timestamptz not null default now()
);

create table if not exists public.study_track_items (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.study_tracks(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  position integer not null,
  unique (track_id, question_id)
);

create table if not exists public.daily_word (
  id uuid primary key default gen_random_uuid(),
  day date not null unique,
  reference text not null,
  reflection text not null,
  context text,
  status text not null default 'DRAFT' check (status in ('DRAFT','REVIEW','APPROVED','PUBLISHED','ARCHIVED'))
);

-- ---------------------------------------------------------- study data
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid references public.study_tracks(id),
  total integer not null,
  correct integer not null,
  accuracy integer not null,
  completed_at timestamptz not null default now()
);

create table if not exists public.study_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  option_id uuid not null references public.question_options(id),
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists public.study_days (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);

create table if not exists public.review_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  grade text not null default 'acertou',
  due_at date not null,
  consecutive_misses integer not null default 0,
  correct_streak integer not null default 0,
  reviewed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_id)
);

-- -------------------------------------------------------------- scores
create table if not exists public.user_scores (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  points integer not null default 0 check (points >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.score_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  points integer not null check (points >= 0),
  reference_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, event_type, reference_id)
);

-- ---------------------------------------------------------- community
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  image_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  is_admin boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.cycles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'PLANNED' check (status in ('PLANNED','ACTIVE','CLOSED')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

create table if not exists public.cycle_tracks (
  cycle_id uuid not null references public.cycles(id) on delete cascade,
  track_id uuid not null references public.study_tracks(id) on delete cascade,
  primary key (cycle_id, track_id)
);

create table if not exists public.cycle_participants (
  cycle_id uuid not null references public.cycles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (cycle_id, user_id)
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text,
  criteria jsonb not null default '{}'::jsonb
);

create table if not exists public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- ------------------------------------------------------------- events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  group_id uuid references public.groups(id),
  status text not null default 'PLANNED' check (status in ('PLANNED','OPEN','CLOSED','CANCELLED')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.event_codes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  code text not null unique default encode(gen_random_bytes(9),'hex'),
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.event_participation (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- -------------------------------------------------------------- others
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid references public.profiles(id),
  action text not null,
  target text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  requested_at timestamptz not null default now(),
  status text not null default 'PENDING'
);

-- --------------------------------------------------------------- indexes
create index if not exists idx_questions_status on public.questions(status);
create index if not exists idx_questions_category on public.questions(category_id);
create index if not exists idx_options_question on public.question_options(question_id);
create index if not exists idx_sessions_user on public.study_sessions(user_id, completed_at desc);
create index if not exists idx_answers_user on public.study_answers(user_id);
create index if not exists idx_review_user_due on public.review_items(user_id, due_at);
create index if not exists idx_score_events_user on public.score_events(user_id, created_at desc);
create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);
create index if not exists idx_event_codes_code on public.event_codes(code);
create index if not exists idx_audit_created on public.audit_logs(created_at desc);

-- ------------------------------------------------------------------ RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.study_tracks enable row level security;
alter table public.study_track_items enable row level security;
alter table public.daily_word enable row level security;
alter table public.study_sessions enable row level security;
alter table public.study_answers enable row level security;
alter table public.study_days enable row level security;
alter table public.review_items enable row level security;
alter table public.user_scores enable row level security;
alter table public.score_events enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.cycles enable row level security;
alter table public.cycle_tracks enable row level security;
alter table public.cycle_participants enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.events enable row level security;
alter table public.event_codes enable row level security;
alter table public.event_participation enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_settings enable row level security;
alter table public.deletion_requests enable row level security;

-- profiles
drop policy if exists p_profiles_select on public.profiles;
create policy p_profiles_select on public.profiles for select to authenticated
using (id = auth.uid() or public_profile or public.is_admin());
drop policy if exists p_profiles_update on public.profiles;
create policy p_profiles_update on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- user_roles: leitura própria; escrita somente admin
drop policy if exists p_roles_select on public.user_roles;
create policy p_roles_select on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists p_roles_admin on public.user_roles;
create policy p_roles_admin on public.user_roles for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- conteúdo publicado é legível; admin gerencia
drop policy if exists p_content_read on public.questions;
create policy p_content_read on public.questions for select to authenticated using (status = 'PUBLISHED' or public.is_admin());
drop policy if exists p_content_admin on public.questions;
create policy p_content_admin on public.questions for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_options_read on public.question_options;
create policy p_options_read on public.question_options for select to authenticated using (exists (select 1 from public.questions q where q.id = question_id and (q.status='PUBLISHED' or public.is_admin())));
drop policy if exists p_options_admin on public.question_options;
create policy p_options_admin on public.question_options for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists p_tracks_read on public.study_tracks;
create policy p_tracks_read on public.study_tracks for select to authenticated using (status='PUBLISHED' or public.is_admin());
drop policy if exists p_tracks_admin on public.study_tracks;
create policy p_tracks_admin on public.study_tracks for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_track_items_read on public.study_track_items;
create policy p_track_items_read on public.study_track_items for select to authenticated using (exists (select 1 from public.study_tracks t where t.id=track_id and (t.status='PUBLISHED' or public.is_admin())));
drop policy if exists p_daily_read on public.daily_word;
create policy p_daily_read on public.daily_word for select to authenticated using (status='PUBLISHED' or public.is_admin());
drop policy if exists p_daily_admin on public.daily_word;
create policy p_daily_admin on public.daily_word for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_categories_read on public.categories;
create policy p_categories_read on public.categories for select to authenticated using (true);
drop policy if exists p_categories_admin on public.categories;
create policy p_categories_admin on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- dados privados do estudante
drop policy if exists p_sessions_own on public.study_sessions;
create policy p_sessions_own on public.study_sessions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists p_answers_own on public.study_answers;
create policy p_answers_own on public.study_answers for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists p_days_own on public.study_days;
create policy p_days_own on public.study_days for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists p_review_own on public.review_items;
create policy p_review_own on public.review_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists p_scores_own on public.user_scores;
create policy p_scores_own on public.user_scores for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists p_events_score_own on public.score_events;
create policy p_events_score_own on public.score_events for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists p_achievements_read on public.achievements;
create policy p_achievements_read on public.achievements for select to authenticated using (true);
drop policy if exists p_user_ach_own on public.user_achievements;
create policy p_user_ach_own on public.user_achievements for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- comunidade
drop policy if exists p_groups_read on public.groups;
create policy p_groups_read on public.groups for select to authenticated using (true);
drop policy if exists p_groups_admin on public.groups;
create policy p_groups_admin on public.groups for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_group_members_read on public.group_members;
create policy p_group_members_read on public.group_members for select to authenticated using (user_id = auth.uid() or public.is_admin() or exists (select 1 from public.group_members gm where gm.group_id=group_id and gm.user_id=auth.uid() and gm.is_admin));
drop policy if exists p_cycles_read on public.cycles;
create policy p_cycles_read on public.cycles for select to authenticated using (true);
drop policy if exists p_cycle_tracks_read on public.cycle_tracks;
create policy p_cycle_tracks_read on public.cycle_tracks for select to authenticated using (true);
drop policy if exists p_cycle_part_read on public.cycle_participants;
create policy p_cycle_part_read on public.cycle_participants for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- eventos
drop policy if exists p_events_read on public.events;
create policy p_events_read on public.events for select to authenticated using (true);
drop policy if exists p_events_admin on public.events;
create policy p_events_admin on public.events for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_event_codes_admin on public.event_codes;
create policy p_event_codes_admin on public.event_codes for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_part_own on public.event_participation;
create policy p_part_own on public.event_participation for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- notificações e auditoria
drop policy if exists p_notif_own on public.notifications;
create policy p_notif_own on public.notifications for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists p_reports_admin on public.reports;
create policy p_reports_admin on public.reports for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_audit_admin on public.audit_logs;
create policy p_audit_admin on public.audit_logs for select to authenticated using (public.is_admin());
drop policy if exists p_settings_admin on public.app_settings;
create policy p_settings_admin on public.app_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_deletion_own on public.deletion_requests;
create policy p_deletion_own on public.deletion_requests for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -------------------------------------------------------------- funções
create or replace function public.dashboard_summary(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if p_user_id <> auth.uid() and not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  select jsonb_build_object(
    'studies', (select count(*) from study_sessions where user_id=p_user_id),
    'answers', (select count(*) from study_answers where user_id=p_user_id),
    'accuracy', coalesce((select round(100.0*count(*) filter (where is_correct)/nullif(count(*),0)) from study_answers where user_id=p_user_id),0),
    'streak', (select count(*) from generate_series(0,30) g(d)
               where exists (select 1 from study_days sd where sd.user_id=p_user_id and sd.day=current_date - g.d)),
    'reviews', (select count(*) from review_items where user_id=p_user_id and not reviewed),
    'tracks', 0,
    'points', coalesce((select points from user_scores where user_id=p_user_id),0)
  ) into r;
  return r;
end $$;

create or replace function public.complete_study(p_answers jsonb, p_track_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_item jsonb;
  v_q uuid;
  v_o uuid;
  v_correct boolean;
  v_total int := 0;
  v_hits int := 0;
  v_session uuid;
  v_grade text;
  v_due date;
  v_misses int;
  v_streak int;
begin
  if v_user is null then raise exception 'UNAUTHENTICATED'; end if;
  if jsonb_typeof(p_answers) <> 'array' then raise exception 'INVALID_ANSWERS'; end if;

  insert into study_sessions (user_id, track_id, total, correct, accuracy)
  values (v_user, p_track_id, 0, 0, 0) returning id into v_session;

  for v_item in select * from jsonb_array_elements(p_answers) loop
    v_q := (v_item->>'question_id')::uuid;
    v_o := (v_item->>'option_id')::uuid;
    select o.is_correct into v_correct
      from question_options o join questions q on q.id=o.question_id
      where o.id=v_o and o.question_id=v_q and q.status='PUBLISHED';
    if v_correct is null then raise exception 'INVALID_QUESTION'; end if;

    v_total := v_total + 1;
    if v_correct then v_hits := v_hits + 1; end if;

    insert into study_answers (session_id,user_id,question_id,option_id,is_correct)
    values (v_session,v_user,v_q,v_o,v_correct);

    select coalesce(consecutive_misses,0), coalesce(correct_streak,0)
      into v_misses, v_streak from review_items where user_id=v_user and question_id=v_q;

    if v_correct then
      v_grade := case when v_streak >= 3 then 'dominio_consolidado' when v_streak >= 2 then 'bom_dominio' else 'acertou' end;
      v_due := current_date + (case v_grade when 'acertou' then 7 when 'bom_dominio' then 14 else 30 end);
    else
      v_grade := case when coalesce(v_misses,0) >= 1 then 'errou_novamente' else 'errou' end;
      v_due := current_date + (case v_grade when 'errou' then 1 else 2 end);
    end if;

    insert into review_items (user_id,question_id,grade,due_at,consecutive_misses,correct_streak,updated_at)
    values (v_user,v_q,v_grade,v_due, case when v_correct then 0 else coalesce(v_misses,0)+1 end,
            case when v_correct then coalesce(v_streak,0)+1 else 0 end, now())
    on conflict (user_id,question_id) do update set
      grade=excluded.grade, due_at=excluded.due_at,
      consecutive_misses=excluded.consecutive_misses, correct_streak=excluded.correct_streak,
      reviewed=false, updated_at=now();
  end loop;

  if v_total = 0 then raise exception 'EMPTY_ANSWERS'; end if;

  update study_sessions set total=v_total, correct=v_hits,
    accuracy=round(100.0*v_hits/v_total) where id=v_session;

  insert into study_days (user_id, day) values (v_user, current_date) on conflict do nothing;

  insert into score_events (user_id,event_type,points,reference_id,metadata)
  values (v_user,'correct_answer',10, v_session::text, jsonb_build_object('correct',v_hits))
  on conflict do nothing;

  insert into score_events (user_id,event_type,points,reference_id,metadata)
  values (v_user,'study_completed',20,v_session::text,'{}'::jsonb)
  on conflict do nothing;

  insert into user_scores (user_id,points)
  values (v_user, coalesce((select sum(points) from score_events where user_id=v_user),0))
  on conflict (user_id) do update set points=(select sum(points) from score_events where user_id=v_user), updated_at=now();

  -- marcos
  insert into user_achievements (user_id,achievement_id)
  select v_user, a.id from achievements a
  where (a.code='first_study' and (select count(*) from study_sessions where user_id=v_user)=1)
     or (a.code='ten_studies' and (select count(*) from study_sessions where user_id=v_user)>=10)
  on conflict do nothing;

  insert into audit_logs (actor,action,target,metadata)
  values (v_user,'complete_study',v_session::text,jsonb_build_object('correct',v_hits,'total',v_total));

  return jsonb_build_object('session_id',v_session,'correct',v_hits,'wrong',v_total-v_hits,
    'accuracy',round(100.0*v_hits/v_total),'points',coalesce((select points from user_scores where user_id=v_user),0));
end $$;

create or replace function public.register_event(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_event uuid; v_code uuid;
begin
  if v_user is null then raise exception 'UNAUTHENTICATED'; end if;
  select id,event_id into v_code,v_event from event_codes
   where code=p_code and active and (expires_at is null or expires_at > now());
  if v_event is null then raise exception 'INVALID_CODE'; end if;
  if not exists (select 1 from events where id=v_event and status in ('OPEN','PLANNED')) then raise exception 'EVENT_CLOSED'; end if;
  insert into event_participation (event_id,user_id) values (v_event,v_user) on conflict do nothing;
  insert into audit_logs (actor,action,target) values (v_user,'event_checkin',v_event::text);
  return jsonb_build_object('event_id',v_event,'ok',true);
end $$;

create or replace function public.approve_content(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  update questions set status='APPROVED', reviewed_by=auth.uid(), updated_at=now() where id=p_id and status in ('DRAFT','REVIEW');
  insert into audit_logs (actor,action,target) values (auth.uid(),'approve_content',p_id::text);
end $$;

create or replace function public.publish_content(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if not public.check_single_correct(p_id) then raise exception 'INVALID_OPTIONS'; end if;
  update questions set status='PUBLISHED', published_by=auth.uid(), updated_at=now() where id=p_id and status='APPROVED';
  insert into audit_logs (actor,action,target) values (auth.uid(),'publish_content',p_id::text);
end $$;

create or replace function public.admin_stats()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.is_admin() then jsonb_build_object(
    'users',(select count(*) from profiles),
    'active_users',(select count(*) from study_days where day >= current_date - interval '30 days'),
    'studies',(select count(*) from study_sessions),
    'answers',(select count(*) from study_answers),
    'accuracy',coalesce((select round(100.0*count(*) filter (where is_correct)/nullif(count(*),0)) from study_answers),0),
    'pending_content',(select count(*) from questions where status in ('DRAFT','REVIEW')),
    'groups',(select count(*) from groups),
    'events',(select count(*) from events)
  ) else '{}'::jsonb end;
$$;

create or replace function public.request_account_deletion()
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into deletion_requests (user_id) values (auth.uid())
  on conflict (user_id) do update set requested_at=now(), status='PENDING';
  insert into audit_logs (actor,action) values (auth.uid(),'request_account_deletion');
end $$;

-- Storage buckets (políticas criadas no painel/seed; mime e tamanho validados no cliente e no servidor)
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values
  ('avatars','avatars',false,2097152,array['image/jpeg','image/png','image/webp']),
  ('question-media','question-media',false,5242880,array['image/jpeg','image/png','image/webp']),
  ('event-media','event-media',false,5242880,array['image/jpeg','image/png','image/webp']),
  ('group-media','group-media',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- -------------------------------------------------------- storage policies
drop policy if exists s_avatars_read on storage.objects;
create policy s_avatars_read on storage.objects for select to authenticated
using (bucket_id='avatars');
drop policy if exists s_avatars_insert on storage.objects;
create policy s_avatars_insert on storage.objects for insert to authenticated
with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists s_avatars_update on storage.objects;
create policy s_avatars_update on storage.objects for update to authenticated
using (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text)
with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists s_avatars_delete on storage.objects;
create policy s_avatars_delete on storage.objects for delete to authenticated
using (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists s_media_read on storage.objects;
create policy s_media_read on storage.objects for select to authenticated
using (bucket_id in ('question-media','event-media','group-media') and public.is_admin());
drop policy if exists s_media_write on storage.objects;
create policy s_media_write on storage.objects for all to authenticated
using (bucket_id in ('question-media','event-media','group-media') and public.is_admin())
with check (bucket_id in ('question-media','event-media','group-media') and public.is_admin());
