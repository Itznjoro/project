/* ============================================================
   DB — every Supabase read/write the app needs, in one place.
   Pages call these functions instead of touching `supabase`
   directly, and instead of reading the old mock arrays in data.js.
   ============================================================ */

/** Every Auth/DB function calls this first. If js/supabase-client.js
 *  still has placeholder credentials, this throws a clear, human
 *  readable error instead of letting the real call fail deep inside
 *  the Supabase library with a cryptic "undefined" error. */
function ensureSupabaseReady() {
  if (typeof window.SUPABASE_READY === "undefined") {
    throw new Error("js/supabase-client.js did not load — check the <script> tag order in this page's <head>.");
  }
  if (!window.SUPABASE_READY) {
    throw new Error(
      "Supabase isn't connected yet. Open js/supabase-client.js and paste in your project's URL and anon key from Supabase Dashboard \u2192 Settings \u2192 API."
    );
  }
}

/* ---------------- AUTH ---------------- */

const Auth = {
  /** Create an account + matching profile row(s). */
  async register({ name, email, password, phone, role }) {
    ensureSupabaseReady();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (!data.session) {
      // Email confirmation is turned on for this Supabase project, so no
      // session exists yet — writing profile rows now would be rejected by
      // Row Level Security (it requires auth.uid() = id, i.e. a logged-in
      // user). Tell the user clearly instead of failing silently later.
      throw new Error(
        "Account created! Check your email to confirm it, then log in. " +
        "(For local demos, turn off \"Confirm email\" under Supabase \u2192 Authentication \u2192 Providers \u2192 Email.)"
      );
    }

    const userId = data.user.id;

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: userId, name, email, phone, role });
    if (profileError) throw profileError;

    if (role === "seeker") {
      const { error: e } = await supabase.from("seeker_profiles").insert({ user_id: userId });
      if (e) throw e;
    } else {
      const { error: e } = await supabase
        .from("employer_profiles")
        .insert({ user_id: userId, company_name: name });
      if (e) throw e;
    }

    return data.user;
  },

  async login({ email, password }) {
    ensureSupabaseReady();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },

  async logout() {
    ensureSupabaseReady();
    await supabase.auth.signOut();
  },

  async currentUser() {
    ensureSupabaseReady();
    const { data } = await supabase.auth.getUser();
    return data.user || null;
  },

  /** Full profile row (role, name, etc.) for the logged-in user. */
  async currentProfile() {
    ensureSupabaseReady();
    const user = await this.currentUser();
    if (!user) return null;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (error) throw error;
    return data;
  },

  async sendPasswordReset(email) {
    ensureSupabaseReady();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/login.html",
    });
    if (error) throw error;
  },

  /** Permanently deletes the logged-in user's account and every piece of
   *  their data (profile, jobs/applications, saved jobs, messages,
   *  notifications, and any uploaded resume/avatar/logo files). This
   *  cannot be undone — the caller (profile.html / employer-profile.html)
   *  is responsible for confirming with the user first. */
  async deleteAccount() {
    ensureSupabaseReady();
    const user = await this.currentUser();
    if (!user) throw new Error("You're not logged in.");

    // Clean up any files this user uploaded, since deleting the database
    // rows doesn't touch Supabase Storage automatically.
    for (const bucket of ["resumes", "avatars", "logos"]) {
      try {
        const { data: files } = await supabase.storage.from(bucket).list(user.id);
        if (files && files.length) {
          const paths = files.map((f) => `${user.id}/${f.name}`);
          await supabase.storage.from(bucket).remove(paths);
        }
      } catch (e) {
        // Non-fatal — proceed with account deletion even if a bucket had
        // nothing to clean up or a file was already gone.
      }
    }

    const { error } = await supabase.rpc("delete_own_account");
    if (error) throw error;

    await supabase.auth.signOut();
  },
};

/** Redirect to login.html if not authenticated, or to the wrong
 *  dashboard if the logged-in role doesn't match the page's portal.
 *  Call at the top of every page inside the seeker/employer portals. */
