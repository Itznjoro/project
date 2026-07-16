/* ============================================================
   SUPABASE CONNECTION
   Fill these in from: Supabase Dashboard → Project Settings → API
   The anon/public key is safe to expose in frontend code — it only
   works within the RLS policies defined in supabase/schema.sql.
   ============================================================ */

// Guards against this file accidentally being loaded/executed more than
// once on the same page (e.g. a stale dev-server connection, a duplicate
// <script> tag, or browser caching weirdness). Without this guard, a
// second execution would throw "Identifier 'supabase' has already been
// declared" and silently break the whole page.
if (typeof window.__JOBMATCH_SUPABASE_INIT__ === "undefined") {
  window.__JOBMATCH_SUPABASE_INIT__ = true;

  var SUPABASE_URL = "https://yxbwucuytmqwlvssqziy.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_TDjDga0o22C2aieBY0457A_HkKmJ-kZ";

  window.SUPABASE_READY = false;

  if (typeof window.supabase === "undefined" || typeof window.supabase.createClient !== "function") {
    // The CDN script (supabase-js) tag above this one didn't load — usually a
    // network/ad-blocker issue, or this file was loaded before that script.
    console.error(
      "[JobMatch] The Supabase library did not load. Check that this line is present " +
      "BEFORE <script src=\"js/supabase-client.js\"> in every HTML file:\n" +
      '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
    );
  }

  var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Detect the placeholder values so we can fail loudly and clearly instead of
  // letting every button throw a cryptic "Cannot read properties of undefined"
  // error deep inside a click handler.
  window.SUPABASE_READY = !(
    SUPABASE_URL.includes("YOUR-PROJECT-REF") || SUPABASE_ANON_KEY.includes("YOUR-ANON-PUBLIC-KEY")
  );

  if (!window.SUPABASE_READY) {
    console.warn(
      "[JobMatch] Supabase is not configured yet. Open js/supabase-client.js and " +
      "replace SUPABASE_URL and SUPABASE_ANON_KEY with the values from your " +
      "Supabase project's Settings \u2192 API page."
    );
  }
} else {
  console.warn("[JobMatch] js/supabase-client.js ran more than once — the second run was skipped safely.");
}
