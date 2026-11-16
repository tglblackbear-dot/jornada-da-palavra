-- Funcionalidades complementares: notificações, comunidade, admin, relatórios, LGPD.

alter table public.profiles add column if not exists blocked boolean not null default false;

create or replace function public.is_blocked()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select blocked from public.profiles where id = auth.uid()), false);
$$;

-- ------------------------------------------------------------- highlights
create or replace view public.community_highlights with (security_invoker = true) as
select p.id as user_id,
       p.display_name,
       (select count(*) from public.study_sessions s where s.user_id = p.id) as studies,
       coalesce((select points from public.user_scores u where u.user_id = p.id), 0) as points,
       (select count(*) from public.study_days d where d.user_id = p.id and d.day >= current_date - interval '7 days') as active_days
from public.profiles p
where p.public_profile and not p.blocked
order by studies desc, active_days desc
limit 10;
grant select on public.community_highlights to authenticated;

-- ---------------------------------------------------------- notifications
create or replace function public.notify_user(p_user uuid, p_kind text, p_title text, p_body text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, kind, title, body)
  values (p_user, p_kind, p_title, p_body);
end $$;

create or replace function public.my_notifications()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', n.id, 'kind', n.kind, 'title', n.title, 'body', n.body,
      'read', n.read_at is not null, 'created_at', n.created_at
    ) order by n.created_at desc)
    from public.notifications n where n.user_id = auth.uid()
  ), '[]'::jsonb);
end $$;

create or replace function public.mark_notification_read(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.notifications set read_at = now()
  where id = p_id and user_id = auth.uid();
end $$;

create or replace function public.mark_all_notifications_read()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.notifications set read_at = now()
  where user_id = auth.uid() and read_at is null;
end $$;

create or replace function public.notify_achievement()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, kind, title, body)
  select new.user_id, 'achievement', 'Marco da Jornada', 'Você conquistou: ' || a.title
  from public.achievements a where a.id = new.achievement_id;
  return new;
end $$;
drop trigger if exists trg_notify_achievement on public.user_achievements;
create trigger trg_notify_achievement after insert on public.user_achievements
for each row execute function public.notify_achievement();

