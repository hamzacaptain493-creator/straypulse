// External Supabase project (BYO) — StrayPulse
// This client points at the user's own Supabase project and is the ONLY
// Supabase client the app should use. Do not import from
// `@/integrations/supabase/client` — that path is tied to Lovable Cloud
// and is not used by this application.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rlxlasldsljfgdfzcyfp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJseGxhc2xkc2xqZmdkZnpjeWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNjc1MDQsImV4cCI6MjA5ODg0MzUwNH0.Z3U53_cgVavudhR8YYGPx-QmLdcmP_tUXdKFW3luuvM";

let _client: SupabaseClient | undefined;

function build(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop, recv) {
    if (!_client) _client = build();
    return Reflect.get(_client, prop, recv);
  },
});

export const SUPABASE_PROJECT_URL = SUPABASE_URL;
