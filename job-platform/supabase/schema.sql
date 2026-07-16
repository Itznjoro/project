-- ============================================================
-- JobMatch — Supabase schema
-- Run this once in Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILES (extends auth.users — Supabase Auth already
--    handles email/password/hashing/sessions for us)
-- ------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  role        text not null check (role in ('seeker','employer')),
  phone       text,
  created_at  timestamptz not null default now()
);

create table public.seeker_profiles (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  bio         text,
  location    text,
  skills      text[] not null default '{}',
  resume_url  text,
  avatar_url  text
);

create table public.employer_profiles (
  user_id       uuid primary key references public.profiles(id) on delete cascade,
  company_name  text not null,
  location      text,
  website       text,
  description   text,
  logo_url      text
);

-- ------------------------------------------------------------
-- 2. JOBS
-- ------------------------------------------------------------
create table public.jobs (
  id            bigint generated always as identity primary key,
  employer_id   uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  category      text not null,
  location      text not null,
  type          text not null,           -- Full-time | Part-time | Contract
  salary_min    integer,
  salary_max    integer,
  description   text not null,
  requirements  text[] not null default '{}',
  deadline      date,
  status        text not null default 'Active' check (status in ('Active','Closed')),
  created_at    timestamptz not null default now(),
  -- Second FK to the SAME underlying user id, pointed at employer_profiles
  -- instead of profiles. Both constraints are always satisfied together
  -- (every employer has exactly one employer_profiles row) — this just
  -- gives Supabase's query layer (PostgREST) a direct edge so pages can
  -- embed company info with `.select("*, employer_profiles(...)")`
  -- instead of failing with "no relationship found between jobs and
  -- employer_profiles" (there's no direct FK between them otherwise —
  -- both only relate to `profiles`, and PostgREST can't join through
  -- a shared parent automatically).
  constraint jobs_employer_profile_fkey foreign key (employer_id) references public.employer_profiles(user_id) on delete cascade
);

-- ------------------------------------------------------------
-- 3. APPLICATIONS
-- ------------------------------------------------------------
create table public.applications (
  id            bigint generated always as identity primary key,
  job_id        bigint not null references public.jobs(id) on delete cascade,
  seeker_id     uuid not null references public.profiles(id) on delete cascade,
  status        text not null default 'Pending' check (status in ('Pending','Shortlisted','Accepted','Rejected')),
  cover_letter  text,
  resume_url    text,               -- CV uploaded specifically for this application (Supabase Storage path)
  applied_at    timestamptz not null default now(),
  unique (job_id, seeker_id),
  -- Same reasoning as jobs_employer_profile_fkey above, so pages can embed
  -- `.select("*, seeker_profiles(...)")` directly on applications.
  constraint applications_seeker_profile_fkey foreign key (seeker_id) references public.seeker_profiles(user_id) on delete cascade
);

create table public.saved_jobs (
  id          bigint generated always as identity primary key,
  seeker_id   uuid not null references public.profiles(id) on delete cascade,
  job_id      bigint not null references public.jobs(id) on delete cascade,
  saved_at    timestamptz not null default now(),
  unique (seeker_id, job_id)
);

-- ------------------------------------------------------------
-- 4. MESSAGING
-- ------------------------------------------------------------
create table public.conversations (
  id                bigint generated always as identity primary key,
  participant_a     uuid not null references public.profiles(id) on delete cascade,
  participant_b     uuid not null references public.profiles(id) on delete cascade,
  created_at        timestamptz not null default now(),
  unique (participant_a, participant_b)
);

create table public.messages (
  id                bigint generated always as identity primary key,
  conversation_id   bigint not null references public.conversations(id) on delete cascade,
  sender_id         uuid not null references public.profiles(id) on delete cascade,
  text              text not null,
  read              boolean not null default false,
  created_at        timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. NOTIFICATIONS
-- ------------------------------------------------------------
create table public.notifications (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  icon        text,
  text        text not null,
  type        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index on public.jobs (employer_id);
create index on public.jobs (status);
create index on public.applications (job_id);
create index on public.applications (seeker_id);
create index on public.messages (conversation_id);
create index on public.notifications (user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.seeker_profiles enable row level security;
alter table public.employer_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- ---------- profiles ----------
-- Anyone can view basic profile info (needed so job listings can show
-- employer names, and seekers/employers can see each other in chat).
create policy "profiles are publicly readable" on public.profiles
  for select using (true);

create policy "users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- ---------- seeker_profiles ----------
create policy "seeker profiles readable by anyone signed in" on public.seeker_profiles
  for select using (auth.role() = 'authenticated');

create policy "seekers manage their own profile" on public.seeker_profiles
  for insert with check (auth.uid() = user_id);

create policy "seekers update their own profile" on public.seeker_profiles
  for update using (auth.uid() = user_id);

-- ---------- employer_profiles ----------
create policy "employer profiles are publicly readable" on public.employer_profiles
  for select using (true);

create policy "employers manage their own profile" on public.employer_profiles
  for insert with check (auth.uid() = user_id);

create policy "employers update their own profile" on public.employer_profiles
  for update using (auth.uid() = user_id);

-- ---------- jobs ----------
-- Public can see active jobs; an employer can also see their own closed jobs.
create policy "active jobs are publicly readable" on public.jobs
  for select using (status = 'Active' or employer_id = auth.uid());

create policy "employers post jobs" on public.jobs
  for insert with check (
    auth.uid() = employer_id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'employer')
  );

create policy "employers update their own jobs" on public.jobs
  for update using (auth.uid() = employer_id);

create policy "employers delete their own jobs" on public.jobs
  for delete using (auth.uid() = employer_id);

-- ---------- applications ----------
-- A seeker sees their own applications; an employer sees applications to their own jobs.
create policy "applications readable by seeker or job owner" on public.applications
  for select using (
    seeker_id = auth.uid()
    or exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid())
  );

create policy "seekers apply to jobs" on public.applications
  for insert with check (
    auth.uid() = seeker_id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'seeker')
  );

