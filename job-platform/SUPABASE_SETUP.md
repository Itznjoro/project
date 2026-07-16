# JobMatch — Now Running on Supabase

This replaces the earlier Node/Express/Prisma plan (Stage 0) with **Supabase**:
Postgres + Auth + Storage + instant REST/Realtime, called directly from your
existing static HTML/JS. No server to host — your frontend talks to Supabase
directly, protected by Row Level Security (RLS) instead of an API layer.

## Troubleshooting

### "Cannot read properties of undefined (reading 'signInWithPassword')"
This means `js/supabase-client.js` still has the placeholder
`SUPABASE_URL`/`SUPABASE_ANON_KEY` values (step 3 above wasn't done), or the
Supabase library script tag failed to load. The app now catches this itself:
- A red banner appears at the top of every page saying "Supabase is not
  connected" until you fill in real credentials.
- Login/register show a clear message instead of a cryptic error.

If you still see a raw console error instead of the banner/toast, open
DevTools → Console and check for a red `[JobMatch]` log line — it tells you
exactly which script failed to load or what's misconfigured.

### "Account created! Check your email to confirm it..." right after registering
Supabase requires email confirmation by default. Until the account is
confirmed, there's no login session, so writing the profile row is correctly
blocked by Row Level Security. For a demo/presentation, turn this off:
Dashboard → **Authentication → Providers → Email** → turn off **"Confirm
email"**. Then registration logs the user in immediately.

### "Could not find a relationship between 'jobs' and 'employer_profiles'"
If you ran an earlier version of `schema.sql`, re-run the current one (or at
minimum, run this in the SQL Editor):
```sql
alter table public.jobs
  add constraint jobs_employer_profile_fkey
  foreign key (employer_id) references public.employer_profiles(user_id) on delete cascade;

alter table public.applications
  add constraint applications_seeker_profile_fkey
  foreign key (seeker_id) references public.seeker_profiles(user_id) on delete cascade;
```
Why this is needed: `jobs` and `employer_profiles` both reference `profiles`,
but Supabase's query layer (PostgREST) can only auto-join tables that have a
**direct** foreign key between them — it won't infer a join through a shared
parent table. These two extra constraints give it that direct edge (they're
redundant with the existing checks, since every employer/seeker account
always has exactly one profile row, so they never reject valid data).

### Nothing loads / infinite spinner on a dashboard page
Open DevTools → Network tab and look for requests to your `.supabase.co`
domain returning 401/403 — that means RLS is blocking the request, usually
because you're not logged in, or you're viewing a page meant for the other
role (e.g. a seeker account on `employer-dashboard.html` — the app should
auto-redirect you, but check the console for errors if it doesn't).

## What's wired up

| Roadmap item | Status | Where |
|---|---|---|
| Registration → database | ✅ | `register.html` → `Auth.register()` |
| Login → database | ✅ | `login.html` → `Auth.login()` |
| Job seeker profile storage | ✅ | `seeker_profiles` table, `profile.html` |
| Employer account storage | ✅ | `employer_profiles` table, `employer-profile.html` |
| Job posting (employer) | ✅ | `post-job.html` → `Jobs.create()` |
| Manage/edit/delete jobs | ✅ | `manage-jobs.html` |
| Browse/search jobs (public) | ✅ | `search-jobs.html`, `job-details.html` |
| Job applications (seeker) | ✅ | `apply-job.html` → `Applications.apply()` |
| Employer reviews applications | ✅ | `employer-applications.html`, status updates trigger notifications |
| Saved jobs | ✅ | `saved-jobs.html`, `saved_jobs` table |
| CV upload via Supabase Storage | ✅ | `apply-job.html` → `Storage.uploadResume()`, private `resumes` bucket |
| Avatar / company logo upload | ✅ | `profile.html`, `employer-profile.html` → `avatars` / `logos` buckets |
| Messaging | ✅ | `messages.html`, real-time via Supabase Realtime |
| Notifications | ✅ | `notifications.html` + topbar dropdown, auto-created by DB triggers |
| Password reset | ✅ | `login.html` "Forgot Password" → `Auth.sendPasswordReset()` |
| Change password | ✅ | `profile.html` / `employer-profile.html` |

Marketing pages (`index.html`, `about.html`, `contact.html`) still use
`js/data.js` for testimonials/team — that's static content, not user data,
so it's left alone.

## Setup (do this first — nothing will work until you do)

### 1. Create a Supabase project
Go to [supabase.com](https://supabase.com) → New Project. Note the project
URL and anon/public API key (Project Settings → API).

### 2. Run the schema
Dashboard → **SQL Editor** → New query → paste the entire contents of
`supabase/schema.sql` → Run. This creates every table, RLS policy, trigger,
and storage bucket in one shot.

### 3. Point the frontend at your project
Edit `js/supabase-client.js`:
```js
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
```
The anon key is safe to ship in frontend code — every table is locked down
by RLS, so it can only do what the policies in `schema.sql` allow.

### 4. Turn off email confirmation for local testing (optional)
By default Supabase requires email confirmation before login works.
For quick local testing: Dashboard → Authentication → Providers → Email →
turn off "Confirm email". Turn it back on before going live.

### 5. Open the site
Any static file server works, e.g. from the project folder:
```bash
npx serve .
```
Register an account, and everything — jobs, applications, messages,
notifications, file uploads — now round-trips through Supabase.

## How the pieces fit together

- **`js/supabase-client.js`** — the connection (fill in your URL/key here).
- **`js/db.js`** — every database/storage/auth call the app makes, grouped
  into `Auth`, `Jobs`, `Applications`, `SavedJobs`, `Profiles`, `Storage`,
  `Messaging`, `Notifications`. Pages call these instead of touching
  `supabase` directly.
- **`supabase/schema.sql`** — tables, RLS policies, notification triggers,
  and storage buckets. Re-runnable is not guaranteed (it's a one-shot
  `create table`/`create policy` script) — if you need to change something,
  edit and run the specific `alter`/`drop`+`create` statements by hand.

## Security model (replaces Stage 2 from the original plan)

Instead of hand-rolled JWT middleware, **Postgres Row Level Security does
the enforcement**, right at the database:
- A seeker can only insert applications with `seeker_id = auth.uid()` — they
  can't apply as someone else, even by editing the request.
- Only the employer who owns a job can update/delete it or change an
  application's status — enforced by the `jobs.employer_id = auth.uid()`
  checks in every relevant policy, not by trusting the frontend.
- Resumes are private: a seeker can only read their own uploaded files, and
  an employer can only read a resume if that seeker actually applied to one
  of their jobs (`storage.objects` policy joins through `applications`).

This is arguably stronger than the original plan's server-side middleware,
since there's no API layer to misconfigure — the database itself refuses
disallowed reads/writes no matter how they're attempted.

## What's still open

- **Rate limiting on auth** — Supabase applies its own default rate limits;
  no extra work needed unless you want custom thresholds.
- **Email verification** — supported out of the box (Authentication →
  Templates to customize the email), just re-enable the setting from step 4
  before going live.
- **Input validation** — the DB enforces types/constraints (e.g. `role` must
  be `seeker`/`employer`, `status` must be one of a fixed set), but you may
  still want client-side validation library (zod) for nicer error messages.
- **Automated tests** — none yet.
- **Custom domain / hosting** — deploy the static files anywhere (Netlify,
  Vercel, Cloudflare Pages, GitHub Pages); Supabase is already hosted for you.

## Known simplifications worth knowing about

- `jobs.salary_min`/`salary_max` are parsed from the free-text salary field
  in `post-job.html` (e.g. "KES 80,000 - 120,000") using a regex. If someone
  types something unparseable, the salary is just stored as null/"Not
  disclosed" rather than blocking the post.
- The "Log in as Job Seeker / Employer" selector was removed from the login
  page — your role now comes from your account in the database, not a radio
  button, so it can't be spoofed by picking the wrong option.