-- -------------------------------------------------------------- comunidade
create or replace function public.join_group(p_group uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  insert into public.group_members (group_id, user_id) values (p_group, auth.uid())
  on conflict do nothing;
end $$;

create or replace function public.leave_group(p_group uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.group_members where group_id = p_group and user_id = auth.uid();
end $$;

create or replace function public.join_cycle(p_cycle uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  if not exists (select 1 from public.cycles where id = p_cycle and status in ('PLANNED','ACTIVE')) then
    raise exception 'CYCLE_CLOSED';
  end if;
  insert into public.cycle_participants (cycle_id, user_id) values (p_cycle, auth.uid())
  on conflict do nothing;
  insert into public.notifications (user_id, kind, title, body)
  values (auth.uid(), 'cycle', 'Inscrição confirmada', 'Você entrou em um ciclo de estudo.');
end $$;

create or replace function public.my_memberships()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'groups', coalesce((select jsonb_agg(g.group_id) from public.group_members g where g.user_id = auth.uid()), '[]'::jsonb),
    'cycles', coalesce((select jsonb_agg(c.cycle_id) from public.cycle_participants c where c.user_id = auth.uid()), '[]'::jsonb)
  );
$$;

-- ------------------------------------------------------------------ eventos
create or replace function public.create_event_code(p_event uuid, p_hours integer default 48)
returns text language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  v_code := replace(gen_random_uuid()::text, '-', '');
  insert into public.event_codes (event_id, code, expires_at)
  values (p_event, v_code, now() + (p_hours || ' hours')::interval);
  return v_code;
end $$;

create or replace function public.event_checkins(p_event uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.is_admin() then coalesce((
    select jsonb_agg(jsonb_build_object('user_id', p.id, 'name', p.display_name, 'at', e.checked_in_at))
    from public.event_participation e join public.profiles p on p.id = e.user_id where e.event_id = p_event
  ), '[]'::jsonb) else '[]'::jsonb end;
$$;

-- -------------------------------------------------------------------- admin
create or replace function public.admin_set_role(p_user uuid, p_role text, p_grant boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_grant then
    insert into public.user_roles (user_id, role, granted_by) values (p_user, p_role, auth.uid())
    on conflict do nothing;
  else
    delete from public.user_roles where user_id = p_user and role = p_role;
  end if;
  insert into public.audit_logs (actor, action, target, metadata)
  values (auth.uid(), case when p_grant then 'grant_role' else 'revoke_role' end, p_user::text, jsonb_build_object('role', p_role));
end $$;

create or replace function public.admin_set_blocked(p_user uuid, p_blocked boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  update public.profiles set blocked = p_blocked where id = p_user;
  insert into public.audit_logs (actor, action, target, metadata)
  values (auth.uid(), 'set_blocked', p_user::text, jsonb_build_object('blocked', p_blocked));
end $$;

create or replace function public.admin_save_question(p jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; o jsonb;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  v_id := case when p->>'id' is null then gen_random_uuid() else (p->>'id')::uuid end;
  insert into public.questions (id, statement, reference, book, chapter, verse, difficulty, category_id, explanation, translation, status, created_by, reviewed_by, published_by)
  values (v_id, p->>'statement', p->>'reference', p->>'book', nullif(p->>'chapter','')::int,
          nullif(p->>'verse','')::int, coalesce(p->>'difficulty','medio'), nullif(p->>'category_id','')::uuid,
          p->>'explanation', coalesce(p->>'translation','Referência bíblica'),
          coalesce(p->>'status','DRAFT'), auth.uid(), auth.uid(),
          case when p->>'status' = 'PUBLISHED' then auth.uid() else null end)
  on conflict (id) do update set
    statement = excluded.statement, reference = excluded.reference, book = excluded.book,
    difficulty = excluded.difficulty, category_id = excluded.category_id,
    explanation = excluded.explanation, translation = excluded.translation,
    status = excluded.status, reviewed_by = excluded.reviewed_by,
    published_by = coalesce(excluded.published_by, public.questions.published_by), updated_at = now();

  if p->'options' is not null and jsonb_array_length(p->'options') > 0 then
    delete from public.question_options where question_id = v_id;
    for o in select * from jsonb_array_elements(p->'options') loop
      insert into public.question_options (question_id, option_text, is_correct, position)
      values (v_id, o->>'text', (o->>'correct')::boolean, (o->>'position')::int);
    end loop;
  end if;

  insert into public.audit_logs (actor, action, target) values (auth.uid(), 'save_question', v_id::text);
  return v_id;
end $$;

create or replace function public.admin_save_event(p jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  v_id := case when p->>'id' is null then gen_random_uuid() else (p->>'id')::uuid end;
  insert into public.events (id, title, description, starts_at, ends_at, location, group_id, status, created_by)
  values (v_id, p->>'title', p->>'description', (p->>'starts_at')::timestamptz,
          nullif(p->>'ends_at','')::timestamptz, p->>'location', nullif(p->>'group_id','')::uuid,
          coalesce(p->>'status','PLANNED'), auth.uid())
  on conflict (id) do update set title=excluded.title, description=excluded.description,
    starts_at=excluded.starts_at, ends_at=excluded.ends_at, location=excluded.location,
    group_id=excluded.group_id, status=excluded.status;
  insert into public.audit_logs (actor, action, target) values (auth.uid(), 'save_event', v_id::text);
  return v_id;
end $$;

create or replace function public.admin_save_group(p jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  v_id := case when p->>'id' is null then gen_random_uuid() else (p->>'id')::uuid end;
  insert into public.groups (id, name, description, created_by)
  values (v_id, p->>'name', p->>'description', auth.uid())
  on conflict (id) do update set name=excluded.name, description=excluded.description;
  insert into public.audit_logs (actor, action, target) values (auth.uid(), 'save_group', v_id::text);
  return v_id;
end $$;

create or replace function public.admin_save_track(p jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  v_id := case when p->>'id' is null then gen_random_uuid() else (p->>'id')::uuid end;
  insert into public.study_tracks (id, title, description, status)
  values (v_id, p->>'title', p->>'description', coalesce(p->>'status','DRAFT'))
  on conflict (id) do update set title=excluded.title, description=excluded.description, status=excluded.status;
  insert into public.audit_logs (actor, action, target) values (auth.uid(), 'save_track', v_id::text);
  return v_id;
end $$;

create or replace function public.admin_save_daily_word(p jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  insert into public.daily_word (day, reference, reflection, context, status)
  values ((p->>'day')::date, p->>'reference', p->>'reflection', p->>'context', coalesce(p->>'status','DRAFT'))
  on conflict (day) do update set reference=excluded.reference, reflection=excluded.reflection,
    context=excluded.context, status=excluded.status;
  insert into public.audit_logs (actor, action, target) values (auth.uid(), 'save_daily_word', p->>'day');
end $$;

create or replace function public.admin_save_category(p_name text, p_description text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  insert into public.categories (name, description) values (p_name, p_description)
  on conflict (name) do update set description = excluded.description;
end $$;

create or replace function public.admin_delete_content(p_table text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_table not in ('questions','events','groups','study_tracks','daily_word') then raise exception 'INVALID_TABLE'; end if;
  if p_table = 'questions' then delete from public.questions where id = p_id;
  elsif p_table = 'events' then delete from public.events where id = p_id;
  elsif p_table = 'groups' then delete from public.groups where id = p_id;
  elsif p_table = 'study_tracks' then delete from public.study_tracks where id = p_id;
  else delete from public.daily_word where id = p_id; end if;
  insert into public.audit_logs (actor, action, target) values (auth.uid(), 'delete_content', p_table || ':' || p_id::text);
end $$;

create or replace function public.admin_report(p_kind text)
returns jsonb language sql stable security definer set search_path = public as $$
  select case
    when not public.is_admin() then '{}'::jsonb
    when p_kind = 'growth' then (
      select jsonb_agg(jsonb_build_object('day', d, 'users', (select count(*) from public.profiles p where p.created_at::date <= d)))
      from generate_series(current_date - interval '29 days', current_date, interval '1 day') g(d)
    )
    when p_kind = 'content' then (
      select jsonb_build_object(
        'draft', (select count(*) from public.questions where status='DRAFT'),
        'review', (select count(*) from public.questions where status='REVIEW'),
        'published', (select count(*) from public.questions where status='PUBLISHED'),
        'tracks', (select count(*) from public.study_tracks),
        'events', (select count(*) from public.events)
      )
    )
    else public.admin_stats()
  end;
$$;

-- ------------------------------------------------------------------- export
create or replace function public.export_my_data()
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'roles', public.my_roles(),
    'sessions', coalesce((select jsonb_agg(to_jsonb(s)) from public.study_sessions s where s.user_id = auth.uid()), '[]'::jsonb),
    'answers', coalesce((select jsonb_agg(to_jsonb(a)) from public.study_answers a where a.user_id = auth.uid()), '[]'::jsonb),
    'scores', coalesce((select jsonb_agg(to_jsonb(e)) from public.score_events e where e.user_id = auth.uid()), '[]'::jsonb),
    'achievements', coalesce((select jsonb_agg(to_jsonb(a)) from public.user_achievements a where a.user_id = auth.uid()), '[]'::jsonb),
    'review_items', coalesce((select jsonb_agg(to_jsonb(r)) from public.review_items r where r.user_id = auth.uid()), '[]'::jsonb),
    'groups', coalesce((select jsonb_agg(to_jsonb(g)) from public.group_members g where g.user_id = auth.uid()), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(to_jsonb(e)) from public.event_participation e where e.user_id = auth.uid()), '[]'::jsonb),
    'notifications', coalesce((select jsonb_agg(to_jsonb(n)) from public.notifications n where n.user_id = auth.uid()), '[]'::jsonb)
  );
$$;

grant execute on all functions in schema public to authenticated;