-- only the employer who owns the job can change an application's status
create policy "employers update application status" on public.applications
  for update using (
    exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid())
  );

-- ---------- saved_jobs ----------
create policy "seekers manage their own saved jobs" on public.saved_jobs
  for all using (auth.uid() = seeker_id) with check (auth.uid() = seeker_id);

-- ---------- conversations ----------
create policy "participants can read their conversations" on public.conversations
  for select using (auth.uid() = participant_a or auth.uid() = participant_b);

create policy "participants can start conversations" on public.conversations
  for insert with check (auth.uid() = participant_a or auth.uid() = participant_b);

-- ---------- messages ----------
create policy "participants can read their messages" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
  );

create policy "participants can send messages" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
  );

create policy "participants can mark messages read" on public.messages
  for update using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
  );

-- ---------- notifications ----------
create policy "users read their own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "users update their own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- notifications are otherwise only inserted by the trigger functions below
-- (security definer), so no general insert policy is granted here.

-- ============================================================
-- TRIGGERS — auto-create notifications on key events
-- ============================================================

-- New application → notify the employer
create or replace function public.notify_employer_on_application()
returns trigger
language plpgsql
security definer
as $$
declare
  v_employer_id uuid;
  v_job_title text;
  v_seeker_name text;
begin
  select employer_id, title into v_employer_id, v_job_title from public.jobs where id = new.job_id;
  select name into v_seeker_name from public.profiles where id = new.seeker_id;

  insert into public.notifications (user_id, icon, text, type)
  values (v_employer_id, 'fa-user-plus', v_seeker_name || ' applied for ' || v_job_title || '.', 'new_candidate');

  return new;
end;
$$;

create trigger trg_notify_employer_on_application
  after insert on public.applications
  for each row execute function public.notify_employer_on_application();

-- Application status changed → notify the seeker
create or replace function public.notify_seeker_on_status_change()
returns trigger
language plpgsql
security definer
as $$
declare
  v_job_title text;
begin
  if new.status is distinct from old.status then
    select title into v_job_title from public.jobs where id = new.job_id;
    insert into public.notifications (user_id, icon, text, type)
    values (
      new.seeker_id,
      case new.status
        when 'Shortlisted' then 'fa-file-circle-check'
        when 'Accepted' then 'fa-circle-check'
        when 'Rejected' then 'fa-circle-xmark'
        else 'fa-bell'
      end,
      'Your application for ' || v_job_title || ' was ' || lower(new.status) || '.',
      'application_status'
    );
  end if;
  return new;
end;
$$;

create trigger trg_notify_seeker_on_status_change
  after update on public.applications
  for each row execute function public.notify_seeker_on_status_change();

-- New message → notify the recipient
create or replace function public.notify_on_message()
returns trigger
language plpgsql
security definer
as $$
declare
  v_recipient uuid;
  v_sender_name text;
begin
  select case when c.participant_a = new.sender_id then c.participant_b else c.participant_a end
    into v_recipient
    from public.conversations c where c.id = new.conversation_id;

  select name into v_sender_name from public.profiles where id = new.sender_id;

  insert into public.notifications (user_id, icon, text, type)
  values (v_recipient, 'fa-comment', 'New message from ' || v_sender_name || '.', 'message');

  return new;
end;
$$;

create trigger trg_notify_on_message
  after insert on public.messages
  for each row execute function public.notify_on_message();

-- ============================================================
-- STORAGE BUCKETS (resumes / avatars / logos)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- resumes: private. A seeker can upload/read/replace only files inside
-- a folder named after their own user id (e.g. "<uid>/cv.pdf"); an
-- employer can read a resume only if that seeker applied to one of
-- their jobs.
create policy "seekers upload their own resumes" on storage.objects
  for insert with check (
    bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "seekers read/replace their own resumes" on storage.objects
  for select using (
    bucket_id = 'resumes' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.applications a
        join public.jobs j on j.id = a.job_id
        where j.employer_id = auth.uid()
        and (storage.foldername(name))[1] = a.seeker_id::text
      )
    )
  );

create policy "seekers update their own resumes" on storage.objects
  for update using (
    bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- avatars/logos: public read, owner-only write
create policy "public read avatars" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "users upload their own avatar" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users update their own avatar" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "public read logos" on storage.objects
  for select using (bucket_id = 'logos');
create policy "employers upload their own logo" on storage.objects
  for insert with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "employers update their own logo" on storage.objects
  for update using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
