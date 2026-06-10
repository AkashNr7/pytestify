import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // 1. Check if configured in import.meta.env
  const metaUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (window as any).__SUPABASE_URL;
  const metaKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (window as any).__SUPABASE_ANON_KEY;

  if (metaUrl && metaKey) {
    supabaseInstance = createClient(metaUrl, metaKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return supabaseInstance;
  }

  // 2. Fetch from Express API proxy config
  try {
    const res = await fetch("/api/supabase/config");
    if (res.ok) {
      const config = await res.json();
      if (config.supabaseUrl && config.supabaseAnonKey) {
        supabaseInstance = createClient(config.supabaseUrl, config.supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        });
        // Cache globally for browser debugging if needed
        (window as any).__SUPABASE_URL = config.supabaseUrl;
        (window as any).__SUPABASE_ANON_KEY = config.supabaseAnonKey;
        return supabaseInstance;
      }
    }
  } catch (err) {
    console.error("[Supabase Client] Failed to fetch server configurations:", err);
  }

  return null;
}