async function requireRole(expectedRole) {
  let profile;
  try {
    profile = await Auth.currentProfile();
  } catch (err) {
    showToast(err.message || "Could not connect to the database.", "error");
    return null;
  }
  if (!profile) {
    window.location.href = "login.html";
    return null;
  }
  if (profile.role !== expectedRole) {
    window.location.href = profile.role === "employer" ? "employer-dashboard.html" : "seeker-dashboard.html";
    return null;
  }
  return profile;
}

/* ---------------- JOBS ---------------- */

const Jobs = {
  /** Public job search/browse — only Active jobs, newest first. */
  async search({ q, category, location, type } = {}) {
    let query = supabase
      .from("jobs")
      .select("*, employer_profiles(company_name, logo_url)")
      .eq("status", "Active")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (q) query = query.ilike("title", `%${q}%`);
    if (category) query = query.eq("category", category);
    if (location) query = query.eq("location", location);
    if (type) query = query.eq("type", type);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("jobs")
      .select("*, employer_profiles(company_name, logo_url, website, description)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  /** Jobs posted by the logged-in employer (any status, excluding ones they deleted). */
  /** Active jobs list for Manage Jobs — excludes ones the employer deleted. */
  async myJobs(employerId) {
    const { data, error } = await supabase
      .from("jobs")
      .select("*, applications(count)")
      .eq("employer_id", employerId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  /** EVERY job this employer has ever posted, including deleted ones —
   *  for Reports, which is meant to be a permanent historical record
   *  (total jobs posted, category breakdown, hiring trends) rather than
   *  a snapshot of what's currently live. Deleting a job removes it from
   *  day-to-day views but should never erase it from the company's
   *  track record. */
  async allEverPosted(employerId) {
    const { data, error } = await supabase
      .from("jobs")
      .select("*, applications(count)")
      .eq("employer_id", employerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(job) {
    const { data, error } = await supabase.from("jobs").insert(job).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, changes) {
    const { data, error } = await supabase.from("jobs").update(changes).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  /** "Deletes" a job from the employer's point of view without touching the
   *  row itself — a hard delete would cascade and wipe out every seeker's
   *  application history for it (via the applications.job_id foreign key).
   *  Instead this just hides it from listings; the job row (title,
   *  location, etc.) stays intact so a seeker's My Applications page keeps
   *  showing full, correct details for that application forever. */
  async remove(id) {
    const { error } = await supabase.from("jobs").update({ status: "Closed", is_deleted: true }).eq("id", id);
    if (error) throw error;
  },
};

/* ---------------- APPLICATIONS ---------------- */

const Applications = {
  /** Apply to a job, optionally uploading a fresh CV for this application. */
  async apply({ jobId, seekerId, coverLetter, resumeUrl }) {
    const { data, error } = await supabase
      .from("applications")
      .insert({ job_id: jobId, seeker_id: seekerId, cover_letter: coverLetter, resume_url: resumeUrl })
      .select()
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("You've already applied to this job.");
      throw error;
    }
    return data;
  },

  /** A seeker's own application list — "My Applications". */
  async mine(seekerId) {
    const { data, error } = await supabase
      .from("applications")
      .select("*, jobs(title, location, employer_profiles(company_name))")
      .eq("seeker_id", seekerId)
      .order("applied_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  /** Applications to jobs owned by the logged-in employer. */
  async forEmployer(employerId) {
    const { data, error } = await supabase
      .from("applications")
      .select("*, jobs!inner(title, employer_id), profiles!applications_seeker_id_fkey(name, email, phone), seeker_profiles(bio, location, skills, resume_url)")
      .eq("jobs.employer_id", employerId)
      .order("applied_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async updateStatus(id, status) {
    const { error } = await supabase.from("applications").update({ status }).eq("id", id);
    if (error) throw error;
  },

  async hasApplied(jobId, seekerId) {
    const { data, error } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("seeker_id", seekerId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },
};

/* ---------------- SAVED JOBS ---------------- */

const SavedJobs = {
  async list(seekerId) {
    const { data, error } = await supabase
      .from("saved_jobs")
      .select("*, jobs(*, employer_profiles(company_name, logo_url))")
      .eq("seeker_id", seekerId)
      .order("saved_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async isSaved(jobId, seekerId) {
    const { data, error } = await supabase
      .from("saved_jobs")
      .select("id")
      .eq("job_id", jobId)
      .eq("seeker_id", seekerId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async save(jobId, seekerId) {
    const { error } = await supabase.from("saved_jobs").insert({ job_id: jobId, seeker_id: seekerId });
    if (error && error.code !== "23505") throw error;
  },

  async unsave(jobId, seekerId) {
    const { error } = await supabase.from("saved_jobs").delete().eq("job_id", jobId).eq("seeker_id", seekerId);
    if (error) throw error;
  },
};

/* ---------------- PROFILES ---------------- */

const Profiles = {
  async updateBasic(userId, { name, phone }) {
    const { error } = await supabase.from("profiles").update({ name, phone }).eq("id", userId);
    if (error) throw error;
  },

  async getSeekerProfile(userId) {
    const { data, error } = await supabase.from("seeker_profiles").select("*").eq("user_id", userId).single();
    if (error) throw error;
    return data;
  },

  async updateSeekerProfile(userId, changes) {
    const { error } = await supabase.from("seeker_profiles").update(changes).eq("user_id", userId);
    if (error) throw error;
  },

  async getEmployerProfile(userId) {
    const { data, error } = await supabase.from("employer_profiles").select("*").eq("user_id", userId).single();
    if (error) throw error;
    return data;
  },

  async updateEmployerProfile(userId, changes) {
    const { error } = await supabase.from("employer_profiles").update(changes).eq("user_id", userId);
    if (error) throw error;
  },
};

/* ---------------- STORAGE (CVs, avatars, logos) ---------------- */

const Storage = {
  /** Upload a CV to the private "resumes" bucket under the seeker's own
   *  folder (required by the storage RLS policy), and return a path
   *  that can later be turned into a signed URL. */
  async uploadResume(userId, file) {
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("resumes").upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  },

  /** Resumes are private, so viewing one requires a short-lived signed URL. */
  async getResumeSignedUrl(path, expiresInSeconds = 3600) {
    const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, expiresInSeconds);
    if (error) throw error;
    return data.signedUrl;
  },

  async uploadAvatar(userId, file) {
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  },

  async uploadLogo(userId, file) {
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from("logos").getPublicUrl(path).data.publicUrl;
  },
};

/* ---------------- MESSAGING ---------------- */

const Messaging = {
  async listConversations(userId) {
    const { data, error } = await supabase
      .from("conversations")
      .select("*, a:profiles!conversations_participant_a_fkey(id,name,role), b:profiles!conversations_participant_b_fkey(id,name,role)")
      .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getOrCreateConversation(userA, userB) {
    const [a, b] = [userA, userB].sort(); // keep pair order consistent with the unique constraint
    const { data: existing, error: findErr } = await supabase
      .from("conversations")
      .select("*")
      .eq("participant_a", a)
      .eq("participant_b", b)
      .maybeSingle();
    if (findErr) throw findErr;
    if (existing) return existing;

    const { data, error } = await supabase
      .from("conversations")
      .insert({ participant_a: a, participant_b: b })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async listMessages(conversationId) {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },

  async send(conversationId, senderId, text) {
    const { error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: senderId, text });
    if (error) throw error;
  },

  async markConversationRead(conversationId, userId) {
    const { error } = await supabase
      .from("messages")
      .update({ read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .eq("read", false);
    if (error) throw error;
  },

  unsubscribe(channel) {
    if (channel) supabase.removeChannel(channel);
  },

  /** Live updates without a manual refresh — Stage 5 (real-time), for free with Supabase. */
  subscribeToMessages(conversationId, onInsert) {
    return supabase
      .channel(`messages-${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, onInsert)
      .subscribe();
  },
};

/* ---------------- NOTIFICATIONS ---------------- */

const Notifications = {
  async list(userId, limit = 50) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async unreadCount(userId) {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) throw error;
    return count || 0;
  },

  async markRead(id) {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (error) throw error;
  },

  async markAllRead(userId) {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    if (error) throw error;
  },
};
