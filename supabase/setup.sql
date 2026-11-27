-- Fresh installation for project cfqivrhbuwxuqyjqyehx.
-- Run only after checking for existing bdrms_* tables. No sample users/data.
begin;
create schema if not exists bdrms_private;
revoke all on schema bdrms_private from public, anon, authenticated;

create table public.bdrms_staff (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  role text not null check (role in ('admin','secretary','staff')),
  active boolean not null default true
);
alter table public.bdrms_staff enable row level security;
revoke all on public.bdrms_staff from anon, authenticated;
grant select on public.bdrms_staff to authenticated;
create policy staff_self_read on public.bdrms_staff for select to authenticated
  using (id = (select auth.uid()));

create function public.bdrms_role() returns text
language sql stable security invoker set search_path = ''
as $$ select role from public.bdrms_staff where id = (select auth.uid()) and active $$;
revoke all on function public.bdrms_role() from public, anon;
grant execute on function public.bdrms_role() to authenticated;

create table public.bdrms_residents (
  id text primary key,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  payload jsonb not null,
  version integer not null default 1,
  check (jsonb_typeof(payload) = 'object' and not (payload ? 'password')),
  check (payload ?& array['firstName','lastName','purok','contact','status','verified']),
  check (coalesce(length(trim(payload->>'firstName')) > 0 and length(trim(payload->>'lastName')) > 0,false)),
  check (coalesce(payload->>'purok' in ('Purok 1','Purok 2','Purok 3','Purok 4','Purok 5','Purok 6','Purok 7'),false)),
  check (coalesce(payload->>'contact' ~ '^09[0-9]{9}$',false)),
  check (coalesce(payload->>'status' in ('pending_approval','active','rejected'),false)),
  check (coalesce((payload->>'verified')::boolean, false) = (payload->>'status' = 'active'))
);
create index bdrms_residents_status_idx on public.bdrms_residents ((payload->>'status'));
alter table public.bdrms_residents enable row level security;
revoke all on public.bdrms_residents from anon, authenticated;
grant select, insert, update on public.bdrms_residents to authenticated;
create policy residents_read on public.bdrms_residents for select to authenticated
  using (auth_user_id = (select auth.uid()) or (select public.bdrms_role()) in ('admin','secretary','staff'));
create policy residents_insert_staff on public.bdrms_residents for insert to authenticated
  with check ((select public.bdrms_role()) in ('secretary','staff') and auth_user_id is null);
create policy residents_update_staff on public.bdrms_residents for update to authenticated
  using ((select public.bdrms_role()) in ('secretary','staff'))
  with check ((select public.bdrms_role()) in ('secretary','staff'));

create table public.bdrms_requests (
  id text primary key,
  resident_id text not null references public.bdrms_residents(id),
  ref text not null unique,
  payload jsonb not null,
  version integer not null default 1,
  check (jsonb_typeof(payload) = 'object' and not (payload ? 'password')),
  check (payload ?& array['docType','purpose','status']),
  check (coalesce(payload->>'docType' in ('indigency','clearance','residency','bilihan','jobseeker','barangayid','fileaction'),false)),
  check (coalesce(length(trim(payload->>'purpose')) > 0,false)),
  check (coalesce(payload->>'status' in ('Submitted','Under Verification','For Approval','Ready for Pickup','Released','Rejected'),false))
);
create index bdrms_requests_resident_idx on public.bdrms_requests(resident_id);
create index bdrms_requests_status_idx on public.bdrms_requests ((payload->>'status'));
alter table public.bdrms_requests enable row level security;
revoke all on public.bdrms_requests from anon, authenticated;
grant select, insert, update on public.bdrms_requests to authenticated;
create policy requests_read on public.bdrms_requests for select to authenticated using (
  (select public.bdrms_role()) in ('admin','secretary','staff') or
  exists (select 1 from public.bdrms_residents r where r.id = resident_id and r.auth_user_id = (select auth.uid()))
);
create policy requests_insert on public.bdrms_requests for insert to authenticated with check (
  (select public.bdrms_role()) in ('secretary','staff') or
  (payload->>'status' = 'Submitted' and exists (
    select 1 from public.bdrms_residents r where r.id = resident_id
      and r.auth_user_id = (select auth.uid()) and r.payload->>'status' = 'active'
      and (r.payload->>'verified')::boolean
  ))
);
create policy requests_update_staff on public.bdrms_requests for update to authenticated
  using ((select public.bdrms_role()) in ('secretary','staff'))
  with check ((select public.bdrms_role()) in ('secretary','staff'));

create table public.bdrms_audit (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid,
  actor_name text not null,
  actor_role text not null,
  action text not null,
  target text not null
);
alter table public.bdrms_audit enable row level security;
revoke all on public.bdrms_audit from anon, authenticated;
grant select on public.bdrms_audit to authenticated;
create policy audit_staff_read on public.bdrms_audit for select to authenticated
  using ((select public.bdrms_role()) in ('admin','secretary','staff'));

-- SECURITY INVOKER preserves RLS. Each group is committed atomically; stale edits fail.
create function public.bdrms_commit(changes jsonb) returns void
language plpgsql security invoker set search_path = ''
as $$
declare item jsonb; touched text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(changes) <> 'object' then raise exception 'Invalid changes'; end if;
  for item in select value from jsonb_array_elements(coalesce(changes->'residents', '[]'::jsonb)) loop
    if item->>'expected_version' is null then
      insert into public.bdrms_residents(id, auth_user_id, payload)
      values (item->>'id', null, item->'payload');
    else
      update public.bdrms_residents set payload = item->'payload'
      where id = item->>'id' and version = (item->>'expected_version')::integer returning id into touched;
      if not found then raise exception 'Resident record changed or access denied. Refresh and retry.'; end if;
    end if;
  end loop;
  for item in select value from jsonb_array_elements(coalesce(changes->'requests', '[]'::jsonb)) loop
    if item->>'expected_version' is null then
      insert into public.bdrms_requests(id, resident_id, ref, payload)
      values (item->>'id', item->>'resident_id', item->>'ref', item->'payload');
    else
      update public.bdrms_requests set payload = item->'payload'
      where id = item->>'id' and version = (item->>'expected_version')::integer returning id into touched;
      if not found then raise exception 'Document request changed or access denied. Refresh and retry.'; end if;
    end if;
  end loop;
end;
$$;
revoke all on function public.bdrms_commit(jsonb) from public, anon;
grant execute on function public.bdrms_commit(jsonb) to authenticated;

create function bdrms_private.validate_record() returns trigger
language plpgsql security invoker set search_path = ''
as $$
declare resident jsonb; role_name text;
begin
  if tg_op = 'UPDATE' then
    if new.id <> old.id then raise exception 'Record ID cannot change'; end if;
    new.version := old.version + 1;
    if tg_table_name = 'bdrms_residents' then
      if new.auth_user_id is distinct from old.auth_user_id and auth.uid() is not null then
        raise exception 'Account ownership cannot change';
      end if;
    elsif tg_table_name = 'bdrms_requests' then
      if new.resident_id <> old.resident_id or new.ref <> old.ref then
        raise exception 'Request ownership and reference cannot change';
      end if;
    end if;
  end if;
  if tg_table_name = 'bdrms_requests' then
    role_name := public.bdrms_role();
    if coalesce(role_name,'resident') not in ('secretary','staff') then
      if tg_op <> 'INSERT' then raise exception 'Staff access required'; end if;
      select r.payload into resident from public.bdrms_residents r
        where r.id = new.resident_id and r.auth_user_id = auth.uid()
        and r.payload->>'status' = 'active';
      if not found then raise exception 'Approved resident account required'; end if;
      new.payload := new.payload || jsonb_build_object(
        'applicant', resident - array['notes','remarks','registeredBy','approvedAt','verified','status','authUserId'],
        'status','Submitted','channel','Online','orNumber','',
        'verification',jsonb_build_object('identity',false,'residency',false,'blotterCleared',false),
        'paymentStatus',case when new.payload->>'docType' in ('indigency','jobseeker') then 'Exempt' else 'Unpaid' end,
        'createdAt',now(),'updatedAt',now(),
        'history',jsonb_build_array(jsonb_build_object('status','Submitted','by','Resident','at',now(),'note','Submitted through resident portal.'))
      );
    end if;
  end if;
  return new;
end;
$$;
revoke all on function bdrms_private.validate_record() from public, anon, authenticated;
create trigger resident_validate before update on public.bdrms_residents
  for each row execute function bdrms_private.validate_record();
create trigger request_validate before insert or update on public.bdrms_requests
  for each row execute function bdrms_private.validate_record();

-- Internal trigger only: clients cannot fabricate audit entries.
create function bdrms_private.audit_record() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare actor public.bdrms_staff;
begin
  if auth.uid() is null then return new; end if;
  select * into actor from public.bdrms_staff where id = auth.uid() and active;
  insert into public.bdrms_audit(actor_id,actor_name,actor_role,action,target)
  values (auth.uid(),coalesce(actor.name,'Resident'),coalesce(actor.role,'resident'),
    tg_op || ' ' || tg_table_name || ': ' || coalesce(new.payload->>'status',''),
    new.id);
  return new;
end;
$$;
revoke all on function bdrms_private.audit_record() from public, anon, authenticated;
create trigger resident_audit after insert or update on public.bdrms_residents
  for each row execute function bdrms_private.audit_record();
create trigger request_audit after insert or update on public.bdrms_requests
  for each row execute function bdrms_private.audit_record();

-- Supabase owns the password. User-provided metadata cannot assign staff/approval roles.
create function bdrms_private.create_resident_from_auth() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare profile jsonb;
begin
  if not (coalesce(new.raw_user_meta_data,'{}'::jsonb) ? 'bdrms_profile') then return new; end if;
  profile := new.raw_user_meta_data->'bdrms_profile';
  if jsonb_typeof(profile) <> 'object' then raise exception 'Invalid registration'; end if;
  profile := jsonb_build_object(
    'firstName',profile->>'firstName','middleName',profile->>'middleName',
    'lastName',profile->>'lastName','suffix',profile->>'suffix',
    'birthdate',profile->>'birthdate','sex',profile->>'sex','civilStatus',profile->>'civilStatus',
    'purok',profile->>'purok','contact',profile->>'contact','residentSince',profile->>'residentSince',
    'address',(profile->>'purok') || ', Barangay Wawa, Abra de Ilog, Occidental Mindoro',
    'email',new.email,'status','pending_approval','verified',false,
    'registrationChannel','Online','createdAt',now()
  );
  if profile->>'birthdate' is null or profile->>'residentSince' is null
    or (profile->>'birthdate')::date > current_date or (profile->>'residentSince')::date > current_date
    or (profile->>'residentSince')::date < (profile->>'birthdate')::date then
    raise exception 'Invalid registration dates';
  end if;
  insert into public.bdrms_residents(id,auth_user_id,payload)
    values ('res_' || new.id::text,new.id,profile);
  return new;
end;
$$;
revoke all on function bdrms_private.create_resident_from_auth() from public, anon, authenticated;
create trigger bdrms_auth_resident after insert on auth.users
  for each row execute function bdrms_private.create_resident_from_auth();
commit;
